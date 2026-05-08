-- =============================================================================
-- North star — probabilidade de aprovação por usuário
-- =============================================================================
-- Implementa o north star da GAMIFICATION.md: P(aprovação) é a média ponderada
-- (pelos pesos da ementa) do "skill efetivo" do usuário em cada tópico, onde
-- skill efetivo = skill * confidence + 0.5 * (1 - confidence). Confidence cresce
-- linearmente com o número de questões respondidas no tópico, capando em 1.0
-- após 30 questões.
--
-- Skill é uma EWMA por tópico, atualizada toda vez que o user responde uma
-- questão (alpha=0.15 ~> 1 questão recente vale ~15% do skill atual).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- handle_attempt_insert — agora também atualiza profiles.skill_level (EWMA)
-- ---------------------------------------------------------------------------
-- Mantém toda lógica anterior (XP, vidas, streak, weekly_xp da liga). Adiciona
-- update do skill_level[topic_slug] usando EWMA com alpha=0.15. Default 0.5
-- quando não há valor prévio. O lookup do topic_slug vem da questão.
-- ---------------------------------------------------------------------------
create or replace function public.handle_attempt_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today_brt date := (now() at time zone 'America/Sao_Paulo')::date;
  week_start_brt date := public.current_week_start_brt();
  prof_last_date date;
  prof_streak int;
  prof_freezes int;
  v_topic_slug text;
  v_old_skill real;
  v_new_skill real;
  v_alpha constant real := 0.15;
begin
  -- XP no profile (sempre soma, mesmo errando xp_awarded=0)
  update public.profiles
     set xp_total = xp_total + new.xp_awarded
   where id = new.user_id;

  -- Vidas: perde 1 só em modo lesson errado
  if not new.is_correct and new.mode = 'lesson' then
    update public.profiles
       set lives = greatest(lives - 1, 0),
           lives_regen_at = case
             when lives_regen_at is null then now() + interval '30 minutes'
             else lives_regen_at
           end
     where id = new.user_id;
  end if;

  -- Streak diário (timezone BRT)
  select last_active_date, streak_days, streak_freezes
    into prof_last_date, prof_streak, prof_freezes
    from public.profiles
   where id = new.user_id
     for update;

  if prof_last_date is distinct from today_brt then
    if prof_last_date is null or prof_last_date = today_brt - 1 then
      update public.profiles
         set streak_days = coalesce(prof_streak, 0) + 1,
             last_active_date = today_brt
       where id = new.user_id;
    elsif prof_last_date < today_brt - 1 and coalesce(prof_freezes, 0) > 0 then
      update public.profiles
         set streak_freezes = prof_freezes - 1,
             last_active_date = today_brt
       where id = new.user_id;
    else
      update public.profiles
         set streak_days = 1,
             last_active_date = today_brt
       where id = new.user_id;
    end if;
  end if;

  -- weekly_xp na liga (se user tem membership na semana atual)
  if new.xp_awarded > 0 then
    update public.league_members lm
       set weekly_xp = weekly_xp + new.xp_awarded
      from public.leagues l
     where lm.league_id = l.id
       and lm.user_id = new.user_id
       and l.week_start = week_start_brt;
  end if;

  -- ----- skill_level EWMA por tópico --------------------------------------
  -- Lookup do topic_slug a partir da question. Se a question não existir mais
  -- (delete é restricted, mas defensivo), pula a atualização.
  select t.slug
    into v_topic_slug
    from public.questions q
    join public.topics t on t.id = q.topic_id
   where q.id = new.question_id
   limit 1;

  if v_topic_slug is not null then
    -- valor anterior, default 0.5 (neutro)
    select coalesce((skill_level ->> v_topic_slug)::real, 0.5)
      into v_old_skill
      from public.profiles
     where id = new.user_id;

    -- EWMA: aproxima 1.0 com acertos consecutivos, 0.0 com erros consecutivos
    v_new_skill := v_alpha * (case when new.is_correct then 1.0 else 0.0 end)
                 + (1 - v_alpha) * coalesce(v_old_skill, 0.5);

    update public.profiles
       set skill_level = jsonb_set(
             coalesce(skill_level, '{}'::jsonb),
             array[v_topic_slug],
             to_jsonb(v_new_skill::numeric(5,4)),
             true
           )
     where id = new.user_id;
  end if;

  return new;
end;
$$;

