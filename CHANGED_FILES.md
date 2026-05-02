# Alterações nesta entrega

- `src/components/bottom-nav.tsx`
  - Adiciona o tom `risk` para a bolinha vermelha da navegação.
  - Mantém a bolinha somente no item ativo da navegação.

- `src/app/(app)/pastor/page.tsx`
  - Usa bolinha vermelha quando a Visão do pastor tem caso pastoral/urgente.

- `src/app/(app)/equipe/page.tsx`
  - Usa bolinha vermelha quando Equipe tem urgente/caso pastoral; âmbar quando há apenas presença baixa/atenção.

- `src/app/(app)/lider/page.tsx`
  - Aplica prioridade vermelho > âmbar > azul na Visão do líder.

- `src/app/(app)/supervisor/page.tsx`
  - Aplica prioridade vermelho > âmbar > azul na Visão do supervisor.

- `src/app/(app)/pessoas/page.tsx`
  - Aplica prioridade vermelho > âmbar > azul na aba de Pessoas/Membros.

- `src/app/(app)/pessoas/[personId]/page.tsx`
  - Usa vermelho quando o perfil aberto tem sinal urgente ou encaminhado ao cuidado pastoral.

- `src/app/(app)/celulas/[groupId]/page.tsx`
  - Usa vermelho quando a célula aberta tem sinal urgente ou caso pastoral.

## Regra aplicada

A bolinha só aparece na tela ativa e segue a prioridade:

1. vermelho: urgente ou caso pastoral/encaminhado ao pastor;
2. âmbar: atenção comum ou presença baixa;
3. azul: somente cuidado.
