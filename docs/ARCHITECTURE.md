# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP: organização do código, entidades, autenticação, permissões, rotas e limites de implementação. Para produto, use `PRODUCT.md`. Para linguagem de UI, use `GLOSSARY.md`.

## Âncoras que a arquitetura deve proteger

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

A pessoa é o centro. Presença é fonte de leitura pastoral. A arquitetura deve impedir que atenção operacional comum suba automaticamente para o pastor.

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

Regras atuais:

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

Não existe fallback demo nem troca manual de perfil. Não recrie esse fluxo.

## Redirecionamento por papel

Fonte:

```txt
src/lib/auth/redirects.ts
```

| Papel | Home |
| --- | --- |
| `ADMIN` | `/pastor` |
| `PASTOR` | `/pastor` |
| `SUPERVISOR` | `/supervisor` |
| `LEADER` | `/lider` |

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

Helpers esperados:

```ts
canViewGroup(user, group)
canViewPerson(user, person)
canViewEvent(user, event)
canCheckInEvent(user, event)
canRegisterCare(user, person)
getVisibleGroupWhere(user)
getVisibleEventWhere(user)
getVisiblePersonWhere(user)
getVisibleMembershipWhere(user)
getVisibleOpenSignalWhere(user)
getVisibleCareTouchWhere(user, personId?)
getPrimaryVisibleGroupIdForPerson(user, person)
```

Regras:

- Pastor/Admin: escopo amplo para busca/leitura autorizada, mas listas padrão filtram relevância pastoral.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.
- Check-in: somente líder da célula do evento e nunca para evento futuro.
- Contato/cuidado: somente quem tem escopo pastoral sobre a pessoa.
- Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico padrão.
- Sinais sem grupo podem continuar visíveis quando estiverem dentro do escopo institucional.

## Escopo técnico x superfície padrão

Não confunda:

- **escopo técnico**: o que o usuário pode acessar quando consulta explicitamente;
- **superfície padrão**: o que a tela mostra sem busca/contexto.

Para visão inicial do pastor, aplique relevância pastoral, não apenas `getVisibleOpenSignalWhere(user)`.

## Sinais e atenção

Fonte principal:

```txt
src/features/signals
```

Helpers importantes:

```ts
getPrimarySignalsByPerson()
getPastoralSignalsByPerson()
isPastoralSignal()
signalBadgeForViewer()
escalationStatusLabelForViewer()
escalationStatusDetailForViewer()
splitPastoralSections()
isUrgentOrPastoralCase()
isSupportRequest()
isInCarePerson()
```

Regras:

- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Evento futuro, pendente ou sem marcação explícita não vira falta presumida.
- Listas de atenção agregam por pessoa, não por sinal bruto.
- Sinal primário deve priorizar severidade e depois recência.
- Backend de check-in deve retornar contagem de pessoas distintas em atenção.

## Status efetivo de pessoa

Fonte principal:

```txt
src/features/people/status-display.ts
```

Use `personEffectiveBadgeForViewer(person, primarySignal, viewer)` quando uma tela precisa exibir o status principal de uma pessoa.

Regra:

- se houver sinal primário visível, o badge vem do sinal;
- se não houver sinal primário visível, o badge vem de `Person.status`;
- busca, listas e perfil devem usar a mesma regra para evitar divergência visual.

## Seções pastorais

Fonte principal:

```txt
src/features/signals/sections.ts
```

As seções pastorais são derivação de sinais/status, não entidade nova.

| Função | Uso |
| --- | --- |
| `splitPastoralSections()` | divide sinais e pessoas em cuidado por seção |
| `splitPastoralSignals()` | classifica sinais em urgentes, apoio e atenção local |
| `isUrgentOrPastoralCase()` | classifica urgentes e encaminhados ao cuidado pastoral |
| `isSupportRequest()` | classifica pedidos de apoio da supervisão conforme viewer |
| `filterInCarePeople()` | evita mostrar `Em cuidado` quando há sinal ativo mais prioritário |

Regras:

- uma pessoa deve aparecer na seção mais específica possível;
- urgência/caso pastoral vence pedido de apoio;
- pedido de apoio vence atenção comum;
- `Em cuidado` só aparece quando não houver sinal mais prioritário;
- a UI limita a quantidade inicial, mas a query deve continuar respeitando escopo.

## Relevância pastoral atual

No MVP atual, um sinal é pastoral para a visão padrão do pastor quando:

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

Rotas/ações relacionadas devem preservar estas regras:

- líder pode pedir apoio ao supervisor da célula;
- supervisor pode encaminhar ao pastor/admin;
- mensagens de escalonamento aparecem somente para perfis que devem recebê-las;
- mensagens não devem depender do nome do destinatário;
- escalonamento não cria task, SLA ou histórico complexo.

## Status visual de sinal

Fonte:

```txt
src/features/signals/display.ts
```

Use `signalBadgeForViewer(signal, viewer)` para sinais. Não crie rótulos locais em componentes.

Regras de consistência:

- `URGENT` aparece como `Urgente`.
- pedido ao supervisor aparece como `Apoio solicitado` para líder e `Pedido de apoio` para supervisor.
- pastor vendo caso comum atribuído ao supervisor deve ver `Atenção local`, não mensagem de apoio.
- sinal encaminhado a pastor/admin aparece como `Caso pastoral` para pastor e `Encaminhado` para outros perfis.

## Presença

Fonte principal:

```txt
src/features/events/presence-summary.ts
```

Helpers:

```ts
isPresenceRecordedEvent()
summarizePresenceFromAttendances()
summarizeEventPresence()
summarizeEventsPresence()
```