comment on function public.handle_attempt_insert is
  'Trigger central: XP, vidas, streak, weekly_xp da liga, e EWMA do skill_level por tópico.';

-- ---------------------------------------------------------------------------
-- calc_approval_probability(p_user_id, p_track_id) — north star
-- ---------------------------------------------------------------------------
-- Retorna probabilidade [0..1] e o "próximo objetivo" (tópico que dá maior
-- uplift se masterizado). Usa skill_level do profile (default 0.5) e confidence
-- baseado em count de attempts distintos por tópico (cap em 30 attempts → 1.0).
--
-- effective_skill = skill * confidence + 0.5 * (1 - confidence)
--   ↪ pondera entre o skill medido e a média neutra; quando confidence é
--     baixa, predomina o 0.5 (não inflar nem deprimir cedo demais).
--
-- probability = sum(weight * effective_skill) / sum(weight)
-- top_topic = argmax(weight * (1 - effective_skill)) entre tópicos com weight>0
-- top_topic_uplift = quanto a probabilidade subiria se top_topic fosse 1.0
-- ---------------------------------------------------------------------------
create or replace function public.calc_approval_probability(
  p_user_id  uuid,
  p_track_id uuid
)
returns table (
  probability        real,
  top_topic_slug     text,
  top_topic_name     text,
  top_topic_uplift   real
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_skill_jsonb jsonb;
  v_total_weight real;
  v_top_uplift real;
begin
  select coalesce(skill_level, '{}'::jsonb)
    into v_skill_jsonb
    from public.profiles
   where id = p_user_id;

  if v_skill_jsonb is null then v_skill_jsonb := '{}'::jsonb; end if;

  -- Tabela temporária por tópico com effective_skill
  with topic_stats as (
    select t.id,
           t.slug,
           t.name,
           t.weight,
           coalesce((v_skill_jsonb ->> t.slug)::real, 0.5) as skill,
           least(1.0, (
             select count(distinct a.question_id)::real
               from public.attempts a
               join public.questions q on q.id = a.question_id
              where a.user_id = p_user_id
                and q.topic_id = t.id
           ) / 30.0)::real as confidence
      from public.topics t
     where t.track_id = p_track_id
       and t.weight > 0
  ),
  scored as (
    select id, slug, name, weight,
           skill * confidence + 0.5 * (1 - confidence) as effective_skill
      from topic_stats
  ),
  agg as (
    select sum(weight * effective_skill) as numerator,
           sum(weight) as denominator
      from scored
  )
  select case when denominator > 0 then (numerator / denominator)::real else 0.5::real end
    into probability
    from agg;

  select sum(weight) into v_total_weight from public.topics where track_id = p_track_id and weight > 0;
  if coalesce(v_total_weight, 0) = 0 then
    -- track sem ementa pesada: devolve 0.5 e nada
    probability := 0.5;
    top_topic_slug := null;
    top_topic_name := null;
    top_topic_uplift := 0;
    return next;
    return;
  end if;

  -- top topic = maior weight * (1 - effective_skill) → mais espaço pra crescer
  with topic_stats as (
    select t.id, t.slug, t.name, t.weight,
           coalesce((v_skill_jsonb ->> t.slug)::real, 0.5) as skill,
           least(1.0, (
             select count(distinct a.question_id)::real
               from public.attempts a
               join public.questions q on q.id = a.question_id
              where a.user_id = p_user_id
                and q.topic_id = t.id
           ) / 30.0)::real as confidence
      from public.topics t
     where t.track_id = p_track_id
       and t.weight > 0
  ),
  scored as (
    select slug, name, weight,
           skill * confidence + 0.5 * (1 - confidence) as effective_skill
      from topic_stats
  )
  select s.slug, s.name, (s.weight * (1 - s.effective_skill) / v_total_weight)::real
    into top_topic_slug, top_topic_name, top_topic_uplift
    from scored s
   order by s.weight * (1 - s.effective_skill) desc
   limit 1;

  return next;
end;
$$;

comment on function public.calc_approval_probability is
  'North star: probabilidade de aprovação por usuário/track + tópico com maior uplift potencial.';

-- ---------------------------------------------------------------------------
-- Permissions: chamada pelo client autenticado (user lê os próprios)
-- ---------------------------------------------------------------------------
revoke execute on function public.calc_approval_probability(uuid, uuid)
  from public, anon;
grant  execute on function public.calc_approval_probability(uuid, uuid)
  to authenticated, service_role;
