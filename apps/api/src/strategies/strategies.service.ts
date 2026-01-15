import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateStrategyData {
  name: string;
  description?: string;
  symbol: string;
  shortPeriod: number;
  longPeriod: number;
}

interface UpdateStrategyData {
  name?: string;
  description?: string;
  symbol?: string;
  shortPeriod?: number;
  longPeriod?: number;
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
        user: {
          connect: { id: userId },
        },
      },
    });

    return strategy;
  }

  async findAllByUserId(userId: string) {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

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

  async defaultRepeatStrategy(id: string, userId: string) {
    await this.findById(id, userId);

    await this.prisma.strategy.delete({
      where: { id },
    });

    return { message: 'Strategy deleted successfully' };
  }
}
