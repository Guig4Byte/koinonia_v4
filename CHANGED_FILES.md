# Alterações nesta entrega

- `src/components/bottom-nav.tsx`
  - Usa tokens próprios de fundo, borda e sombra para o bottom nav.
  - Mantém o item ativo mais sólido sobre o nav translúcido.
- `src/app/globals.css`
  - Ajusta os tokens do bottom nav nos temas claro, pergaminho e escuro para um efeito translúcido controlado.
- `src/app/(app)/eventos/[eventId]/page.tsx`
  - Compacta o resumo somente leitura de presença registrada.
  - Mostra contadores de membros, presentes, ausentes e justificativas no topo do card.
  - Prioriza ausentes, justificativas e pendências; membros presentes ficam recolhidos em `Ver presentes`.
- `docs/PRODUCT.md`
  - Registra a regra de escaneabilidade mobile para resumo somente leitura de presença.
- `src/app/(app)/equipe/page.tsx`
  - Garante que o filtro `Todos` mostre todos os supervisores ativos, inclusive supervisores sem célula ativa vinculada.
  - Mantém os filtros `Pedem atenção` e `Sem presença recente` restritos a supervisores que tenham células no recorte escolhido.
  - Troca a abertura de listas por `ProgressiveList`, mostrando supervisores de 4 em 4.
  - Dentro de cada supervisor, as células também passam a aparecer de 4 em 4 com `Ver mais células`.
  - A seção `Sem supervisor` também usa paginação progressiva de 4 em 4.

## Regra aplicada

- `Equipe` é a leitura da estrutura pastoral: por padrão, mostra todos os supervisores.
- Os filtros refinam a estrutura, mas não mudam o significado da tela para uma fila de sinais.
- Listas longas crescem progressivamente, sempre de 4 em 4.
