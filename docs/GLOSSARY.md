# Glossário — Koinonia Lite

Este documento define **vocabulário, rótulos e CTAs oficiais do MVP**. Para escopo e comportamento, use `PRODUCT.md`. Para implementação, use `ARCHITECTURE.md`.

## Regra de linguagem

Use a palavra mais simples, pastoral e acionável.

```txt
Esse termo ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajudar, simplifique.

## Termos de domínio

### Pessoa

Centro operacional do Koinonia.

Use `Pessoa`, `Pessoas`, `Membros` quando o líder olha a própria célula, e `Quem precisa de cuidado` quando a tela destaca atenção.

Evite `lead`, `cliente` e `contato comercial`.

### Célula

Comunidade local onde presença, vínculo e cuidado acontecem. Use `Célula` na UI. Use `grupo` apenas quando a abstração técnica pedir.

### Liderança e supervisão

Use `Liderança` e `Supervisão` em cards e contexto de célula.

Esses termos podem representar uma pessoa, casal ou equipe pequena. Evite fixar a UI em `Líder`/`Supervisor` quando o contexto for responsabilidade compartilhada.

### Encontro / evento

Na UI, prefira `Encontro` e `Encontros`. Em código, rotas e entidades técnicas, `Event`/`evento` continuam válidos.

Use `Reunião da célula` quando precisar explicar o tipo de encontro. Evite transformar encontro em calendário amplo.

### Local do encontro

Use `Local deste encontro` para o local efetivo de uma ocorrência. Use `Local padrão` apenas quando estiver falando da agenda da célula.

CTAs relacionados:

- `Salvar local`;
- `Ajustar local`.

### Remarcar encontro

Use quando o encontro muda de data/horário/local, mas continua sendo a mesma ocorrência da célula.

CTA: `Remarcar encontro`.

Evite usar `Cancelar` quando a célula apenas mudou de dia.

### Cancelar encontro

Use antes do horário do encontro, quando a célula já sabe que não vai se reunir naquela data.

CTA: `Cancelar encontro`.

### Não houve encontro

Use depois do horário, quando a célula não se reuniu e não há presença registrada.

CTA: `Não houve encontro`.

Não use quando já existe presença registrada.

### Presença

Registro de quem esteve, faltou ou justificou.

Use `Presença`, `Ritmo de presença`, `Presença pendente`, `Presença registrada`, `Registrar presença`, `Ajustar presença`, `Salvar presença`, `Salvar ajuste`, `Ver resumo` e `Marcar todos como presentes`.

Para encontros:

- `Agendado`: encontro ainda não começou;
- `Presença pendente`: encontro já começou e o líder pode registrar;
- `Aguardando registro`: encontro já começou sem presença registrada para quem apenas acompanha;
- `Cancelado`: encontro futuro cancelado;
- `Não houve encontro`: encontro passado marcado como não realizado.

Evite `controle de presença` e `fiscalização`.

### Sem registro

Ausência real de dado de presença. Use quando não há presença registrada suficiente para calcular percentual. Não mostre `0%` nesse caso.

### Sem presença recente

Estado de célula quando ainda não há presença recente registrada para leitura pastoral. Isso não é risco automático e não deve entrar como presença baixa.

Frase explicativa recomendada:

```txt
Ainda não há presença recente registrada. Talvez o encontro tenha acontecido, mas a presença ainda não foi marcada.
```

Evite `células pendentes` ou linguagem de cobrança.

### Sinal

Evidência que sustenta uma atenção. No código: `CareSignal`.

```txt
Sinal não é tarefa.
```

Sinal não é ticket, SLA, cobrança ou fila burocrática.

### Atenção

Forma visível de apresentar um sinal para alguém agir.

Use `Em atenção`, `Pessoas em atenção`, `Atenção local`, `Quem merece atenção`, `Acompanhar de perto`, `Pedem cuidado próximo` e `Quem merece proximidade`.

Evite `alerta`, `incidente` e `pendência crítica`, salvo quando houver severidade real.

### Apoio de supervisão

Quando o líder precisa de ajuda do supervisor, ou quando a supervisão precisa olhar padrões/acúmulos.

Rótulos por contexto:

- líder vendo o caso: `Apoio solicitado`;
- supervisor vendo o caso: `Pedido de apoio`.

Mensagens recomendadas:

- líder: `Apoio solicitado à supervisão.`
- supervisor: `Essa célula pediu apoio da supervisão.`

Evite mensagens com nome do destinatário, como `Ana recebeu este pedido de apoio`.

### Cuidado pastoral / caso pastoral

Caso que pede olhar pastoral mais próximo: urgente, sensível, recorrente grave ou encaminhado ao pastor/admin.

Rótulos possíveis:

- `Urgente`;
- `Caso pastoral`;
- `Encaminhado`;
- `Encaminhado ao pastor`;
- `Encaminhado ao cuidado pastoral`.

Mensagens recomendadas:

- pastor/admin: `Encaminhado ao cuidado pastoral.`
- líder/supervisor: `Encaminhado ao pastor.`
- urgente: `Caso que pede atenção imediata.`

Evite mensagens com nome do destinatário, como `Roberto recebeu este caso`.

### Escalonamento

Ato de dar visibilidade ou pedir apoio a outro nível de liderança.

Fluxo preferencial:

```txt
Líder -> Supervisor -> Pastor
```

Fluxo direto permitido em gravidade/sensibilidade:

```txt
Líder -> Pastor
```

Escalonamento não transfere toda responsabilidade, não cria SLA e não vira task manager.

Ao pedir apoio ou encaminhar, use contexto breve e opcional. Bons rótulos: `Quer deixar um contexto breve?`, `Contexto opcional`, `Pedir apoio` e `Encaminhar`. Evite exigir anotação para concluir a ação.

### Contato

Ação concreta de aproximação.

Use `Ligar`, `WhatsApp`, `Já houve contato?`, `Sim, houve contato` e `Ainda não consegui contato`.

### Cuidado

Registro mínimo de que alguém percebeu e agiu.

Use `Em cuidado`, `Acolhidos em cuidado`, `Cuidado realizado`, `Registrar cuidado`, `Anotar cuidado`, `Salvar sem anotação`, `Pedido de apoio` e `Encaminhado ao pastor`.

Evite `task`, `workflow`, `chamado`, `ticket` e `SLA`.

### Visão

Leitura curta e orientada à ação. Use `Visão` em vez de `Dashboard` na UI.

### Membros

Rótulo da aba `/pessoas` para líder. Use quando a tela mostra pessoas da própria célula.

### Células

Rótulo da aba do supervisor. Use para a superfície de células supervisionadas.

### Equipe

Rótulo da aba do pastor/admin. Use para supervisores, liderança e células.

Evite transformar `Equipe` em gestão pesada de usuários, ranking de supervisores ou painel de desempenho.

### Login

Entrada do usuário autenticado.

Use `Entrar`, `E-mail`, `Senha`, `Mostrar senha`, `Ocultar senha`, `Sair` e mensagens curtas como `E-mail ou senha não conferem.`

Quando precisar de exemplo de e-mail no login, use `nome@igreja.com`.

Evite `modo demo`, `trocar perfil`, `impersonar usuário` e mensagens técnicas de sessão.

### Tema

Preferência visual local do aparelho.

Rótulos oficiais:

- `Claro`;
- `Pergaminho`;
- `Escuro`.

Tema não é configuração pastoral, não muda escopo e não precisa de tela administrativa.

## Rótulos e tons oficiais

| Rótulo | Quando usar | Tom |
| --- | --- | --- |
| `Ativo` | pessoa sem sinal ativo relevante | verde |
| `Visitante` | pessoa visitante | informativo/neutro |
| `Novo` | pessoa recém-adicionada | informativo/neutro |
| `Em atenção` | atenção comum para líder/supervisor | âmbar |
| `Atenção local` | pastor vendo atenção comum dentro de contexto | âmbar |
| `Apoio solicitado` | líder vendo pedido enviado à supervisão | apoio |
| `Pedido de apoio` | supervisor vendo pedido recebido | apoio |
| `Urgente` | severidade real `URGENT` | vermelho |
| `Caso pastoral` | pastor vendo sinal encaminhado a pastor/admin | vermelho |
| `Encaminhado` | líder/supervisor vendo envio ao pastor | vermelho |
| `Em cuidado` | pessoa que recebeu cuidado e deve continuar no radar | care |
| `Cuidado realizado` | contato/cuidado registrado | care |
| `Informativo` | sinal `INFO`, quando exibido | informativo/neutro |
| `Sem registro` | ausência de dado de presença | neutro |
| `Sem presença recente` | célula sem presença recente registrada | neutro |
| `Agendado` | encontro futuro | informativo/neutro |
| `Presença pendente` | encontro já iniciado em que o líder pode registrar presença | âmbar |
| `Aguardando registro` | encontro já iniciado sem presença registrada para quem apenas acompanha | âmbar |
| `Presença registrada` | encontro com presença salva | verde |
| `Cancelado` | encontro futuro cancelado | neutro |
| `Não houve encontro` | encontro passado marcado como não realizado | neutro |

Não rebaixar `Urgente` para `Em atenção`. O contexto pode mudar a mensagem, mas a severidade continua sendo severidade.

## Seções pastorais

| Seção | Conteúdo |
| --- | --- |
| `Irmãos que precisam de um olhar especial` | urgentes e encaminhados ao cuidado pastoral |
| `Pedidos de apoio` | pedidos de apoio da supervisão |
| `Acompanhar de perto` | atenções locais comuns |
| `Acolhidos em cuidado` | pessoas em `Em cuidado` |
| `Células que pedem atenção` | células com caso pastoral, pedido de apoio, atenção local acumulada ou presença baixa registrada |
| `Sem presença recente` | células sem presença recente registrada; não conta como risco pastoral |

## CTAs oficiais

| Contexto | CTA preferencial |
| --- | --- |
| Login | `Entrar` |
| Senha no login | `Mostrar senha`, `Ocultar senha` |
| Sair da sessão | `Sair` |
| Lista de pessoas/casos | `Abrir pessoa` |
| Pedido recebido pelo supervisor | `Abrir apoio` |
| Lista com muitos itens | `Ver mais`, `Mostrar menos` |
| Detalhe da pessoa | `Ligar`, `WhatsApp`, `Já houve contato?` |
| Célula | `Abrir célula` |
| Encontro futuro | `Ver encontro`, `Remarcar encontro`, `Cancelar encontro` |
| Encontro pendente | `Registrar presença`, `Não houve encontro` |
| Encontro registrado | `Ver resumo`, `Ajustar presença`, `Ajustar local` |
| Local do encontro | `Salvar local`, `Ajustar local` |
| Cuidado | `Registrar cuidado`, `Salvar sem anotação` |
| Operação de presença | `Cancelar`, `Voltar`, `Salvar presença`, `Salvar ajuste` |

Evite `Abrir cuidado` em lista, porque sugere módulo formal de acompanhamento.

## Mapeamento técnico -> UI

| Técnico | UI preferida | Observação |
| --- | --- | --- |
| `User` | usuário autenticado | fonte real do papel e escopo |
| `GroupResponsibility` | liderança/supervisão | permite múltiplos responsáveis |
| `SmallGroup` | célula | comunidade local de cuidado |
| `Event` | encontro | UI usa `Encontros` |
| `scheduleStartsAt` | ocorrência original | não aparece na UI |
| `Event.locationName` | local deste encontro | local efetivo |
| `CareSignal` | atenção / pessoa em atenção | sinal sustenta a atenção |
| `CareTouch` | contato feito / cuidado realizado | registro mínimo após ação |
| `Attendance` | presença | fonte pastoral, não fiscalização |
| `assignedToId` | apoio/encaminhamento | escalonamento mínimo |
| `dashboard` | visão | evitar linguagem executiva pesada |
| `koinonia-theme` | tema | preferência local do aparelho |
