# Glossário — Koinonia Lite

Este documento define vocabulário, rótulos, CTAs e tons oficiais do MVP. Para comportamento, use `PRODUCT.md`. Para implementação, use `ARCHITECTURE.md`.

## Regra De Linguagem

Use a palavra mais simples, pastoral e acionável.

```txt
Esse termo ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Evite jargão corporativo, linguagem de cobrança e termos que sugiram fila administrativa.

## Termos De Domínio

| Termo | Use assim | Evite |
| --- | --- | --- |
| Pessoa | centro do cuidado; use `Pessoa`, `Pessoas` ou `Membros` no contexto do líder | lead, cliente, contato comercial |
| Célula | comunidade local onde presença, vínculo e cuidado acontecem | grupo na UI, exceto quando for abstração técnica |
| Liderança | responsabilidade ativa pela célula; pode ser pessoa, casal ou equipe pequena | assumir um único líder |
| Supervisão | responsabilidade de acompanhamento da célula; pode ser compartilhada | assumir um único supervisor |
| Encontro | reunião da célula na UI; rota técnica continua `/eventos` | calendário amplo |
| Local padrão | local salvo na célula para novos encontros | confundir com local efetivo |
| Local deste encontro | local efetivo da ocorrência | sobrescrever agenda padrão sem intenção |
| Presença | registro de presente, ausente, justificado ou visitante | controle, fiscalização |
| Sem registro | ausência real de dado de presença | `0%` sem dado |
| Sem presença recente | célula sem presença recente registrada | risco automático |
| Sinal | evidência que sustenta uma atenção (`CareSignal`) | tarefa, ticket, SLA |
| Atenção | forma visível de apresentar um sinal | incidente, pendência crítica sem severidade real |
| Cuidado | registro mínimo de aproximação realizada | prontuário, workflow |
| Visão | leitura curta orientada à ação | dashboard na UI |

## Encontros E Presença

Rótulos oficiais:

- `Agendado`: encontro futuro.
- `Presença pendente`: encontro já iniciado em que o líder pode registrar presença.
- `Aguardando registro`: encontro já iniciado sem presença registrada para quem apenas acompanha.
- `Presença registrada`: encontro com presença salva.
- `Cancelado`: encontro futuro cancelado.
- `Não houve encontro`: encontro passado marcado como não realizado.
- `Pendências`: consulta de encontros passados sem presença registrada.
- `Histórico`: consulta de encontros com presença registrada.
- `Histórico de presença`: título da consulta de presença registrada.
- `Presenças pendentes`: título da consulta de pendências.

CTAs relacionados:

- `Ver encontro`;
- `Registrar presença`;
- `Ver detalhes`;
- `Ajustar presença`;
- `Salvar presença`;
- `Salvar ajuste`;
- `Marcar todos como presentes`;
- `Ajustar local`;
- `Salvar local`;
- `Remarcar encontro`;
- `Cancelar encontro`;
- `Não houve encontro`.

## Sinais, Apoio E Cuidado Pastoral

Mensagens de sinal devem ajudar a interpretar o cuidado sem ordenar uma ação. Prefira `talvez valha`, `pode ser um bom momento`, `pede proximidade`, `com calma` e `sem justificativa registrada`.

Evite `comece por`, `você precisa`, `deve fazer` e diagnósticos como `está se afastando`.

### Apoio De Supervisão

Use quando o líder pede ajuda ao supervisor.

Rótulos:

- líder vendo o caso: `Apoio solicitado`;
- supervisor vendo o caso: `Pedido de apoio`.

Mensagens:

- líder: `Apoio solicitado à supervisão.`;
- supervisor: `Essa célula pediu apoio da supervisão.`

Não use mensagem com nome do destinatário, como `Ana recebeu este pedido`.

### Cuidado Pastoral / Caso Pastoral

Use para caso urgente, sensível, recorrente grave ou encaminhado ao pastor/admin.

Rótulos possíveis:

- `Urgente`;
- `Caso pastoral`;
- `Cuidado pastoral`;
- `Encaminhado`;
- `Encaminhado ao pastor`;
- `Encaminhado ao cuidado pastoral`.

Mensagens:

- pastor/admin: `Cuidado pastoral solicitado.`;
- líder/supervisor: `Encaminhado ao pastor.`;
- urgente: `Caso que pede atenção imediata.`

Não use mensagem com nome do destinatário, como `Roberto recebeu este caso`.

## Contato E Cuidado

Use:

- `Ligar`;
- `WhatsApp`;
- `Registrar contato pastoral`;
- `Sim, houve contato`;
- `Ainda não consegui contato`;
- `Contato feito`;
- `Registrar cuidado`;
- `Anotar cuidado`;
- `Salvar sem anotação`;
- `Histórico de cuidado`;
- `Mostrar histórico completo`;
- `Em cuidado`;
- `Acolhidos em cuidado`.

`Ligar` e `WhatsApp` são atalhos externos de aproximação. O histórico persistido usa `Contato feito`, sem classificar o canal.

## Navegação E Superfícies

| Papel | Aba 1 | Aba 2 | Aba 3 |
| --- | --- | --- | --- |
| Líder | `Visão` | `Membros` | `Encontros` |
| Supervisor | `Visão` | `Células` | `Encontros` |
| Pastor/Admin | `Visão` | `Equipe` | `Encontros` |

Use `Equipe` para supervisores, liderança e células do pastor/admin. Não transforme em gestão pesada de usuários.

## Seções Pastorais

| Seção | Conteúdo |
| --- | --- |
| `Irmãos que precisam de um olhar especial` | urgentes e encaminhados ao cuidado pastoral |
| `Pedidos de apoio` | pedidos de apoio da supervisão |
| `Acompanhar de perto` | atenções locais comuns |
| `Acolhidos em cuidado` | pessoas em `Em cuidado` |
| `Células que pedem atenção` | células com caso pastoral, pedido de apoio, atenção acumulada ou presença baixa registrada |
| `Sem presença recente` | células sem presença recente registrada; não conta como risco automático |

## Rótulos E Tons

| Rótulo | Quando usar | Tom |
| --- | --- | --- |
| `Ativo` | pessoa sem sinal ativo relevante | verde |
| `Visitante` | pessoa visitante | informativo/neutro |
| `Novo` | pessoa recém-adicionada | informativo/neutro |
| `Em atenção` | atenção comum para líder/supervisor | âmbar |
| `Atenção local` | pastor vendo atenção comum em contexto | âmbar |
| `Apoio solicitado` | líder vendo pedido enviado à supervisão | apoio |
| `Pedido de apoio` | supervisor vendo pedido recebido | apoio |
| `Urgente` | severidade real `URGENT` | vermelho |
| `Caso pastoral` | pastor vendo sinal encaminhado ou grave | vermelho |
| `Cuidado pastoral` | pastor/admin vendo selo de cuidado pastoral solicitado | vermelho/care |
| `Encaminhado` | líder/supervisor vendo envio ao pastor | vermelho |
| `Em cuidado` | pessoa que recebeu cuidado e continua no radar | care |
| `Contato feito` | contato/cuidado registrado | care |
| `Informativo` | sinal `INFO`, quando exibido | neutro |
| `Sem registro` | ausência de dado de presença | neutro |
| `Sem presença recente` | célula sem presença recente registrada | neutro |
| `Agendado` | encontro futuro | informativo |
| `Presença pendente` | líder pode registrar presença | âmbar |
| `Aguardando registro` | perfil apenas acompanha encontro pendente | âmbar |
| `Presença registrada` | encontro com presença salva | verde |
| `Cancelado` | encontro futuro cancelado | neutro |
| `Não houve encontro` | encontro passado marcado como não realizado | neutro |

Não rebaixe `Urgente` para `Em atenção`. O contexto pode mudar a mensagem, mas a severidade continua sendo severidade.

## CTAs Oficiais

| Contexto | CTA preferencial |
| --- | --- |
| Login | `Entrar`, `Entrando...` |
| Senha no login | `Mostrar senha`, `Ocultar senha` |
| Senha esquecida | `Esqueceu a senha? Procure a liderança responsável pelo seu acesso.` |
| Sessão | `Sair` |
| Lista de pessoas/casos | `Abrir pessoa` |
| Pedido recebido pelo supervisor | `Abrir apoio` |
| Lista com muitos itens | `Ver mais`, `Mostrar menos` |
| Detalhe da pessoa | `Ligar`, `WhatsApp`, `Registrar contato pastoral` |
| Célula | `Abrir célula`, `Editar célula`, `Salvar célula` |
| Encontro futuro | `Ver encontro`, `Remarcar encontro`, `Cancelar encontro` |
| Encontro pendente | `Registrar presença`, `Não houve encontro` |
| Encontro registrado | `Ver detalhes`, `Ajustar presença`, `Ajustar local` |
| Operação de presença | `Cancelar`, `Voltar`, `Salvar presença`, `Salvar ajuste` |
| Cuidado | `Registrar cuidado`, `Salvar sem anotação` |

Evite `Abrir cuidado` em listas, porque sugere módulo formal de acompanhamento.

## Login, Tema E Texto

Login:

- `Entrar`;
- `Entrando...`;
- `E-mail`;
- `Senha`;
- `Mostrar senha`;
- `Ocultar senha`;
- `Sair`;
- `E-mail ou senha não conferem.`;
- `Esqueceu a senha? Procure a liderança responsável pelo seu acesso.`

Tema:

- `Claro`;
- `Pergaminho`;
- `Escuro`.

Tamanho do texto:

- `Normal`;
- `Grande`;
- `Muito grande`.

Tema e tamanho do texto são preferências locais. Não trate como configuração pastoral.

## Mapeamento Técnico Para UI

| Técnico | UI preferida |
| --- | --- |
| `User` | usuário autenticado |
| `GroupResponsibility` | liderança/supervisão |
| `SmallGroup` | célula |
| `GroupMembership` | vínculo/membro |
| `Event` | encontro |
| `Event.locationName` | local deste encontro |
| `Attendance` | presença |
| `CareSignal` | sinal / atenção |
| `CareTouch` | contato feito / cuidado realizado |
| `assignedToId` | apoio ou encaminhamento |
| `dashboard` | visão |
| `koinonia-theme` | tema |
| `koinonia-text-size` | tamanho do texto |
