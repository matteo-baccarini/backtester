import { IndicatorResult, OHLCV } from "./types";

export class SMA {
  private period: number;
  private prices: number[] = []; // Store only close prices

  constructor(period: number = 20) {
    this.period = period;
  }

  private hasEnoughData(): boolean {
    return this.prices.length >= this.period;
  }

  // Batch calculation for an entire dataset
  calculate(data: OHLCV[]): IndicatorResult[] {
    if (data.length < this.period) {
      return [];
    }

    const results: IndicatorResult[] = [];

    for (let i = 0; i <= data.length - this.period; i++) {
      let sum = 0;
      for (let j = i; j < i + this.period; j++) {
        sum += data[j].close;
      }
      const sma = sum / this.period;

      results.push({
        value: sma,
        timestamp: data[i + this.period - 1].timestamp,
      });
    }

    return results;
  }

  // Return current SMA for the stored prices
  getValue(): number | null {
    if (!this.hasEnoughData()) {
      return null;
    }

    const sum = this.prices.reduce((acc, cur) => acc + cur, 0);
    return sum / this.period;
  }

  // Incrementally update SMA with a new price
  update(price: OHLCV): IndicatorResult | null {
    this.prices.push(price.close); // Only store close price

    // Maintain rolling window
    if (this.prices.length > this.period) {
      this.prices.shift();
    }

    // Only compute once enough data exists
    if (!this.hasEnoughData()) {
      return null;
    }

    const sum = this.prices.reduce((acc, cur) => acc + cur, 0);
    return {
      value: sum / this.period,
      timestamp: price.timestamp,
    };
  }

  // Reset internal state
  reset(): void {
    this.prices = [];
  }
}