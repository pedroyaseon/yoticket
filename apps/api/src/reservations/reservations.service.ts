import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  Prisma,
  ReservationStatus,
  TicketType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSeats(eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
      await this.expirePending(tx, eventId);
      const event = await tx.event.findFirst({
        where: { id: eventId, status: EventStatus.PUBLISHED },
        select: {
          id: true,
          priceInCents: true,
          seats: {
            orderBy: [{ row: 'asc' }, { number: 'asc' }],
            include: {
              reservationItem: {
                select: { reservation: { select: { status: true } } },
              },
            },
          },
        },
      });
      if (!event) throw new NotFoundException('Evento não encontrado.');

      return {
        eventId: event.id,
        prices: {
          full: event.priceInCents,
          half: Math.floor(event.priceInCents / 2),
        },
        holdMinutes: 15,
        seats: event.seats.map((seat) => ({
          id: seat.id,
          label: seat.label,
          row: seat.row,
          number: seat.number,
          status:
            seat.reservationItem?.reservation.status ===
            ReservationStatus.CONFIRMED
              ? 'RESERVED'
              : seat.reservationItem
                ? 'PENDING'
                : 'AVAILABLE',
        })),
      };
    });
  }

  async create(
    eventId: string,
    customerId: string,
    input: CreateReservationDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
        await this.expirePending(tx, eventId);
        const event = await tx.event.findFirst({
          where: { id: eventId, status: EventStatus.PUBLISHED },
        });
        if (!event) throw new NotFoundException('Evento não encontrado.');

        const seatIds = input.seats.map((selection) => selection.seatId);
        const seats = await tx.seat.findMany({
          where: { id: { in: seatIds }, eventId },
          select: { id: true, label: true },
        });
        if (seats.length !== seatIds.length)
          throw new ConflictException(
            'Uma ou mais poltronas não pertencem a este evento.',
          );

        const occupied = await tx.reservationItem.findMany({
          where: { seatId: { in: seatIds } },
          select: { seat: { select: { label: true } } },
        });
        if (occupied.length)
          throw new ConflictException(
            `Poltrona ${occupied.map((item) => item.seat.label).join(', ')} não está mais disponível.`,
          );

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const reservation = await tx.reservation.create({
          data: {
            eventId,
            customerId,
            quantity: input.seats.length,
            expiresAt,
            items: {
              create: input.seats.map((selection) => ({
                seatId: selection.seatId,
                ticketType: selection.ticketType,
                priceInCents:
                  selection.ticketType === TicketType.HALF
                    ? Math.floor(event.priceInCents / 2)
                    : event.priceInCents,
              })),
            },
          },
          include: { items: { include: { seat: true } } },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { heldQuantity: { increment: input.seats.length } },
        });
        return {
          ...reservation,
          totalInCents: reservation.items.reduce(
            (total, item) => total + item.priceInCents,
            0,
          ),
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'Uma das poltronas acabou de ser selecionada por outra pessoa.',
        );
      throw error;
    }
  }

  private async expirePending(tx: Prisma.TransactionClient, eventId: string) {
    const expired = await tx.reservation.findMany({
      where: {
        eventId,
        status: ReservationStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      select: { id: true, quantity: true },
    });
    if (!expired.length) return;

    const ids = expired.map((item) => item.id);
    const quantity = expired.reduce((sum, item) => sum + item.quantity, 0);
    await tx.reservationItem.deleteMany({
      where: { reservationId: { in: ids } },
    });
    await tx.reservation.updateMany({
      where: { id: { in: ids } },
      data: { status: ReservationStatus.EXPIRED },
    });
    await tx.event.update({
      where: { id: eventId },
      data: { heldQuantity: { decrement: quantity } },
    });
  }
}
