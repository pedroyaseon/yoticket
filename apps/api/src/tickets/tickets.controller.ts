import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class TicketsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
  ) {}
  @Get('me') mine(@CurrentUser() u: JwtPayload) {
    return this.prisma.ticket.findMany({
      where: { ownerId: u.sub },
      include: { event: true, seat: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Get(':id') async detail(
    @Param('id') id: string,
    @CurrentUser() u: JwtPayload,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, ownerId: u.sub },
      include: { event: true, seat: true },
    });
    if (!ticket) throw new NotFoundException('Ingresso não encontrado.');
    return ticket;
  }
  @Post(':id/cancel') cancel(
    @Param('id') id: string,
    @CurrentUser() u: JwtPayload,
  ) {
    return this.tickets.cancelAndRefund(id, u.sub);
  }
}
