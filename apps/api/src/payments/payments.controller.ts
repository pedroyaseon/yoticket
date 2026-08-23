import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';
@Controller('reservations/:id/payment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() process(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: PaymentDto,
  ) {
    return this.payments.process(id, user.sub, body.outcome);
  }
}
