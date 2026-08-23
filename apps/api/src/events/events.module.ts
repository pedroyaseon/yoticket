import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { PublicEventsController } from './public-events.controller';
import { EventsService } from './events.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService],
})
export class EventsModule {}
