-- =============================================================================
-- Achievements — detecção e desbloqueio sob demanda
-- =============================================================================
-- Antes: tabela `user_achievements` existia mas nada inseria nela. Agora:
--   - Catálogo expandido pra 8 codes (seed idempotente)
--   - RPC claim_new_achievements() é chamado pelo client (home, /app/liga,
--     fim de lição). Verifica condições de unlock e insere o que faltar.
--     Retorna SÓ os recém-desbloqueados — client toca playAchievement +
--     mostra toast pra cada.
--
-- Idempotente: se chamado 2× seguidos, segunda chamada retorna 0 rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Expandir catálogo (idempotente)
-- ---------------------------------------------------------------------------
insert into public.achievements (code, name, description, icon) values
  ('streak_100',     'Centenário',     'Streak de 100 dias',                  'flame'),
  ('100_questions',  'Centena',        '100 questões respondidas',            'check-circle'),
  ('1000_questions', 'Milhar',         '1000 questões respondidas',           'trophy'),
  ('top_3_league',   'Pódio',          'Top 3 em uma liga semanal',           'medal'),
  ('lendas',         'Liga das Lendas','Chegou à Liga das Lendas',            'crown')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

-- ---------------------------------------------------------------------------
-- claim_new_achievements() — detecta e insere os elegíveis
-- ---------------------------------------------------------------------------
-- Para cada code conhecido, calcula a condição de unlock contra o estado
-- atual do user. Insere em user_achievements com ON CONFLICT DO NOTHING.
-- Retorna a coleção de codes recém-inseridos (excluindo os que já existiam).
--
-- Chamado pelo client autenticado — usa auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.claim_new_achievements()
returns table (
  code        text,
  name        text,
  description text,
  icon        text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak int;
  v_tier league_tier;
  v_questions_answered int;
  v_attempts_count int;
  v_top3_count int;
begin
  if v_user_id is null then return; end if;

  -- Snapshot do estado do user
  select streak_days, current_league_tier
    into v_streak, v_tier
    from public.profiles
   where id = v_user_id;

  -- Total de questões respondidas (distintas) e de attempts (qualquer)
  select count(distinct question_id), count(*)
    into v_questions_answered, v_attempts_count
    from public.attempts
   where user_id = v_user_id;

  -- Quantas vezes ficou em top 3 numa liga fechada
  select count(*) into v_top3_count
    from public.league_members lm
    join public.leagues l on l.id = lm.league_id
   where lm.user_id = v_user_id
     and lm.rank is not null
     and lm.rank <= 3
     and l.closed_at is not null;

  -- Insere só os que estão elegíveis e que ainda não foram desbloqueados.
  -- A unicidade vem da PK (user_id, achievement_id), garantida via ON
  -- CONFLICT DO NOTHING. RETURNING devolve só rows recém-inseridos.
  return query
  with eligible as (
    select a.id, a.code
      from public.achievements a
     where (a.code = 'first_lesson'    and v_attempts_count > 0)
        or (a.code = 'streak_7'        and coalesce(v_streak, 0) >= 7)
        or (a.code = 'streak_30'       and coalesce(v_streak, 0) >= 30)
        or (a.code = 'streak_100'      and coalesce(v_streak, 0) >= 100)
        or (a.code = '100_questions'   and coalesce(v_questions_answered, 0) >= 100)
        or (a.code = '1000_questions'  and coalesce(v_questions_answered, 0) >= 1000)
        or (a.code = 'top_3_league'    and coalesce(v_top3_count, 0) >= 1)
        or (a.code = 'lendas'          and v_tier = 'lendas')
  ),
  inserted as (
    insert into public.user_achievements (user_id, achievement_id)
    select v_user_id, e.id from eligible e
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id
  )
  select a.code, a.name, a.description, a.icon
    from public.achievements a
    join inserted i on i.achievement_id = a.id;
end;
$$;

comment on function public.claim_new_achievements is
  'Detecta e desbloqueia achievements elegíveis pro user atual. Retorna só os recém-desbloqueados. Idempotente.';

revoke execute on function public.claim_new_achievements() from public, anon;
grant  execute on function public.claim_new_achievements() to authenticated, service_role;
