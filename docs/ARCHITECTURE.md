# ARCHITECTURE

Visão de alto nível dos módulos, fronteiras e fluxo de dados.

## Diagrama (texto)

```
                  ┌──────────────────────────────────┐
                  │     Cliente (PWA, Next.js)       │
                  │                                  │
                  │  shell ──┬── auth ──┐            │
                  │          │          │            │
                  │  learning ─── gamification       │
                  │          │          │            │
                  │   content (admin) ──┘            │
                  └─────────────┬────────────────────┘
                                │ HTTPS
                                ▼
                  ┌──────────────────────────────────┐
                  │   Next.js Route Handlers (BFF)   │
                  │   /api/*  → Supabase + Claude    │
                  └─┬──────────────┬──────────┬──────┘
                    │              │          │
                    ▼              ▼          ▼
              ┌──────────┐  ┌────────────┐  ┌──────────────┐
              │ Supabase │  │ Claude API │  │ Mercado Pago │
              │ Postgres │  │ (Sonnet/   │  │  + Stripe    │
              │ Auth     │  │  Opus)     │  │  (webhooks)  │
              │ Realtime │  │            │  │              │
              └──────────┘  └────────────┘  └──────────────┘
```

## Módulos (vertical slices)

Cada módulo vive em `src/modules/<nome>/` e tem dono claro. Mudança cross-module exige PR review do dono.

### `auth/` — E1
Identidade, sessão, perfil, escolha de trilha (CPA-10/OAB), teste de nível inicial. Encapsula chamadas ao Supabase Auth.

**Fronteira:** expõe `useUser()`, `useProfile()`, `selectTrack()`. Outros módulos não falam direto com `supabase.auth`.

### `learning/` — E2
Player de lição, engine de questões, fluxo de resposta, explicações, modo simulado.

**Fronteira:** expõe `useLessonPlayer(lessonId)`, `submitAnswer(questionId, choice)`. Recebe questões via `content/`, emite eventos para `gamification/`.

### `gamification/` — E3
XP, vidas, streak, ligas, leaderboard realtime, conquistas, lembrete push.

**Fronteira:** expõe `useStreak()`, `useLeague()`, `useXP()`, `recordAttempt(result)`. Escuta eventos de `learning/` para conceder XP.

### `content/` — E4
Pipeline de geração via IA, scripts de seed, admin dashboard de revisão de questões, métricas de qualidade.

**Fronteira:** expõe `getQuestion(filters)`, `getLesson(id)`. Resto do app só consome — nunca cria conteúdo.

### `shell/` — E5
App shell PWA (manifest, service worker, offline cache), design system base, dark mode, brand kit, marketing site (`/`, `/sobre`, `/precos`).

**Fronteira:** expõe layouts e componentes base (Button, Card, Heart, FlameIcon...). Não tem lógica de negócio.

## Fluxo crítico: responder uma questão

```
[user toca alternativa]
    │
    ▼
learning/QuestionCard
    │ submitAnswer(questionId, "B")
    ▼
POST /api/attempts
    │
    ▼
Route Handler:
  1. Lê questão do Postgres (com RLS)
  2. Compara resposta
  3. Insere row em `attempts`
  4. Emite evento `attempt.recorded` (Postgres trigger ou app-level)
    │
    ▼
Trigger atualiza:
  - profiles.xp (+10 se correta)
  - profiles.lives (-1 se errada)
  - streaks (recalcula se for primeira atividade do dia)
  - leagues.weekly_xp
    │
    ▼
Realtime channel `league:<league_id>` publica novo XP
    │
    ▼
Outros usuários da liga vêem leaderboard atualizar ao vivo
    │
    ▼
Cliente recebe response: { correct, explanation, xpEarned, livesRemaining }
    │
    ▼
gamification/AnimateXP, atualiza UI
```

## Princípios de fronteira

1. **Cada módulo expõe um `index.ts`** — outros módulos só importam dele.
2. **Nada de imports profundos** entre módulos (`import { foo } from '../gamification/internals/...'` é lint error).
3. **Estado compartilhado vai pelo banco**, não por contexto React. Se dois módulos precisam saber do XP, ambos chamam `gamification/`.
4. **Eventos > callbacks.** `learning` não chama `gamification.recordXP()` direto — escreve em `attempts`, trigger faz o resto. Reduz acoplamento.

## Onde mora a lógica

| Tipo | Onde |
|---|---|
| Validação de input | Zod schemas no Route Handler |
| Autorização | RLS no Postgres |
| Regra de negócio crítica | Postgres functions/triggers + tests Vitest |
| Regra de UX | React component |
| Animações | CSS / Framer Motion |
| Cache de servidor | TanStack Query |
| Cache de cliente persistente | IndexedDB via service worker |

## Decisões em aberto

- **Server Components vs Client Components em `learning/`:** começar Client (mais simples para state interativo), migrar pieces para Server quando pesar
- **Filas:** usar Postgres + cron Vercel para job de "fechar liga semanal", ou subir worker dedicado? Decisão na semana 6.
- **Multi-tenancy futura (B2B para cursinhos):** schema preparado com `org_id` opcional em `profiles`, mas sem UI até validar B2C primeiro.
