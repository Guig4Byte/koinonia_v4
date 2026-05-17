# Guia de primitives UI

Este guia resume como usar as primitives visuais do projeto depois da auditoria UI/CSS. A regra geral é simples:

```txt
Se o ajuste visual corrige uma primitive ou se repete em mais de uma tela, ele deve virar prop, variante ou primitive reutilizável.
```

Use este documento junto com `FRONTEND.md` e `UI_CSS_AUDIT.md`.

## Camadas de responsabilidade

| Camada | Pode decidir | Não deve decidir |
| --- | --- | --- |
| Tokens | cores, sombras, radius, tipografia, espaçamento-base | regra de domínio |
| `src/components/ui` | superfície, foco, densidade, estado visual, acessibilidade básica | texto pastoral fixo, queries, regras de feature |
| `src/components/shared` | apresentação reutilizável ligada ao produto | regra server-only ou Prisma |
| `src/features/*/components` | layout interno e linguagem da feature | recriar primitive global |
| `src/app` | composição de rota e dados | markup visual repetido |

## Button e ButtonLink

Use para ações reais e links com aparência de botão.

Props principais:

| Prop | Valores | Uso |
| --- | --- | --- |
| `variant` | `primary`, `secondary`, `quiet`, `ghost`, `outline`, tons soft | intenção visual |
| `size` | `sm`, `md`, `lg` | altura base |
| `shape` | `default`, `rounded`, `pill` | forma |
| `density` | `default`, `compact`, `badge` | densidade interna |
| `align` | `center`, `left`, `between` | alinhamento do conteúdo |
| `responsiveWidth` | `auto`, `full`, `fullUntilSm` | comportamento em mobile |

Exemplos:

```tsx
<Button variant="primary" size="md">Salvar</Button>
<Button variant="secondary" size="sm" shape="pill" density="compact">Filtrar</Button>
<ButtonLink href="/eventos" align="between" shape="rounded">Abrir evento</ButtonLink>
```

Evite passar `className` para alterar padding, radius, largura, alinhamento ou texto. Crie uma prop nova quando faltar variação oficial.

## Badge

Use para status textual curto, rótulos e indicadores compactos.

Props principais:

| Prop | Valores | Uso |
| --- | --- | --- |
| `tone` | `neutral`, `ok`, `warn`, `risk`, `info`, `care`, `support` | tom semântico |
| `size` | `xs`, `sm`, `md` | densidade |
| `shape` | `pill`, `rounded` | forma |
| `maxWidth` | `full`, `none`, `header`, `tightHeader`, `list`, `row`, `narrow` | limite de largura |
| `truncate` | boolean | truncamento oficial |

Exemplo:

```tsx
<Badge tone="warn" size="sm" maxWidth="row" truncate>Pendente</Badge>
```

## Card, CardLink e PriorityCard

Use para superfícies reutilizáveis. A feature deve controlar o conteúdo interno, não a superfície externa.

### Card

Props principais:

| Prop | Valores | Uso |
| --- | --- | --- |
| `tone` | `default`, `featured`, `inset`, `dashed`, `transparent` | tipo de superfície |
| `padding` | `none`, `sm`, `md`, `lg` | espaçamento interno |
| `radius` | `default`, `sm`, `lg` | arredondamento |
| `elevation` | `auto`, `none`, `card`, `soft` | sombra |
| `containment` | `visible`, `hidden` | overflow |
| `minHeight` | `none`, `sm`, `md` | altura mínima |
| `statusTone` | `none`, `care`, `warning`, `success`, `danger`, `info` | superfície com status |

```tsx
<Card tone="inset" padding="sm" radius="sm" statusTone="care">...</Card>
```

### CardLink / PriorityCard

Use para cards clicáveis e superfícies com prioridade visual.

Props relevantes:

| Prop | Valores | Uso |
| --- | --- | --- |
| `surface` | `default`, `brand`, `consultation`, `spotlight`, `spotlightCompact` | preset de superfície |
| `priorityTone` | tons de prioridade aceitos pelo card | tom/accent |
| `padding` | `none`, `xs`, `sm`, `relaxedSm`, `md`, `lg` | densidade |
| `accent` | `none`, `left` | accent lateral |
| `minHeight` | `none`, `sm`, `md` | altura mínima |

```tsx
<CardLink href={href} surface="spotlight" padding="xs" radius="sm" containment="hidden">...</CardLink>
```

## ActionPill

Use quando um card precisa exibir uma ação visual compacta, mas o elemento em si não é o controle interativo principal. Em geral, o card inteiro é o link.

Props:

| Prop | Valores |
| --- | --- |
| `tone` | `secondary`, `primary`, `prioritySoft` |
| `size` | `xs`, `sm`, `md` |
| `minWidth` | `none`, `action` |
| `iconBefore` / `iconAfter` | ícone opcional |

```tsx
<ActionPill tone="primary" size="sm" minWidth="action" iconBefore={<Icon />}>Registrar</ActionPill>
```

