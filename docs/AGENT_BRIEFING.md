# Koinonia — briefing para agentes

Este é o documento de entrada para qualquer IA/agente que vá alterar o projeto. Ele resume as decisões que não devem ser quebradas e aponta onde cada assunto mora.

## Ordem de leitura e autoridade

1. `docs/AGENT_BRIEFING.md` — resumo operacional para agentes.
2. `docs/PRODUCT.md` — produto, escopo, papéis, fluxos e regras do MVP.
3. `docs/GLOSSARY.md` — vocabulário oficial e rótulos de UI.
4. `docs/ARCHITECTURE.md` — regras técnicas, permissões, queries e rotas.
5. `docs/Perfil.txt` — sensação de uso mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada, sem autoridade sobre o MVP atual.

Quando houver conflito, preserve o MVP atual. Não use a visão futura para antecipar complexidade.

## Ideia central

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O MVP é um radar pastoral mobile-first para células/grupos. Ele ajuda a liderança a perceber quem pode estar se afastando e facilitar um gesto simples de cuidado.

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Ciclo oficial

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Papéis

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

| Papel | Responsabilidade padrão | Não deve virar |
| --- | --- | --- |
| Líder | Registrar presença e resolver atenção local da própria célula. | Operador de outras células. |
| Supervisor | Apoiar líderes, exceções, padrões e pedidos de apoio. | Substituto do líder no check-in. |
| Pastor | Interpretar saúde geral, ver casos graves/encaminhados e buscar pessoas quando necessário. | Central de tickets ou fila de ausências. |

## Superfície padrão

Listas iniciais são para decisão, não exploração. Mostre primeiro quem pede cuidado agora, com poucos itens e ação clara.

Seções pastorais atuais:

1. `Irmãos que precisam de um olhar especial`: urgentes ou encaminhados ao cuidado pastoral.
2. `Pedidos de apoio`: pedidos recebidos pela supervisão ou enviados pelo líder.
3. `Acompanhar de perto`: atenção local comum.
4. `Acolhidos em cuidado`: pessoas em `Em cuidado`.

Regra de lista:

- mostrar até 4 itens por seção;
- usar `Ver mais` / `Mostrar menos` quando houver excedente;
- não transformar a lista em diretório amplo;
- busca continua sendo busca de pessoa.

## Escalonamento

O MVP usa `CareSignal.assignedToId`, sem entidade de tarefa.

- `assignedToId` para supervisor = pedido de apoio.
- `assignedToId` para pastor/admin = encaminhamento pastoral.
- `severity = URGENT` = caso pastoral por gravidade, mesmo sem atribuição ao pastor.

Mensagens devem ser contextuais ao perfil que está vendo. Não use frases como `Ana recebeu...` ou `Roberto recebeu...`.

Exemplos corretos:

- líder: `Apoio solicitado à supervisão.`
- supervisor: `Essa célula pediu apoio da supervisão.`
- pastor/admin: `Encaminhado ao cuidado pastoral.`
- líder/supervisor vendo encaminhamento pastoral: `Encaminhado ao pastor.`

## Status e badges

Use helpers centrais, não rótulos locais:

- sinais: `src/features/signals/display.ts`;
- status de pessoa: `src/features/people/status-display.ts`;
- seções pastorais: `src/features/signals/sections.ts`.

Status efetivo de pessoa deve priorizar o sinal aberto visível. Sem sinal primário, use o status persistido da pessoa.

Rótulos de referência:

- `Ativo`: verde.
- `Em atenção`: âmbar.
- `Atenção local`: âmbar, quando pastor vê atenção comum dentro de contexto.
- `Apoio solicitado`: líder vendo pedido enviado à supervisão.
- `Pedido de apoio`: supervisor vendo pedido recebido.
- `Urgente`: vermelho.
- `Caso pastoral`: pastor vendo caso encaminhado a pastor/admin.
- `Encaminhado`: líder/supervisor vendo envio ao pastor.
- `Em cuidado`: azul/care, para pessoa que recebeu cuidado e continua no radar.
- `Cuidado realizado`: azul/care.

## Regras que não devem quebrar

- Check-in é operação do líder da célula.
- Pastor/supervisor veem presença em resumo; não registram presença pelo líder.
- Check-in futuro não pode ser salvo.
- Pessoa sem marcação explícita fica `Pendente`, nunca falta presumida.
- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Métrica sem dado deve aparecer como ausência de dado, não `0%` de risco.
- Listas de atenção agregam por pessoa, não por sinal bruto.
- Cards de lista usam CTA neutro, normalmente `Abrir pessoa`; ações sensíveis ficam no detalhe.
- `Já houve contato?` precisa confirmar antes de resolver atenção.
- Se o cuidado resolver todos os sinais ativos, a pessoa fica `Em cuidado`; só volta para `Ativo` por ação explícita.
- Recalcular presença não reabre motivo já cuidado sem nova evidência posterior.
- `/pessoas` não é diretório completo para pastor/supervisor por padrão.
- Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico padrão.

## Limites do MVP

Não implementar sem pedido explícito:

- acompanhamento formal;
- CRM pastoral pesado;
- task manager, kanban, fila ou SLA;
- BI/analytics avançado;
- mapas/geolocalização/QR Code;
- notificações;
- área rica do membro;
- calendário amplo;
- cadastro/formulários longos.

## Onde implementar

- Permissões/escopo: `src/features/permissions/permissions.ts`.
- Regras de sinais: `src/features/signals`.
- Status visual de sinais: `src/features/signals/display.ts`.
- Seções pastorais: `src/features/signals/sections.ts`.
- Status de pessoa: `src/features/people/status-display.ts`.
- Queries de dashboard: `src/features/dashboard/queries.ts`.
- Validação de cuidado: `src/features/care/care-validation.ts`.
- Rotas e APIs: `src/app`.

Consulte `ARCHITECTURE.md` antes de criar regra nova.

## Checklist antes de responder ou codar

1. A mudança respeita o ciclo oficial?
2. A mudança reduz esforço de cuidado?
3. O pastor continua fora da fila operacional comum?
4. O supervisor continua sendo apoio, não operador de check-in?
5. O líder continua dono do check-in local?
6. A linguagem vem do `GLOSSARY.md`?
7. As permissões usam helpers existentes?
8. A UI continua mobile-first e sem burocracia?
9. O patch promete apenas o que o código entrega?
