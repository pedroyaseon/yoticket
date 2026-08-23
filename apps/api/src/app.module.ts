import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
