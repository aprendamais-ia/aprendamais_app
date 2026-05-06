-- =============================================================================
-- Aprenda Mais — Schema inicial
-- =============================================================================
-- Tabelas de fundação: tracks, topics, profiles + RLS básica.
-- As tabelas de gamificação (leagues, achievements) e conteúdo (questions,
-- lessons, attempts) virão em migrations seguintes, ownadas por E2/E3.
-- =============================================================================

-- Usamos gen_random_uuid() (built-in no Postgres 13+); não precisa de extensão.

-- ---------------------------------------------------------------------------
-- tracks — trilhas de estudo (CPA, OAB, etc.)
-- ---------------------------------------------------------------------------
create table public.tracks (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  issuer      text not null,
  exam_format jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tracks is 'Trilhas de estudo (CPA, OAB, novas certificações ANBIMA, etc.)';

-- ---------------------------------------------------------------------------
-- topics — tópicos da ementa (hierárquico via parent_id)
-- ---------------------------------------------------------------------------
create table public.topics (
  id                  uuid primary key default gen_random_uuid(),
  track_id            uuid not null references public.tracks(id) on delete cascade,
  parent_id           uuid references public.topics(id) on delete cascade,
  slug                text not null,
  name                text not null,
  weight              real not null default 0 check (weight >= 0 and weight <= 1),
  position            int  not null default 0,
  keywords            text[] not null default '{}',
  official_reference  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (track_id, slug)
);

create index topics_track_id_idx on public.topics(track_id);
create index topics_parent_id_idx on public.topics(parent_id);

comment on table public.topics is 'Itens hierárquicos da ementa oficial. parent_id=null para módulo raiz.';

-- ---------------------------------------------------------------------------
-- profiles — estende auth.users com dados do produto
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  avatar_url         text,
  primary_track_id   uuid references public.tracks(id) on delete set null,
  skill_level        jsonb not null default '{}'::jsonb,
  xp_total           int   not null default 0 check (xp_total >= 0),
  lives              int   not null default 5 check (lives >= 0 and lives <= 5),
  lives_regen_at     timestamptz,
  streak_days        int   not null default 0 check (streak_days >= 0),
  streak_freezes     int   not null default 1 check (streak_freezes >= 0),
  last_active_date   date,
  premium_until      timestamptz,
  target_exam_date   date,
  onboarded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index profiles_primary_track_id_idx on public.profiles(primary_track_id);

comment on table public.profiles is 'Dados do produto por usuário; 1:1 com auth.users.';
comment on column public.profiles.skill_level is 'jsonb { topic_slug: 0..1 } — média móvel de acertos por tópico.';

-- ---------------------------------------------------------------------------
-- handle_new_user() — cria profile automaticamente quando user nasce em auth
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at trigger genérico
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_tracks   before update on public.tracks   for each row execute function public.set_updated_at();
create trigger set_updated_at_topics   before update on public.topics   for each row execute function public.set_updated_at();
create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.tracks   enable row level security;
alter table public.topics   enable row level security;
alter table public.profiles enable row level security;

-- tracks/topics: leitura pública (catálogo é público); só service_role escreve
create policy "tracks são públicas para leitura"
  on public.tracks for select
  using (active = true);

create policy "topics são públicos para leitura"
  on public.topics for select
  using (true);

-- profiles: usuário só vê/edita o próprio perfil
create policy "user lê próprio profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "user atualiza próprio profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- (insert é feito pela trigger handle_new_user com security definer; sem policy de insert)
