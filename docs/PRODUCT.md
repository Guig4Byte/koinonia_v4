# Produto — Koinonia Lite

## Visão

O Koinonia é um sistema pastoral mobile-first para células/grupos.

Ele não existe para transformar cuidado em burocracia. Ele existe para ajudar liderança pastoral a perceber, lembrar e agir quando uma pessoa pode estar se afastando.

> O Koinonia não registra cuidado por obrigação. Ele ajuda a não esquecer pessoas.

## Documentos obrigatórios de contexto

Antes de propor funcionalidades ou alterar fluxos, leia:

1. `docs/AGENT_BRIEFING.md` — resumo operacional para agentes.
2. `docs/PRODUCT.md` — este documento; recorte oficial do MVP atual.
3. `docs/GLOSSARY.md` — vocabulário oficial do MVP.
4. `docs/ARCHITECTURE.md` — organização técnica e limites de arquitetura.
5. `docs/Perfil.txt` — norte de experiência mobile simples, bonita e pastoral.
6. `docs/Koinonia.txt` — visão ampla do produto e possibilidades futuras.

Ordem de autoridade:

- `AGENT_BRIEFING.md`, `PRODUCT.md` e `GLOSSARY.md` governam o MVP atual.
- `Perfil.txt` governa a sensação de uso: mobile-first, alívio cognitivo e foco em pessoas.
- `Koinonia.txt` é visão ampla/futura; não deve puxar o MVP para BI, CRM pesado, playbooks, SLA, mapas ou analytics antes do ciclo central estar validado.

Não há mais dependência de arquivo HTML externo neste projeto.

## Princípio de produto

A pergunta central é:

```txt
Quem precisa de cuidado agora?
```

Tudo no MVP deve responder a isso.

## Ciclo central do MVP

```txt
Evento -> Presença -> Atenção -> Contato -> Cuidado
```

- Evento existe para registrar o encontro real da célula.
- Presença existe para revelar sinais pastorais.
- Atenção existe para trazer uma pessoa à consciência do líder/pastor.
- Contato existe para estimular ação real: ligar, WhatsApp, conversar.
- Cuidado existe para impedir que alguém desapareça em silêncio.

Para os termos oficiais, consulte `docs/GLOSSARY.md`. Em caso de dúvida, use sempre a linguagem mais simples para a pessoa usuária: `atenção` na UI, `sinal` como evidência de sistema e `cuidado` como ação humana registrada.

## Escopo do MVP atual

Inclui:

- Pessoas
- Células / grupos
- Eventos de célula
- Check-in simples
- Taxa de presença
- Visitantes no check-in
- Atenções pastorais
- Busca simples levando ao detalhe da pessoa
- A busca atual é busca de pessoa; resultados devem mostrar apenas contexto/célula dentro do escopo visível do usuário
- Detalhe simples da pessoa com célula, última presença, atenção aberta e cuidado recente
- Ação direta: ligar, WhatsApp, contato feito e anotação opcional
- Visão macro do pastor
- Visão de acompanhamento do supervisor
- Visão operacional do líder

Não inclui agora:

- analytics avançado;
- BI;
- mapas;
- QR Code;
- geolocalização;
- notificações;
- playbooks;
- SLA;
- task manager complexo;
- CRM pastoral pesado;
- área rica do membro;
- formulários longos.

## Perfis e responsabilidades

Regra norteadora:

```txt
Líder registra.
Supervisor acompanha.
Pastor interpreta.
```

### Líder

O líder é operacional.

Pode:

- ver sua célula;
- ver seus eventos;
- registrar check-in dos eventos da própria célula;
- adicionar visitantes;
- ver membros da própria célula;
- ver pessoas em atenção da própria célula;
- ligar, chamar no WhatsApp e registrar contato.

Não deve:

- ver visão macro da igreja;
- registrar check-in de outra célula;
- operar presença no lugar de outro líder.

### Supervisor

O supervisor acompanha e apoia.

Pode:

