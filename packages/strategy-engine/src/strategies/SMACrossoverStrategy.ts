import {Signal, IsStrategy, SMA, OHLCV, Portfolio} from '../index'

export class SMACrossoverStrategy implements IsStrategy{
    private symbol : string;
    
    private shortSMA : SMA;
    private longSMA : SMA;

    constructor(symbol : string, longPeriod : number, shortPeriod : number) {
        this.symbol = symbol;
        this.shortSMA = new SMA(shortPeriod);
        this.longSMA = new SMA(longPeriod);
    }

    onBar(price : OHLCV, portfolio : Portfolio) : Signal {
        const shortValue = this.shortSMA.update(price);
        const longValue = this.longSMA.update(price);

        if (shortValue == null || longValue == null || shortValue.value == null || longValue.value == null){
            return {
                action : 'HOLD',
                symbol : this.symbol,
                confidence : 0,
                reason : "SMA values not yet calculated",
                timestamp : price.timestamp,
            }
        }

        const position = portfolio.getPosition(this.symbol);

        if (shortValue.value > longValue.value && !position) {
            return {
                action : 'BUY',
                symbol : this.symbol,
                confidence : (shortValue.value - longValue.value) / longValue.value,
                reason : `SMA(${shortValue}) crossed above SMA(${longValue})`,
                timestamp : price.timestamp,
            }
        }

        if (shortValue.value < longValue.value && position){
            return {
                action : 'SELL',
                symbol : this.symbol,
                confidence : (longValue.value - shortValue.value) / longValue.value,
                reason : `SMA(${shortValue}) crossed below SMA(${longValue})`,
                timestamp : price.timestamp,
            }
        }

        return {
            action : 'HOLD',
            symbol : this.symbol,
            confidence : 0,
            reason : 'Hold for future values',
            timestamp : price.timestamp,
        }
    }

    reset() : void {
        this.longSMA.reset();
        this.shortSMA.reset();
    }
}