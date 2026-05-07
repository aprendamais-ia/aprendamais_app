-- =============================================================================
-- Seed básico: tracks ativas + achievements iniciais.
-- Tópicos vêm de content/syllabi/*.yaml via `pnpm db:seed-topics`.
-- =============================================================================
-- 2026-05: Pivô ANBIMA → CPA-10 marcada inactive (descontinuada em dez/2025).
-- "Nova CPA" entra como track ativa. Yaml dela em validação; geração de conteúdo
-- bloqueada até alguém do time confirmar conteúdo programático com a ANBIMA.
-- =============================================================================

insert into public.tracks (slug, name, issuer, active, exam_format)
values
  ('cpa-10', 'CPA-10 (descontinuada)', 'ANBIMA', false,
   '{"questions": 50, "duration_min": 120, "passing_score": 0.70, "status_note": "Descontinuada em 12/2025; transição até 12/2026."}'),
  ('nova-cpa', 'Nova CPA', 'ANBIMA',  true,
   '{"questions": 60, "duration_min": 150, "passing_score": 0.70, "status_note": "Substituta da CPA-10. Conteúdo programático em validação."}'),
  ('oab', 'OAB Primeira Fase', 'OAB Federal / FGV', true,
   '{"questions": 80, "duration_min": 300, "passing_score": 0.50}')
on conflict (slug) do update set
  name = excluded.name,
  issuer = excluded.issuer,
  active = excluded.active,
  exam_format = excluded.exam_format;

-- Achievements iniciais (3 — expandir conforme telemetria)
insert into public.achievements (code, name, description, icon)
values
  ('first_lesson',    'Primeira Lição',     'Completou sua primeira lição',                    'sparkles'),
  ('streak_7',        'Semana de Fogo',     'Streak de 7 dias',                                'flame'),
  ('streak_30',       'Mês de Disciplina',  'Streak de 30 dias',                               'flame')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;
