# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP: organização do código, entidades, autenticação, permissões, rotas e helpers. Para comportamento de produto, use `PRODUCT.md`. Para textos de UI, use `GLOSSARY.md`.

## Âncoras técnicas

A arquitetura deve proteger:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

```txt
Sinal não é tarefa.
Pastor não é operador de sinais.
```

A pessoa é o centro. Presença é fonte de leitura pastoral. Atenção operacional comum não deve subir automaticamente para a fila inicial do pastor.

## Estrutura do projeto

```txt
src/app
  Rotas, páginas, login/logout e API handlers.

src/components
  Componentes reutilizáveis de UI. Devem ser majoritariamente burros.

src/features
  Regras de domínio por feature.

src/lib
  Infraestrutura: Prisma, autenticação, sessão, formatação e utilitários.

prisma
  Schema, client gerado e seed.

docs
  Produto, vocabulário, arquitetura e briefing para agentes.
```

## Entidades principais

| Entidade | Papel |
| --- | --- |
| `Church` | escopo institucional |
| `User` | usuário autenticado, papel e vínculo opcional com `Person` |
| `Person` | centro do cuidado |
| `SmallGroup` | célula/grupo |
| `GroupMembership` | vínculo da pessoa com célula |
| `Event` | encontro da célula |
| `Attendance` | presença no evento |
| `CareSignal` | sinal que sustenta atenção |
| `CareTouch` | contato/cuidado registrado |

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

`app-nav.ts` centraliza:

- item `Visão` por papel;
- aba secundária (`Membros`, `Células` ou `Equipe`);
- item `Encontros`;
- estado ativo;
- indicador visual de atenção/cuidado/risco.

Não montar `nav={[...]}` manualmente nas páginas sem necessidade clara.

## Regras de arquitetura

1. API handler não deve concentrar regra pastoral complexa.
2. Página não deve recalcular atenção se houver helper de domínio.
3. Permissão e escopo devem ficar centralizados.
4. Backend valida permissão mesmo quando a UI esconde botões.
5. Query deve retornar dados dentro do escopo visível.
6. Lista padrão não é igual a escopo técnico.
7. Componentes compartilhados devem ser reaproveitados antes de criar variações locais.
8. Funcionalidade que cria burocracia antes de cuidado não entra no MVP.
9. Autenticação define identidade; autorização continua em `permissions.ts`.
10. Tema é preferência local e não deve afetar regra de domínio.

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
- Supervisor: grupos ativos supervisionados.
- Líder: grupos ativos liderados.
- Check-in: somente líder da célula do evento e nunca para evento futuro.
- Contato/cuidado: somente quem tem escopo pastoral sobre a pessoa.
- Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico padrão.
- Sinais sem grupo podem continuar visíveis quando estiverem dentro do escopo institucional.
- Sinais ligados a grupo inativo não devem ser resolvidos automaticamente como parte do fluxo padrão de cuidado.

## Sinais e atenção

Fontes principais:

```txt
src/features/signals/attention.ts
src/features/signals/display.ts
src/features/signals/escalation.ts
src/features/signals/sections.ts
src/features/signals/rules.ts
```

Helpers importantes:

```ts
getPrimarySignalsByPerson()
getPastoralSignalsByPerson()
isPastoralSignal()
signalBadgeForViewer()
signalDetailForViewer()
escalationStatusLabelForViewer()
escalationStatusDetailForViewer()
splitPastoralSections()
splitPastoralSignals()
getPastoralSectionSignalsByPerson()
sortSignalsForPastoralViewer()
isUrgentOrPastoralCase()
isSupportRequest()
isInCarePerson()
filterInCarePeople()
```

Regras:

- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Evento futuro, pendente ou sem marcação explícita não vira falta presumida.
- Listas de atenção agregam por pessoa.
- Para seções pastorais, a seleção por pessoa prioriza seção pastoral antes de recência.
- Dentro da mesma seção, ordenar por severidade e recência.
- Backend de check-in deve retornar contagem de pessoas distintas em atenção.

Prioridade pastoral:

```txt
Urgente/Caso pastoral -> Pedido de apoio -> Atenção local -> severidade/recência
```

## Status efetivo de pessoa

Fonte:

```txt
src/features/people/status-display.ts
```

Use `personEffectiveBadgeForViewer(person, primarySignal, viewer)` quando uma tela precisa exibir o status principal de uma pessoa.

Regra:

- se houver sinal primário visível, o badge vem do sinal;
- se não houver sinal primário visível, o badge vem de `Person.status`;
- busca, listas e perfil devem usar a mesma regra para evitar divergência visual.

## Relevância pastoral

Para a visão padrão do pastor, um sinal é pastoral quando:

