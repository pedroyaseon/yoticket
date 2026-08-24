import { Injectable } from '@nestjs/common';
import { EventStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type GateValidationStatus =
  'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_EVENT';

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED, startsAt: { gte: new Date() } },
      select: {
        id: true,
        externalId: true,
        title: true,
        location: true,
        startsAt: true,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async validate(eventId: string, scannedValue: string) {
    const ticketCode = this.ticketCodeFrom(scannedValue);
    return this.prisma.$transaction(async (tx) => {
      const used = await tx.ticket.updateMany({
        where: { code: ticketCode, eventId, status: TicketStatus.VALID },
        data: { status: TicketStatus.USED, usedAt: new Date() },
      });
      if (used.count === 1) return { status: 'VALID' as GateValidationStatus };

      const ticket = await tx.ticket.findUnique({
        where: { code: ticketCode },
        select: { eventId: true, status: true },
      });
      if (!ticket) return { status: 'INVALID' as GateValidationStatus };
      if (ticket.eventId !== eventId)
        return { status: 'WRONG_EVENT' as GateValidationStatus };
      if (ticket.status === TicketStatus.USED)
        return { status: 'ALREADY_USED' as GateValidationStatus };
      return { status: 'INVALID' as GateValidationStatus };
    });
  }

  private ticketCodeFrom(value: string) {
    try {
      const url = new URL(value);
      const match = url.pathname.match(/^\/tickets\/shared\/([^/]+)$/);
      return match ? decodeURIComponent(match[1]) : value;
    } catch {
      return value;
    }
  }
}
