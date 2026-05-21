# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP: organização do código, entidades, autenticação, permissões, rotas e limites de implementação. Para comportamento de produto, use `PRODUCT.md`. Para linguagem de UI, use `GLOSSARY.md`. Para regras visuais de front-end, use `FRONTEND.md`.

## Âncoras que a arquitetura deve proteger

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

```txt
Sinal não é tarefa.
Pastor não é operador de sinais.
Supervisor não substitui o líder no encontro.
```

A pessoa é o centro. Presença é fonte de leitura pastoral. A arquitetura deve impedir que atenção operacional comum suba automaticamente para o pastor.

## Estrutura do projeto

```txt
src/app
  Rotas, páginas, layouts, loading.tsx, login/logout, server actions e API handlers.

src/components/ui
  Primitives visuais reutilizáveis, sem regra de domínio.

src/components/layout
  Shell, navegação, tema e tamanho de texto.

src/components/shared
  Componentes compartilhados entre features, sem pertencer a uma única rota.

src/features
  Regras, helpers de apresentação e componentes de domínio por feature.

src/styles
  Fundação visual global: tokens, base, layout, motion e utilitários.

src/lib
  Infraestrutura: Prisma, autenticação, sessão, respostas de API, helpers genéricos de texto/query e utilitários compartilhados.

prisma
  Schema, client gerado, seed e scripts de manutenção.

docs
  Produto, vocabulário, arquitetura, front-end e briefing para agentes.
```

## Regra de UI/CSS

A regra visual detalhada fica em `docs/FRONTEND.md`. Este arquivo mantém apenas os limites arquiteturais que afetam implementação.

Regras de fronteira:

- `src/styles` contém somente CSS global de fundação;
- não recriar `components.css` ou `legacy-components.css`;
- estilos locais devem ficar como `.module.css` ao lado do componente;
- `src/components/ui` não deve importar regra de domínio;
- componentes específicos devem morar em `src/features/*/components`;
- páginas devem compor dados e componentes, não concentrar markup visual repetido;
- componente `use client` não deve importar Prisma Client nem helper server-only.

Consulte `docs/FRONTEND.md` para primitives, CSS Modules, loading states, tokens e checklist visual.

## Entidades principais

| Entidade | Papel |
| --- | --- |
| `Church` | escopo institucional |
| `User` | usuário autenticado, papel e vínculo opcional com `Person` |
| `Person` | centro do cuidado |
| `SmallGroup` | célula/grupo, agenda padrão e local padrão |
| `GroupResponsibility` | liderança/supervisão ativa da célula |
| `GroupMembership` | vínculo da pessoa com célula |
| `Event` | encontro da célula, local efetivo e status |
| `Attendance` | presença no encontro |
| `CareSignal` | sinal que sustenta atenção |
| `CareTouch` | contato/cuidado registrado, incluindo contexto opcional de apoio/encaminhamento |

## Modelo atual de célula e encontro

### `SmallGroup`

Campos relevantes:

```txt
meetingDayOfWeek
meetingTime
locationName
eventsGeneratedUntil
isActive
```

`GroupResponsibility` é a única fonte de verdade para liderança e supervisão. O schema não mantém campos legados de líder/supervisor em `SmallGroup`.

### `GroupResponsibility`

Representa responsabilidades ativas da célula.

```txt
groupId
userId
role: LEADER | SUPERVISOR
activeFrom
activeUntil
```

Use `activeUntil = null` para responsabilidade atual. Esse modelo permite casal, coliderança e supervisão compartilhada.

### `Event`

Campos relevantes:

```txt
startsAt
scheduleStartsAt
locationName
generatedFromSchedule
status
```

- `locationName`: local efetivo daquele encontro.
- `scheduleStartsAt`: ocorrência original da agenda; evita duplicação quando o encontro é remarcado.
- `generatedFromSchedule`: indica encontro criado pela agenda automática.
- `status`: `SCHEDULED`, `CHECKIN_OPEN`, `COMPLETED`, `CANCELLED`, `NO_MEETING`.

`CANCELLED` é cancelamento antes do horário. `NO_MEETING` é confirmação depois do horário de que a célula não se reuniu.

## Autenticação e sessão

Fontes principais:

```txt
middleware.ts
src/app/login/page.tsx
src/app/login/actions.ts
src/app/login/login-form-controls.tsx
src/app/logout/route.ts
src/lib/auth/current-user.ts
src/lib/auth/password.ts
src/lib/auth/redirects.ts
src/lib/auth/session.ts
src/lib/auth/token.ts
```

Regras:

