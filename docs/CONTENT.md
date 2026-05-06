# CONTENT

Pipeline de geração, revisão e manutenção de questões e lições. Crítico porque não temos conteudista no time — IA preenche a lacuna sob supervisão dos engs.

## Princípios

1. **Toda questão cita fonte oficial.** ANBIMA para CPA-10, Edital OAB para OAB. Sem citação, não publica.
2. **Nada vai pra produção sem revisão automatizada (Opus) + sample humano.**
3. **Telemetria reveindica.** Questões com taxa de acerto anômala (>95% ou <20%) re-entram em revisão.
4. **Versionamento.** Editar questão publicada cria nova versão; antiga vira `retired`. Não deletamos.

## Fontes oficiais (single source of truth)

```
content/syllabi/
├── cpa-10.yaml         # ementa ANBIMA CPA-10 (versão atual)
├── oab.yaml            # edital OAB Primeira Fase
└── README.md           # como atualizar quando ementa nova sair
```

Estrutura `cpa-10.yaml`:

```yaml
track: cpa-10
issuer: ANBIMA
version: "2024.1"
exam_format:
  questions: 50
  duration_min: 120
  passing_score: 0.7
topics:
  - slug: sistema-financeiro-nacional
    name: "Sistema Financeiro Nacional e Participantes"
    weight: 0.10
    subtopics:
      - slug: orgaos-reguladores
        name: "Órgãos Reguladores"
        keywords: [CMN, BACEN, CVM, SUSEP]
        official_reference: "Edital ANBIMA CPA-10 v.2024, módulo 1, item 1.1"
  - slug: etica
    name: "Ética, Regulamentação e Análise do Perfil do Investidor"
    weight: 0.15
    ...
```

## Pipeline de geração

```
ementa.yaml (single source)
    │
    ▼
[skill: generate-question]
    Input: { topic_slug, difficulty, count, style }
    Claude API (Sonnet 4.6) com prompt cacheado
    Output: questões em JSON estruturado
    │
    ▼
INSERT em `questions` (status='draft')
    │
    ▼
[skill: review-question]
    Claude API (Opus 4.7) re-checa:
      - Fact accuracy contra source_citation
      - Apenas 1 alternativa correta
      - Distratores plausíveis (não absurdos)
      - PT-BR correto
      - Não duplicada (similarity vs `published`)
    Output: confidence 0-1 + diff sugerido
    │
    ▼
Se confidence ≥ 0.85 → status='review' (fila p/ humano)
Se confidence < 0.85 → status='draft' + flag
    │
    ▼
Admin dashboard (web)
    Eng aprova → status='published'
    Eng rejeita → archive, feedback para retreinar prompt
```

## Comandos

```bash
# Gerar 50 questões CPA-10 do tópico "renda-fixa", dificuldade 2-3
pnpm content:generate cpa-10 renda-fixa --difficulty 2-3 --count 50

# Rodar review em tudo que está draft
pnpm content:review

# Auditoria de cobertura (skill exam-coverage)
pnpm content:audit cpa-10
# saída:
#   ✅ Sistema Financeiro: 80 questões (alvo: 50) 
#   ⚠️  Ética: 30 questões (alvo: 75) — falta 45
#   ✅ Renda Fixa: 120 questões (alvo: 100)
```

## Cobertura alvo MVP

| Track | Questões mínimas para lançar |
|---|---|
| CPA-10 | 500 (10x o tamanho da prova) |
| OAB | 800 (10x o tamanho da Primeira Fase) |

Distribuição proporcional ao peso da ementa. Ex: CPA-10 com peso "Renda Fixa" 0.20 → 100 questões só de Renda Fixa.

## Lições (didática)

Lições agrupam 5-10 questões por nível de dificuldade. Estrutura:

1. **Intro** (skill `create-lesson`): 2-3 frases explicando o conceito do nível
2. **Questões progressivas** (já existentes do banco)
3. **Resumo final** (auto-gerado): 1 parágrafo do que aprendeu

5 níveis por tópico, dificuldade crescente:
- N1: definições básicas
- N2: aplicação direta
- N3: comparação entre conceitos
- N4: cálculos / aplicação prática
- N5: pegadinhas estilo prova

## Métricas de qualidade

Por questão, calcular semanalmente:

- `attempt_count` — total de tentativas
- `accuracy` — % de acerto
- `avg_time_ms` — tempo médio de resposta
- `dispute_count` — quantos usuários abriram "contestar"

Flags automáticas:

- `accuracy > 0.95 && attempt_count > 50` → muito fácil → re-revisar
- `accuracy < 0.20 && attempt_count > 50` → erro provável → re-revisar
- `dispute_count >= 3` → revisar urgente
- `avg_time_ms < 5000` → trivial demais → considerar dificuldade menor

## Loop de melhoria

Toda terça às 10h: skill `exam-coverage` roda automaticamente, gera relatório PR no GitHub com:
- Gaps de cobertura novos
- Questões flagged
- Sugestões de geração

Eng on-call de conteúdo (rotação semanal entre os 5) revisa e aprova.

## Revisão humana — quanto pesa

- Cada eng: **30min/semana** revisando questões em fila
- Throughput esperado: 30 questões/eng/semana = 150/semana = 600/mês
- Suficiente para manter banco crescendo + correções

## O que NÃO fazer

- ❌ Não copiar questões de provas oficiais antigas (direito autoral). Inspirar-se no estilo, sim.
- ❌ Não publicar questão sem `source_citation`.
- ❌ Não editar `content/syllabi/*.yaml` sem PR review (é a fonte de verdade).
- ❌ Não usar GPT/Gemini "porque é mais barato" — toolchain padronizada em Claude por consistência de qualidade.
