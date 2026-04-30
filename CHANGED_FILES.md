# CHANGED_FILES

## Ajuste visual do header mobile

### Arquivos alterados

- `src/components/app-shell.tsx`
- `src/app/globals.css`

### O que foi atualizado

- Botão de tema e botão de logout agora ficam empilhados no canto superior direito do header.
- Botão de logout passou a usar apenas ícone, removendo o texto `Sair`.
- Botão de logout recebeu `aria-label` e `title` para manter acessibilidade.
- Header recebeu `position: relative` para ancorar a coluna de ações sem aumentar a altura do bloco.
- Bloco de marca/cargo recebeu respiro à direita para evitar colisão visual com os botões.

### Observação

Não rodei build/typecheck porque o pacote enviado não contém `node_modules`.
