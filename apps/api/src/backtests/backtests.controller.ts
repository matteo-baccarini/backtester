import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { BacktestsService } from './backtests.service';
import { StrategiesService } from '../strategies/strategies.service';
import { RunBacktestDto } from './dto/run-backtest.dto';
import { SMACrossoverStrategy, BacktestEngine } from '@backtester/strategy-engine';
import { OHLCV } from '@backtester/strategy-engine';

@Controller('backtests')
@UseGuards(JwtAuthGuard)
export class BacktestsController {
    constructor(
        private backtestsService: BacktestsService,
        private strategiesService: StrategiesService,
    ) { }

    // POST /backtests/run — Execute a backtest
    @Post('run')
    async runBacktest(@Req() req: any, @Body() runDto: RunBacktestDto) {
        const userId = req.user.id;

        // 1. Verify the strategy exists and belongs to this user
        const strategy = await this.strategiesService.findById(
            runDto.strategyId,
            userId,
        );

        // 2. Generate sample historical data
        const historicalData = this.generateSampleData(
            strategy.symbol,
            new Date(runDto.startDate),
            new Date(runDto.endDate),
        );

        // 3. Create strategy instance from saved parameters
        const strategyInstance = new SMACrossoverStrategy(
            strategy.symbol,
            strategy.longPeriod,
            strategy.shortPeriod,
        );

        // 4. Run the backtest engine
        const engine = new BacktestEngine(
            strategy.symbol,
            runDto.initialCapital,
            strategyInstance,
            historicalData,
        );
        console.log(`[Backtest] Running Engine for strategy ${strategy.id}. Data points: ${historicalData.length}`);
        
        engine.runEngine();

        // 5. Get results from the engine
        const results = engine.getResults();
        console.log(`[Backtest] Finished. Trades: ${results.trades}, initialCapital: ${results.initialCapital}, finalValue: ${results.finalValue}`);

        // 6. Save to database
        const savedBacktest = await this.backtestsService.saveBacktestResult(
            userId,
            strategy.id,
            {
                symbol: strategy.symbol,
                startDate: new Date(runDto.startDate),
                endDate: new Date(runDto.endDate),
                initialCapital: runDto.initialCapital,
                finalValue: results.finalValue,
                totalReturn: results.totalReturn,
                totalReturnPercent: results.totalReturnPercent,
                trades: results.trades,
                winningTrades: results.winningTrades,
                losingTrades: results.losingTrades,
                winRate: results.winRate,
                maxDrawdown: results.maxDrawdown,
                maxDrawdownPercent: results.maxDrawdownPercent,
                sharpeRatio: results.sharpeRatio,
                equityCurve: results.equityCurve,
            },
        );

        return savedBacktest;
    }

    // GET /backtests — List all backtests for the logged-in user
    @Get()
    async findAll(@Req() req: any) {
        return this.backtestsService.findAllByUserId(req.user.id);
    }

    // GET /backtests/:id — Get a single backtest by ID
    @Get(':id')
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.backtestsService.findById(id, req.user.id);
    }

    // GET /backtests/strategy/:strategyId — Get all backtests for a strategy
    @Get('strategy/:strategyId')
    async findByStrategy(
        @Req() req: any,
        @Param('strategyId') strategyId: string,
    ) {
        return this.backtestsService.findByStrategyId(strategyId, req.user.id);
    }

    /**
     * Generate sample OHLCV data for backtesting.
     * Later on this function will be replaced with real historical market data
     */
    private generateSampleData(
        symbol: string,
        startDate: Date,
        endDate: Date,
    ): OHLCV[] {
        const data: OHLCV[] = [];
        let currentDate = new Date(startDate);
        let price = 100; // Starting price

        while (currentDate <= endDate) {
            // Skip weekends (Saturday=6, Sunday=0)
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                // Random walk: price changes by -2% to +2%
                const change = (Math.random() - 0.48) * 0.04; // slight upward bias
                price = price * (1 + change);

                const open = price;
                const high = price * (1 + Math.random() * 0.02);
                const low = price * (1 - Math.random() * 0.02);
                const close = price * (1 + (Math.random() - 0.5) * 0.02);
                const volume = Math.floor(Math.random() * 1000000) + 100000;

                data.push({
                    timestamp: new Date(currentDate),
                    open,
                    high,
                    low,
                    close,
                    volume,
                });

                price = close; // Next day starts from today's close
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return data;
    }
}
