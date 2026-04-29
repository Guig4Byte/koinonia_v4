# Koinonia Lite — arquivos alterados — mini-etapa 3

Foco: check-in e UI enxuta, preservando regras de domínio e permissões.

## Alterações principais

- Reduzi linguagem operacional no check-in.
- Troquei CTAs de finalização/atualização por ações mais diretas: `Salvar presença` e `Salvar ajuste`.
- Ajustei o resumo do check-in para mostrar progresso de marcação enquanto ainda há pessoas pendentes, sem transformar ausência de marcação em pressão visual.
- Simplifiquei mensagens pós-salvamento para falar em radar/cuidado, não em atualização técnica de sinais.
- Humanizei ações de apoio/encaminhamento, evitando linguagem de tarefa, fila, recebimento ou atualização técnica.
- Ajustei mensagens da rota de apoio para seguir o glossário pastoral.
- Ajustei feedback de cuidado para usar `foi cuidado` em vez de `foi resolvido`.

## Arquivos alterados

- `src/components/check-in-list.tsx`
  - Textos mais leves para registro e ajuste de presença.
  - Default do botão mudou de `Finalizar` para `Salvar presença`.
  - Resumo mostra `marcados` enquanto houver pendências.
  - Mensagens pós-salvamento falam em radar/cuidado.
  - Visitantes usam linguagem de `salvo`/`incluir ao salvar`, menos administrativa.

- `src/components/signal-support-actions.tsx`
  - CTA `Pedir apoio ao supervisor` virou `Pedir apoio`.
  - Adicionado microtexto para deixar claro que apoio não transfere todo o cuidado.
  - Erro padrão ficou menos técnico.

- `src/app/api/signals/[signalId]/support/route.ts`
  - Mensagens de erro e sucesso ajustadas para linguagem contextual.
  - `Pedido de apoio enviado ao supervisor.` virou `Apoio solicitado à supervisão.`
  - `Caso encaminhado ao pastor.` virou `Encaminhado ao pastor.`

- `src/components/care-actions.tsx`
  - Feedback fallback de cuidado ficou menos técnico.
  - Texto de salvar sem anotação remove referência a `escopo` e usa `radar certo`.

- `src/features/care/care-validation.ts`
  - Mensagens de cuidado usam `motivo de atenção foi cuidado` em vez de `resolvido`.

- `src/features/care/care-validation.test.ts`
  - Expectativas ajustadas para as novas mensagens de cuidado.

- `src/components/person-status-actions.tsx`
  - Erro padrão ficou específico para a ação: `marcar como ativo`.

- `src/app/(app)/eventos/[eventId]/page.tsx`
  - Labels do botão de check-in: `Salvar presença` / `Salvar ajuste`.

- `src/app/(app)/lider/page.tsx`
  - Labels do botão de check-in: `Salvar presença` / `Salvar ajuste`.

- `src/app/(app)/pessoas/page.tsx`
  - Texto de pedidos de apoio remove `fila burocrática`.
  - Texto de consulta troca `escopo` por `responsabilidade`.

## Validação sugerida

Como combinado, não rodei `npm`, `typecheck`, `build` nem testes.

Validar manualmente:

1. Check-in novo do líder:
   - enquanto houver pendências, aparece `—` no percentual e `Faltam N`.
   - botão deve mostrar `Salvar presença`.
   - após salvar, mensagem deve apontar quem continua no radar.

2. Ajuste de presença já salva:
   - botão deve mostrar `Salvar ajuste`.
   - texto de apoio deve dizer para corrigir apenas o que mudou.

3. Detalhe de pessoa em atenção:
   - `Pedir apoio` deve continuar chamando a ação de supervisor.
   - `Encaminhar ao pastor` deve continuar chamando a ação pastoral.
   - mensagens de sucesso não devem citar nome de destinatário.

4. Cuidado:
   - `Salvar sem anotação` deve funcionar normalmente.
   - feedback deve falar em cuidado/radar, não em atualização técnica.
