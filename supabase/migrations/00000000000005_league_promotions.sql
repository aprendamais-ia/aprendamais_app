-- =============================================================================
-- E3 — Ligas: tier do usuário + promoção/rebaixamento real
-- =============================================================================
-- Antes: ensure_league_membership sempre alocava em bronze; weekly_league_close
-- só fechava a liga sem mover ninguém. Agora:
--   - profiles.current_league_tier mantém o tier corrente do usuário
--   - weekly_league_close promove top 10, rebaixa bottom 5, mantém meio
--   - ensure_league_membership respeita o tier atual
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles.current_league_tier — tier persistente do usuário
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists current_league_tier league_tier not null default 'bronze';

comment on column public.profiles.current_league_tier is
  'Tier corrente do usuário; atualizado pelo weekly_league_close().';

-- ---------------------------------------------------------------------------
-- next_tier / prev_tier — helpers que subem/descem 1 nível na enum
-- ---------------------------------------------------------------------------
create or replace function public.next_tier(t league_tier)
returns league_tier
language sql
immutable
set search_path = public
as $$
  select case t
    when 'bronze'    then 'prata'::league_tier
    when 'prata'     then 'ouro'::league_tier
    when 'ouro'      then 'safira'::league_tier
    when 'safira'    then 'rubi'::league_tier
    when 'rubi'      then 'esmeralda'::league_tier
    when 'esmeralda' then 'ametista'::league_tier
    when 'ametista'  then 'perola'::league_tier
    when 'perola'    then 'diamante'::league_tier
    when 'diamante'  then 'lendas'::league_tier
    when 'lendas'    then 'lendas'::league_tier  -- topo, fica
  end;
$$;

create or replace function public.prev_tier(t league_tier)
returns league_tier
language sql
immutable
set search_path = public
as $$
  select case t
    when 'bronze'    then 'bronze'::league_tier   -- chão, fica
    when 'prata'     then 'bronze'::league_tier
    when 'ouro'      then 'prata'::league_tier
    when 'safira'    then 'ouro'::league_tier
    when 'rubi'      then 'safira'::league_tier
    when 'esmeralda' then 'rubi'::league_tier
    when 'ametista'  then 'esmeralda'::league_tier
    when 'perola'    then 'ametista'::league_tier
    when 'diamante'  then 'perola'::league_tier
    when 'lendas'    then 'diamante'::league_tier
  end;
$$;

-- ---------------------------------------------------------------------------
-- ensure_league_membership(user_id) — agora respeita o tier do user
-- ---------------------------------------------------------------------------
-- Aloca user em uma liga aberta do current_league_tier dele com vaga (<30).
-- Se user já tinha membership na semana, retorna a existente. Se a liga do
-- tier estourou 30, abre nova instância paralela do mesmo (tier, week).
-- ---------------------------------------------------------------------------
create or replace function public.ensure_league_membership(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week date := public.current_week_start_brt();
  v_tier league_tier;
  v_league_id uuid;
begin
  -- Já tem membership na semana?
  select lm.league_id
    into v_league_id
    from public.league_members lm
    join public.leagues l on l.id = lm.league_id
   where lm.user_id = p_user_id and l.week_start = v_week
   limit 1;
  if v_league_id is not null then
    return v_league_id;
  end if;

  -- Tier corrente do user (default bronze pra perfis legados)
  select coalesce(current_league_tier, 'bronze'::league_tier)
    into v_tier
    from public.profiles
   where id = p_user_id;

  if v_tier is null then
    v_tier := 'bronze';
  end if;

  -- Procura liga aberta do tier com vaga
  select id
    into v_league_id
    from public.leagues
   where tier = v_tier
     and week_start = v_week
     and member_count < 30
     and closed_at is null
   order by member_count desc
   limit 1
   for update skip locked;

  if v_league_id is null then
    insert into public.leagues (tier, week_start)
    values (v_tier, v_week)
    returning id into v_league_id;
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league_id, p_user_id)
  on conflict (league_id, user_id) do nothing;

  update public.leagues
     set member_count = (
       select count(*) from public.league_members where league_id = v_league_id
     )
   where id = v_league_id;

  return v_league_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- weekly_league_close() — promove top 10, rebaixa bottom 5, mantém o meio
