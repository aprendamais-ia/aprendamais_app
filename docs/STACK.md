# STACK

Decisões técnicas e por quês. Quando alguém pergunta "por que não X?", a resposta deve estar aqui.

## Resumo

| Camada | Escolha |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 |
| Estilo | Tailwind CSS + shadcn/ui |
| State | Zustand (UI) + TanStack Query (server) |
| Backend/DB | Supabase (Postgres + Auth + Storage + Realtime) |
| API | Next.js Route Handlers |
| IA | Claude API (Sonnet 4.6 default, Opus 4.7 para revisão) |
| Pagamentos | Stripe + Pix (Mercado Pago) |
| Analytics | PostHog |
| Push | Web Push API + OneSignal |
| Hosting | Vercel + Supabase |
| Pacotes | pnpm workspaces |
| Testes | Vitest + Playwright |
| CI | GitHub Actions |

## Frontend: Next.js 15 + React 19

**Por quê:**
- App Router permite server components, reduz JS no cliente — crucial em conexões 3G/4G brasileiras
- SSR para SEO (Google.com.br é o canal orgânico principal)
- React 19 já é estável; `use()` simplifica fetching server-side
- Time todo conhece React, zero ramp-up

**Não escolhemos:**
- ~~SvelteKit~~: time não conhece, ecossistema BR menor
- ~~Remix~~: similar ao Next, sem ganho claro

## Estilo: Tailwind + shadcn/ui

**Por quê:**
- Sem designer no time. shadcn dá componentes prontos, copy-paste, totalmente customizáveis (não é dependência fechada)
- Tailwind padroniza espaçamento e cores via design tokens
- Dark mode trivial com `dark:` prefix

**Regra:** sempre rodar `npx shadcn@latest add <componente>` antes de criar do zero.

## State: Zustand + TanStack Query

**Por quê:**
- Zustand: 1KB, hooks-only, sem boilerplate. Perfeito para estado de UI (modal aberto, streak animation playing).
- TanStack Query: invalidação, cache, refetch on focus, optimistic updates. Resolve 90% do que Redux/RTK Query resolveriam.

**Não escolhemos:**
- ~~Redux Toolkit~~: overkill para o que é majoritariamente server state
- ~~Jotai/Recoil~~: Zustand é mais simples e suficiente

## Backend: Supabase

**Por quê:**
- Auth pronto (email + magic link + Google) — economia de 2 semanas de trabalho
- Postgres "real" — quando precisar de joins complexos para leaderboard ou cobertura de ementa, está lá
- Row-Level Security garante isolamento multi-tenant no banco, não na app
- Realtime via WebSocket — leaderboard ao vivo de graça
- Free tier suficiente até ~10k MAU

**Não escolhemos:**
- ~~Firebase~~: vendor lock-in maior, NoSQL ruim para queries de cobertura/relatório
- ~~PlanetScale~~: bom DB, mas precisaria montar auth e realtime à parte
- ~~Self-host Postgres~~: desperdício de tempo no estágio MVP

## API: Next.js Route Handlers (sem tRPC ainda)

**Por quê:**
- Frontend e backend no mesmo deploy — co-location resolve a maioria dos casos
- Tipos compartilhados via `import type` direto
- tRPC vira opção depois se a quantidade de endpoints justificar boilerplate menor

## IA: Claude API

**Defaults:**
- `claude-sonnet-4-6` para geração massiva (questões, lições) — barato, rápido, bom o suficiente
- `claude-opus-4-7` para revisão de fact accuracy — só onde precisão importa mais que custo
- **Prompt caching obrigatório** para o system prompt da geração de questões (a ementa é o cache)
- Tools para structured output (forçar JSON schema das questões)

**Por quê Anthropic e não OpenAI:** maior fidelidade em tarefas de raciocínio jurídico/financeiro (relevante pra OAB e CPA-10), prompt caching mais barato, time já tem familiaridade.

## Pagamentos: Stripe + Pix (Mercado Pago)

**Por quê dois:**
- Stripe: cartão internacional, recorrência robusta, dashboard completo
- Pix via Mercado Pago: ~70% das transações digitais no BR são Pix. MP tem melhor taxa Pix do mercado e webhook estável.

**Fluxo:** Pix mensal renovável (cobra todo mês via Pix gerado) ou cartão recorrente. Anual com 30% off.

## Analytics: PostHog

**Por quê:**
- Funnels + session replay + feature flags + A/B em uma só ferramenta
- Self-host opcional se LGPD apertar
- Free tier generoso (1M events/mês)

**Não escolhemos:**
- ~~Mixpanel~~: caro, sem session replay
- ~~GA4~~: ruim para produto, bom só para marketing

## Push: Web Push API + OneSignal

**Realidade:**
- Android PWA: web push funciona perfeitamente
- iOS PWA: web push só funciona se o usuário "Adicionar à tela inicial" (iOS 16.4+) — vamos prompt-ar isso ativamente

OneSignal para a UI de segmentação e fallback futuro quando empacotarmos com Capacitor.

## Hosting: Vercel + Supabase

**Por quê:**
- Vercel: zero ops, preview deploy por PR, CDN edge no BR (gru1)
- Supabase: managed Postgres, auth, storage, realtime — tudo num lugar

**Custo estimado MVP:** US$ 20/mês Vercel Pro + US$ 25/mês Supabase Pro = US$ 45/mês até ~10k MAU. Nada.

## Monorepo: pnpm workspaces (sem Turborepo)

**Por quê:** MVP cabe em um único app Next.js. Workspaces deixam pronto para adicionar `packages/admin/` ou `packages/mobile/` quando precisar. Turborepo adiciona quando build tempo passar de 30s.

## Testes: Vitest + Playwright

- Vitest: unit tests do engine de gamificação (puro, fácil de testar)
- Playwright: smoke tests do fluxo crítico (signup → primeira lição → XP recebido)
- Cobertura alvo: 70% no `modules/gamification/` (regra de negócio mais sensível). Resto best-effort.

## CI: GitHub Actions

Pipeline mínimo:
1. `pnpm typecheck`
2. `pnpm test`
3. Vercel preview deploy automático
4. Playwright smoke roda contra preview
