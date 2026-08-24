import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.listVenues();
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.events.findVenue(slug);
  }
}
