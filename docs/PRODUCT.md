# Produto — Koinonia Lite

Este documento define o comportamento esperado do MVP atual: visão, escopo, papéis, superfícies e fluxos. Para vocabulário, use `GLOSSARY.md`. Para implementação, use `ARCHITECTURE.md`. Para UI visual, use `FRONTEND.md`.

## Visão

Koinonia Lite é um radar pastoral mobile-first para células. Ele ajuda liderança a perceber, lembrar e agir quando uma pessoa pode estar se afastando.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

Pergunta central:

```txt
Quem precisa de cuidado agora?
```

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

## Ciclo E Papéis

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Escopo Atual

### Login

O login deve permanecer curto e pastoral. A recuperação pública de senha não faz parte do MVP, mas a tela pode orientar o usuário a procurar a liderança responsável pelo acesso. O envio do formulário deve comunicar estado de carregamento para evitar toque repetido, e erros de credenciais devem ser associados aos campos e desaparecer quando o usuário voltar a digitar.


Inclui:

- autenticação por e-mail e senha;
- sessão em cookie assinado;
- tema e tamanho de texto como preferências locais do aparelho;
- pessoas, células, membros e encontros de célula;
- liderança e supervisão múltiplas por célula;
- cadastro/edição mínima de célula pelo pastor/admin;
- agenda padrão da célula e geração automática de encontros futuros;
- local específico por encontro;
- remarcação, cancelamento e marcação de `Não houve encontro` pelo líder;
- check-in do líder, com visitantes;
- resumo antes de ajuste de presença;
- consultas de encontros por pendência e histórico;
- métricas de presença que distinguem dado real de ausência de registro;
- sinais por pessoa;
- pedido de apoio à supervisão;
- encaminhamento pastoral;
- contato/cuidado com anotação opcional;
- busca de pessoa;
- visões por papel e detalhe de pessoa, célula e encontro.

Não inclui:

- cadastro público;
- recuperação pública de senha;
- gestão avançada de usuários;
- cadastro completo de pessoas, membros, responsáveis ou usuários;
- importação em massa de planilhas;
- acompanhamento formal;
- CRM pesado;
- task manager, kanban, fila ou SLA;
- BI avançado;
- mapas, QR Code ou geolocalização;
- notificações;
- área rica do membro;
- calendário amplo de igreja;
- formulários longos.

## Papéis

### Líder

Vê a própria célula, registra e ajusta presença dos encontros da própria célula, adiciona visitantes no check-in, vê membros ativos, vê pessoas em atenção, pede apoio da supervisão, encaminha ao pastor quando houver gravidade/sensibilidade, registra contato/cuidado e ajusta detalhes operacionais de encontros da própria célula.

Não registra check-in de outra célula, não registra check-in futuro e não opera visão macro.

### Supervisor

Vê células sob sua supervisão, presença, encontros, atenções, pedidos de apoio, exceções, acúmulos e recorrências. Pode encaminhar ao pastor quando houver gravidade ou necessidade pastoral.

Não registra/ajusta presença pelo líder, não cancela/remarca encontro e não altera local operacional.

### Pastor/Admin

Vê saúde geral, equipe, presença por célula, células sem presença recente ou com presença baixa registrada, casos graves/urgentes/encaminhados e pessoas consultadas por busca. Pode abrir células para contexto local e cadastrar/editar dados básicos de célula.

Não registra check-in, não opera encontros das células e não recebe toda atenção comum como fila inicial.

## Visibilidade

Há diferença entre poder acessar e receber por padrão.

- Pastor/admin têm escopo amplo para busca e leitura autorizada, mas a visão inicial prioriza saúde geral e casos pastorais.
- Atenção local aparece para pastor/admin quando há contexto explícito, como pessoa ou célula aberta.
- Supervisor vê o escopo supervisionado.
- Líder vê a própria célula.
- Grupo inativo não entra nas superfícies padrão, encontros, check-in ou histórico visível.

```txt
Visão inicial do pastor = saúde geral + casos pastorais.
Detalhe de célula = contexto local autorizado.
Busca = consulta explícita de pessoa dentro do escopo.
```

## Navegação E Superfícies

| Papel | Visão | Superfície estrutural | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

A UI usa `Encontros`. Rotas e entidades técnicas continuam usando `eventos`/`Event`.

### `/lider`

Radar do líder. Mostra pessoas da própria célula separadas por intenção pastoral: urgência, apoio solicitado, atenção percebida e membros em cuidado. O encontro relevante aparece abaixo da leitura pastoral. A lista completa fica em `Membros`.

### `/pessoas`

