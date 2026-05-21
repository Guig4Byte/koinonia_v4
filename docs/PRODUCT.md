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
- recuperação de senha;
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

Radar do líder. Mostra pessoas no radar da própria célula e o encontro relevante. A lista completa fica em `Membros`.

### `/pessoas`

Superfície de `Membros` para líder. Mostra busca, filtros e lista por prioridade pastoral: pessoas no radar primeiro, ativos depois. Pastor/admin são direcionados para `/equipe`; supervisores são direcionados para `/celulas`.

### `/supervisor`

Mostra pedidos de apoio, células acompanhadas, presença recente e casos relevantes sob supervisão.

### `/celulas`

Superfície do supervisor para células por prioridade pastoral, presença e estabilidade.

### `/pastor`

Mostra saúde geral, casos graves/encaminhados e busca de pessoa. Não lista toda atenção comum como fila padrão.

### `/equipe`

Superfície do pastor/admin para supervisores, células, exceções e cadastro mínimo de célula. Não deve virar organograma pesado.

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

## Prioridade do Dia

As homes de líder, supervisor e pastor podem exibir uma única próxima ação pastoral logo após o pulso/radar. Essa superfície não cria uma tarefa nova; ela apenas aponta o caminho mais seguro quando já existe um dado prioritário.

Ordem de prioridade recomendada:

1. urgente ou encaminhado;
2. pedido de apoio;
3. atenção comum;
4. pessoa em cuidado ativo;
5. estabilidade, quando não houver pendência.

A ação deve levar para a lista ou detalhe apropriado e usar verbo específico, como `Acompanhar pessoa`, `Ver pedido` ou `Ver células em atenção`.

## Seções Pastorais

As telas principais organizam pessoas por intenção pastoral.

| Seção | Conteúdo | Propósito |
| --- | --- | --- |
| `Irmãos que precisam de um olhar especial` | sinais urgentes ou encaminhados ao cuidado pastoral | mostrar o que pede cuidado agora |
| `Pedidos de apoio` | pedido de apoio da supervisão | separar apoio da atenção comum |
| `Acompanhar de perto` | atenção local comum | lembrar contato cotidiano |
| `Acolhidos em cuidado` | pessoa em `Em cuidado` sem sinal mais prioritário | manter cuidado recente no radar |

Regras:

- manter uma única prioridade acima das seções quando houver muitos sinais competindo;
- mostrar poucos registros por seção;
- usar `Ver mais` quando houver excedente;
- evitar duplicar a mesma pessoa na mesma superfície;
- manter busca de pessoa para consulta explícita;
- usar CTAs específicos por intenção, evitando `Abrir` quando a ação puder ser mais clara.
- não criar fila, SLA ou tarefa a partir dessas seções.

## Contato, Apoio E Cuidado

Fluxo base:

```txt
Pessoa em atenção -> Abrir pessoa -> Já houve contato? -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Ligar` e `WhatsApp` são atalhos, não categorias administrativas do histórico;
- `Já houve contato?` exige confirmação;
- contato confirmado aparece como `Contato feito`, com anotação opcional;
- `Salvar sem anotação` é válido;
- pedir apoio ou encaminhar pode registrar contexto breve e opcional;
- para líder, pedir apoio à supervisão é o caminho comum;
- encaminhar direto ao pastor fica para gravidade ou sensibilidade;
- anotação de apoio/encaminhamento aparece em `Cuidado recente`, mas não resolve o sinal sozinha;
- cuidado resolve sinais ativos dentro do escopo do usuário;
- se resolver todos os sinais ativos, a pessoa fica `Em cuidado`;
- a pessoa só volta para `Ativo` por ação explícita.

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
