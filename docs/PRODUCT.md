# Produto — Koinonia Lite

Este documento é a fonte oficial do MVP atual: visão, escopo, perfis e fluxos de produto.

Para vocabulário, consulte `docs/GLOSSARY.md`. Para implementação técnica, consulte `docs/ARCHITECTURE.md`. Para entrada rápida de agentes, consulte `docs/AGENT_BRIEFING.md`.

## Visão

O Koinonia Lite é um sistema pastoral mobile-first para células/grupos.

Ele não existe para transformar cuidado em burocracia. Ele existe para ajudar liderança pastoral a perceber, lembrar e agir quando uma pessoa pode estar se afastando.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O produto deve parecer uma ajuda para cuidar, não uma cobrança para documentar.

## Princípio de produto

A pergunta central do MVP é:

```txt
Quem precisa de cuidado agora?
```

Tudo que entra no MVP precisa ajudar a responder essa pergunta com menos esforço.

Regra de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Ciclo central do MVP

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

- **Evento** existe para registrar um encontro real da célula.
- **Presença** existe para revelar sinais pastorais.
- **Atenção** existe para trazer uma pessoa à consciência do líder, supervisor ou pastor.
- **Contato** existe para estimular ação real: ligar, WhatsApp ou conversa.
- **Cuidado** existe para impedir que alguém desapareça em silêncio.

A presença não é fiscalização. Ela é uma fonte simples para perceber cuidado necessário.

## Escopo do MVP atual

Inclui:

- pessoas;
- células/grupos;
- eventos de célula;
- check-in simples;
- taxa de presença;
- visitantes no check-in;
- atenções pastorais por nível de responsabilidade;
- busca simples de pessoa;
- detalhe simples da pessoa;
- tela de pessoas/membros respeitando o escopo do perfil;
- detalhe simples da célula;
- abertura de cuidado a partir das listas de atenção;
- ação direta no detalhe da pessoa: ligar, WhatsApp, contato feito e anotação opcional;
- visão macro do pastor, centrada em saúde geral e casos graves/escalados;
- visão de apoio do supervisor;
- visão operacional do líder.

Não inclui agora:

- analytics avançado;
- BI;
- mapas;
- QR Code;
- geolocalização;
- notificações;
- playbooks;
- SLA;
- task manager complexo;
- acompanhamento formal;
- CRM pastoral pesado;
- área rica do membro;
- formulários longos;
- calendário amplo de igreja.

`Acompanhamento` é uma direção futura para casos que exigirem continuidade. No MVP Lite atual, não deve ser antecipado como task manager, kanban, SLA ou fila complexa.

## Perfis e responsabilidades

Regra norteadora:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Regra complementar de visibilidade:

```txt
Líder resolve a atenção local.
Supervisor apoia exceções e padrões.
Pastor vê saúde geral, casos graves/escalados e busca qualquer pessoa quando precisar.
```

Nem toda atenção deve subir para o pastor. A maior parte dos sinais cotidianos deve ser resolvida pelo líder ou pelo supervisor, sem transformar o pastor em central operacional de ausências, visitantes, retornos simples ou contatos comuns.

### Camadas de atenção

Use três camadas conceituais para decidir quem precisa ver o quê:

| Camada | Quem vê por padrão | Quando aparece |
| --- | --- | --- |
| Atenção local | Líder | ausência comum, visitante novo, retorno simples, contato cotidiano ou pessoa da própria célula que precisa ser lembrada. |
| Apoio de supervisão | Supervisor e líder | líder pediu ajuda, célula acumula sinais, presença caiu, sinais ficam sem cuidado ou há padrão recorrente sob a supervisão. |
| Cuidado pastoral | Pastor, supervisor e, quando fizer sentido, líder | caso grave, sensível, recorrente, escalado ou que exige leitura pastoral mais próxima. |

Escalonamento desejado:

```txt
Líder -> Supervisor -> Pastor
```

