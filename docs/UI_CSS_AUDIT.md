# Auditoria UI/CSS — fechamento

Este documento registra o estado final da auditoria técnica de UI/CSS mobile-first. Ele complementa `FRONTEND.md` e deve ser usado para revisar futuras mudanças visuais antes de criar overrides locais.

## Objetivo da auditoria

Reduzir dependência de overrides locais, CSS Modules com responsabilidade de primitive e classes soltas usadas para corrigir casos específicos. A hierarquia desejada continua sendo:

```txt
tokens → primitives de UI → componentes compartilhados/de feature → páginas
```

A auditoria não alterou regra de negócio, vocabulário de produto, permissões, fluxo de dados ou comportamento server-side.

## Resultado consolidado

| Momento | Total | Alta | Média | Baixa |
| --- | ---: | ---: | ---: | ---: |
| Após criação do guardrail inicial | 274 | 4 | 72 | 198 |
| Fechamento da etapa 9 | 177 | 0 | 0 | 177 |
| Após patches estruturais de UX | 195 | 0 | 62 | 133 |

Leitura correta do resultado atual:

- `alta: 0` continua sendo o principal bloqueio de merge: não há alertas estáticos de camada fixa, z-index local crítico ou override direto de tamanho em primitives críticas.
- `média: 62` reflete achados conservadores em superfícies e composição local após os patches de UX; eles não são regressões bloqueantes, mas devem ser revisados por lote antes de novas expansões visuais.
- `baixa: 133` não significa bug visual. A regra baixa aponta classes arbitrárias com tokens e serve como lembrete de revisão, não como bloqueio automático.

A revisão histórica de baixos separava os 177 achados em categorias operacionais. Após novos patches, use `npm run audit:ui-css` e `npm run audit:ui-css:lows` para obter a fotografia atual antes de promover novos padrões.

A revisão de baixos histórica separava os 177 achados em categorias operacionais:

| Disposição | Quantidade atual | Leitura | Ação |
| --- | ---: | --- | --- |
| Aceitável | 98 | Uso local de tokens, skeleton/loading state ou implementação interna de primitive | Manter, salvo repetição clara |
| Candidato | 29 | Pode representar superfície, ação ou densidade que talvez mereça primitive | Revisar por lote |
| Revisar | 6 | Visual isolado, principalmente login | Avaliar contexto antes de refatorar |

Categorias atuais:

| Categoria | Quantidade | Interpretação |
| --- | ---: | --- |
| `tokens/typography-color` | 51 | Tokens de texto/cor aplicados em composição local |
| `layout/skeleton-loading` | 34 | Skeletons e estados de carregamento |
| `system/primitive-internal` | 13 | Implementação interna de primitive ou layout global |
| `candidate/local-surface` | 22 | Possíveis superfícies locais ainda não promovidas para primitive |
| `candidate/control-or-action` | 7 | Possíveis controles/ações locais |
| `review/login-contained` | 6 | Visual especial da tela de login |

## Guardrail disponível

Comando padrão:

```bash
npm run audit:ui-css
```

Modo estrito para CI ou revisão de PR. Este modo deve falhar com achados `alta` ou `média`, mas não com achados `baixa`:

```bash
npm run audit:ui-css:strict
```

Modo estrito total, útil apenas em investigação de dívida de UI, também falhando com achados `baixa`:

```bash
npm run audit:ui-css:strict-all
```

Saída completa:

```bash
npm run audit:ui-css -- --max-findings=0
```

Revisão dos achados baixos por categoria:

```bash
npm run audit:ui-css:lows
```

Saída JSON com resumo por regra, categoria baixa e disposição:

```bash
npm run audit:ui-css -- --json
```

Escopo específico:

```bash
npm run audit:ui-css -- --dir=src/features/check-in
```

## O que agora deve bloquear PR

Bloqueie ou revise com cuidado quando aparecer:

| Severidade | Interpretação | Ação esperada |
| --- | --- | --- |
| Alta | Risco de sobreposição, camada fixa local ou override crítico em primitive | Corrigir antes do merge |
| Média | CSS local competindo com primitive de UI | Criar prop/variante ou mover para primitive |
| Baixa | Classe arbitrária ou token inline que pode ser aceitável | Revisar contexto; só refatorar se for recorrente |

## Primitives criadas ou fortalecidas

| Primitive | Responsabilidade |
| --- | --- |
| `Button` / `ButtonLink` | Ações principais, links-botão, shape, densidade, alinhamento e largura responsiva |
| `Badge` | Status textual, largura máxima, truncamento, shape e tamanho |
| `Card` / `CardLink` / `PriorityCard` | Superfície, padding, radius, elevação, prioridade e accent |
| `ActionPill` | Ação visual não interativa dentro de cards/listas |
| `StatusCard` | Card com tom/status e accent lateral |
| `FixedActionBar` | Barra fixa inferior com safe-area e reserva dinâmica de espaço |
| `BottomSheet` | Camada inferior/modal com overlay, z-index e safe-area centralizados |
| `DisclosureCard` | Disclosure/accordion baseado em `details`/`summary` com foco e superfície consistentes |
| `InputField` / `SelectField` / `TextareaField` | Controles de formulário com label, erro, required e foco padronizados |
| `PresenceIndicator` / `PresenceMetricDisplay` | Indicadores de presença com tamanhos e layout oficiais |

## Padrões que não devem voltar

### Botões

Não use `className` para corrigir shape, densidade, alinhamento ou largura de `Button`/`ButtonLink`. Use props como:

```tsx
<Button shape="pill" density="compact" responsiveWidth="fullUntilSm" />
<ButtonLink align="between" shape="rounded" />
```

