---
name: koinonia-api-server-actions
description: Use ao alterar API routes, server actions, commands, validação Zod, contratos HTTP, autenticação, sessão e testes de comandos no Koinonia Lite.
---

# Koinonia API & Server Actions

## Quando usar

Use esta skill quando a tarefa tocar `src/app/api`, `actions.ts`, `actions.commands.ts`, login, logout, sessão, parsing JSON, Zod, responses de API, comandos server-side, mutations, erros HTTP ou testes de command.

## Padrão preferido

Handlers e actions devem ser finos.

Fluxo recomendado:

```txt
autenticar -> ler/parsing -> validar payload -> chamar command/query -> responder
```

Regra de negócio deve ficar em command/helper testável, não espalhada no handler.

## Arquivos de referência do projeto

- `src/lib/api-response.ts`
- `src/lib/api-command-result.ts`
- `src/lib/json.ts`
- `src/lib/auth/current-user.ts`
- `src/lib/auth/session.ts`
- `src/features/permissions/permissions.ts`
- exemplos em `src/features/events/event-check-in-command.ts`
- exemplos em `src/features/events/event-details-command.ts`

## Regras de implementação

- Valide entrada com Zod ou helper já existente antes de aplicar mutation.
- Retorne contrato explícito: sucesso com dados mínimos; erro com mensagem/status esperado.
- Preserve status HTTP já esperado por testes e UI.
- Não exponha detalhe interno de banco em mensagem de erro ao usuário.
- Não misture leitura de request, permissão e mutation em uma função longa sem intenção nomeada.
- Não duplique schemas se um schema de payload já representa o mesmo contrato.
- Não crie endpoint novo se server action ou command existente resolve o fluxo atual.
- Não altere contrato público sem atualizar testes e docs responsáveis.

## Segurança e sessão

- Use sessão/cookie server-side conforme helpers existentes.
- Em produção, segredo de sessão é obrigatório.
- Não reintroduza login demo, troca manual de perfil ou credenciais na tela de login.
- Nunca mova autenticação ou Prisma para componente `use client`.
- Preserve escopo por `churchId` e papel do usuário.

## Commands

Um command bom deve:

- receber usuário autenticado ou contexto necessário;
- validar existência e escopo da entidade;
- validar permissão;
- validar payload de negócio;
- executar mutation transacional quando houver múltiplas escritas acopladas;
- retornar `commandOk` ou `commandError`;
- ser coberto por teste quando altera regra ou contrato.

### Commands de encontros

Para commands que criam, remarcem ou registram encontros:

- Preserve `churchId`, `groupId`, `type` e escopo do usuário autenticado.
- Valide papel permitido antes de escrever; check-in comum é responsabilidade do líder da célula.
- Encontro anterior deve nascer como encontro de célula (`CELL_MEETING`) em estado registrável, não como `COMPLETED` sem presença.
- Bloqueie data futura quando o fluxo for "encontro anterior".
- Verifique duplicidade por célula, tipo e data/horário antes de criar manualmente.
- Ao salvar presenças, mantenha as escritas acopladas em transaction e recalcule sinais quando aplicável.
- Não altere semântica de `NO_MEETING`: ele confirma que a célula não se reuniu após o horário, não é falta.

## Prisma e transações

- Use `$transaction` quando as escritas precisam ser atômicas.
- Evite N+1 em loops com query interna; prefira buscar em lote antes quando possível.
- Dentro de transaction, use o `tx` recebido em vez de `prisma` global.
- Não faça escrita pesada em page load sem short-circuit e motivo claro.

## Testes

Para mudanças em commands, procure teste próximo:

```bash
npx vitest run src/features/events/event-check-in-command.test.ts
npx vitest run src/features/events/event-details-command.test.ts
npx vitest run src/features/signals/support-command.test.ts
npm run test
```

Adicione testes para:

- sucesso;
- entidade inexistente ou fora do escopo;
- papel sem permissão;
- payload inválido;
- efeito colateral importante.

## Checklist final

- Handler/action continua fino.
- Command concentra regra de negócio testável.
- Zod/helper valida entrada pública.
- Permissão e `churchId` preservados.
- Status/mensagem de erro preservados ou intencionalmente documentados.
- Teste direcionado considerado/executado.
