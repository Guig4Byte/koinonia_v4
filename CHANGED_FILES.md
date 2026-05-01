# CHANGED_FILES

## Registro auxiliar

Este arquivo resume a última leva local de alterações. Ele não substitui as fontes de verdade do projeto:

- `README.md`
- `docs/AGENT_BRIEFING.md`
- `docs/PRODUCT.md`
- `docs/GLOSSARY.md`
- `docs/ARCHITECTURE.md`
- `docs/Perfil.txt`
- `docs/Koinonia.txt`

## Alteração atual

Ajuste aplicado nesta entrega: trocar a aba pastoral `Pessoas` por `Equipe` para pastor/admin, reduzindo duplicidade com `Visão` e movendo a leitura da estrutura de supervisores/células para uma superfície própria.

1. `src/app/(app)/equipe/page.tsx`
   - Nova tela `Equipe` para pastor/admin.
   - Mostra busca de pessoa, resumo da estrutura, supervisores e as células ativas supervisionadas por cada um.
   - Cada célula exibe líder, quantidade de membros, presença recente e casos pastorais.
   - Células ativas sem supervisor aparecem em seção própria quando existirem.

2. `src/features/dashboard/queries.ts`
   - Adicionado `getPastorTeamOverview(user)`.
   - A nova query agrupa células ativas por supervisor, calcula presença recente, membros ativos e casos pastorais por célula.
   - Mantém o recorte pastoral: a estrutura aparece para leitura e contexto, não como ranking ou cobrança.

3. `src/app/(app)/pastor/page.tsx`
   - A navegação passou de `Pessoas` para `Equipe`.
   - A lista de células saiu da `Visão` do pastor.
   - A `Visão` fica concentrada em busca, casos pastorais, cuidado pastoral e saúde geral.

4. `src/app/(app)/pessoas/page.tsx`
   - Pastor/admin acessando `/pessoas` agora é redirecionado para `/equipe`.
   - Líderes e supervisores continuam usando `Pessoas`/`Membros` como antes.

5. `src/app/(app)/eventos/page.tsx`
   - A navegação secundária agora aponta para `Equipe` quando o usuário é pastor/admin.
   - Líder continua vendo `Membros`; supervisor continua vendo `Pessoas`.

6. `src/app/(app)/eventos/[eventId]/page.tsx`
   - Mesmo ajuste de navegação secundária por papel.

7. `src/app/(app)/celulas/[groupId]/page.tsx`
   - Para pastor/admin, a célula passa a estar ligada à aba `Equipe` na navegação.
   - O link de voltar também retorna para `Equipe` no contexto pastoral.

8. `src/app/(app)/pessoas/[personId]/page.tsx`
   - Para pastor/admin, a navegação secundária mostra `Equipe` no lugar de `Pessoas`.
   - O detalhe da pessoa continua acessível por busca e mantém a lógica de cuidado existente.

## Correção posterior

Correção aplicada nesta entrega:

1. `src/app/(app)/celulas/[groupId]/page.tsx`
   - Restaurado o conteúdo da página de detalhe da célula, que estava vazio e causava erro do Next.js: `The default export is not a React Component`.
   - Mantida a navegação nova para pastor/admin, usando `Equipe` no lugar de `Pessoas` quando a célula é aberta a partir da estrutura pastoral.

Validação recomendada após aplicar:

```bash
npm run typecheck
npm test
```