### Badges

Não corrija largura, truncamento ou shape localmente. Use:

```tsx
<Badge size="sm" maxWidth="row" truncate />
```

### Cards

Feature não deve recriar superfície completa de card. Use `Card`, `CardLink`, `PriorityCard` ou `StatusCard` para borda, background, shadow, radius, padding, accent e min-height.

CSS Module de feature deve ficar limitado a layout interno, grid, alinhamento e microestrutura do domínio.

### Barras fixas e sheets

Não use `position: fixed`, `z-index` e safe-area em CSS Module de feature para barra inferior ou sheet. Use:

```tsx
<FixedActionBar>...</FixedActionBar>
<BottomSheet onDismiss={...}>...</BottomSheet>
```

### Formulários

Não crie strings locais de input/select para radius, border, background, foco e erro. Use:

```tsx
<InputField label="Nome" required error={error} />
<SelectField label="Dia" icon={icon}>...</SelectField>
```

### Disclosure/accordion

Não estilize `details`/`summary` diretamente em telas. Use:

```tsx
<DisclosureCard title="Detalhes" tone="inset" size="sm">...</DisclosureCard>
```

## Riscos zerados pela auditoria

- Bottom navigation e barras inferiores passaram a ter contrato explícito.
- Save bar do check-in saiu de cálculo local de altura fixa.
- Status sheet do check-in saiu de camada fixa local.
- Componentes base deixaram de receber os principais overrides de geometria recorrente.
- CSS Modules de feature deixaram de recriar superfície completa de cards em eventos, grupos, check-in e equipe.
- Disclosures locais foram migrados para primitive.
- Formulários principais passaram a usar primitives de campo.

## Pendências intencionais

Os achados baixos restantes são uma fila de revisão, não uma dívida urgente. Use `npm run audit:ui-css:lows` para decidir o que é aceitável, o que é candidato a primitive e o que precisa apenas de revisão contextual. Priorize somente quando um padrão se repetir ou quando a classe estiver corrigindo uma primitive de UI.

Casos aceitáveis:

- tokens usados diretamente para texto, cor ou largura em layout de página;
- ajustes únicos de composição sem impacto em primitive;
- telas especiais com linguagem visual própria, como login, desde que não contaminem primitives globais.

Casos que devem virar nova tarefa:

- mesmo ajuste visual aparece em três ou mais telas;
- um `className` muda superfície, foco, tamanho ou densidade de uma primitive;
- CSS Module de feature volta a controlar border, background, shadow e radius de card;
- nova camada fixa é criada fora de `FixedActionBar` ou `BottomSheet`.

## Checklist de validação visual pós-refatoração

### Viewports

- [ ] 320 px de largura.
- [ ] 360 px de largura.
- [ ] 390 px de largura.
- [ ] 430 px de largura.
- [ ] Altura curta, simulando teclado ou navegador mobile com barras visíveis.

### Temas

- [ ] Claro.
- [ ] Escuro.
- [ ] Pergaminho.
- [ ] Tamanho de texto padrão.
- [ ] Tamanho de texto ampliado.

### Fluxos prioritários

- [ ] Login.
- [ ] Home pastoral.
- [ ] Primeiro cuidado aparece cedo quando a home usa esse padrão, sem competir com pulso ou radar.
- [ ] Lista de células.
- [ ] Detalhe de célula sem card redundante de próxima ação, mantendo pulso, filtros e listas claros.
- [ ] Detalhe de pessoa com próximo cuidado, motivo da atenção, histórico e registro pastoral.
- [ ] Lista de eventos.
- [ ] Detalhe de evento com orientação pastoral não obrigatória quando houver ausente/justificado/pendente.
- [ ] Check-in com save bar.
- [ ] Check-in com status sheet aberto.
- [ ] Estrutura/equipe com disclosures.
- [ ] Busca e filtros.

### Sobreposição

- [ ] Primeiro cuidado das homes não compete visualmente com busca, radar, pulso ou cards analíticos.
- [ ] Card de próximo cuidado no detalhe da pessoa não compete com sinal aberto nem com registro de cuidado.
- [ ] Último item de lista não fica atrás de `BottomNav`.
- [ ] Último item de check-in não fica atrás de `FixedActionBar`.
- [ ] `BottomSheet` não compete com `FixedActionBar`.
- [ ] Popovers de data/hora não ficam sob navegação inferior.
- [ ] Conteúdo com teclado aberto continua acessível nos formulários principais.

### Acessibilidade visual

- [ ] Foco visível aparece em botões, links, chips, campos, disclosures e sheets.
- [ ] Badges mantêm contraste suficiente nos três temas.
- [ ] Placeholders, ícones pequenos, chips e indicadores da bottom nav continuam legíveis em claro, pergaminho e escuro.
- [ ] Tema pergaminho separa claramente fundo, card, controle e borda sem depender de transparência excessiva.
- [ ] Tema escuro reforça bordas/divisores o suficiente para listas, filtros e barras fixas.
- [ ] Estados hover/active/focus não mudam drasticamente entre primitives.
- [ ] Texto auxiliar e conteúdo de badges continuam legíveis em telas pequenas.
- [ ] Ações compactas continuam com alvo de toque confortável.

## Rotina recomendada para PRs

1. Rodar `npm run audit:ui-css`.
2. Se houver achado alto ou médio novo, corrigir antes do merge.
3. Se houver achado baixo novo, justificar se for caso único ou promover para primitive se for recorrente.
4. Validar viewport mobile pequena quando mexer em fixed/sticky/sheet/form.
5. Atualizar `UI_PRIMITIVES_GUIDE.md` quando uma nova variante oficial for criada.
