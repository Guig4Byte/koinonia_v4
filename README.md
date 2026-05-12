# Koinonia Lite

Koinonia Lite é um radar pastoral mobile-first para células.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Mapa da documentação

O `README.md` é a porta de entrada do projeto. Ele resume contexto, stack, execução local e rotas principais; não substitui os documentos de decisão abaixo.

Leia os documentos nesta ordem:

1. `docs/AGENT_BRIEFING.md` — entrada operacional para qualquer IA/agente antes de alterar código.
2. `docs/PRODUCT.md` — fonte de verdade para comportamento, escopo e fluxos do MVP.
3. `docs/GLOSSARY.md` — fonte de verdade para vocabulário, rótulos e tons de UI.
4. `docs/ARCHITECTURE.md` — fonte técnica para entidades, autenticação, permissões, rotas e helpers.
5. `docs/FRONTEND.md` — fonte visual para componentes, CSS, Tailwind, CSS Modules e loading states.
6. `docs/Perfil.txt` — norte de experiência mobile/pastoral.
7. `docs/Koinonia.txt` — visão futura/legada; não governa o MVP atual.

Quando documentos entrarem em conflito, siga a responsabilidade de cada arquivo acima. Quando o código atual divergir dos documentos, preserve o comportamento existente e atualize a documentação na mesma mudança. `docs/Koinonia.txt` não autoriza analytics, CRM, SLA, playbooks, mapas, QR Code, gestão avançada de usuários ou acompanhamento formal sem pedido explícito.

## MVP atual

Ciclo:

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

Papéis:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Regra de visibilidade:

```txt
Líder cuida da atenção local.
Supervisor apoia exceções e padrões.
Pastor/Admin interpretam saúde geral, casos graves/encaminhados e buscas explícitas.
```

O pastor não é operador de sinais e não deve receber toda ausência ou atenção cotidiana como fila padrão.

## O que existe agora

- Autenticação real por e-mail e senha, com erro curto no login e opção de mostrar/ocultar senha.
- Sessão em cookie `HttpOnly` assinado.
- Tema local no login e no app.
- Pessoas.
- Células.
- Encontros de célula.
- Check-in simples feito pelo líder da célula.
- Visitantes no check-in.
- Métricas de presença que distinguem dado real de `Sem registro`.
- Sinais de atenção por pessoa.
- Escalonamento mínimo via `CareSignal.assignedToId`.
- Visão do pastor/admin.
- Equipe do pastor/admin para supervisores, células e cadastro mínimo de célula.
- Visão do supervisor.
- Células supervisionadas.
- Visão do líder.
- Busca simples de pessoa.
- Detalhe simples de pessoa, célula e encontro.
- Cadastro/edição mínima de célula: nome, dia padrão, horário padrão, local padrão e status ativa/inativa.
- Contato/cuidado simples com anotação opcional.

## O que não existe de propósito

Não implemente sem pedido explícito:

- Cadastro público.
- Recuperação de senha.
- Gestão avançada de usuários.
- CRM pastoral completo.
- Acompanhamento formal.
- Task manager, kanban, fila ou SLA.
- BI/analytics avançado.
- Mapas, geolocalização ou QR Code.
- Notificações.
- Área rica do membro.
- Formulários longos.
- Calendário amplo de igreja.

## Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS v4.
- Prisma ORM com PostgreSQL.
- Zod.
- Vitest.
- `bcryptjs` para senha.
- `jose` para sessão assinada.

## Como rodar

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

## Autenticação local

O app usa e-mail e senha. A sessão fica no cookie `koinonia-session`.

Defina um segredo de sessão no `.env`:

```env
KOINONIA_SESSION_SECRET="troque-por-um-valor-longo-e-aleatorio"
```

Em desenvolvimento, a seed cria usuários locais com a senha:

```txt
koinonia123
```

Acessos principais:

- Pastor: `pastor@koinonia.local`
- Supervisor: `ana@koinonia.local`
- Líder: `bruno@koinonia.local`

A seed também cria cenários pastorais para validar escopo, presença, atenção, pedidos de apoio, encaminhamento pastoral e célula inativa. Os detalhes técnicos da seed ficam em `docs/ARCHITECTURE.md`.

## Tema

O tema é salvo localmente no aparelho com a chave `koinonia-theme`.

Temas disponíveis:

- `Claro`
- `Pergaminho`
- `Escuro`

O botão de tema aparece no login e no app autenticado.

## Scripts úteis

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:studio
```

## Estrutura

```txt
src/app              Rotas, telas, login/logout, loading states de rota e APIs.
src/components       UI primitives, layout global e componentes compartilhados.
src/features         Regras e componentes de domínio por feature.
src/styles           Tokens, base, layout, motion e utilitários globais.
src/lib              Prisma, autenticação, sessão e utilitários.
prisma               Schema e seed.
docs                 Produto, vocabulário, arquitetura, front-end e briefing.
```

## Rotas principais

```txt
/login               Entrada pública.
/logout              Encerra sessão.
/
  redireciona para a visão do papel.

/pastor              Visão do pastor/admin.
/equipe              Equipe, supervisores e células para pastor/admin.
/supervisor          Visão do supervisor.
/celulas             Células supervisionadas.
/lider               Visão do líder.
/pessoas             Pessoas/membros dentro da superfície padrão.
/pessoas/[personId]  Detalhe da pessoa.
/celulas/nova        Cadastro mínimo de célula para pastor/admin.
/celulas/[groupId]   Detalhe da célula.
/celulas/[groupId]/editar  Edição mínima de célula para pastor/admin.
/eventos             Encontros visíveis.
/eventos/[eventId]   Check-in ou resumo do encontro.
```
