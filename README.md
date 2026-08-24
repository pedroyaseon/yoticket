# YoTicket

Plataforma de cinema e ingressos desenvolvida para o desafio Elite Dev 2026.
O sistema cobre a programação de sessões, escolha de poltronas, pagamento
simulado, emissão de ingressos e validação de entrada.

## Acesso

[Acessar o YoTicket](https://yoticket.netlify.app/events)

## Visão geral

O catálogo público organiza os filmes em cartaz sem confundi-los com as sessões
internas. Um filme pode estar disponível em diferentes locais, datas e horários;
cada combinação representa uma sessão com capacidade, preço e mapa de poltronas
próprios.

O fluxo principal é:

```text
filme → local → data → horário → poltronas → tipo de ingresso
      → reserva → pagamento → ingresso com QR Code
```

## Perfis

### Cliente

Pode explorar filmes e locais sem autenticação. O login é solicitado quando uma
reserva precisa ser concluída. O cliente escolhe poltronas e ingressos de inteira
ou meia-entrada, simula o pagamento e acompanha os ingressos emitidos. Cada
ingresso possui QR Code, link de compartilhamento e opção de cancelamento com
reembolso simulado antes da sessão.

### Organizador

Pesquisa filmes no catálogo da TMDb e cria a programação do cinema. É possível
definir local, período em cartaz, dias da semana, horários, capacidade e preço.
O painel permite pesquisar, visualizar, editar, publicar e remover sessões, além
de acompanhar capacidade, vendas, disponibilidade e receita simulada.

### Portaria

Seleciona local, filme e horário antes da validação. O ingresso pode ser lido
pela câmera ou informado manualmente. A resposta diferencia claramente ingresso
válido, inexistente, já utilizado ou pertencente a outra sessão.

## Regras de negócio

### Reserva de poltronas

Uma reserva pendente mantém as poltronas por 15 minutos. O backend revalida a
disponibilidade no momento da reserva e protege cada operação com transação no
PostgreSQL. Uma constraint única sobre a poltrona reservada impede que duas
requisições concorrentes confirmem o mesmo lugar.

Estados apresentados no mapa:

- **Disponível:** pode ser selecionada;
- **Selecionada:** escolha local ainda não enviada;
- **Pendente:** reservada temporariamente, aguardando pagamento;
- **Reservada:** pagamento aprovado.

A seleção em andamento é preservada durante o login ou recarregamento da página,
mas nunca substitui a validação definitiva feita pela API.

### Pagamento e ingresso

O pagamento é simulado como aprovado ou recusado. A meia-entrada corresponde a
50% do valor base, sempre recalculado pela API. A confirmação é idempotente:
repetir a mesma requisição não duplica ingressos. Em caso de recusa, a reserva é
cancelada e as poltronas voltam a ficar disponíveis.

Cada ingresso recebe um código aleatório não sequencial. O QR Code transporta
somente esse identificador; a API continua sendo a autoridade sobre propriedade,
sessão, status e utilização do ingresso. A página compartilhada expõe apenas os
dados necessários para apresentação na entrada.

### Validação e reembolso

A validação na portaria é atômica. Duas requisições simultâneas para o mesmo
ingresso não podem obter sucesso: somente a primeira altera o status para usado.
As respostas possíveis são `VALID`, `INVALID`, `ALREADY_USED` e `WRONG_EVENT`.

O cancelamento de um ingresso válido registra o reembolso simulado, cancela o
ingresso e libera a poltrona na mesma transação. Ingressos já utilizados ou de
sessões iniciadas não podem ser reembolsados.

## Arquitetura

```text
Next.js → REST API NestJS → PostgreSQL
                    ↓
                   TMDb
```

- **Next.js:** interface pública e áreas específicas de cada perfil;
- **NestJS:** autenticação, autorização e regras dos domínios de catálogo,
  eventos, reservas, pagamentos, ingressos e portaria;
- **PostgreSQL com Prisma:** persistência, transações e constraints de
  consistência;
- **TMDb:** catálogo externo consultado exclusivamente pelo backend.

A API é organizada por domínio, mantendo regras de negócio separadas da camada
HTTP. O frontend consome somente a API interna e não recebe credenciais da TMDb.

## Segurança e consistência

- senhas armazenadas com hash seguro;
- autenticação JWT e autorização por papel no backend;
- validação e normalização dos payloads;
- códigos públicos não sequenciais para ingressos e compartilhamentos;
- preço e meia-entrada recalculados pela API;
- proteção transacional contra venda e validação duplicadas;
- mensagens de erro sem exposição de detalhes internos.

## Escopo do MVP

O YoTicket entrega o fluxo completo entre organizador, cliente e portaria. A
cobrança e o reembolso são intencionalmente simulados; não há integração com um
provedor financeiro real. As regras críticas de concorrência, autorização e
validade dos ingressos permanecem protegidas no backend e no banco de dados.
