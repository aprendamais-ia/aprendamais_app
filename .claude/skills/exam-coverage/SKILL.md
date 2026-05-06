---
name: exam-coverage
description: Audita cobertura do banco de questões contra a ementa oficial e gera relatório de gaps. Use para encontrar tópicos com menos questões que o alvo, ou para preparar plano semanal de geração de conteúdo. Roda automaticamente toda terça via cron.
---

# exam-coverage

Auditoria de cobertura: compara questões `published` no banco com o esperado pela ementa, identifica gaps por tópico, e propõe plano de geração.

## Quando usar

- Toda terça 10h via cron (automático) — abre PR com relatório
- Manual antes de fechar uma fase do roadmap
- Quando o time pergunta "tá faltando o quê?"

## Quando NÃO usar

- Para gerar questões → `generate-question`
- Para revisar qualidade individual de questão → `review-question`

## Inputs

- `track` — `cpa-10`, `oab`, ou `all`
- `target_per_topic` (opcional) — multiplicador sobre `weight × total_target`. Default: 100 questões publicadas por trilha por unidade de peso (ou seja: peso 0.1 → alvo 10 questões; peso 0.2 → alvo 20).

## Processo

1. **Carregar ementa** completa do(s) `track`(s)
2. **Query agregada** no Postgres: `count(questions WHERE status='published') GROUP BY topic_id`
3. **Calcular alvo** por tópico: `target = weight × global_target`
   - Global target Fase 1: 50 (CPA-10), 50 (OAB)
   - Fase 2: 500/500
   - Fase 3: 1000/1000
4. **Compor relatório:** tópicos abaixo do alvo, distribuição de dificuldade dentro de cada tópico, idade média das questões publicadas, taxa de contestação por tópico
5. **Sugerir plano:** prioriza top 3 gaps maiores, com chamada sugerida do `generate-question`
6. **Salvar** em `reports/coverage-{date}.md` e abrir PR

## Schema do relatório

```markdown
# Coverage Report — {date}

## Resumo

- CPA-10: 412 / 500 questões publicadas (82%)
- OAB: 380 / 500 questões publicadas (76%)

## Top gaps (por urgência)

### CPA-10
| Tópico | Atual | Alvo | Gap | Sugestão |
|---|---|---|---|---|
| etica.suitability | 5 | 25 | -20 | `generate-question --topic etica.suitability --difficulty 2-3 --count 20` |
| renda-variavel.acoes | 18 | 35 | -17 | `generate-question --topic renda-variavel.acoes --difficulty 1-3 --count 17` |
| ...

### OAB
| ... |

## Distribuição de dificuldade

(gráfico em ASCII por trilha)

## Questões problemáticas

- {N} questões com taxa de acerto > 95% (reavaliar dificuldade)
- {M} questões com taxa de acerto < 20% (revisar correção)
- {K} questões com 3+ contestações abertas

## Plano sugerido para a semana
1. Atacar gap de "Ética e Suitability" — 20 questões (~30min de trabalho do on-call)
2. Re-revisar 8 questões em "Renda Fixa" com taxa anômala
3. Atualizar ementa CPA-10 — versão ANBIMA mudou de v.2024 para v.2025?
```

## Princípios

- **Nunca propor geração maior que 30 questões num único shot** — qualidade cai
- **Priorizar tópicos com peso alto** — peso 0.2 com gap de 50% importa mais que peso 0.05 com gap de 90%
- **Ignorar tópicos com cobertura ≥ 110%** do alvo — não vale gerar mais

## Implementação

```ts
// scripts/exam-coverage.ts
import { loadSyllabus } from "@/modules/content/syllabus";
import { supabase } from "@/lib/supabase";

async function audit(track: string) {
  const syllabus = await loadSyllabus(track);
  const counts = await supabase.rpc("question_counts_by_topic", { track });
  
  const gaps = syllabus.topics.map(topic => {
    const target = Math.round(topic.weight * GLOBAL_TARGET);
    const actual = counts[topic.slug] ?? 0;
    return { topic, target, actual, gap: target - actual };
  }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);
  
  return renderMarkdown(gaps);
}
```

## Cron

```yaml
# .github/workflows/coverage.yml
on:
  schedule:
    - cron: "0 13 * * 2"  # toda terça 10h BRT (13h UTC)
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm content:audit cpa-10 oab
      - uses: peter-evans/create-pull-request@v6
        with:
          title: "📊 Coverage report — {{date}}"
          branch: bot/coverage-{{date}}
```

## Custo

Praticamente zero — é só query no banco + renderização de markdown. Não chama LLM.
