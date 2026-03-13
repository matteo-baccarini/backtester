import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BacktestsService } from './backtests.service';
import { BacktestsController } from './backtests.controller';
import { StrategiesModule } from '../strategies/strategies.module';

/**
 * BacktestsModule
 *
 * - A NestJS "feature module" that groups everything related
 *   to backtests (services, controllers later, etc.).
 * - By importing `PrismaModule`, it can inject `PrismaService`
 *   into `BacktestsService` via Nest's dependency injection.
 */
@Module({
  // Other modules this module depends on
  imports: [PrismaModule,
    StrategiesModule,
  ],
  controllers: [BacktestsController],
  // Classes Nest can instantiate within this module
  providers: [BacktestsService],
  // What this module exposes so other modules can inject it
  exports: [BacktestsService],
})
export class BacktestsModule { }

