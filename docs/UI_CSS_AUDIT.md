# Auditoria UI/CSS — estado atual

Este documento registra o guardrail técnico de UI/CSS. Ele complementa `FRONTEND.md` e `UI_PRIMITIVES_GUIDE.md`.

Propósito deste arquivo: explicar como interpretar o script de auditoria e quais padrões não devem voltar. Ele não define comportamento de produto nem API das primitives.

## Objetivo da auditoria

Reduzir dependência de:

- overrides locais em CSS Modules;
- CSS de feature recriando superfície de primitive;
- classes soltas usadas para corrigir `Button`, `Badge`, `Card`, `DisclosureCard`, `PresenceIndicator` ou barras fixas;
- regras visuais repetidas sem variante oficial.

Hierarquia desejada:

```txt
tokens -> primitives de UI -> componentes shared/feature -> páginas
```

## Estado esperado

Depois do ciclo de refatoração UI/CSS, o estado esperado do audit é:

| Severidade | Esperado | Interpretação |
| --- | ---: | --- |
| Alta | 0 | bloqueante; não deve existir |
| Média | 0 | bloqueante em PR normal; indica primitive sendo corrigida localmente |
| Baixa | permitido | fila de revisão, não bloqueio automático |

Fotografia recente do projeto:

```txt
Findings: 86
Alta: 0
Média: 0
Baixa: 86
```

Os baixos restantes são aceitos pelo guardrail porque caem principalmente em:

- skeleton/loading: 40;
- tokens de texto/cor em composição local: 33;
- implementação interna de primitive/layout: 13.

Não tente zerar baixos por contagem. Só refatore baixo quando houver repetição real ou quando a classe estiver corrigindo uma primitive base.

## Comandos

Comando padrão:

```bash
npm run audit:ui-css
```

Modo estrito para PR ou CI. Deve falhar com achados altos ou médios, mas não com baixos:

```bash
npm run audit:ui-css:strict
```

Revisão de baixos:

```bash
npm run audit:ui-css:lows
```

Modo estrito total, útil apenas para investigação de dívida:

```bash
npm run audit:ui-css:strict-all
```

Saída JSON:

```bash
npm run audit:ui-css -- --json
```

Escopo específico:

```bash
npm run audit:ui-css -- --dir=src/features/check-in
```

## O que deve bloquear PR

| Severidade | Interpretação | Ação esperada |
| --- | --- | --- |
| Alta | camada fixa local, z-index crítico ou override visual perigoso | corrigir antes do merge |
| Média | CSS local competindo com primitive | criar prop/variante ou mover para primitive |
| Baixa | token/classe arbitrária potencialmente aceitável | revisar contexto; só refatorar se recorrente |

## Primitives fortalecidas

| Primitive | Responsabilidade consolidada |
| --- | --- |
| `Button` / `ButtonLink` | variante, shape, densidade, alinhamento, largura responsiva e loading |
| `Badge` | tom, tamanho, shape, largura máxima, truncamento e resposta em mobile estreito |
| `Card` / `CardLink` / `PriorityCard` | superfície, padding, radius, elevação, accent, layout e prioridade |
| `ActionPill` | ação visual compacta dentro de cards/listas |
| `StatusCard` | superfície semântica com status |
| `FilterChip` | chips de filtro de estruturas e períodos |
| `FixedActionBar` | barra fixa inferior com safe-area e reserva de espaço |
| `BottomSheet` | camada inferior/modal com overlay e foco visual |
| `DisclosureCard` | accordion/disclosure com superfície e foco consistentes |
| `InputField` / `SelectField` / `TextareaField` | controles de formulário com label, erro, required e foco |
| `PresenceIndicator` / `PresenceMetricDisplay` / `PresenceProgressDisplay` | presença visual, ausência de dado e progresso |

## Padrões que não devem voltar

### Botões

Não use `className` para corrigir shape, densidade, alinhamento ou largura de `Button`/`ButtonLink`. Use props como:

```tsx
<Button shape="pill" density="compact" responsiveWidth="fullUntilSm" />
<ButtonLink align="between" shape="rounded" />
```

### Badges

Não corrija largura, truncamento ou shape localmente. Use props como `maxWidth`, `truncate`, `responsive` e `shape`.

### Cards

Feature não deve recriar superfície completa de card. Use `Card`, `CardLink`, `PriorityCard` ou `StatusCard` para borda, background, shadow, radius, padding, accent e min-height.

CSS Module de feature deve ficar limitado a layout interno, grid, alinhamento, pseudo-elementos locais e microestrutura do domínio.

### Barras fixas e sheets

Não use `position: fixed`, `z-index` e safe-area em CSS Module de feature para barra inferior ou sheet. Use `FixedActionBar` e `BottomSheet`.

### Formulários

Não crie strings locais de input/select para radius, border, background, foco e erro. Use `InputField`, `SelectField`, `TextareaField`, `FieldError` e `RequiredBadge`.

### Disclosure/accordion

Não estilize `details`/`summary` diretamente em feature. Use `DisclosureCard`.

### Wrappers finos

Não crie componente compartilhado que só repassa uma linha para outra primitive. Wrapper só vale quando:

- preserva compatibilidade pública relevante;
- nomeia uma semântica real do produto;
- concentra regra visual ou acessibilidade reutilizada;
- reduz repetição significativa.

## Pendências intencionais

Os baixos restantes são uma fila de revisão, não dívida urgente. Casos aceitáveis:

- tokens usados diretamente para texto, cor ou largura em layout local;
- skeleton/loading states;
- implementação interna de primitive;
- ajustes únicos de composição sem impacto em primitive;
- telas especiais, como login, desde que não contaminem primitives globais.

Casos que devem virar tarefa:

- mesmo ajuste aparece em três ou mais telas;
- `className` muda superfície, foco, tamanho ou densidade de uma primitive;
- CSS Module de feature volta a controlar border, background, shadow e radius de card;
- nova camada fixa é criada fora de `FixedActionBar` ou `BottomSheet`.

## Checklist visual para mudanças futuras

### Viewports

- [ ] 320 px.
- [ ] 360 px.
- [ ] 390 px.
- [ ] 430 px.
- [ ] Altura curta com barras de navegador ou teclado.

### Temas e texto

- [ ] Claro.
- [ ] Escuro.
- [ ] Pergaminho.
- [ ] Tamanho de texto padrão.
- [ ] Tamanho de texto ampliado.

### Fluxos prioritários

- [ ] Login.
- [ ] Homes por papel.
- [ ] Lista de células/equipe/membros.
- [ ] Detalhe de célula.
- [ ] Detalhe de pessoa.
- [ ] Lista e detalhe de encontros.
- [ ] Check-in com save bar.
- [ ] Formulário de célula.
- [ ] Busca e filtros.

### Sobreposição e legibilidade

- [ ] Último item de lista não fica atrás de `BottomNav`.
- [ ] Último item de check-in não fica atrás de `FixedActionBar`.
- [ ] `BottomSheet` não compete com `FixedActionBar`.
- [ ] Popovers de data/hora não ficam sob navegação inferior.
- [ ] Foco visível aparece em botões, links, chips, campos, disclosures e sheets.
- [ ] Badges e textos auxiliares continuam legíveis em mobile pequeno.

## Rotina recomendada para PRs

1. Rodar `npm run audit:ui-css`.
2. Corrigir achado alto ou médio novo antes do merge.
3. Revisar achado baixo novo e justificar se for caso único.
4. Atualizar `UI_PRIMITIVES_GUIDE.md` quando uma variante oficial nova for criada.
