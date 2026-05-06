---
name: generate-question
description: Gera questões de múltipla escolha estilo CPA-10/OAB para o banco de questões do Aprendez. Use quando precisar criar questões novas para um tópico específico da ementa. Não usar para revisar — use review-question. Não usar para escrever lições — use create-lesson.
---

# generate-question

Gera questões de múltipla escolha de qualidade pronta para revisão (status `draft`) no banco do Aprendez.

## Quando usar

- Carregar questões iniciais de um tópico no seed do banco
- Aumentar cobertura de um tópico identificado como gap pelo `exam-coverage`
- Criar variações de uma questão existente

## Quando NÃO usar

- Para revisar fact-accuracy de questão existente → `review-question`
- Para criar texto introdutório/lição → `create-lesson`
- Para questões "discursivas" (não temos esse formato no MVP)

## Inputs

- `track` — `cpa-10` ou `oab`
- `topic_slug` — caminho na ementa (ex: `renda-fixa.titulos-publicos`)
- `difficulty` — 1 (fácil) a 5 (pegadinha de prova)
- `count` — quantas questões (padrão: 5; máximo: 20)
- `style` (opcional) — `application` (aplicação prática), `definition` (definição direta), `comparison` (comparar conceitos), `calculation` (cálculo numérico)

## Processo

1. **Carregar contexto:** ler `content/syllabi/<track>.yaml` e localizar o tópico via `topic_slug`. Extrair `keywords` e `official_reference`.
2. **Cachear ementa no system prompt** — usa prompt caching da API Anthropic. A ementa é grande e estável, o cache reduz custo em 90%.
3. **Chamar Claude Sonnet 4.6** com user prompt pedindo `count` questões em JSON estruturado.
4. **Validar saída contra Zod schema** — se não bater, regenerar a questão problemática (até 2 tentativas).
5. **Inserir no Postgres** — `status='draft'`, `generated_by='claude-sonnet-4-6'`.

## Schema de saída (cada questão)

```json
{
  "stem": "string (markdown, enunciado)",
  "choices": [
    { "key": "A", "text": "string", "correct": false },
    { "key": "B", "text": "string", "correct": true },
    { "key": "C", "text": "string", "correct": false },
    { "key": "D", "text": "string", "correct": false }
  ],
  "explanation": "string (markdown, por que B é correto e os outros não)",
  "source_citation": "string (referência exata da ementa, ex: 'ANBIMA Edital CPA-10 v.2024, módulo 3, item 3.2')",
  "difficulty": 1
}
```

## Princípios de qualidade (instruir o modelo a seguir)

1. **Apenas 1 resposta correta.** Distratores precisam estar errados, não ambíguos.
2. **Distratores plausíveis.** Erros comuns que estudantes reais cometem, não absurdos óbvios.
3. **PT-BR formal mas claro.** Estilo de prova oficial — concurseiro reconhece o tom.
4. **Sem dependência de ano específico** — questão deve sobreviver mudanças de tabela Selic, IPCA, etc. (usar valores hipotéticos quando precisar de números).
5. **Uma única ideia por questão** — não combinar 3 conceitos.
6. **Tamanho:** stem 1-4 frases. Cada alternativa max 1 frase.
7. **Citação precisa** — `source_citation` deve apontar para o item exato da ementa, não vago.

## System prompt template (cacheado)

```
Você gera questões de múltipla escolha para o app Aprendez — preparação para o concurso {track}.

EMENTA OFICIAL ({issuer}, versão {version}):
{full_syllabus_yaml}

REGRAS DE GERAÇÃO:
- Apenas 1 alternativa correta
- Distratores plausíveis (erros comuns reais)
- PT-BR formal, estilo de prova oficial
- Stem: 1-4 frases. Alternativas: max 1 frase cada.
- Cada questão cita o item exato da ementa
- Não usar ano específico (Selic, IPCA, etc.) — preferir valores hipotéticos
- Uma única ideia por questão

OUTPUT: array JSON conforme o schema fornecido pelo usuário. Sem prosa.
```

## Exemplo de uso (CLI)

```bash
pnpm content:generate \
  --track cpa-10 \
  --topic renda-fixa.titulos-publicos \
  --difficulty 3 \
  --count 5
```

## Pós-condição

- Questões inseridas com `status='draft'`
- Telemetria registra: `topic_slug`, `count`, `model`, `tokens_in`, `tokens_out`, `cache_hit_rate`
- Próximo passo automático: `review-question` é chamada na fila

## Falhas comuns a tratar

- Modelo retornou < `count` questões: log warning, segue com o que veio
- JSON malformado: retry com temperature 0.2
- Tópico não encontrado na ementa: erro fatal, abortar
- Questão duplicada (cosine similarity > 0.9 contra existing): descartar e regenerar
