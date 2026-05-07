-- =============================================================================
-- Delete user account — wipe completo, LGPD art. 18, V (direito ao esquecimento).
-- =============================================================================
--
-- Apaga TODOS os dados de um usuário a partir do auth.users(id) ou do email.
-- A cascata cobre:
--   auth.users (incl. sessions, refresh_tokens, identities — gerenciados pela Supabase)
--     └→ public.profiles
--           ├→ public.attempts          (CASCADE)
--           ├→ public.simulados         (CASCADE)
--           ├→ public.league_members    (CASCADE)
--           └→ public.user_achievements (CASCADE)
--
-- Efeito colateral controlado:
--   public.questions.reviewed_by → SET NULL (questão fica, anonimiza o revisor).
--
-- Pré-requisitos:
--   - Rodar como SUPER USER ou role com privilégio de DELETE em auth.users
--     (no Supabase Studio: SQL Editor logado com service_role).
--   - NÃO rodar com a anon key — RLS impede.
--
-- Como usar:
--   Opção 1 — Por email (mais comum, exemplo abaixo)
--   Opção 2 — Por user_id (uuid) se já tiver
-- =============================================================================

-- =====================================================================
-- OPÇÃO 1 — DELETAR POR EMAIL
-- =====================================================================
-- Substitua o email e descomente o bloco. Roda em transação (rollback se erro).
-- Exibe contagem do que vai apagar antes do delete; aborte com ROLLBACK se
-- algo parecer errado.

/*
begin;

with target as (
  select id, email from auth.users where email = '<USER_EMAIL_AQUI>'
)
select
  (select count(*) from target)                                    as users_match,
  (select count(*) from public.attempts          where user_id = (select id from target)) as attempts,
  (select count(*) from public.simulados         where user_id = (select id from target)) as simulados,
  (select count(*) from public.league_members    where user_id = (select id from target)) as league_memberships,
  (select count(*) from public.user_achievements where user_id = (select id from target)) as achievements;

-- Confira os números acima. Se OK, executa:
delete from auth.users where email = '<USER_EMAIL_AQUI>';

commit;
*/

-- =====================================================================
-- OPÇÃO 2 — DELETAR POR USER_ID (UUID)
-- =====================================================================

/*
begin;

with target as (select '<USER_UUID_AQUI>'::uuid as id)
select
  (select count(*) from auth.users where id = (select id from target))           as users_match,
  (select count(*) from public.attempts          where user_id = (select id from target)) as attempts,
  (select count(*) from public.simulados         where user_id = (select id from target)) as simulados,
  (select count(*) from public.league_members    where user_id = (select id from target)) as league_memberships,
  (select count(*) from public.user_achievements where user_id = (select id from target)) as achievements;

delete from auth.users where id = '<USER_UUID_AQUI>'::uuid;

commit;
*/

-- =====================================================================
-- OPÇÃO 3 — FUNÇÃO REUTILIZÁVEL (idempotente, retorna o que deletou)
-- =====================================================================
-- Cria uma função util pra usar em fluxos automatizados (ex: DELETE /me na API).
-- Rodar este create uma única vez no banco; depois invocar via:
--   select * from public.delete_user_account('user@email.com');
--   select * from public.delete_user_account_by_id('<uuid>'::uuid);

create or replace function public.delete_user_account(p_email text)
returns table (
  user_id uuid,
  email text,
  attempts_deleted int,
  simulados_deleted int,
  league_memberships_deleted int,
  achievements_deleted int
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
  v_email text;
  v_attempts int;
  v_simulados int;
  v_leagues int;
  v_achievs int;
begin
  select u.id, u.email into v_id, v_email
  from auth.users u where u.email = p_email;

  if v_id is null then
    raise exception 'usuário com email % não encontrado', p_email
      using errcode = 'no_data_found';
  end if;

  -- Conta antes de deletar (a cascata é destrutiva)
  select count(*) into v_attempts  from public.attempts          where attempts.user_id = v_id;
  select count(*) into v_simulados from public.simulados         where simulados.user_id = v_id;
  select count(*) into v_leagues   from public.league_members    where league_members.user_id = v_id;
  select count(*) into v_achievs   from public.user_achievements where user_achievements.user_id = v_id;

  delete from auth.users where id = v_id;

  return query select v_id, v_email, v_attempts, v_simulados, v_leagues, v_achievs;
end;
$$;

comment on function public.delete_user_account(text) is
  'LGPD: apaga conta inteira do usuário pelo email. Cascade cobre profiles, attempts, simulados, league_members, user_achievements.';

create or replace function public.delete_user_account_by_id(p_user_id uuid)
returns table (
  user_id uuid,
  email text,
  attempts_deleted int,
  simulados_deleted int,
  league_memberships_deleted int,
  achievements_deleted int
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_attempts int;
  v_simulados int;
  v_leagues int;
  v_achievs int;
begin
  select u.email into v_email from auth.users u where u.id = p_user_id;

  if v_email is null then
    raise exception 'usuário com id % não encontrado', p_user_id
      using errcode = 'no_data_found';
  end if;

  select count(*) into v_attempts  from public.attempts          where attempts.user_id = p_user_id;
  select count(*) into v_simulados from public.simulados         where simulados.user_id = p_user_id;
  select count(*) into v_leagues   from public.league_members    where league_members.user_id = p_user_id;
  select count(*) into v_achievs   from public.user_achievements where user_achievements.user_id = p_user_id;

  delete from auth.users where id = p_user_id;

  return query select p_user_id, v_email, v_attempts, v_simulados, v_leagues, v_achievs;
end;
$$;

comment on function public.delete_user_account_by_id(uuid) is
  'LGPD: apaga conta inteira do usuário pelo id (uuid). Cascade cobre todas as tabelas com PII.';

-- Travar execução: só service_role / postgres podem chamar (não anon, não authenticated).
revoke execute on function public.delete_user_account(text)         from public, anon, authenticated;
revoke execute on function public.delete_user_account_by_id(uuid)   from public, anon, authenticated;
grant  execute on function public.delete_user_account(text)         to service_role;
grant  execute on function public.delete_user_account_by_id(uuid)   to service_role;
