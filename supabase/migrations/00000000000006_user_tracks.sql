-- =============================================================================
-- E1 — Multi-curso: cada usuário pode "pegar" vários tracks (cursos) e alternar
-- =============================================================================
-- Antes: profiles.primary_track_id era o único curso do usuário; trocar
-- equivalia a perder a noção de "fiz parte dos outros".
-- Agora: tabela user_tracks mantém o histórico de todos os cursos que o
-- usuário entrou. profiles.primary_track_id continua sendo "o curso ativo
-- agora" (qual aparece na home). last_active_at registra quando o curso foi
-- usado pela última vez — útil pra ordenar a lista de cursos do usuário.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_tracks — junction com timestamps; RLS por dono
-- ---------------------------------------------------------------------------
create table public.user_tracks (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  track_id       uuid not null references public.tracks(id)  on delete cascade,
  joined_at      timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index user_tracks_user_idx on public.user_tracks(user_id, last_active_at desc);

comment on table public.user_tracks is
  'Cursos que o usuário "pegou". profiles.primary_track_id aponta para o ativo no momento.';

-- ---------------------------------------------------------------------------
-- Backfill: para profiles existentes com primary_track_id, materializa o
-- registro correspondente em user_tracks.
-- ---------------------------------------------------------------------------
insert into public.user_tracks (user_id, track_id)
select id, primary_track_id
  from public.profiles
 where primary_track_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.user_tracks enable row level security;

create policy "user_tracks: user lê os próprios"
  on public.user_tracks for select
  using (auth.uid() = user_id);

create policy "user_tracks: user insere para si"
  on public.user_tracks for insert
  with check (auth.uid() = user_id);

create policy "user_tracks: user atualiza os próprios"
  on public.user_tracks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_tracks: user remove os próprios"
  on public.user_tracks for delete
  using (auth.uid() = user_id);
