import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GateController } from './gate.controller';
import { GateService } from './gate.service';

@Module({
  imports: [AuthModule],
  controllers: [GateController],
  providers: [GateService],
})
export class GateModule {}
