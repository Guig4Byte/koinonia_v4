# Koinonia — briefing para agentes

Este é o primeiro arquivo para qualquer pessoa ou IA que vá alterar o projeto. Ele resume o que deve ser preservado e aponta onde cada assunto mora.

## Ordem de leitura e autoridade

1. `docs/AGENT_BRIEFING.md` — orientação operacional rápida.
2. `docs/PRODUCT.md` — comportamento, escopo e fluxos do MVP.
3. `docs/GLOSSARY.md` — vocabulário oficial da UI.
4. `docs/ARCHITECTURE.md` — implementação, permissões, rotas, entidades e helpers.
5. `docs/Perfil.txt` — sensação mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada, sem autoridade sobre o MVP atual.

Quando houver conflito entre docs e código atual, preserve o comportamento do código e atualize os docs depois.

## Ideia central

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O MVP é um radar pastoral mobile-first para células. Ele ajuda liderança a perceber quem pode estar se afastando e facilita um gesto simples de cuidado.

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Ciclo oficial

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Papéis

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

| Papel | Responsabilidade padrão | Não deve virar |
| --- | --- | --- |
| Líder | Registrar presença, ajustar encontro da própria célula e cuidar da atenção local. | Operador de outras células. |
| Supervisor | Acompanhar células supervisionadas, exceções, padrões e pedidos de apoio. | Substituto do líder no check-in. |
| Pastor/Admin | Interpretar saúde geral, equipe, casos graves/encaminhados e buscar pessoas quando necessário. | Central de tickets ou fila de ausências. |

## Superfícies atuais

| Papel | Visão | Superfície estrutural | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

A UI usa `Encontros`. Rotas, entidades e código técnico continuam usando `eventos`/`Event`.

## Encontros e presença

- Pastor/Admin podem cadastrar/editar célula mínima: nome, agenda padrão, local padrão e ativa/inativa.
- Células ativas podem ter agenda padrão (`meetingDayOfWeek`, `meetingTime`, `locationName`).
- O sistema garante automaticamente encontros futuros para a janela configurada.
- O local efetivo fica no encontro (`Event.locationName`) e pode ser diferente do local padrão da célula.
- Remarcar encontro altera data/horário/local de uma ocorrência específica.
- `Cancelar encontro` é ação antes do horário.
- `Não houve encontro` é confirmação depois do horário.
- Encontro com presença registrada não pode ser cancelado, remarcado ou marcado como não realizado.
- Líder registra e ajusta presença; pastor/supervisor consultam o resumo.

## Responsabilidades de célula

A fonte atual para liderança e supervisão é `GroupResponsibility`.

- Use responsabilidades ativas (`activeUntil = null`) para escopo atual.
- O modelo suporta mais de um líder/supervisor por célula.
- Campos legados `leaderUserId` e `supervisorUserId` continuam apenas como compatibilidade temporária.
- Rode o backfill quando um banco antigo precisar migrar vínculos legados.

## Seções pastorais

Listas iniciais são para decisão, não exploração. Mostre primeiro quem pede cuidado agora, com poucos itens e ação clara.

Seções principais:

1. `Irmãos que precisam de um olhar especial`: urgentes ou encaminhados ao cuidado pastoral.
2. `Pedidos de apoio`: pedidos de apoio à supervisão.
3. `Acompanhar de perto`: atenção local comum.
4. `Acolhidos em cuidado`: pessoas em `Em cuidado`.

Regras:

- mostrar poucos itens inicialmente, normalmente até 4;
- usar `Ver mais` / `Mostrar menos` quando houver excedente;
- não transformar lista em diretório amplo;
- busca continua sendo busca de pessoa.

## Escalonamento

O MVP usa `CareSignal.assignedToId`, sem entidade de tarefa.

- `assignedToId` para supervisor = pedido de apoio.
- `assignedToId` para pastor/admin = encaminhamento pastoral.
- `severity = URGENT` = caso pastoral por gravidade.
- Líder pode encaminhar direto ao pastor em gravidade/sensibilidade, mas o caminho comum segue sendo pedir apoio à supervisão.
- Pedir apoio ou encaminhar pode registrar contexto opcional em `CareTouch`, sem resolver o sinal.

Mensagens devem ser contextuais ao perfil que está vendo. Não use frases como `Ana recebeu...` ou `Roberto recebeu...`.

Exemplos corretos:

- líder: `Apoio solicitado à supervisão.`
- supervisor: `Essa célula pediu apoio da supervisão.`
- pastor/admin: `Encaminhado ao cuidado pastoral.`
- líder/supervisor vendo encaminhamento pastoral: `Encaminhado ao pastor.`

A anotação de apoio/encaminhamento deve ser breve, opcional e aparecer no cuidado recente da pessoa. Não crie prontuário, tarefa ou fila a partir dela.

## Presença e ausência de dado

Use `src/features/events/presence-summary.ts` para cálculo pastoral e `src/features/events/presence-display.ts` para tom visual.

- Visitantes não entram no denominador.
- Evento sem marcação válida de membros não deve mostrar `0%`.
- Pessoa sem marcação explícita fica `Pendente`, nunca falta presumida.
- `Sem registro` é ausência real de dado, não risco automático.
- `Marcar todos como presentes` é atalho do líder e deve confirmar antes de sobrescrever ausências/justificativas.
- Quando precisar mostrar local/status de encontro, prefira `src/features/events/event-display.ts` para evitar divergência entre lista, detalhe e ações.

