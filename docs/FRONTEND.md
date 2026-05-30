# Front-end visual — Koinonia Lite

Este documento é a fonte de verdade para a organização visual do front-end: componentes React, CSS, primitives, loading states e regras de manutenção da interface.

Não governa regras de produto, permissões, banco, autenticação ou vocabulário. Para esses assuntos, use `PRODUCT.md`, `ARCHITECTURE.md` e `GLOSSARY.md`.

Leia este arquivo depois de `PRODUCT.md`, `GLOSSARY.md` e `ARCHITECTURE.md`. Ele explica como a interface deve ser construída, não o que cada papel pode fazer.

## Objetivo

Manter a interface simples de entender, segura para evoluir e sem CSS global de componente.

Critério de decisão:

```txt
O componente deixa a próxima mudança visual mais simples e menos arriscada?
```

Se não deixar, não crie nova abstração.

## Responsabilidade das pastas

```txt
src/app
  Rotas, páginas, layouts, loading.tsx, actions e API handlers.
  Páginas devem compor dados e componentes, não concentrar markup visual repetido.

src/components/ui
  Primitives visuais reutilizáveis e sem regra de domínio.
  Exemplos: Button, ButtonLink, Card, CardLink, CardHeader, ListLinkCard, Badge, Field, Avatar, Skeleton.

src/components/layout
  Shell, navegação inferior, inicializadores e controles globais de tema/tamanho do texto.

src/components/shared
  Componentes compartilhados entre features, mas ainda ligados à apresentação do produto.
  Exemplos: ProgressiveList, PresenceMetricDisplay, StructureSearch, base cards, person cards e loading skeletons.

src/features/*/components
  Componentes visuais de domínio. Podem usar linguagem e dados da feature.

src/features/*/*-view.ts
  Helpers de apresentação, ordenação, filtros e composição de dados para uma tela.
  Devem manter regras testáveis fora do JSX quando a lógica crescer.

src/styles
  CSS global de fundação apenas: tokens, base, layout, utilitários e motion.
```

## CSS global

`src/app/globals.css` deve importar somente a fundação visual:

```css
@import "tailwindcss";

@import "../styles/tokens.css";
@import "../styles/base.css";
@import "../styles/layout.css";
@import "../styles/utilities.css";
@import "../styles/motion.css";
```

Regras:

- não recriar `components.css` ou `legacy-components.css`;
- não adicionar classe global específica de tela ou componente;
- não depender da ordem global para resolver conflito visual de componente;
- utilitários globais devem ser pequenos, compartilhados e baseados em tokens;
- classes `k-*` são utilitários compartilhados de tipografia/composição, não estilos de domínio.

## CSS Modules

Use `.module.css` quando o estilo for local e uma destas condições existir:

- seletores filhos ou pseudo-elementos relevantes;
- estado visual composto;
- media query ou ajuste responsivo difícil de ler em Tailwind;
- animação específica;
- risco de conflito se a regra for global.

Coloque o módulo ao lado do componente que o usa:

```txt
src/features/groups/components/group-form.tsx
src/features/groups/components/group-form.module.css
```

Evite CSS Module para um componente pequeno que fica claro com Tailwind no `className`.

## Tailwind, tokens e classes

Use Tailwind para layout, espaçamento, grid, flex e composição simples.

Use tokens CSS para decisões de design. Em JSX real, classes arbitrárias com variável devem declarar o tipo do valor, como `length:` para texto e `color:` para cor, sempre apontando para um token completo.

Regras:

- tamanho de texto deve usar `--text-*`, não classes nativas de tamanho ou valores fixos em pixel;
- cor arbitrária com variável deve declarar o tipo `color:` e usar um token completo, como `--color-text-secondary`;
- superfície, borda, sombra e radius devem reutilizar tokens ou primitives existentes;
- classes condicionais devem usar `cn()`;
- variantes visuais devem ficar em maps tipados ou em primitives, não como strings soltas espalhadas.

### Documentação e Tailwind

