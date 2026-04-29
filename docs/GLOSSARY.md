# Glossário — Koinonia Lite

Este documento define o vocabulário oficial do MVP. Para escopo e fluxos, consulte `PRODUCT.md`. Para implementação técnica, consulte `ARCHITECTURE.md`.

## Regra de linguagem

Use a palavra mais simples, pastoral e acionável.

```txt
Esse termo ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajudar, simplifique.

## Termos de domínio

### Pessoa

Centro operacional do Koinonia.

Use:

- `Pessoa`;
- `Pessoas`;
- `Membros`, quando o líder olha a própria célula;
- `Quem precisa de cuidado`.

Evite: `lead`, `cliente`, `contato comercial`.

### Célula / grupo

Comunidade local onde presença, vínculo e cuidado acontecem.

Use `Célula` na UI. Use `grupo` apenas quando a abstração técnica pedir.

Exemplos:

- `Minha célula`;
- `Células acompanhadas`;
- `Saúde das células`.

### Evento / encontro

Encontro real que pode gerar presença.

No MVP, normalmente é reunião de célula. Não transformar em calendário amplo antes da hora.

Use:

- `Evento`;
- `Encontro`;
- `Reunião da célula`.

### Presença

Registro de quem esteve, faltou ou justificou.

Presença não é fiscalização. É fonte de leitura pastoral.

Use:

- `Presença`;
- `Registrar presença`;
- `Presença da semana`;
- `Presença recente`;
- `Ver resumo`.

Evite: `controle de presença`, `fiscalização`.

### Sinal

Evidência que sustenta uma atenção.

No código atual: `CareSignal`.

Exemplos:

- faltas consecutivas;
- queda recente de presença;
- retorno que merece acolhimento;
- pessoa sem contato recente.

Regra oficial:

```txt
Sinal não é tarefa.
```

Sinal não é ticket, SLA, cobrança ou fila burocrática.

### Atenção

Forma visível de apresentar um sinal para alguém agir.

Use:

- `Em atenção`;
- `Pessoas em atenção`;
- `Atenção local`;
- `Quem merece atenção`.

Evite: `alerta`, `incidente`, `pendência crítica`, salvo quando houver decisão explícita de severidade.

### Atenção local

Atenção cotidiana da célula, normalmente cuidada pelo líder.

Exemplos:

- ausência comum;
- retorno simples;
- visitante que precisa ser lembrado;
- contato cotidiano.

Para pastor, `Atenção local` pode aparecer dentro do detalhe de uma célula. Não deve aparecer como fila inicial ampla.

### Apoio de supervisão

Quando o líder precisa de ajuda do supervisor, ou quando a supervisão precisa olhar padrões/acúmulos.

Rótulos por contexto:

- líder vendo o caso: `Apoio solicitado`;
- supervisor vendo o caso: `Pedido de apoio`.

### Cuidado pastoral / caso pastoral

Caso que pede olhar pastoral mais próximo.

Entra aqui quando for:

- urgente;
- sensível;
- recorrente grave;
- explicitamente encaminhado ao pastor/admin.

Rótulos possíveis:

- `Urgente`;
- `Caso pastoral`;
- `Encaminhado ao pastor`.

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

No MVP atual:

- `CareSignal.assignedToId` para supervisor = pedido de apoio;
- `CareSignal.assignedToId` para pastor/admin = encaminhamento pastoral;
- `severity = URGENT` = pastor vê por gravidade.

### Contato

Ação concreta de aproximação.

Exemplos:

- ligação;
- WhatsApp;
- conversa pessoal;
- tentativa de contato.

Use:

- `Ligar`;
- `WhatsApp`;
- `Já houve contato?`;
- `Sim, houve contato`;
- `Ainda não consegui contato`.

### Cuidado

Registro mínimo de que alguém percebeu e agiu.

No MVP atual, cuidado não é prontuário pastoral completo.

Use:

- `Em cuidado`, quando a pessoa já recebeu contato e deve continuar no radar sem acompanhamento formal;
- `Cuidado realizado`;
- `Registrar cuidado`;
- `Anotar cuidado`;
- `Salvar sem anotação`.

Evite: `task`, `workflow`, `chamado`, `SLA`.

### Acompanhamento

Fluxo futuro de continuidade para casos que exigirem mais do que um contato simples.

No MVP atual, não usar acompanhamento como task manager, kanban, SLA ou fila complexa.

### Visão

Leitura curta e orientada à ação.

Use `Visão` em vez de `Dashboard` na UI.

## Rótulos e tons oficiais

| Rótulo | Quando usar | Tom |
| --- | --- | --- |
| `Ativo` | pessoa sem sinal ativo relevante | verde |
| `Em atenção` | atenção comum para líder/supervisor | âmbar |
| `Atenção local` | pastor vendo atenção comum dentro de contexto | âmbar |
| `Apoio solicitado` | líder vendo pedido enviado ao supervisor | roxo/lilás discreto |
| `Pedido de apoio` | supervisor vendo pedido recebido | roxo/lilás discreto |
| `Urgente` | severidade real `URGENT` | vermelho |
| `Caso pastoral` | pastor vendo sinal encaminhado ao pastor/admin | vermelho |
| `Encaminhado` | líder/supervisor vendo envio ao pastor | vermelho |
| `Em cuidado` | pessoa que recebeu cuidado e deve continuar no radar | azul/care |
| `Cuidado realizado` | contato/cuidado registrado | azul/care |
| `Informativo` | sinal `INFO`, quando exibido | informativo/neutro |

Não rebaixar `Urgente` para `Em atenção` em outra tela. O contexto pode mudar a mensagem de escalonamento, mas a severidade continua sendo severidade.

## CTAs oficiais

| Contexto | CTA preferencial |
| --- | --- |
| Lista de pessoas/casos | `Abrir pessoa` |
| Pedido recebido pelo supervisor | `Abrir apoio` |
| Detalhe da pessoa | `Ligar`, `WhatsApp`, `Já houve contato?` |
| Célula | `Abrir célula` |
| Evento | `Registrar presença` ou `Ver resumo` |

Evite usar `Abrir cuidado` em lista, porque sugere um módulo formal de acompanhamento. O cuidado acontece no detalhe da pessoa.

## Mapeamento técnico -> UI

| Técnico | UI preferida | Observação |
| --- | --- | --- |
| `CareSignal` | atenção / pessoa em atenção | sinal sustenta a atenção |
| `CareTouch` | contato feito / cuidado realizado | registro mínimo após ação |
| `Event` | evento / encontro | não virar calendário amplo |
| `Attendance` | presença | fonte pastoral, não fiscalização |
| `assignedToId` | apoio/encaminhamento | escalonamento mínimo |
| dashboard | visão | evitar linguagem executiva pesada |
