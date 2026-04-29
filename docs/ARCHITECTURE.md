# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP atual: organização do código, entidades, permissões, rotas, validações e limites de implementação.

Para produto, escopo e fluxos, consulte `docs/PRODUCT.md`. Para vocabulário, consulte `docs/GLOSSARY.md`. Para entrada rápida de agentes, consulte `docs/AGENT_BRIEFING.md`.

## Contexto mínimo de produto

A arquitetura deve proteger estas âncoras:

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
```

```txt
Pastor não é operador de sinais.
```

A presença não é o fim. Ela é uma fonte de leitura pastoral. A pessoa é o centro da experiência. A arquitetura deve impedir que toda atenção operacional suba automaticamente para o pastor.

## Estrutura do projeto

```txt
src/app
  Rotas, páginas e API handlers.

src/components
  Componentes reutilizáveis de UI. Devem permanecer o mais burros possível.

src/features
  Regras de domínio por capacidade do produto.

src/lib
  Infraestrutura: Prisma, usuário atual, formatação e utilitários.

prisma
  Schema, client gerado e seed.

docs
  Decisões de produto, vocabulário, arquitetura e briefing para agentes.
```

## Entidades principais

- `Church`
- `User`
- `Person`
- `SmallGroup`
- `GroupMembership`
- `Event`
- `Attendance`
- `CareSignal`
- `CareTouch`

Leitura de domínio:

- `Person` é o centro operacional.
- `Event` gera `Attendance`.
- `Attendance` pode gerar `CareSignal`.
- `CareSignal` aparece na UI como atenção.
- `CareTouch` registra contato/cuidado simples.

## Regras de arquitetura

1. API handler não deve acumular regra pastoral complexa.
2. Página não deve recalcular regra de atenção manualmente.
3. Regra de escopo deve ficar centralizada.
4. Componentes compartilhados devem ser reaproveitados antes de criar variações locais.
5. Backend deve validar permissão mesmo quando a UI esconde ações.
6. Query deve retornar apenas dados dentro do escopo visível do usuário.
7. O detalhe da pessoa não deve vazar histórico de células fora do escopo.
8. O detalhe da célula deve chamar `canViewGroup(user, group)` antes de renderizar qualquer dado.
9. Funcionalidade que cria burocracia antes de cuidado não deve entrar no MVP.

## Autorização centralizada

As regras de escopo ficam em:

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
getVisibleGroupWhere(user)
getVisibleEventWhere(user)
getVisiblePersonWhere(user)
getVisibleMembershipWhere(user)
getVisibleOpenSignalWhere(user)
getVisibleCareTouchWhere(user, personId?)
```

Rotas, páginas e queries devem reutilizar esses helpers em vez de repetir regra de papel/escopo manualmente.

Regra operacional:

- Pastor/Admin: igreja inteira para busca e leitura autorizada, mas listas padrão devem filtrar relevância pastoral.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.
- Check-in: somente o líder da célula do evento.
- Contato/cuidado: apenas quem tem escopo pastoral sobre a pessoa.

Quando validar objetos carregados diretamente, mantenha a mesma semântica dos filtros de query. Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico.

Atenção: escopo técnico não é igual a lista padrão. Pastor pode ter escopo de igreja inteira para busca e leitura, mas a visão inicial não deve consumir uma lista bruta de todos os sinais abertos. Para o pastor, queries de atenção devem aplicar relevância pastoral: gravidade, recorrência, sensibilidade ou escalonamento.

## Check-in

Somente o líder da célula do evento pode salvar check-in.

A rota de escrita do check-in deve validar:

- evento pertence à igreja do usuário;
- usuário é o líder da célula vinculada ao evento;
- cada membro ativo não visitante da célula aparece exatamente uma vez no payload;
- ninguém de fora da célula entra como presença de membro;
- presença de membro aceita apenas `PRESENT`, `ABSENT` ou `JUSTIFIED`;
- `VISITOR` entra somente pelo bloco de visitantes;
- evento concluído continua editável apenas para correção pelo líder da célula;
- visitante novo não duplica visitante já registrado no mesmo evento;
- duplicidade de visitante é comparada por nome normalizado, ignorando acento, caixa e espaços extras.

Pastor, supervisor e admin não salvam check-in nesta fase.

## Sinais e atenção por pessoa

