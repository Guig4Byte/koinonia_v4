# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP: organização do código, entidades, autenticação, permissões, rotas e limites de implementação. Para comportamento de produto, use `PRODUCT.md`. Para linguagem de UI, use `GLOSSARY.md`.

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
  Rotas, páginas, login/logout, server actions e API handlers.

src/components
  Componentes reutilizáveis de UI. Devem ser majoritariamente burros. Componentes client-side ficam aqui quando dependem de estado, navegação ou interação.

src/features
  Regras de domínio por feature. Helpers de apresentação que protegem linguagem/status pastoral também ficam aqui quando são específicos do domínio.

src/lib
  Infraestrutura: Prisma, autenticação, sessão, respostas de API, helpers genéricos de texto/query e utilitários compartilhados.

prisma
  Schema, client gerado, seed e scripts de manutenção.

docs
  Produto, vocabulário, arquitetura e briefing para agentes.
```

## Regra de UI/CSS

A UI deve separar decisão de design, primitivos visuais e componentes de domínio para evitar crescimento de CSS global e conflitos com Tailwind.

```txt
tokens.css
  Guarda decisões de design: cores, tipografia, raios, sombras e aliases.

components/ui/
  Primitivos visuais reutilizáveis. Usam Tailwind e CSS variables.
  Não usam classes k-* nem termos de domínio pastoral.

components/
  Componentes de domínio. Usam Tailwind para layout, espaçamento e composição.
  Estados visuais simples ficam em variant maps no componente React.
  CSS global só para pseudo-elementos, efeitos estruturais ou estados difíceis de expressar com Tailwind.

components.css
  Arquivo controlado/legado. Não deve receber novas classes sem justificativa.
  Deve encolher conforme estados simples migram para componentes.

utilities.css
  Utilitários compartilhados pequenos. Quando forem tipográficos, devem consumir tokens --text-*.
```

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
- `/logout` limpa a sessão;
- middleware redireciona páginas privadas sem sessão para `/login`;
- middleware responde `401` para API privada sem sessão;
- `getAuthenticatedUser()` retorna usuário ou `null`;
- `getCurrentUser()` redireciona para `/login` quando não há usuário autenticado.

Não existe fallback demo nem troca manual de perfil.

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

## Ações do encontro

Fontes:

```txt
src/app/api/events/[eventId]/route.ts
src/components/event-details-actions.tsx
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
```

Regras:

- `AttendanceStatus.VISITOR` não entra no denominador;
- `hasPresenceData` indica se existe dado pastoral válido;
- UI deve mostrar `—` ou `Sem registro` quando `hasPresenceData` for falso;
- percentual não deve indicar risco sem dado real;
- eventos concluídos sem marcação válida continuam sendo ausência de dado, não `0%`;
- use `presenceTone()` para tom visual de presença, mantendo limiares explícitos quando a superfície usa thresholds diferentes.

## Check-in

Rota:

```txt
src/app/api/events/[eventId]/check-in/route.ts
```

Componentes:

```txt
src/components/check-in-list.tsx
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

`Já houve contato?` só chama a rota depois de confirmação explícita. O detalhe da pessoa mostra poucos itens em `Cuidado recente` e revela o restante com `Ver histórico`.

Componentes client-side que chamam APIs devem preferir `src/lib/use-api-action.ts` para manter o padrão de `useTransition`, leitura de erro e `router.refresh()`. Rotas de API devem preferir `src/lib/api-response.ts` para respostas JSON simples sem mudar o contrato de payload.

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
- o detalhe da pessoa mostra poucos registros inicialmente e usa `Ver histórico` para revelar os demais.

## Queries de dashboard

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

Componentes reutilizáveis devem preservar linguagem pastoral e evitar duplicar regras de domínio em páginas.

Fontes principais:

```txt
src/components/structure-search.tsx
src/components/structure-search-config.ts
src/components/cells-structure-search.tsx
src/components/team-structure-search.tsx
src/components/member-priority-list.tsx
src/components/base-cards.tsx
src/components/person-cards.tsx
src/components/pastoral-list-cards.tsx
src/components/progressive-list.tsx
src/components/ui
src/features/people/member-filters.ts
src/lib/filter-param.ts
src/lib/search-params.ts
src/lib/text.ts
src/lib/format.ts
```

Regras:

- `StructureSearch` centraliza busca e chips de filtro das superfícies estruturais; `structure-search-config.ts` guarda base path, placeholder e labels por superfície.
- `MemberPriorityList` centraliza a lista pastoral de membros, separando pessoas no radar e ativos sem reimplementar `ProgressiveList + PersonMiniCard` em páginas.
- `member-filters.ts`, `cells-page-filters.ts` e `team-filters.ts` devem usar `src/lib/filter-param.ts` para valores, labels comuns e parsing de query param.
- `firstParam()` deve ser usado para leitura simples de `searchParams` em páginas server-side.
- `normalizeSearchText()` e `matchesNormalizedQuery()` devem ser usados para busca local sem acento/case-insensitive.
- `countLabel()`, datas curtas e horários devem sair de `src/lib/format.ts`; código de app não deve importar `brasilia-time.ts` diretamente sem motivo específico.
- Cards, botões, fields, feedbacks e painéis de ação devem usar `src/components/ui` antes de criar novas classes locais ou variantes soltas.
- Cards pastorais devem calcular apresentação visual localmente ou por helpers compartilhados; páginas não devem duplicar iniciais, tons de presença ou composição básica de card.

## Cadastro mínimo de célula

Fontes:

```txt
src/app/(app)/celulas/actions.ts
src/app/(app)/celulas/nova/page.tsx
src/app/(app)/celulas/[groupId]/editar/page.tsx
src/components/group-form.tsx
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
| `/eventos/[eventId]` | detalhe/resumo/registro do encontro |
| `/api/search` | busca de pessoa |

## Tema e tamanho do texto

Fontes de tema:

```txt
src/features/theme/theme.ts
src/components/theme-init.tsx
src/components/theme-toggle.tsx
src/app/globals.css
```

Fontes de tamanho do texto:

```txt
src/features/text-size/text-size.ts
src/components/text-size-init.tsx
src/components/text-size-toggle.tsx
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
