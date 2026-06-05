# Handoff — contexto recente do projeto

Este documento existe para dar continuidade ao trabalho recente. Ele não é fonte normativa de produto, UI ou arquitetura; quando houver dúvida, consulte o documento responsável pelo assunto.

## Objetivo do ciclo recente

O trabalho começou como uma revisão sênior do código e evoluiu para uma sequência de refatorações pequenas, sempre com contrato público preservado e validação local entre etapas.

Objetivos principais:

- reduzir overrides locais de CSS e consolidar primitives;
- quebrar arquivos concentradores sem mudar comportamento;
- reduzir dependências cruzadas problemáticas entre features;
- melhorar performance de servidor/banco;
- criar massa de dados realista para validar performance e telas;
- alinhar documentação ao estado atual.

## O que já foi concluído

### UI/CSS

- Audit UI/CSS saiu de achados médios/altos relevantes para `0 altos` e `0 médios`.
- Restam apenas achados baixos aceitos pelo guardrail.
- Variantes foram promovidas para `Button`, `ButtonLink`, `Badge`, `Card`, `CardLink`, `PriorityCard`, `ActionPill`, `StatusCard`, `DisclosureCard`, `FilterChip` e componentes de presença.
- CSS Modules de feature deixaram de recriar superfície externa de cards/botões/disclosures.
- Wrappers finos sem valor próprio foram removidos, como `SectionTitle`, `DetailLinkCard` e `GhostButton`.

### Organização de componentes e view models

Arquivos antes concentradores foram transformados em fachadas públicas com módulos internos menores:

```txt
src/components/shared/base-cards.tsx
src/components/shared/presence-metric.tsx
src/features/dashboard/queries.ts
src/app/(app)/pessoas/[personId]/page-data.ts
src/features/groups/cells-page-view.ts
src/features/groups/group-detail-view.ts
src/features/team/components/team-structure-cards.tsx
src/features/team/team-view.ts
src/features/pastoral-home/supervisor-page-view.ts
```

Regra usada: manter import público existente funcionando e dividir por responsabilidade interna. Não criar wrapper novo quando ele só esconde uma linha de outro componente.

### Dependências entre features

Foram removidas dependências consideradas invertidas ou mal posicionadas:

```txt
dashboard -> leader
permissions -> groups
signals -> groups
groups -> dashboard
care -> groups
events -> groups
```

Helpers neutros foram movidos para `src/lib/domain`, incluindo responsabilidades de grupo e dias da semana. Ainda existem imports cruzados legítimos entre features, principalmente composição de telas e dashboards. A meta não é zerar imports cruzados; a meta é manter `0 ciclos reais` e evitar dependência basal apontando para feature concreta.

### Performance e banco

Foram aplicados quick wins:

- busca global com fallback limitado e payload menor;
- `getAuthenticatedUser()` usando `select` enxuto;
- histórico de cuidado da pessoa com limite explícito;
- recálculo de sinais de presença sem N+1 de leitura;
- geração automática de encontros usando `eventsGeneratedUntil` como short-circuit;
- query de `/eventos` carregando eventos recentes primeiro para não cortar a semana atual com `take`;
- índices P1 adicionados ao Prisma para `Event` e `CareSignal`;
- migration versionada criada em `prisma/migrations`.

### Seed de performance

Foi criado `prisma/seed-performance.ts` e o script `npm run db:seed:performance`.

Esse seed cria volume realista com células, líderes, supervisores, membros, encontros concluídos, encontros futuros, presenças, sinais e cuidados. Ele também alimenta presença da semana quando há encontros já vencidos na semana atual.

## Estado técnico atual esperado

Após aplicar as últimas etapas, o estado esperado é:

```txt
npm run lint                passa
npm run typecheck           passa
npm test                    passa
npm run audit:ui-css:strict passa
ciclos reais de import      0
UI/CSS altos/médios         0
migrations versionadas      sim
```

## Próximos candidatos, se houver demanda

Não há refactor estrutural urgente. Próximos passos devem depender de dor real.

Candidatos técnicos:

1. Ajuste visual pequeno no card `Presença da semana`: em 360-384 px, o texto `Sem mudança relevante em relação ao último mês` fica quebrado; avaliar copy menor ou comportamento responsivo do badge.
2. Medir performance real com seed de performance em `/pastor`, `/eventos`, `/lider`, `/equipe` e check-in.
3. Revisar `src/features/people/components/member-priority-list.tsx` apenas se aparecer dor de manutenção.
4. Expandir E2E para fluxos críticos com seed de performance.

Evitar por enquanto:

- tentar zerar imports cruzados entre features;
- dividir primitives grandes apenas por contagem de linhas;
- transformar a arquitetura em camadas abstratas sem necessidade concreta.

## Padrões a manter

- Mini etapas pequenas, com ZIP/patch contendo somente arquivos alterados.
- Fachada pública preservada quando dividir arquivo existente.
- `src/lib/domain` para helpers puros compartilhados entre features.
- `src/components/ui` para superfície/foco/densidade/acessibilidade visual.
- `src/components/shared` para apresentação reutilizável ligada ao produto.
- `src/features/*` para regras e componentes de domínio.
- Documentação atualizada no documento responsável, sem repetir regra inteira em todos os docs.
