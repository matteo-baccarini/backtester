import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface EquityPointData {
  date: Date;
  equity: number;
}

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
  constructor(private prisma: PrismaService) {}

  async saveBacktestResult(
    userId: string,
    strategyId: string,
    backtestData: BacktestData,
  ) {
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

      await prisma.equityPoint.createMany({
        data: backtestData.equityCurve.map((point) => ({
          date: point.date,
          equity: point.equity,
          backtestId: backtest.id,
        })),
      });

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
}
