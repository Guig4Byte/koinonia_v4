---
name: koinonia-clean-refactor
description: Use para refatorar código do Koinonia Lite com segurança, aplicar Clean Code, reduzir duplicação, melhorar nomes, quebrar funções/arquivos grandes e preservar comportamento.
---

# Koinonia Clean Refactor

## Quando usar

Use esta skill quando a tarefa mencionar refatoração, limpeza, simplificação, manutenção, duplicação, arquivo grande, função grande, código difícil de entender, aplicação de Clean Code ou princípios de *Refactoring: Improving the Design of Existing Code*.

Não use para criar uma feature grande do zero sem primeiro separar uma mini entrega segura.

## Contexto fixo do projeto

Koinonia Lite é um radar pastoral mobile-first. O código deve proteger estas ideias:

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Antes de alterar código, leia os documentos necessários para o escopo:

1. `docs/AGENT_BRIEFING.md`
2. `docs/HANDOFF.md`
3. documento responsável pelo assunto: `PRODUCT.md`, `GLOSSARY.md`, `ARCHITECTURE.md`, `FRONTEND.md`, `DEVELOPMENT.md` ou `VALIDATION.md`

Se documentação e código divergirem, trate o código como fonte de verdade imediata, preserve comportamento e atualize o documento responsável quando a tarefa pedir documentação.

## Regras de refatoração segura

- Preserve comportamento externo, rotas, payloads, permissões, textos e classes públicas, salvo pedido explícito.
- Faça mudanças pequenas e reversíveis.
- Não misture refactor estrutural com mudança de produto na mesma entrega.
- Evite abstração prematura; extraia somente quando houver duplicação, nome ruim, responsabilidade misturada ou redução clara de risco.
- Prefira melhorar o design por passos: caracterizar comportamento existente, extrair, mover, renomear, testar.
- Não crie wrapper, fachada ou helper se ele apenas renomeia outra coisa sem semântica, compatibilidade real ou redução de acoplamento.
- Preserve fachadas públicas existentes quando dividir arquivo já importado por outras partes do projeto.
- Não deixe CSS morto, import morto, arquivo morto, comentário morto, console/debug ou código abandonado.

## Heurísticas de Clean Code aplicadas ao Koinonia

### Nomes

- Nome deve revelar intenção pastoral ou técnica concreta.
- Evite nomes genéricos como `data`, `item`, `helper`, `utils`, `handleThing` quando houver domínio claro.
- Use vocabulário oficial do projeto: `pessoa`, `célula`, `encontro`, `presença`, `sinal`, `cuidado`, `apoio`, `encaminhamento`.
- Em TypeScript, nomes de funções devem deixar claro se são:
  - regra de domínio;
  - view model;
  - query;
  - command;
  - adaptação de API/server action;
  - formatação de UI.

### Funções

- Cada função deve ter uma razão principal para mudar.
- Extraia blocos quando houver mistura de intenção: buscar dados, validar permissão, montar view model, renderizar UI, decidir CTA, formatar texto.
- Evite condicionais aninhadas; prefira early return, objetos de estratégia simples, mapas tipados ou funções nomeadas.
- Evite boolean parameter obscuro em função pública. Prefira opções nomeadas ou funções diferentes quando os caminhos representarem intenções distintas.

### Duplicação

- Duas duplicações parecidas de UI podem continuar locais se ainda não houver semântica estável.
- Três ocorrências ou duplicação com regra de domínio devem ser candidatas a extração.
- Para domínio compartilhado entre features, prefira `src/lib/domain`.
- Para UI genérica, prefira `src/components/ui`.
- Para apresentação reutilizável ligada ao produto, prefira `src/components/shared`.

### Comentários

- Não adicione comentários para explicar código confuso; primeiro melhore nomes e estrutura.
- Comentários são aceitáveis para restrições não óbvias de negócio, compatibilidade, performance ou limitação externa.
- Remova comentários antigos, TODOs sem dono e explicações que ficaram falsas após a mudança.

## Padrões de refatoração preferidos

Use estes movimentos quando reduzirem risco:

- Extrair função para nomear uma intenção de negócio.
- Extrair view model quando página/tsx estiver calculando muita regra antes do markup.
- Mover função para `src/lib/domain` quando a regra for neutra e usada por múltiplas features.
- Separar query de montagem de view model quando o arquivo mistura Prisma e formatação de UI.
- Substituir repetição condicional por mapa tipado quando houver enum/status conhecido.
- Preservar arquivo antigo como fachada curta se muitos imports dependem dele.
- Remover fachada/wrapper se não houver compatibilidade, semântica ou redução de acoplamento.

## Checklist antes de editar

1. Identifique o comportamento a preservar.
2. Localize testes existentes próximos ao código alterado.
3. Escolha uma mini entrega com escopo pequeno.
4. Faça inventário de imports públicos antes de mover/remover arquivo.
5. Defina comando de validação mínimo para o tipo de mudança.

## Checklist depois de editar

- Imports quebrados removidos ou atualizados.
- Arquivos realmente excluídos quando não são mais usados.
- Nenhuma duplicação nova criada sem justificativa.
- Testes unitários relevantes passam ou foram ajustados mantendo contrato correto.
- `npm run typecheck`, `npm run lint` e teste direcionado foram considerados.
- Para entrega maior, preferir `npm run verify`.

## Formato da resposta ao usuário

Ao finalizar, responda com:

1. resumo objetivo do que mudou;
2. arquivos alterados/criados/excluídos;
3. validação executada ou motivo claro se não foi possível executar;
4. riscos residuais, se houver.
