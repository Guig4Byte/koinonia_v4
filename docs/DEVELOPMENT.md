# Desenvolvimento Local

Este documento centraliza setup local, banco, migrations e seeds. Ele não define regra de produto nem arquitetura de domínio; para isso use `PRODUCT.md` e `ARCHITECTURE.md`.

## Setup padrão

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Variáveis obrigatórias no `.env`:

```txt
DATABASE_URL
KOINONIA_SESSION_SECRET
```

Em produção, segredo de sessão é obrigatório. Em desenvolvimento, mantenha um valor estável para evitar logout inesperado durante testes.

## Prisma e migrations

O projeto usa Prisma Migrate com PostgreSQL. O fluxo recomendado para evolução do schema é:

```bash
npm run db:migrate -- --name nome_da_migration
```

Use `db:push` apenas para experimento local descartável. Mudança de schema que deve permanecer no projeto precisa virar migration versionada em `prisma/migrations`.

Se o banco dev tiver drift e os dados puderem ser perdidos, use reset:

```bash
npx prisma migrate reset
```

Depois rode a seed desejada.

## Seeds

### Seed padrão

```bash
npm run db:seed
```

Cria uma base pequena e narrativa para validar fluxos principais.

Credenciais principais:

```txt
pastor@koinonia.local
ana@koinonia.local
bruno@koinonia.local
senha: koinonia123
```

### Seed de performance

```bash
npm run db:seed:performance
```

Cria uma base maior para validar comportamento com volume:

```txt
50 células
5 supervisores
50 líderes
600 membros
12 semanas concluídas
4 semanas atuais/futuras
presenças históricas e da semana atual quando aplicável
sinais pastorais e registros de cuidado
```

Credenciais úteis:

```txt
pastor@koinonia.local
supervisor01@koinonia.local
lider01@koinonia.local
senha: koinonia123
```

O seed de performance limpa o banco antes de popular os dados. Use apenas em ambiente local/dev.

Customização em PowerShell:

```powershell
$env:PERF_SEED_GROUPS=80
$env:PERF_SEED_MEMBERS_PER_GROUP=15
$env:PERF_SEED_COMPLETED_WEEKS=16
$env:PERF_SEED_FUTURE_WEEKS=6
npm run db:seed:performance
```

Customização em Bash:

```bash
PERF_SEED_GROUPS=80 PERF_SEED_MEMBERS_PER_GROUP=15 PERF_SEED_COMPLETED_WEEKS=16 PERF_SEED_FUTURE_WEEKS=6 npm run db:seed:performance
```

## Validação local

Depois de alteração de código:

```bash
npm run lint
npm run typecheck
npm test
npm run audit:ui-css:strict
```

Antes de merge ou entrega maior:

```bash
npm run verify
```

Quando a mudança tocar fluxo navegável ou UI crítica:

```bash
npm run verify:all
```

## Cenários manuais recomendados com seed de performance

1. Entrar como `pastor@koinonia.local` e validar `/pastor` e `/eventos`.
2. Entrar como `supervisor01@koinonia.local` e validar `/supervisor`, `/celulas` e `/eventos`.
3. Entrar como `lider01@koinonia.local` e validar `/lider`, `/pessoas`, `/eventos` e check-in.
4. Confirmar que `Presença da semana` tem dado quando já houve encontro na semana atual.
5. Confirmar que `/eventos` mostra recorte operacional, não todos os eventos do banco.
