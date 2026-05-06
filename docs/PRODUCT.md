# Produto — Koinonia Lite

Este documento define **o comportamento esperado do MVP atual**: visão, escopo, papéis, superfícies e fluxos. Para vocabulário, use `GLOSSARY.md`. Para implementação, use `ARCHITECTURE.md`.

## Visão

Koinonia Lite é um radar pastoral mobile-first para células.

Ele ajuda a liderança a perceber, lembrar e agir quando uma pessoa pode estar se afastando. O produto deve parecer apoio ao cuidado, não cobrança para documentar.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Princípio de decisão

Pergunta central:

```txt
Quem precisa de cuidado agora?
```

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se não ajuda, não entra no MVP.

## Ciclo central

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Escopo atual

Inclui:

- autenticação simples por e-mail e senha;
- tema local no login e no app;
- pessoas, células, membros e encontros de célula;
- liderança/supervisão múltipla por célula;
- agenda padrão da célula;
- geração automática de encontros futuros;
- local específico por encontro;
- remarcação, cancelamento e marcação de `Não houve encontro` pelo líder;
- check-in do líder, com visitantes;
- resumo antes de ajuste de presença;
- métricas de presença com distinção entre dado real e ausência de registro;
- sinais por pessoa;
- escalonamento mínimo por atribuição do sinal;
- busca de pessoa;
- visão por papel;
- equipe do pastor/admin;
- células supervisionadas;
- detalhe simples de pessoa, célula e encontro;
- contato/cuidado com anotação opcional.

Não inclui:

- cadastro público;
- recuperação de senha;
- gestão avançada de usuários;
- importação em massa de planilhas/arquivos;
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

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

Pode ver a própria célula, registrar e ajustar presença dos encontros da própria célula, adicionar visitantes, ver membros ativos, ver pessoas em atenção, pedir apoio da supervisão, registrar contato/cuidado e ajustar detalhes operacionais de encontros da própria célula.

Não deve registrar check-in de outra célula, registrar check-in futuro, operar visão macro ou substituir supervisor/pastor.

### Supervisor

Pode ver células sob sua supervisão, presença, encontros, atenções, pedidos de apoio, exceções, acúmulos e recorrências. Pode encaminhar ao pastor quando houver gravidade ou necessidade pastoral.

Não deve registrar/ajustar presença pelo líder, cancelar encontro, remarcar encontro, alterar local operacional ou ver dados fora do escopo.

### Pastor/Admin

Pode ver saúde geral, equipe, presença por célula, células sem presença recente ou com presença baixa registrada, casos graves/urgentes/encaminhados, buscar pessoas dentro da igreja e abrir células para contexto local.

Não deve registrar check-in, operar encontros das células, receber toda atenção comum como fila inicial, virar central de tickets ou transformar a visão macro em relatório burocrático.

## Visibilidade: escopo não é lista padrão

Há diferença entre **poder acessar** e **receber por padrão**.

- Pastor/admin têm escopo amplo para busca e leitura autorizada, mas a visão inicial prioriza saúde geral e casos pastorais.
- Atenção local aparece para pastor/admin quando há contexto explícito, como célula ou pessoa aberta.
- Supervisor vê o escopo supervisionado.
- Líder vê a própria célula.
- Grupos inativos não entram na superfície padrão, encontros, check-in ou histórico visível.

```txt
Visão inicial do pastor = saúde geral + casos pastorais.
Detalhe de célula = casos pastorais + atenções locais contextualizadas.
Busca = acesso explícito a pessoa dentro do escopo.
```

## Navegação e superfícies

| Papel | Visão | Superfície estrutural | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

A UI usa `Encontros`. Rotas, entidades e código continuam usando `eventos`/`Event`.

### `/lider`

Visão rápida do líder. Prioriza pessoas no radar da própria célula e o encontro relevante. Não é lista ampla de membros nem tela de check-in completa.

### `/pessoas`

Para líder, é a superfície de **Membros**. Mostra busca, filtros (`Todos`, `Atenção`, `Em cuidado`, `Ativos`) e lista organizada por prioridade pastoral: pessoas no radar primeiro, ativos depois. Pastor/admin são direcionados para `/equipe`; supervisores são direcionados para `/celulas`.

### `/supervisor`

Prioriza pedidos de apoio recebidos, células acompanhadas, presença recente e casos relevantes sob supervisão. Evita duplicar a mesma pessoa em várias seções.

### `/celulas`

Superfície do supervisor para ver células por prioridade pastoral. Mostra rapidamente quem pede cuidado próximo, onde há presença em atenção e quais células estão estáveis.

### `/pastor`

Prioriza irmãos que precisam de um olhar especial, saúde geral das células, baixa presença/ausência de dado e busca de pessoa. Não lista toda atenção comum como fila padrão.

### `/equipe`

Superfície do pastor/admin para ler a estrutura de cuidado. Deve mostrar supervisores, células e exceções pastorais sem virar organograma pesado.

### `/eventos`

Na UI, `Encontros`. Lista encontros dentro do escopo visível. A organização padrão separa encontros de hoje, próximos encontros, presença não registrada e histórico.

## Responsabilidades de célula

A célula pode ter mais de uma pessoa na liderança ou supervisão.

Na UI, use:

