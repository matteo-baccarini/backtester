import { IndicatorResult, OHLCV } from './types';
import { SMA } from './sma';

export class EMA {
  private previousEMA: number | null = null;
  private multiplier : number;
  private period: number;

  constructor(period: number = 20) {
    this.multiplier = 2 / (period + 1);
    this.period = period;
  }
  
  calculate(data: OHLCV[]): IndicatorResult[] {
    const results : IndicatorResult[] = [];
    if (data.length < this.period){
      return results; // not enough data to calculate EMA
    }

    if (this.previousEMA === null) {
      // Calculate initial SMA for the first 'period' data points
      const smaCalculator = new SMA(this.period);
      const smaResults = smaCalculator.calculate(data.slice(0, this.period));
      if (smaResults.length > 0) {
        this.previousEMA = smaResults[smaResults.length - 1].value;
        results.push({ value: this.previousEMA, timestamp: smaResults[smaResults.length - 1].timestamp });
      }
    }

    // Calculate EMA for the rest of the data points
    for (let i = this.period; i < data.length; i++) {
      const closePrice = data[i].close;
      this.previousEMA = (closePrice - this.previousEMA!) * this.multiplier + this.previousEMA!;
      results.push({ value: this.previousEMA, timestamp: data[i].timestamp });
    }

    return results;
  }

  getValue(): number | null {
    return null;
  }
  update(price: number): number | null {
    return null;
  }
  reset(): void {}
}
