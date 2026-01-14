import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateStrategyData {
  name: string;
  description?: string;
  symbol: string;
  shortPeriod: number;
  longPeriod: number;
}

@Injectable()
export class StrategiesService {
  constructor(private prisma: PrismaService) {}

  async createStrategy(userId: string, strategyData: CreateStrategyData) {
    const strategy = await this.prisma.strategy.create({
      data: {
        name: strategyData.name,
        description: strategyData.description,
        symbol: strategyData.symbol,
        shortPeriod: strategyData.shortPeriod,
        longPeriod: strategyData.longPeriod,
        userId: userId,
      },
    });

    return strategy;
  }
}