O Tailwind v4 pode detectar classes dentro de Markdown. Em documentação, evite exemplos literais de classes arbitrárias, principalmente com placeholders. Descreva a regra em texto ou use tokens isolados. Nunca escreva exemplos com `...` dentro de uma classe arbitrária.


## Temas, contraste e estados visuais

A interface mantém três temas locais: claro, pergaminho e escuro. Todos devem preservar a mesma hierarquia, não apenas trocar a paleta.

Regras de manutenção:

- tokens em `src/styles/tokens.css` são a fonte para superfícies, texto, estados, bordas, foco e sombras;
- textos primários e secundários devem manter contraste confortável nos três temas;
- placeholders, ícones de campo, chips, badges e indicadores pequenos não devem depender de tons de borda muito claros;
- badges de risco, atenção, cuidado, apoio e estabilidade devem usar par `fundo + borda + texto` do token sem sobrescrever cor localmente;
- tema pergaminho deve ter separação clara entre fundo, cards e controles, evitando superfície translúcida que misture texto e textura;
- tema escuro deve reforçar borda/divisor/foco o suficiente para cards e filtros não desaparecerem.

Ao alterar uma primitive, valide pelo menos: login, dashboard, lista com filtros, formulário, detalhe e check-in em claro, pergaminho e escuro.


## Login e autenticação visual

A tela de login é pública, mas deve seguir as mesmas regras de acessibilidade visual do app autenticado:

- o botão principal deve ter estado de envio para impedir duplo clique/toque;
- erro de credenciais deve usar `role="alert"`, ser associado aos campos por `aria-describedby` e marcar `aria-invalid`;
- o erro deve ser limpo da URL e também desaparecer quando o usuário editar e-mail ou senha;
- o campo de e-mail deve usar teclado adequado em mobile;
- a ação de mostrar/ocultar senha deve ter `aria-label` e `aria-pressed`;
- orientação sobre senha esquecida deve ser texto de suporte, não fluxo público de recuperação, enquanto isso estiver fora do escopo do MVP.

## Primitives de UI

Antes de criar markup visual novo, confira `src/components/ui` e o guia detalhado em `docs/UI_PRIMITIVES_GUIDE.md`.

Primitives atuais de uso preferencial:

```txt
ActionPanel
ActionPill
Avatar
Badge
BottomSheet
Button
ButtonLink
Card
CardHeader
CardLink
DisclosureCard
Feedback
Field / InputField / SelectField / TextareaField / FieldError / RequiredBadge
FilterChip
FixedActionBar / FixedActionBarContent
ListLinkCard
PriorityCard
SectionHeader
Skeleton
StatusCard
SummaryCard / MetricRow
TimePickerField
```

Uma primitive em `ui` deve:

- ser reutilizável fora de uma feature;
- não importar helpers de domínio;
- não conter texto pastoral fixo;
- aceitar variações por props explícitas;
- manter acessibilidade básica no próprio componente quando aplicável;
- centralizar superfície, foco, safe-area, camada fixa ou densidade quando esses pontos forem parte do padrão visual.

Não crie uma primitive nova apenas para esconder uma linha de Tailwind usada uma única vez. Crie variante ou primitive quando o ajuste se repetir ou quando o ajuste local estiver corrigindo um componente base.

### Guardrail de overrides locais

Use o script de auditoria para revisar mudanças de UI:

```bash
npm run audit:ui-css
```

Use o modo estrito em PRs sensíveis ou CI. Ele deve falhar com achados altos ou médios, mas não com baixos:

```bash
npm run audit:ui-css:strict
```

Para revisar os achados baixos por categoria, use:

```bash
npm run audit:ui-css:lows
```

Use o modo estrito total apenas quando a intenção for investigar todos os baixos:

```bash
npm run audit:ui-css:strict-all
```

Achados altos e médios devem ser corrigidos antes de merge. Achados baixos são uma fila de revisão: só promova para primitive quando o padrão for recorrente ou quando o ajuste estiver brigando com um componente base. O fechamento da auditoria e o checklist ficam em `docs/UI_CSS_AUDIT.md`.