Regras de sinal ficam em `src/features/signals`.

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Listas chamadas de `Pessoas em atenção` devem agregar sinais ativos por pessoa. Na UI, trate esses sinais como motivos de atenção. Use `src/features/signals/attention.ts` para escolher o sinal primário: primeiro o mais grave, depois o mais recente.

A visibilidade deve separar escopo de relevância:

- líder: atenção local dos grupos liderados;
- supervisor: atenção dos grupos supervisionados, com prioridade para exceções, acúmulos, pedidos de apoio e recorrência;
- pastor: saúde geral e apenas casos graves, sensíveis, recorrentes ou escalados.

Não use `getVisibleOpenSignalWhere(user)` como única regra para alimentar a visão padrão do pastor, porque ela expressa escopo permitido, não necessariamente relevância pastoral. No MVP atual, a filtragem pastoral considera sinais `URGENT` e sinais abertos atribuídos a pastor/admin por `CareSignal.assignedToId`.

O backend do check-in deve retornar contagem de pessoas distintas em atenção, não quantidade bruta de sinais.

Ao recalcular sinais de presença, o backend também deve manter o status pastoral da pessoa coerente:

- se um sinal de presença ativo for criado ou atualizado, a pessoa deve ficar `NEEDS_ATTENTION`, preservando a severidade no próprio sinal;
- se a presença deixar de sustentar o sinal e não houver nenhum outro sinal ativo para a pessoa, o status deve voltar para `ACTIVE` quando estava em `NEEDS_ATTENTION` ou `COOLING_AWAY`;
- se um sinal de presença já resolvido continuar baseado na mesma evidência anterior ao cuidado, ele não deve ser reaberto nem manter a pessoa em atenção.

## Contato e cuidado

A rota `/api/care/[personId]` deve:

- validar entrada com `src/features/care/care-validation.ts`;
- aparar anotação vazia;
- confirmar escopo pastoral com helpers de permissão;
- associar o registro a uma célula visível quando o usuário não tiver escopo de igreja inteira;
- quando o usuário tiver escopo de igreja inteira, associar o cuidado à célula principal da pessoa quando isso for necessário para evitar invisibilidade operacional;
- preservar a possibilidade futura de uma anotação pastoral sensível não ficar completamente exposta ao líder local;
- recusar escrita se nenhuma célula visível existir;
- resolver apenas sinais ativos dentro do escopo do usuário;
- quando não restar nenhum sinal ativo para a pessoa, voltar `Person.status` para `ACTIVE` se ela estava em `NEEDS_ATTENTION` ou `COOLING_AWAY`;
- devolver `resolvedSignalsCount`, `personStatusReset` e mensagem curta para a UI.

`Já houve contato?` abre um fluxo de confirmação para cuidado já realizado fora do aplicativo. A rota só deve ser chamada depois de confirmação explícita do usuário. Isso não deve criar acompanhamento formal, task ou SLA.

As listas de atenção devem usar `PersonSignalCard` com uma ação primária simples para abrir o detalhe da pessoa. `CareActions` fica no detalhe da pessoa, evitando que listas do líder, supervisor ou pastor virem blocos de botões repetidos.


## Métricas de presença em dashboards

As consultas de dashboard devem evitar tratar falta de dado como baixa presença.

Regras técnicas:

- agregue presença somente a partir de eventos concluídos ou com marcações de presença;
- ignore visitantes no denominador da taxa;
- exponha quantidade de eventos registrados no recorte para a UI decidir entre percentual real e estado sem dado;
- na visão do pastor, o recorte da métrica principal é a semana atual;
- em cards de célula, não destaque `0%` como risco quando a célula não tem encontro registrado no recorte carregado; use estado `sem registro`.

## Rotas de célula

A rota `/celulas/[groupId]` é o detalhe simples da célula.

Ela deve:

- carregar a célula por id;
- validar visibilidade com `canViewGroup(user, group)`;
- mostrar somente membros ativos não visitantes;
- agregar sinais abertos por pessoa com `getPrimarySignalsByPerson`;
- calcular presença apenas a partir de encontros com presença registrada;
- apontar encontros para `/eventos/[eventId]`;
- apontar membros e pessoas em atenção para `/pessoas/[personId]`.

A rota não deve implementar edição de célula, cadastro rico, relatórios longos ou gestão administrativa. É uma leitura operacional curta para entender a célula e agir sobre pessoas.

## Rotas de pessoa, membros e busca

A lista `/pessoas` deve respeitar o escopo do usuário e não deve funcionar como diretório amplo para todos os perfis.

