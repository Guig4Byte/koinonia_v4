---
name: koinonia-product-pastoral-copy
description: Use quando alterar textos, rótulos, CTAs, mensagens de erro, empty states ou fluxos pastorais do Koinonia Lite para manter tom pastoral, claro e não burocrático.
---

# Koinonia Product & Pastoral Copy

## Quando usar

Use esta skill quando a tarefa tocar textos visíveis, labels, CTAs, estados vazios, mensagens de erro, descrições de cards, navegação, filtros, status, tom pastoral ou comportamento de produto.

## Documentos obrigatórios

- `docs/PRODUCT.md`
- `docs/GLOSSARY.md`
- `docs/Perfil.txt` quando a sensação da experiência estiver em jogo
- `docs/FRONTEND.md` quando o texto impactar layout/mobile

## Norte de produto

```txt
O Koinonia não registra cuidado por obrigação.
Ele ajuda a não esquecer pessoas.
```

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

## Tom

A UI deve soar:

- pastoral;
- calma;
- clara;
- respeitosa;
- operacional sem burocratizar;
- orientada à pessoa, não ao indicador.

Evite tom de:

- cobrança;
- fiscalização;
- prontuário;
- ticket/SLA;
- CRM pesado;
- culpa;
- urgência artificial.

## Vocabulário preferido

- Use `irmão` quando for apropriado ao contexto pastoral.
- Use `pessoa` quando o texto for genérico, técnico ou inclusivo do cadastro.
- Use `Membros` para a superfície do líder em `/pessoas`.
- Use `Encontros` na UI, mesmo que a rota técnica seja `eventos`.
- Use `Sinal`, `Atenção`, `Cuidado`, `Pedido de apoio`, `Encaminhamento pastoral` conforme glossário.

## Regras de copy

- Texto deve orientar o próximo olhar, não criar ansiedade.
- CTA deve dizer a ação específica.
- Empty state deve confirmar estabilidade sem parecer descuido.
- Erro deve explicar o que fazer, sem expor detalhe técnico.
- Badge/status não deve competir com o nome da pessoa em telas pequenas.
- Não repita a mesma descrição em vários cards se uma descrição de seção resolve.
- Se um card mostra prioridade principal, deixe claro quando existem outros sinais no detalhe.

## CTAs bons

Prefira:

- `Acompanhar pessoa`
- `Ver pedido`
- `Revisar presença`
- `Ver células em atenção`
- `Abrir célula`
- `Registrar presença`
- `Registrar encontro anterior`
- `Ajustar encontro`

Evite:

- `Resolver`
- `Finalizar caso`
- `Tratar ocorrência`
- `Abrir ticket`
- `Ver pendências` quando o contexto for cuidado pastoral sensível

## Copy para encontros

- Use `Encontro anterior` quando a célula se reuniu e a presença ficou para lançar depois.
- Evite `retroativo` na UI; é técnico.
- Evite `já realizado` se o fluxo ainda vai registrar presença, para não sugerir conclusão sem dados.
- Diferencie `Agendar encontro` de `Registrar encontro anterior` quando ambos existirem.
- Para duplicidade, direcione revisão: `Já existe um encontro desta célula nesse dia e horário. Revise o encontro existente antes de criar outro.`
- Para encontro passado sem presença, prefira tom calmo: `A presença ficou para registrar depois.`

## Layout e copy

Em mobile:

- reduza frase antes de reduzir legibilidade;
- preserve nome da pessoa/célula;
- truncar status secundário é melhor que truncar identidade principal;
- copy curta deve continuar pastoral, não seca demais.

## Checklist final

- O texto respeita `GLOSSARY.md`?
- A mensagem reforça cuidado, não fiscalização?
- O CTA leva para o lugar certo?
- A copy funciona em tela estreita?
- Algum termo novo precisa entrar no glossário?
- Mudança de comportamento foi documentada em `PRODUCT.md` quando necessário?
