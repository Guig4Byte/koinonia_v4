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

| Etapa | Papel no produto |
| --- | --- |
| Evento | Representa um encontro real da célula. |
| Presença | Mostra quem esteve, faltou ou justificou. |
| Atenção | Traz uma pessoa à consciência da liderança. |
| Contato | Estimula ação humana: ligação, WhatsApp ou conversa. |
| Cuidado | Registra que alguém percebeu e agiu. |

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Escopo do MVP atual

Inclui:

- pessoas;
- células/grupos;
- eventos de célula;
- check-in simples;
- visitantes no check-in;
- taxa de presença;
- sinais de atenção por pessoa;
- escalonamento mínimo por atribuição do sinal;
- busca simples de pessoa;
- detalhe simples da pessoa;
- detalhe simples da célula;
- visão macro do pastor;
- visão de apoio do supervisor;
- visão operacional do líder;
- contato/cuidado simples com anotação opcional.

Não inclui agora:

- acompanhamento formal;
- CRM pastoral pesado;
- task manager, kanban, fila ou SLA;
- BI/analytics avançado;
- mapas, QR Code ou geolocalização;
- notificações;
- área rica do membro;
- cadastro/formulários longos;
- calendário amplo de igreja.

`Acompanhamento` é uma direção futura para casos contínuos. No MVP atual, não deve aparecer como processo, SLA ou fila complexa.

## Papéis

Regra norteadora:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

Responsável pelo cotidiano da célula.

Pode:

- ver a própria célula;
- registrar check-in dos eventos da própria célula;
- adicionar visitantes no check-in;
- ver membros ativos da própria célula;
- ver pessoas em atenção da própria célula;
- pedir apoio da supervisão;
- abrir pessoa e registrar contato/cuidado.

Não deve:

- registrar check-in de outra célula;
- operar visão macro;
- substituir supervisor ou pastor.

### Supervisor

Responsável por apoiar líderes e acompanhar padrões.

Pode:

- ver células sob sua supervisão;
- ver presença, eventos e atenções dessas células;
- receber pedidos de apoio dos líderes;
- acompanhar exceções, acúmulos e recorrências;
- encaminhar ao pastor quando houver gravidade ou necessidade pastoral.

Não deve:

- registrar check-in pelo líder;
- ver dados fora do seu escopo;
- virar operador de presença.

### Pastor

Responsável por interpretar saúde geral e entrar em casos pastorais.

Pode:

- ver saúde geral das células/eventos;
- ver presença da semana e presença recente por célula;
- ver células com presença baixa, pendência ou acúmulo;
- ver casos graves, urgentes ou encaminhados;
- buscar qualquer pessoa dentro da igreja/campus quando precisar;
- abrir uma célula e consultar atenções locais contextualizadas.

Não deve:

- registrar check-in;
- receber toda atenção comum como fila inicial;
- virar central de tickets;
- transformar visão macro em relatório burocrático.

## Visibilidade: escopo não é lista padrão

Há diferença entre **poder acessar** e **receber por padrão**.

- O pastor pode ter escopo amplo para busca e leitura autorizada.
- Isso não significa que a visão inicial deve listar todos os sinais abertos da igreja.
- A visão inicial do pastor prioriza saúde geral e casos pastorais.
- A atenção local pode aparecer para o pastor quando ele abre uma célula ou busca uma pessoa. Isso é consulta contextual.

Regra resumida:

```txt
Visão inicial do pastor = saúde geral + casos pastorais.
Detalhe de célula = casos pastorais + atenções locais contextualizadas.
Busca = acesso explícito a pessoa dentro do escopo.
```

## Camadas de atenção

| Camada | Quem vê por padrão | Quando usar | Exemplo de UI |
| --- | --- | --- | --- |
| Atenção local | Líder | cuidado cotidiano da célula | `Em atenção` |
| Apoio de supervisão | Líder + supervisor | líder pediu ajuda ou há padrão/acúmulo | `Apoio solicitado`, `Pedido de apoio` |
| Cuidado pastoral | Pastor | urgente, sensível, recorrente ou encaminhado | `Urgente`, `Caso pastoral` |

Escalonamento preferencial:

```txt
Líder -> Supervisor -> Pastor
```

Escalonamento direto ao pastor pode existir quando houver gravidade ou sensibilidade.

## Escalonamento atual

O MVP usa `CareSignal.assignedToId` como mecanismo mínimo de escalonamento.

| Situação técnica | Significado de produto |
| --- | --- |
| `assignedToId` aponta para supervisor | pedido de apoio da supervisão |
| `assignedToId` aponta para pastor/admin | caso encaminhado ao pastor |
| `severity = URGENT` | caso pastoral por gravidade |

Regras importantes:

- Escalonamento não cria task, SLA nem transferência total de responsabilidade.
- Caso urgente aparece para o pastor mesmo sem atribuição explícita.
- Caso urgente atribuído ao supervisor aparece para o pastor por gravidade, mas a mensagem de apoio pertence ao líder/supervisor.
- Pastor só vê mensagem de encaminhamento quando o sinal foi atribuído a pastor/admin.