Em casos graves ou sensíveis, o produto pode permitir:

```txt
Líder -> Pastor
```

Escalonar não deve criar task manager, SLA ou processo pesado. É uma decisão de visibilidade e apoio: quem estava cuidando localmente continua sendo referência, mas outra liderança passa a enxergar o caso.

### Líder

O líder é operacional.

Pode:

- ver sua célula;
- abrir resumo simples da própria célula;
- ver seus eventos;
- registrar check-in dos eventos da própria célula;
- adicionar visitantes;
- ver membros da própria célula;
- ver pessoas em atenção da própria célula;
- abrir a tela `Membros` com a lista simples dos membros da própria célula;
- abrir o cuidado dos membros em atenção;
- no detalhe da pessoa, ligar, chamar no WhatsApp e registrar contato.

Não deve:

- ver visão macro da igreja;
- registrar check-in de outra célula;
- operar presença no lugar de outro líder.

### Supervisor

O supervisor acompanha e apoia.

Pode:

- ver células sob sua supervisão;
- abrir resumo simples das células sob sua supervisão;
- ver eventos dessas células em modo resumo;
- ver check-ins pendentes/realizados;
- ver presença média, visitantes e atenções sob sua supervisão;
- perceber líderes ou células que precisam de apoio;
- receber pedidos de apoio do líder;
- escalar ao pastor quando houver gravidade, recorrência ou necessidade pastoral.

Não deve:

- registrar check-in;
- operar presença no lugar do líder;
- ver dados fora do seu escopo.

### Pastor

O pastor interpreta a visão macro e entra nos casos que realmente pedem cuidado pastoral mais próximo.

Pode:

- ver eventos da igreja/campus em modo resumo;
- ver presença geral da semana e presença recente por célula/região;
- ver células com queda, pendência de check-in ou acúmulo de atenção;
- abrir resumo simples de uma célula;
- ver casos graves, sensíveis, recorrentes ou escalados;
- receber casos escalados pelo supervisor ou, quando for grave, pelo líder;
- buscar qualquer pessoa da igreja/campus quando precisar consultar alguém específico;
- perceber regiões, células ou líderes que precisam de cuidado.

Não deve:

- registrar check-in;
- operar presença no lugar do líder;
- receber toda ausência, visitante, retorno ou sinal cotidiano por padrão;
- transformar visão macro em relatório burocrático;
- virar a central de tickets pastorais da igreja.

## Fluxo de check-in

Check-in é exclusivo do líder da célula.

Fluxo desejado:

```txt
Evento da célula
-> abrir check-in
-> escolher o encontro relevante
-> marcar cada membro ativo como presente, ausente ou justificou
-> adicionar visitante, se houver
-> finalizar presença somente quando ninguém estiver pendente
-> atualizar taxa
-> gerar atenções quando fizer sentido
```

Regras de produto:

- evento de hoje pendente tem prioridade na visão do líder;
- depois vem o próximo evento pendente;
- depois vem o último evento realizado;
- pastor e supervisor veem resumo somente leitura;
- evento já concluído pode ser ajustado pelo líder da célula;
- ajuste de evento concluído deve parecer correção de presença, não novo check-in;
- visitante registrado aparece no resumo e no ajuste, sem virar membro automaticamente;
- visitante duplicado no mesmo evento deve ser bloqueado por nome normalizado;
- pessoa sem marcação explícita aparece como `Pendente`, nunca como ausência presumida.


## Métricas de presença

As métricas de presença devem explicar o recorte para não parecerem número absoluto de toda a igreja.

Regras oficiais:

- `Presença da semana`, na visão do pastor, considera somente encontros de célula da semana atual que já têm presença registrada;
- células com encontro pendente não entram na porcentagem da semana; elas aparecem separadamente como `Células pendentes`;
- visitantes não entram no denominador da porcentagem de presença;
- quando não houver encontro registrado no recorte, a UI deve mostrar ausência de dado (`—` ou texto equivalente), não `0%` como se fosse baixa presença;
- `Presença recente`, nas visões de líder, supervisor e célula, resume os últimos encontros registrados dentro do escopo visível.

