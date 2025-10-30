import { IndicatorResult, OHLCV } from "./types";

export class SMA {

  private period: number;
  private prices: number[] = [];

  private hasEnoughData(data : OHLCV[] | number[]): boolean {
    return data.length >= this.period;
  }

  constructor(period: number = 20) {
    this.period = period;
  }

  calculate(data: OHLCV[]): IndicatorResult[] { // calculate SMA for given OHLCV data
    if (!this.hasEnoughData(data)) {
      return []; // if not enough data, return empty array
    }
    
    const results : IndicatorResult[] = [];

    for (let i = 0; i <= (data.length - this.period); i++){
      const periodSlice = data.slice(i, i + this.period); // access groups of 'period' length
      const sum = periodSlice.reduce((acc, cur) => acc + cur.close, 0); // sum the close prices
      const sma = sum / this.period;
      results.push({value : sma, timestamp : periodSlice[periodSlice.length - 1].timestamp}); // push the result with the timestamp of the last entry in the period
    }

    return results;
  }

  getValue(): number | null {
    if (!this.hasEnoughData(this.prices)) {
      return null;
    }

    const sum = this.prices.reduce((acc, cur) => acc + cur, 0);
    const sma = sum/this.period;
    return sma;

  }

  update(price: OHLCV): number | null {
    if (this.prices.length >= this.period - 1) {
      if (this.prices.length === this.period - 1) {
        this.prices.push(price.close);
      }
      this.prices.shift(); // remove oldest price
      this.prices.push(price.close); // add new price
      
      const sum = this.prices.reduce((acc, cur) => acc + cur, 0);
      const sma = sum / this.period;
      return sma;
    }else{
      this.prices.push(price.close);
      return null; // not enough data to calculate SMA yet
    }
  }

  reset(): void {
    this.prices = [];
  }
}
