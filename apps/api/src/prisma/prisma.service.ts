import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * We create a single pg Pool instance for the whole process.
 *
 * - `DATABASE_URL` comes from your .env and matches the datasource
 *   in `prisma/schema.prisma`.
 * - PrismaPg adapts the pg driver so Prisma can talk to Postgres
 *   using the new Prisma 7 "client" engine.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    /**
     * Prisma 7 requires either:
     * - an `adapter` (for direct DB access via a driver), or
     * - an `accelerateUrl` (for Prisma Accelerate).
     *
     * Here we pass a Postgres adapter backed by the pg Pool.
     * This satisfies the constructor requirement and lets Prisma
     * connect directly to your Docker Postgres.
     */
    super({
      adapter: new PrismaPg(pool),
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Close the underlying pg pool when the app shuts down
    await pool.end();
    console.log('Prisma disconnected from database');
  }
}
