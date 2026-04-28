# Koinonia Lite

Base limpa para o **Koinonia**: simples, bonito e focado em cuidado pastoral.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Escopo desta base

Esta versão nasce pequena e preparada para crescer:

- Pessoas
- Células / grupos
- Eventos, inicialmente reunião de célula
- Check-in simples
- Taxa de presença
- Sinais automáticos de atenção
- Ação direta: ligar, WhatsApp e marcar como cuidado
- Visão macro simples para pastor
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

## Estrutura

```txt
src/app              Rotas, telas e APIs
src/components       Componentes visuais reutilizáveis
src/features         Regras de domínio por feature
src/lib              Infraestrutura leve: Prisma, sessão demo, utilitários
prisma               Schema e seed
```

## Próximos passos recomendados

1. Validar o schema com dados reais de uma igreja pequena.
2. Implementar autenticação real substituindo o seletor demo.
3. Refinar o check-in do líder.
4. Criar testes de autorização por papel.
5. Transformar sinais em leitura pastoral ainda mais humana.

## Tema claro/escuro

A interface possui alternância local de tema no header. A escolha fica salva no `localStorage` em `koinonia-theme` e é aplicada antes da pintura inicial para evitar flash visual.
