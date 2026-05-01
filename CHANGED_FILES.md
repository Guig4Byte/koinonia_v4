# Alterações — Equipe do pastor

## Objetivo

Remover a mensagem repetida dentro do card de supervisor quando não há célula pedindo atenção.

## Arquivos alterados

- `src/app/(app)/equipe/page.tsx`

## Mudanças

- O resumo do supervisor deixou de retornar `Sem célula pedindo atenção agora.`.
- Quando não há célula em atenção, o card mostra apenas o resumo neutro, por exemplo `2 células acompanhadas`.
- O estado vazio `Sem célula pedindo atenção agora.` deixou de ser renderizado dentro da área de listas do supervisor.
- O estado vazio continua aparecendo apenas quando o supervisor não tem nenhuma célula ativa vinculada: `Nenhuma célula ativa vinculada a este supervisor.`
- A lista expansível de células acompanhadas continua aparecendo normalmente.

## Validação

Tentei rodar `npm run typecheck`, mas o comando não concluiu dentro do tempo disponível neste ambiente. Recomendo validar localmente com:

```bash
npm run typecheck
npm test
```
