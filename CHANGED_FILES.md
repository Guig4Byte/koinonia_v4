# Koinonia — auth cleanup step 5

Mini-etapa 5: limpeza pós-auth após a entrada da autenticação real.

## Arquivos alterados

- `src/lib/auth/session.ts`
  - Remove referências ao cookie legado `koinonia-demo-role`.
  - A sessão real `koinonia-session` passa a ser a única sessão manipulada por `createAuthSession()` e `destroyAuthSession()`.

- `src/app/logout/route.ts`
  - Remove `GET /logout`.
  - Logout fica restrito a `POST`, alinhado ao formulário do `AppShell` e evitando ação de saída por navegação simples.

- `prisma/seed.ts`
  - Renomeia tipos/helpers internos de `Demo*` para `Seed*`.
  - Não altera dados criados, usuários, senha, cenários pastorais ou regras de seed.

## Arquivos para excluir manualmente

DELETE:

- `src/app/actions.ts`
- `src/components/role-switcher.tsx`

Motivo: esses arquivos eram resíduos da troca manual de perfis. Não há imports ativos para eles na base atual.

## Validação feita nesta auditoria

Busca por referências antigas não retornou usos ativos de:

- `RoleSwitcher`
- `switchDemoRole`
- `demo-session`
- `koinonia-demo-role`
- `getDemo*`
- `Acesso demo`
- `seletor` / `troca de perfil`

## Validação recomendada

```bash
npm run typecheck
npm run test
npm run build
```

Depois conferir manualmente:

- login com pastor/supervisor/líder;
- botão `Sair`;
- acesso direto sem sessão;
- ausência da barra de troca manual de perfis.
