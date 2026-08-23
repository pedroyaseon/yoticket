import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsController } from './tickets.controller';
import { SharedTicketsController } from './shared-tickets.controller';
@Module({
  imports: [AuthModule],
  controllers: [TicketsController, SharedTicketsController],
})
export class TicketsModule {}