Superfície de `Membros` para líder. Mostra busca, filtros e lista por prioridade pastoral: sinais e membros em cuidado primeiro, ativos depois. Pastor/admin são direcionados para `/equipe`; supervisores são direcionados para `/celulas`.

### `/supervisor`

Mostra pedidos de apoio, células acompanhadas, presença recente e casos relevantes sob supervisão.

### `/celulas`

Superfície do supervisor para células por prioridade pastoral, presença e estabilidade. No filtro `Todas`, o card da célula mostra o recorte mais prioritário; o detalhe da célula mostra os demais sinais, presença, membros em cuidado e ativos.

### `/pastor`

Mostra saúde geral, casos graves/encaminhados e busca de pessoa. Não lista toda atenção comum como fila padrão.

### `/equipe`

Superfície do pastor/admin para supervisores, células, exceções e cadastro mínimo de célula. No filtro `Todos`, a célula também mostra a prioridade principal, com contexto suficiente para entender que outros sinais podem aparecer no detalhe. Não deve virar organograma pesado.

### `/eventos`

Lista encontros dentro do escopo visível. A tela padrão mostra consultas rápidas (`Pendências` e `Histórico`), encontros de hoje e próximos encontros da semana.

Consultas:

- `consulta=sem-presenca`: encontros passados sem presença registrada, com períodos `semana` e `30d`;
- `consulta=historico`: encontros com presença registrada, com períodos `semana`, `semana-passada` e `30d`.

## Responsabilidades De Célula

A célula pode ter mais de uma pessoa na liderança ou supervisão. As responsabilidades ativas definem escopo atual.

Na UI, use:

```txt
Liderança: Bruno e Camila
Supervisão: Ana e Pedro
```

Produto não deve assumir que liderança ou supervisão é sempre uma pessoa só.

## Agenda E Encontros

A célula pode ter dia, horário e local padrão. O sistema usa essa agenda para garantir encontros futuros; o líder não precisa criar o encontro toda semana.

Cada encontro tem local próprio. Quando gerado automaticamente, começa com o local padrão da célula, mas pode ser ajustado para aquela ocorrência.

Quando a célula se reuniu e a presença ficou para lançar depois, a liderança pode usar `Registrar encontro anterior`. Esse fluxo cria um encontro passado pendente de presença, com data, horário e local opcional, sem gerar histórico amplo automaticamente e sem transformar ausência de check-in em presença real.

| Situação | Leitura | Ações do líder |
| --- | --- | --- |
| Futuro | `Agendado` | ajustar local, remarcar, cancelar |
| Já começou/passado sem presença | `Presença pendente` | registrar presença, ajustar local, marcar `Não houve encontro` |
| Presença registrada | `Presença registrada` | ver resumo, ajustar presença, ajustar local |
| Cancelado antes do horário | `Cancelado` | marcar que houve encontro |
| Não realizado depois do horário | `Não houve encontro` | marcar que houve encontro |

Pastor/supervisor veem estado e resumo, mas não executam ações operacionais.

## Check-In

Check-in é exclusivo do líder da célula.

Regras:

- evento futuro não é acionável para check-in;
- presença pendente só aparece quando o encontro já começou;
- presença registrada abre resumo primeiro;
- ajuste de presença é escolha explícita;
- pessoa sem marcação explícita fica `Pendente`;
- visitante não vira membro automaticamente;
- visitante duplicado no mesmo encontro deve ser bloqueado por nome normalizado;
- `Marcar todos como presentes` confirma antes de sobrescrever ausências/justificativas.

No modo de registro/ajuste, a tela usa header compacto, oculta a navegação inferior, mostra uma barra fixa de salvar, protege saída com alterações não salvas e permite revisar membros por status de presença. Formulários de criação/edição, como nova/editar célula, também ocultam a navegação inferior para reduzir saída acidental e manter foco na ação principal.

## Métricas De Presença

A métrica dá contexto pastoral, não ranking.

- Visitantes não entram no denominador.
- Sem dado aparece como `—`, `Sem registro` ou equivalente.
- `0%` só aparece quando há dado real.
- Célula sem check-in recente entra como `Sem presença recente` ou `Sem registro`, não como risco automático.
- Histórico de pessoa mostra últimos encontros registrados e tendência apenas quando há base suficiente.

## Pulso E Primeiro Cuidado

As homes começam com uma leitura curta do momento. Essa leitura não cria tarefa nova; ela reduz ansiedade e orienta o primeiro olhar.

Uso atual:

- líder: pulso pastoral, seções compactas de pessoas e encontro relevante;
- supervisor: pulso pastoral e painel com primeiro cuidado da supervisão;
- pastor/admin: radar pastoral, próxima ação quando houver prioridade clara, busca e saúde das células.

