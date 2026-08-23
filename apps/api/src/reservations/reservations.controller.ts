import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';
@Controller('events/:eventId/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}
  @Post() create(
    @Param('eventId') eventId: string,
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateReservationDto,
  ) {
    return this.reservations.create(eventId, user.sub, input);
  }
}
