import { IndicatorResult, OHLCV } from './types';
import { EMA } from './ema';

export class MACD {
  private fastEMA : EMA;
  private slowEMA : EMA;
  private signalEMA : EMA;
  private slowPeriod : number;
  private fastPeriod : number;
  private signalPeriod : number;

  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;

    this.fastEMA = new EMA(this.fastPeriod);
    this.slowEMA = new EMA(this.slowPeriod);
    this.signalEMA = new EMA(this.signalPeriod);
  }

  calculate(data: OHLCV[]): any {
    /// first calculate fast and slow EMA
    ///then MACD line = fastEMA - slowEMA
    /// then signal line = EMA of MACD line
    /// histogram = MACD line - signal line

    
    return { macd: [], signal: [], histogram: [] };
  }

  update(price: number): any {
    return { macd: null, signal: null, histogram: null };
  }

  reset(): void {}
}
