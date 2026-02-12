import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * A single point on the equity curve.
 *
 * - `date`: timestamp in the backtest timeline
 * - `equity`: portfolio value at that time
 */
interface EquityPointData {
  date: Date;
  equity: number;
}

/**
 * Shape of the full backtest result that we persist.
 *
 * This is intentionally kept close to your `BacktestResult` type
 * from the strategy engine so the mapping is straightforward.
 */
interface BacktestData {
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  trades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  equityCurve: EquityPointData[];
}

@Injectable()
export class BacktestsService {
  /**
   * PrismaService is injected by Nest's dependency injection container.
   * We never manually `new PrismaService()`; Nest does that for us.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Persist a backtest result and its equity curve in a single transaction.
   *
   * - Creates one `Backtest` row
   * - Creates many `EquityPoint` rows linked to that backtest
   *
   * Using `$transaction` guarantees that either all writes succeed,
   * or none do (no partial data if something fails in the middle).
   */
  async saveBacktestResult(
    userId: string,
    strategyId: string,
    backtestData: BacktestData,
  ) {
    // `$transaction` gives us a transaction-scoped Prisma client.
    // If any awaited call inside throws, the transaction is rolled back.
    const result = await this.prisma.$transaction(async (prisma) => {
      const backtest = await prisma.backtest.create({
        data: {
          symbol: backtestData.symbol,
          startDate: backtestData.startDate,
          endDate: backtestData.endDate,
          initialCapital: backtestData.initialCapital,
          finalValue: backtestData.finalValue,
          totalReturn: backtestData.totalReturn,
          totalReturnPercent: backtestData.totalReturnPercent,
          trades: backtestData.trades,
          winningTrades: backtestData.winningTrades,
          losingTrades: backtestData.losingTrades,
          winRate: backtestData.winRate,
          maxDrawdown: backtestData.maxDrawdown,
          maxDrawdownPercent: backtestData.maxDrawdownPercent,
          sharpeRatio: backtestData.sharpeRatio,
          user: {
            connect: { id: userId },
          },
          strategy: {
            connect: { id: strategyId },
          },
        },
      });

      // Bulk-insert equity curve points for performance.
      await prisma.equityPoint.createMany({
        data: backtestData.equityCurve.map((point) => ({
          date: point.date,
          equity: point.equity,
          backtestId: backtest.id,
        })),
      });

      // Re-read the backtest with its related equityCurve ordered by date.
      return prisma.backtest.findUnique({
        where: { id: backtest.id },
        include: {
          equityCurve: {
            orderBy: { date: 'asc' },
          },
        },
      });
    });

    return result;
  }

  /**
   * Get all backtests that belong to a given user.
   *
   * We:
   * - filter by `userId` to enforce ownership
   * - include the related `strategy` and `equityCurve`
   * - order newest → oldest by `createdAt`
   */
  async findAllByUserId(userId: string) {
    return this.prisma.backtest.findMany({
      where: {
        userId,
      },
      include: {
        strategy: true,
        equityCurve: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single backtest by ID, enforcing that it belongs to `userId`.
   *
   * - Throws NotFound if no backtest exists
   * - Throws Forbidden if the backtest belongs to a different user
   */
  async findById(id: string, userId: string) {
    const backtest = await this.prisma.backtest.findUnique({
      where: { id },
      include: {
        strategy: true,
        equityCurve: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!backtest) {
      throw new NotFoundException('Backtest Not Found');
    }

    if (backtest.userId !== userId) {
      throw new ForbiddenException('You do not access to this backtest');
    }

    return backtest;
  }

  /**
   * Get all backtests for a given strategy, enforcing that the
   * strategy belongs to `userId`.
   *
   * Notice the two-step check:
   * 1. Load the strategy and verify ownership
   * 2. Then query backtests for that strategy + user
   */
  async findByStrategyId(strategyId: string, userId: string) {
    // First, confirm the strategy exists and belongs to this user.
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new NotFoundException('Strategy Not Found');
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('You do not have access to this strategy');
    }

    // Then, fetch all matching backtests.
    const backtests = await this.prisma.backtest.findMany({
      where: {
        strategyId,
        userId,
      },
      include: {
        strategy: true,
        equityCurve: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return backtests;
  }
}
