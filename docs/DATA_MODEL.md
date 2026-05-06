# DATA MODEL

Schema Postgres do Supabase. Toda tabela tem RLS habilitada.

## Convenções

- Nomes de tabela em `snake_case` plural (`questions`, `attempts`)
- IDs `uuid` default `gen_random_uuid()`
- `created_at`, `updated_at` em toda tabela (`timestamptz default now()`)
- Soft delete via `deleted_at` apenas onde audit importa
- FKs sempre com `on delete cascade` ou `on delete restrict` explícito
- Índices em toda FK + colunas de filtro frequente

## Tabelas

### `tracks` — trilhas (CPA-10, OAB, etc.)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| slug | text unique | `cpa-10`, `oab` |
| name | text | "CPA-10", "OAB Primeira Fase" |
| issuer | text | "ANBIMA", "OAB Federal" |
| exam_format | jsonb | `{ questions: 50, duration_min: 120, passing_score: 0.7 }` |

### `topics` — tópicos da ementa
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| track_id | uuid FK tracks | |
| parent_id | uuid FK topics nullable | hierarquia |
| slug | text | `renda-fixa.titulos-publicos` |
| name | text | |
| weight | float | peso na prova (0-1) |
| order | int | |

### `questions` — banco de questões
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK topics | |
| difficulty | int | 1-5 |
| stem | text | enunciado em markdown |
| choices | jsonb | `[{key:"A", text:"...", correct:true}, ...]` |
| explanation | text | markdown, com citação |
| source_citation | text | "ANBIMA Edital CPA-10 v.2024, item 3.1" |
| status | text | `draft` \| `review` \| `published` \| `retired` |
| quality_score | float | calculado de `attempts` (default null) |
| generated_by | text | `human` \| `claude-sonnet-4-6` \| `claude-opus-4-7` |
| reviewed_by | uuid FK profiles nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Index: `(topic_id, status, difficulty)` para query do engine.

### `lessons` — agrupamento didático de questões
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| topic_id | uuid FK topics | |
| order | int | |
| title | text | |
| intro | text | markdown curto |
| question_ids | uuid[] | ordem fixa para a lição |
| level | int | 1-5 (níveis do tópico) |

### `profiles` — usuário (estende `auth.users`)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK FK auth.users | |
| display_name | text | |
| avatar_url | text nullable | |
| primary_track_id | uuid FK tracks | |
| skill_level | jsonb | `{ "renda-fixa": 0.7, ... }` por tópico, atualizado por trigger |
| xp_total | int default 0 | |
| lives | int default 5 | |
| lives_regen_at | timestamptz nullable | próximo regen |
| streak_days | int default 0 | |
| streak_freezes | int default 1 | |
| last_active_date | date | timezone America/Sao_Paulo |
| premium_until | timestamptz nullable | |
| target_exam_date | date nullable | dia da prova do usuário |
| created_at | timestamptz | |

### `attempts` — tentativas de resposta
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| question_id | uuid FK questions | |
| lesson_id | uuid FK lessons nullable | null se simulado |
| chosen_key | text | "A","B","C","D","E" |
| is_correct | bool | |
| time_ms | int | tempo de resposta |
| xp_awarded | int | |
| mode | text | `lesson` \| `simulado` \| `revisao` |
| created_at | timestamptz | |

Index: `(user_id, created_at desc)`, `(question_id)`.

### `leagues` — ligas semanais
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tier | int | 1=Bronze ... 10=Lendas |
| week_start | date | segunda-feira BRT |
| created_at | timestamptz | |

### `league_members`
| Coluna | Tipo | Notas |
|---|---|---|
| league_id | uuid FK leagues | |
| user_id | uuid FK profiles | |
| weekly_xp | int default 0 | |
| rank | int nullable | preenchido no fechamento |

PK composta `(league_id, user_id)`.

### `achievements` — conquistas
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| code | text unique | `streak_30`, `100_tributario` |
| name | text | |
| description | text | |
| icon | text | nome do ícone Lucide |

### `user_achievements`
| Coluna | Tipo | Notas |
|---|---|---|
| user_id | uuid FK profiles | |
| achievement_id | uuid FK achievements | |
| unlocked_at | timestamptz | |

PK composta.

### `subscriptions` — assinaturas premium
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| provider | text | `stripe` \| `mercadopago` |
| provider_id | text | id externo |
| plan | text | `monthly` \| `annual` |
| status | text | `active` \| `cancelled` \| `past_due` |
| current_period_end | timestamptz | |
| created_at | timestamptz | |

### `simulados` — simulados realizados
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK profiles | |
| track_id | uuid FK tracks | |
| started_at | timestamptz | |
| finished_at | timestamptz nullable | |
| score | float nullable | 0-1 |
| question_ids | uuid[] | snapshot da seleção |

## RLS — políticas chave

- `questions`: SELECT permitido para todos com `status = 'published'`. Admins podem CRUD.
- `attempts`: usuário só vê/insere as próprias.
- `profiles`: usuário só edita o próprio. Leaderboard usa view pública sem dados sensíveis.
- `subscriptions`: read-only no client; mutações só via webhook (service role).

## Triggers críticos

1. **`on_attempt_insert`**: atualiza `profiles.xp_total`, `profiles.streak_days`, decrementa `lives` se errada, atualiza `league_members.weekly_xp`. Atualiza `profiles.skill_level[topic_slug]` com média móvel.
2. **`on_lives_zero`**: agenda `lives_regen_at = now() + 30min` se for null.
3. **`weekly_league_close`** (cron): roda toda segunda 00:00 BRT. Calcula ranks, promove top 10, rebaixa bottom 5, cria nova liga.

## Decisões

- **Por que `choices` jsonb e não tabela `question_choices`?** Sempre lemos as 4-5 alternativas juntas com a questão. Tabela separada exigiria join em todo fetch sem ganho.
- **Por que `skill_level` jsonb e não tabela `user_topic_skill`?** Mesmo motivo — sempre lido inteiro, nunca filtrado por tópico individual no banco.
- **Por que `streak_days` materializado em `profiles` em vez de calcular do `attempts`?** Performance: streak é exibido em toda tela; calcular do log seria caro.