- ver células sob sua supervisão;
- ver eventos dessas células em modo resumo;
- ver check-ins pendentes/realizados;
- ver presença média, visitantes e pessoas em atenção;
- acompanhar líderes que precisam de apoio.

Não deve:

- registrar check-in;
- operar presença no lugar do líder;
- ver dados fora do seu escopo.

### Pastor

O pastor interpreta a visão macro.

Pode:

- ver eventos da igreja/campus em modo resumo;
- ver presença geral;
- ver células em atenção;
- ver pessoas que podem estar se afastando;
- perceber regiões, células ou líderes que precisam de cuidado.

Não deve:

- registrar check-in;
- operar presença no lugar do líder;
- transformar visão macro em relatório burocrático.


## Sinais de ausência confiáveis

Atenção por ausência só pode nascer de encontros reais, passados e com presença registrada. Evento futuro, evento pendente ou membro sem marcação explícita não deve ser tratado como falta presumida.

Depois de salvar check-in, a resposta da API informa quantas pessoas distintas ficaram em atenção naquela célula, para que a interface possa fechar o ciclo: presença salva -> pessoas em atenção -> cuidado. A UI pode escolher o sinal mais grave/recente como motivo, mas a lista principal deve continuar sendo por pessoa, não por sinal.

## Check-in

Check-in é exclusivo do líder da célula.

Fluxo desejado:

```txt
Evento da célula
-> abrir check-in
-> na visão do líder, escolher primeiro o evento de hoje pendente, depois o próximo pendente, depois o último realizado
-> marcar explicitamente cada membro como presente, ausente ou justificou
-> adicionar visitante
-> finalizar presença somente quando ninguém estiver como pendente
-> atualizar taxa
-> gerar atenções
```

Pastor e supervisor veem resumo somente leitura. Evento já concluído pode ser ajustado pelo líder da célula, mas aparece como correção de presença, não como novo check-in. Visitantes já registrados aparecem no resumo e também no ajuste do líder, sem virar membros automaticamente. O mesmo visitante não deve ser adicionado duas vezes no mesmo evento; a validação deve comparar nome normalizado, ignorando acento, caixa e espaços extras.

## Detalhe simples da pessoa

A tela de pessoa existe para responder rapidamente:

```txt
Por que esta pessoa merece atenção e qual é o próximo gesto de cuidado?
```

Ela deve permanecer curta e operacional:

- nome, célula e líder;
- status pastoral simples;
- nota curta, quando existir;
- ações diretas de cuidado: ligar, WhatsApp e contato feito;
- atenções abertas com evidência;
- última presença registrada;
- cuidado recente.

Ela não deve virar prontuário, CRM completo, timeline infinita ou formulário longo. A busca e os cards de atenção devem levar direto para essa tela quando o usuário precisar de contexto.

## Fluxo de contato

Nos cards de atenção, o fluxo correto é:

```txt
[Ligar] [WhatsApp]
        ↓
Conseguiu contato?
        ↓
[Contato feito] [Ainda não]
        ↓
Quer anotar algo?
        ↓
[Anotar] [Não precisa]
```

A anotação é opcional e posterior ao cuidado. O sistema deve incentivar contato real antes de registro.

Quando o contato é salvo, a API deve devolver quantas atenções abertas foram resolvidas naquele escopo. A UI deve mostrar essa consequência em linguagem simples, sem prometer que a pessoa foi “concluída” ou que saiu definitivamente de cuidado. O registro de cuidado fecha sinais abertos, não cria acompanhamento complexo.

## Linguagem

Preferir:

- `atenção`;
- `cuidado`;
- `visão`;
- `pessoas`;
- `presença`;
- `contato feito`.

Evitar na UI:

- `alerta`;
- `task`;
- `SLA`;
- `dashboard`;
- `lead`;
- `funil`;
- `workflow`.

## Regra de corte

Antes de implementar qualquer coisa, perguntar:

```txt
Isso ajuda alguém a cuidar melhor de uma pessoa com menos esforço?
```

Se a resposta for não, não entra agora.
