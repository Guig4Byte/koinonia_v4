# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP: organização do código, entidades, permissões, rotas e limites de implementação. Para produto, use `PRODUCT.md`. Para linguagem de UI, use `GLOSSARY.md`.

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
  Rotas, páginas e API handlers.

src/components
  Componentes reutilizáveis de UI. Devem ser majoritariamente burros.

src/features
  Regras de domínio por feature.

src/lib
  Infraestrutura: Prisma, sessão demo, formatação e utilitários.

prisma
  Schema, client gerado e seed.

docs
  Produto, vocabulário, arquitetura e briefing para agentes.
```

## Entidades principais

| Entidade | Papel |
| --- | --- |
| `Church` | escopo institucional |
| `User` | pessoa usuária do sistema e seu papel |
| `Person` | centro do cuidado |
| `SmallGroup` | célula/grupo |
| `GroupMembership` | vínculo da pessoa com célula |
| `Event` | encontro da célula |
| `Attendance` | presença no evento |
| `CareSignal` | sinal que sustenta atenção |
| `CareTouch` | contato/cuidado registrado |

Leitura de domínio:

```txt
Event -> Attendance -> CareSignal -> CareTouch
```

## Regras de arquitetura

1. API handler não deve concentrar regra pastoral complexa.
2. Página não deve recalcular atenção se houver helper de domínio.
3. Permissão e escopo devem ficar centralizados.
4. Backend valida permissão mesmo quando a UI esconde botões.
5. Query deve retornar dados dentro do escopo visível.
6. Lista padrão não é igual a escopo técnico.
7. Componentes compartilhados devem ser reaproveitados antes de criar variações locais.
8. Funcionalidade que cria burocracia antes de cuidado não entra no MVP.

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
- Check-in: somente líder da célula do evento.
- Contato/cuidado: somente quem tem escopo pastoral sobre a pessoa.

Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico.

## Escopo técnico x superfície padrão

Não confunda:

- **escopo técnico**: o que o usuário pode acessar quando consulta explicitamente;
- **superfície padrão**: o que a tela mostra sem busca/contexto.

Exemplo crítico:

- Pastor pode buscar qualquer pessoa da igreja/campus.
- Pastor não deve receber todos os sinais abertos como fila inicial.
- Pastor pode abrir uma célula e ver atenções locais em seção separada.

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
```

Regras:

- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Evento futuro, pendente ou sem marcação explícita não vira falta presumida.
- Listas de atenção agregam por pessoa, não por sinal bruto.
- Sinal primário deve priorizar severidade e depois recência.
- Backend de check-in deve retornar contagem de pessoas distintas em atenção.

## Relevância pastoral atual

No MVP atual, um sinal é pastoral para a visão padrão do pastor quando:

```txt
severity = URGENT
ou
assignedTo.role = PASTOR/ADMIN
```

Um sinal atribuído ao supervisor não vira caso pastoral por atribuição. Se também for `URGENT`, o pastor vê por gravidade, mas não recebe a mensagem de apoio ao supervisor.

## Escalonamento técnico

O escalonamento mínimo usa:

```txt
CareSignal.assignedToId
```

Interpretação:

- supervisor: pedido de apoio;
- pastor/admin: encaminhamento pastoral;
- urgente: visibilidade pastoral por gravidade, independentemente de atribuição.

Rotas/ações relacionadas devem preservar estas regras:

- líder pode pedir apoio ao supervisor da célula;
- supervisor pode encaminhar ao pastor/admin;
- mensagens de escalonamento aparecem somente para perfis que devem recebê-las;
- escalonamento não cria task, SLA ou histórico complexo.

## Status visual de sinal

Fonte:

```txt
src/features/signals/display.ts
```

Use `signalBadgeForViewer(signal, viewer)` para sinais e `personStatusDisplay(status)` para status de pessoa, evitando rótulos incoerentes entre telas.

Regras de consistência:

- `URGENT` aparece como `Urgente`, salvo quando o contexto pastoral específico justificar `Caso pastoral` por encaminhamento.
- pedido ao supervisor aparece como `Apoio solicitado` para líder e `Pedido de apoio` para supervisor;
- pastor vendo caso comum atribuído ao supervisor deve ver `Atenção local`, não mensagem de apoio;
- sinal encaminhado a pastor/admin aparece como `Caso pastoral` para pastor e `Encaminhado` para outros perfis.

