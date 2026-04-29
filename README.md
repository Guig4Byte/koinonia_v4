# Koinonia Lite

Koinonia Lite é a base mobile-first do Koinonia: um radar pastoral simples para células/grupos.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Fonte de verdade

Leia os documentos nesta ordem:

1. `docs/AGENT_BRIEFING.md` — entrada rápida para qualquer IA/agente.
2. `docs/PRODUCT.md` — visão oficial do MVP atual.
3. `docs/GLOSSARY.md` — vocabulário e rótulos de UI.
4. `docs/ARCHITECTURE.md` — regras técnicas, permissões e onde implementar.
5. `docs/Perfil.txt` — norte de experiência mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada; não governa o MVP atual.

Quando houver conflito, siga esta regra:

```txt
AGENT_BRIEFING -> PRODUCT -> GLOSSARY -> ARCHITECTURE -> Perfil -> Koinonia legado
```

`docs/Koinonia.txt` contém ideias amplas e futuras. Não use esse arquivo para puxar analytics, CRM, SLA, playbooks, mapas, QR Code ou acompanhamento formal para o MVP sem pedido explícito.

## MVP atual

O ciclo que o MVP deve provar é:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Regra de perfis:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Regra de visibilidade:

```txt
Líder resolve a atenção local.
Supervisor apoia exceções e padrões.
Pastor vê saúde geral, casos graves/escalados e busca qualquer pessoa quando precisar.
```

O pastor não é operador de sinais. Ele não deve receber toda ausência, visitante, retorno ou atenção cotidiana como fila padrão.

## O que existe agora

- Pessoas.
- Células/grupos.
- Eventos de célula.
- Check-in simples feito pelo líder da célula.
- Visitantes no check-in.
- Taxa de presença.
- Sinais de atenção por pessoa.
- Escalonamento mínimo via `CareSignal.assignedToId`.
- Visão macro do pastor.
- Visão de apoio do supervisor.
- Visão operacional do líder.
- Busca simples de pessoa.
- Detalhe simples de pessoa e célula.
- Contato/cuidado simples com anotação opcional.

## O que não existe de propósito

Não implemente sem pedido explícito:

- CRM pastoral completo.
- Acompanhamento formal.
- Task manager, kanban, fila ou SLA.
- BI/analytics avançado.
- Mapas, geolocalização ou QR Code.
- Notificações.
- Área rica do membro.
- Cadastro/formulários longos.
- Calendário amplo de igreja.

## Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS v4.
- Prisma ORM com PostgreSQL.
- Zod.
- Vitest.

## Como rodar

```bash
npm install
cp .env.example .env
# edite DATABASE_URL
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Modo demo

Ainda não há autenticação real. A interface usa seletor de perfil de demonstração:

```txt
Pastor | Supervisor | Líder
```

Esse seletor é temporário. A autenticação real deve substituir a origem do usuário mantendo o contrato de `getCurrentUser()`.

A seed demo simula:

- 1 pastor: Roberto.
- 3 supervisores: Ana, Marcos e Helena.
- 7 células.
- 12 membros ativos por célula.
- cenários de presença baixa, urgência, pedido de apoio e encaminhamento pastoral.

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
src/app              Rotas, telas e APIs.
src/components       Componentes visuais reutilizáveis.
src/features         Regras de domínio por feature.
src/lib              Prisma, sessão demo e utilitários.
prisma               Schema e seed.
docs                 Produto, vocabulário, arquitetura e briefing.
```