Ordem de prioridade recomendada:

1. urgente ou encaminhado;
2. pedido de apoio;
3. atenção comum;
4. pessoa em cuidado ativo;
5. estabilidade, quando não houver pendência.

Quando houver CTA, ele deve levar para a lista ou detalhe apropriado e usar verbo específico, como `Acompanhar pessoa`, `Ver pedido`, `Revisar presença` ou `Ver células em atenção`.

## Orientação pastoral em detalhes

Telas de detalhe devem ajudar a interpretar o contexto sem transformar todo diagnóstico em tarefa. No detalhe de célula, o usuário já encontra prioridades por pulso, filtros, membros e encontros; por isso, não há card extra de próxima ação.

No detalhe de encontro com presença registrada, ausentes, justificativas e pendentes aparecem antes dos presentes, mas a ausência isolada não deve ser tratada automaticamente como problema. Use uma mensagem de leitura pastoral calma, sem CTA obrigatório, para lembrar que o contexto vem antes de qualquer encaminhamento.

## Seções Pastorais

As telas principais organizam pessoas por intenção pastoral.

| Seção | Conteúdo | Propósito |
| --- | --- | --- |
| Urgência/caso pastoral | sinais urgentes ou encaminhados ao cuidado pastoral | mostrar o que pede cuidado agora |
| Apoio solicitado | pedido de apoio da supervisão | separar apoio da atenção comum |
| Atenção percebida | atenção local comum | lembrar contato cotidiano |
| Em cuidado | pessoa em `Em cuidado` sem sinal mais prioritário | manter cuidado já iniciado no radar |

Regras:

- manter uma única prioridade acima das seções quando houver muitos sinais competindo;
- mostrar poucos registros por seção;
- usar `Ver mais` quando houver excedente;
- evitar duplicar a mesma pessoa na mesma superfície;
- não repetir no subtítulo o mesmo status que já aparece no chip do card;
- manter busca de pessoa para consulta explícita;
- usar CTAs específicos por intenção, evitando `Abrir` quando a ação puder ser mais clara;
- não criar fila, SLA ou tarefa a partir dessas seções.

## Contato, Apoio E Cuidado

Fluxo base:

```txt
Pessoa em atenção -> Abrir pessoa -> Guardar contato pastoral -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Ligar` e `WhatsApp` são atalhos, não categorias administrativas do histórico;
- `Guardar contato pastoral` e `Guardar cuidado` exigem confirmação;
- contato confirmado aparece no histórico como ligação, WhatsApp ou cuidado registrado, com anotação opcional;
- `Salvar sem anotação` é válido;
- pedir apoio ou encaminhar pode registrar contexto breve e opcional;
- para o líder, a supervisão está disponível como apoio quando ajudar no discernimento;
- encaminhar ao pastor fica para situações que pedem um olhar pastoral mais próximo ou envolvem algo sensível;
- anotação de apoio/encaminhamento aparece em `Histórico de cuidado`, mas não resolve o sinal sozinha;
- cuidado resolve sinais ativos dentro do escopo do usuário;
- se resolver todos os sinais ativos, a pessoa fica `Em cuidado`;
- a pessoa só volta para `Ativo` por ação explícita.


### Detalhe da pessoa

O detalhe da pessoa deve ajudar o usuário a decidir com segurança antes de registrar algo. A ordem recomendada é:

1. identificação e status efetivo;
2. próximo cuidado: status, contexto pastoral e próximo gesto;
3. motivo da atenção, quando houver;
4. ritmo de presença;
5. histórico de cuidado em linha do tempo;
6. contexto das células visíveis.

`Guardar contato pastoral` substitui rótulos ambíguos em formato de pergunta. A ação continua exigindo confirmação e só deve salvar quando houve contato real, conversa ou anotação pastoral relevante.

## Busca

A busca atual é busca de pessoa.

- Pastor/admin buscam pessoas dentro da igreja.
- Supervisor busca dentro do escopo supervisionado.
- Líder busca dentro da própria célula.
- Resultado leva para `/pessoas/[personId]`.
- Resultado usa status efetivo, não apenas status persistido.
- Não prometa busca ampla de evento/célula enquanto a API não suportar.

## Tema E Tamanho Do Texto

Tema e tamanho do texto são preferências visuais locais do aparelho. Eles não mudam permissão, escopo ou dado pastoral.

Temas:

- `Claro`;
- `Pergaminho`;
- `Escuro`.

Tamanhos de texto:

- `Normal`;
- `Grande`;
- `Muito grande`.