- login por e-mail e senha;
- senha em `User.passwordHash`;
- validação com `bcryptjs`;
- sessão em cookie `HttpOnly` chamado `koinonia-session`;
- token assinado com `jose`;
- duração padrão de 7 dias;
- segredo via `KOINONIA_SESSION_SECRET`, `AUTH_SECRET` ou `NEXTAUTH_SECRET`;
- em produção, segredo de sessão é obrigatório;
- `/login` redireciona usuário autenticado para a visão do papel;
- o formulário de login usa server action e componente cliente apenas para estados visuais, loading, erro e mostrar/ocultar senha;
- `/logout` limpa a sessão;
- middleware redireciona páginas privadas sem sessão para `/login`;
- middleware responde `401` para API privada sem sessão;
- `getAuthenticatedUser()` retorna usuário ou `null`;
- `getCurrentUser()` redireciona para `/login` quando não há usuário autenticado.

Não existe fallback demo, troca manual de perfil nem recuperação pública de senha.

## Redirecionamento e navegação

Home por papel:

| Papel | Home |
| --- | --- |
| `ADMIN` | `/pastor` |
| `PASTOR` | `/pastor` |
| `SUPERVISOR` | `/supervisor` |
| `LEADER` | `/lider` |

Fontes:

```txt
src/lib/auth/redirects.ts
src/features/navigation/app-nav.ts
```

`app-nav.ts` centraliza `Visão`, aba secundária (`Membros`, `Células` ou `Equipe`), `Encontros`, estado ativo e indicador visual. Não montar `nav={[...]}` manualmente nas páginas sem necessidade clara.

## Permissões e escopo

Fonte principal:

```txt
src/features/permissions/permissions.ts
```

Helpers principais:

```ts
canViewGroup(user, group)
canViewPerson(user, person)
canViewEvent(user, event)
canCheckInEvent(user, event)
canManageEventDetails(user, event)
canRegisterCare(user, person)
canUsePastorDashboard(user)
canUseSupervisorDashboard(user)
canUseLeaderDashboard(user)
getVisibleGroupWhere(user)
getVisibleEventWhere(user)
getVisiblePersonWhere(user)
getVisibleMembershipWhere(user)
getVisibleOpenSignalWhere(user)
getVisibleCareTouchWhere(user, personId?)
getOpenSignalInActiveGroupWhere(churchId)
getVisibleGroupIdsForPerson(user, person)
getPrimaryVisibleGroupIdForPerson(user, person)
hasWholeChurchScope(user)
```

Regras:

- Pastor/Admin: escopo amplo para busca/leitura autorizada, mas listas padrão filtram relevância pastoral.
- Supervisor: grupos ativos onde tem responsabilidade `SUPERVISOR`.
- Líder: grupos ativos onde tem responsabilidade `LEADER`.
- Check-in: somente líder ativo da célula, encontro já iniciado e não fechado.
- Ações operacionais do encontro: somente líder ativo da célula.
- Pastor/supervisor podem ver encontro dentro do escopo, mas não ajustar/cancelar/remarcar.
- Pastor/Admin podem cadastrar e editar dados básicos de célula.
- Contato/cuidado: somente quem tem escopo pastoral sobre a pessoa.
- Grupo inativo não deve liberar visibilidade, encontro, check-in ou histórico padrão.
- Sinais sem grupo podem continuar visíveis quando estiverem dentro do escopo institucional.

## Exibição de responsabilidades

A exibição de liderança/supervisão compartilhada usa:

```txt
src/features/groups/responsibility-display.ts
```

Como não há campos legados em `SmallGroup`, criação, escopo e exibição devem consultar responsabilidades ativas em `GroupResponsibility`.

## Geração automática de encontros

Fonte:

```txt
src/features/events/schedule.ts
```

Helpers principais:

```ts
ensureUpcomingCellMeetingsForUser()
scheduledCellMeetingStarts()
parseMeetingTime()
```

Regras:

- a janela padrão é `DEFAULT_CELL_MEETING_GENERATION_WEEKS`;
- só gera para células ativas com `meetingDayOfWeek` e `meetingTime`;
- respeita o escopo visível do usuário;
- copia `SmallGroup.locationName` para `Event.locationName`;
- grava `scheduleStartsAt` com a ocorrência original;
- verifica eventos existentes por `startsAt` e `scheduleStartsAt`;
- atualiza `SmallGroup.eventsGeneratedUntil`.

Chamadas atuais ocorrem nas telas que dependem de encontros, como `/eventos` e `/lider`.

## Listagem e consultas de encontros

Fontes:

```txt
src/app/(app)/eventos/page.tsx
src/features/events/events-page-view.ts
src/features/events/components/events-page-sections.tsx
src/features/events/components/events-page-sections.module.css
```