O objetivo da métrica é dar contexto pastoral rápido, não criar ranking nem cobrança.

## Detalhe simples da célula

O detalhe da célula existe para dar destino aos cards de célula sem criar gestão pesada.

Ele deve responder rapidamente:

```txt
Como esta célula está e quem precisa ser lembrado nela?
```

Deve mostrar apenas:

- líder e supervisor;
- horário/local, quando houver;
- membros ativos;
- presença recente;
- pessoas em atenção;
- encontro pendente;
- últimos encontros registrados.

Não deve virar área administrativa completa da célula. Não deve incluir cadastro rico, relatórios longos, ranking de líderes, gráficos complexos ou histórico profundo.

## Tela Pessoas / Membros

A rota `/pessoas` é uma leitura por escopo, não um diretório amplo para todos os perfis.

Regras oficiais:

- o líder vê pessoas em atenção da própria célula e pode listar membros ativos não visitantes da própria célula;
- para o líder, a navegação pode chamar essa tela de `Membros`, porque o escopo é pequeno e operacional;
- o supervisor vê exceções, pedidos de apoio e pessoas em atenção dentro das células sob sua supervisão;
- o pastor não deve receber uma lista bruta de todas as pessoas em atenção da igreja por padrão; deve ver somente casos graves, sensíveis, recorrentes ou escalados;
- para supervisor e pastor, a tela não deve virar lista completa de todos os membros por padrão; essas pessoas devem ser consultadas pela busca quando necessário;
- ações diretas de contato continuam no detalhe da pessoa, não na lista.

Isso preserva a diferença de responsabilidade: líder opera a própria célula, supervisor acompanha exceções e pastor interpreta a visão macro sem virar operador de sinais.

## Sinais e atenções

```txt
Sinal não é tarefa.
```

Sinal é evidência e lembrete de cuidado, não cobrança burocrática. Ele pode aparecer depois de o líder já ter ligado, mandado mensagem ou conversado com a pessoa fora do sistema.

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Listas chamadas de `Pessoas em atenção` devem agregar sinais ativos por pessoa. Na UI, esses sinais devem aparecer como motivos de atenção. A experiência principal é a pessoa que precisa ser lembrada, não uma pilha de sinais.

A visibilidade da atenção deve respeitar a responsabilidade do perfil:

- líder vê atenção local da própria célula;
- supervisor vê exceções e padrões dentro das células supervisionadas;
- pastor vê saúde geral e somente atenções graves, sensíveis, recorrentes ou escaladas.

Um sinal comum não deve aparecer para o pastor apenas porque existe. Ele precisa ter gravidade, recorrência, sensibilidade pastoral ou escalonamento explícito.

Depois de salvar check-in, a UI pode informar quantas pessoas ficaram em atenção naquela célula, para fechar o ciclo:

```txt
presença salva -> pessoas em atenção -> cuidado
```

## Fluxo de contato e cuidado

A saída simples para uma atenção é:

```txt
Já houve contato? -> confirmar -> anotar se precisar -> fechar atenção
```

Nas listas de atenção, o fluxo correto é abrir o cuidado da pessoa primeiro:

```txt
Pessoa em atenção -> Abrir cuidado -> detalhe da pessoa
```

No detalhe da pessoa, o fluxo de contato é:

```txt
[Ligar] [WhatsApp]
[Já houve contato?]
        ↓
O contato/cuidado aconteceu?
        ↓
[Sim, houve contato] [Ainda não ou Cancelar]
        ↓
Quer anotar algo?
        ↓
[Anotar] [Salvar sem anotação] [Cancelar]
```

Regras de produto:

