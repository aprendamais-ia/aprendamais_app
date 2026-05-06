# BRAND

Identidade visual, mascote, tom de voz. Aplicar em UI, marketing, push notifications, e-mails.

## Nome

**Aprendez.** Decidido. Domínios alvo: `aprendez.com.br` (primário), `aprendez.app` (fallback).

## Posicionamento em 1 frase

> "O jeito mais leve de passar no concurso."

## Cores

### Primárias

| Token | Hex | Uso |
|---|---|---|
| `--brand-green` | `#009C3B` | CTAs primários, mascote, streak ativo |
| `--brand-yellow` | `#FFDF00` | Acentos, XP, estrelas, conquistas |

(Apropriação suave da bandeira, sem virar clichê. Verde domina; amarelo é acento, nunca fundo.)

### Funcionais

| Token | Hex (light) | Hex (dark) | Uso |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0E14` | Fundo |
| `--surface` | `#F7F8FA` | `#141921` | Cards |
| `--text` | `#0F172A` | `#E2E8F0` | Texto principal |
| `--text-muted` | `#64748B` | `#94A3B8` | Texto secundário |
| `--success` | `#16A34A` | `#22C55E` | Resposta correta |
| `--error` | `#DC2626` | `#EF4444` | Resposta errada / vidas |
| `--streak` | `#F97316` | `#FB923C` | Chama do streak (não confundir com error) |
| `--premium` | `#A855F7` | `#C084FC` | Indicadores premium |

Dark mode é **default** entre 19h-7h horário do usuário (concurseiros estudam de madrugada).

## Tipografia

- **Display / títulos:** [Sora](https://fonts.google.com/specimen/Sora) (sans-serif geométrica, BR-friendly por ter ç e acentos bem desenhados)
- **Corpo / UI:** [Inter](https://fonts.google.com/specimen/Inter) (legibilidade matadora em telinha de celular)
- **Mono (código/datas):** [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

Self-host via `next/font` para LCP < 2s no 4G brasileiro.

## Mascote

3 opções para validar com usuários do beta. Recomendação interna em ordem:

### 1. Capivara (recomendada)

- **Por quê:** meme nacional consolidado, simpática, conota "estudo constante e calmo" — antídoto da ansiedade do concurseiro
- **Nome propõe:** "Cabi" (de Capivara + Concurso)
- **Estados:** feliz (acerto), pensativa (ainda decidindo), comemorando (level up), dormindo (streak dormente)

### 2. Onça-pintada

- Conota força, foco, "predador da prova"
- Vibe mais agressiva, pode atrair quem gosta de "modo guerra" mas afasta o público que quer leveza

### 3. Tucano

- Bonito, colorido, brasileiro
- Mais raso emocionalmente, menos meme-able

**Decisão final:** rodar enquete na semana 6 com 50 betas.

## Tom de voz

### Princípios

1. **Informal mas competente.** "Bora!", "Mandou bem!", "Vamo que vamo" — sim. "E aí, mano" — não.
2. **Encorajador, nunca paternalista.** "Errou, mas tá entendendo o conceito" > "Você tentou! 🥺"
3. **Direto.** Frases curtas. Concurseiro não tem tempo.
4. **Específico.** "Você acertou 7 de 10 em Renda Fixa hoje" > "Bom trabalho!"

### Exemplos canônicos

| Contexto | ✅ Use | ❌ Evite |
|---|---|---|
| Acerto | "Mandou bem! +10 XP" | "Parabéns pelo seu sucesso!" |
| Erro | "Quase. A correta era B porque..." | "Que pena! Não foi dessa vez 😢" |
| Lição completa | "Lição feita. Sua chance de passar subiu pra 64% ↑" | "Você completou uma lição! Continue assim!" |
| Push de streak | "Teu streak de 12 dias tá em jogo. 5min resolve." | "Não esqueça de estudar hoje! 💪" |
| Erro técnico | "Algo travou. Já mandamos o erro pro time. Tenta de novo?" | "Ops! Algo deu errado. Por favor, tente novamente mais tarde." |
| Premium upsell | "Vidas infinitas, simulados ilimitados, sem ads. R$ 19/mês." | "🌟 Desbloqueie todo o potencial dos seus estudos! 🚀" |

### Conjugação

- Sempre **2ª pessoa informal** ("você", não "tu" nem "vós")
- Verbos no presente sempre que possível
- Evitar gerúndio ("estamos processando" → "processamos")

## Iconografia

- Lib: [Lucide](https://lucide.dev) (consistente com shadcn/ui)
- Estilo: outline, stroke 2px
- **Não misturar com emoji** em UI (só em copy de push e e-mail, com moderação)

## Uso de emoji

| Onde | Permitido? |
|---|---|
| Push notifications | Sim, 1 por mensagem máximo |
| E-mails de marketing | Sim, com parcimônia |
| UI do app | **Não** (substituir por ícone Lucide) |
| Erros | Não |
| Copy de marketing | Sim |

## Logos

A criar (semana 1):
- `logo-full.svg` — nome "Aprendez" + mascote
- `logo-mark.svg` — só mascote
- `logo-mono.svg` — versão preto/branco para impressão
- `favicon.ico`, `apple-touch-icon.png`, `manifest-icon-*.png`

Gerar com skill `design-component` ou IA externa, refinar à mão.

## Voz nas redes (TikTok/Instagram)

- TikTok: vídeos de 15-30s com a Cabi explicando 1 conceito difícil de prova de jeito meme
- Instagram: carrosséis "5 erros mais comuns no CPA-10" estilo lista
- LinkedIn: cases de aprovação verificada (depois que tivermos)
- Não fazer Twitter/X.

## O que NÃO fazer

- ❌ Cores de gradient roxo-rosa (cliché de fintech, não somos fintech)
- ❌ Mascote falando em primeira pessoa ("Eu sou a Cabi e estou animada com você!") — cringe
- ❌ Animação Lottie pesada na home (LCP)
- ❌ Mensagens em ALL CAPS
- ❌ Linguagem corporativa ("sinergia", "potencialize", "jornada")
