# Alterações nesta entrega

- `src/app/(app)/supervisor/page.tsx`
  - Troca a aba `Pessoas` por `Células` na navegação do supervisor.
  - Remove a lista de células da `Visão`, deixando os sinais de pessoas concentrados nessa tela.

- `src/app/(app)/celulas/page.tsx`
  - Cria a tela de células supervisionadas para o supervisor.
  - Mostra busca local por célula ou liderança, sem busca global de pessoa.
  - Adiciona filtros `Todas`, `Pedem atenção` e `Sem presença recente`.
  - Lista células de 4 em 4 com `Ver mais células`.
  - Mantém pedidos de apoio, atenção local, presença baixa e ausência de presença recente como leitura da célula.

- `src/app/(app)/pessoas/page.tsx`
  - Redireciona supervisor para `/celulas`, evitando duplicidade com a `Visão`.

- `src/app/(app)/pessoas/[personId]/page.tsx`
  - Ajusta a navegação secundária do supervisor para `Células`.
  - Mantém o retorno do detalhe de pessoa para `Visão`, onde os sinais de pessoas são priorizados.

- `src/app/(app)/celulas/[groupId]/page.tsx`
  - Ajusta a navegação secundária do supervisor para `Células`.
  - Ajusta o retorno do detalhe de célula para `Células` no caso do supervisor e `Equipe` no caso do pastor/admin.

- `src/app/(app)/eventos/page.tsx`
  - Ajusta a navegação secundária do supervisor para `Células`.

- `src/app/(app)/eventos/[eventId]/page.tsx`
  - Ajusta a navegação secundária do supervisor para `Células`.

## Regra aplicada

- Supervisor: `Visão · Células · Eventos`.
- A `Visão` do supervisor continua respondendo quem precisa de atenção agora.
- A aba `Células` mostra a estrutura supervisionada sem duplicar os cards de pessoas.
- Listas de células crescem progressivamente de 4 em 4.
