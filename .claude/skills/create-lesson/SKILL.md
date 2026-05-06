---
name: create-lesson
description: Cria lições bite-sized (intro + sequência de questões + resumo) para um tópico em um nível específico. Use quando montar trilha de aprendizado para um tópico novo. Diferente de generate-question — esta orquestra questões já existentes em uma narrativa pedagógica.
---

# create-lesson

Monta uma lição bite-sized de 5-10 questões com texto introdutório, ordem pedagógica e resumo final.

## Quando usar

- Criar trilha de lições para um tópico novo após ter ≥30 questões publicadas naquele tópico
- Refazer lição existente com base em novas questões publicadas

## Quando NÃO usar

- Para criar questões → `generate-question`
- Para revisar conteúdo factual → `review-question`

## Inputs

- `track`
- `topic_slug`
- `level` — 1-5 (níveis do tópico)
- `target_size` — 5 a 10 questões (padrão: 7)

## Processo

1. **Carregar questões `published` do `topic_slug`** com `difficulty` adequada ao `level`:
   - N1: difficulty 1
   - N2: difficulty 1-2
   - N3: difficulty 2-3
   - N4: difficulty 3-4
   - N5: difficulty 4-5
2. **Verificar volume:** se < `target_size` questões disponíveis, abortar com mensagem `gap_in_topic`.
3. **Selecionar e ordenar:** Claude Sonnet 4.6 escolhe `target_size` questões e propõe ordem de complexidade crescente, evitando repetir o mesmo subtópico em sequência.
4. **Gerar intro:** 2-3 frases explicando o conceito do nível, em tom Aprenda Mais (ver `BRAND.md`).
5. **Gerar resumo:** 1 parágrafo recapitulando o que foi praticado.
6. **Inserir** em `lessons` com `question_ids` na ordem escolhida.

## Schema de saída

```json
{
  "title": "string (max 50 chars)",
  "intro": "string (markdown, 2-3 frases)",
  "question_ids": ["uuid", "uuid", ...],
  "outro": "string (markdown, 1 parágrafo)",
  "level": 2
}
```

## Tom da intro/outro

Seguir [`docs/BRAND.md`](../../../docs/BRAND.md):
- Informal mas competente
- Frases curtas
- 2ª pessoa ("você")
- Sem emoji na UI (mas pode usar metáfora simples)

**Exemplo bom:**
> "Renda fixa parece chata, mas é onde 30% da prova mora. Aqui você pratica os títulos públicos que mais caem: Tesouro Selic, Prefixado e IPCA+."

**Exemplo ruim:**
> "Bem-vindo ao maravilhoso mundo da renda fixa! 🎉 Vamos juntos nessa jornada incrível de aprendizado!"

## System prompt

```
Você monta lições bite-sized para o app Aprenda Mais.

CONTEXTO DO APP:
- Lições têm 5-10 questões cada
- Tom informal, encorajador, direto (ver BRAND.md)
- Intro: 2-3 frases que motivam e contextualizam, sem ser fofo demais
- Outro: 1 parágrafo recapitulando, sem repetir a intro

ENTRADA: lista de questões publicadas no tópico {topic_slug} no nível {level}.

TAREFA:
1. Selecionar {target_size} questões da lista
2. Ordenar por complexidade crescente; não repetir subtópico em sequência se possível
3. Escrever título (max 50 chars), intro, e outro

OUTPUT: JSON conforme schema.
```

## Exemplo de uso

```bash
pnpm content:create-lesson \
  --track cpa-10 \
  --topic etica.suitability \
  --level 2
```

## Custo

Baixo (Sonnet, contexto pequeno). ~US$ 0.005 por lição.

## Falhas comuns

- Não há questões suficientes: retornar erro `gap_in_topic` para que o on-call de conteúdo gere mais
- Modelo escolheu menos questões que o pedido: retry com instrução mais firme
