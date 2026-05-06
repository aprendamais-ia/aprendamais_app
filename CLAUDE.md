# CLAUDE.md — Aprendez

Guia para qualquer dev (humano ou IA) usando Claude Code neste repositório.

## Sobre o projeto

PWA mobile-first em Next.js 15 que prepara estudantes brasileiros para CPA-10 e OAB com mecânicas estilo Duolingo. Time: 5 engenheiros full-stack, todos usam Claude Code. Sem designer, sem conteudista — IA preenche os gaps.

Leia [`docs/VISION.md`](docs/VISION.md) e [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) antes de mudar código que cruze fronteiras de módulos.

## Convenções não-negociáveis

- **Idioma:** PT-BR no produto (UI, copy, mensagens de erro voltadas ao usuário). Inglês no código (variáveis, comentários, commits, PRs, nomes de funções, schema do banco).
- **Componentes:** usar [shadcn/ui](https://ui.shadcn.com) sempre que existir. Só criar do zero quando shadcn não cobrir. Nunca instalar outra UI library sem discutir.
- **Conteúdo (questões/lições):** nunca escrever ad-hoc. Chamar a skill `generate-question` ou `create-lesson`. Toda questão tem que passar por `review-question` antes de virar `published`.
- **Texto voltado ao usuário:** passar pela skill `localize-pt-br` para garantir tom informal e correto.
- **Estado de servidor:** TanStack Query. Estado de UI: Zustand. Não misturar.
- **DB:** Supabase com RLS habilitado em toda tabela. Nenhuma query no client sem policy.
- **Pagamento:** Pix é primeiro classe de cidadão. Cartão (Stripe) é secundário.

## Estrutura do repo (alvo)

```
src/
├── app/                  # Next.js App Router
├── components/           # shadcn/ui + componentes próprios
├── lib/                  # supabase client, utils
├── modules/
│   ├── auth/             # E1 — onboarding e identidade
│   ├── learning/         # E2 — player de lição, engine de questões
│   ├── gamification/     # E3 — XP, vidas, streak, ligas
│   ├── content/          # E4 — geração via IA, admin
│   └── shell/            # E5 — PWA shell, design system, marketing
content/
├── syllabi/              # ementas oficiais (CPA-10 ANBIMA, OAB)
└── seed/                 # questões revisadas para seed do banco
supabase/
├── migrations/
└── seed.sql
```

Cada `modules/<nome>/` tem dono claro (ver [`docs/TASKS.md`](docs/TASKS.md)). Mudanças cross-module exigem aviso no canal #eng e PR review do dono.

## Como o Claude deve operar

- **Antes de implementar feature nova:** ler o doc relevante em `docs/`. Se faltar especificação, perguntar.
- **Antes de criar componente UI:** procurar em shadcn primeiro (`npx shadcn@latest add <componente>`).
- **Antes de criar questão/lição:** usar a skill apropriada de `.claude/skills/`.
- **Comentários em código:** evitar. Nome bom > comentário. Comentário só quando o "porquê" é não-óbvio.
- **Migrations:** sempre incrementais. Nunca editar migration já mergeada — criar nova.
- **Texto user-facing:** sempre PT-BR. Em caso de dúvida de tom, ver [`docs/BRAND.md`](docs/BRAND.md).

## Skills disponíveis

- `generate-question` — gera questão de múltipla escolha do tópico X
- `review-question` — fact-check de uma questão contra a citação
- `create-lesson` — gera lição bite-sized de um tópico
- `localize-pt-br` — ajusta tom de texto para PT-BR informal Aprendez
- `design-component` — gera componente shadcn/Tailwind no estilo do app
- `exam-coverage` — audita gaps na cobertura da ementa

Detalhes em `.claude/skills/<nome>/SKILL.md`.

## Comandos úteis

```bash
pnpm dev                        # dev server
pnpm typecheck                  # tsc --noEmit em todo o monorepo
pnpm test                       # vitest
pnpm db:push                    # supabase db push
pnpm db:seed                    # tsx scripts/seed.ts
pnpm content:generate cpa10 50  # gera 50 questões CPA-10 via skill
pnpm content:review             # roda review-question em tudo que está draft
```

## O que NÃO fazer

- Não usar Firebase, Prisma, ou outra UI library além de shadcn (já discutido em [`docs/STACK.md`](docs/STACK.md))
- Não pushar direto em `main`. Sempre PR.
- Não commitar `.env.local` nem chaves de API. Verificar `.gitignore`.
- Não escrever questões ou lições à mão — usar skills.
- Não traduzir literalmente do Duolingo. Ver diferencial em [`docs/VISION.md`](docs/VISION.md).
