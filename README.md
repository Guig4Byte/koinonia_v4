# Koinonia Lite

Koinonia Lite é um radar pastoral mobile-first para células.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Fonte de verdade

Leia os documentos nesta ordem:

1. `docs/AGENT_BRIEFING.md` — entrada rápida para qualquer IA/agente.
2. `docs/PRODUCT.md` — visão oficial do MVP atual.
3. `docs/GLOSSARY.md` — vocabulário e rótulos de UI.
4. `docs/ARCHITECTURE.md` — regras técnicas, autenticação, permissões e onde implementar.
5. `docs/Perfil.txt` — norte de experiência mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada; não governa o MVP atual.

Quando houver conflito, siga a ordem acima. `docs/Koinonia.txt` não autoriza analytics, CRM, SLA, playbooks, mapas, QR Code, gestão avançada de usuários ou acompanhamento formal sem pedido explícito.

## MVP atual

Ciclo:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
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
- Eventos de célula.
- Check-in simples feito pelo líder da célula.
- Visitantes no check-in.
- Métricas de presença que distinguem dado real de `Sem registro`.
- Sinais de atenção por pessoa.
- Escalonamento mínimo via `CareSignal.assignedToId`.
- Visão do pastor/admin.
- Visão do supervisor.
- Visão do líder.
- Busca simples de pessoa.
- Detalhe simples de pessoa, célula e evento.
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

A seed também cria outros supervisores/líderes para validar escopo, presença baixa, urgência, pedido de apoio, encaminhamento pastoral e célula inativa.

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
src/app              Rotas, telas, login/logout e APIs.
src/components       Componentes visuais reutilizáveis.
src/features         Regras de domínio por feature.
src/lib              Prisma, autenticação, sessão e utilitários.
prisma               Schema e seed.
docs                 Produto, vocabulário, arquitetura e briefing.
```

## Rotas principais

```txt
/login               Entrada pública.
/logout              Encerra sessão.
/
  redireciona para a visão do papel.

/pastor              Visão do pastor/admin.
/supervisor          Visão do supervisor.
/lider               Visão do líder.
/pessoas             Pessoas/membros dentro da superfície padrão.
/pessoas/[personId]  Detalhe da pessoa.
/celulas/[groupId]   Detalhe da célula.
/eventos             Eventos visíveis.
/eventos/[eventId]   Check-in ou resumo do evento.
```
