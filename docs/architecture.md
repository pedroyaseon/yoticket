# Arquitetura

```text
Next.js → NestJS REST API → PostgreSQL
                    ↓
                   TMDb
```

O frontend consulta filmes, locais, sessões e mapas de poltronas sem autenticação.
JWT é incluído nas ações privadas. A API aplica RBAC para `ORGANIZER`, `CUSTOMER`
e `GATE`; esconder elementos na interface não é considerado autorização.

`Event` representa uma sessão interna. A camada pública agrupa eventos pelo
`externalId` da TMDb para montar um único cartaz por filme. O mesmo conjunto é
agrupado por `location` para formar a navegação de locais.

## Compra

```text
filme e locais públicos
  → escolha de local, dia e horário
  → mapa de poltronas da sessão
  → seleção local de poltronas e categoria
  → autenticação do cliente
  → transação cria reserva e bloqueia poltronas
  → pagamento aprovado confirma e gera tickets
  → pagamento recusado ou expiração libera poltronas
  → cancelamento do ingresso libera poltrona e estoque em transação
```

A constraint única de `ReservationItem.seatId`, combinada ao bloqueio da linha do
evento na transação, impede que duas compras ocupem a mesma poltrona.

## Validação

O QR Code contém um token aleatório. A portaria envia evento e token à API. Um
`updateMany` condicional altera apenas tickets `VALID`; somente uma validação
concorrente recebe `VALID`, e as seguintes recebem `ALREADY_USED`.

Antes da leitura, a interface agrupa as sessões autorizadas em três níveis:
local, filme e horário. O identificador enviado na validação continua sendo o
`eventId` da sessão exata.

## Organização

O catálogo TMDb é carregado pelo backend e apresenta filmes em cartaz antes de
qualquer busca. Eventos do organizador podem ser consultados e editados apenas
pelo proprietário. A remoção é lógica (`CANCELLED`) para preservar histórico e
é bloqueada quando existem ingressos vendidos.
