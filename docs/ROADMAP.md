# ROADMAP

12 semanas até beta público. Datas relativas — começa quando o time bate o T0 de "repo + Supabase + CI prontos".

## Fase 0 — Setup (semana 0)

Infra mínima antes de qualquer feature.

- [ ] Repo GitHub + branch protection em `main`
- [ ] Vercel project + domínio (`aprendez.com.br`)
- [ ] Supabase project (region: São Paulo se disponível, senão us-east-1)
- [ ] Anthropic API key + budget alert
- [ ] PostHog + GitHub Actions com `typecheck` + `test`
- [ ] `pnpm` setup, scaffold Next.js 15 + Tailwind + shadcn
- [ ] `.env.example` documentado
- [ ] Cada eng com Vercel preview deploy funcionando

**Saída:** PR vazio mergeia, deploy preview vira, `pnpm dev` roda em todas as máquinas.

## Fase 1 — Fundação (semanas 1-2)

Esqueleto funcional, ainda sem usuário público.

- [ ] **E1:** schema `tracks`, `topics`, `profiles` + auth (email + Google) + onboarding flow + escolha de trilha
- [ ] **E2:** schema `questions`, `lessons`, `attempts` + player de lição básico + 1 questão hardcoded funcionando ponta-a-ponta
- [ ] **E3:** schema `leagues`, `achievements` + XP awarding + streak básico
- [ ] **E4:** skills `generate-question` e `review-question` rodando + seed de 50 questões CPA-10 revisadas
- [ ] **E5:** PWA manifest + service worker + design system (Button, Card, ProgressBar, HeartIcon, FlameIcon) + dark mode toggle

**Saída:** 1 dev consegue logar, escolher CPA-10, fazer 1 lição com 5 questões reais, ganhar XP.

## Fase 2 — MVP fechado (semanas 3-6)

Beta privado com 20 amigos.

- [ ] **E1:** teste de nível inicial (10 questões, calibra `skill_level`), perfil editável
- [ ] **E2:** modo simulado oficial (CPA-10 50q em 2h), modo revisão (questões erradas), explicações com markdown + LaTeX
- [ ] **E3:** ligas semanais funcionando (cron de fechamento), leaderboard realtime, 5 conquistas iniciais, push de lembrete diário
- [ ] **E4:** 500 questões CPA-10 + 500 OAB publicadas, admin dashboard de revisão, pipeline `exam-coverage` rodando semanal
- [ ] **E5:** marketing site (`/`, `/sobre`, `/precos`), polish mobile (gestures, animações de XP), prompt iOS "Add to Home Screen"

**Saída:** 20 betas usam por 2 semanas, NPS > 30, retenção D7 > 30%.

## Fase 3 — MVP público (semanas 7-10)

Lançamento soft.

- [ ] **E1:** social login (apenas Google + Apple — não fazer Facebook), recuperação de senha, LGPD compliance básico
- [ ] **E2:** modo "estudo profundo" (sem timer, sem perder vida), histórico de simulados, métricas pessoais
- [ ] **E3:** leaderboard de amigos (compartilhar link), 15 conquistas adicionais, push segmentados (vidas voltando, liga fechando)
- [ ] **E4:** 1000 questões por trilha, modelo de probabilidade de aprovação v1 (heurístico), reportagem de bugs em questões
- [ ] **E5:** assinatura premium (Pix + Stripe), checkout otimizado mobile, recibo automático, cancelamento 1-clique

**Saída:** abre cadastro público com waitlist, 200 inscritos pagos no primeiro mês.

## Fase 4 — Lançamento (semanas 11-12)

- [ ] Conteúdo de marketing (Cabi no TikTok/Instagram)
- [ ] Parceria piloto com 2-3 cursinhos (descontos cruzados)
- [ ] App Store listing (Capacitor wrap se Web Push iOS continuar limitado)
- [ ] 1000 contas, 50 pagantes
- [ ] Retrospectiva: o que mover pra Fase 5

## Fase 5+ (após Beta) — backlog priorizado

1. Modelo ML de probabilidade de aprovação (após coletar dados)
2. Empacotamento Capacitor para Play Store / App Store
3. Vertical Medicina (Revalida + Residência)
4. Vertical Magistratura
5. B2B para cursinhos (white-label de questões, analytics agregados)
6. Programa de afiliados / cashback Pix
7. TTS para acessibilidade
8. Modo offline completo (sync quando voltar online)

## Deadlines duros

- **Semana 6:** ter beta privado rodando — investidores anjos vão querer ver
- **Semana 10:** ter cobrança rodando — runway começa a apertar
- **Semana 12:** lançamento público — janela de marketing antes de prova OAB de fevereiro

## Ritual

- **Daily async** no Slack (3 perguntas: o que fiz / o que vou fazer / blocker)
- **Sync semanal de 30min** segunda 10h — alinhar contratos entre módulos
- **Demo & retro** sexta 16h — quem fez o quê, o que melhorar
- **Planning** segunda 11h — revisar este `ROADMAP.md`, ajustar
