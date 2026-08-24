import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tickets/shared')
export class SharedTicketsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async detail(@Param('code') code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code },
      select: {
        code: true,
        status: true,
        ticketType: true,
        priceInCents: true,
        seat: { select: { label: true } },
        event: {
          select: {
            title: true,
            posterUrl: true,
            location: true,
            startsAt: true,
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ingresso não encontrado.');
    return ticket;
  }
}
