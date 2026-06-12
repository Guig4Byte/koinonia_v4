---
name: koinonia-domain-architecture
description: Use ao mexer na arquitetura do Koinonia Lite, fronteiras entre app/features/lib/components, permissões, domínio pastoral, imports cruzados e organização modular.
---

# Koinonia Domain Architecture

## Quando usar

Use esta skill quando a tarefa envolver organização de pastas, dependências entre features, permissões, regras de domínio, movimentação de arquivos, extração para `src/lib/domain`, componentes compartilhados ou arquitetura de dados.

## Fontes de autoridade

Leia conforme necessário:

- `docs/AGENT_BRIEFING.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCT.md`
- `docs/HANDOFF.md`
- `docs/VALIDATION.md`

## Invariantes que a arquitetura deve proteger

```txt
Encontro -> Presença -> Atenção -> Contato -> Cuidado
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

Também preserve:

- sinal não é tarefa;
- pastor não é operador de sinais comuns;
- supervisor não substitui o líder no check-in;
- presença sem dado real não vira `0%`;
- pessoa pendente no encontro não é falta presumida;
- visitante não vira membro automaticamente;
- grupo inativo não entra nas superfícies padrão.

## Fronteiras de diretório

### `src/app`

Responsável por rotas, páginas, layouts, loading, login/logout, server actions e API handlers.

- Página deve compor dados e componentes.
- Evite concentrar regra de domínio pesada em `page.tsx`.
- API handler deve ser fino: autenticação, parsing, command e resposta.

### `src/features`

Responsável por regras e componentes de domínio por feature.

- Feature concreta pode importar helper neutro.
- Helper neutro não importa feature concreta.
- Evite ciclos reais.
- Import cruzado entre features só é aceitável quando há composição clara e sem inversão basal.

### `src/lib/domain`

Use para regra pura compartilhada por mais de uma feature.

Bons candidatos:

- responsabilidades de célula;
- dias da semana;
- filtros de vínculo/membership;
- escopo neutro;
- helpers que não pertencem a uma feature concreta.

### `src/components/ui`

Primitives visuais reutilizáveis, sem domínio pastoral específico.

### `src/components/shared`

Componentes de apresentação reutilizável ligados ao produto, mas não a uma rota única.

## Regras de dependência

- Componente `use client` não deve importar Prisma, sessão server-only, command de API ou helper server-only.
- `src/components/ui` não deve importar `src/features`.
- Query Prisma não deve entrar em componente client-side.
- Permissão deve ser checada perto da fronteira server-side e preservada em commands/queries.
- Não mova regra para lugar “mais genérico” se ela depende de vocabulário e contexto de uma única feature.

## Permissões e papéis

Preserve as responsabilidades:

- líder: própria célula, check-in, visitantes, contatos e sinais do seu escopo;
- supervisor: células supervisionadas e pedidos de apoio, sem operar check-in;
- pastor/admin: saúde geral, busca, casos graves/encaminhados e leitura autorizada ampla, sem virar fila de toda atenção comum.

Antes de alterar permissão:

1. localizar testes em `src/features/permissions` ou feature afetada;
2. identificar payload público afetado;
3. preservar mensagens de erro quando forem parte da experiência;
4. adicionar caso de teste para papel permitido e papel negado.

## Refatoração arquitetural segura

- Mova arquivo só quando houver motivo explícito: dependência invertida, duplicação, regra compartilhada, arquivo grande demais ou clareza de domínio.
- Ao dividir arquivo com imports existentes, preserve fachada pública curta quando reduzir risco.
- Não tente zerar todos os imports cruzados; busque `0 ciclos reais` e fronteiras compreensíveis.
- Não introduza camada abstrata genérica sem dor atual.
- Não transforme primitives ou helpers em “service layer” genérico sem necessidade.

## Checklist de saída

- Nenhum ciclo real novo.
- Nenhuma importação client -> server-only.
- Nenhuma regra de domínio em `src/components/ui`.
- Nenhuma query Prisma em componente client-side.
- Testes de permissões/domínio impactados passam ou foram atualizados.
- Arquivos movidos mantêm imports públicos ou migração completa.