Regras:

- `AttendanceStatus.VISITOR` não entra no denominador;
- `hasPresenceData` indica se existe dado pastoral válido;
- UI deve mostrar `—` ou `Sem registro` quando `hasPresenceData` for falso;
- percentual não deve ser usado como indicador de risco sem dado real;
- eventos concluídos sem marcação válida continuam sendo leitura de ausência de dado, não `0%`.

## Check-in

Somente o líder da célula do evento salva check-in.

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

Pastor, supervisor e admin não salvam check-in nesta fase.

## Recalcular sinais e status da pessoa

Ao recalcular presença:

- criar/atualizar sinal ativo deve colocar `Person.status` em `NEEDS_ATTENTION`, preservando severidade no sinal;
- se não houver nenhum sinal ativo restante após recalcular presença, voltar para `ACTIVE` apenas quando estava em `NEEDS_ATTENTION`;
- preservar `COOLING_AWAY` como `Em cuidado`;
- motivo já resolvido não deve reabrir sem nova evidência posterior ao cuidado.

## Contato e cuidado

Rota:

```txt
/api/care/[personId]
```

Deve validar payload, validar escopo, associar cuidado a uma célula visível quando aplicável, resolver somente sinais ativos dentro do escopo do usuário e mudar `Person.status` para `COOLING_AWAY` se o cuidado resolver todos os sinais ativos.

`Já houve contato?` só chama a rota depois de confirmação explícita. Isso não cria acompanhamento formal.

## Queries de dashboard

Fonte:

```txt
src/features/dashboard/queries.ts
```

Regras:

- Visão do pastor: saúde geral + casos pastorais.
- Visão do supervisor: grupos supervisionados + pedidos de apoio + exceções.
- Visão do líder: célula liderada + check-in/evento relevante + atenção local.
- Evitar duplicar pessoa em seções da mesma tela quando uma seção mais específica já mostra o caso.
- `supportRequests` deve representar pessoas/casos relevantes, não uma fila bruta de sinais.

Métricas de presença:

- considerar apenas eventos concluídos ou com marcações;
- ignorar visitantes no denominador;
- expor quantidade de eventos registrados para a UI distinguir percentual real de ausência de dado;
- não mostrar `0%` como risco quando não há dado.

## Rotas principais

### `/login`

Tela pública de entrada. Usa `loginAction`, `getAuthenticatedUser()` e `homeForRole()`. Se houver sessão válida, redireciona para a visão do papel. Também permite alternar tema.

Comportamentos client-side ficam em `login-form-controls.tsx`:

- `LoginErrorMessage` exibe `erro=credenciais` e remove o parâmetro da URL com `history.replaceState`, preservando `next`, para que refresh não repita a mensagem;
- `PasswordField` alterna visualmente o campo entre oculto e visível, sem alterar nome do campo, `autoComplete` ou payload do formulário.

### `/logout`

Rota para encerrar sessão. O shell usa formulário `POST`. A rota limpa o cookie de sessão e volta para `/login`.

### `/`

Redireciona o usuário autenticado para a visão do papel.

### `/pastor`, `/supervisor`, `/lider`

Telas principais por papel. Todas dependem de `getCurrentUser()` e das permissões centralizadas.

### `/celulas/[groupId]`

Valida `canViewGroup(user, group)`, mostra membros ativos não visitantes, agrega sinais por pessoa, calcula presença com helpers e separa casos pastorais de atenções locais quando o viewer é pastor.

### `/pessoas`

Respeita escopo do usuário. Para líder mostra membros da própria célula; para supervisor prioriza pedidos/exceções; para pastor mostra casos pastorais, não diretório completo. Deve organizar em seções pastorais, limitar a lista inicial e depender de busca para consulta explícita.

### `/pessoas/[personId]`

Valida `canViewPerson(user, person)`, usa status efetivo, respeita escopo para sinais/presenças/cuidados/vínculos e mantém leitura curta para ação.

### `/eventos`

Lista eventos dentro do escopo visível. Líder vê ação de registro/ajuste quando pode fazer check-in; outros perfis veem resumo.

### `/eventos/[eventId]`

Valida `canViewEvent(user, event)`. Exibe check-in editável somente para o líder autorizado; outros perfis veem resumo.

### `/api/search`

Respeita `getVisiblePersonWhere(user)`, retorna pessoas e contexto visível, retorna status efetivo quando houver sinal primário visível e não promete busca de evento/célula.

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
- tokens visuais do login usam variáveis `--login-*`; contraste do tema `parchment` deve ser ajustado nesses tokens, não com cores soltas no JSX;
- tema não deve ser persistido no banco nesta fase.

## Design system

Prioridades:

1. contraste;
2. legibilidade;
3. hierarquia visual;
4. consistência semântica de status;
5. beleza.

Tons semânticos:

- `ok`: ativo/presença positiva;
- `warn`: atenção/pendência;
- `risk`: urgente/caso pastoral;
- `care`: cuidado realizado/em cuidado;
- `support`: apoio solicitado/pedido de apoio;
- `info`: informativo.

## Seed de desenvolvimento

A seed cria igreja, usuários com senha, células ativas/inativas, eventos concluídos/pendentes/futuros, ausência de dado, visitantes, casos locais, pedidos de apoio, urgentes, resolvidos e encaminhados.

Usuários principais de desenvolvimento:

- `pastor@koinonia.local`
- `ana@koinonia.local`
- `bruno@koinonia.local`

Senha padrão local:

```txt
koinonia123
```

Esses acessos são para desenvolvimento. A tela de login não deve exibir o bloco de credenciais.
