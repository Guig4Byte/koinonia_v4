# Koinonia — briefing para agentes

Este é o documento de entrada rápida para qualquer agente que vá ler, avaliar ou alterar o projeto.

Ele não substitui os demais documentos. Ele explica **onde está a verdade de cada assunto** e quais limites não devem ser violados.

## Leia nesta ordem

1. `docs/AGENT_BRIEFING.md` — entrada operacional para agentes.
2. `docs/PRODUCT.md` — fonte oficial do MVP atual: produto, escopo, perfis e fluxos.
3. `docs/GLOSSARY.md` — fonte oficial dos termos e da linguagem de UI.
4. `docs/ARCHITECTURE.md` — organização técnica, permissões, rotas, entidades e limites de implementação.
5. `docs/Perfil.txt` — experiência desejada: mobile-first, simples, pastoral e bonita.
6. `docs/Koinonia.txt` — visão ampla/futura; não puxa escopo do MVP sem pedido explícito.

A referência visual externa anterior foi removida do fluxo do projeto. Não há arquivo HTML obrigatório para entender esta base.

## Autoridade dos documentos

- **Produto**: `PRODUCT.md` decide o que o MVP é, o que entra agora, o que fica fora e como cada perfil atua.
- **Vocabulário**: `GLOSSARY.md` decide como os conceitos devem ser nomeados e explicados.
- **Arquitetura**: `ARCHITECTURE.md` decide onde implementar regras, permissões, queries e validações.
- **Experiência**: `Perfil.txt` orienta sensação de uso, ritmo, clareza e visual mobile/pastoral.
- **Futuro**: `Koinonia.txt` inspira evolução, mas não autoriza antecipar complexidade.

Quando houver conflito, preserve o MVP atual e peça direção antes de expandir escopo.

## Âncoras oficiais

Estas frases são deliberadamente repetidas nos documentos principais. Não reescreva com outro sentido.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

```txt
Líder resolve a atenção local.
Supervisor apoia exceções e padrões.
Pastor vê saúde geral, casos graves/escalados e busca qualquer pessoa quando precisar.
```

```txt
Sinal não é tarefa.
```

```txt
Pastor não é operador de sinais.
```

Pergunta de corte:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.

## Leitura curta do produto

O Koinonia Lite é um radar pastoral mobile-first para células/grupos.

O MVP atual deve provar uma coisa: depois de um encontro de célula, o sistema ajuda a perceber quem pode estar se afastando e facilita um gesto simples de cuidado.

A presença não é fiscalização. Ela é uma fonte simples para perceber cuidado necessário.

## Limites invioláveis do MVP

Não transforme o produto em:

- CRM pastoral pesado;
- task manager;
- kanban;
- fila de SLA;
- BI executivo;
- prontuário pastoral completo;
- sistema de cobrança de líderes;
- calendário amplo de igreja.

Não antecipe acompanhamento formal nesta fase. `Acompanhamento` é direção futura para casos contínuos; o MVP atual trabalha com atenção, contato e cuidado simples.

## Escopo permitido agora

O MVP atual pode trabalhar com:

- pessoas;
- células/grupos;
- eventos de célula;
- check-in simples;
- visitantes no check-in;
- taxa de presença;
- atenções pastorais geradas por presença/ausência, filtradas por responsabilidade do perfil;
- busca simples de pessoa;
- detalhe simples da pessoa;
- lista de atenção com abertura de cuidado;
- contato e anotação opcional no detalhe da pessoa;
- visão macro para pastor;
- visão de apoio para supervisor;
- visão operacional para líder.

Funcionalidades fora desse recorte exigem pedido explícito do usuário.

## Regras operacionais que não devem quebrar

