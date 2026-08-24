import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query('q') query?: string) {
    return this.events.listMovies(query);
  }

  @Get(':key')
  detail(@Param('key') key: string) {
    return this.events.findMovie(key);
  }
}
