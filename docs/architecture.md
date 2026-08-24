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
```

A constraint única de `ReservationItem.seatId`, combinada ao bloqueio da linha do
evento na transação, impede que duas compras ocupem a mesma poltrona.

## Validação

O QR Code contém um token aleatório. A portaria envia evento e token à API. Um
`updateMany` condicional altera apenas tickets `VALID`; somente uma validação
concorrente recebe `VALID`, e as seguintes recebem `ALREADY_USED`.
