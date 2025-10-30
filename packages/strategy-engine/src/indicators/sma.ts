import { IndicatorResult, OHLCV } from "./types";

export class SMA {

  private period: number;
  private prices: number[] = [];

  constructor(period: number = 20) {
    this.period = period;
  }
  calculate(data: OHLCV[]): IndicatorResult[] {
    const results : IndicatorResult[] = [];

    for (let i = 0; i < (data.length - this.period); i++){
      const periodSlice = data.slice(i, i + this.period);
      const sum = periodSlice.reduce((acc, cur) => acc + cur.close, 0);
      const sma = sum / this.period;
      results.push({value : sma, timestamp : periodSlice[periodSlice.length - 1].timestamp});
    }

    return results;
  }

  getValue(): OHLCV | null {
    return null;
  }
  update(price: number): number | null {
    return null; 
  }
  reset(): void {}
}
