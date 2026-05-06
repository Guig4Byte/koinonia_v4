# Koinonia — briefing para agentes

Este é o arquivo de entrada para qualquer pessoa ou IA que vá alterar o projeto. Ele diz **o que preservar**, **onde procurar cada decisão** e **o que não antecipar**.

## Autoridade dos documentos

1. `docs/AGENT_BRIEFING.md` — orientação operacional rápida.
2. `docs/PRODUCT.md` — comportamento esperado do MVP.
3. `docs/GLOSSARY.md` — vocabulário, rótulos e CTAs oficiais.
4. `docs/ARCHITECTURE.md` — implementação, rotas, permissões e helpers.
5. `docs/Perfil.txt` — sensação de uso mobile/pastoral.
6. `docs/Koinonia.txt` — visão futura/legada, sem autoridade sobre o MVP atual.

Quando houver conflito entre documentação e código, confira o código atual primeiro e atualize o documento depois. Não use a visão futura para antecipar complexidade.

## Norte do produto

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

O MVP é um radar pastoral mobile-first para células. A pergunta de corte é:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Ciclo oficial

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

Presença não é fiscalização. Sinal não é tarefa. Cuidado não é prontuário.

## Papéis

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

| Papel | Foco | Não deve virar |
| --- | --- | --- |
| Líder | Check-in da própria célula e cuidado local. | Operador de outras células. |
| Supervisor | Apoio a líderes e leitura das células supervisionadas. | Substituto do líder no check-in. |
| Pastor/Admin | Saúde geral, equipe, casos graves/encaminhados e busca. | Central de tickets ou fila de ausências. |

## Superfícies atuais

| Papel | Visão | Aba secundária | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

`/pessoas` não é diretório geral. Na navegação atual, é a lista de membros do líder. Pastor/admin usam `/equipe` para estrutura e busca de pessoa para consulta explícita. Supervisor usa `/celulas`.

A navegação por papel fica em `src/features/navigation/app-nav.ts`. A UI chama a rota `/eventos` de `Encontros`; rotas e entidades técnicas continuam como `eventos`/`Event`.

## Regras que não devem quebrar

- O usuário autenticado define papel e escopo; não há seletor de perfil, sessão demo ou bypass visual.
- Check-in é operação do líder da célula e nunca pode ser salvo antes do início do encontro.
- Presença registrada abre resumo primeiro; ajuste do líder é ação explícita em modo focado.
- Modo de registro/ajuste não deve competir com a bottom nav e precisa oferecer cancelar/voltar.
- `Marcar todos como presentes` deve confirmar antes de sobrescrever ausentes ou justificativas.
- Pastor, supervisor e admin acompanham presença em leitura; não registram pelo líder.
- Atenção por ausência só nasce de encontro real, passado e com presença registrada.
- Pessoa sem marcação explícita fica `Pendente`, nunca falta presumida.
- Métrica sem dado aparece como `—`, `Sem registro` ou `Sem presença recente`, nunca `0%`.
- Visitantes não entram no denominador de presença.
- Grupo inativo não libera visibilidade, evento, check-in, histórico padrão nem resolução automática de sinal.
- Listas de atenção agregam por pessoa e escolhem a seção mais específica.
- Urgente/caso pastoral vence pedido de apoio; pedido de apoio vence atenção local.
- Cards de lista usam CTA neutro, normalmente `Abrir pessoa`; ações sensíveis ficam no detalhe.
- `Já houve contato?` precisa confirmar antes de resolver atenção.
- Se o cuidado resolver todos os sinais ativos no escopo, a pessoa fica `Em cuidado`.
- Pessoa em `Em cuidado` só volta para `Ativo` por ação explícita e sem sinal aberto relevante.
- Recalcular presença não reabre motivo já cuidado sem nova evidência posterior.

## Onde implementar

| Assunto | Fonte principal |
| --- | --- |
| Autenticação/sessão | `src/lib/auth`, `middleware.ts`, `src/app/login`, `src/app/logout` |
| Permissões/escopo | `src/features/permissions/permissions.ts` |
| Navegação por papel | `src/features/navigation/app-nav.ts` |
| Queries de visão | `src/features/dashboard/queries.ts` |
| Sinais e seções | `src/features/signals` |
| Status de pessoa | `src/features/people/status-display.ts` |
| Presença | `src/features/events/presence-summary.ts` |
| Evento relevante para check-in | `src/features/events/relevant-event.ts` |
| Validação de cuidado | `src/features/care/care-validation.ts` |
| Tema | `src/features/theme/theme.ts`, `src/components/theme-init.tsx`, `src/components/theme-toggle.tsx` |
| Cards/listas compartilhadas | `src/components/cards.tsx`, `src/components/pastoral-list-cards.tsx`, `src/components/progressive-list.tsx` |

Consulte `ARCHITECTURE.md` antes de criar regra técnica nova. Consulte `GLOSSARY.md` antes de criar texto de UI.

## Limites do MVP

Não implementar sem pedido explícito:

- cadastro público;
- recuperação de senha;
- gestão avançada de usuários;
- acompanhamento formal;
- CRM pastoral pesado;
- task manager, kanban, fila ou SLA;
- BI/analytics avançado;
- mapas, geolocalização ou QR Code;
- notificações;
- área rica do membro;
- calendário amplo de igreja;
- formulários longos.

## Checklist antes de responder ou codar

1. A mudança respeita o ciclo oficial?
2. Reduz esforço de cuidado?
3. Mantém papel e escopo vindos do usuário autenticado?
4. Mantém o líder como dono do check-in local?
5. Mantém supervisor como apoio, não operador de presença?
6. Mantém pastor fora da fila operacional comum?
7. Usa helpers existentes de permissão, status, seção e navegação?
8. Usa vocabulário do `GLOSSARY.md`?
9. Continua mobile-first e sem burocracia?
10. O patch promete apenas o que o código entrega?