```txt
Liderança: Bruno e Camila
Supervisão: Ana e Pedro
```

Produto não deve assumir que liderança ou supervisão é sempre uma pessoa só. As responsabilidades ativas definem escopo atual.

## Agenda e encontros

A célula pode ter agenda padrão:

```txt
Dia da semana
Horário
Local padrão
```

O sistema usa essa agenda para garantir encontros futuros. O líder não deve precisar criar o encontro toda semana.

Cada encontro tem local próprio. Quando gerado automaticamente, começa com o local padrão da célula, mas pode ser ajustado para aquela semana.

### Estados e ações

| Situação | Leitura | Ações do líder |
| --- | --- | --- |
| Futuro | `Agendado` | Ajustar local, remarcar, cancelar |
| Já começou/passado sem presença | `Presença pendente` | Registrar presença, ajustar local, marcar `Não houve encontro` |
| Presença registrada | `Presença registrada` | Ver resumo, ajustar presença, ajustar local |
| Cancelado antes do horário | `Cancelado` | Marcar que houve encontro |
| Não realizado depois do horário | `Não houve encontro` | Marcar que houve encontro |

Pastor/supervisor veem o estado e o resumo, mas não executam essas ações.

### Remarcar, cancelar e não houve encontro

- `Remarcar encontro`: muda data/horário/local de uma ocorrência específica.
- `Cancelar encontro`: usado antes do horário quando a célula já sabe que não vai se reunir.
- `Não houve encontro`: usado depois do horário quando a célula não se reuniu.
- Encontro com presença registrada não pode ser cancelado, remarcado ou marcado como não realizado.

## Check-in

Check-in é exclusivo do líder da célula.

Regras:

- evento futuro não é acionável para check-in;
- presença pendente só aparece quando o encontro já começou;
- presença registrada abre resumo primeiro;
- ajuste de presença é escolha explícita;
- pastor/supervisor veem resumo somente leitura;
- pessoa sem marcação explícita fica `Pendente`;
- visitante não vira membro automaticamente;
- visitante duplicado no mesmo encontro deve ser bloqueado por nome normalizado;
- `Marcar todos como presentes` é atalho e deve confirmar antes de sobrescrever ausências/justificativas.

No modo de registro/ajuste, reduza distrações: header compacto, sem navegação inferior, botão de cancelar/voltar e barra de salvar clara.

## Métricas de presença

A métrica deve dar contexto pastoral, não ranking.

- Visitantes não entram no denominador.
- Sem dado deve aparecer como `—`, `Sem registro` ou equivalente.
- `0%` só deve aparecer quando há dado real que sustente esse valor.
- `Presença recente` na célula resume encontros registrados e compara tendência quando houver amostra suficiente.
- Células sem check-in entram como `Sem presença recente` ou `Sem registro`, não como risco automático.

## Seções pastorais

As telas principais organizam pessoas por intenção pastoral.

| Seção | Quando aparece | Propósito |
| --- | --- | --- |
| `Irmãos que precisam de um olhar especial` | sinal urgente ou caso encaminhado ao cuidado pastoral | mostrar o que pede cuidado agora |
| `Pedidos de apoio` | pedido de apoio da supervisão | separar apoio de rotina da atenção comum |
| `Acompanhar de perto` | atenção local comum | lembrar pessoas que precisam de contato cotidiano |
| `Acolhidos em cuidado` | pessoa em `Em cuidado` sem sinal mais prioritário | mostrar quem já recebeu cuidado e continua no radar |

Regras:

- mostrar poucos registros por seção;
- usar `Ver mais` quando houver excedente;
- evitar duplicar a mesma pessoa na mesma superfície;
- manter busca de pessoa para consulta explícita;
- não criar fila, SLA ou tarefa a partir dessas seções.

## Fluxo de contato/cuidado

```txt
Pessoa em atenção -> Abrir pessoa -> Já houve contato? -> confirmar -> anotar se precisar -> salvar
```

Regras:

- `Já houve contato?` é pergunta, não ação destrutiva imediata.
- `Salvar sem anotação` é válido.
- Cuidado resolve sinais ativos dentro do escopo do usuário.
- Se resolver todos os sinais ativos, a pessoa fica `Em cuidado`.
- A pessoa só volta para `Ativo` por ação explícita.
- O mesmo motivo não deve reabrir por recalcular presença; precisa haver nova evidência posterior.

## Busca

A busca atual é busca de pessoa.

- Pastor/admin buscam pessoas dentro da igreja.
- Supervisor busca dentro do escopo supervisionado.
- Líder busca dentro da própria célula.
- Resultado leva para `/pessoas/[personId]`.
- Resultado usa status efetivo, não apenas status persistido.
- Não prometa busca ampla de evento/célula enquanto a API não suportar.

## Tema

O tema é preferência visual local do aparelho.

Temas atuais:

- `Claro`;
- `Pergaminho`;
- `Escuro`.

Tema não muda permissão, escopo ou dado pastoral.

## Cadastros e importação

O modelo já prepara agenda, responsabilidades e local por encontro. A UI de cadastros completos e importação em massa ainda não faz parte do MVP atual.

Quando entrar, cadastros devem ser mínimos e pastorais. Importação de planilhas deve ter validação e prévia antes de criar dados reais.