## Check-in

Somente o líder da célula do evento salva check-in.

A rota de escrita deve validar:

- evento pertence à igreja do usuário;
- usuário é líder da célula do evento;
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
- se não houver nenhum sinal ativo restante após recalcular presença, voltar para `ACTIVE` apenas quando estava em `NEEDS_ATTENTION`; preservar `COOLING_AWAY` como `Em cuidado`;
- motivo já resolvido não deve reabrir sem nova evidência posterior ao cuidado.

## Contato e cuidado

Rota:

```txt
/api/care/[personId]
```

Deve:

- validar payload com `src/features/care/care-validation.ts`;
- aparar anotação vazia;
- validar escopo com helpers de permissão;
- associar o cuidado a uma célula visível quando aplicável;
- resolver somente sinais ativos dentro do escopo do usuário;
- mudar `Person.status` para `COOLING_AWAY` (`Em cuidado`) se o cuidado resolver todos os sinais ativos;
- retornar `resolvedSignalsCount`, `personStatusChangedToCare` e mensagem curta.

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

Métricas de presença:

- considerar apenas eventos concluídos ou com marcações;
- ignorar visitantes no denominador;
- expor quantidade de eventos registrados para a UI distinguir percentual real de ausência de dado;
- não mostrar `0%` como risco quando não há dado.

## Rotas principais

### `/celulas/[groupId]`

Deve:

- carregar célula por id;
- validar `canViewGroup(user, group)`;
- mostrar membros ativos não visitantes;
- agregar sinais por pessoa;
- calcular presença com encontros registrados;
- separar, para pastor, casos pastorais e atenções locais;
- apontar pessoas para `/pessoas/[personId]`.

Não deve virar área administrativa de célula.

### `/pessoas`

Deve:

- respeitar escopo do usuário;
- para líder, permitir visão de membros da própria célula;
- para supervisor, mostrar casos no escopo, priorizando pedidos e exceções;
- para pastor, mostrar casos pastorais, não diretório completo;
- depender de busca para consulta explícita fora da lista padrão.

### `/pessoas/[personId]`

Deve:

- validar `canViewPerson(user, person)`;
- respeitar escopo também para sinais, presenças, cuidados e vínculos exibidos;
- usar `getVisibleCareTouchWhere(user, personId)` para cuidado recente;
- manter leitura curta para ação, não timeline infinita.

### `/api/search`

Deve:

- respeitar `getVisiblePersonWhere(user)`;
- retornar pessoas e contexto visível;
- levar para `/pessoas/[personId]`;
- não prometer busca de evento/célula enquanto não existir suporte.

## Autenticação atual e futura

Atual: cookie demo/seletor de perfil.

Futuro:

```ts
getCurrentUser(): Promise<User>
```

A origem deve migrar para sessão real com cookie HttpOnly. Mesmo antes disso, backend já deve respeitar escopo.

Não implementar OAuth, recuperação de senha ou convites antes do fluxo principal estar validado.

## Design system

A interface usa tokens CSS e temas.

Prioridades:

1. contraste;
2. legibilidade;
3. hierarquia visual;
4. consistência semântica de status;
5. beleza.

Regra:

```txt
O token orienta. A tela real decide.
```

Tons semânticos:

- `ok`: ativo/presença positiva;
- `warn`: atenção/pendência;
- `risk`: urgente/caso pastoral;
- `care`: apoio solicitado/cuidado realizado;
- `info`: informativo.

## Seed demo

A seed deve validar escopo e fluxo.

Cenário esperado:

- Roberto: pastor.
- Ana, Marcos, Helena: supervisores.
- 7 células ativas.
- 12 membros ativos por célula.
- 1 visitante demo por célula.
- eventos concluídos, pendentes e abertos.
- casos locais, pedidos de apoio, urgentes e encaminhados ao pastor.

Ela deve permitir testar:

- pastor vendo saúde geral;
- pastor vendo urgentes e encaminhados;
- pastor não recebendo atenção comum como fila;
- supervisor vendo pedidos de apoio;
- líder operando uma célula realista.
