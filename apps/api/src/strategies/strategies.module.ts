import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StrategiesService } from './strategies.service';
import { StrategiesController } from '../auth/strategies/strategies.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule { }
