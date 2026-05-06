# RESEARCH

Notas da pesquisa de mercado, comportamento do usuário, e fontes que embasam as decisões deste projeto.

## Pergunta 1 — Brasileiros estudam mais por mobile ou desktop?

**Resposta: mobile, e por uma margem absurda.**

- **96.8% dos estudantes de escola pública** e **98.5% de privada** acessam internet primariamente pelo celular ([EAD.com.br](https://www.ead.com.br/blog/celular-ou-computador))
- Tablets ganhando espaço entre concurseiros adultos por causa da escrita digital
- Concurseiros adultos usam combo: celular para sessões curtas (deslocamento, intervalo) + desktop/tablet para sessões longas (simulado, leitura profunda)
- 70%+ das transações digitais no BR são Pix — implicação: pagamento mobile-first é obrigatório

**Implicação para Aprenda Mais:**
- PWA mobile-first
- Toda decisão de UX defaulta pro portrait mobile
- Modo simulado precisa funcionar bem em tablet também (consideração de Fase 2)

## Pergunta 2 — Quem são os concorrentes?

### Diretos (gamificação + concurso)

- **LIA (Thomson Reuters)** — game jurídico para OAB/ENADE/concurso. Estilo gamificado mas formato course-based. Fonte: [Thomson Reuters](https://www.thomsonreuters.com.br/pt/sala-de-imprensa/thomson-reuters-lanca-primeiro-game-de-formacao-juridica-do-brasil.html). Risco: backed por gigante, mas parece pouco viral entre concurseiros.
- **Acertei** — questões em níveis estilo jogo. Mecânica leve, sem o loop completo de Duolingo.

### Adjacentes (sem gamificação real)

- **QConcursos** — banco de questões massivo (Brasil's leading), mas UI passiva, sem engajamento contínuo. Vulnerabilidade: experiência sem alma.
- **Estratégia Concursos** — videoaulas longas, plataforma course-based. R$ 600-2000/ano. Mercado-alvo diferente (estudantes mais hardcore).
- **Gran Cursos Online** — similar ao Estratégia, 20+ anos de mercado.
- **Passei Direto** — 32M+ alunos cadastrados, mais ENEM/universidade. Pouca relevância para concurso/OAB sério.

**Conclusão competitiva:** ninguém está fazendo "Duolingo" de verdade pra concurso. LIA é o mais próximo mas está focado só em direito e não tem viralidade visível. Janela aberta.

Fontes:
- [TechTudo — 7 melhores apps para estudar para concurso 2025](https://www.techtudo.com.br/listas/2025/08/7-melhores-apps-para-estudar-para-concurso-pelo-android-e-iphone-ios-edapps.ghtml)
- [QConcursos](https://www.qconcursos.com/)
- [Estratégia Concursos](https://www.estrategiaconcursos.com.br/)

## Pergunta 3 — Quão grande é o mercado?

- **160 mil+ vagas** em concursos públicos previstos para 2026 ([Estratégia](https://www.estrategiaconcursos.com.br/blog/concursos-2026/))
- Salários iniciais até R$ 30 mil — incentivo financeiro forte
- Estimativa de candidatos por vaga em concursos federais: 20-200x → milhões de concurseiros ativos
- CPA-10 especificamente: descontinuada em dez/2025; público em transição até dez/2026 (ver seção "ALERTA — CPA-10 descontinuada" abaixo)
- OAB: ~150 mil candidatos por exame, 3 exames/ano = ~450 mil/ano (parte são repescagens)

**TAM bruto (BR):** algo entre 3M-10M concurseiros ativos a qualquer momento. Mercado fragmentado, ninguém domina sozinho.

## Pergunta 4 — Quanto pagam?

- Cursinhos online tradicionais: R$ 50-200/mês ou R$ 600-2000/ano
- Apps com gamificação: free + premium R$ 15-30/mês (referência: Duolingo Super R$ 39,90/mês BR)
- QConcursos premium: R$ 30-50/mês

**Pricing alvo Aprenda Mais:**
- Free: limitado (5 vidas/dia, 1 simulado/semana)
- Premium: **R$ 19,90/mês** ou **R$ 119/ano** (50% desconto anual)
- Pix anual com desconto adicional de 10% (R$ 107)

## Pergunta 5 — Por que Duolingo funciona e como replicar?

Mecânicas comprovadas em 700M+ usuários:
1. **Streak** — perda emocional de quebrar é maior que ganho de manter (loss aversion)
2. **Ligas** — comparação com pares cria pressão saudável; "30 pessoas na sua liga" é o número mágico (íntimo o suficiente)
3. **Sessões curtas** (5-10min) — encaixam em momentos mortos
4. **Mascote consistente** — Duo virou meme, brand recall enorme
5. **Notificações dramáticas** — limite tênue mas funciona ("Duo está triste")

**O que NÃO replicar:**
- Vendar vidas (R$) — fere ética, vai contra nossa filosofia
- Notificações passive-aggressive
- Anúncios entre lições (vamos depender de Premium)

## Comportamento específico do concurseiro brasileiro

(Sem fonte formal — síntese de fóruns, depoimentos, e nossa intuição. Validar com beta na semana 6.)

- **Estuda em ciclos:** intensifica nas 8 semanas pré-prova, relaxa depois
- **Ansiedade alta:** próximo a prova, qualquer feature que "salve tempo" tem alto valor
- **Confia em métricas:** quer dashboards, gráficos, percentuais — diferente do estudante de idioma
- **Compartilha menos publicamente:** vergonha de admitir que está estudando para X concurso (diferente do "estou aprendendo francês 🇫🇷"). Implicação: sem pressão de social feed público, mas amigos próximos sim.

## Pergunta 6 — Por que React Native foi rejeitado para o MVP?

- Time é full-stack web — ramp-up em RN/Expo custa 2-4 semanas
- iOS Web Push agora funciona em PWA (iOS 16.4+), reduzindo a urgência de native
- Capacitor wrap futuro custa <1 semana se decidirmos lojar
- Discoverability via SEO Google.com.br só funciona em PWA, não em native

Resumo: native não traz benefício suficiente para o custo no MVP.

## Pergunta 7 — Por que Supabase em vez de Firebase?

- **Postgres > Firestore** para queries de cobertura e leaderboard (joins, agregações)
- **Vendor lock-in menor** — podemos migrar para qualquer Postgres se sair do Supabase
- **RLS** é mais robusto que regras de Firestore
- **Realtime via Postgres CDC** funciona bem para leaderboard de 30 pessoas

## Fontes consolidadas

- [EAD.com.br — Celular ou computador](https://www.ead.com.br/blog/celular-ou-computador)
- [TechTudo — 7 apps para concurso](https://www.techtudo.com.br/listas/2025/08/7-melhores-apps-para-estudar-para-concurso-pelo-android-e-iphone-ios-edapps.ghtml)
- [Thomson Reuters — LIA](https://www.thomsonreuters.com.br/pt/sala-de-imprensa/thomson-reuters-lanca-primeiro-game-de-formacao-juridica-do-brasil.html)
- [Estratégia Concursos — Concursos 2026](https://www.estrategiaconcursos.com.br/blog/concursos-2026/)
- [QConcursos](https://www.qconcursos.com/)
- Protótipo atual: `https://cpa10.abacusai.app/`

## Decisão: pivô para Nova CPA (2026-05-06)

Após confirmação da descontinuação da CPA-10 (ver seção abaixo), o time decidiu pivotar o vertical ANBIMA do MVP para a **Nova CPA** — substituta direta no portfólio ANBIMA Edu, mesmo perfil de comprador (varejo de investimentos), maior overlap de candidatos.

- `tracks.slug='cpa-10'` marcada com `active=false` (preserva histórico, mas sumiu do onboarding)
- `tracks.slug='nova-cpa'` adicionada como `active=true`
- Conteúdo programático da Nova CPA precisa ser validado contra material oficial ANBIMA Edu antes de geração — `content/syllabi/nova-cpa.yaml` ainda não existe; criação bloqueada até alguém do time levantar o programa detalhado oficial
- Geração de conteúdo Nova CPA fica em backlog até a yaml existir; OAB segue como vertical primário do MVP

C-Pro I considerada mas descartada para MVP por ter pool menor de candidatos e conteúdo mais técnico (operadora). Pode entrar em V2.

## ⚠️ ALERTA — CPA-10 descontinuada (descoberto 2026-05-05)

Pesquisa via WebFetch no site oficial ANBIMA confirmou:

> "A CPA-10 está sendo descontinuada. Transição das certificações CPA-10, CPA-20 e CEA vai começar com prazo até dezembro de 2026."

**Fatos:**
- CPA-10 saiu de catálogo em 12/2025
- Substitutas: nova **CPA**, **C-Pro I** (Profissional de Investimento - Operadora), e **microcertificações** no ANBIMA Edu
- Profissionais com CPA-10 válida precisam, até dez/2026:
  - Concluir microcertificações obrigatórias na ANBIMA Edu
  - Pagar taxa de atualização anual

**Implicações para o produto:**

1. **Track CPA-10 vira legado.** Continua útil para quem está revisando para microcertificações de transição, mas mercado encolhe até zerar em dez/2026.
2. **Track novo precisa ser definido.** Avaliar:
   - **Nova CPA** (substituta direta) — provável escolha
   - **C-Pro I** (perfil mais amplo de investimentos) — mais novo, menos competidores
   - **Microcertificações** específicas (granular, mais SKUs)
3. **Não desperdiçar geração de conteúdo CPA-10** antes de validar se queremos o legado. Sugestão: priorizar OAB nas primeiras 500 questões e definir o segundo vertical ANBIMA até semana 4.

**Fontes:**
- [ANBIMA — CPA-10](https://www.anbima.com.br/pt_br/educar/certificacoes/cpa-10.htm)
- [ANBIMA Edu](https://anbimaedu.com.br/certificacao/cpa)
- [PD CPA-10 v6.8 (vigente até 03/2025)](https://www.anbima.com.br/data/files/32/94/93/09/BCCA49108056A849EA2BA2A8/PD%20CPA-10_versao%206.8%20_vigencia%2003.03.2025_%20Limpo.pdf)

## OAB — pesos confirmados (2026-05-05)

Distribuição confirmada de questões na 1ª Fase via análise de provas FGV:

| Disciplina | Questões | Peso |
|---|---|---|
| Direito Civil | 9 | 11.25% |
| Ética Profissional | 8 | 10.00% |
| Direito Penal | 7 | 8.75% |
| Direito Constitucional | ~6 | ~7.50% |
| Direito Processual Civil | ~6 | ~7.50% |
| Tributário, Administrativo, Trabalho, Processo Trabalho, Processo Penal, Empresarial | 5 cada | 6.25% cada |
| Filosofia, DH, Internacional, ECA, Ambiental, Consumidor, Financeiro, Eleitoral, Previdenciário | 2 cada | 2.50% cada |
| **Total** | **80** | **100%** |

Aplicação prática: `oab.yaml` foi atualizado com `weight` proporcional e `questions_in_exam` exato por módulo. Geração de conteúdo deve respeitar esses pesos para não desperdiçar esforço em disciplina de baixo retorno.

Fonte: [Estratégia OAB — assuntos mais cobrados FGV](https://oab.estrategia.com/portal/oab-1-fase-assuntos-mais-cobrados-fgv/) cruzado com [calendário 46º Exame](https://blog.bizu.com.br/calendario-oab-2026-veja-as-datas-previstas-para-o-46o-47o-e-48o-exame/) e [edital](https://s.oab.org.br/arquivos/2026/01/695d6c9c-e9d3-4054-ae89-2aa5101eb5e6.pdf).

## Pendente para validar com beta

- Tom de voz: "bora!" funciona ou parece infantil para advogado de 30 anos?
- Mascote: capivara vence onça/tucano?
- Pricing: R$ 19,90/mês é doce? Testar R$ 14,90 vs R$ 24,90.
- Push notification timing: 19h é bom ou cada um quer escolher?
- Premium feature mais valiosa: vidas infinitas, simulados ilimitados, ou modo offline?
