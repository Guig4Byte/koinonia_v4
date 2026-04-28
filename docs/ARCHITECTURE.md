# Arquitetura — Koinonia Lite

Este documento é a fonte técnica do MVP atual: organização do código, entidades, permissões, rotas, validações e limites de implementação.

Para produto, escopo e fluxos, consulte `docs/PRODUCT.md`. Para vocabulário, consulte `docs/GLOSSARY.md`. Para entrada rápida de agentes, consulte `docs/AGENT_BRIEFING.md`.

## Contexto mínimo de produto

A arquitetura deve proteger estas âncoras:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

```txt
Sinal não é tarefa.
```

A presença não é o fim. Ela é uma fonte de leitura pastoral. A pessoa é o centro da experiência.

## Estrutura do projeto

```txt
src/app
  Rotas, páginas e API handlers.

src/components
  Componentes reutilizáveis de UI. Devem permanecer o mais burros possível.

src/features
  Regras de domínio por capacidade do produto.

src/lib
  Infraestrutura: Prisma, usuário atual, formatação e utilitários.

prisma
  Schema, client gerado e seed.

docs
  Decisões de produto, vocabulário, arquitetura e briefing para agentes.
```

## Entidades principais

- `Church`
- `User`
- `Person`
- `SmallGroup`
- `GroupMembership`
- `Event`
- `Attendance`
- `CareSignal`
- `CareTouch`

Leitura de domínio:

- `Person` é o centro operacional.
- `Event` gera `Attendance`.
- `Attendance` pode gerar `CareSignal`.
- `CareSignal` aparece na UI como atenção.
- `CareTouch` registra contato/cuidado simples.

## Regras de arquitetura

1. API handler não deve acumular regra pastoral complexa.
2. Página não deve recalcular regra de atenção manualmente.
3. Regra de escopo deve ficar centralizada.
4. Componentes compartilhados devem ser reaproveitados antes de criar variações locais.
5. Backend deve validar permissão mesmo quando a UI esconde ações.
6. Query deve retornar apenas dados dentro do escopo visível do usuário.
7. O detalhe da pessoa não deve vazar histórico de células fora do escopo.
8. Funcionalidade que cria burocracia antes de cuidado não deve entrar no MVP.

## Autorização centralizada

As regras de escopo ficam em:

```txt
src/features/permissions/permissions.ts
```

Helpers principais:

```ts
canViewGroup(user, group)
canViewPerson(user, person)
canViewEvent(user, event)
canCheckInEvent(user, event)
canRegisterCare(user, person)
getVisibleGroupWhere(user)
getVisibleEventWhere(user)
getVisiblePersonWhere(user)
getVisibleMembershipWhere(user)
getVisibleOpenSignalWhere(user)
getVisibleCareTouchWhere(user, personId?)
```

Rotas, páginas e queries devem reutilizar esses helpers em vez de repetir regra de papel/escopo manualmente.

Regra operacional:

- Pastor/Admin: igreja inteira.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.
- Check-in: somente o líder da célula do evento.
- Contato/cuidado: apenas quem tem escopo pastoral sobre a pessoa.

Quando validar objetos carregados diretamente, mantenha a mesma semântica dos filtros de query. Grupo inativo não deve liberar visibilidade, evento, check-in ou histórico.

## Check-in

Somente o líder da célula do evento pode salvar check-in.

A rota de escrita do check-in deve validar:

- evento pertence à igreja do usuário;
- usuário é o líder da célula vinculada ao evento;
- cada membro ativo não visitante da célula aparece exatamente uma vez no payload;
- ninguém de fora da célula entra como presença de membro;
- presença de membro aceita apenas `PRESENT`, `ABSENT` ou `JUSTIFIED`;
- `VISITOR` entra somente pelo bloco de visitantes;
- evento concluído continua editável apenas para correção pelo líder da célula;
- visitante novo não duplica visitante já registrado no mesmo evento;
- duplicidade de visitante é comparada por nome normalizado, ignorando acento, caixa e espaços extras.

