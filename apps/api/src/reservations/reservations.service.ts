import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    eventId: string,
    customerId: string,
    input: CreateReservationDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
      const expired = await tx.reservation.findMany({
        where: {
          eventId,
          status: ReservationStatus.PENDING,
          expiresAt: { lte: new Date() },
        },
        select: { id: true, quantity: true },
      });
      if (expired.length) {
        const quantity = expired.reduce((sum, item) => sum + item.quantity, 0);
        await tx.reservation.updateMany({
          where: { id: { in: expired.map((item) => item.id) } },
          data: { status: ReservationStatus.EXPIRED },
        });
        await tx.event.update({
          where: { id: eventId },
          data: { heldQuantity: { decrement: quantity } },
        });
      }
      const event = await tx.event.findFirst({
        where: { id: eventId, status: 'PUBLISHED' },
      });
      if (!event) throw new NotFoundException('Evento não encontrado.');
      if (
        event.capacity - event.soldQuantity - event.heldQuantity <
        input.quantity
      )
        throw new ConflictException(
          'Não há ingressos suficientes disponíveis.',
        );
      await tx.event.update({
        where: { id: eventId },
        data: { heldQuantity: { increment: input.quantity } },
      });
      return tx.reservation.create({
        data: {
          eventId,
          customerId,
          quantity: input.quantity,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    });
  }
}