-- ---------------------------------------------------------------------------
-- Roda toda segunda 00:00 BRT (cron externo). Para cada liga aberta com
-- week_start < semana atual:
--   1. Calcula rank por weekly_xp desc
--   2. Atualiza profiles.current_league_tier:
--        rank <= 10            → next_tier (Lendas fica)
--        rank > member_count-5 → prev_tier (Bronze fica)
--        else                  → mantém
--   3. Marca closed_at
-- Retorna { leagues_closed, users_promoted, users_demoted }.
-- ---------------------------------------------------------------------------
-- A migration 3 criou a versão antiga retornando int. Como o Postgres não
-- permite trocar o tipo de retorno via CREATE OR REPLACE, precisamos dropar
-- a função primeiro.
drop function if exists public.weekly_league_close();

create or replace function public.weekly_league_close()
returns table (
  leagues_closed   int,
  users_promoted   int,
  users_demoted    int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promoted int := 0;
  v_demoted  int := 0;
  v_closed   int := 0;
begin
  -- 1. Calcular ranks por liga (incluindo ligas com qualquer membership)
  with ranked as (
    select lm.league_id,
           lm.user_id,
           rank() over (
             partition by lm.league_id
             order by lm.weekly_xp desc, lm.joined_at asc
           ) as r,
           count(*) over (partition by lm.league_id) as members
      from public.league_members lm
      join public.leagues l on l.id = lm.league_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
  )
  update public.league_members lm
     set rank = ranked.r
    from ranked
   where lm.league_id = ranked.league_id
     and lm.user_id = ranked.user_id;

  -- 2. Promoções: top 10 sobem, exceto quem tá em Lendas (next_tier preserva)
  with to_promote as (
    select lm.user_id, p.current_league_tier as old_tier
      from public.league_members lm
      join public.leagues l  on l.id = lm.league_id
      join public.profiles p on p.id = lm.user_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
       and lm.rank is not null
       and lm.rank <= 10
       and p.current_league_tier <> 'lendas'  -- Lendas não sobe
       and lm.weekly_xp > 0                    -- não promove inativos
  )
  update public.profiles p
     set current_league_tier = public.next_tier(p.current_league_tier)
    from to_promote
   where p.id = to_promote.user_id;
  get diagnostics v_promoted = row_count;

  -- 3. Rebaixamentos: bottom 5 caem, exceto Bronze (prev_tier preserva)
  --    e exceto ligas com poucos membros (não rebaixa em liga de <11)
  with to_demote as (
    select lm.user_id
      from public.league_members lm
      join public.leagues l  on l.id = lm.league_id
      join public.profiles p on p.id = lm.user_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
       and lm.rank is not null
       and l.member_count >= 11
       and lm.rank > l.member_count - 5
       and p.current_league_tier <> 'bronze'
  )
  update public.profiles p
     set current_league_tier = public.prev_tier(p.current_league_tier)
    from to_demote
   where p.id = to_demote.user_id;
  get diagnostics v_demoted = row_count;

  -- 4. Fechar as ligas
  update public.leagues
     set closed_at = now()
   where closed_at is null
     and week_start < public.current_week_start_brt();
  get diagnostics v_closed = row_count;

  leagues_closed := v_closed;
  users_promoted := v_promoted;
  users_demoted  := v_demoted;
  return next;
end;
$$;

comment on function public.weekly_league_close is
  'Fecha ligas da semana anterior, promove top 10 e rebaixa bottom 5. Idempotente — ligas já fechadas (closed_at not null) são ignoradas. Cron externo agenda toda segunda 00:00 BRT.';

-- ---------------------------------------------------------------------------
-- Permissions: weekly_league_close só roda via service_role
-- ---------------------------------------------------------------------------
revoke execute on function public.weekly_league_close() from public, anon, authenticated;
grant execute on function public.weekly_league_close() to service_role;