Regras:

- `EVENTS_PAGE_HISTORY_LOOKBACK_DAYS` define a janela consultada pelo servidor;
- `buildEventsHomeSections()` separa encontros de hoje e próximos encontros da semana;
- encontros futuros sem presença aparecem em próximos encontros;
- encontros passados sem presença válida aparecem na consulta `sem-presenca`;
- encontros com presença válida aparecem na consulta `historico`;
- `readEventConsultationMode()` aceita apenas `sem-presenca` e `historico`;
- `readEventPeriod()` aceita `semana`, `semana-passada` e `30d`, conforme o modo;
- cards de consulta têm variantes próprias para pendência e histórico, sem alterar a regra de permissão;
- `eventMeta()` evita repetir o nome da célula quando o título já identifica o grupo.

## Ações do encontro

Fontes:

```txt
src/app/api/events/[eventId]/route.ts
src/features/events/components/event-details-actions.tsx
src/features/events/event-display.ts
src/features/events/brasilia-date-time.ts
src/features/events/time-options.ts
```

`PATCH /api/events/[eventId]` aceita:

```txt
locationName
startsAt
status
```

Regras de backend:

- usuário deve ser líder ativo da célula;
- `locationName` não pode ser vazio quando enviado;
- `startsAt` inválido é rejeitado;
- não pode remarcar encontro com presença registrada;
- não pode cancelar ou marcar como não realizado encontro com presença registrada;
- `CANCELLED` só vale para encontro futuro;
- `NO_MEETING` só vale para encontro já iniciado/passado;
- remarcação preserva `scheduleStartsAt` e marca `generatedFromSchedule = false`;
- duplicata de `groupId + startsAt + type` é bloqueada.

No client, remarcação usa data `dd/mm/aaaa` e horário `hh:mm` no Horário de Brasília (`UTC-3`) para evitar o seletor nativo de `datetime-local`. A lógica de parse, formatação, calendário e opções de horário fica em `src/features/events/brasilia-date-time.ts` e `src/features/events/time-options.ts`; não duplicar esses helpers dentro de componentes.

`src/features/events/event-display.ts` centraliza local efetivo e rótulos de encontro fechado sem presença. Esse arquivo é usado por páginas e componentes client-side, então não deve importar Prisma Client diretamente.

## Presença

Fontes principais:

```txt
src/features/events/presence-summary.ts
src/features/events/presence-display.ts
src/components/shared/presence-metric.tsx
src/features/dashboard/presence-health.ts
```

Helpers de resumo:

```ts
isPresenceRecordedEvent()
summarizePresenceFromAttendances()
summarizeEventPresence()
summarizeEventsPresence()
```

Helper de apresentação:

```ts
presenceTone()
formatPresenceRate()
PresenceMetricDisplay
PresenceIndicator
PresenceProgressDisplay
```

Regras:

- `AttendanceStatus.VISITOR` não entra no denominador;
- `hasPresenceData` indica se existe dado pastoral válido;
- UI deve mostrar `—` ou `Sem registro` quando `hasPresenceData` for falso;
- percentual não deve indicar risco sem dado real;
- eventos concluídos sem marcação válida continuam sendo ausência de dado, não `0%`;
- use `presenceTone()` para tom visual de presença, mantendo limiares explícitos quando a superfície usa thresholds diferentes;
- `PresenceMetricDisplay` e derivados centralizam indicador visual, progresso, `aria-label` e tratamento de ausência de dado;
- saúde semanal usa `src/features/dashboard/presence-health.ts` para labels e thresholds de visão geral.

## Check-in

Rota:

```txt
src/app/api/events/[eventId]/check-in/route.ts
```

Componentes:

```txt
src/features/check-in/components/check-in-list.tsx
```

Regras:

- somente líder ativo da célula salva check-in;
- evento pertence à igreja do usuário;
- evento não é futuro;
- evento não está `CANCELLED` ou `NO_MEETING`;
- cada membro ativo não visitante aparece exatamente uma vez no payload;
- ninguém de fora da célula entra como membro;
- status de membro aceita `PRESENT`, `ABSENT` ou `JUSTIFIED`;
- visitantes entram apenas pelo bloco de visitantes;
- visitante duplicado no mesmo encontro é bloqueado por nome normalizado;
- encontro concluído pode ser editado pelo líder como correção.

No modo de registro/ajuste, a tela usa header compacto, oculta a navegação inferior e mostra barra de salvar.

## Sinais e atenção

Fontes:

```txt
src/features/signals
src/features/people/status-display.ts
```

