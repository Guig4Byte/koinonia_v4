# Arquitetura do Koinonia Lite

## Ideia central

O sistema é um radar pastoral simples.

```txt
Evento -> Presença -> Sinal -> Cuidado
```

A presença não é o fim. Ela é uma fonte de sinais para cuidado.

## Camadas

```txt
src/app
  Rotas, páginas e API handlers.

src/components
  Interface reutilizável. Deve permanecer burra sempre que possível.

src/features
  Regras de domínio por capacidade do produto.

src/lib
  Infraestrutura: banco, usuário atual, formatação e utilitários.
```

## Regras de ouro

1. API handler não deve conter regra pastoral complexa.
2. Regra de sinal fica em `src/features/signals`.
3. Página não deve saber como sinal é calculado.
4. Se uma funcionalidade gera burocracia, ela não entra no MVP.
5. Toda funcionalidade deve responder: isso ajuda alguém a cuidar melhor de uma pessoa?

## Autorização

Esta base usa usuário demo por cookie para acelerar validação de produto.

Ao implementar autenticação real, preserve o contrato:

```ts
getCurrentUser(): Promise<User>
```

E aplique escopo nas consultas:

- Pastor: igreja inteira
- Supervisor: grupos supervisionados
- Líder: grupos liderados

## Modelagem

### Entidades principais

- Church
- User
- Person
- SmallGroup
- GroupMembership
- Event
- Attendance
- CareSignal
- CareTouch

### O que não existe de propósito

- Task complexa
- SLA
- Playbook
- CRM pesado
- Dashboard analítico profundo

Esses conceitos podem aparecer depois, mas só se o uso real pedir.
