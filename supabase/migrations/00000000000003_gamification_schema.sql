-- =============================================================================
-- E3 — Gamification: leagues, league_members, achievements, user_achievements
-- =============================================================================
-- Implementa as ligas semanais e conquistas. O cron de fechamento (rotação de
-- promoção/rebaixamento) é uma função SQL chamada por cron externo (Vercel/GH
-- Actions) — esquema preparado, agendamento separado.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- league_tier — 10 tiers como em Duolingo, ordenados do mais baixo ao mais alto
-- ---------------------------------------------------------------------------
create type league_tier as enum (
  'bronze', 'prata', 'ouro', 'safira', 'rubi',
  'esmeralda', 'ametista', 'perola', 'diamante', 'lendas'
);

-- ---------------------------------------------------------------------------
-- leagues — uma "instância" de liga por (tier, semana). Pode ter várias ligas
-- por tier-semana se houver mais de 30 usuários no mesmo nível.
-- ---------------------------------------------------------------------------
create table public.leagues (
  id            uuid primary key default gen_random_uuid(),
  tier          league_tier not null,
  week_start    date not null,           -- segunda-feira (BRT) da semana
  member_count  int not null default 0 check (member_count >= 0),
  closed_at     timestamptz,             -- preenchido pelo weekly_league_close()
  created_at    timestamptz not null default now()
);

create index leagues_tier_week_idx on public.leagues(tier, week_start);
create index leagues_open_idx on public.leagues(week_start) where closed_at is null;

comment on table public.leagues is 'Instância semanal de liga por tier. Pode haver N por (tier,week) com até 30 membros cada.';

-- ---------------------------------------------------------------------------
-- league_members — junction com weekly_xp e rank
-- ---------------------------------------------------------------------------
create table public.league_members (
  league_id   uuid not null references public.leagues(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  weekly_xp   int  not null default 0 check (weekly_xp >= 0),
  rank        int,
  joined_at   timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index league_members_user_idx on public.league_members(user_id);
create index league_members_league_xp_idx on public.league_members(league_id, weekly_xp desc);

comment on table public.league_members is 'Pertencimento de um usuário a uma instância de liga. weekly_xp zera quando a liga fecha.';

-- ---------------------------------------------------------------------------
-- achievements — catálogo de conquistas (seed em supabase/seed.sql)
-- ---------------------------------------------------------------------------
create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  description  text not null,
  icon         text not null,            -- nome de ícone Lucide
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_achievements — desbloqueios
-- ---------------------------------------------------------------------------
create table public.user_achievements (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  achievement_id  uuid not null references public.achievements(id) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index user_achievements_user_idx on public.user_achievements(user_id, unlocked_at desc);

-- ---------------------------------------------------------------------------
-- current_week_start_brt() — segunda-feira da semana corrente em America/Sao_Paulo
-- ---------------------------------------------------------------------------
create or replace function public.current_week_start_brt()
returns date
language sql
stable
set search_path = public
as $$
  -- date_trunc('week') retorna segunda-feira por default (ISO 8601)
  select (date_trunc('week', now() at time zone 'America/Sao_Paulo'))::date;
$$;

-- ---------------------------------------------------------------------------
-- ensure_league_membership(user_id) — idempotente; matchmaking simples para MVP
-- ---------------------------------------------------------------------------
-- Regra MVP: se o user não tem membership na semana atual, alocar em uma liga
-- aberta do tier "bronze" com < 30 membros, ou criar uma nova.
-- TODO: usar tier do user (último tier alcançado) quando weekly_league_close
-- estiver implementado de fato.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_league_membership(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week date := public.current_week_start_brt();
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

  -- Procura liga aberta de bronze com vaga
  select id
    into v_league_id
    from public.leagues
   where tier = 'bronze' and week_start = v_week and member_count < 30 and closed_at is null
   order by member_count desc
   limit 1
   for update skip locked;

  if v_league_id is null then
    insert into public.leagues (tier, week_start)
    values ('bronze', v_week)
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
-- weekly_league_close() — TODO esqueleto; cron externo chama
-- ---------------------------------------------------------------------------
-- Lógica completa (top 10 sobem, bottom 5 descem, meio mantêm) virá quando
-- houver tracking do tier do usuário em profiles. Por enquanto só fecha.
-- ---------------------------------------------------------------------------
create or replace function public.weekly_league_close()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Calcula ranks e marca como fechada
  with ranked as (
    select league_id, user_id,
           rank() over (partition by league_id order by weekly_xp desc) as r
      from public.league_members lm
      join public.leagues l on l.id = lm.league_id
     where l.closed_at is null
       and l.week_start < public.current_week_start_brt()
  )
  update public.league_members lm
     set rank = r.r
    from ranked r
   where lm.league_id = r.league_id and lm.user_id = r.user_id;

  update public.leagues
     set closed_at = now()
   where closed_at is null and week_start < public.current_week_start_brt();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atualizar handle_attempt_insert para também bumpar league_members.weekly_xp
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
begin
  -- XP no profile (sempre soma, mesmo errado xp_awarded=0)
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
    -- Se 0 rows, user não está em liga essa semana — sem problema, será
    -- alocado lazily via ensure_league_membership() ao abrir /app/liga.
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.leagues           enable row level security;
alter table public.league_members    enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

create policy "leagues são públicas"
  on public.leagues for select
  using (true);

create policy "league_members são públicos"
  on public.league_members for select
  using (true);

create policy "achievements são públicas"
  on public.achievements for select
  using (true);

create policy "user_achievements: user vê os próprios"
  on public.user_achievements for select
  using (auth.uid() = user_id);

-- (writes em league_members vêm via ensure_league_membership/trigger; sem policy de insert)

-- ---------------------------------------------------------------------------
-- Realtime — habilitar streaming de league_members para leaderboard ao vivo
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.league_members;
