# Glossário — Koinonia Lite

Este documento define vocabulário e rótulos oficiais do MVP. Para escopo e fluxos, consulte `PRODUCT.md`. Para implementação, consulte `ARCHITECTURE.md`.

## Regra de linguagem

Use a palavra mais simples, pastoral e acionável.

```txt
Esse termo ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajudar, simplifique.

## Termos de domínio

### Pessoa

Centro operacional do Koinonia.

Use `Pessoa`, `Pessoas`, `Membros` quando o líder olha a própria célula, e `Quem precisa de cuidado`.

Evite `lead`, `cliente` e `contato comercial`.

### Célula

Comunidade local onde presença, vínculo e cuidado acontecem. Use `Célula` na UI. Use `grupo` apenas quando a abstração técnica pedir.

### Evento / encontro

Encontro real que pode gerar presença. Use `Evento`, `Encontro` ou `Reunião da célula`.

Evite transformar evento em calendário amplo antes da hora.

### Presença

Registro de quem esteve, faltou ou justificou.

Use `Presença`, `Registrar presença`, `Presença da semana`, `Presença recente`, `Salvar presença`, `Salvar ajuste` e `Ver resumo`.

Evite `controle de presença` e `fiscalização`.

### Sem registro

Ausência real de dado de presença.

Use quando não há presença registrada suficiente para calcular percentual. Não mostre `0%` nesse caso.

### Sinal

Evidência que sustenta uma atenção. No código: `CareSignal`.

```txt
Sinal não é tarefa.
```

Sinal não é ticket, SLA, cobrança ou fila burocrática.

### Atenção

Forma visível de apresentar um sinal para alguém agir.

Use `Em atenção`, `Pessoas em atenção`, `Atenção local`, `Quem merece atenção` e `Acompanhar de perto`.

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

### Contato

Ação concreta de aproximação.

Use `Ligar`, `WhatsApp`, `Já houve contato?`, `Sim, houve contato` e `Ainda não consegui contato`.

### Cuidado

Registro mínimo de que alguém percebeu e agiu.

Use `Em cuidado`, `Acolhidos em cuidado`, `Cuidado realizado`, `Registrar cuidado`, `Anotar cuidado` e `Salvar sem anotação`.

Evite `task`, `workflow`, `chamado`, `ticket` e `SLA`.

### Visão

Leitura curta e orientada à ação. Use `Visão` em vez de `Dashboard` na UI.

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
| `Apoio solicitado` | líder vendo pedido enviado à supervisão | roxo/lilás discreto |
| `Pedido de apoio` | supervisor vendo pedido recebido | roxo/lilás discreto |
| `Urgente` | severidade real `URGENT` | vermelho |
| `Caso pastoral` | pastor vendo sinal encaminhado a pastor/admin | vermelho |
| `Encaminhado` | líder/supervisor vendo envio ao pastor | vermelho |
| `Em cuidado` | pessoa que recebeu cuidado e deve continuar no radar | azul/care |
| `Cuidado realizado` | contato/cuidado registrado | azul/care |
| `Informativo` | sinal `INFO`, quando exibido | informativo/neutro |
| `Sem registro` | ausência de dado de presença | neutro |

Não rebaixar `Urgente` para `Em atenção`. O contexto pode mudar a mensagem, mas a severidade continua sendo severidade.

## Seções pastorais

| Seção | Conteúdo |
| --- | --- |
| `Irmãos que precisam de um olhar especial` | urgentes e encaminhados ao cuidado pastoral |
| `Pedidos de apoio` | pedidos de apoio da supervisão |
| `Acompanhar de perto` | atenções locais comuns |
| `Acolhidos em cuidado` | pessoas em `Em cuidado` |

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
| Evento pendente | `Registrar presença` |
| Evento registrado | `Ver resumo`, `Ajustar presença` |
| Cuidado | `Registrar cuidado`, `Salvar sem anotação` |

Evite `Abrir cuidado` em lista, porque sugere módulo formal de acompanhamento.

## Mapeamento técnico -> UI

| Técnico | UI preferida | Observação |
| --- | --- | --- |
| `User` | usuário autenticado | fonte real do papel e escopo |
| `passwordHash` | senha | nunca exibir ou manipular em UI comum |
| `koinonia-session` | sessão | cookie técnico; não aparece na UI |
| `CareSignal` | atenção / pessoa em atenção | sinal sustenta a atenção |
| `CareTouch` | contato feito / cuidado realizado | registro mínimo após ação |
| `Event` | evento / encontro | não virar calendário amplo |
| `Attendance` | presença | fonte pastoral, não fiscalização |
| `assignedToId` | apoio/encaminhamento | escalonamento mínimo |
| `dashboard` | visão | evitar linguagem executiva pesada |
| `koinonia-theme` | tema | preferência local do aparelho |
