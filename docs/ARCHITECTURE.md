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
- evento concluído continua editável apenas para correção pelo líder da célula.

### Leitura

- Pastor/Admin: igreja inteira.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.

### Contato/cuidado

O registro de contato deve ser permitido para quem tem escopo pastoral sobre a pessoa:

- pastor/admin na igreja;
- supervisor da célula da pessoa;
- líder da célula da pessoa.

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
getVisibleOpenSignalWhere(user)
```

Rotas, páginas e queries devem reutilizar esses helpers em vez de repetir regra de papel/escopo manualmente.

A regra operacional continua:

- Pastor/Admin: igreja inteira.
- Supervisor: grupos supervisionados.
- Líder: grupos liderados.
- Check-in: somente o líder da célula do evento.
- Contato/cuidado: apenas quem tem escopo pastoral sobre a pessoa.

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
- Dashboard analítico profundo
- BI
- Mapa
- QR Code
- Geolocalização

Esses conceitos podem aparecer depois, mas só se o uso real pedir.
