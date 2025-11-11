import {Signal, IsStrategy, SMA, OHLCV, Portfolio} from '../index'

class SMACrossoverStrategy implements IsStrategy{
    private symbol : string;
    
    private shortSMA : SMA;
    private longSMA : SMA;

    constructor(symbol : string, longPeriod : number, shortPeriod : number) {
        this.symbol = symbol;
        this.shortSMA = new SMA(shortPeriod);
        this.longSMA = new SMA(longPeriod);
    }

    onBar(price : OHLCV, portfolio : Portfolio) : Signal {
        this.shortSMA.update(price);
        this.longSMA.update(price);
    }
}