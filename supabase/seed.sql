-- =============================================================================
-- Seed básico: 2 tracks (CPA-10 — em transição — e OAB) + módulos raiz
-- =============================================================================
-- Tópicos completos vêm de content/syllabi/*.yaml via script TS (mais flexível).
-- Aqui só semeamos as trilhas + módulos raiz para a tela de onboarding existir.
-- =============================================================================

insert into public.tracks (slug, name, issuer, exam_format)
values
  ('cpa-10', 'CPA-10 (em transição)', 'ANBIMA',
   '{"questions": 50, "duration_min": 120, "passing_score": 0.70, "status_note": "Descontinuada em 12/2025; transição até 12/2026."}'),
  ('oab', 'OAB Primeira Fase', 'OAB Federal / FGV',
   '{"questions": 80, "duration_min": 300, "passing_score": 0.50}')
on conflict (slug) do update set
  name = excluded.name,
  issuer = excluded.issuer,
  exam_format = excluded.exam_format;
