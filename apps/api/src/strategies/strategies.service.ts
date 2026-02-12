import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Data required to create a new Strategy.
 *
 * This intentionally mirrors the fields in the `Strategy` model
 * from your Prisma schema.
 */
interface CreateStrategyData {
  name: string;
  description?: string;
  symbol: string;
  shortPeriod: number;
  longPeriod: number;
}

/**
 * Data allowed when updating an existing Strategy.
 *
 * All fields are optional here because we support partial updates.
 */
interface UpdateStrategyData {
  name?: string;
  description?: string;
  symbol?: string;
  shortPeriod?: number;
  longPeriod?: number;
}
@Injectable()
export class StrategiesService {
  // PrismaService is injected by Nest's DI container.
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new strategy owned by `userId`.
   *
   * - Uses a relation `user.connect` to link the Strategy to the User row
   * - Prisma will throw if `userId` does not exist (FK constraint)
   */
  async createStrategy(userId: string, strategyData: CreateStrategyData) {
    const strategy = await this.prisma.strategy.create({
      data: {
        name: strategyData.name,
        description: strategyData.description,
        symbol: strategyData.symbol,
        shortPeriod: strategyData.shortPeriod,
        longPeriod: strategyData.longPeriod,
        user: {
          connect: { id: userId },
        },
      },
    });

    return strategy;
  }

  /**
   * Return all strategies that belong to a user, newest first.
   */
  async findAllByUserId(userId: string) {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single strategy, enforcing ownership.
   *
   * - Throws NotFound if the strategy doesn't exist
   * - Throws Forbidden if it belongs to a different user
   */
  async findById(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('You do not have access to this strategy');
    }

    return strategy;
  }

  /**
   * Update an existing strategy.
   *
   * We:
   * 1. Re-use `findById` to enforce existence + ownership
   * 2. Then let Prisma apply the changes
   */
  async updateStrategy(
    id: string,
    userId: string,
    updateData: UpdateStrategyData,
  ) {
    await this.findById(id, userId);

    const updatedStrategy = await this.prisma.strategy.update({
      where: { id },
      data: updateData,
    });

    return updatedStrategy;
  }

  /**
   * Delete a strategy after verifying the user owns it.
   *
   * Note:
   * - If there are related backtests, Prisma/DB will respect the
   *   `onDelete` behaviour defined in your Prisma schema.
   */
  async deleteStrategy(id: string, userId: string) {
    await this.findById(id, userId);

    await this.prisma.strategy.delete({
      where: { id },
    });

    return { message: 'Strategy deleted successfully' };
  }
}
