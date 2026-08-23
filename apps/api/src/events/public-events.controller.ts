import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class PublicEventsController {
  constructor(private readonly events: EventsService) {}
  @Get() list(@Query('q') query?: string) {
    return this.events.listPublished(query);
  }
  @Get(':id') detail(@Param('id') id: string) {
    return this.events.findPublished(id);
  }
}
