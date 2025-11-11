import {Signal, IsStrategy, SMA, OHLCV, Portfolio} from '../index'

export class SMACrossoverStrategy implements IsStrategy {
    private symbol: string;
    private shortPeriod: number;
    private longPeriod: number;
    
    private shortSMA: SMA;
    private longSMA: SMA;
    private previousShortValue: number | null = null;
    private previousLongValue: number | null = null;

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
        let signal: Signal = {
            action: 'HOLD',
            symbol: this.symbol,
            confidence: 0,
            reason: 'No crossover signal',
            timestamp: price.timestamp,
        };

        // Check for crossover if we have previous values
        if (this.previousShortValue !== null && this.previousLongValue !== null) {
            const currentShort = shortValue.value!;
            const currentLong = longValue.value!;
            
            // Detect bullish crossover: short was at or below, now above
            const wasBelowOrEqual = this.previousShortValue <= this.previousLongValue;
            const isAbove = currentShort > currentLong;
            
            if (wasBelowOrEqual && isAbove && !position) {
                signal = {
                    action: 'BUY',
                    symbol: this.symbol,
                    confidence: Math.min(Math.abs(currentShort - currentLong) / currentLong, 1.0),
                    reason: `SMA(${this.shortPeriod}) crossed above SMA(${this.longPeriod})`,
                    timestamp: price.timestamp,
                };
            }
            
            // Detect bearish crossover: short was at or above, now below
            const wasAboveOrEqual = this.previousShortValue >= this.previousLongValue;
            const isBelow = currentShort < currentLong;
            
            if (wasAboveOrEqual && isBelow && position) {
                signal = {
                    action: 'SELL',
                    symbol: this.symbol,
                    confidence: Math.min(Math.abs(currentLong - currentShort) / currentLong, 1.0),
                    reason: `SMA(${this.shortPeriod}) crossed below SMA(${this.longPeriod})`,
                    timestamp: price.timestamp,
                };
            }
        } else {
            // First time both SMAs are ready - treat as initial position based on relationship
            if (shortValue.value! > longValue.value! && !position) {
                signal = {
                    action: 'BUY',
                    symbol: this.symbol,
                    confidence: Math.min(Math.abs(shortValue.value! - longValue.value!) / longValue.value!, 1.0),
                    reason: `Initial signal: SMA(${this.shortPeriod}) above SMA(${this.longPeriod})`,
                    timestamp: price.timestamp,
                };
            }
        }

        // Store current values for next comparison
        this.previousShortValue = shortValue.value!;
        this.previousLongValue = longValue.value!;

        return signal;
    }

    reset(): void {
        this.longSMA.reset();
        this.shortSMA.reset();
        this.previousShortValue = null;
        this.previousLongValue = null;
    }
}