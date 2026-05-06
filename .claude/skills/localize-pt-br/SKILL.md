---
name: localize-pt-br
description: Ajusta texto user-facing para o tom de voz do Aprendez (PT-BR informal, direto, encorajador). Use para copy de UI, push notifications, e-mails, mensagens de erro. Não usar para conteúdo de questões — questões seguem tom formal de prova.
---

# localize-pt-br

Revisa e ajusta texto voltado ao usuário para garantir alinhamento com o tom de voz do Aprendez.

## Quando usar

- Copy nova de UI antes de mergeada
- Mensagens de erro
- Push notifications
- E-mails transacionais e de marketing
- Texto de onboarding

## Quando NÃO usar

- Conteúdo de questões (usa tom formal de prova, é responsabilidade de `generate-question`)
- Documentação técnica para devs (inglês)
- Copy de marketing externo (rede social) — tem tom próprio

## Inputs

- `text` — string a revisar
- `context` — onde aparece (ex: "modal de erro", "push de streak", "checkout")
- `tone_override` (opcional) — `formal` se for caso edge (raríssimo)

## Processo

1. Carregar `BRAND.md` (parte de "Tom de voz") como referência
2. Chamar Claude Sonnet 4.6 com texto + contexto
3. Retornar 1-3 alternativas com explicação de cada escolha

## Schema de saída

```json
{
  "original": "string",
  "issues_found": [
    "Muito formal para o contexto",
    "Usa gerúndio ('estamos processando')"
  ],
  "alternatives": [
    {
      "text": "string",
      "rationale": "Por que está melhor"
    }
  ],
  "recommended_index": 0
}
```

## Princípios para o modelo aplicar

1. **Informal mas competente.** "Bora!", "Mandou bem!" — sim. "E aí, mano" — não.
2. **Encorajador, nunca paternalista.** Sem 🥺, sem "que pena!".
3. **Direto.** Frases curtas. Concurseiro não tem tempo.
4. **Específico em vez de vago.** "Você acertou 7 de 10 em Renda Fixa hoje" > "Bom trabalho!"
5. **2ª pessoa informal** ("você", não "tu" nem "vós")
6. **Sem gerúndio** quando possível ("processamos" > "estamos processando")
7. **Sem emoji em UI**, OK em push (1 max) e e-mail (com parcimônia)
8. **Sem ALL CAPS, sem múltiplos !!!**
9. **Sem corporativês:** "sinergia", "potencialize", "jornada" são vetados

## Exemplos canônicos (incluir no prompt)

| Original | Recomendado |
|---|---|
| "Parabéns pelo seu sucesso!" | "Mandou bem! +10 XP" |
| "Que pena! Não foi dessa vez 😢" | "Quase. A correta era B porque..." |
| "Você completou uma lição!" | "Lição feita. Sua chance de passar subiu pra 64% ↑" |
| "Não esqueça de estudar hoje!" | "Teu streak de 12 dias tá em jogo. 5min resolve." |
| "Ops! Algo deu errado. Por favor, tente novamente." | "Algo travou. Já mandamos o erro pro time. Tenta de novo?" |
| "🌟 Desbloqueie todo o potencial! 🚀" | "Vidas infinitas, simulados ilimitados, sem ads. R$ 19/mês." |

## System prompt

```
Você é o copywriter do Aprendez — app brasileiro de prep para concurso. Sua tarefa: revisar texto user-facing e ajustar para o tom de voz da marca.

TOM DE VOZ:
- Informal mas competente. PT-BR coloquial mas não escroto.
- 2ª pessoa "você". Sem "tu", sem "vós".
- Frases curtas. Verbos no presente. Sem gerúndio.
- Encorajador sem ser paternalista. Sem "que pena!", sem 🥺.
- Específico > vago. Cite números quando possível.
- Sem corporativês: "sinergia", "potencialize", "jornada" são vetados.
- Sem ALL CAPS, sem múltiplos !!!
- Emoji só em push (1 max) ou e-mail. Nunca em UI.

OBJETIVO: retornar 1-3 alternativas em ordem de preferência, com rationale.

OUTPUT: JSON conforme schema fornecido.
```

## Exemplo de uso

```bash
# CLI
pnpm content:localize \
  --context "modal de erro de login" \
  --text "Falha na autenticação. Por favor, verifique suas credenciais e tente novamente."

# Saída:
# 1. "Login não rolou. Confere o e-mail e a senha?"  (recomendado)
# 2. "Não consegui te logar. Tem certeza do e-mail e senha?"
# 3. "Algo travou no login. Tenta de novo?"
```

## Custo

Negligível (Sonnet, payload pequeno). < US$ 0.001 por chamada.
