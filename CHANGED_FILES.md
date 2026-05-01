# Alterações desta entrega

## Objetivo

Limpar a aba `Equipe` para evitar duplicidade entre listas de células e os cards dos supervisores.

## Arquivos alterados

- `src/app/(app)/equipe/page.tsx`

## Mudanças

- Removidas as listas separadas de `Células que pedem atenção` e `Sem presença recente` do topo da tela.
- Mantido o `Resumo da equipe` com contadores de supervisores, células ativas, células que pedem atenção e células sem presença recente.
- Mantidos os filtros `Todos`, `Pedem atenção` e `Sem presença recente`, agora aplicados diretamente à lista de supervisores e suas células.
- A seção `Supervisores` passou a ser a fonte principal da estrutura: cada card mostra quem acompanha quais células.
- Preservada a seção `Sem supervisor` apenas para células ativas que não têm supervisor vinculado, já que elas não apareceriam dentro de um card de supervisor.
- Mantida a orientação de que perfil de pessoa deve ser aberto pela busca da `Visão` ou pelo detalhe da célula.

## Resultado esperado

A aba `Equipe` deixa de repetir as mesmas células em listas diferentes e fica centrada em estrutura pastoral: supervisores, células acompanhadas e filtros simples para destacar os recortes relevantes.
