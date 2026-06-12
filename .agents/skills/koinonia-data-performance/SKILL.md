---
name: koinonia-data-performance
description: Use para mudanças em Prisma, schema, migrations, queries, seeds, performance, N+1, paginação, limites de findMany e dados de volume no Koinonia Lite.
---

# Koinonia Data & Performance

## Quando usar

Use esta skill quando a tarefa envolver Prisma, PostgreSQL, `schema.prisma`, migrations, seeds, queries, performance de páginas, N+1, índices, `findMany`, `include/select`, geração automática de encontros ou seed de performance.

## Documentos e arquivos relevantes

- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/VALIDATION.md`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed.ts`
- `prisma/seed-performance.ts`
- `src/lib/prisma.ts`

## Regras de dados do produto

- `Person` é o centro do cuidado.
- `GroupResponsibility` é fonte de verdade de liderança/supervisão ativa.
- `Event` representa encontro de célula e pode ter local próprio.
- `Attendance` registra presença; ausência de marcação não é falta presumida.
- `CareSignal` sustenta atenção; não é tarefa nem SLA.
- `CareTouch` registra cuidado/contato sem virar prontuário pesado.

## Encontros e dados derivados

- Rotina de célula pode gerar `Event` esperado; isso não é presença real.
- `Event` passado sem `Attendance` continua sendo dado pendente, não `0%`.
- Encontro anterior criado manualmente deve evitar duplicidade com eventos existentes por `startsAt` e `scheduleStartsAt`.
- Use `scheduleStartsAt` para preservar a ocorrência original quando encontro gerado foi remarcado.
- Use `generatedFromSchedule = false` quando o encontro foi criado manualmente fora da rotina.
- Recalcule sinais de presença somente depois de check-in real ou mudança que afete presença.
- Não faça geração histórica ampla em page load; se precisar criar passado, faça por ação explícita do usuário.

## Prisma e migrations

- Mudança persistente em `schema.prisma` deve gerar migration versionada em `prisma/migrations`.
- Use `db:push` apenas para experimento local descartável.
- Não edite migration já aplicada sem motivo explícito.
- Atualize seeds quando novo campo obrigatório ou nova relação quebrar massa local.
- Preserve compatibilidade de dados existentes quando possível.

## Queries

- Prefira `select` enxuto em vez de `include` amplo quando a tela não precisa de tudo.
- `findMany` sem `take` precisa estar limitado por escopo real: igreja, usuário, célula, evento, data ou IDs já controlados.
- Não corte semana atual por `take` antes de filtrar período relevante.
- Evite N+1: buscar lista de IDs e carregar agregados em lote é preferível.
- Não faça writes automáticos em page load sem short-circuit claro.
- Preserve `churchId` em consultas de escopo institucional.

## Performance no Koinonia

Áreas sensíveis:

- `/pastor`
- `/supervisor`
- `/lider`
- `/equipe`
- `/eventos`
- detalhe de célula
- detalhe de pessoa
- check-in
- busca global
- recálculo de sinais
- geração automática de encontros

Se mexer nessas áreas, considere seed de performance:

```bash
npm run db:seed:performance
```

Ela limpa e repopula banco local/dev. Não use contra base real.

## Seeds

- Seed padrão (`prisma/seed.ts`) deve continuar narrativa e pequena.
- Seed de performance (`prisma/seed-performance.ts`) deve continuar separada e volumosa.
- Helpers de seed devem ficar em `prisma/seed-helpers` quando reduzem duplicação real.
- Não misture massa de teste de performance na seed narrativa sem necessidade.

## Refatoração segura de queries

Antes:

1. identifique qual tela/feature depende da query;
2. liste campos realmente consumidos;
3. confira permissões e escopo;
4. procure teste de view model/query;
5. mantenha payload público igual.

Depois:

1. rode teste direcionado se houver;
2. considere `npm run typecheck`;
3. para impacto amplo, rode `npm run verify`;
4. para performance real, validar manualmente com seed de performance.

## Checklist final

- Sem N+1 novo evidente.
- Sem `include` amplo desnecessário.
- Sem `findMany` irrestrito em superfície padrão.
- Migration criada quando schema mudou.
- Seeds ajustadas quando necessário.
- Escopo por igreja/papel preservado.
- Dados “sem registro” continuam distintos de dado real `0%`.
