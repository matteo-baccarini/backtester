import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StrategiesModule } from './strategies/strategies.module';
import { BacktestsModule } from './backtests/backtests.module';
import { AuthModule } from './auth/auth.module';

@Module({
  // The root module aggregates all feature modules for the application.
  imports: [
    // Loads environment variables (e.g. DATABASE_URL) into process.env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Makes PrismaService available to all importing modules
    PrismaModule,
    // User-related database operations (create/find users)
    UsersModule,
    // Strategy CRUD logic tied to the logged-in user
    StrategiesModule,
    // Backtest persistence + queries
    BacktestsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
