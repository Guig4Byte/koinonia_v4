# Koinonia — mobile polish step 1

## Objetivo

Primeira mini-etapa do ciclo de polimento mobile: reduzir ruído visual nas listas secundárias e padronizar cards curtos de pessoa sem alterar regra de negócio.

## Arquivos alterados

- `src/components/cards.tsx`
  - Adiciona `PersonMiniCard`, um card compacto para listas de pessoas.
  - Deixa mensagens vazias de seção com menor peso visual: fundo secundário, borda tracejada e sem sombra forte.

- `src/app/(app)/pastor/page.tsx`
  - Usa `PersonMiniCard` em `Acolhidos em cuidado`.
  - Remove markup local duplicado.

- `src/app/(app)/supervisor/page.tsx`
  - Usa `PersonMiniCard` em `Acolhidos em cuidado`.
  - Remove markup local duplicado.

- `src/app/(app)/lider/page.tsx`
  - Usa `PersonMiniCard` em `Acolhidos em cuidado`.
  - Mantém o badge do evento de presença inalterado.

- `src/app/(app)/pessoas/page.tsx`
  - Usa `PersonMiniCard` em `Acolhidos em cuidado`.
  - Usa `PersonMiniCard` na lista curta de membros do líder.

## Impacto esperado

- Listas de pessoas ficam mais escaneáveis no celular, com avatar/initials e hierarquia consistente.
- Empty states deixam de competir visualmente com pessoas reais em atenção.
- Reduz duplicação de markup entre `pastor`, `supervisor`, `lider` e `/pessoas`.

## O que não foi alterado

- Nenhuma query.
- Nenhuma permissão.
- Nenhuma regra de presença, sinal, cuidado ou escalonamento.
- Nenhum endpoint.

## Validação sugerida

Rodar:

```bash
npm run test
npm run typecheck
npm run build
```

Depois conferir manualmente no mobile:

- `Visão` do pastor, supervisor e líder;
- seção `Acolhidos em cuidado`;
- `/pessoas` como líder, especialmente a lista `Membros da célula`.