Regras técnicas:

- líder carrega pessoas em atenção da própria célula e pode carregar membros ativos não visitantes usando `getVisiblePersonWhere(user)` combinado com `getVisibleMembershipWhere(user)`;
- supervisor carrega pessoas em atenção dentro dos grupos supervisionados, priorizando exceções, acúmulos, pedidos de apoio e recorrência;
- pastor não deve carregar uma lista bruta de todas as pessoas em atenção da igreja por padrão; carregue apenas casos graves, sensíveis, recorrentes ou escalados;
- pastor e supervisor não devem receber uma lista completa de pessoas por padrão nessa rota; quando precisarem consultar alguém fora da lista de atenção, devem usar a busca;
- pastor pode buscar qualquer pessoa da igreja/campus dentro do seu escopo amplo, mas busca é ação explícita, não diretório inicial;
- a label da navegação pode ser `Membros` para líder e `Pessoas` para os demais perfis.

A rota `/pessoas/[personId]` é o detalhe simples de cuidado e deve chamar `canViewPerson(user, person)` antes de renderizar qualquer dado.

Mesmo depois de validar a pessoa, os dados internos da tela também precisam respeitar escopo:

- sinais;
- presenças;
- cuidados recentes;
- vínculos/células exibidos como contexto.

Para cuidado recente, use `getVisibleCareTouchWhere(user, personId)` em vez de montar filtros manuais.

A busca em `/api/search` deve:

- respeitar `getVisiblePersonWhere(user)`;
- mostrar contexto via vínculos visíveis ao usuário;
- levar direto para `/pessoas/[personId]`;
- não prometer busca de evento ou célula enquanto a API não suportar esses tipos.

## Autenticação atual e futura

A base ainda usa usuário demo via cookie para acelerar validação de produto.

Mesmo em modo demo, backend deve respeitar escopo.

Quando autenticação real entrar, preserve o contrato:

```ts
getCurrentUser(): Promise<User>
```

A origem do usuário deve mudar de cookie demo para sessão real com cookie HttpOnly.

Não implementar OAuth, recuperação de senha ou convite por email antes do fluxo principal estar validado.

## Design system

A interface usa temas e tokens CSS.

Há três temas:

- Claro
- Pergaminho
- Escuro

Regra adotada:

> O design token orienta. A tela real decide.

Contraste, legibilidade e hierarquia visual têm prioridade sobre seguir token literalmente.

## Seed demo

A seed deve validar escopo e fluxo, não apenas preencher telas.

Cenário atual esperado:

- Roberto (`PASTOR`) vê a igreja inteira.
- Existem 3 supervisores: Ana, Marcos e Helena.
- Cada supervisor tem 2 ou 3 células ativas:
  - Ana: `Célula Esperança`, `Célula Ágape`, `Célula Betel`;
  - Marcos: `Célula Videira`, `Célula Semente`;
  - Helena: `Célula Caminho`, `Célula Graça`.
- Cada célula tem 1 líder e 12 membros ativos, além de um visitante demo.
- A aba demo de supervisor seleciona Ana, para validar 3 células sob uma supervisão.
- A aba demo de líder seleciona Bruno, para validar uma célula com 12 membros e check-in aberto.
- A visão do pastor deve conseguir testar:
  - saúde geral das células;
  - células com presença baixa;
  - casos urgentes;
  - casos encaminhados explicitamente ao pastor;
  - casos que ficam apenas com supervisor/líder e não viram ruído pastoral.
- `Célula Esperança` mantém evento de hoje aberto para check-in.
- Outras células mantêm eventos concluídos, pendentes ou agendados para testar presença, células pendentes e escopo.

## O que não existe de propósito

Não implemente sem pedido explícito:

- task complexa;
- SLA;
- playbook;
- CRM pesado;
- acompanhamento formal;
- dashboard analítico profundo;
- BI;
- mapa;
- QR Code;
- geolocalização;
- notificações;
- calendário amplo.

Esses conceitos podem aparecer depois, mas só se o uso real pedir e depois que o ciclo principal estiver validado.

## Tokens visuais de status

O componente `Badge` deve preservar tons semânticos oficiais: `warn` para `Em atenção`/pendências em âmbar, `risk` para `Urgente` em vermelho e `care` para `Cuidado realizado` em azul. `ok` continua reservado para presença positiva/estabilidade.

