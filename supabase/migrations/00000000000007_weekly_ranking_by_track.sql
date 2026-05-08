-- =============================================================================
-- E3 — Ranking semanal por curso (track)
-- =============================================================================
-- Pedido de produto: a UI da /app/liga deve mostrar TODOS os usuários do mesmo
-- curso rankeados — sem fragmentar em tiers/30 por liga.
--
-- A função abaixo agrega attempts.xp_awarded da semana corrente (BRT),
-- filtrando apenas attempts cujas questions estão em topics do track passado.
-- Retorna user_id, display_name, weekly_xp e rank, ordenados por XP desc.
--
-- Continuamos mantendo a estrutura de leagues/tiers no banco (migration 3 e 5)
-- como mecânica de progressão futura, mas ela deixa de ser fonte de dados da
-- view principal. ensure_league_membership / weekly_league_close podem rodar
-- em paralelo e não interferem.
-- =============================================================================

create or replace function public.weekly_ranking_by_track(p_track_id uuid)
returns table (
  user_id      uuid,
  display_name text,
  weekly_xp    bigint,
  rank         int
)
language sql
stable
security definer
set search_path = public
as $$
  with week_start_ts as (
    -- Início da semana corrente em UTC (segunda 00:00 BRT)
    select (public.current_week_start_brt()::timestamp
              at time zone 'America/Sao_Paulo') as ts
  ),
  raw as (
    select
      a.user_id,
      coalesce(p.display_name, 'Aluno') as display_name,
      sum(a.xp_awarded)::bigint as weekly_xp
    from public.attempts  a
    join public.questions q  on q.id = a.question_id
    join public.topics    t  on t.id = q.topic_id
    join public.profiles  p  on p.id = a.user_id
    cross join week_start_ts ws
    where t.track_id = p_track_id
      and a.created_at >= ws.ts
      and a.xp_awarded > 0
    group by a.user_id, p.display_name
  )
  select
    user_id,
    display_name,
    weekly_xp,
    rank() over (order by weekly_xp desc)::int as rank
  from raw
  order by weekly_xp desc, user_id
  limit 100;
$$;

comment on function public.weekly_ranking_by_track is
  'Ranking semanal de XP por curso. Agrega attempts.xp_awarded da semana corrente em America/Sao_Paulo, filtrando por track_id via topics. Top 100.';

revoke execute on function public.weekly_ranking_by_track(uuid) from public, anon;
grant  execute on function public.weekly_ranking_by_track(uuid) to authenticated;
