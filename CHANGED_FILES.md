# Koinonia — autenticação real — mini-etapa 3

Foco desta entrega: remover a troca manual de perfis da experiência e fazer a sessão real virar a fonte de verdade do usuário atual.

## Arquivos alterados

- `src/components/app-shell.tsx`
- `src/lib/auth/current-user.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/token.ts`
- `src/app/actions.ts`
- `src/components/role-switcher.tsx`

## Mudanças

### 1. Remoção visual da troca de perfis

`AppShell` não renderiza mais `RoleSwitcher`.

A pessoa logada continua vendo:

- nome/saudação;
- papel atual;
- botão `Sair`;
- alternância de tema.

Isso remove a sensação de simulador sem adicionar uma área administrativa.

### 2. Sessão real como fonte única

`getCurrentUser()` agora tenta carregar apenas o usuário autenticado pela sessão real.

Antes:

1. tentava sessão real;
2. se não houvesse, caía no cookie `koinonia-demo-role`.

Agora:

1. tenta sessão real;
2. sem sessão válida, redireciona para `/login`.

### 3. Cookie demo tratado como legado

`createAuthSession()` ainda remove `koinonia-demo-role` ao fazer login, mas esse cookie não é mais lido como fallback.

### 4. Ação demo desativada

`src/app/actions.ts` não expõe mais `switchDemoRole`.

### 5. Componente legado neutralizado

`src/components/role-switcher.tsx` foi mantido como no-op temporário para evitar quebra caso algum import antigo apareça durante transição. Como `AppShell` não importa mais esse componente, ele não aparece na UI.

## O que não mudou

- permissões;
- queries;
- regras pastorais;
- check-in;
- cuidado;
- escalonamento;
- login/logout criados na etapa anterior.

## Validação sugerida

```bash
npm run typecheck
npm run test
npm run build
```

## Validação manual sugerida

1. Acessar app sem sessão: deve ir para `/login`.
2. Entrar como pastor: deve ir para `/pastor`.
3. Entrar como supervisor: deve ir para `/supervisor`.
4. Entrar como líder: deve ir para `/lider`.
5. Confirmar que não existe mais barra de troca de perfis.
6. Clicar em `Sair`: deve voltar para `/login`.
