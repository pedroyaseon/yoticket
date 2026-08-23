import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { GateService } from './gate.service';

@Controller('gate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GATE)
export class GateController {
  constructor(private readonly gate: GateService) {}

  @Get('events')
  events() {
    return this.gate.listEvents();
  }

  @Post('validate')
  validate(@Body() input: ValidateTicketDto) {
    return this.gate.validate(input.eventId, input.ticketCode);
  }
}
