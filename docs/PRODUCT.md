# Produto — Koinonia Lite

Este documento define **o comportamento esperado do MVP atual**: visão, escopo, papéis, superfícies e fluxos. Para vocabulário, use `GLOSSARY.md`. Para implementação, use `ARCHITECTURE.md`.

## Visão

Koinonia Lite é um radar pastoral mobile-first para células.

Ele ajuda a liderança a perceber, lembrar e agir quando uma pessoa pode estar se afastando. O produto deve parecer apoio ao cuidado, não cobrança para documentar.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Princípio de decisão

Pergunta central:

```txt
Quem precisa de cuidado agora?
```

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajuda, não entra no MVP.

## Ciclo central

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Escopo atual

Inclui:

- autenticação simples por e-mail e senha;
- tema local no login e no app;
- pessoas, células e encontros de célula;
- check-in do líder, com visitantes;
- métricas de presença com distinção entre dado real e ausência de registro;
- sinais por pessoa;
- escalonamento mínimo por atribuição do sinal;
- busca de pessoa;
- visão por papel;
- equipe do pastor/admin;
- células supervisionadas;
- detalhe simples de pessoa, célula e encontro;
- contato/cuidado com anotação opcional.

Não inclui:

- cadastro público;
- recuperação de senha;
- gestão avançada de usuários;
- acompanhamento formal;
- CRM pesado;
- task manager, kanban, fila ou SLA;
- BI avançado;
- mapas, QR Code ou geolocalização;
- notificações;
- área rica do membro;
- formulários longos;
- calendário amplo de igreja.

## Papéis

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

Pode ver a própria célula, registrar check-in dos encontros da própria célula, adicionar visitantes, ver membros ativos, ver pessoas em atenção, pedir apoio da supervisão e registrar contato/cuidado.

Não deve registrar check-in de outra célula, registrar check-in futuro, operar visão macro ou substituir supervisor/pastor.

### Supervisor

Pode ver células sob sua supervisão, presença, encontros, atenções, pedidos de apoio, exceções, acúmulos e recorrências. Pode encaminhar ao pastor quando houver gravidade ou necessidade pastoral.

Não deve registrar check-in pelo líder, ver dados fora do escopo ou virar operador de presença.

### Pastor/Admin

Pode ver saúde geral, equipe, presença por célula, células sem presença recente ou com presença baixa registrada, casos graves/urgentes/encaminhados, buscar pessoas dentro da igreja e abrir células para contexto local.

Não deve registrar check-in, receber toda atenção comum como fila inicial, virar central de tickets ou transformar a visão macro em relatório burocrático.

## Visibilidade: escopo não é lista padrão

Há diferença entre **poder acessar** e **receber por padrão**.

- Pastor/admin têm escopo amplo para busca e leitura autorizada, mas a visão inicial prioriza saúde geral e casos pastorais.
- Atenção local aparece para pastor/admin quando há contexto explícito, como célula ou pessoa aberta.
- Supervisor vê o escopo supervisionado.
- Líder vê a própria célula.
- Grupos inativos não entram na superfície padrão, encontros, check-in ou histórico visível.

```txt
Visão inicial do pastor = saúde geral + casos pastorais.
Detalhe de célula = casos pastorais + atenções locais contextualizadas.
Busca = acesso explícito a pessoa dentro do escopo.
```

## Navegação e superfícies

| Papel | Visão | Superfície estrutural | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

A UI usa `Encontros`. Rotas, entidades e código continuam usando `eventos`/`Event`.

### `/lider`

Visão rápida do líder. Prioriza pessoas no radar da própria célula e o encontro relevante. Não é lista ampla de membros nem tela de check-in completa.

### `/supervisor`

Prioriza pedidos de apoio recebidos, células acompanhadas, presença recente e casos relevantes sob supervisão. Evita duplicar a mesma pessoa em várias seções.

### `/pastor`

Prioriza irmãos que precisam de um olhar especial, saúde geral das células, baixa presença/ausência de dado e busca de pessoa. Não lista toda atenção comum como fila padrão.

### `/pessoas`

Na navegação atual, é a superfície de **membros do líder**. Mostra busca, filtros (`Todos`, `Atenção`, `Em cuidado`, `Ativos`) e lista organizada por prioridade pastoral: pessoas no radar primeiro, ativos depois. Pastor/admin são direcionados para `/equipe`; supervisores são direcionados para `/celulas`.

### `/celulas`

Superfície do supervisor para ver células por prioridade pastoral. Deve mostrar rapidamente quem pede cuidado próximo, onde há presença em atenção e quais células estão estáveis.

### `/equipe`

Superfície do pastor/admin para entender supervisores, células acompanhadas e células sem supervisor. Mostra primeiro exceções pastorais e mantém estrutura saudável recolhida para evitar organograma pesado.

### `/eventos`

Rota dos `Encontros`. Lista encontros dentro do escopo visível. O líder registra presença quando o encontro já começou; pastor e supervisor acompanham o estado do encontro sem assumir o registro.

## Seções pastorais

As telas principais organizam pessoas por intenção pastoral, não por lista bruta.

| Seção | Quando aparece | Propósito |
| --- | --- | --- |
| `Irmãos que precisam de um olhar especial` | sinal urgente ou caso encaminhado ao cuidado pastoral | mostrar o que pede cuidado agora |
| `Pedidos de apoio` | pedido de apoio da supervisão | separar apoio de rotina da atenção comum |
| `Acompanhar de perto` | atenção local comum | lembrar pessoas que precisam de contato cotidiano |
| `Acolhidos em cuidado` | pessoa em `Em cuidado` sem sinal mais prioritário | mostrar quem já recebeu cuidado e continua no radar |

