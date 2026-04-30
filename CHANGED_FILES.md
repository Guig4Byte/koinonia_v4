# Mini-etapa 6 — Tema na tela de login

## Objetivo

Permitir trocar e aplicar o tema antes da autenticação, mantendo a tela de login simples e sem virar uma tela de configurações.

## Arquivos alterados

- `src/app/login/page.tsx`
- `src/components/theme-toggle.tsx`
- `src/components/theme-init.tsx`

## Mudanças

### `src/app/login/page.tsx`

- Adiciona o controle de tema no topo do card de login.
- Usa o mesmo mecanismo de tema do app autenticado.
- Mantém o tema salvo no aparelho via `localStorage`.
- Evita criar uma tela ou seção pesada de preferências antes do login.

### `src/components/theme-toggle.tsx`

- O componente agora aceita variações:
  - `variant="header"` para o header autenticado, mantendo o comportamento atual.
  - `variant="card"` para superfícies claras/escuras como o login.
- Adiciona `showLabel` para exibir o nome do tema quando fizer sentido.
- Preserva o ciclo atual: `Claro -> Pergaminho -> Escuro`.

### `src/components/theme-init.tsx`

- Adiciona um script inicial para aplicar o tema salvo antes do conteúdo principal renderizar.
- Reduz flash visual quando o usuário já tinha escolhido `Pergaminho` ou `Escuro`.
- Mantém o `useEffect` como sincronização client-side após hidratação.

## O que não mudou

- Login/logout.
- Sessão real.
- Middleware.
- Permissões.
- Regras pastorais.
- Rotas protegidas.

## Validação sugerida

```bash
npm run typecheck
npm run test
npm run build
```

Teste manual:

1. Abra `/login` sem sessão.
2. Alterne entre `Claro`, `Pergaminho` e `Escuro`.
3. Recarregue a página e confirme que o tema escolhido permanece.
4. Faça login e confirme que o mesmo tema segue dentro do app.
5. Saia e confirme que o tema continua aplicado no login.