- Check-in é operação do líder da célula.
- Pastor e supervisor veem eventos/presença em modo resumo; não registram presença pelo líder.
- Líder resolve a maioria das atenções locais; supervisor apoia exceções e padrões; pastor vê saúde geral e casos graves/escalados.
- Pastor não deve receber toda ausência, visitante, retorno ou sinal cotidiano por padrão.
- Pastor pode buscar qualquer pessoa da igreja/campus quando precisar, mas isso não autoriza listar todos por padrão.
- Pessoa sem marcação explícita aparece como `Pendente`, nunca como falta presumida.
- Atenção por ausência só nasce de encontros reais, passados e com presença registrada.
- Métrica de presença sem encontro registrado deve aparecer como ausência de dado, não como `0%` de risco.
- A lista principal deve continuar sendo por pessoa, não por sinal bruto.
- Para líder, `/pessoas` pode aparecer como `Membros` e listar membros ativos da própria célula; para pastor/supervisor, não transforme `/pessoas` em diretório completo por padrão.
- Em listas padrão, pastor deve ver apenas casos graves, sensíveis, recorrentes ou escalados; não uma fila bruta de atenção operacional.
- Cards de atenção devem manter uma ação primária simples: `Abrir cuidado`; ações diretas ficam no detalhe da pessoa.
- `Já houve contato?` deve ser uma pergunta com confirmação; não pode resolver atenção por clique acidental.
- Quando um cuidado/contato resolve todos os motivos de atenção da pessoa, a pessoa deve voltar ao status `Ativo`; o histórico recente deve mostrar `Cuidado realizado`.
- Recalcular presença não deve reabrir o mesmo motivo já cuidado se não houver nova evidência posterior ao cuidado.
- Badges/status visíveis na UI devem usar primeira letra maiúscula, evitando rótulos como `cuidado`, `atenção` ou `pendente` em minúsculo. `Em atenção` deve usar tom âmbar; `Urgente`, vermelho; `Cuidado realizado`, azul.
- A busca atual é busca de pessoa; não prometa busca de evento/célula enquanto a API não suportar esses tipos.
- A rota `/pessoas/[personId]` é uma leitura curta para ação, não histórico infinito.

Detalhes completos dos fluxos ficam em `PRODUCT.md`.

## Regras técnicas que não devem quebrar

- Não confiar só na UI; rotas de escrita devem validar permissão no backend.
- Regras de escopo ficam centralizadas em `src/features/permissions/permissions.ts`.
- Validação do payload de cuidado fica em `src/features/care/care-validation.ts`.
- Regras de sinal/atenção ficam em `src/features/signals`.
- API handlers não devem acumular regra pastoral complexa.
- Páginas não devem recalcular atenção manualmente quando houver helper de domínio.
- Históricos internos do detalhe da pessoa também devem respeitar escopo visível do usuário.

Consulte `ARCHITECTURE.md` antes de criar nova regra, rota ou query.

## Autenticação atual e futura

Ainda não há autenticação real. O projeto usa seletor demo de perfil para validação:

```txt
Pastor | Supervisor | Líder
```

Esse seletor não é interface final.

Quando entrar autenticação real, preserve o contrato:

```ts
getCurrentUser()
```

A origem deve migrar de usuário demo para sessão real com cookie HttpOnly.

## Checklist antes de alterar código

Antes de implementar qualquer mudança, verifique:

1. A mudança respeita o ciclo `Evento -> Presença -> Atenção -> Contato -> Cuidado`?
2. Ela ajuda cuidado real ou cria burocracia?
3. Ela respeita `Líder registra. Supervisor acompanha. Pastor interpreta.`?
4. Ela evita empurrar atenção operacional comum para o pastor?
5. Ela evita transformar sinal em tarefa?
6. Ela usa termos do `GLOSSARY.md`?
7. Ela reutiliza permissões e helpers existentes?
8. Ela mantém a experiência mobile-first?
9. Ela promete apenas o que a API/tela realmente entrega?

## Próxima direção provável

Com check-in, eventos, atenção por pessoa, detalhe de célula e leitura de membros do líder estabilizados, os próximos passos naturais são:

1. revalidar visualmente os fluxos principais em mobile;
2. revalidar a visão do pastor com saúde geral, casos urgentes e casos encaminhados;
3. refinar o escalonamento simples já implementado via `CareSignal.assignedToId`, sem virar task manager;
4. autenticação real;
5. remoção do seletor demo da interface pública;
6. só depois considerar novas capacidades.

Não avançar para analytics, playbooks, SLA, dashboard pesado ou acompanhamento formal antes do ciclo principal estar excelente.
