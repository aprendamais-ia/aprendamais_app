# Ementas oficiais

Fonte de verdade do conteúdo. Toda questão referencia um item destes arquivos via `source_citation`.

## Arquivos

- `cpa-10.yaml` — ementa ANBIMA CPA-10 (versão atual). Site oficial: https://www.anbima.com.br/pt_br/educar/certificacoes/cpa-10.htm
- `oab.yaml` — Edital Unificado da Primeira Fase do Exame de Ordem. Site oficial: https://www.oab.org.br/exameunificado

## Quando atualizar

- Quando ANBIMA / OAB Federal publicar nova versão (geralmente anual)
- Sempre via PR — nunca push direto
- Bumpar `version:` no YAML
- Após merge: rodar `pnpm content:audit` pra ver se questões publicadas continuam mapeadas
- Questões cuja `source_citation` aponta para item removido: marcar `status='retired'`

## Convenção de slug

Hierarquia com pontos: `<modulo>.<topico>.<subtopico>` em kebab-case.

Exemplo: `renda-fixa.titulos-publicos.tesouro-selic`

Mantenha consistente — slug é PK lógico do sistema.