- `Ligar` abre telefone.
- `WhatsApp` abre conversa.
- `Já houve contato?` é pergunta, não ação destrutiva imediata.
- Nenhum clique acidental deve resolver atenção sem confirmação explícita.
- `Sim, houve contato` ou `Sim, já houve` apenas avança para a decisão de anotação.
- `Salvar sem anotação` registra contato/cuidado e resolve os motivos de atenção ativos dentro do escopo do usuário.
- `Anotar` salva observação junto com o contato/cuidado e resolve os motivos de atenção ativos dentro do escopo do usuário.
- Se todos os motivos de atenção da pessoa forem resolvidos, a pessoa volta ao status pastoral simples `Ativo`; o cuidado aparece no histórico recente como `Cuidado realizado`.
- Um check-in posterior não deve reabrir automaticamente o mesmo motivo de atenção se a evidência de presença não mudou depois do cuidado. Só uma nova evidência posterior ao cuidado deve abrir nova atenção.
- `Ainda não`, `Cancelar` ou `Cancelar e não registrar agora` não registram contato e não fecham atenção.
- Anotação é apoio, não ação principal antes do cuidado.
- A UI deve dizer quantos motivos de atenção foram resolvidos, sem transformar isso em acompanhamento ou tarefa.

Quando a presença ou o cuidado não sustentarem mais nenhum motivo de atenção ativo, a pessoa deve voltar a aparecer como `Ativo`. O status pastoral visível deve acompanhar os motivos ativos, mas a severidade continua pertencendo ao sinal (`Em atenção` ou `Urgente`), não ao cadastro da pessoa.

## Detalhe simples da pessoa

A tela `/pessoas/[personId]` existe para responder rapidamente:

```txt
Por que esta pessoa merece atenção e qual é o próximo gesto de cuidado?
```

Ela deve mostrar somente o necessário para agir:

- pessoa, célula e líder;
- status pastoral simples;
- nota curta, quando existir;
- ações diretas de cuidado;
- motivos de atenção e evidência;
- última presença registrada;
- cuidado recente.

Ela não deve virar prontuário, CRM completo, timeline infinita ou formulário longo. A busca e os cards de atenção devem levar direto para essa tela quando o usuário precisar de contexto.

## Busca

A busca atual é busca de pessoa.

Regras:

- não prometer busca de evento ou célula enquanto a API não suportar esses tipos;
- resultados devem mostrar apenas contexto/célula dentro do escopo visível do usuário;
- pastor pode buscar qualquer pessoa da igreja/campus quando precisar, mas isso não transforma a tela em diretório completo por padrão;
- supervisor busca apenas dentro do próprio escopo;
- líder busca apenas dentro do próprio escopo;
- resultado de pessoa deve levar direto para `/pessoas/[personId]`.

## Linguagem e experiência

A UI deve usar linguagem pastoral, curta e concreta.

Preferir:

- `Em atenção`;
- `Urgente`;
- `Cuidado realizado`;
- `visão`;
- `pessoas`;
- `presença`;
- `contato feito`.

Tons visuais de status:

- `Em atenção` usa tom âmbar/alaranjado; indica cuidado necessário, não urgência extrema.
- `Urgente` usa tom vermelho; fica reservado para severidade real.
- `Cuidado realizado` usa tom azulado; indica ação registrada, sem competir com o verde de `Ativo`/presença.

Evitar na UI:

- `alerta`;
- `task`;
- `SLA`;
- `dashboard`;
- `lead`;
- `funil`;
- `workflow`.

A experiência deve ser mobile-first, com poucos elementos por tela, ação clara e baixo custo cognitivo. O sistema deve ajudar o usuário a agir, não fazê-lo administrar o sistema.

## Direção futura sem antecipar escopo

O produto pode crescer para acompanhamento formal, autenticação real, área de membro, relatórios ou recursos mais amplos. Mas isso só deve acontecer depois que o ciclo central estiver validado e útil.

A prioridade atual é deixar excelente o fluxo:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```