## StatusCard

Use para cards cujo significado visual depende de um status.

Props:

| Prop | Valores |
| --- | --- |
| `tone` | `neutral`, `success`, `danger`, `warning`, `info`, `care` |
| `padding` | `sm`, `md` |
| `radius` | `sm`, `default` |
| `containment` | `visible`, `hidden` |
| `as` | `article`, `section`, `div` |

```tsx
<StatusCard as="article" tone="success" padding="sm" radius="sm">...</StatusCard>
```

## Field, InputField, SelectField e TextareaField

Use para formulários comuns dentro do app. Eles centralizam label, descrição, required, erro, foco e estado disabled.

Props compartilhadas:

| Prop | Uso |
| --- | --- |
| `label` | label visível |
| `labelHidden` | mantém acessibilidade sem label visual |
| `description` | texto auxiliar |
| `error` | mensagem de erro e estado inválido |
| `required` | badge obrigatório |
| `size` | `sm` ou `md` |
| `surface` | `default` ou `muted` |
| `labelVariant` | `default` ou `item` |

```tsx
<InputField id="name" name="name" label="Nome" required error={error} />
<SelectField id="day" name="day" label="Dia" icon={icon}>...</SelectField>
<TextareaField id="notes" name="notes" label="Observações" resize="vertical" />
```

Use `FieldError` e `RequiredBadge` apenas quando precisar montar um controle especializado.

## FixedActionBar

Use para barras fixas inferiores com ações persistentes.

```tsx
<FixedActionBar>
  <Button>Salvar</Button>
</FixedActionBar>
```

Quando uma tela usa barra fixa, envolva o conteúdo que precisa reservar espaço com `FixedActionBarContent`.

```tsx
<FixedActionBarContent>
  ...lista...
</FixedActionBarContent>
```

Não crie safe-area, z-index ou bottom fixo em CSS Module de feature para esse padrão.

## BottomSheet

Use para sheet/modal inferior.

Props principais:

| Prop | Valores/Uso |
| --- | --- |
| `size` | `sm`, `md` |
| `tone` | `default`, `accent` |
| `onDismiss` | fechamento por backdrop |
| `dismissLabel` | label acessível do backdrop |
| `showHandle` | exibe ou oculta handle |
| `panelProps` | props de acessibilidade do painel |

```tsx
<BottomSheet onDismiss={close} panelProps={{ role: "dialog", "aria-modal": true }}>
  ...conteúdo...
</BottomSheet>
```

## DisclosureCard

Use para accordion/disclosure simples.

Props principais:

| Prop | Valores/Uso |
| --- | --- |
| `title` | título do summary |
| `description` | descrição opcional |
| `tone` | `default`, `inset`, `transparent` |
| `size` | `sm`, `md` |
| `layout` | `stacked`, `responsive` |
| `separatedContent` | borda entre summary e conteúdo |
| `action` | texto/ação lateral, ou `false` para ocultar |

```tsx
<DisclosureCard title="Detalhes" tone="inset" size="sm" defaultOpen={false}>
  ...conteúdo...
</DisclosureCard>
```

Não estilize `details`/`summary` diretamente em feature.

## PresenceIndicator e PresenceMetricDisplay

Use para métricas visuais de presença.

`PresenceIndicator`:

| Prop | Valores |
| --- | --- |
| `size` | `sm`, `compact`, `md`, `spotlight`, `lg` |
| `mode` | `ring`, `plain` |
| `weight` | `default`, `light` |
| `context` | `person`, `cell`, `event`, `attendance`, `overview` |

```tsx
<PresenceIndicator presenceRate={rate} size="spotlight" context="event" />
```

`PresenceMetricDisplay`:

| Prop | Uso |
| --- | --- |
| `minHeight` | `none` ou `sm` |
| `layout` e demais props existentes | composição da métrica |

```tsx
<PresenceMetricDisplay presenceRate={rate} minHeight="sm" />
```

Não force largura/altura do indicador via `className`.

## CSS Modules em features

CSS Module de feature pode cuidar de:

- grid e flex internos;
- espaçamento entre subpartes;
- pseudo-elemento específico de domínio;
- animação local que não seja primitive compartilhada;
- media query de composição da feature.

CSS Module de feature não deve cuidar de:

- superfície externa de `Card`, `CardLink`, `StatusCard` ou `PriorityCard`;
- foco de primitive;
- z-index/fixed stack de barra ou sheet;
- radius/padding/tamanho de `Button`, `Badge`, `InputField`, `SelectField` ou `PresenceIndicator`.

## Quando criar nova variante

Crie prop/variante quando:

- o mesmo ajuste apareceu em pelo menos três lugares;
- a classe local corrige uma primitive base;
- o ajuste afeta acessibilidade, foco, safe-area ou z-index;
- a mudança deveria ser consistente entre temas.

Não crie nova variante quando:

- o ajuste é layout único da tela;
- a regra só posiciona conteúdo interno;
- a composição é claramente de domínio e não se repete.
