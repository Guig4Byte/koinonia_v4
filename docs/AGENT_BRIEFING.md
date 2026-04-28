# Koinonia — briefing para agentes

Este documento é a fonte curta para qualquer agente que entrar no projeto.

Antes de alterar código, leia:

1. `docs/AGENT_BRIEFING.md` — resumo operacional para agentes.
2. `docs/PRODUCT.md` — recorte oficial do MVP atual.
3. `docs/GLOSSARY.md` — vocabulário oficial do MVP.
4. `docs/ARCHITECTURE.md` — organização técnica e limites de arquitetura.
5. `docs/Perfil.txt` — norte de experiência mobile/pastoral.
6. `docs/Koinonia.txt` — visão ampla e futura do produto.

Ordem de autoridade:

- Para o MVP atual, siga `AGENT_BRIEFING.md`, `PRODUCT.md` e `GLOSSARY.md`.
- Para experiência e tom, siga `Perfil.txt`.
- Para visão futura, consulte `Koinonia.txt`, mas não implemente recursos amplos sem pedido explícito.

A referência visual externa anterior foi removida do fluxo do projeto; não há arquivo HTML obrigatório para ler nesta base.

## Frase norteadora

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O produto não é um CRM pastoral pesado. Ele é um radar pastoral simples.

## Objetivo do MVP atual

O MVP atual deve provar este ciclo:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

A presença não é fiscalização. A presença é uma fonte simples para perceber quem pode estar se afastando.

## Vocabulário essencial

Use estes conceitos de forma consistente:

- **Sinal**: evidência gerada pelo sistema. Exemplo: duas faltas seguidas.
- **Atenção**: forma visível e pastoral de apresentar um sinal para o usuário. Exemplo: pessoa em atenção.
- **Contato**: tentativa ou ação concreta de aproximação. Exemplo: ligação, WhatsApp ou conversa.
- **Cuidado**: registro mínimo de que uma pessoa foi percebida e alguém agiu.
- **Acompanhamento**: fluxo futuro mais organizado para casos que exigirem continuidade; não deve ser antecipado como task manager nesta fase.

Quando houver dúvida, a UI deve preferir `atenção`, `cuidado`, `contato feito` e frases humanas. Detalhes completos ficam em `docs/GLOSSARY.md`.

## Escopo permitido agora

O MVP atual deve permanecer limitado a:

- Pessoas
- Células / grupos
- Eventos de célula
- Check-in simples
- Taxa de presença
- Atenções pastorais geradas por presença/ausência
- Detalhe simples da pessoa em `/pessoas/[personId]`
- Busca e cards de atenção levando direto ao contexto da pessoa
- Busca atual é busca de pessoa; não prometer busca de evento/célula na interface enquanto `/api/search` não suportar esses tipos
- Ação direta de cuidado: ligar, WhatsApp, contato feito e anotação opcional
- Visão macro simples para pastor
- Visão de acompanhamento para supervisor
- Visão operacional para líder

## Fora do MVP agora

Não implemente ainda, salvo pedido explícito do usuário:

- Analytics avançado
- BI executivo
- Mapas
- QR Code
- Geolocalização
- SLA
- Playbooks
- Task manager complexo
- CRM pastoral pesado
- Área rica do membro
- Formulários longos
- Notificações
- Login social/OAuth
- Recuperação de senha
- Automações de workflow

A regra é: se a funcionalidade cria burocracia antes de criar cuidado, ela fica fora.

## Regra dos perfis

A regra de produto atual é:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

O líder opera a célula dele:

- vê sua célula e seus eventos;
- registra check-in dos eventos da própria célula;
- adiciona visitante no check-in;
- vê membros e pessoas em atenção da própria célula;
- liga, chama no WhatsApp e registra contato das pessoas sob seu cuidado.

### Supervisor

O supervisor acompanha as células sob sua responsabilidade:

- vê células supervisionadas;
- vê eventos em modo resumo;
- vê check-ins pendentes/realizados;
- vê presença, visitantes e pessoas em atenção;
- não registra check-in.

### Pastor

O pastor interpreta a visão macro:

- vê leitura geral da igreja/campus;
- vê eventos em modo resumo;
- vê presença geral;
- vê células em atenção;
- vê pessoas que podem estar se afastando;
- não registra check-in.


## Sinais de ausência confiáveis

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Depois de salvar check-in, a resposta da API informa quantas pessoas distintas ficaram em atenção naquela célula, para que a interface possa fechar o ciclo: presença salva -> pessoas em atenção -> cuidado. A UI pode escolher o sinal mais grave/recente como motivo, mas a lista principal deve continuar sendo por pessoa, não por sinal.

## Check-in

Check-in é operação do líder.

A API deve bloquear qualquer tentativa de salvar check-in que não venha do líder da célula do evento.

A interface também deve refletir isso:

