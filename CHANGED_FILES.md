# Alterações nesta entrega

## Seed de desenvolvimento mais representativa

Arquivos alterados:

- `prisma/seed.ts`

## O que mudou

- Adicionado usuário `ADMIN` para validar o mesmo caminho pastoral/admin da aplicação.
- Adicionado um supervisor sem células ativas vinculadas para validar estado vazio em `Equipe`.
- Lideranças de célula agora aparecem como casal nos dados de desenvolvimento, por exemplo `Bruno e Laura Lima`.
- Mantido `personName` individual para o vínculo de pessoa do usuário, evitando transformar a pessoa do usuário em casal quando não necessário.
- Adicionada `Célula Aliança` ativa sem supervisor para validar a seção `Sem supervisor` da aba `Equipe`.
- Adicionado cenário de cuidado pastoral realizado pelo pastor, com pessoa em `Em cuidado` e sinal pastoral resolvido.
- Sinais abertos criados pela helper da seed agora sincronizam `Person.status` para `NEEDS_ATTENTION`, deixando o banco de desenvolvimento mais coerente.
- Atualizados os logs finais da seed com a nova estrutura e os novos cenários de regressão.

## Cenários agora cobertos pela seed

- Admin/pastor com visão pastoral ampla.
- Supervisor com células e supervisor sem células.
- Lideranças exibidas como casal.
- Célula ativa sem supervisor.
- Célula ativa sem presença recente registrada.
- Evento concluído sem marcações válidas.
- Visitantes fora do denominador de presença.
- Apoio solicitado à supervisão sem virar caso pastoral para o pastor.
- Caso urgente por gravidade.
- Caso encaminhado ao pastor.
- Cuidado local feito pelo líder.
- Cuidado pastoral feito pelo pastor.
- Célula inativa fora das superfícies padrão.

## Validação

- Rodei `npm run typecheck`, mas o ambiente não possui `node_modules`; os erros reportados foram de dependências/tipos ausentes (`next`, `react`, `bcryptjs`, `@types/node`, etc.).
- Recomendo validar localmente com:

```bash
npm install
npm run typecheck
npm test
npx prisma db seed
```
