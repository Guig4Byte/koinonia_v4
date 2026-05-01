# Arquivos alterados — Visão sem redundância

## Alterados nesta rodada

- `src/app/(app)/pastor/page.tsx`
- `CHANGED_FILES.md`

## Diagnóstico

A `Visão` do pastor repetia as mesmas informações em camadas diferentes:

- o card principal já informava a quantidade de casos pastorais;
- a seção `Saúde geral` repetia `Casos pastorais`;
- `Sem presença recente` também aparecia na `Visão`, apesar de a tela `Equipe` já mostrar essa leitura com a lista das células e a explicação completa.

Isso deixava a tela mais parecida com um painel de métricas do que com uma leitura pastoral curta.

## Correção

- O card principal da `Visão` agora foca apenas nos casos pastorais.
- `Sem presença recente` saiu da `Visão` e fica concentrado em `Equipe`, onde há contexto e lista das células.
- `Casos pastorais` saiu da seção `Saúde geral`, porque já aparece no resumo principal e na seção de pessoas.
- `Saúde geral` agora fica focada em `Presença da semana`.

## Intenção pastoral

A `Visão` fica mais direta:

```txt
Prioridade pastoral agora -> presença geral -> pessoas para abrir e cuidar.
```

A `Equipe` continua sendo o lugar para entender estrutura, supervisores, células e ausência de presença recente.
