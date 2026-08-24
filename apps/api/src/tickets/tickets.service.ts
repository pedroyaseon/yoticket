import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async cancelAndRefund(ticketId: string, ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirst({
        where: { id: ticketId, ownerId },
        include: { event: true },
      });
      if (!ticket) throw new NotFoundException('Ingresso não encontrado.');
      if (ticket.status === TicketStatus.CANCELLED)
        return {
          status: TicketStatus.CANCELLED,
          refundStatus: 'ALREADY_REFUNDED' as const,
          refundedAt: ticket.refundedAt,
          refundInCents: ticket.priceInCents,
        };
      if (ticket.status === TicketStatus.USED)
        throw new ConflictException(
          'Um ingresso já utilizado não pode ser reembolsado.',
        );
      if (ticket.event.startsAt <= new Date())
        throw new ConflictException(
          'O prazo para cancelar este ingresso já terminou.',
        );

      await tx.$queryRaw`SELECT id FROM "Reservation" WHERE id = ${ticket.reservationId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${ticket.eventId} FOR UPDATE`;
      const refundedAt = new Date();
      const cancelled = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          ownerId,
          status: TicketStatus.VALID,
        },
        data: {
          status: TicketStatus.CANCELLED,
          refundedAt,
          seatId: null,
        },
      });
      if (cancelled.count !== 1)
        throw new ConflictException(
          'Este ingresso não está mais disponível para reembolso.',
        );

      if (ticket.seatId) {
        await tx.reservationItem.deleteMany({
          where: {
            reservationId: ticket.reservationId,
            seatId: ticket.seatId,
          },
        });
      }
      await tx.event.update({
        where: { id: ticket.eventId },
        data: { soldQuantity: { decrement: 1 } },
      });
      const remaining = await tx.ticket.count({
        where: {
          reservationId: ticket.reservationId,
          status: TicketStatus.VALID,
        },
      });
      await tx.reservation.update({
        where: { id: ticket.reservationId },
        data: {
          quantity: { decrement: 1 },
          ...(remaining === 0 ? { status: ReservationStatus.CANCELLED } : {}),
        },
      });

      return {
        status: TicketStatus.CANCELLED,
        refundStatus: 'APPROVED' as const,
        refundedAt,
        refundInCents: ticket.priceInCents,
      };
    });
  }
}
