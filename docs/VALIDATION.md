# Validação e Segurança de Refatoração

Este documento define a rotina mínima para validar mudanças no Koinonia Lite, especialmente refatorações incrementais por mini entrega.

O objetivo é detectar regressões em quatro camadas:

1. tipos e contratos TypeScript;
2. regras de domínio cobertas por testes unitários;
3. consistência visual/CSS mobile-first;
4. fluxos críticos de ponta a ponta.

## Validação local recomendada

Depois de aplicar uma mini entrega, rode:

```bash
npm install
npm run db:generate
npm run verify
```

O script `verify` executa:

```txt
db:generate -> typecheck -> lint -> test -> build
```

Use esse comando como barreira padrão antes de seguir para a próxima mudança.

## Validação completa

Quando a alteração tocar fluxos navegáveis ou comportamento visível, rode também:

```bash
npm run verify:all
```

Esse script adiciona auditoria visual estrita e testes E2E ao fluxo padrão. Ele pressupõe que o ambiente local esteja pronto para Playwright e banco de dados.

Para rodar apenas os E2E com geração prévia do Prisma Client:

```bash
npm run verify:e2e
```

## Testes direcionados

Para revisar uma mini entrega específica, prefira começar pelo teste afetado:

```bash
npx vitest run src/features/check-in/check-in-view.test.ts
npx vitest run src/app/api/events/[eventId]/check-in/check-in-command.test.ts
npx vitest run src/app/api/events/[eventId]/event-details-command.test.ts
npx vitest run src/features/signals/support-command.test.ts
```

Depois rode `npm run verify` para capturar impactos indiretos.

## Checklist por tipo de mudança

### Regras de domínio

- O teste unitário da regra alterada passa.
- Casos de erro e sucesso estão cobertos.
- Nomes de funções deixam claro se a regra é de domínio, view model ou transporte HTTP.
- Payload público não mudou sem documentação explícita.

### API handlers e server actions

- Handler continua fino: autenticação, parsing, chamada de command e resposta.
- Command concentra regra de negócio e retorna um contrato explícito.
- Erros mantêm status HTTP esperado.
- Nenhuma query Prisma foi movida para componente client-side.

### Componentes React e hooks

- Props públicas foram preservadas ou a migração está documentada.
- Hooks específicos continuam dentro da feature correspondente.
- Componentes client-side não importam Prisma, sessão server-side ou commands de API.
- Estados derivados foram extraídos para helpers puros quando possível.

### UI/CSS

- CSS Modules permanecem próximos dos componentes que usam suas classes.
- Primitives em `src/components/ui` não importam features.
- Mudanças visuais intencionais devem ser descritas no changelog da mini entrega.
- Para mudanças de CSS global, rode:

```bash
npm run audit:ui-css
npm run screenshots:mobile
```

### E2E e fluxos críticos

Rode E2E quando a mudança afetar:

- login/logout;
- check-in;
- detalhe de evento;
- cadastro/edição de célula;
- pedido de apoio ou encaminhamento pastoral;
- navegação principal por papel.

## Critério de aceite para uma mini entrega

Uma mini entrega está pronta quando:

1. `npm run verify` passa localmente;
2. arquivos excluídos foram removidos de fato;
3. não há imports para arquivos removidos;
4. testes novos ou existentes cobrem a regra alterada;
5. o changelog descreve o motivo da alteração e o escopo real;
6. mudanças de contrato público estão documentadas, ou fica explícito que não houve mudança de contrato.

## Ordem recomendada antes de merge

```bash
npm run verify
npm run audit:ui-css
npm run test:e2e
```

Para mudanças pequenas e puramente internas, `npm run verify` costuma ser suficiente. Para mudanças em UI, fluxo de usuário ou permissão, inclua auditoria visual e E2E.
