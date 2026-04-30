# Mini-etapa 4 — acabamento pós-auth

Foco: remover sinais residuais de demo, deixar login/logout mais coerentes com sessão real e documentar o fluxo mínimo de autenticação.

## Arquivos alterados

- `.env.example`
- `README.md`
- `prisma/seed.ts`
- `src/app/login/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/role-switcher.tsx`
- `src/lib/auth/session.ts`
- `src/lib/auth/token.ts`

## Mudanças

### Login

- O bloco de credenciais locais agora aparece como `Acesso de desenvolvimento`, não como demo.
- Esse bloco só renderiza fora de produção (`process.env.NODE_ENV !== "production"`).
- A lista de usuários foi renomeada internamente para `seedUsers`.

### Logout

- O botão `Sair` agora usa `POST /logout` via formulário HTML simples.
- O endpoint `GET /logout` continua existindo como fallback, mas a UI não depende mais de logout por link GET.

### Sessão

- `destroyAuthSession()` também limpa o cookie antigo `koinonia-demo-role`.
- O segredo de sessão agora exige variável em produção:
  - `KOINONIA_SESSION_SECRET`, ou
  - `AUTH_SECRET`, ou
  - `NEXTAUTH_SECRET`.
- Em desenvolvimento, ainda existe fallback local para não travar a execução sem `.env` completo.

### Documentação e seed

- README atualizado para autenticação real local.
- `.env.example` documenta `KOINONIA_SESSION_SECRET`.
- Logs da seed agora falam em acessos/usuários da seed, não seletor de perfis.

### Legado

- `RoleSwitcher` continua como no-op temporário para evitar quebra em branches antigas, mas a troca manual de perfis não faz mais parte da UI.
- Quando não houver mais nenhum branch/import antigo dependendo dele, o arquivo pode ser removido.

## Validação sugerida

```bash
npm run typecheck
npm run test
npm run build
```

Depois validar manualmente:

- `/login` sem sessão;
- login com `pastor@koinonia.local / koinonia123`;
- login com `ana@koinonia.local / koinonia123`;
- login com `bruno@koinonia.local / koinonia123`;
- botão `Sair`;
- ausência da barra de troca manual de perfis.
