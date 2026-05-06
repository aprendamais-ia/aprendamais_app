# VISION

## O problema

Concurseiros brasileiros estudam errado. As plataformas dominantes (Estratégia Concursos, Gran Cursos, QConcursos) vendem **horas de videoaula** e **bancos passivos de questões**. O usuário assiste, resolve, esquece — sem feedback adaptativo, sem hábito diário, sem mecânica que prenda. Taxas de desistência são absurdas: a maioria não chega ao dia da prova.

CPA-10 e OAB foram inicialmente escolhidos como verticais do MVP. **Atualização de 2026-05-05:** a CPA-10 foi **descontinuada em dez/2025** pela ANBIMA. Novas certificações entraram em vigor em jan/2026 (CPA, C-Pro I/R + microcertificações no ANBIMA Edu). Profissionais em transição têm até dez/2026 para concluir microcertificações. Implicação: o track CPA-10 vira **legado** (mercado de transição até dez/2026), e o vertical primário ANBIMA precisa pivotar para a **nova CPA** ou **C-Pro I**.

OAB segue inalterada e continua sendo um mercado com:
- Ementa estável e pública (Edital Unificado FGV)
- Prova padronizada (80q, 5h, 50% para passar)
- Público motivado pagando (R$ 200-2000 em cursinhos hoje)
- ~150 mil candidatos/exame, 3 exames/ano

## A oportunidade

Pegar a mecânica que o **Duolingo provou** funcionar em escala (700M+ usuários globais, retenção via streak/ligas/XP) e aplicar em domínio onde o ROI emocional do usuário é altíssimo: passar no concurso muda a vida da pessoa.

Diferente de aprender idioma (longo prazo, fim aberto), prep de prova tem **deadline duro** e **resultado binário**. Isso muda o desenho:
- Streak e XP são meio, não fim
- O fim é **probabilidade estimada de aprovação** — nosso north star
- Ligas e social criam pressão saudável de pares
- Modo "simulado oficial" sem gamificação espelha o dia da prova

## Para quem

**Persona principal:** "Júnior, 26, bancário em SP, quer trocar de área para investimentos via CPA-10. Estuda 30-90min/dia no metrô e à noite, no celular Android. Já tentou cursinho online, parou na semana 3 por tédio. Pagaria R$ 30/mês se sentisse que está progredindo."

**Persona secundária:** "Marina, 24, recém-formada em Direito, vai prestar OAB em 6 meses. Estuda 2-4h/dia, alterna celular e notebook. Quer simulados realistas e métricas de progresso confiáveis."

## Diferencial em 1 frase

> "O único app que te diz, em tempo real, qual a sua chance de passar na próxima prova — e o que estudar agora pra subir esse número."

## Princípios de produto

1. **Mobile-first absoluto.** 97% dos brasileiros em educação acessam pelo celular. Toda decisão de UX defaulta pro mobile portrait.
2. **Bite-sized obrigatório.** Nenhuma sessão precisa durar mais que 5min pra agregar XP. Sessões longas (simulado) são modo separado.
3. **Feedback < 1s.** Resposta da API pra próxima questão tem que ser instantânea. Pré-fetch de 3 questões à frente.
4. **Conteúdo sempre auditável.** Toda questão cita ementa oficial. Usuário pode contestar; admin revisa.
5. **Pix é primeira-classe.** Botão Pix maior que cartão na tela de checkout. 70%+ dos pagamentos digitais no BR são Pix.
6. **Sem dark patterns.** Cancelar assinatura é 1 clique. Streak freeze grátis. Não vendemos vidas para "não perder o progresso".

## O que NÃO somos

- Não somos cursinho. Não vendemos videoaulas longas.
- Não somos banco passivo de questões. Toda questão é parte de uma trilha adaptativa.
- Não somos rede social. Leaderboard é por liga; sem feed, sem chat, sem perfil público.
- Não somos plataforma multi-vertical genérica. Cada concurso tem ementa e mecânica próprias, especializadas.

## Métricas de sucesso (12 meses)

- **D7 retention:** > 35% (Duolingo está em ~50%, mas educação cara é mais difícil)
- **DAU/MAU:** > 40% (sinal de hábito real)
- **Taxa de conversão para Premium:** > 4% (benchmark edtech)
- **Taxa de aprovação verificada:** > 70% dos usuários ativos que chegam ao dia da prova (validação do north star)

Roadmap concreto em [`ROADMAP.md`](ROADMAP.md).
