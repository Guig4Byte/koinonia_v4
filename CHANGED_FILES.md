# CHANGED_FILES

## Registro auxiliar

Este arquivo resume a última leva local de alterações. Ele não substitui as fontes de verdade do projeto:

- `README.md`
- `docs/AGENT_BRIEFING.md`
- `docs/PRODUCT.md`
- `docs/GLOSSARY.md`
- `docs/ARCHITECTURE.md`
- `docs/Perfil.txt`
- `docs/Koinonia.txt`

## Alteração atual

Ajuste aplicado nesta entrega: separar melhor a superfície padrão do pastor/admin em `Pessoas` e `Visão`, evitando que atenção local e pedidos de apoio apareçam como fila pastoral.

1. `src/app/(app)/pessoas/page.tsx`
   - Para pastor/admin, a tela `/pessoas` deixou de renderizar as seções `Pedidos de apoio` e `Acompanhar de perto`.
   - `Caso pastoral` permanece em `Irmãos que precisam de um olhar especial`, porque urgência ou encaminhamento ao pastor tem prioridade sobre a origem do pedido.
   - Para pastor/admin, `Acolhidos em cuidado` foi renomeado para `Acolhidos em cuidado pastoral`.
   - Para pastor/admin, a lista de `Acolhidos em cuidado pastoral` agora exige cuidado registrado por pastor/admin, além de vínculo ativo, não visitante e em célula ativa visível.
   - Líderes e supervisores mantêm as seções operacionais de atenção e apoio.
   - A busca ampla do pastor não foi alterada.

2. `src/features/dashboard/queries.ts`
   - A `Visão` do pastor/admin agora também limita `Acolhidos em cuidado pastoral` a pessoas que receberam cuidado registrado por pastor/admin.
   - A query reforça vínculo ativo, não visitante e em célula ativa.

3. `src/app/(app)/pastor/page.tsx`
   - O rótulo da seção passou de `Acolhidos em cuidado` para `Acolhidos em cuidado pastoral`.
   - A descrição da seção passou a comunicar cuidado pastoral, não cuidado local genérico.
