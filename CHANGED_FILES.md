# Alterações nesta entrega

## Eventos mais leves no mobile

Arquivos alterados:

- `src/app/(app)/eventos/page.tsx`
- `src/components/progressive-list.tsx`

## O que mudou

- A seção `Esta semana` não mostra mais encontros passados sem presença registrada.
- Encontros passados sem presença continuam acessíveis em `Consultar outros encontros -> Sem presença registrada`.
- `Ver mais encontros` agora revela mais 4 itens por vez, em vez de abrir todo o restante da lista de uma vez.
- O mesmo comportamento progressivo foi aplicado à tela principal e às consultas de `Sem presença registrada` e `Histórico de presença`.
- A tela principal fica focada em `Hoje` e nos encontros relevantes da semana, sem voltar a parecer uma fila operacional longa.

## Validação

- Tentei rodar `npm run typecheck`, mas o pacote no ambiente não tem as dependências instaladas (`next`, `react`, tipos do Node, etc.).
- Recomendo validar localmente com:

```bash
npm install
npm run typecheck
npm test
```
