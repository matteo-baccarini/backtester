import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor(private configService: ConfigService) {
    /**
     * We create a pg Pool instance using ConfigService to get DATABASE_URL.
     * This ensures the .env file is loaded before we try to connect.
     *
     * - `DATABASE_URL` comes from your .env and matches the datasource
     *   in `prisma/schema.prisma`.
     * - PrismaPg adapts the pg driver so Prisma can talk to Postgres
     *   using the new Prisma 7 "client" engine.
     */
    // Try ConfigService first, then fall back to process.env
    const databaseUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('DATABASE_URL is not set. Check your .env file in apps/api/.env');
      console.error('Expected format: DATABASE_URL=postgresql://user:password@host:port/database');
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('DATABASE_URL loaded:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

    // Create pool as local variable first (before calling super)
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    /**
     * Prisma 7 requires either:
     * - an `adapter` (for direct DB access via a driver), or
     * - an `accelerateUrl` (for Prisma Accelerate).
     *
     * Here we pass a Postgres adapter backed by the pg Pool.
     * This satisfies the constructor requirement and lets Prisma
     * connect directly to your Docker Postgres.
     *
     * Note: super() must be called before accessing 'this'
     */
    super({
      adapter: new PrismaPg(pool),
    });

    // Now we can assign to this.pool after super() has been called
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Close the underlying pg pool when the app shuts down
    await this.pool.end();
    console.log('Prisma disconnected from database');
  }
}
