# Koinonia Lite

Koinonia Lite é um radar pastoral mobile-first para igrejas com células.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Como Ler A Documentação

Leia nesta ordem quando for entender ou alterar o sistema:

1. `docs/AGENT_BRIEFING.md` - briefing operacional para agentes e desenvolvedores.
2. `docs/PRODUCT.md` - comportamento, escopo e fluxos do MVP atual.
3. `docs/GLOSSARY.md` - vocabulário oficial, rótulos, CTAs e tons da UI.
4. `docs/ARCHITECTURE.md` - entidades, permissões, rotas, autenticação e helpers.
5. `docs/FRONTEND.md` - organização visual, componentes, CSS e loading states.
6. `docs/Perfil.txt` - norte de experiência mobile/pastoral.
7. `docs/Koinonia.txt` - visão futura/legada; não governa o MVP atual.

Cada documento tem uma responsabilidade própria. Se houver conflito, siga o documento responsável pelo assunto. Se o código atual divergir dos docs, preserve o comportamento existente e atualize o documento responsável na mesma mudança.

## MVP Atual

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

O sistema hoje possui autenticação real, sessão por cookie assinado, temas locais, tamanho de texto local, pessoas, células, encontros, check-in do líder, visitantes, métricas de presença, sinais de atenção, pedido de apoio, encaminhamento pastoral, cuidado recente, busca de pessoa e visões por papel.

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

## Como Rodar

```bash
npm install
cp .env.example .env
# edite DATABASE_URL e KOINONIA_SESSION_SECRET
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Autenticação Local

A seed de desenvolvimento cria usuários locais com a senha:

```txt
koinonia123
```

Acessos principais:

- Pastor: `pastor@koinonia.local`
- Supervisor: `ana@koinonia.local`
- Líder: `bruno@koinonia.local`

A tela de login não deve exibir credenciais de desenvolvimento.

## Rotas Principais

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
src/styles           Tokens, base, layout, motion e utilitários globais.
src/lib              Prisma, autenticação, sessão e utilitários.
prisma               Schema, client gerado e seed.
docs                 Documentação por responsabilidade.
```

## Scripts Úteis

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run db:studio
```
