import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  ReservationsController,
  SeatAvailabilityController,
} from './reservations.controller';
import { ReservationsService } from './reservations.service';
@Module({
  imports: [AuthModule],
  controllers: [ReservationsController, SeatAvailabilityController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
