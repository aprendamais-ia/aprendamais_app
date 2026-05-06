---
name: review-question
description: Revisa fact-accuracy, qualidade pedagógica, e correção de questão de múltipla escolha contra a citação oficial. Use após generate-question, antes de publicar. Não usar para gerar conteúdo novo — use generate-question.
---

# review-question

Revisor automatizado de questões. Roda Claude Opus 4.7 (mais caro, mais preciso) para checar fact-accuracy contra a citação oficial.

## Quando usar

- Toda questão `status='draft'` antes de virar `status='review'` (revisão humana)
- Re-revisar questões flagged por telemetria (taxa de acerto anômala, contestações)

## Quando NÃO usar

- Para gerar questão nova → `generate-question`
- Para questões já com `status='published'` recentes — não vale o custo

## Inputs

- `question_id` — UUID da questão em `questions`

## Processo

1. **Carregar questão completa** do Postgres: stem, choices, explanation, source_citation
2. **Carregar trecho da ementa** referenciado em `source_citation` (`content/syllabi/<track>.yaml`)
3. **Buscar potenciais duplicatas:** top 5 questões mais similares já `published` no mesmo `topic_id` (via embedding ou trigram similarity)
4. **Chamar Claude Opus 4.7** com tudo isso e pedir verificação estruturada
5. **Persistir resultado** em `questions.review_result jsonb` + atualizar status conforme confidence

## Schema de saída

```json
{
  "confidence": 0.92,
  "issues": [
    {
      "severity": "warning",
      "kind": "ambiguous_distractor",
      "message": "Alternativa C também pode ser considerada correta dependendo da interpretação...",
      "suggested_fix": "Trocar 'pode' por 'deve' em C"
    }
  ],
  "duplicate_of": null,
  "fact_check": {
    "stem_factual": true,
    "explanation_factual": true,
    "citation_supports_answer": true
  },
  "recommendation": "approve_after_fix"
}
```

`recommendation` ∈ `{ approve, approve_after_fix, reject, escalate_human }`

## Decisão automática

| Confidence | Issues críticas? | Ação |
|---|---|---|
| ≥ 0.85 | não | `status='review'` (fila humana) |
| ≥ 0.85 | sim | `status='review'` + flag prominente no admin |
| < 0.85 | qualquer | `status='draft'` + descrição do problema; humano decide |
| recommendation = `reject` | — | `status='retired'` automático, log motivo |
| `duplicate_of` ≠ null | — | `status='retired'`, link no admin |

## System prompt

```
Você é revisor especialista em provas de {track}. Sua tarefa: avaliar uma questão de múltipla escolha quanto a:

1. Fact accuracy: a alternativa correta é, de fato, correta segundo a citação?
2. Distratores: os errados estão claramente errados? Algum é ambíguo?
3. Citação: o item da ementa citado realmente fundamenta a resposta?
4. Linguagem: PT-BR correto, estilo de prova, sem ambiguidade?
5. Duplicidade: é redundante com alguma das questões publicadas fornecidas?

EMENTA REFERENCIADA: {syllabus_excerpt}

QUESTÕES PUBLICADAS SIMILARES: {similar_published[]}

Responda em JSON conforme schema. Seja conservador: prefira flagar do que aprovar com dúvida.
```

## Exemplo de uso

```bash
# Roda em todas as draft de uma vez
pnpm content:review

# Roda em uma só
pnpm content:review --id <uuid>
```

## Custo

Opus 4.7 é caro (~10x Sonnet). Estratégia:
- Cache do system prompt (ementa não muda)
- Lote de 10 questões por chamada quando possível
- Não re-revisar questão se `review_result` foi gerado < 7 dias atrás (a menos que stem/choices mudaram)

Estimativa: < US$ 0.05 por questão. Para 1000 questões = US$ 50. OK no orçamento.

## Falhas comuns

- Opus retornou `confidence` fora de [0,1]: clamp e log
- JSON malformado: retry 1x; depois marca `escalate_human`
- Citação aponta para item que não existe na ementa: erro de generate-question, `recommendation=reject`
