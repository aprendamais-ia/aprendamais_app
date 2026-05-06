-- =============================================================================
-- E3 — Sistema de vidas: regeneração lazy
-- =============================================================================
-- claim_lives() é chamada antes de ler profiles.lives em páginas relevantes
-- (home, lição). Calcula quantas vidas regeneraram desde lives_regen_at e
-- atualiza o profile. Idempotente: se nada mudou, no-op.
--
-- Regra: 1 vida a cada 30min, cap em 5. Quando lives=5, lives_regen_at=null.
-- =============================================================================

create or replace function public.claim_lives()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cur_lives int;
  cur_regen timestamptz;
  to_add int;
begin
  if uid is null then return; end if;

  select lives, lives_regen_at
    into cur_lives, cur_regen
    from public.profiles
   where id = uid
   for update;

  if cur_lives is null
     or cur_lives >= 5
     or cur_regen is null
     or now() < cur_regen then
    return;
  end if;

  -- Quantos ciclos de 30min completaram desde regen_at? +1 do regen original.
  to_add := 1 + floor(extract(epoch from (now() - cur_regen)) / (30 * 60))::int;

  if cur_lives + to_add >= 5 then
    update public.profiles
       set lives = 5, lives_regen_at = null
     where id = uid;
  else
    update public.profiles
       set lives = cur_lives + to_add,
           lives_regen_at = cur_regen + (to_add * interval '30 minutes')
     where id = uid;
  end if;
end;
$$;

comment on function public.claim_lives is
  'Regenera vidas com base em lives_regen_at. Chamar antes de ler lives.';
