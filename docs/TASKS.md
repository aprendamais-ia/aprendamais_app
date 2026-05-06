# TASKS

Divisão de trabalho entre os 5 engs full-stack. Vertical slices por domínio para minimizar merge conflicts. Cada eng é dono ponta-a-ponta da sua trilha — schema, API, UI, testes, docs.

> **Como atribuir:** preencher coluna "Quem" com o nome no kickoff. Pode trocar com outro eng com aviso no Slack.

## Donos por módulo

| Eng | Quem | Módulo | Tabelas que owna | PRs precisam review do dono? |
|---|---|---|---|---|
| E1 | _____ | `auth/` | `profiles`, `tracks` | sim para mudanças schema |
| E2 | _____ | `learning/` | `questions`, `lessons`, `attempts`, `simulados` | sim para `attempts` |
| E3 | _____ | `gamification/` | `leagues`, `league_members`, `achievements`, `user_achievements` | sim |
| E4 | _____ | `content/` | (escreve em `questions`, `lessons` via admin) | só se mexer schema |
| E5 | _____ | `shell/` | (não tem schema) | review obrigatório em design tokens |

## Tasks Fase 1 (semanas 1-2)

### E1 — Auth & Onboarding
- [ ] Migration: `tracks` + seed inicial (CPA-10, OAB)
- [ ] Migration: `topics` + seed das ementas (a partir de `content/syllabi/*.yaml`)
- [ ] Migration: `profiles` (estende `auth.users`)
- [ ] Supabase Auth: email + magic link + Google
- [ ] RLS: policies em `profiles` (user só lê/edita o próprio)
- [ ] UI: tela de signup/login (`/entrar`)
- [ ] UI: onboarding (4 passos: nome → trilha → quanto/dia → data da prova alvo)
- [ ] Hook `useUser()` e `useProfile()` em `modules/auth/index.ts`
- [ ] Smoke test Playwright: cria conta → preenche onboarding → cai na home

### E2 — Engine de aprendizagem
- [ ] Migration: `questions`, `lessons`, `attempts`
- [ ] RLS: `questions` SELECT público de `published`; `attempts` user-owned
- [ ] API: `GET /api/lessons/:id` retorna lição + questões
- [ ] API: `POST /api/attempts` valida resposta, persiste, retorna feedback
- [ ] UI: `<LessonPlayer>` — sequência de questões com transição suave
- [ ] UI: `<QuestionCard>` — enunciado + alternativas + estado de resposta
- [ ] UI: `<ExplanationDrawer>` — abre após responder, com markdown
- [ ] Pré-fetch da próxima questão (TanStack Query prefetch)
- [ ] Test Vitest: lógica de `submitAnswer` (correto, incorreto, último da lição)

### E3 — Gamificação
- [ ] Migration: `leagues`, `league_members`, `achievements`, `user_achievements`
- [ ] Postgres function: `award_xp(user_id, amount)` (atualiza `profiles.xp_total` e `league_members.weekly_xp`)
- [ ] Postgres function: `update_streak(user_id)` (chama em todo attempt insert)
- [ ] Postgres trigger: `on_attempt_insert` chama as duas funções
- [ ] UI: `<XPBadge>`, `<HeartCounter>`, `<StreakFlame>` no header global
- [ ] UI: animação "+10 XP" flutuante após acerto
- [ ] Hook `useLives()` que calcula vidas atuais com regen
- [ ] Test Vitest: cobertura ≥ 80% das funções de regra de negócio

### E4 — Conteúdo
- [ ] `content/syllabi/cpa-10.yaml` completo (transcrever do edital ANBIMA atual)
- [ ] `content/syllabi/oab.yaml` completo
- [ ] Skill `generate-question` testada (gera 5 questões válidas)
- [ ] Skill `review-question` testada (Opus revisa, retorna confidence)
- [ ] Script `scripts/seed-questions.ts` — gera 50 questões CPA-10 e seed
- [ ] Admin UI mínimo: lista questões `status='review'`, botão Aprovar/Rejeitar
- [ ] Test: skill retorna JSON válido contra schema Zod

### E5 — Shell & Design
- [ ] Setup Tailwind + tokens em `tailwind.config.ts` (cores do BRAND.md)
- [ ] PWA: `manifest.json`, `next-pwa` configurado
- [ ] Service worker: cache de assets + offline fallback
- [ ] Dark mode toggle + auto-switch 19h-7h
- [ ] Componentes shadcn instalados: `Button`, `Card`, `Dialog`, `Toast`, `Progress`, `Avatar`
- [ ] Componentes próprios: `<HeartIcon>`, `<FlameIcon>` (do Lucide com cores do brand)
- [ ] Layout `<AppShell>` com header (logo + heart + flame + xp) e bottom nav (4 ícones)
- [ ] Loading states: skeletons em todas as queries críticas

## Tasks Fase 2 (semanas 3-6) — resumo

(Detalhar no kickoff da Fase 2 com base em aprendizados da Fase 1.)

| Eng | Highlights |
|---|---|
| E1 | Teste de nível inicial calibra `skill_level`; perfil editável |
| E2 | Modo simulado (50q/2h CPA-10 e 80q/5h OAB), modo revisão de erros, suporte LaTeX |
| E3 | Cron de fechamento de liga, leaderboard realtime, 5 conquistas, push diário |
| E4 | 500 + 500 questões publicadas, admin com filtros, `exam-coverage` automatizado |
| E5 | Marketing site, animações de XP, prompt iOS "Add to Home Screen" |

## Tasks Fase 3 (semanas 7-10) — resumo

(Detalhar no kickoff da Fase 3.)

| Eng | Highlights |
|---|---|
| E1 | Apple login, recuperação de senha, LGPD |
| E2 | Modo estudo profundo, histórico, métricas |
| E3 | Friends leaderboard, 15 conquistas, push segmentados |
| E4 | 1000 q/trilha, modelo P(aprovação) v1, sistema de contestação |
| E5 | Premium checkout (Pix + Stripe), recibo, cancelamento 1-click |

## Definition of Done (todas as tasks)

Uma task só é "concluída" se:
1. ✅ Código merged em `main` via PR
2. ✅ `pnpm typecheck` passa
3. ✅ `pnpm test` passa (ou test novo adicionado)
4. ✅ Preview deploy do Vercel funciona
5. ✅ Doc relevante (`docs/`) atualizado se mudou contrato/comportamento
6. ✅ Smoke test manual em mobile (Chrome DevTools mobile mode + 1 device real)

## Cross-team contracts

Quando um módulo precisa de algo de outro:

1. Abrir issue tagged `contract` com proposta
2. Dono do módulo provedor responde com OK ou contraposta em até 24h
3. Após acordo, ambos os PRs (provedor + consumidor) são merged no mesmo dia

Não bloqueie esperando — se não houver resposta em 24h, escalar no sync semanal.

## On-call de conteúdo (rotação semanal)

| Semana | Quem |
|---|---|
| 1 | E4 |
| 2 | E1 |
| 3 | E2 |
| 4 | E3 |
| 5 | E5 |
| ... | repete |

On-call:
- Roda `pnpm content:audit` na terça
- Limpa fila de revisão (30min)
- Triagem de questões contestadas

## Quem ataca incidentes em produção

Rodízio. Tabela vai aqui depois do primeiro incidente. Por enquanto: quem mergeou o último deploy.
