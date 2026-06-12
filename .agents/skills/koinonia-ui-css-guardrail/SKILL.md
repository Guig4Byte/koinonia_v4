---
name: koinonia-ui-css-guardrail
description: Use em mudanças de UI/CSS do Koinonia Lite para respeitar primitives, tokens, CSS Modules, mobile-first, auditoria UI/CSS e evitar overrides locais/dead CSS.
---

# Koinonia UI/CSS Guardrail

## Quando usar

Use esta skill quando a tarefa tocar layout, CSS, design system, responsividade, componentes visuais, telas mobile, loading states, cards, botões, badges, formulários, tema, ícones ou ajustes visuais.

## Documentos obrigatórios conforme escopo

- `docs/FRONTEND.md`
- `docs/UI_PRIMITIVES_GUIDE.md`
- `docs/UI_CSS_AUDIT.md`
- `docs/GLOSSARY.md` quando houver texto visível
- `docs/PRODUCT.md` quando a mudança afetar intenção de fluxo

## Estrutura visual do projeto

- `src/styles`: fundação global, tokens, base, layout, motion e utilitários.
- `src/components/ui`: primitives visuais sem regra de domínio.
- `src/components/shared`: componentes compartilhados ligados ao produto.
- `src/features/*/components`: componentes específicos de uma feature.
- CSS local deve ficar em `.module.css` próximo do componente que usa as classes.

## Regras inegociáveis

- Não recrie `components.css`, `legacy-components.css` ou CSS global de componente.
- Não sobreponha superfície, raio, borda, sombra, foco, densidade ou tipografia de primitive via `className` local sem verificar se já existe prop oficial.
- Não deixe CSS morto, classe órfã, import de CSS sem uso ou arquivo `.module.css` abandonado.
- Não use Tailwind arbitrário para corrigir design system sem avaliar token/variant.
- Não crie componente visual novo se uma primitive existente resolve com props.
- Não coloque regra de domínio dentro de `src/components/ui`.

## Primitives que devem ser verificadas antes de criar CSS novo

Procure primeiro em `src/components/ui`:

- `Button`, `ButtonLink`
- `Badge`
- `Card`, `CardLink`, `PriorityCard`, `StatusCard`, `SummaryCard`
- `ActionPill`
- `DisclosureCard`
- `FilterChip`
- `Field`, `InputField`, `SelectField`, `TextareaField`
- `FixedActionBar`
- `BottomSheet`
- `SignalHeartIndicator`
- `Skeleton`

Procure também em `src/components/shared` para padrões de produto:

- cards de pessoa;
- cards de pulso/contexto;
- métricas de presença;
- loading skeletons;
- busca estrutural;
- listas progressivas.

## Como decidir entre prop, CSS Module e componente novo

### Criar ou usar prop da primitive

Use quando a mudança altera:

- superfície;
- densidade;
- raio;
- tom visual;
- foco/acessibilidade;
- estado interativo;
- geometria repetida;
- variação comum de card/botão/badge.

### Usar CSS Module local

Use quando a mudança é apenas:

- layout interno da feature;
- grid/flex específico de uma tela;
- espaçamento entre blocos locais;
- microposição de conteúdo que não redefine primitive;
- responsividade específica de um componente de domínio.

### Criar componente compartilhado

Use somente quando existe:

- semântica de produto estável;
- reutilização real em múltiplas telas;
- redução clara de duplicação;
- API de props melhor que copiar markup.

## Mobile-first

- Validar especialmente 360–384px de largura.
- Não sacrificar nome de pessoa por badge/status longo.
- Preferir truncar status secundário antes de truncar nome essencial.
- Formulários focados, check-in e edição devem respeitar navegação inferior oculta quando esse padrão já existir.
- Não aumentar densidade visual se isso prejudicar a leitura pastoral.

## Tom pastoral da UI

- Presença não é fiscalização.
- Sinal não é tarefa, ticket, SLA ou prontuário.
- Evite linguagem punitiva, burocrática ou de cobrança.
- Use vocabulário do `GLOSSARY.md`.
- Prefira CTAs específicos: `Acompanhar pessoa`, `Ver pedido`, `Revisar presença`, `Ver células em atenção`.

## Auditoria e validação

Depois de mudança visual, considerar:

```bash
npm run audit:ui-css
npm run audit:ui-css:strict
npm run screenshots:mobile
```

Para fluxo navegável ou UI crítica:

```bash
npm run verify:all
```

Se não executar algum comando, diga explicitamente.

## Revisão final obrigatória

Antes de devolver:

- Verifique se todo CSS novo tem consumidor.
- Verifique se toda classe removida não é usada.
- Verifique se a primitive não recebeu override local proibido.
- Verifique responsividade básica do componente alterado.
- Liste somente arquivos alterados/criados/excluídos.
