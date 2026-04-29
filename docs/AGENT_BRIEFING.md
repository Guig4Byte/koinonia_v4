# Koinonia — briefing para agentes

Este é o documento de entrada para qualquer IA/agente que vá alterar o projeto. Ele resume as decisões que não devem ser quebradas e aponta onde cada assunto mora.

## Ordem de leitura e autoridade

1. `docs/AGENT_BRIEFING.md` — resumo operacional para agentes.
2. `docs/PRODUCT.md` — produto, escopo, papéis, fluxos e regras do MVP.
3. `docs/GLOSSARY.md` — vocabulário oficial e rótulos de UI.
4. `docs/ARCHITECTURE.md` — regras técnicas, permissões, queries e rotas.
5. `docs/Perfil.txt` — sensação de uso mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada, sem autoridade sobre o MVP atual.

Quando os documentos parecerem conflitantes, preserve o MVP atual. Não use a visão futura para antecipar complexidade.

## Ideia central

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O MVP é um radar pastoral mobile-first para células/grupos. Ele existe para ajudar liderança a perceber quem pode estar se afastando e facilitar um gesto simples de cuidado.

A pergunta de corte é:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Ciclo oficial do MVP

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

- `Evento`: encontro real da célula.
- `Presença`: registro simples do encontro.
- `Atenção`: pessoa trazida à consciência por um sinal.
- `Contato`: ação humana: ligação, WhatsApp ou conversa.
- `Cuidado`: registro mínimo de que alguém percebeu e agiu.

A presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

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
| Pastor | Interpretar saúde geral, ver casos graves/escalados e buscar pessoas quando necessário. | Central de tickets ou fila de ausências. |

## Regra de visibilidade pastoral

```txt
Líder resolve a atenção local.
Supervisor apoia exceções e padrões.
Pastor vê saúde geral, casos graves/escalados e busca qualquer pessoa quando precisar.
```

Importante:

- Pastor não recebe toda atenção comum como fila inicial.
- Pastor pode buscar qualquer pessoa dentro do seu escopo.
- Pastor pode abrir uma célula e ver atenções locais contextualizadas.
- Ver atenção local dentro de uma célula não transforma a visão inicial do pastor em fila operacional.

## Camadas de atenção

| Camada | Quem vê por padrão | Exemplo | Linguagem sugerida |
| --- | --- | --- | --- |
| Atenção local | Líder | ausência comum, retorno simples, visitante, contato cotidiano | `Em atenção`, `Atenção local` |
| Apoio de supervisão | Líder + supervisor | líder pediu ajuda ou célula acumula casos | `Apoio solicitado`, `Pedido de apoio` |
| Cuidado pastoral | Pastor, e contexto local quando fizer sentido | urgente, sensível, recorrente ou encaminhado | `Urgente`, `Caso pastoral`, `Encaminhado ao pastor` |

## Escalonamento atual

O MVP usa implementação mínima, sem entidade nova de task:

```txt
CareSignal.assignedToId
```

Interpretação atual:

- `assignedToId` apontando para supervisor: pedido de apoio da supervisão.
- `assignedToId` apontando para pastor/admin: encaminhamento pastoral.
- `severity = URGENT`: caso pastoral por gravidade, mesmo sem atribuição ao pastor.

Regra de mensagem:

- Caso urgente atribuído ao supervisor aparece para o pastor por gravidade.
- Nesse cenário, o pastor não deve ver a mensagem de apoio ao supervisor.
- Pastor só vê mensagem de encaminhamento quando o sinal foi atribuído a pastor/admin.

## Status e badges

Use os helpers de `src/features/signals/display.ts` em vez de reinventar rótulos.

Rótulos de referência:

- `Ativo`: verde.
- `Em atenção`: âmbar.
- `Atenção local`: âmbar, quando o pastor vê atenção comum dentro de contexto.
- `Apoio solicitado`: líder vendo pedido já enviado ao supervisor.
- `Pedido de apoio`: supervisor vendo pedido recebido.
- `Urgente`: vermelho.
- `Caso pastoral`: pastor vendo caso encaminhado a pastor/admin.
- `Cuidado realizado`: azul.

Não misture `Urgente` com `Em atenção` para o mesmo sinal. Severidade urgente deve permanecer urgente.

## Regras que não devem quebrar

- Check-in é operação do líder da célula.
- Pastor/supervisor veem presença em resumo; não registram presença pelo líder.
- Pessoa sem marcação explícita fica `Pendente`, nunca falta presumida.
- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Métrica sem dado deve aparecer como ausência de dado, não `0%` de risco.
- Listas de atenção agregam por pessoa, não por sinal bruto.
- Cards de lista devem ter CTA neutro, normalmente `Abrir pessoa`; ações diretas ficam no detalhe.
- `Já houve contato?` precisa confirmar antes de resolver atenção.
- Se todos os sinais ativos forem resolvidos, a pessoa volta para `Ativo`.
- Recalcular presença não reabre motivo já cuidado sem nova evidência posterior.
- `/pessoas` não é diretório completo para pastor/supervisor por padrão.
- A busca atual é busca de pessoa; não prometa busca de evento/célula se a API não suportar.

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
- Queries de dashboard: `src/features/dashboard/queries.ts`.
- Validação de cuidado: `src/features/care/care-validation.ts`.
- Componentes de cards/listas: `src/components`.
- Rotas e APIs: `src/app`.

Consulte `ARCHITECTURE.md` antes de criar regra nova.

## Autenticação

Ainda existe seletor demo de perfil. Ele é temporário.

Quando autenticação real entrar:

- preserve o contrato `getCurrentUser()`;
- substitua cookie demo por sessão real com cookie HttpOnly;
- mantenha validação de backend por papel/escopo;
- não implemente OAuth, convites ou recuperação de senha antes de estabilizar o fluxo principal.

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
