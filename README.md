# Aprendez

> Duolingo para concursos brasileiros. CPA-10 e OAB no MVP, expansão para medicina/juiz/promotor depois.

## O que é

PWA mobile-first que transforma a preparação para concursos em sessões curtas, gamificadas e adaptativas. Bite-sized lessons, XP, streak, ligas semanais, simulados oficiais — tudo na palma da mão.

**North star:** maximizar a *probabilidade estimada de aprovação* de cada usuário, não só XP acumulado.

## Stack

Next.js 15 + React 19 + Tailwind + shadcn/ui + Supabase (Postgres/Auth/Realtime) + Vercel + Stripe + Pix (Mercado Pago) + PostHog + Claude API.

Detalhes e por quês em [`docs/STACK.md`](docs/STACK.md).

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # preencher SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
pnpm db:push                 # roda migrations no Supabase
pnpm db:seed                 # carrega ementas e questões iniciais
pnpm dev                     # http://localhost:3000
```

## Estrutura

```
ed_startup/
├── README.md            ← você está aqui
├── CLAUDE.md            ← guia de uso do Claude Code neste repo
├── docs/                ← especificações vivas (ler antes de codar)
└── .claude/
    ├── settings.json    ← permissões do Claude Code
    └── skills/          ← skills compartilhadas pelo time
```

## Documentação

| Doc | Para quê |
|---|---|
| [VISION.md](docs/VISION.md) | O que somos, para quem, por quê |
| [STACK.md](docs/STACK.md) | Decisões técnicas com tradeoffs |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Módulos, fluxo de dados, fronteiras |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Schema Postgres |
| [GAMIFICATION.md](docs/GAMIFICATION.md) | Regras de XP, vidas, streak, ligas |
| [CONTENT.md](docs/CONTENT.md) | Pipeline de geração e revisão de questões |
| [BRAND.md](docs/BRAND.md) | Cores, mascote, tom de voz |
| [ROADMAP.md](docs/ROADMAP.md) | Fases até o lançamento |
| [TASKS.md](docs/TASKS.md) | Quem faz o quê |
| [RESEARCH.md](docs/RESEARCH.md) | Pesquisa de mercado e fontes |

## Time

5 engenheiros full-stack. Cada um é dono de um vertical (ver [`docs/TASKS.md`](docs/TASKS.md)).

## Como contribuir

1. Leia o `CLAUDE.md` e o doc do seu vertical
2. Crie branch `<seu-nome>/<feature-curta>`
3. Abra PR com preview deploy do Vercel
4. Sync semanal de 30min para alinhar contratos entre módulos
