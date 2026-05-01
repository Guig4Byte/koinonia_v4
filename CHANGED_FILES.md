# Arquivos alterados — Equipe pastoral

## Alterados

- `src/features/dashboard/queries.ts`
- `src/app/(app)/equipe/page.tsx`
- `src/app/(app)/celulas/[groupId]/page.tsx`

## Resumo

- Troca de rótulo visual de `Líder` para `Liderança` nos cards/contexto de célula, sem alterar o modelo de dados.
- A tela `Equipe` agora mostra uma seção de prioridade: `Células que pedem atenção`.
- Supervisores e células passaram a ter ordenação determinística por prioridade pastoral.
- Quando não há sinal, caso pastoral, ausência de registro ou presença baixa, a ordenação cai para ordem alfabética.
- Listas longas agora são contidas com `Ver mais` / `Mostrar menos`.

## Regra de ordenação aplicada

Células são priorizadas por:

1. casos urgentes;
2. casos pastorais encaminhados;
3. pedidos de apoio à supervisão;
4. atenções locais;
5. ausência de presença registrada;
6. presença recente baixa;
7. pessoas em cuidado;
8. nome da célula.

Supervisores são ordenados pela pior situação pastoral entre suas células. Em empate, pela quantidade de células que pedem atenção e depois pelo nome.
