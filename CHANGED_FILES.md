# Alterações — Eventos / Encontros

## Arquivos alterados

- `src/app/(app)/eventos/page.tsx`
- `src/app/(app)/eventos/[eventId]/page.tsx`
- `src/app/globals.css`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/GLOSSARY.md`

## Ajustes realizados

- Removida a busca global de pessoa da aba `Eventos`.
- Título interno da página alterado para `Encontros`.
- Texto de apoio ajustado para focar em encontros das células e registros de presença.
- Eventos futuros agora aparecem como `Agendado`, não como pendência.
- Evento futuro usa CTA `Ver encontro`.
- Eventos sem presença registrada e já iniciados aparecem como `Aguardando registro` para quem acompanha.
- O líder continua vendo `Presença pendente` e `Registrar presença` somente quando o encontro já pode ser registrado.
- A lista de encontros agora prioriza a seção `Presença pendente` antes de `Hoje`.
- A seção `Já realizados` foi renomeada para `Presença já registrada`.
- Presenças registradas recentes são exibidas das mais recentes para as mais antigas.
- Os cards da lista de encontros ficaram mais leves: ação primária só para registro pendente e métricas registradas em linha compacta.
- O detalhe do evento também diferencia `Agendado`, `Presença pendente`, `Aguardando registro` e `Presença registrada`.
- Docs de produto, arquitetura e glossário foram alinhados às regras de organização e rótulos de eventos.

## Observação

Não foi alterada a regra de permissão: líder registra, supervisor acompanha e pastor interpreta.
