# Arquivos alterados — Leitura pendente na Equipe

## Alterados

- `src/features/dashboard/queries.ts`
- `src/app/(app)/equipe/page.tsx`
- `CHANGED_FILES.md`

## Resumo

- `Sem registro` deixou de contar como prioridade pastoral em `Células que pedem atenção`.
- Células sem presença registrada suficiente agora aparecem como `Leitura pendente`, separadas de casos, sinais e presença baixa real.
- A métrica `Pedem atenção` agora considera somente casos pastorais, pedidos de apoio, atenções locais e presença baixa com dado registrado.
- A métrica `Leitura pendente` mostra células sem presença registrada suficiente para leitura recente.
- Supervisores com células sem registro exibem a situação como leitura pendente, sem receber tom de risco/atenção.

## Regra atual

`Células que pedem atenção` prioriza:

1. casos urgentes;
2. casos pastorais encaminhados;
3. pedidos de apoio à supervisão;
4. atenções locais;
5. presença recente baixa com dado registrado;
6. nome da célula como desempate.

`Leitura pendente` mostra células sem presença registrada suficiente e não pesa como saúde baixa.
