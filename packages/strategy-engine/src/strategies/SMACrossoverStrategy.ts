import {Signal, IsStrategy, SMA, OHLCV, Portfolio} from '../index'

export class SMACrossoverStrategy implements IsStrategy {
    private symbol: string;
    private shortPeriod: number;
    private longPeriod: number;
    
    private shortSMA: SMA;
    private longSMA: SMA;

    constructor(symbol: string, longPeriod: number, shortPeriod: number) {
        this.symbol = symbol;
        this.shortPeriod = shortPeriod;
        this.longPeriod = longPeriod;
        this.shortSMA = new SMA(shortPeriod);
        this.longSMA = new SMA(longPeriod);
    }

    onBar(price: OHLCV, portfolio: Portfolio): Signal {
        const shortValue = this.shortSMA.update(price);
        const longValue = this.longSMA.update(price);

        if (shortValue === null || longValue === null) {
            return {
                action: 'HOLD',
                symbol: this.symbol,
                confidence: 0,
                reason: "SMA values not yet calculated",
                timestamp: price.timestamp,
            }
        }

        const position = portfolio.getPosition(this.symbol);

        if (shortValue.value! > longValue.value! && !position) {
            return {
                action: 'BUY',
                symbol: this.symbol,
                confidence: Math.min(Math.abs(shortValue.value! - longValue.value!) / longValue.value!, 1.0),
                reason: `SMA(${this.shortPeriod}) crossed above SMA(${this.longPeriod})`,
                timestamp: price.timestamp,
            }
        }

        if (shortValue.value! < longValue.value! && position) {
            return {
                action: 'SELL',
                symbol: this.symbol,
                confidence: Math.min(Math.abs(longValue.value! - shortValue.value!) / longValue.value!, 1.0),
                reason: `SMA(${this.shortPeriod}) crossed below SMA(${this.longPeriod})`,
                timestamp: price.timestamp,
            }
        }

        return {
            action: 'HOLD',
            symbol: this.symbol,
            confidence: 0,
            reason: 'No crossover signal',
            timestamp: price.timestamp,
        }
    }

    reset(): void {
        this.longSMA.reset();
        this.shortSMA.reset();
    }
}