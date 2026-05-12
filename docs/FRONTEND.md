# Front-end visual — Koinonia Lite

Este documento é a fonte de verdade para a organização visual do front-end: componentes React, CSS, primitives, loading states e regras de manutenção da interface.

Não governa regras de produto, permissões, banco, autenticação ou vocabulário. Para esses assuntos, use `PRODUCT.md`, `ARCHITECTURE.md` e `GLOSSARY.md`.

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
  Exemplos: ProgressiveList, PresenceMetric, StructureSearch, base cards, person cards e loading skeletons.

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

Use tokens CSS para decisões de design:

```txt
className="text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]"
```

Regras:

- tamanho de texto deve usar `--text-*`, não `text-xs`, `text-sm` ou `text-[11px]`;
- cor arbitrária com variável deve declarar o tipo `color:` e usar um token completo, por exemplo `text-[color:var(--color-text-secondary)]`;
- superfície, borda, sombra e radius devem reutilizar tokens ou primitives existentes;
- classes condicionais devem usar `cn()`;
- variantes visuais devem ficar em maps tipados ou em primitives, não como strings soltas espalhadas.

## Primitives de UI

Antes de criar markup visual novo, confira `src/components/ui`.

Primitives atuais de uso preferencial:

```txt
ActionPanel
Avatar
Badge
Button
ButtonLink
Card
CardHeader
CardLink
Feedback
Field
FilterChip
ListLinkCard
PriorityCard
SectionHeader
Skeleton
SummaryCard / MetricRow
TimePickerField
```

Uma primitive em `ui` deve:

- ser reutilizável fora de uma feature;
- não importar helpers de domínio;
- não conter texto pastoral fixo;
- aceitar variações por props explícitas;
- manter acessibilidade básica no próprio componente quando aplicável.

Não crie uma primitive nova apenas para esconder uma linha de Tailwind usada uma única vez.

## Componentes de domínio

Componentes em `src/features/*/components` podem conhecer a feature e usar linguagem pastoral.

Regras:

- páginas devem importar componentes da própria feature quando o componente for específico daquele domínio;
- evitar import visual entre features diferentes;
- se duas features precisarem do mesmo padrão, subir para `src/components/shared` ou `src/components/ui`;
- lógica de ordenação, filtros e labels complexos deve ficar em `*-view.ts`, não no meio do JSX;
- componente client-side não deve importar Prisma Client nem helper server-only.

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