```txt
severity = URGENT
ou
assignedTo.role = PASTOR/ADMIN
```

Um sinal atribuído ao supervisor não vira caso pastoral por atribuição. Se também for `URGENT`, o pastor vê por gravidade, mas não recebe a mensagem de apoio ao supervisor.

## Escalonamento técnico

O escalonamento mínimo usa `CareSignal.assignedToId`.

- supervisor: pedido de apoio;
- pastor/admin: encaminhamento pastoral;
- urgente: visibilidade pastoral por gravidade.

Regras:

- líder pode pedir apoio ao supervisor da célula;
- supervisor pode encaminhar ao pastor/admin;
- mensagens de escalonamento aparecem conforme perfil do viewer;
- mensagens não devem depender do nome do destinatário;
- escalonamento não cria task, SLA ou histórico complexo.

## Presença

Fonte:

```txt
src/features/events/presence-summary.ts
```

Helpers:

```ts
isPresenceRecordedEvent()
summarizePresenceFromAttendances()
summarizeEventPresence()
summarizeEventsPresence()
summarizePresenceTrend()
```

Regras:

- `AttendanceStatus.VISITOR` não entra no denominador;
- `hasPresenceData` indica se existe dado pastoral válido;
- UI deve mostrar `—` ou `Sem registro` quando `hasPresenceData` for falso;
- percentual não deve ser usado como indicador de risco sem dado real;
- eventos concluídos sem marcação válida continuam sendo leitura de ausência de dado, não `0%`;
- tendência exige amostra mínima nos dois períodos e variação mínima.

## Check-in

Fontes:

```txt
src/features/events/relevant-event.ts
src/features/check-in/check-in-validation.ts
src/features/check-in/visitor-validation.ts
src/app/api/events/[eventId]/check-in/route.ts
src/components/check-in-list.tsx
src/app/(app)/eventos/[eventId]/page.tsx
```

A rota de escrita deve validar:

- evento pertence à igreja do usuário;
- usuário é líder da célula do evento;
- evento não é futuro;
- cada membro ativo não visitante aparece exatamente uma vez no payload;
- ninguém de fora da célula entra como membro;
- status de membro aceita `PRESENT`, `ABSENT` ou `JUSTIFIED`;
- visitantes entram apenas pelo bloco de visitantes;
- visitante duplicado no mesmo evento é bloqueado por nome normalizado;
- evento concluído pode ser editado pelo líder apenas como correção.

Comportamento de UI:

- líder com presença pendente abre o formulário de registro;
- líder com presença registrada abre primeiro o resumo;
- `?modo=ajuste` abre o formulário de ajuste;
- pastor, supervisor e admin veem resumo, sem formulário;
- modo registro/ajuste usa `AppShell` com `compactHeader` e `hideBottomNav`;
- `CheckInList` mantém barra de salvar focada, botão cancelar/voltar e cores suaves por status;
- `Marcar todos como presentes` confirma antes de sobrescrever ausentes ou justificativas.

Pastor, supervisor e admin não salvam check-in nesta fase.

## Recalcular sinais e status da pessoa

Ao recalcular presença:

- criar/atualizar sinal ativo deve colocar `Person.status` em `NEEDS_ATTENTION`, preservando severidade no sinal;
- se não houver nenhum sinal ativo restante após recalcular presença, voltar para `ACTIVE` apenas quando estava em `NEEDS_ATTENTION`;
- preservar `COOLING_AWAY` como `Em cuidado`;
- motivo já resolvido não deve reabrir sem nova evidência posterior ao cuidado.

## Contato e cuidado

Fonte principal:

```txt
src/app/api/care/[personId]/route.ts
src/features/care/care-validation.ts
```

Regras da rota:

- validar payload;
- validar pessoa e igreja;
- validar `canRegisterCare(user, person)`;
- associar o cuidado ao primeiro grupo ativo visível quando houver;
- bloquear líder/supervisor sem grupo visível;
- resolver sinais somente quando `resolveOpenSignals` vier ativo;
- para pastor/admin, resolver apenas sinais abertos sem grupo ou em grupo ativo;
- para líder/supervisor, resolver sinais abertos dos grupos ativos visíveis da pessoa;
- atualizar pessoa para `COOLING_AWAY` apenas quando não restar sinal aberto relevante.

`Já houve contato?` só chama a rota depois de confirmação explícita.

## Queries de visão

Fonte:

```txt
src/features/dashboard/queries.ts
```

Funções principais:

```ts
getPastorDashboard(user)
getPastorTeamOverview(user)
getSupervisorDashboard(user)
getLeaderDashboard(user)
```

Regras:

