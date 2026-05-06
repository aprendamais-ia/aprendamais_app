---
name: design-component
description: Gera componente React + Tailwind no estilo do Aprendez, baseado em shadcn/ui. Use quando precisar criar componente UI novo. Não usar para componentes que já existem em shadcn — prefira instalar via npx shadcn add.
---

# design-component

Gera componentes React + Tailwind alinhados ao design system do Aprendez.

## Quando usar

- Componente que shadcn não cobre (ex: `<XPBadge>`, `<HeartCounter>`, `<StreakFlame>`, `<LeagueCard>`, `<ProbabilityGauge>`)
- Variação custom de componente shadcn já instalado
- Componente animado específico do produto

## Quando NÃO usar

- Componentes que existem em shadcn → `npx shadcn@latest add <name>`
- Páginas inteiras → estrutura manual, design-component só por bloco
- Componentes triviais (1 div com texto) → escreva direto

## Inputs

- `name` — PascalCase, ex: `XPBadge`
- `description` — o que o componente faz e onde aparece
- `props` (opcional) — TypeScript interface esperada
- `mockup` (opcional) — ASCII ou descrição visual

## Processo

1. **Carregar contexto de design:** `BRAND.md` (cores, tipografia), `tailwind.config.ts` (tokens existentes)
2. **Chamar Claude Sonnet 4.6** com brief estruturado
3. **Validar:**
   - Usa apenas tokens do `tailwind.config.ts` (nada de cores hardcoded fora dos tokens)
   - Usa primitives shadcn quando aplicável (`Button`, `Card`)
   - Tem variants via `cva` se múltiplos estados
   - Funciona em dark mode
   - Tem prop `className` repassável via `cn()`

## Schema de saída

```tsx
// src/components/<name>.tsx
"use client";

import { cn } from "@/lib/utils";
// ... imports
import { cva, type VariantProps } from "class-variance-authority";

const xpBadgeVariants = cva(
  "inline-flex items-center gap-1 font-medium",
  {
    variants: {
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
      },
    },
    defaultVariants: { size: "md" },
  }
);

interface XPBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof xpBadgeVariants> {
  amount: number;
  animated?: boolean;
}

export function XPBadge({ amount, animated, size, className, ...props }: XPBadgeProps) {
  return (
    <div className={cn(xpBadgeVariants({ size }), "rounded-full bg-brand-yellow/20 text-brand-yellow", className)} {...props}>
      <ZapIcon className="size-3.5" />
      <span>{amount.toLocaleString("pt-BR")} XP</span>
    </div>
  );
}
```

## Princípios

1. **Use tokens, não hex.** `bg-brand-green` não `bg-[#009C3B]`.
2. **Mobile-first.** Sem media query desktop antes de mobile estar bom.
3. **Acessível.** Foco visível, `aria-label` em botões só de ícone, `role` correto.
4. **Sem libs novas.** Use o que já está no package.json. Se precisar de animação, Framer Motion (já temos). Se precisar de ícone, Lucide.
5. **`cn()` para className.** Sempre. De `@/lib/utils`.
6. **`cva` para variants.** Mais de 1 estado visual = use `class-variance-authority`.
7. **Server component por padrão.** Adicione `"use client"` só se houver interatividade.

## System prompt

```
Você gera componentes React + Tailwind para o Aprendez.

REGRAS:
- TypeScript estrito (nunca any)
- Usar tokens do tailwind.config.ts: brand-green, brand-yellow, success, error, streak, premium
- Mobile-first: estilos base mobile, prefixos sm: md: lg: para breakpoints
- shadcn/ui primitives quando aplicável (Button, Card, Dialog, etc.)
- cva para variants
- cn() do "@/lib/utils" para combinar classes
- Lucide para ícones
- Suportar dark mode (Tailwind dark: prefix)
- "use client" só se necessário
- Acessibilidade: aria-label, foco visível, semântica correta

DESIGN SYSTEM:
{brand_extract}

TOKENS DISPONÍVEIS:
{tailwind_tokens}

OUTPUT: arquivo .tsx único, sem prosa fora dos comentários do código (e mesmo esses, mínimos).
```

## Exemplo de uso

```bash
pnpm content:design-component \
  --name HeartCounter \
  --description "Mostra vidas restantes (0-5) com ícone de coração. Pisca em vermelho quando chega a 1." \
  --props "{ lives: number; max?: number; }"
```

## Falhas comuns

- Modelo gera componente sem `"use client"` quando precisa: revisar manual antes de mergear
- Cor hardcoded em vez de token: rejeitar e regenerar
- Componente já existe em shadcn: avisar para usar `npx shadcn add` em vez