## Componentes Compartilhados Importantes

Use estes componentes antes de criar variações locais:

| Componente | Uso |
| --- | --- |
| `AppShell` | header, conteúdo e navegação inferior do app autenticado |
| `BottomNav` | navegação mobile por papel; não deve aparecer em check-in, formulários de criação/edição ou fluxos com ação crítica |
| `ThemeToggle` | alternância de tema |
| `TextSizeToggle` | alternância de tamanho do texto |
| `ProgressiveList` | listas curtas com `Ver mais` / `Mostrar menos` |
| `StructureSearch` | busca e filtros de superfícies estruturais |
| `PresenceMetricDisplay` | métrica compacta de presença com indicador visual |
| `PresenceIndicator` | anel visual de presença |
| `PresenceProgressDisplay` | percentual com barra de progresso |
| `SignalHeartIndicator` | indicador pastoral com coração, cor e rótulo opcional para status de pessoa/sinal |
| `PersonMiniCard` | card compacto de pessoa para listas; remove subtítulo que repete o chip |
| `FilterContextCard` | mensagem curta que explica o recorte ativo de filtros estruturais |
| `NextActionCard` | card compartilhado para primeiro cuidado quando a home usa esse padrão |
| `NextPastoralActionCard` | wrapper de domínio usado pelo pastor/admin depois do radar |
| `CareOverviewCard` | card de domínio no detalhe da pessoa para resumir status, contexto e próximo gesto |

Regras:

- check-in usa barra fixa própria, oculta `BottomNav`, protege saída quando existem alterações não salvas e oferece filtros rápidos por status de presença;
- formulários de criação/edição dentro do app, como nova/editar célula, ocultam `BottomNav`, usam barra fixa de ação e protegem saída quando existem alterações não salvas;
- telas consultivas e listagens mantêm `BottomNav`;
- full-page screenshots ou validações visuais podem ocultar `BottomNav`, mas isso não muda o comportamento real da tela;
- indicadores de presença devem reutilizar `src/components/shared/presence-metric.tsx`;
- quando não houver dado de presença, indicador e texto devem comunicar ausência de dado, não risco.
- formulários com alteração sensível, como desativar célula ativa, devem pedir confirmação antes de enviar.
- dashboards pastorais podem usar uma única próxima ação quando isso reduzir a decisão; líder, supervisor e pastor não precisam ter a mesma composição visual;

## Componentes de domínio

Componentes em `src/features/*/components` podem conhecer a feature e usar linguagem pastoral.

Regras:

- páginas devem importar componentes da própria feature quando o componente for específico daquele domínio;
- evitar import visual entre features diferentes;
- se duas features precisarem do mesmo padrão, subir para `src/components/shared` ou `src/components/ui`;
- lógica de ordenação, filtros e labels complexos deve ficar em `*-view.ts`, não no meio do JSX;
- cartões de próxima ação dos dashboards devem receber dados já resolvidos pelo `*-view.ts`, mantendo prioridade, destino e CTA fora do JSX da página.
- detalhes consultivos devem evitar CTAs redundantes quando a própria tela já oferece filtros, listas ou ações naturais; nesses casos, prefira mensagem contextual ou diagnóstico.
- o detalhe da pessoa deve começar o acompanhamento por um resumo decisório antes do histórico: status, contexto pastoral e próximo gesto.
- componente client-side não deve importar Prisma Client nem helper server-only.

### Dashboards pastorais

As homes de líder, supervisor e pastor começam com uma leitura curta do momento, mas cada papel usa uma composição própria:

- líder: `PulseCard`, seções compactas por intenção pastoral (`PastoralSignalSection` e `InCareSection`) e encontro relevante;
- supervisor: `PulseCard` e `SupervisorFocusPanel`, priorizando o primeiro cuidado da supervisão;
- pastor/admin: `PastorRadarCard`, `NextPastoralActionCard` quando houver prioridade clara, busca e cards de saúde/equipe.