## Regras que não devem quebrar

- Check-in é operação do líder da célula.
- Pastor/supervisor veem presença em resumo; não registram, ajustam nem cancelam encontros.
- Check-in futuro não pode ser salvo.
- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Métrica sem dado aparece como ausência de dado, não `0%`.
- Listas de atenção agregam por pessoa, não por sinal bruto.
- Cards de lista usam CTA neutro, normalmente `Abrir pessoa`.
- `Ligar` e `WhatsApp` são atalhos, não categorias administrativas do histórico.
- `Já houve contato?` precisa confirmar antes de resolver atenção.
- Contato confirmado aparece como `Contato feito`.
- Se o cuidado resolver todos os sinais ativos no escopo, a pessoa fica `Em cuidado`.
- A pessoa só volta para `Ativo` por ação explícita.
- Grupo inativo não libera visibilidade, encontro, check-in ou histórico padrão.

## Limites atuais

Não implementar sem decisão explícita:

- cadastro público;
- recuperação de senha;
- gestão avançada de usuários;
- cadastro completo de pessoas/membros/responsáveis;
- importação em massa de planilhas;
- acompanhamento formal;
- CRM pastoral pesado;
- task manager, kanban, fila ou SLA;
- BI/analytics avançado;
- mapas/geolocalização/QR Code;
- notificações;
- área rica do membro;
- calendário amplo de igreja;
- formulários longos.

## Onde implementar

- Autenticação/sessão: `src/lib/auth`.
- Middleware: `middleware.ts`.
- Login/logout: `src/app/login`, `src/app/logout`.
- Permissões/escopo: `src/features/permissions/permissions.ts`.
- Navegação por papel: `src/features/navigation/app-nav.ts`.
- Responsabilidades/backfill: `src/features/groups/responsibilities-backfill.ts`, `prisma/backfill-group-responsibilities.ts`.
- Exibição de liderança/supervisão: `src/features/groups/responsibility-display.ts`.
- Geração de encontros: `src/features/events/schedule.ts`.
- Cadastro mínimo de célula: `src/app/(app)/celulas/actions.ts`, `src/app/(app)/celulas/nova/page.tsx`, `src/app/(app)/celulas/[groupId]/editar/page.tsx`, `src/components/group-form.tsx`, `src/features/groups/group-form.ts`.
- Presença: `src/features/events/presence-summary.ts`.
- Tom visual de presença: `src/features/events/presence-display.ts`.
- Local/status visual de encontro: `src/features/events/event-display.ts`.
- Data/hora de encontro no Horário de Brasília: `src/features/events/brasilia-date-time.ts`, `src/features/events/time-options.ts`, `src/lib/brasilia-time.ts`.
- Seleção de encontro relevante: `src/features/events/relevant-event.ts`.
- Ações de encontro: `src/app/api/events/[eventId]/route.ts`, `src/components/event-details-actions.tsx`.
- Check-in: `src/components/check-in-list.tsx`, `src/features/check-in/check-in-validation.ts`, `src/features/check-in/visitor-validation.ts`.
- Regras de sinais: `src/features/signals`.
- Ranking/ordenação de sinais: `src/features/signals/ranking.ts`.
- Status visual de sinais: `src/features/signals/display.ts`.
- Seções pastorais: `src/features/signals/sections.ts`.
- Status de pessoa: `src/features/people/status-display.ts`.
- Filtros de membros: `src/features/people/member-filters.ts`, `src/components/member-priority-list.tsx`.
- Busca/filtros de estrutura: `src/components/structure-search.tsx`, `src/components/cells-structure-search.tsx`, `src/components/team-structure-search.tsx`.
- Cards/listas pastorais: `src/components/cards.tsx`, `src/components/pastoral-list-cards.tsx`, `src/components/progressive-list.tsx`.
- Queries de dashboard: `src/features/dashboard/queries.ts`.
- Validação de cuidado: `src/features/care/care-validation.ts`.
- Respostas de API: `src/lib/api-response.ts`.
- Ações client-side com `fetch`: `src/lib/use-api-action.ts`.
- Helpers de query/texto: `src/lib/search-params.ts`, `src/lib/text.ts`.
- Tema: `src/features/theme/theme.ts`, `src/components/theme-init.tsx`, `src/components/theme-toggle.tsx`.
- Tamanho do texto: `src/features/text-size/text-size.ts`, `src/components/text-size-init.tsx`, `src/components/text-size-toggle.tsx`.

## Checklist antes de responder ou codar

1. A mudança respeita o ciclo oficial?
2. A mudança reduz esforço de cuidado?
3. O usuário autenticado continua sendo a fonte do papel?
4. Responsabilidades múltiplas continuam respeitadas?
5. O pastor continua fora da operação comum?
6. O supervisor continua acompanhando, não registrando presença?
7. O líder continua dono do check-in e das ações operacionais do encontro?
8. A linguagem vem do `GLOSSARY.md`?
9. As permissões usam helpers existentes?
10. A UI continua mobile-first e sem burocracia?
11. O patch promete apenas o que o código entrega?
12. Helpers compartilhados continuam seguros para client/server? Não importe Prisma Client em arquivo usado por componente `use client`.
