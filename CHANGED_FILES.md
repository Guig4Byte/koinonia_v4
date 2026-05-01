# Alterações desta entrega

## Objetivo

Refinar a aba `Equipe` para deixar a busca coerente com a função da tela: estrutura pastoral, supervisores e células — não busca global de pessoas.

## Arquivos alterados

- `src/app/(app)/equipe/page.tsx`

## Mudanças

- Removida a busca global de pessoa da aba `Equipe`.
- Adicionada busca local por `supervisor` ou `célula`.
- Adicionados filtros simples:
  - `Todos`;
  - `Pedem atenção`;
  - `Sem presença recente`.
- Lista de supervisores limitada a 4 cards iniciais, com `Ver mais supervisores`.
- Cards de supervisor ficaram mais fechados: mostram resumo primeiro e abrem as células em `Ver células acompanhadas`.
- Dentro de cada supervisor, são mostradas até 3 células inicialmente, com `Ver mais células` quando houver excedente.
- `Equipe` agora orienta o usuário a usar a busca da `Visão` para abrir perfil de pessoa.

## Observação

A busca local de `Equipe` não consulta membros/pessoas comuns. Ela filtra apenas a estrutura de cuidado: nomes de supervisores, e-mails de supervisores, nomes de células e liderança da célula.