Pastor, supervisor e admin não salvam check-in nesta fase.

## Sinais e atenção por pessoa

Regras de sinal ficam em `src/features/signals`.

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Listas chamadas de `Pessoas em atenção` devem agregar sinais abertos por pessoa. Use `src/features/signals/attention.ts` para escolher o sinal primário: primeiro o mais grave, depois o mais recente.

O backend do check-in deve retornar contagem de pessoas distintas em atenção, não quantidade bruta de sinais.

## Contato e cuidado

A rota `/api/care/[personId]` deve:

- validar entrada com `src/features/care/care-validation.ts`;
- aparar anotação vazia;
- confirmar escopo pastoral com helpers de permissão;
- associar o registro a uma célula visível quando o usuário não tiver escopo de igreja inteira;
- recusar escrita se nenhuma célula visível existir;
- resolver apenas sinais abertos dentro do escopo do usuário;
- devolver `resolvedSignalsCount` e mensagem curta para a UI.

`Já houve contato` registra cuidado já realizado fora do aplicativo. Não deve criar acompanhamento formal, task ou SLA.

## Rotas de pessoa e busca

A lista `/pessoas` mostra pessoas em atenção dentro do escopo do usuário.

A rota `/pessoas/[personId]` é o detalhe simples de cuidado e deve chamar `canViewPerson(user, person)` antes de renderizar qualquer dado.

Mesmo depois de validar a pessoa, os dados internos da tela também precisam respeitar escopo:

- sinais;
- presenças;
- cuidados recentes;
- vínculos/células exibidos como contexto.

Para cuidado recente, use `getVisibleCareTouchWhere(user, personId)` em vez de montar filtros manuais.

A busca em `/api/search` deve:

- respeitar `getVisiblePersonWhere(user)`;
- mostrar contexto via vínculos visíveis ao usuário;
- levar direto para `/pessoas/[personId]`;
- não prometer busca de evento ou célula enquanto a API não suportar esses tipos.

## Autenticação atual e futura

A base ainda usa usuário demo via cookie para acelerar validação de produto.

Mesmo em modo demo, backend deve respeitar escopo.

Quando autenticação real entrar, preserve o contrato:

```ts
getCurrentUser(): Promise<User>
```

A origem do usuário deve mudar de cookie demo para sessão real com cookie HttpOnly.

Não implementar OAuth, recuperação de senha ou convite por email antes do fluxo principal estar validado.

## Design system

A interface usa temas e tokens CSS.

Há três temas:

- Claro
- Pergaminho
- Escuro

Regra adotada:

> O design token orienta. A tela real decide.

Contraste, legibilidade e hierarquia visual têm prioridade sobre seguir token literalmente.

## Seed demo

A seed deve validar escopo e fluxo, não apenas preencher telas.

Cenário atual esperado:

- Roberto (`PASTOR`) vê a igreja inteira.
- Ana (`SUPERVISOR`) supervisiona `Célula Esperança` e `Célula Ágape`.
- Bruno (`LEADER`) lidera apenas `Célula Esperança`.
- Carla (`LEADER`) lidera apenas `Célula Ágape`.
- A aba demo de líder seleciona Bruno para testar que ele não vê a célula da Carla.
- `Célula Esperança` mantém encontros concluídos, visitante já registrado, evento de hoje aberto para check-in e próximo evento agendado.
- `Célula Ágape` mantém eventos próprios para validar leitura de supervisor/pastor sem liberar check-in para Bruno.

## O que não existe de propósito

Não implemente sem pedido explícito:

- task complexa;
- SLA;
- playbook;
- CRM pesado;
- acompanhamento formal;
- dashboard analítico profundo;
- BI;
- mapa;
- QR Code;
- geolocalização;
- notificações;
- calendário amplo.

Esses conceitos podem aparecer depois, mas só se o uso real pedir e depois que o ciclo principal estiver validado.
