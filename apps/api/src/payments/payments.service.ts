import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  async process(
    reservationId: string,
    customerId: string,
    outcome: 'APPROVED' | 'DECLINED',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });
      if (!reservation) throw new NotFoundException('Reserva não encontrada.');
      if (reservation.customerId !== customerId) throw new ForbiddenException();
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${reservation.eventId} FOR UPDATE`;
      const existing = await tx.payment.findUnique({
        where: { reservationId },
      });
      if (existing) return { status: existing.status, reservationId };
      if (
        reservation.status !== ReservationStatus.PENDING ||
        reservation.expiresAt <= new Date()
      ) {
        if (reservation.status === ReservationStatus.PENDING) {
          await tx.reservation.update({
            where: { id: reservationId },
            data: { status: ReservationStatus.EXPIRED },
          });
          await tx.event.update({
            where: { id: reservation.eventId },
            data: { heldQuantity: { decrement: reservation.quantity } },
          });
        }
        return { status: 'EXPIRED', reservationId };
      }
      const status =
        outcome === 'APPROVED'
          ? PaymentStatus.APPROVED
          : PaymentStatus.DECLINED;
      await tx.payment.create({ data: { reservationId, status } });
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status:
            outcome === 'APPROVED'
              ? ReservationStatus.CONFIRMED
              : ReservationStatus.CANCELLED,
        },
      });
      await tx.event.update({
        where: { id: reservation.eventId },
        data:
          outcome === 'APPROVED'
            ? {
                heldQuantity: { decrement: reservation.quantity },
                soldQuantity: { increment: reservation.quantity },
              }
            : { heldQuantity: { decrement: reservation.quantity } },
      });
      if (outcome === 'APPROVED') {
        await tx.ticket.createMany({
          data: Array.from({ length: reservation.quantity }, () => ({
            eventId: reservation.eventId,
            reservationId,
            ownerId: customerId,
            code: randomBytes(32).toString('base64url'),
          })),
        });
      }
      return { status, reservationId };
    });
  }
}
