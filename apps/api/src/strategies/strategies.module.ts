import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StrategiesService } from './strategies.service';

@Module({
  imports: [PrismaModule],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