## Fluxo de check-in

Check-in é exclusivo do líder da célula.

Fluxo:

```txt
Evento da célula
-> abrir check-in
-> marcar membros como presente, ausente ou justificou
-> adicionar visitantes, se houver
-> finalizar quando não houver pendentes
-> atualizar presença
-> gerar atenções quando fizer sentido
```

Regras:

- evento de hoje pendente tem prioridade;
- depois vem próximo evento pendente;
- depois vem último evento realizado;
- pastor/supervisor veem resumo somente leitura;
- evento concluído pode ser corrigido pelo líder;
- pessoa sem marcação explícita fica `Pendente`;
- visitante não vira membro automaticamente;
- visitante duplicado no mesmo evento deve ser bloqueado por nome normalizado.

## Métricas de presença

A métrica deve dar contexto pastoral, não ranking.

Regras:

- `Presença da semana` considera encontros da semana atual com presença registrada;
- células sem check-in entram como pendentes, não como `0%`;
- visitantes não entram no denominador;
- sem dado deve aparecer como `—`, `sem registro` ou texto equivalente;
- `Presença recente` resume últimos encontros registrados no escopo visível.

## Telas principais

### Visão do pastor

Deve priorizar:

- presença da semana;
- células pendentes ou com presença baixa;
- casos pastorais em destaque;
- busca geral de pessoa.

Não deve listar toda atenção comum da igreja como fila padrão.

### Visão do supervisor

Deve priorizar:

- pedidos de apoio recebidos;
- células acompanhadas;
- presença recente;
- outros casos relevantes sob sua supervisão.

Evite duplicar a mesma pessoa em várias seções quando uma seção mais específica já a mostra.

### Visão do líder

Deve priorizar:

- check-in ou evento relevante;
- membros em atenção;
- membros da própria célula;
- ações simples para abrir pessoa e registrar cuidado no detalhe.

### Detalhe da célula

Responde:

```txt
Como esta célula está e quem precisa ser lembrado nela?
```

Deve mostrar:

- líder e supervisor;
- horário/local, quando houver;
- membros ativos;
- presença recente;
- encontro relevante;
- pessoas em atenção.

Para pastor, separar:

- `Casos pastorais da célula`;
- `Atenções locais da célula`.

Essa separação evita ambiguidade: pastor pode consultar o contexto local, mas não assume automaticamente toda atenção comum.

### Pessoas / Membros

A rota `/pessoas` não é diretório amplo por padrão.

- Líder: pode aparecer como `Membros` e listar membros ativos da própria célula.
- Supervisor: mostra pessoas em atenção dentro do escopo, priorizando pedidos e exceções.
- Pastor: mostra casos pastorais, não toda atenção comum.
- Pastor/supervisor usam busca para consultar alguém fora da lista padrão.

### Detalhe da pessoa

Responde:

```txt
Por que esta pessoa merece atenção e qual é o próximo gesto de cuidado?
```

Deve mostrar apenas o necessário:

- dados básicos e contexto de célula;
- status simples;
- ações diretas: ligar/WhatsApp;
- motivos de atenção;
- última presença;
- cuidado recente;
- ação `Já houve contato?`.

Não deve virar prontuário, CRM completo, timeline infinita ou formulário longo.

## Fluxo de contato/cuidado

Fluxo:

```txt
Pessoa em atenção -> Abrir pessoa -> Já houve contato? -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Já houve contato?` é pergunta, não ação destrutiva imediata.
- Nenhum clique acidental deve fechar atenção.
- `Salvar sem anotação` é válido.
- `Anotar` salva observação curta.
- Cuidado resolve sinais ativos dentro do escopo do usuário e mantém a pessoa em `Em cuidado` quando não restar sinal ativo.
- Se o cuidado resolver todos os sinais ativos, a pessoa fica `Em cuidado`; só volta para `Ativo` por ação explícita quando respondeu bem ao cuidado.
- O mesmo motivo não deve reabrir apenas por recalcular presença; precisa haver nova evidência posterior.

## Busca

A busca atual é busca de pessoa.

Regras:

- pastor busca qualquer pessoa dentro da igreja/campus;
- supervisor busca dentro do escopo supervisionado;
- líder busca dentro da própria célula;
- resultado leva para `/pessoas/[personId]`;
- não prometa busca de evento ou célula enquanto a API não suportar.

## Linguagem e experiência

Use linguagem curta, pastoral e concreta. Prefira:

- `Visão` em vez de `Dashboard`.
- `Pessoas` ou `Membros` em vez de diretório.
- `Em atenção`, `Em cuidado`, `Urgente`, `Cuidado realizado`.
- `Abrir pessoa` em listas.
- `Já houve contato?` no detalhe.

Evite:

- `task`, `ticket`, `SLA`, `workflow`, `lead`, `funil`, `incidente`.

A experiência deve aliviar o usuário, não lembrá-lo de mais uma obrigação administrativa.

## Direção futura

O produto pode crescer para autenticação real, acompanhamento formal, área de membro, relatórios e recursos mais amplos. Isso só deve acontecer depois que o ciclo central estiver validado e excelente.
