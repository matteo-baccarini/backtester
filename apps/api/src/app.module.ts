import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StrategiesModule } from './strategies/strategies.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    UsersModule,
    StrategiesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
