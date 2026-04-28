# Glossário — Koinonia Lite

Este documento é a fonte oficial do vocabulário do MVP atual.

Ele define o significado dos termos para evitar que o produto misture linguagem pastoral, nomes técnicos e fluxos futuros antes da hora.

Para escopo e fluxos, consulte `docs/PRODUCT.md`. Para implementação técnica, consulte `docs/ARCHITECTURE.md`.

## Regra principal

Na interface, use a palavra mais pastoral, simples e útil para quem está cuidando de pessoas.

No código, use nomes técnicos quando necessário, mas sem mudar o significado do domínio.

Pergunta de corte para criar ou trocar termos:

```txt
Esse termo ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajudar, simplifique.

## Termos oficiais

### Pessoa

Centro operacional do Koinonia.

Uma pessoa não é lead, contato comercial, métrica ou linha de relatório. É alguém que participa, visita, se afasta, retorna, precisa de contato ou precisa ser lembrado.

Use na UI:

- `Pessoa`
- `Pessoas`
- `Membros`, quando o líder estiver olhando a própria célula
- `Quem precisa de cuidado`

Evite:

- `Lead`
- `Cliente`
- `Usuário final`

### Célula / grupo

Comunidade local onde presença, vínculo e cuidado acontecem de forma próxima.

No MVP atual, `célula` é o termo preferencial de produto. `grupo` pode aparecer em código, banco ou abstrações técnicas.

Use na UI:

- `Célula`
- `Minha célula`
- `Células acompanhadas`

### Evento

Encontro real que gera presença.

No MVP atual, evento existe principalmente para reunião de célula. Ele não deve virar calendário completo antes do fluxo principal estar validado.

Use na UI:

- `Evento`
- `Encontro`
- `Reunião da célula`

Evite:

- linguagem de agenda corporativa quando o contexto for pastoral e simples.

### Presença

Registro de quem esteve, faltou ou justificou ausência em um evento.

Presença não é fiscalização. É uma fonte simples para perceber cuidado necessário.

Use na UI:

- `Presença`
- `Presença da semana`, quando o recorte for a semana atual e somente encontros já registrados
- `Presença recente`, quando o recorte for os últimos encontros registrados
- `Registrar presença`
- `Ver resumo`

Evite:

- `Controle de presença`
- `Fiscalização`
- linguagem de cobrança.

### Sinal

Evidência gerada pelo sistema a partir de dados simples.

Exemplos:

- duas faltas seguidas;
- queda recente de presença;
- visitante que precisa de acolhimento;
- pessoa sem contato recente.

No código atual, isso pode aparecer como `CareSignal`.

Regra oficial:

```txt
Sinal não é tarefa.
```

Sinal é evidência e lembrete de cuidado. Não é task, cobrança, SLA ou experiência principal da pessoa usuária.

Se o cuidado já aconteceu fora do sistema, a UI deve permitir registrar isso e fechar a atenção com pouco atrito, mas nunca por clique acidental. `Já houve contato?` deve funcionar como pergunta/entrada de confirmação.

### Atenção

Forma pastoral e visível de apresentar um sinal para o usuário.

Exemplo:

```txt
João está pedindo atenção.
Duas ausências seguidas na célula Esperança.
```

Use na UI:

- `Atenção`
- `Pessoas em atenção`
- `Células em atenção`
- `Pede atenção`

Evite:

- `Alerta`
- `Risco crítico`
- `Incidente`
- `Pendência`, quando soar burocrático.

### Contato

Ação concreta de aproximação.

Exemplos:

- ligar;
- chamar no WhatsApp;
- conversar pessoalmente;
- registrar que tentou contato.

Contato não é formulário. Primeiro vem a ação humana, depois o registro mínimo.

Nas listas de atenção, use apenas a ação primária `Abrir cuidado`. As ações abaixo pertencem ao detalhe da pessoa, onde há mais contexto para agir sem poluir a lista.

Use na UI:

- `Ligar`
- `WhatsApp`
- `Já houve contato?`
- `Sim, houve contato`
- `Ainda não consegui contato`
- `Cancelar e não registrar agora`

### Cuidado

Registro mínimo de que alguém foi percebido e alguém agiu.

No MVP atual, cuidado não é prontuário pastoral completo. Deve apenas impedir que a pessoa desapareça em silêncio.

Use na UI:

- `Cuidado`
- `Registrar cuidado`
- `Cuidado registrado`
- `Anotar cuidado`
- `Salvar sem anotação`

Evite:

- `Task`
- `Workflow`
- `SLA`
- `Chamado`

### Acompanhamento

Fluxo organizado de continuidade para casos que precisam de mais do que um contato simples.

Importante: acompanhamento é direção futura. No MVP Lite atual, não antecipar acompanhamento como task manager, kanban, SLA ou fila complexa.

Quando aparecer futuramente, acompanhamento deve significar continuidade pastoral, não burocracia.

### Visão

Leitura curta e orientada à ação.

Use `visão` em vez de `dashboard` quando estiver falando com o usuário.

A visão deve responder:

```txt
Quem precisa de cuidado agora?
```

### Dashboard / BI / Analytics

Termos aceitáveis em documentação técnica ou visão futura, mas não devem governar a UI do MVP atual.

No MVP Lite, evite transformar a tela inicial em painel executivo.

## Mapeamento rápido

| Conceito técnico | Linguagem de UI preferida | Observação |
|---|---|---|
| `CareSignal` | Atenção / pessoa em atenção | O sinal sustenta a atenção. |
| `CareTouch` | Contato feito / cuidado registrado | O registro vem depois da ação humana. |
| `Event` | Evento / reunião de célula | Não virar calendário amplo cedo demais. |
| `Attendance` | Presença | Fonte pastoral, não fiscalização. |
| Dashboard | Visão | Menos painel, mais leitura. |
| Task/SLA | Fora do MVP atual | Não transformar sinal em cobrança ou fila. |