Regras:

- calcular prioridade em `leader-page-view.ts`, `supervisor-page-view.ts` ou `pastor-page-view.ts`;
- priorizar urgente, pedido de apoio, atenção, cuidado ativo e, por fim, estabilidade;
- usar CTA específico (`Ver pedido`, `Acompanhar pessoa`, `Ver células em atenção`, `Ver equipe`), evitando `Abrir` genérico;
- manter listas compactas e com `Ver mais` quando necessário;
- não repetir no subtítulo o mesmo status já exibido no chip.

### Detalhe de célula

O detalhe de célula deve priorizar diagnóstico, resumo e listas filtráveis. Não use card de próxima ação nesse detalhe: o usuário já consegue chegar às prioridades por pulso, filtros, membros e encontros.

Regras:

- manter o pulso pastoral como leitura de contexto, não como tarefa obrigatória;
- separar membros em `Sinais`, `Em cuidado` e `Ativos`; `Em cuidado` indica cuidado já iniciado, não novo alerta;
- no filtro `Todos`, mostrar o recorte prioritário sem esconder que outros sinais podem aparecer no detalhe;
- evitar CTAs redundantes para recortes que a própria tela já mostra;
- presença pendente continua visível no card próprio de encontro, sem virar um segundo CTA de próxima ação;
- links de ação devem existir apenas nos cards naturais da tela, como encontro pendente, edição de célula ou pessoa da lista.

### Encontros

Os cards de encontros ficam em `src/features/events/components/events-page-sections.tsx` e devem usar primitives para superfície e ação visual. A tela tem:

- cards de consulta `Pendências` e `Histórico`;
- lista de hoje;
- próximos encontros;
- variantes visuais para consulta de pendências e histórico.

Use `CardLink`, `PriorityCard`, `Badge`, `ActionPill` e `PresenceMetricDisplay` para superfície, status e ação visual. Mantenha `events-page-sections.module.css` focado em layout interno, grid, ícones e microestrutura da feature. Não promova estilos específicos de encontros para CSS global.

## Loading states

Skeletons ficam em:

```txt
src/components/shared/loading-skeletons
```

Arquivo de compatibilidade:

```txt
src/components/shared/page-loading-skeletons.tsx
```

Regras:

- `Skeleton` é o primitive base;
- skeleton de página deve imitar o shape visual, sem regra de domínio;
- novas rotas server-side perceptíveis devem ter `loading.tsx` próprio;
- não duplicar manualmente uma tela inteira quando um primitive de skeleton existente resolve.

## Imports recomendados

Padrão:

```tsx
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { StructureSearch } from "@/components/shared/structure-search";
import { GroupForm } from "@/features/groups/components/group-form";
```

Evite:

```txt
// componente de domínio antigo em src/components
import { GroupForm } from "@/components/group-form";

// feature importando visual específico de outra feature sem passar por shared/ui
import { GroupPendingEventCard } from "@/features/groups/components/group-pending-event-card";
```

## Checklist antes de alterar UI

1. Existe primitive em `src/components/ui` que já resolve?
2. O estilo é global de fundação ou local do componente?
3. A regra visual usa tokens existentes?
4. O componente ficou mais fácil de ler que o JSX original?
5. A lógica complexa saiu do JSX para helper testável?
6. O skeleton correspondente continua parecido com a tela real?
7. O import respeita `ui`, `layout`, `shared` e `features/*/components`?
8. Nenhuma classe global específica de tela foi adicionada?
9. Métricas de presença usam os componentes compartilhados?
10. Telas operacionais, como check-in, tratam navegação fixa, barras fixas e filtros de revisão sem sobrepor conteúdo?
11. `npm run audit:ui-css` não introduziu achado alto ou médio?
12. Se apareceu achado baixo novo, ele é caso único e justificado?
13. A mudança foi validada em viewport mobile pequena e nos temas claro, escuro e pergaminho?