- Visão do pastor: saúde geral + casos pastorais.
- Equipe do pastor: supervisores, células acompanhadas e células sem supervisor.
- Visão do supervisor: grupos supervisionados + pedidos de apoio + exceções.
- Células do supervisor: priorização por cuidado próximo, presença em atenção e estabilidade.
- Visão do líder: célula liderada + check-in/evento relevante + atenção local.
- Evitar duplicar pessoa em seções da mesma tela quando uma seção mais específica já mostra o caso.
- `supportRequests` deve representar pessoas/casos relevantes, não uma fila bruta de sinais.

## Rotas principais

### `/login`

Tela pública de entrada. Usa `loginAction`, `getAuthenticatedUser()` e `homeForRole()`. Também permite alternar tema.

### `/logout`

Rota para encerrar sessão. O shell usa formulário `POST`. A rota limpa o cookie de sessão e volta para `/login`.

### `/`

Redireciona o usuário autenticado para a visão do papel.

### `/pastor`, `/supervisor`, `/lider`

Telas principais por papel. Todas dependem de `getCurrentUser()` e das permissões centralizadas.

### `/equipe`

Disponível para pastor/admin. Usa `getPastorTeamOverview(user)`, busca/filtros por supervisor ou célula e lista primeiro exceções pastorais; células estáveis ficam recolhidas.

### `/celulas`

Disponível para supervisor. Usa `getSupervisorDashboard(user)`, busca/filtros por célula ou liderança e separa células em `Pedem cuidado próximo`, `Presença em atenção` e `Acompanhamento estável`.

### `/celulas/[groupId]`

Valida `canViewGroup(user, group)`, mostra membros ativos não visitantes, presença recente, encontro relevante e sinais por pessoa. Pastor vê atenções locais dentro do contexto da célula, não na fila inicial.

### `/pessoas`

Superfície de membros do líder, com busca e filtros `Todos`, `Atenção`, `Em cuidado` e `Ativos`. Supervisor redireciona para `/celulas`; pastor/admin redirecionam para `/equipe`.

### `/pessoas/[personId]`

Valida `canViewPerson(user, person)`, usa status efetivo, respeita escopo para sinais/presenças/cuidados/vínculos e mantém leitura curta para ação. Sinais são ordenados por prioridade pastoral.

### `/eventos`

Rota técnica da aba `Encontros`. Lista eventos dentro do escopo visível. Futuros aparecem como `Agendado`; eventos já iniciados sem presença válida aparecem como pendência para líder autorizado ou acompanhamento para outros perfis.

### `/eventos/[eventId]`

Valida `canViewEvent(user, event)`. Para presença registrada, exibe resumo primeiro inclusive para líder; o ajuste do líder acontece apenas com `?modo=ajuste`. Para presença pendente de líder autorizado, exibe formulário de registro. Outros perfis veem resumo.

### `/api/search`

Respeita `getVisiblePersonWhere(user)`, retorna pessoas e contexto visível, usa status efetivo e não promete busca de evento/célula. A busca de nome deve ser case-insensitive e ter fallback normalizado sem acentos.

## Tema

Fontes:

```txt
src/features/theme/theme.ts
src/components/theme-init.tsx
src/components/theme-toggle.tsx
src/app/globals.css
```

Regras:

- tema é armazenado no `localStorage` como `koinonia-theme`;
- valores válidos: `light`, `parchment`, `dark`;
- `ThemeInit` aplica o tema antes da renderização principal;
- `ThemeToggle` tem variante para header autenticado e card de login;
- tokens visuais do login usam variáveis `--login-*`;
- tema não deve ser persistido no banco nesta fase.

## Componentes compartilhados

Fontes principais:

```txt
src/components/cards.tsx
src/components/pastoral-list-cards.tsx
src/components/progressive-list.tsx
src/components/app-shell.tsx
src/components/bottom-nav.tsx
```

Regras:

- `AppShell` recebe a navegação já montada por `appNavForRole()`;
- `PastoralSignalSection` e `InCareSection` são o padrão para listas pastorais de pessoas;
- `ProgressiveList` é o padrão para listas que começam curtas e expandem por partes;
- `ContextSummary` é o padrão para cards numéricos pastorais com label, detalhe e valor;
- não criar variações locais desses padrões sem necessidade clara.

## Seed de desenvolvimento

A seed cria igreja, usuários com senha, células ativas/inativas, histórico de presença, eventos pendentes/futuros, ausência de dado, visitantes, faltas consecutivas, justificativas, casos locais, pedidos de apoio, urgentes, resolvidos e encaminhados.

Usuários principais de desenvolvimento:

- `pastor@koinonia.local`
- `ana@koinonia.local`
- `bruno@koinonia.local`

Senha padrão local:

```txt
koinonia123
```

Esses acessos são para desenvolvimento. A tela de login não deve exibir o bloco de credenciais.