Helpers importantes:

```ts
getPrimarySignalsByPerson()
splitPastoralSections()
sortSignalsForPastoralViewer()
signalBadgeForViewer()
signalDetailForViewer()
personEffectiveBadgeForViewer()
isUrgentOrPastoralCase()
isSupportRequest()
isInCarePerson()
signalSeverityRank()
compareSignalsBySeverityAndRecency()
```

Regras:

- atenção por ausência só nasce de encontro real, passado e com presença registrada;
- evento futuro, cancelado, não realizado, pendente ou sem marcação explícita não vira falta presumida;
- listas de atenção agregam por pessoa;
- seleção pastoral prioriza caso pastoral/urgente, depois pedido de apoio, depois atenção local, depois severidade/recência;
- status efetivo da pessoa usa sinal primário visível antes de `Person.status`;
- ranking de severidade/recência fica em `src/features/signals/ranking.ts` para evitar ordenações divergentes entre atenção e seções.

## Contato e cuidado

Rota:

```txt
/api/care/[personId]
```

Regras:

- valida payload;
- valida escopo;
- associa cuidado a uma célula visível quando aplicável;
- resolve somente sinais ativos dentro do escopo do usuário;
- pastor/admin resolvem sinais sem grupo ou em grupo ativo;
- líder/supervisor resolvem sinais dos grupos ativos visíveis da pessoa;
- se resolver todos os sinais ativos, muda `Person.status` para `COOLING_AWAY`.

`Ligar` e `WhatsApp` são atalhos externos de aproximação. O registro persistido de contato confirmado usa `MARKED_CARED` e aparece como `Contato feito`, sem classificar o canal.

`Registrar contato pastoral` só chama a rota depois de confirmação explícita. O detalhe da pessoa mostra poucos itens em `Histórico de cuidado` e revela o restante com `Mostrar histórico completo`.

Componentes client-side que chamam APIs devem preferir `src/hooks/use-api-action.ts` para manter o padrão de `useTransition`, leitura de erro e `router.refresh()`. Rotas de API devem preferir `src/lib/api-response.ts` para respostas JSON simples sem mudar o contrato de payload.

### Apoio e encaminhamento

Rota:

```txt
/api/signals/[signalId]/support
```

Regras:

- líder pode pedir apoio à supervisão quando lidera a célula do sinal;
- líder pode encaminhar direto ao pastor quando lidera a célula do sinal e houver gravidade ou sensibilidade;
- supervisor pode encaminhar ao pastor quando supervisiona a célula do sinal;
- a ação atualiza `CareSignal.assignedToId`;
- a ação cria um `CareTouch` com `REQUESTED_SUPPORT` ou `ESCALATED_TO_PASTOR`;
- a anotação é opcional, limitada e não resolve o sinal automaticamente;
- o histórico da pessoa mostra esse registro como cuidado recente, sem virar tarefa ou prontuário;
- o detalhe da pessoa mostra poucos registros inicialmente e usa `Mostrar histórico completo` para revelar os demais.

## Queries de visão

Fonte:

```txt
src/features/dashboard/queries.ts
```

Regras:

- visão do pastor: saúde geral + casos pastorais;
- visão do supervisor: grupos supervisionados + pedidos de apoio + exceções;
- visão do líder: célula liderada + encontro relevante + pessoas no radar;
- evitar duplicar pessoa em seções da mesma tela;
- `supportRequests` representa pessoas/casos relevantes, não fila bruta de sinais;
- métricas de presença consideram apenas encontros com dado válido.

## Componentes e helpers compartilhados

Componentes reutilizáveis devem preservar linguagem pastoral e evitar duplicar regras de domínio em páginas. A organização visual completa fica em `docs/FRONTEND.md`.

Fontes principais:

```txt
src/components/ui
src/components/layout
src/components/shared
src/features/*/components
src/features/people/member-filters.ts
src/features/groups/cells-page-filters.ts
src/features/team/team-filters.ts
src/lib/filter-param.ts
src/lib/search-params.ts
src/lib/text.ts
src/lib/format.ts
```

Regras:

- `src/components/ui` concentra primitives visuais genéricos antes de novas classes locais ou variantes soltas.
- `src/components/shared/structure-search.tsx` centraliza busca e chips de superfícies estruturais; wrappers de feature ficam em `features/groups` e `features/team`.
- `src/components/shared/presence-metric.tsx` centraliza indicadores visuais de presença; novas superfícies devem reutilizá-lo antes de criar anéis/barras próprios.
- `src/features/people/components/member-priority-list.tsx` centraliza a lista pastoral de membros, separando pessoas no radar e ativos.
- `member-filters.ts`, `cells-page-filters.ts` e `team-filters.ts` devem usar `src/lib/filter-param.ts` para valores, labels comuns e parsing de query param.
- `firstParam()` deve ser usado para leitura simples de `searchParams` em páginas server-side.
- `normalizeSearchText()` e `matchesNormalizedQuery()` devem ser usados para busca local sem acento/case-insensitive.
- `countLabel()`, datas curtas e horários devem sair de `src/lib/format.ts`; código de app não deve importar `brasilia-time.ts` diretamente sem motivo específico.
- Cards pastorais devem calcular apresentação visual localmente ou por helpers compartilhados; páginas não devem duplicar iniciais, tons de presença ou composição básica de card.

## Cadastro mínimo de célula

Fontes:

```txt
src/app/(app)/celulas/actions.ts
src/app/(app)/celulas/nova/page.tsx
src/app/(app)/celulas/[groupId]/editar/page.tsx
src/features/groups/components/group-form.tsx
src/features/groups/group-form.ts
```

Regras:

- somente Pastor/Admin pode cadastrar ou editar célula;
- campos atuais: nome, dia padrão, horário padrão, local padrão e ativa/inativa;
- dia e horário padrão devem ser preenchidos juntos, ou ambos ficam vazios;
- liderança, supervisão, membros e usuários ficam fora desta fase;
- ao alterar agenda, local padrão ou status da célula, encontros futuros gerados automaticamente e ainda não registrados podem ser regenerados;
- células inativas não aparecem nas superfícies padrão, encontros ou check-in.

## Rotas principais

| Rota | Função |
| --- | --- |
| `/login` | entrada pública |
| `/logout` | encerra sessão |
| `/` | redireciona para home do papel |
| `/pastor` | visão do pastor/admin |
| `/equipe` | estrutura pastoral para pastor/admin |
| `/supervisor` | visão do supervisor |
| `/celulas` | células supervisionadas |
| `/celulas/nova` | cadastro mínimo de célula para pastor/admin |
| `/celulas/[groupId]` | detalhe da célula |
| `/celulas/[groupId]/editar` | edição mínima de célula para pastor/admin |
| `/lider` | visão do líder |
| `/pessoas` | membros do líder |
| `/pessoas/[personId]` | detalhe da pessoa |
| `/eventos` | `Encontros` na UI |
| `/eventos?consulta=sem-presenca` | encontros passados sem presença registrada |
| `/eventos?consulta=historico` | encontros com presença registrada |
| `/eventos/[eventId]` | detalhe/resumo/registro do encontro |
| `/api/search` | busca de pessoa |

## Tema e tamanho do texto

Fontes de tema:

```txt
src/features/theme/theme.ts
src/components/layout/theme-init.tsx
src/components/layout/theme-toggle.tsx
src/app/globals.css
```

Fontes de tamanho do texto:

```txt
src/features/text-size/text-size.ts
src/components/layout/text-size-init.tsx
src/components/layout/text-size-toggle.tsx
src/app/globals.css
```

Regras:

- tema é armazenado no `localStorage` como `koinonia-theme`;
- valores válidos de tema: `light`, `parchment`, `dark`;
- `ThemeInit` aplica o tema antes da renderização principal;
- `ThemeToggle` aparece no app autenticado e na tela de login;
- tamanho do texto é armazenado no `localStorage` como `koinonia-text-size`;
- valores válidos de tamanho do texto: `normal`, `large`, `extra-large`;
- `TextSizeInit` aplica o tamanho antes da renderização principal;
- `TextSizeToggle` alterna entre `Normal`, `Grande` e `Muito grande`;
- tema e tamanho do texto são preferências locais do aparelho e não devem ser persistidos no banco nesta fase.

## Seed de desenvolvimento

A seed é para desenvolvimento e teste local. Produção deve usar migrations e cadastros reais.

Usuários principais de desenvolvimento:

```txt
pastor@koinonia.local
ana@koinonia.local
bruno@koinonia.local
```

Senha padrão local:

```txt
koinonia123
```

A tela de login não deve exibir credenciais de desenvolvimento.

## Scripts úteis

```txt
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
npm run lint
npm run typecheck
npm test
npm run build
```


## Próximas ações pastorais

Use `src/components/shared/next-action-card.tsx` como superfície visual compartilhada para a próxima ação pastoral dos dashboards. A decisão de prioridade, rota e CTA deve vir de helpers de view da home correspondente, não do JSX da página. Detalhes consultivos, como célula ou encontro, devem preferir diagnóstico e orientação pastoral sem criar um CTA quando o usuário já tem caminhos naturais na tela.