- líder da célula: tela editável de check-in;
- pastor/supervisor: tela somente leitura, com resumo e leitura pastoral;
- evento sem check-in: pastor/supervisor veem que o líder ainda precisa registrar a presença, mas não podem registrar por ele;
- pessoa sem marcação aparece como `Pendente`, nunca como ausência presumida;
- a finalização só deve acontecer depois de marcar todos os membros ativos da célula;
- evento já concluído pode ser aberto pelo líder como `Ajustar presença`, não como novo check-in;
- a visão do líder deve destacar o encontro mais relevante: evento de hoje pendente, depois próximo evento pendente, depois último realizado;
- visitantes já registrados aparecem com nome no ajuste, sem virar membros automaticamente;
- o mesmo visitante não deve ser adicionado duas vezes no mesmo evento, mesmo com diferença de acento, caixa ou espaços.

## Fluxo de cuidado no card

Nos cards de pessoa em atenção, o fluxo correto é:

```txt
[Ligar] [WhatsApp]
        ↓
Conseguiu contato?
        ↓
[Contato feito] [Ainda não]
        ↓
Quer anotar algo?
        ↓
[Anotar] [Não precisa]
```

Regras:

- `Ligar` abre `tel:`.
- `WhatsApp` abre `wa.me`.
- `Contato feito` não deve fechar imediatamente; primeiro pergunta se quer anotar.
- `Não precisa` registra contato e resolve as atenções abertas.
- `Anotar` salva observação junto com o contato e resolve as atenções abertas.
- `Ainda não` não registra contato.
- Anotação é apoio; não deve ser a ação principal antes do cuidado.

## Detalhe da pessoa

A rota `/pessoas/[personId]` é a leitura curta de cuidado. Ela deve mostrar somente o necessário para agir:

- pessoa, célula e líder;
- status simples;
- nota curta, se existir;
- ações de contato;
- atenção aberta e evidência;
- última presença;
- cuidado recente.

Mesmo depois de validar `canViewPerson(user, person)`, os históricos internos da tela — sinais, presenças e cuidados recentes — devem continuar filtrados pelo escopo visível do usuário. Isso evita vazar contexto de outra célula caso a pessoa tenha mais de um vínculo.

Não transformar esta tela em prontuário, CRM pastoral completo ou histórico infinito. O objetivo é dar contexto suficiente para um telefonema, WhatsApp ou contato real.

## Design e linguagem

O produto deve parecer pastoral, não corporativo.

Preferir:

- `atenção` em vez de `alerta`;
- `cuidado` em vez de `task`;
- `visão` em vez de `dashboard`;
- `presença` como leitura pastoral, não fiscalização;
- frases humanas, curtas e concretas.

Evitar:

- tabelas densas no mobile;
- formulários longos;
- muitos cards numéricos;
- gráficos complexos;
- linguagem de cobrança;
- texto que transforme líder em operador de sistema.

## Visual atual

O visual é mobile-first, com:

- cards quentes;
- navegação inferior;
- temas claro, pergaminho e escuro;
- tema escuro em tom espresso quente, não preto puro;
- tokens CSS como base, mas a tela real pode ajustar contraste, espaçamento e legibilidade.

Regra visual adotada:

> O design token orienta. A tela real decide.

Não sacrificar contraste e legibilidade para seguir token literalmente.

## Autenticação

Ainda não há autenticação real. Existe um seletor demo de perfil para validação:

```txt
Pastor | Supervisor | Líder
```

Esse seletor não é interface final. Ele deve virar modo demo/dev no futuro, por exemplo:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Quando entrar autenticação real, preserve o contrato:

```ts
getCurrentUser()
```

E substitua a origem demo por sessão real com cookie HttpOnly.

## Autorização

Mesmo em modo demo, as regras de escopo devem ser respeitadas no backend.

A matriz central fica em:

```txt
src/features/permissions/permissions.ts
```

Use estes helpers antes de criar nova regra de escopo manual:

```ts
canViewGroup(user, group)
canViewPerson(user, person)
canViewEvent(user, event)
canCheckInEvent(user, event)
canRegisterCare(user, person)
getVisibleGroupWhere(user)
getVisibleEventWhere(user)
getVisiblePersonWhere(user)
getVisibleOpenSignalWhere(user)
```

Não confiar apenas na UI. Toda rota de escrita deve validar permissão no backend.

## Seed demo

A seed deve validar os cenários de escopo, não apenas preencher telas:

- Bruno é o líder demo principal e lidera apenas a `Célula Esperança`;
- Carla é uma segunda líder e lidera a `Célula Ágape`;
- Ana supervisiona as duas células;
- Roberto, como pastor, vê a igreja inteira;
- a `Célula Esperança` tem eventos realizados, visitante já registrado, evento de hoje pendente e próximo evento agendado;
- a `Célula Ágape` existe para testar que Bruno não vê outra célula, enquanto Ana e Roberto veem.

## Próxima direção provável

Com check-in, eventos e matriz de permissões estabilizados para o MVP, os próximos passos naturais são:

1. detalhe simples da célula;
2. melhorar retorno pós-check-in para pessoas em atenção;
3. autenticação real;
4. remover o seletor demo da interface pública.

Não avançar para analytics, playbooks ou dashboard pesado antes do ciclo principal estar bom.
