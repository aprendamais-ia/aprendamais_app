# GAMIFICATION

Especificação completa das mecânicas. Toda regra com número definido aqui é fonte de verdade — implementação no `modules/gamification/` e Postgres triggers deve refletir.

## Filosofia

Inspiração direta no Duolingo, com 3 ajustes para o público concurseiro:

1. **North star = probabilidade de aprovação**, não XP. XP é meio.
2. **Trilha sequencial.** Usuário avança por fases desbloqueadas, não por menus. Foco em loop diário curto.
3. **Sem dark patterns.** Streak freeze grátis (1/semana). Cancelar premium em 1 clique. Não vendemos "salvar streak por R$ X".

## XP

| Ação | XP base |
|---|---|
| Questão correta (dificuldade 1) | 5 |
| Questão correta (dificuldade 2-3) | 10 |
| Questão correta (dificuldade 4-5) | 15 |
| Questão errada | 0 |
| Lição completa (todas corretas) | +20 bônus |
| Streak de 5 acertos seguidos na sessão | +10 bônus |
| Fase desbloqueada (ao concluir 1ª vez) | +30 bônus |

XP nunca diminui. Acumula em `profiles.xp_total` e em `league_members.weekly_xp` (zera segunda).

## Vidas (corações)

- Máximo: **5**
- Perde 1 ao errar uma questão (modo `lesson`, não `revisao`)
- Regen: **+1 a cada 30 minutos**
- Vidas zeradas: bloqueia novas lições por até 30min, mas permite modo `revisao` (sem perder vida)
- **Premium:** vidas infinitas

Implementação: `profiles.lives` + `lives_regen_at`. Cliente calcula vidas atuais com `min(5, lives + floor((now - lives_regen_at) / 30min))`.

## Streak diário

- Conta dias consecutivos com pelo menos **1 questão respondida**
- Timezone: `America/Sao_Paulo`. "Dia" é 00:00-23:59 BRT.
- **Streak freeze:** 1 grátis por semana, regen toda segunda. Premium ganha 3.
- Quebrou: streak vai para 0 no dia seguinte ao freeze acabar
- UI: chama 🔥 com número. Cor: cinza < 3 dias, laranja 3-7, vermelho 7+, dourado 30+

## Ligas semanais

- **10 tiers:** Bronze, Prata, Ouro, Safira, Rubi, Esmeralda, Ametista, Pérola, Diamante, Lendas
- **30 usuários por liga** (matchmaking via `league_members` count)
- Reset toda **segunda 00:00 BRT**
- **Top 10:** sobem de tier
- **Bottom 5:** descem de tier
- **Meio (11-25):** mantêm tier
- Lendas: top 3 entram no "Hall da Glória" mensal (badge especial, sem subir mais)

Implementação: cron Vercel toda segunda 00:00 BRT roda função Postgres `weekly_league_close()`.

## Conquistas (achievements)

Lista inicial (expandir conforme telemetria):

| Code | Nome | Trigger |
|---|---|---|
| `first_lesson` | Primeira Lição | Completou 1ª lição |
| `streak_7` | Semana de Fogo | Streak ≥ 7 |
| `streak_30` | Mês de Disciplina | Streak ≥ 30 |
| `streak_100` | Centenário | Streak ≥ 100 |
| `100_questions` | Centena | 100 questões respondidas |
| `1000_questions` | Milhar | 1000 questões respondidas |
| `100_<topic>` | Especialista em \<tópico\> | 100 questões corretas em um tópico específico |
| `module_complete` | Módulo dominado | Concluiu todas as fases de um módulo da ementa |
| `top_3_league` | Pódio | Top 3 em qualquer liga |
| `lendas` | Liga das Lendas | Chegou em Lendas |

## Probabilidade de aprovação (north star)

Mostrada na home com gauge:

```
Sua chance de passar na CPA-10:  68% ↑
                                 ▓▓▓▓▓▓░░░░ 
Próximo objetivo: dominar "Risco e Retorno" (+8%)
```

**Modelo MVP (heurístico, depois ML):**

```
P(aprovação) = média ponderada por peso da ementa de:
  P(acerto no tópico T) = sigmoid( bayesian_avg(skill_level[T], confidence) )

onde skill_level[T] vem de média móvel de acertos recentes em T,
confidence cresce com número de questões já feitas em T.
```

Calibração: backtesting com lições e modo revisão como proxy de prova. Refinar depois com dados de aprovação real auto-reportada.

## Notificações push

Estratégia mínima (não spam):

| Evento | Quando | Texto exemplo |
|---|---|---|
| Lembrete diário | 19h horário do usuário | "Bora bater seu streak de hoje? 5min só 🔥" |
| Streak em risco | 21h se ainda 0 atividade hoje | "Falta pouco pra perder seu streak de 12 dias!" |
| Vidas regeneradas | quando vidas voltam a 5 | "Seus 5 corações voltaram. Manda mais uma lição!" |
| Liga fechando | domingo 18h | "Faltam 6h pra fechar a liga. Você está em #15 — top 10 sobem!" |
| Subiu de liga | segunda 00:05 | "🎉 Promoção! Bem-vindo à Liga Esmeralda." |

Usuário pode desligar cada categoria separadamente.

## O que NÃO incluir (decisões explícitas)

- ❌ **Heart packs pagos** (vender vidas) — vai contra a filosofia
- ❌ **Anúncios entre lições** — vamos depender de Premium, não de ads
- ❌ **Combos por dinheiro** — XP é só por estudo
- ❌ **Notificações de FOMO** ("você caiu pro #25 da liga, volta agora!")
