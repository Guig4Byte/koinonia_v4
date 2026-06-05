# Koinonia Lite — Briefing Para Agentes

Este é o primeiro arquivo para qualquer pessoa ou IA que vá alterar o projeto. Ele resume invariantes, ordem de leitura e pontos técnicos de entrada. Ele não substitui os documentos de assunto.

## Ordem E Autoridade

1. `docs/AGENT_BRIEFING.md` - orientação operacional rápida.
2. `docs/HANDOFF.md` - contexto recente e próximos passos, sem substituir docs normativos.
3. `docs/PRODUCT.md` - comportamento, escopo e fluxos do MVP.
4. `docs/GLOSSARY.md` - vocabulário oficial da UI.
5. `docs/ARCHITECTURE.md` - implementação, permissões, rotas, entidades, dados e performance.
6. `docs/FRONTEND.md` - organização visual, componentes, CSS e loading states.
7. `docs/DEVELOPMENT.md` - setup local, migrations, seeds e validação de volume.
8. `docs/VALIDATION.md` - rotina de validação.
9. `docs/Perfil.txt` - sensação mobile/pastoral.
10. `docs/Koinonia.txt` - visão futura/legada, sem autoridade sobre o MVP atual.

Cada doc tem uma responsabilidade. Não copie regras entre documentos quando bastar apontar para o doc responsável. Se o código atual divergir dos docs, preserve o comportamento existente e atualize o documento responsável.

## Ideia Central

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, a mudança provavelmente não pertence ao MVP.

## Invariantes Do Produto

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Regras que não devem quebrar:

- check-in e ações operacionais do encontro pertencem ao líder da célula;
- supervisor acompanha células supervisionadas e pedidos de apoio, mas não substitui o líder no check-in;
- pastor/admin interpretam saúde geral, equipe e casos graves/encaminhados, sem virar fila de ausências;
- sinal não é tarefa, ticket, SLA ou prontuário;
- presença sem dado real aparece como `Sem registro`, nunca como `0%`;
- pessoa sem marcação explícita no encontro fica `Pendente`, não falta presumida;
- visitantes não entram no denominador de presença;
- grupos inativos não aparecem nas superfícies padrão, encontros, check-in ou histórico padrão.

## Superfícies Por Papel

| Papel | Visão | Superfície estrutural | Encontros |
| --- | --- | --- | --- |
| Líder | `/lider` | `/pessoas` como `Membros` | `/eventos` |
| Supervisor | `/supervisor` | `/celulas` | `/eventos` |
| Pastor/Admin | `/pastor` | `/equipe` | `/eventos` |

A UI usa `Encontros`. Rotas e entidades técnicas continuam usando `eventos`/`Event`.

## O Que Existe No MVP

O sistema atual inclui autenticação por e-mail/senha, sessão em cookie assinado, temas locais, tamanho de texto local, pessoas, células, encontros, check-in do líder, visitantes, métricas de presença, sinais de atenção, pedido de apoio, encaminhamento pastoral, membros em cuidado, histórico de cuidado, busca de pessoa, visões por papel, equipe pastoral, células supervisionadas, cadastro/edição mínima de célula e consultas de encontros por pendência/histórico.

Para a lista normativa de escopo e limites, use `docs/PRODUCT.md`.

## Limites Que Exigem Decisão Explícita

Não implemente sem pedido claro:

- cadastro público, recuperação de senha ou gestão avançada de usuários;
- cadastro completo de pessoas, responsáveis, membros ou usuários;
- importação em massa de planilhas;
- acompanhamento formal, CRM pesado, task manager, kanban, fila ou SLA;
- BI avançado, mapas, geolocalização, QR Code ou notificações;
- área rica do membro, calendário amplo de igreja ou formulários longos.

## Pontos Técnicos De Entrada

Consulte `docs/ARCHITECTURE.md` para detalhes. Pontos mais usados:

| Assunto | Arquivos |
| --- | --- |
| Autenticação e sessão | `src/lib/auth`, `middleware.ts`, `src/app/login`, `src/app/logout` |
| Rotas | `src/lib/routes.ts` |
| Navegação por papel | `src/features/navigation/app-nav.ts` |
| Permissões e escopo | `src/features/permissions/permissions.ts`, `src/features/permissions/permission-query.ts` |
| Células e responsabilidades | `src/features/groups`, `src/app/(app)/celulas` |
| Encontros e agenda | `src/features/events`, `src/app/(app)/eventos`, `src/app/api/events` |
| Check-in | `src/features/check-in`, `src/app/api/events/[eventId]/check-in` |
| Presença | `src/features/events/presence-summary.ts`, `src/features/events/presence-display.ts`, `src/features/events/weekly-presence-health.ts`, `src/components/shared/presence-metric.tsx` |
| Sinais | `src/features/signals` |
| Cuidado | `src/features/care`, `src/app/api/care/[personId]` |
| Busca | `src/features/search`, `src/app/api/search` |
| Tema e texto | `src/features/theme`, `src/features/text-size`, `src/components/layout` |
| UI compartilhada | `src/components/ui`, `src/components/shared`, `docs/FRONTEND.md`, `docs/UI_PRIMITIVES_GUIDE.md` |
| Domínio compartilhado | `src/lib/domain` |
| Banco, migrations e seeds | `prisma/schema.prisma`, `prisma/migrations`, `prisma/seed.ts`, `prisma/seed-performance.ts`, `docs/DEVELOPMENT.md` |

## Checklist Antes De Codar Ou Responder

1. A mudança respeita o ciclo oficial?
2. O papel autenticado continua definindo permissão e escopo?
3. O líder continua dono do check-in e das ações operacionais do encontro?
4. O supervisor continua acompanhando, sem operar presença pelo líder?
5. O pastor continua fora da operação comum e da fila de atenção local?
6. Responsabilidades múltiplas por célula continuam respeitadas?
7. A linguagem vem do `GLOSSARY.md`?
8. A UI continua mobile-first, curta e sem burocracia?
9. Helpers compartilhados continuam seguros para client/server?
10. Regra neutra compartilhada ficou em `src/lib/domain` em vez de uma feature concreta?
11. A mudança preserva `0` ciclos reais entre arquivos?
12. O patch promete apenas o que o código entrega?
