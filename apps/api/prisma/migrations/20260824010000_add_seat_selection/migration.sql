-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('FULL', 'HALF');

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "ticketType" "TicketType" NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Ticket"
ADD COLUMN "seatId" TEXT,
ADD COLUMN "ticketType" "TicketType" NOT NULL DEFAULT 'FULL',
ADD COLUMN "priceInCents" INTEGER NOT NULL DEFAULT 0;

-- Existing unpaid holds cannot be mapped reliably to named seats, so release them.
UPDATE "Reservation" SET "status" = 'EXPIRED' WHERE "status" = 'PENDING';
UPDATE "Event" SET "heldQuantity" = 0;

-- Create a deterministic 12-seat-per-row map for existing events.
INSERT INTO "Seat" ("id", "eventId", "label", "row", "number")
SELECT
  'seat_' || md5(event."id" || '_' || position::text),
  event."id",
  chr(65 + ((position - 1) / 12)::integer) || (((position - 1) % 12) + 1)::text,
  chr(65 + ((position - 1) / 12)::integer),
  ((position - 1) % 12) + 1
FROM "Event" event
CROSS JOIN LATERAL generate_series(1, event."capacity") AS position;

-- Assign seats to existing paid tickets so legacy demo purchases remain valid.
WITH numbered_tickets AS (
  SELECT "id", "eventId", row_number() OVER (PARTITION BY "eventId" ORDER BY "createdAt", "id") AS position
  FROM "Ticket"
), numbered_seats AS (
  SELECT "id", "eventId", row_number() OVER (PARTITION BY "eventId" ORDER BY "row", "number") AS position
  FROM "Seat"
)
UPDATE "Ticket" ticket
SET
  "seatId" = seat."id",
  "priceInCents" = event."priceInCents"
FROM numbered_tickets numbered
JOIN numbered_seats seat ON seat."eventId" = numbered."eventId" AND seat.position = numbered.position
JOIN "Event" event ON event."id" = numbered."eventId"
WHERE ticket."id" = numbered."id";

INSERT INTO "ReservationItem" ("id", "reservationId", "seatId", "ticketType", "priceInCents")
SELECT
  'item_' || md5(ticket."id"),
  ticket."reservationId",
  ticket."seatId",
  ticket."ticketType",
  ticket."priceInCents"
FROM "Ticket" ticket
WHERE ticket."seatId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventId_label_key" ON "Seat"("eventId", "label");
CREATE INDEX "Seat_eventId_row_number_idx" ON "Seat"("eventId", "row", "number");
CREATE UNIQUE INDEX "ReservationItem_seatId_key" ON "ReservationItem"("seatId");
CREATE INDEX "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");
CREATE UNIQUE INDEX "Ticket_seatId_key" ON "Ticket"("seatId");

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
