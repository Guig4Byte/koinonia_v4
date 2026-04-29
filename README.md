# Koinonia Lite

Base limpa para o **Koinonia**: simples, bonito, mobile-first e focado em cuidado pastoral.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Antes de mexer no projeto

Leia sempre, nesta ordem:

```txt
docs/AGENT_BRIEFING.md
docs/PRODUCT.md
docs/GLOSSARY.md
docs/ARCHITECTURE.md
docs/Perfil.txt
docs/Koinonia.txt
```

Ordem de autoridade para decisões:

1. `docs/AGENT_BRIEFING.md` — resumo operacional para agentes.
2. `docs/PRODUCT.md` — recorte oficial do MVP atual.
3. `docs/GLOSSARY.md` — vocabulário oficial para evitar mistura de conceitos.
4. `docs/ARCHITECTURE.md` — organização técnica e regras de arquitetura.
5. `docs/Perfil.txt` — norte de experiência mobile/pastoral.
6. `docs/Koinonia.txt` — visão ampla e futura do produto.

Importante: `docs/Koinonia.txt` inspira o futuro, mas **não governa o escopo atual** quando entrar em conflito com o MVP Lite. Para esta base, o MVP atual é governado por `AGENT_BRIEFING.md`, `PRODUCT.md` e `GLOSSARY.md`.

## Norte do produto

O MVP atual deve provar este ciclo:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Regra de perfis:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Regra de visibilidade pastoral:

```txt
Líder resolve a atenção local.
Supervisor apoia exceções e padrões.
Pastor vê saúde geral, casos graves/escalados e busca qualquer pessoa quando precisar.
```

O pastor não deve virar central de sinais operacionais. Ausências comuns, visitantes e retornos simples devem nascer perto do líder e subir apenas quando houver gravidade, recorrência ou escalonamento.

## Escopo desta base

Esta versão nasce pequena e preparada para crescer:

- Pessoas
- Células / grupos
- Eventos, inicialmente reunião de célula
- Check-in simples
- Taxa de presença
- Visitantes no check-in
- Atenções automáticas por nível de responsabilidade
- Ação direta: ligar, WhatsApp, contato feito e anotação opcional
- Visão macro simples para pastor, centrada na saúde geral das células/eventos e em casos realmente pastorais
- Visão de células para supervisor
- Visão operacional para líder

Fora do MVP:

- BI avançado
- Mapas
- QR Code
- Geolocalização
- Área rica do membro
- Playbooks e SLA
- CRM pastoral burocrático
- Formulários longos
- Task manager complexo

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Prisma ORM v7+ com PostgreSQL
- Zod para validação de entrada
- Vitest para regras de domínio

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

A tela tem um seletor de perfil de demonstração: Pastor, Supervisor e Líder.
Isso é intencional nesta base. A autenticação real deve entrar depois, por trás do mesmo contrato de `getCurrentUser()`.

A seed demo simula uma igreja um pouco maior para validar escopo real:
1 pastor, 3 supervisores, 7 células e 12 membros ativos por célula. O seletor atual entra nos perfis principais: Roberto/Pastor, Ana/Supervisora e Bruno/Líder. Os demais supervisores e líderes existem para validar a visão pastoral, a saúde das células e a separação de escopo.

## Scripts úteis

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:studio
```

## Princípios de produto

1. A pessoa é o centro.
2. Presença é sinal, não fiscalização.
3. Evento existe para revelar cuidado necessário.
4. Registro só existe quando evita esquecimento.
5. O mobile deve aliviar, não cobrar.
6. Líder registra check-in; pastor e supervisor acompanham.
7. O pastor não recebe toda atenção operacional por padrão; ele interpreta saúde geral e casos realmente pastorais.

## Estrutura

```txt
src/app              Rotas, telas e APIs
src/components       Componentes visuais reutilizáveis
src/features         Regras de domínio por feature
src/lib              Infraestrutura leve: Prisma, sessão demo, utilitários
prisma               Schema e seed
docs                 Briefing, produto e arquitetura
```

## Próximos passos recomendados

1. Revalidar os fluxos principais em mobile.
2. Revalidar a visão do pastor: saúde geral, casos urgentes e casos encaminhados.
3. Refinar o escalonamento simples já implementado via `CareSignal.assignedToId`, sem virar task manager.
4. Implementar autenticação real substituindo o seletor demo.
5. Só depois considerar novas capacidades.

## Tema

A interface possui alternância local de tema no header. A escolha fica salva no `localStorage` em `koinonia-theme` e é aplicada antes da pintura inicial para evitar flash visual.
