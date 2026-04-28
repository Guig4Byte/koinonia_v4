# Arquitetura — Koinonia Lite

## Ideia central

O Koinonia Lite é uma base enxuta para validar o ciclo pastoral principal:

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

A presença não é o fim. Ela é uma fonte de leitura pastoral.

## Estrutura

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
  Decisões de produto, arquitetura e briefing para agentes.
```

## Documentos de contexto

Agentes devem ler:

- `docs/AGENT_BRIEFING.md`;
- `docs/PRODUCT.md`;
- `docs/GLOSSARY.md`;
- `docs/ARCHITECTURE.md`;
- `docs/Perfil.txt`;
- `docs/Koinonia.txt`.

Ordem de autoridade:

- `AGENT_BRIEFING.md`, `PRODUCT.md` e `GLOSSARY.md` governam o MVP atual.
- `Perfil.txt` governa a experiência mobile/pastoral.
- `Koinonia.txt` registra visão ampla e futura.

Não há dependência de arquivo HTML externo para entender ou alterar esta base.

## Entidades principais

- Church
- User
- Person
- SmallGroup
- GroupMembership
- Event
- Attendance
- CareSignal
- CareTouch

## Regras de ouro

1. A pessoa é o centro.
2. Evento existe para revelar cuidado necessário.
3. Presença é sinal, não fiscalização.
4. Registro só existe quando evita esquecimento.
5. Check-in é operação do líder.
6. Supervisor acompanha.
7. Pastor interpreta.
8. API handler não deve acumular regra pastoral complexa.
9. Página não deve saber como atenção é calculada.
10. Se uma funcionalidade gera burocracia, ela não entra no MVP.

## Autorização atual

A base ainda usa usuário demo via cookie para acelerar validação de produto.

Mesmo assim, backend deve respeitar escopo.

Regra atual:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Check-in

Somente o líder da célula do evento pode salvar check-in.

Regras esperadas no backend:

```txt
user.role === LEADER
event.group.leaderUserId === user.id
```

Pastor, supervisor e admin não salvam check-in nesta fase.

A rota de escrita do check-in também valida:

- evento pertence à igreja do usuário;
- usuário é o líder da célula vinculada ao evento;
- cada membro ativo não visitante da célula aparece exatamente uma vez no payload;
- ninguém de fora da célula entra como presença de membro;
- presença de membro aceita apenas `PRESENT`, `ABSENT` ou `JUSTIFIED`;
- `VISITOR` entra somente pelo bloco de visitantes;
- evento concluído continua editável apenas para correção pelo líder da célula;
- visitantes novos não podem duplicar visitantes já registrados no mesmo evento;
- duplicidade de visitante é comparada por nome normalizado, ignorando acento, caixa e espaços extras.

### Leitura

- Pastor/Admin: igreja inteira.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.

### Contato/cuidado

O registro de contato deve ser permitido para quem tem escopo pastoral sobre a pessoa:

- pastor/admin na igreja;
- supervisor da célula da pessoa;
- líder da célula da pessoa.

A rota `/api/care/[personId]` deve usar `src/features/care/care-validation.ts` para validar entrada, aparar anotação vazia e devolver `resolvedSignalsCount`. Para usuários sem escopo de igreja inteira, o registro precisa estar associado a uma célula visível; se nenhuma célula visível existir, a rota deve recusar a escrita em vez de resolver sinais fora de escopo.

Sinal não deve virar task. A ação `Já houve contato` deve permitir registrar cuidado já realizado fora do aplicativo e resolver a atenção sem criar acompanhamento formal.

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

A regra operacional continua:

- Pastor/Admin: igreja inteira.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.
- Check-in: somente o líder da célula do evento.
- Contato/cuidado: apenas quem tem escopo pastoral sobre a pessoa.

## Rotas de pessoa

A lista `/pessoas` mostra pessoas em atenção dentro do escopo do usuário.

A rota `/pessoas/[personId]` é o detalhe simples de cuidado e deve reutilizar `canViewPerson(user, person)` antes de renderizar qualquer dado.

Os helpers diretos de permissão também devem recusar escopo vindo de grupo inativo. As queries já filtram `isActive: true`; `canViewGroup`, `canViewEvent`, `canCheckInEvent` e a visibilidade de pessoa por vínculo precisam manter a mesma semântica quando validam objetos carregados diretamente.

A busca em `/api/search` deve respeitar `getVisiblePersonWhere(user)` e levar direto para `/pessoas/[personId]`, não para uma lista genérica com parâmetro solto.

A busca atual é busca de pessoa. Se uma tela exibir o componente `SearchBox`, a copy não deve prometer busca de evento ou célula enquanto a API não suportar isso. O contexto exibido no resultado também deve usar somente vínculos visíveis ao usuário, via `getVisibleMembershipWhere(user)`.

Dentro do detalhe da pessoa, sinais, presenças e cuidados recentes também devem ser filtrados pelo mesmo escopo do usuário. `canViewPerson` autoriza a pessoa, mas não deve ser usado sozinho para carregar histórico de outras células. Para cuidado recente, use `getVisibleCareTouchWhere(user, personId)` em vez de montar filtros manuais.

## Autenticação futura

Ao implementar autenticação real, preserve o contrato:

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

Ou seja: contraste, legibilidade e hierarquia visual têm prioridade sobre seguir token literalmente.

## O que não existe de propósito

- Task complexa
- SLA
- Playbook
- CRM pesado
- Acompanhamento formal
- Dashboard analítico profundo
- BI
- Mapa
- QR Code
- Geolocalização

Esses conceitos podem aparecer depois, mas só se o uso real pedir.

## Seed demo

A seed não deve ser apenas decorativa. Ela precisa permitir validação de escopo e de fluxo.

Cenário atual esperado:

- Roberto (`PASTOR`) vê a igreja inteira.
- Ana (`SUPERVISOR`) supervisiona `Célula Esperança` e `Célula Ágape`.
- Bruno (`LEADER`) lidera apenas `Célula Esperança`.
- Carla (`LEADER`) lidera apenas `Célula Ágape`.
- A aba demo de líder seleciona o primeiro líder criado, Bruno, justamente para testar que ele não vê a célula da Carla.
- `Célula Esperança` mantém três encontros concluídos, um evento de hoje aberto para check-in e um próximo evento agendado.
- `Célula Ágape` mantém eventos próprios para validar leitura de supervisor/pastor sem liberar check-in para Bruno.

## Sinais de ausência confiáveis

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Depois de salvar check-in, a resposta da API informa quantas pessoas distintas ficaram em atenção naquela célula, para que a interface possa fechar o ciclo: presença salva -> pessoas em atenção -> cuidado.


## Atenção por pessoa

Listas chamadas de `Pessoas em atenção` devem agregar sinais abertos por pessoa. Use `src/features/signals/attention.ts` para escolher o sinal primário: primeiro o mais grave, depois o mais recente. O backend do check-in também retorna contagem de pessoas distintas em atenção, não quantidade bruta de sinais.
