-- =============================================================================
-- E2 — Learning schema: questions, lessons, attempts, simulados
-- =============================================================================
-- Inclui triggers de profile-level (XP, streak, vidas) acoplados a `attempts`.
-- Ligas e conquistas (cross-user) ficam pra E3 numa migration separada.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- questions — banco de questões de múltipla escolha
-- ---------------------------------------------------------------------------
create type question_status as enum ('draft', 'review', 'published', 'retired');

create table public.questions (
  id                uuid primary key default gen_random_uuid(),
  topic_id          uuid not null references public.topics(id) on delete restrict,
  difficulty        smallint not null check (difficulty between 1 and 5),
  stem              text not null,
  choices           jsonb not null,
  explanation       text not null,
  source_citation   text not null,
  status            question_status not null default 'draft',
  quality_score     real,
  generated_by      text not null default 'human',
  reviewed_by       uuid references public.profiles(id) on delete set null,
  review_result     jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint choices_is_array check (jsonb_typeof(choices) = 'array'),
  constraint choices_min_count check (jsonb_array_length(choices) >= 2)
);

create index questions_topic_status_difficulty_idx
  on public.questions(topic_id, status, difficulty);

create index questions_status_idx
  on public.questions(status)
  where status in ('draft', 'review');

create trigger set_updated_at_questions
  before update on public.questions
  for each row execute function public.set_updated_at();

comment on table public.questions is 'Banco de questões de múltipla escolha. choices: jsonb [{key,text,correct}].';
comment on column public.questions.quality_score is 'Calculado periodicamente a partir de attempts.is_correct.';

-- ---------------------------------------------------------------------------
-- lessons — sequência ordenada de questões
-- ---------------------------------------------------------------------------
create table public.lessons (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references public.topics(id) on delete restrict,
  level         smallint not null check (level between 1 and 5),
  position      int not null default 0,
  title         text not null,
  intro         text,
  outro         text,
  question_ids  uuid[] not null default '{}',
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index lessons_topic_level_idx on public.lessons(topic_id, level, position);

create trigger set_updated_at_lessons
  before update on public.lessons
  for each row execute function public.set_updated_at();

comment on table public.lessons is 'Lições bite-sized. question_ids define ordem fixa para a lição.';

-- ---------------------------------------------------------------------------
-- attempts — tentativas de resposta
-- ---------------------------------------------------------------------------
create type attempt_mode as enum ('lesson', 'simulado', 'revisao');

create table public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete restrict,
  lesson_id     uuid references public.lessons(id) on delete set null,
  simulado_id   uuid,  -- FK adicionada após criar simulados (forward ref)
  chosen_key    text not null,
  is_correct    boolean not null,
  time_ms       int,
  xp_awarded    int not null default 0,
  mode          attempt_mode not null,
  created_at    timestamptz not null default now()
);

create index attempts_user_created_idx on public.attempts(user_id, created_at desc);
create index attempts_question_idx on public.attempts(question_id);
create index attempts_lesson_idx on public.attempts(lesson_id) where lesson_id is not null;

comment on table public.attempts is 'Log imutável de tentativas. Append-only — nunca update/delete.';

-- ---------------------------------------------------------------------------
-- simulados — provas completas espelhando o formato oficial
-- ---------------------------------------------------------------------------
create table public.simulados (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  track_id      uuid not null references public.tracks(id) on delete restrict,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  score         real check (score is null or (score >= 0 and score <= 1)),
  question_ids  uuid[] not null,
  created_at    timestamptz not null default now()
);

create index simulados_user_idx on public.simulados(user_id, started_at desc);

alter table public.attempts
  add constraint attempts_simulado_fk
  foreign key (simulado_id) references public.simulados(id) on delete set null;

create index attempts_simulado_idx on public.attempts(simulado_id) where simulado_id is not null;

comment on table public.simulados is 'Provas completas. score=null enquanto não finalizada.';

-- ---------------------------------------------------------------------------
-- Trigger: ao inserir attempt, atualizar profile (XP, streak, vidas)
-- Ligas/conquistas vêm em E3.
-- ---------------------------------------------------------------------------
create or replace function public.handle_attempt_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today_brt date := (now() at time zone 'America/Sao_Paulo')::date;
  prof_last_date date;
  prof_streak int;
  prof_freezes int;
begin
  -- XP sempre soma (mesmo errando, xp_awarded=0)
  update public.profiles
     set xp_total = xp_total + new.xp_awarded
   where id = new.user_id;

  -- Vidas: perde 1 se errou em modo 'lesson'. Modo 'revisao' e 'simulado' não tiram vida.
  if not new.is_correct and new.mode = 'lesson' then
    update public.profiles
       set lives = greatest(lives - 1, 0),
           lives_regen_at = case
             when lives_regen_at is null then now() + interval '30 minutes'
             else lives_regen_at
           end
     where id = new.user_id;
  end if;

  -- Streak: lê estado atual e atualiza se for primeira atividade do dia (BRT)
  select last_active_date, streak_days, streak_freezes
    into prof_last_date, prof_streak, prof_freezes
    from public.profiles
   where id = new.user_id
     for update;

  if prof_last_date is distinct from today_brt then
    if prof_last_date is null or prof_last_date = today_brt - 1 then
      -- Continuação do streak
      update public.profiles
         set streak_days = coalesce(prof_streak, 0) + 1,
             last_active_date = today_brt
       where id = new.user_id;
    elsif prof_last_date < today_brt - 1 and coalesce(prof_freezes, 0) > 0 then
      -- Streak freeze cobre 1 dia faltante (gasto único)
      update public.profiles
         set streak_freezes = prof_freezes - 1,
             last_active_date = today_brt
       where id = new.user_id;
    else
      -- Streak quebrou
      update public.profiles
         set streak_days = 1,
             last_active_date = today_brt
       where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_attempt_insert
  after insert on public.attempts
  for each row execute function public.handle_attempt_insert();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.lessons   enable row level security;
alter table public.attempts  enable row level security;
alter table public.simulados enable row level security;

-- questions/lessons: leitura pública só do que está publicado
create policy "questions publicadas são públicas"
  on public.questions for select
  using (status = 'published');

create policy "lessons publicadas são públicas"
  on public.lessons for select
  using (published = true);

-- attempts: usuário só lê/insere os próprios. Nunca update/delete (append-only).
create policy "user lê próprios attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "user insere próprios attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

-- simulados: user-owned
create policy "user lê próprios simulados"
  on public.simulados for select
  using (auth.uid() = user_id);

create policy "user insere próprios simulados"
  on public.simulados for insert
  with check (auth.uid() = user_id);

create policy "user atualiza próprios simulados"
  on public.simulados for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
