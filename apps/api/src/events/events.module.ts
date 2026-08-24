import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { PublicEventsController } from './public-events.controller';
import { EventsService } from './events.service';
import { AuthModule } from '../auth/auth.module';
import { MoviesController } from './movies.controller';
import { VenuesController } from './venues.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    EventsController,
    PublicEventsController,
    MoviesController,
    VenuesController,
  ],
  providers: [EventsService],
})
export class EventsModule {}
