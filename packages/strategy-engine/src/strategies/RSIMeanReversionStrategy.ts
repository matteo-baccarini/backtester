import { IsStrategy, RSI, OHLCV, Portfolio, Signal } from '../index';

export class RSIStrategy implements IsStrategy {
    ///usually calculates RSI over 14 day period
    ///if RSI goes above 70 (80 or 90 for more aggressive strategy) sell / short
    ///
    ///if RSI goes below 30 (20 or 10 for more aggressive strategy) BUY / long
    ///
    ///possible improvement -> only take longs when price is above 200 day SMA and shorts when below
    private RSI : RSI;
    private symbol : string;
    private oversoldThreshold : number;
    private overboughtThreshold : number;
    private previousRSI : number | null = null;

    constructor(symbol : string, RSIPeriod : number, oversold : number = 30, overbought : number = 70){
        this.symbol = symbol;
        this.RSI = new RSI(RSIPeriod);
        this.overboughtThreshold = overbought;
        this.oversoldThreshold = oversold;
    }
}