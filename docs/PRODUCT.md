# Produto — Koinonia Lite

Este documento é a fonte oficial do MVP atual: visão, escopo, papéis e fluxos. Para vocabulário, use `docs/GLOSSARY.md`. Para implementação, use `docs/ARCHITECTURE.md`.

## Visão

Koinonia Lite é um radar pastoral mobile-first para células/grupos.

Ele ajuda liderança a perceber, lembrar e agir quando uma pessoa pode estar se afastando. O produto deve parecer apoio ao cuidado, não cobrança para documentar.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Princípio de decisão

Pergunta central:

```txt
Quem precisa de cuidado agora?
```

Pergunta de corte para novas funcionalidades:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajuda, não entra no MVP.

## Ciclo central

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Escopo do MVP atual

Inclui pessoas, células, eventos de célula, check-in simples, visitantes no check-in, taxa de presença, sinais por pessoa, escalonamento mínimo, busca de pessoa, detalhe simples de pessoa/célula, visão por papel e contato/cuidado com anotação opcional.

Não inclui acompanhamento formal, CRM pesado, task manager, kanban, fila, SLA, BI avançado, mapas, QR Code, geolocalização, notificações, área rica do membro, formulários longos ou calendário amplo.

## Papéis

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

Pode ver a própria célula, registrar check-in dos eventos da própria célula, adicionar visitantes, ver membros ativos, ver pessoas em atenção, pedir apoio da supervisão e registrar contato/cuidado.

Não deve registrar check-in de outra célula, registrar check-in futuro, operar visão macro ou substituir supervisor/pastor.

### Supervisor

Pode ver células sob sua supervisão, presença, eventos, atenções, pedidos de apoio, exceções, acúmulos e recorrências. Pode encaminhar ao pastor quando houver gravidade ou necessidade pastoral.

Não deve registrar check-in pelo líder, ver dados fora do escopo ou virar operador de presença.

### Pastor

Pode ver saúde geral, presença por célula, células pendentes ou com presença baixa, casos graves/urgentes/encaminhados, buscar qualquer pessoa dentro do escopo e abrir células para contexto local.

Não deve registrar check-in, receber toda atenção comum como fila inicial, virar central de tickets ou transformar a visão macro em relatório burocrático.

## Visibilidade: escopo não é lista padrão

Há diferença entre **poder acessar** e **receber por padrão**.

- Pastor pode ter escopo amplo para busca e leitura autorizada.
- A visão inicial do pastor prioriza saúde geral e casos pastorais.
- Atenção local pode aparecer quando pastor abre uma célula ou busca uma pessoa.
- Grupos inativos não entram na superfície padrão, em eventos, check-in ou histórico visível.

```txt
Visão inicial do pastor = saúde geral + casos pastorais.
Detalhe de célula = casos pastorais + atenções locais contextualizadas.
Busca = acesso explícito a pessoa dentro do escopo.
```

## Seções pastorais

As telas principais organizam pessoas por intenção pastoral, não por lista bruta.

| Seção | Quando aparece | Propósito |
| --- | --- | --- |
| `Irmãos que precisam de um olhar especial` | sinal urgente ou caso encaminhado ao cuidado pastoral | mostrar o que pede cuidado agora |
| `Pedidos de apoio` | pedido de apoio da supervisão | separar apoio de rotina da atenção comum |
| `Acompanhar de perto` | atenção local comum | lembrar pessoas que precisam de contato cotidiano |
| `Acolhidos em cuidado` | pessoa em `Em cuidado` | mostrar quem já recebeu cuidado e continua no radar |

Regras:

- mostrar até 4 registros por seção;
- usar `Ver mais` quando houver excedente;
- manter busca de pessoa para consulta explícita;
- não criar fila, SLA ou tarefa a partir dessas seções.

## Camadas de atenção

