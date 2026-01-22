import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findAllByUserId(userId : string){
    const backtests = await this.prisma.backtest.findMany({
      where : {
        userId : userId,
      },
      include: {
        strategy : true,
        equityCurve : true,
      },
      orderBy : {
        createdAt : 'desc',
      },
    });
  }

  async findById(id : string, userId : string){
    const backtest = await this.prisma.backtest.findUnique({
      where : {id : id,},
      include : {
        strategy : true,
        equityCurve : {
          orderBy : {
            date : 'asc',
          },
        },
      },
    });

    if (!backtest){
      throw new NotFoundException('Backtest Not Found');
    }

    if(backtest.userId !== userId){
      throw new ForbiddenException('You do not access to this backtest');
    }

    return backtest;
  }

  async findByStrategyId(strategyId : string, userId : string){
    const strategy = await this.prisma.backtest.findUnique({
      where : {id : strategyId},
    });

    if(!strategy) {
      throw new NotFoundException('Strategy Not Found');
    }

    if(strategy.userId !== userId){
      throw new ForbiddenException('You do not have access to this strategy');
    }

    const backtests = await this.prisma.backtest.findMany({
      where: {
        strategyId : strategyId,
        userId: userId,
      },
      include : {
        strategy : true,
        equityCurve : true,
      },
      orderBy : {
        createdAt : 'desc',
      },
    });

    return backtests;
  }
}
