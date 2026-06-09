# Koinonia Lite

Koinonia Lite é um radar pastoral mobile-first para igrejas com células.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Como ler a documentação

Cada documento tem uma responsabilidade própria. Evite copiar a mesma regra em vários lugares; quando houver conflito, siga o documento responsável pelo assunto e atualize esse documento junto com o código.

| Documento | Propósito |
| --- | --- |
| `docs/AGENT_BRIEFING.md` | orientação operacional rápida para humanos e agentes antes de alterar código |
| `docs/HANDOFF.md` | contexto recente do trabalho, decisões tomadas e próximos passos sugeridos |
| `docs/PRODUCT.md` | comportamento esperado, escopo do MVP e limites de produto |
| `docs/GLOSSARY.md` | vocabulário oficial, rótulos, CTAs e tons da UI |
| `docs/ARCHITECTURE.md` | implementação, entidades, permissões, rotas, dados e performance |
| `docs/FRONTEND.md` | organização visual, componentes, CSS e loading states |
| `docs/UI_PRIMITIVES_GUIDE.md` | API prática das primitives visuais |
| `docs/UI_CSS_AUDIT.md` | guardrail e estado atual da auditoria UI/CSS |
| `docs/DEVELOPMENT.md` | setup local, migrations, seeds e cenário de performance |
| `docs/VALIDATION.md` | rotina de validação antes de merge |
| `docs/Perfil.txt` | norte de experiência mobile/pastoral |
| `docs/Koinonia.txt` | visão futura/legada; não governa o MVP atual |

## MVP atual

O recorte atual segue este ciclo:

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

Papéis:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

O sistema hoje possui autenticação real, sessão por cookie assinado, temas locais, tamanho de texto local, pessoas, células, encontros, check-in do líder, visitantes, métricas de presença, sinais de atenção, pedido de apoio, encaminhamento pastoral, membros em cuidado, histórico de cuidado, busca de pessoa, visões por papel, equipe pastoral, células supervisionadas, cadastro/edição mínima de célula e consultas de encontros por pendência/histórico.

O escopo completo e os limites do MVP ficam em `docs/PRODUCT.md`.

## Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS v4.
- Prisma ORM com PostgreSQL.
- Zod.
- Vitest.
- Playwright.
- `bcryptjs` para senha.
- `jose` para sessão assinada.

## Como rodar localmente

```bash
npm install
cp .env.example .env
# edite DATABASE_URL e KOINONIA_SESSION_SECRET
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

Para massa maior de desenvolvimento/performance, use:

```bash
npm run db:seed:performance
```

Detalhes de banco, migrations, seeds e reset ficam em `docs/DEVELOPMENT.md`.

## Autenticação local

A seed de desenvolvimento cria usuários locais com a senha:

```txt
koinonia123
```

Acessos principais da seed padrão:

- Pastor: `pastor@koinonia.local`
- Supervisor: `ana@koinonia.local`
- Líder: `bruno@koinonia.local`

A seed de performance usa também:

- Pastor: `pastor@koinonia.local`
- Supervisor: `supervisor01@koinonia.local`
- Líder: `lider01@koinonia.local`

A tela de login não deve exibir credenciais de desenvolvimento.

## Rotas principais

| Rota | Uso |
| --- | --- |
| `/login` | entrada pública |
| `/logout` | encerra sessão |
| `/` | redireciona para a visão do papel |
| `/pastor` | visão do pastor/admin |
| `/equipe` | equipe, supervisores e células para pastor/admin |
| `/supervisor` | visão do supervisor |
| `/celulas` | células supervisionadas |
| `/celulas/nova` | cadastro mínimo de célula para pastor/admin |
| `/celulas/[groupId]` | detalhe da célula |
| `/celulas/[groupId]/editar` | edição mínima de célula para pastor/admin |
| `/lider` | visão do líder |
| `/pessoas` | membros do líder |
| `/pessoas/[personId]` | detalhe da pessoa |
| `/eventos` | encontros visíveis |
| `/eventos?consulta=sem-presenca` | encontros passados sem presença registrada |
| `/eventos?consulta=historico` | histórico de presença registrada |
| `/eventos/[eventId]` | detalhe, resumo, registro ou ajuste do encontro |

## Estrutura

```txt
src/app              Rotas, páginas, login/logout, server actions e APIs.
src/components       UI primitives, layout global e componentes compartilhados.
src/features         Regras e componentes de domínio por feature.
src/lib              Prisma, autenticação, sessão, domínio compartilhado e utilitários.
src/styles           Tokens, base, layout, motion e utilitários globais.
prisma               Schema, migrations, seeds e scripts de banco.
docs                 Documentação por responsabilidade.
```

## Scripts úteis

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run db:migrate
npm run db:seed
npm run db:seed:performance
npm run db:studio
```

## Validação

Para validar uma refatoração localmente, rode:

```bash
npm run verify
```

Para a rotina completa com auditoria visual estrita e E2E, rode:

```bash
npm run verify:all
```

O checklist detalhado fica em `docs/VALIDATION.md`.
