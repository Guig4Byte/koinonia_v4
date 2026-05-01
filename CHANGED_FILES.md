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

Correção aplicada nesta entrega:

1. `src/app/(app)/pessoas/page.tsx`
   - A seção `Acolhidos em cuidado` agora exige que a pessoa em `Em cuidado` tenha vínculo ativo e não visitante dentro de uma célula visível.
   - Para pastor/admin, isso impede que a superfície padrão de `/pessoas` mostre pessoas ligadas apenas a célula inativa, vínculo encerrado, visitante ou sem célula ativa.
   - A busca ampla do pastor não foi alterada; a mudança vale apenas para a lista padrão de `Em cuidado`.