| Camada | Quem vê por padrão | Quando usar | Exemplo de UI |
| --- | --- | --- | --- |
| Atenção local | Líder | cuidado cotidiano da célula | `Em atenção` |
| Apoio de supervisão | Líder + supervisor | líder pediu ajuda ou há padrão/acúmulo | `Apoio solicitado`, `Pedido de apoio` |
| Cuidado pastoral | Pastor | urgente, sensível, recorrente ou encaminhado | `Urgente`, `Caso pastoral` |

## Escalonamento atual

O MVP usa `CareSignal.assignedToId` como mecanismo mínimo.

| Situação técnica | Significado de produto |
| --- | --- |
| `assignedToId` aponta para supervisor | pedido de apoio da supervisão |
| `assignedToId` aponta para pastor/admin | caso encaminhado ao pastor |
| `severity = URGENT` | caso pastoral por gravidade |

Escalonamento não cria task, SLA nem transferência total de responsabilidade. Mensagens devem ser contextuais, sem dizer que uma pessoa específica “recebeu” o caso.

## Check-in

Check-in é exclusivo do líder da célula.

Regras:

- evento de hoje pendente tem prioridade;
- depois vem último evento realizado ou concluído editável;
- evento futuro não deve ser acionável para check-in;
- pastor/supervisor veem resumo somente leitura;
- evento concluído pode ser corrigido pelo líder;
- pessoa sem marcação explícita fica `Pendente`;
- visitante não vira membro automaticamente;
- visitante duplicado no mesmo evento deve ser bloqueado por nome normalizado.

## Métricas de presença

A métrica deve dar contexto pastoral, não ranking.

- `Presença da semana` considera encontros da semana atual com presença registrada.
- Células sem check-in entram como pendentes, não como `0%`.
- Visitantes não entram no denominador.
- Sem dado deve aparecer como `—`, `Sem registro` ou equivalente.
- `Presença recente` resume últimos encontros registrados no escopo visível.

## Telas principais

### Visão do pastor

Prioriza irmãos que precisam de um olhar especial, saúde geral das células, pendências/baixa presença e busca geral de pessoa. Não lista toda atenção comum como fila padrão.

### Visão do supervisor

Prioriza pedidos de apoio recebidos, células acompanhadas, presença recente e casos relevantes sob supervisão. Evita duplicar a mesma pessoa em várias seções.

### Visão do líder

Prioriza quem merece atenção na célula, check-in/evento relevante, membros da própria célula e ações simples para abrir pessoa e registrar cuidado.

### Detalhe da pessoa

Responde:

```txt
Por que esta pessoa merece atenção e qual é o próximo gesto de cuidado?
```

Mostra status efetivo, ações diretas, motivo principal, última presença, cuidado recente e `Já houve contato?`. Não vira prontuário, CRM ou timeline infinita.

## Fluxo de contato/cuidado

```txt
Pessoa em atenção -> Abrir pessoa -> Já houve contato? -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Já houve contato?` é pergunta, não ação destrutiva imediata.
- `Salvar sem anotação` é válido.
- Cuidado resolve sinais ativos dentro do escopo do usuário.
- Se resolver todos os sinais ativos, a pessoa fica `Em cuidado`; só volta para `Ativo` por ação explícita.
- O mesmo motivo não deve reabrir por recalcular presença; precisa haver nova evidência posterior.

## Busca

A busca atual é busca de pessoa.

- Pastor busca qualquer pessoa dentro da igreja/campus.
- Supervisor busca dentro do escopo supervisionado.
- Líder busca dentro da própria célula.
- Resultado leva para `/pessoas/[personId]`.
- Resultado deve usar status efetivo, não apenas status persistido.
- Não prometa busca de evento ou célula enquanto a API não suportar.

## Linguagem e experiência

Prefira `Visão`, `Pessoas`, `Membros`, `Em atenção`, `Em cuidado`, `Urgente`, `Cuidado realizado`, `Abrir pessoa` e `Já houve contato?`.

Evite `task`, `ticket`, `SLA`, `workflow`, `lead`, `funil` e `incidente`.

A experiência deve aliviar o usuário, não lembrá-lo de mais uma obrigação administrativa.