Regras:

- mostrar até 4 registros por seção;
- usar `Ver mais` quando houver excedente;
- evitar duplicar a mesma pessoa na mesma superfície;
- escolher a seção mais específica possível;
- não criar fila, SLA ou tarefa a partir dessas seções.

Prioridade entre sinais da mesma pessoa:

```txt
Urgente/Caso pastoral -> Pedido de apoio -> Atenção local -> severidade/recência
```

## Estrutura de células e equipe

`/celulas` separa células do supervisor por:

| Seção | Conteúdo |
| --- | --- |
| `Pedem cuidado próximo` | caso pastoral, pedido de apoio, atenção local ou pessoa em cuidado |
| `Presença em atenção` | presença baixa registrada ou ausência de presença recente |
| `Acompanhamento estável` | células sem sinal relevante no momento |

`/equipe` mostra supervisores e células para pastor/admin. A lista de supervisores fica compacta e as células aparecem sob demanda.

Regras:

- ordenar primeiro por gravidade pastoral, depois por presença baixa ou ausência de dado, depois por nome;
- limitar listas extensas com `Ver mais` / `Mostrar menos`;
- mostrar status no card da célula, não repetir todo status no card do supervisor;
- manter busca e filtros como recorte, não como diretório administrativo.

## Escalonamento

O MVP usa `CareSignal.assignedToId` como mecanismo mínimo.

| Situação técnica | Significado de produto |
| --- | --- |
| `assignedToId` aponta para supervisor | pedido de apoio da supervisão |
| `assignedToId` aponta para pastor/admin | caso encaminhado ao pastor |
| `severity = URGENT` | caso pastoral por gravidade |

Escalonamento não cria task, SLA nem transferência total de responsabilidade. Mensagens devem ser contextuais, sem dizer que alguém “recebeu” o caso.

## Check-in

Check-in é exclusivo do líder da célula.

Regras:

- encontro de hoje pendente tem prioridade apenas depois de começar;
- depois vem último encontro realizado ou concluído editável;
- encontro futuro não deve ser acionável para check-in;
- pastor/supervisor veem resumo somente leitura;
- líder também vê resumo quando a presença já foi registrada;
- ajuste de presença é ação explícita, aberta a partir do resumo (`?modo=ajuste`);
- no modo de registro/ajuste, a tela vira operação focada: header compacto, sem bottom nav e com ação de cancelar/voltar;
- pessoa sem marcação explícita fica `Pendente`;
- visitante não vira membro automaticamente;
- visitante duplicado no mesmo encontro deve ser bloqueado por nome normalizado;
- no resumo, ausentes, justificativas e pendências aparecem antes; presentes ficam recolhidos para reduzir rolagem no mobile;
- no formulário, cards usam cores suaves por status para orientar sem fiscalizar;
- `Marcar todos como presentes` é atalho permitido, mas deve confirmar quando sobrescrever ausências ou justificativas.

Encontros futuros são informativos, não pendência operacional.

## Métricas de presença

A métrica deve dar contexto pastoral, não ranking.

- `Presença da semana` considera encontros da semana atual com presença registrada.
- Células sem check-in entram como `Sem presença recente` ou `Sem registro`, não como `0%`.
- Visitantes não entram no denominador.
- Sem dado deve aparecer como `—`, `Sem registro` ou equivalente.
- `Presença recente` na célula resume os últimos 4 encontros registrados e compara com os 4 anteriores quando há amostra suficiente.
- Percentuais de presença usam cor como leitura rápida: abaixo de 50% em risco, de 50% a 69% em atenção, 70% ou mais como presença positiva.
- Tendência deve falar de participação ou ritmo, não de saúde espiritual da pessoa ou da célula.

## Detalhe da pessoa

Responde:

```txt
Por que esta pessoa merece atenção e qual é o próximo gesto de cuidado?
```

Mostra status efetivo, ações diretas, ritmo de presença no mês, últimos encontros do mês, motivo principal, cuidado recente e `Já houve contato?`. Não vira prontuário, CRM ou timeline infinita.

## Fluxo de contato/cuidado

```txt
Pessoa em atenção -> Abrir pessoa -> Já houve contato? -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Já houve contato?` é pergunta, não ação destrutiva imediata;
- `Salvar sem anotação` é válido;
- cuidado resolve sinais ativos dentro do escopo do usuário;
- pastor/admin resolvem apenas sinais sem grupo ou de grupo ativo;
- líder/supervisor resolvem sinais dos grupos ativos visíveis;
- se resolver todos os sinais ativos relevantes, a pessoa fica `Em cuidado`;
- a pessoa só volta para `Ativo` por ação explícita;
- o mesmo motivo não deve reabrir por recalcular presença; precisa haver nova evidência posterior.

## Busca

A busca atual é busca de pessoa.

- Pastor/admin buscam pessoas dentro da igreja.
- Supervisor busca dentro do escopo supervisionado.
- Líder busca dentro da própria célula.
- Busca não deve depender de maiúsculas/minúsculas e deve tolerar acentos quando possível.
- Resultado leva para `/pessoas/[personId]`.
- Resultado usa status efetivo, não apenas status persistido.
- Não prometa busca de evento ou célula enquanto a API não suportar.

## Tema

O tema é preferência visual local do aparelho.

Temas atuais:

- `Claro`;
- `Pergaminho`;
- `Escuro`.

O tema aparece no login e no app autenticado. Ele não muda permissão, escopo ou dado pastoral.

## Linguagem e experiência

A UI deve ser curta, humana e acionável. Use os rótulos e CTAs oficiais de `GLOSSARY.md`. Evite linguagem de cobrança ou operação corporativa.
