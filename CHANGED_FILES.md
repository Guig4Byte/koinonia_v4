# CHANGED_FILES — pós-auditoria

## Arquivo alterado

- `src/app/(app)/celulas/[groupId]/page.tsx`

## Motivo

A auditoria pós-patch encontrou uma inconsistência residual no detalhe de célula: a contagem de apoio ainda usava `assignedToId === user.id`, enquanto as demais telas já usam o helper central `isSupportRequest(...)`.

Isso podia gerar diferença de leitura entre telas, especialmente para o líder vendo um apoio solicitado à supervisão.

## Ajustes

- O detalhe da célula agora usa `isSupportRequest(signal, user)` para identificar apoio.
- O badge de cabeçalho passa a respeitar o contexto do papel:
  - líder: `apoio solicitado` / `apoios solicitados`;
  - supervisor: `pedido de apoio` / `pedidos de apoio`.
- Cards de atenção no detalhe da célula passam a usar CTA `Abrir apoio` quando o sinal for um pedido/apoio no contexto do usuário.

## Validação sugerida

Rode novamente:

```bash
npm run test
npm run typecheck
npm run build
```

Também vale abrir uma célula como líder após pedir apoio ao supervisor e confirmar se o cabeçalho deixa de tratar o caso como atenção comum.
