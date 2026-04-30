# Koinonia — mobile polish step 3

Foco desta mini-etapa: deixar listas de atenção e navegação de detalhe mais leves no celular, sem alterar regra de negócio, query, permissão ou endpoint.

## Arquivos alterados

- `src/components/cards.tsx`
- `src/app/(app)/pessoas/[personId]/page.tsx`
- `src/app/(app)/eventos/[eventId]/page.tsx`
- `src/app/(app)/pessoas/page.tsx`
- `src/app/(app)/celulas/[groupId]/page.tsx`

## Mudanças

### 1. Cards de atenção viraram links inteiros

`PersonSignalCard` não renderiza mais um botão grande dentro do card quando há destino. O card inteiro agora é clicável e mostra um CTA discreto no rodapé, como `Abrir pessoa →` ou `Abrir apoio →`.

Motivo: reduzir sensação de fila operacional e deixar a lista parecer feed de cuidado.

### 2. Navegação de retorno padronizada

Adicionado `BackLink` em `cards.tsx` e aplicado em:

- detalhe de pessoa;
- detalhe de evento;
- detalhe de célula.

Motivo: padronizar toque, espaçamento e linguagem dos retornos.

### 3. Cartão informativo padronizado

Adicionado `InfoCard` para mensagens simples e aplicado em:

- bloco de consulta em `/pessoas`;
- mensagem de evento sem célula no detalhe do evento.

Motivo: remover variações locais de card textual e manter consistência visual.

## O que não mudou

- regras pastorais;
- permissões;
- consultas Prisma;
- endpoints;
- labels/status centrais;
- regras de presença/check-in.

## Validação sugerida

```bash
npm run test
npm run typecheck
npm run build
```

Também vale conferir manualmente no celular:

- `Visão` do líder/supervisor/pastor;
- `/pessoas`;
- `/pessoas/[personId]`;
- `/celulas/[groupId]`;
- `/eventos/[eventId]`.
