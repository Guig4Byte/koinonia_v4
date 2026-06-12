---
name: koinonia-validation-review
description: Use no final de qualquer alteração no Koinonia Lite para revisar diffs, remover lixo, escolher validações, checar arquivos alterados/excluídos e preparar resumo para entrega.
---

# Koinonia Validation Review

## Quando usar

Use esta skill ao finalizar uma mudança, revisar patch, preparar entrega para o usuário, validar se uma mini entrega está segura, listar arquivos alterados/excluídos ou fazer double check antes de devolver.

## Objetivo

Garantir que a entrega seja pequena, limpa, validável e coerente com as regras do projeto.

## Checklist de limpeza

Verifique:

- imports mortos;
- arquivos mortos;
- CSS morto;
- classes CSS órfãs;
- comentários mortos;
- `console.log`, `debugger`, código experimental;
- função/helper duplicado sem necessidade;
- wrapper fino sem valor;
- arquivo criado por engano;
- alteração fora de escopo.

## Checklist de contrato

Confirme se houve mudança em:

- rota pública;
- payload de API;
- server action;
- permissão;
- texto visível;
- status de presença/sinal/cuidado;
- schema/migration;
- CSS global ou primitive visual;
- seed ou script de validação.

Se houve, teste/documente conforme o documento responsável.

## Comandos por tipo de mudança

### Sempre considerar

```bash
npm run typecheck
npm run lint
npm test
```

### Barreira padrão

```bash
npm run verify
```

### UI/CSS

```bash
npm run audit:ui-css
npm run audit:ui-css:strict
npm run screenshots:mobile
```

### Fluxo navegável ou crítico

```bash
npm run verify:all
npm run test:e2e
```

### Prisma/schema

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Performance/dados volumosos

```bash
npm run db:seed:performance
```

## Se não conseguir rodar validação

Não invente. Diga claramente:

- comando que deveria ser rodado;
- por que não foi executado;
- qual risco fica para validação local do usuário.

## Revisão de diff

Antes de responder, revise o diff com estas perguntas:

1. Esta entrega altera somente o necessário?
2. Existe alguma mudança visual não solicitada?
3. Existe regra de domínio escondida em componente visual?
4. Existe código client importando server-only?
5. Existe CSS local tentando corrigir primitive?
6. Existe query ampla ou N+1 novo?
7. Algum arquivo excluído ainda é importado?
8. Os nomes expressam intenção?
9. A documentação foi atualizada somente quando necessário e no arquivo responsável?
10. O usuário conseguirá revisar rapidamente a entrega?

## Formato obrigatório de entrega

Responder em português com:

```txt
Resumo
- ...

Arquivos alterados
- ...

Arquivos criados
- ...

Arquivos excluídos
- ...

Validação
- ...

Observações/Riscos
- ...
```

Se não houver itens em uma seção, escreva `Nenhum`.
