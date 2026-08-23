import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER)
export class EventsController {
  constructor(private readonly events: EventsService) {}
  @Post('events') create(
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateEventDto,
  ) {
    return this.events.create(user.sub, input);
  }
  @Get('organizer/events') mine(@CurrentUser() user: JwtPayload) {
    return this.events.listMine(user.sub);
  }
  @Post('events/:id/publish') publish(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.events.publish(id, user.sub);
  }
}
