# Koinonia — mobile polish step 2

## Objetivo

Segunda mini-etapa do ciclo de polimento mobile: reduzir peso visual em telas secundárias de consulta e padronizar estados vazios/links de detalhe sem alterar regra de negócio.

## Arquivos alterados

- `src/components/cards.tsx`
  - Adiciona `EmptyState`, um estado vazio discreto com borda tracejada e fundo secundário.
  - Adiciona `DetailLinkCard`, um card de link compacto para detalhe de encontro/célula.
  - Faz `PastoralListSection` usar `EmptyState` internamente.

- `src/app/(app)/eventos/page.tsx`
  - Substitui estados vazios locais por `EmptyState`.
  - Mantém cálculo de presença e permissões inalterados.

- `src/app/(app)/pessoas/[personId]/page.tsx`
  - Substitui estados vazios locais por `EmptyState`.
  - Usa `DetailLinkCard` para última presença e contexto da célula.
  - Mantém ações de cuidado, apoio e encaminhamento inalteradas.

- `src/app/(app)/celulas/[groupId]/page.tsx`
  - Substitui estados vazios locais por `EmptyState`.
  - Usa `DetailLinkCard` para encontro pendente e últimos encontros.
  - Usa `PersonMiniCard` na lista de membros da célula.

- `src/app/(app)/lider/page.tsx`
  - Substitui o estado vazio de evento por `EmptyState`.

- `src/app/(app)/pastor/page.tsx`
  - Substitui o estado vazio de saúde das células por `EmptyState`.

## Impacto esperado

- Telas de consulta ficam menos pesadas no celular.
- Estados vazios deixam de competir visualmente com cards acionáveis.
- Links secundários ficam mais consistentes entre pessoa e célula.
- Reduz duplicação de markup sem mudar domínio, permissões, queries ou endpoints.

## O que não foi alterado

- Nenhuma query.
- Nenhuma permissão.
- Nenhuma regra de presença, sinal, cuidado ou escalonamento.
- Nenhum endpoint.
- Nenhum teste de domínio.

## Validação sugerida

Rodar:

```bash
npm run test
npm run typecheck
npm run build
```

Depois conferir manualmente no mobile:

- `/eventos`, com e sem eventos nas seções;
- `/pessoas/[personId]`, com e sem sinais/cuidado/presença;
- `/celulas/[groupId]`, especialmente membros, encontros e estados vazios.
