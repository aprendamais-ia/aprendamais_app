-- =============================================================================
-- E3 — Ligas: divisões dentro de cada tier (Bronze I/II/III estilo Clash Royale)
-- =============================================================================
-- Antes: tier era um balde único (todo mundo de Bronze junto). Top 10 subia
-- direto pra Prata. Sentimento de progresso semanal era binário.
--
-- Agora: cada tier tem 3 divisões (I/II/III). Top 10 sobe 1 divisão por semana.
-- Quando passa da divisão III, vira a divisão I do próximo tier (animação WOW).
-- Bottom 5 desce 1 divisão. Bronze I é o chão; Lendas III é o topo.
--
-- Matchmaking não muda: divisão é só marcador de progresso. Todo mundo do
-- mesmo tier (independente da divisão) compete junto na liga semanal.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles.current_league_division — 1..3 dentro do tier corrente
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists current_league_division smallint not null default 1
    check (current_league_division between 1 and 3);

comment on column public.profiles.current_league_division is
  'Divisão corrente dentro do tier (1=I, 2=II, 3=III). Atualizada por weekly_league_close().';

-- ---------------------------------------------------------------------------
-- promote_one_step / demote_one_step — sobem/descem 1 divisão por vez
-- ---------------------------------------------------------------------------
-- Retornam (tier, division) compostos. Lendas III não sobe; Bronze I não desce.
-- ---------------------------------------------------------------------------
create or replace function public.promote_one_step(
  p_tier league_tier,
  p_division smallint
)
returns table (new_tier league_tier, new_division smallint)
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_tier = 'lendas' and p_division >= 3 then
    -- topo absoluto, fica
    new_tier := 'lendas';
    new_division := 3;
  elsif p_division >= 3 then
    -- estoura pro próximo tier, divisão I
    new_tier := public.next_tier(p_tier);
    new_division := 1;
  else
    -- sobe 1 divisão dentro do mesmo tier
    new_tier := p_tier;
    new_division := p_division + 1;
  end if;
  return next;
end;
$$;

create or replace function public.demote_one_step(
  p_tier league_tier,
  p_division smallint
)
returns table (new_tier league_tier, new_division smallint)
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_tier = 'bronze' and p_division <= 1 then
    -- chão absoluto, fica
    new_tier := 'bronze';
    new_division := 1;
  elsif p_division <= 1 then
    -- cai pro tier anterior, divisão III
    new_tier := public.prev_tier(p_tier);
    new_division := 3;
  else
    -- desce 1 divisão dentro do mesmo tier
    new_tier := p_tier;
    new_division := p_division - 1;
  end if;
  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- weekly_league_close() — reescrita pra usar promote/demote_one_step
-- ---------------------------------------------------------------------------
-- Mesmas regras de matchmaking (top 10 sobe, bottom 5 desce, meio mantém)
-- mas agora aplicadas a (tier, division) em vez de só tier.
-- ---------------------------------------------------------------------------
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
  -- 1. Calcular ranks por liga
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

  -- 2. Promoções: top 10 sobem 1 step (não promove inativos)
  with to_promote as (
    select lm.user_id,
           p.current_league_tier as old_tier,
           p.current_league_division as old_div
      from public.league_members lm
      join public.leagues l  on l.id = lm.league_id
      join public.profiles p on p.id = lm.user_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
       and lm.rank is not null
       and lm.rank <= 10
       and lm.weekly_xp > 0
       and not (p.current_league_tier = 'lendas' and p.current_league_division = 3)
  ),
  promoted as (
    select tp.user_id, step.new_tier, step.new_division
      from to_promote tp,
           lateral public.promote_one_step(tp.old_tier, tp.old_div) step
  )
  update public.profiles p
     set current_league_tier = promoted.new_tier,
         current_league_division = promoted.new_division
    from promoted
   where p.id = promoted.user_id;
  get diagnostics v_promoted = row_count;

  -- 3. Rebaixamentos: bottom 5 caem 1 step (só em ligas com >= 11 membros)
  with to_demote as (
    select lm.user_id,
           p.current_league_tier as old_tier,
           p.current_league_division as old_div
      from public.league_members lm
      join public.leagues l  on l.id = lm.league_id
      join public.profiles p on p.id = lm.user_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
       and lm.rank is not null
       and l.member_count >= 11
       and lm.rank > l.member_count - 5
       and not (p.current_league_tier = 'bronze' and p.current_league_division = 1)
  ),
  demoted as (
    select td.user_id, step.new_tier, step.new_division
      from to_demote td,
           lateral public.demote_one_step(td.old_tier, td.old_div) step
  )
  update public.profiles p
     set current_league_tier = demoted.new_tier,
         current_league_division = demoted.new_division
    from demoted
   where p.id = demoted.user_id;
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
  'Fecha ligas da semana anterior. Top 10 sobem 1 divisão (estouro de tier vira divisão I do próximo). Bottom 5 descem 1 divisão. Idempotente.';

revoke execute on function public.weekly_league_close() from public, anon, authenticated;
grant  execute on function public.weekly_league_close() to service_role;
