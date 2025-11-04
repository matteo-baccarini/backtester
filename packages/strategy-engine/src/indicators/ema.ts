import { IndicatorResult, OHLCV } from './types';

export class EMA {
  private previousEMA: number | null = null;
  private multiplier: number;
  private period: number;
  private prices: number[] = []; // Only store close prices, not full OHLCV
  private initialized: boolean = false;

  constructor(period: number = 20) {
    this.period = period;
    this.multiplier = 2 / (period + 1);
  }

  private hasEnoughData(data: OHLCV[]): boolean {
    return data.length >= this.period;
  }

  // Batch calculation - stateless
  calculate(data: OHLCV[]): IndicatorResult[] {
    if (!this.hasEnoughData(data)) {
      return [];
    }

    const results: IndicatorResult[] = [];
    
    // Calculate initial SMA for first value
    let ema = 0;
    for (let i = 0; i < this.period; i++) {
      ema += data[i].close;
    }
    ema = ema / this.period;

    results.push({
      value: ema,
      timestamp: data[this.period - 1].timestamp
    });

    // Calculate EMA for remaining data
    for (let i = this.period; i < data.length; i++) {
      const closePrice = data[i].close;
      ema = (closePrice - ema) * this.multiplier + ema;
      results.push({
        value: ema,
        timestamp: data[i].timestamp
      });
    }

    return results;
  }

  // Get current EMA value
  getValue(): number | null {
    return this.previousEMA;
  }

  // Streaming update - stateful
  update(price: OHLCV): number | null {
    // If not initialized, collect prices for initial SMA
    if (!this.initialized) {
      this.prices.push(price.close);

      // Need exactly 'period' prices to initialize
      if (this.prices.length < this.period) {
        return null;
      }

      // Calculate initial SMA
      const sum = this.prices.reduce((acc, cur) => acc + cur, 0);
      this.previousEMA = sum / this.period;
      this.initialized = true;
      this.prices = []; // Clear the array, we don't need it anymore
      return this.previousEMA;
    }

    // After initialization, just apply EMA formula
    // No need to maintain a sliding window
    const closePrice = price.close;
    this.previousEMA = (closePrice - this.previousEMA!) * this.multiplier + this.previousEMA!;
    return this.previousEMA;
  }

  // Reset internal state
  reset(): void {
    this.prices = [];
    this.previousEMA = null;
    this.initialized = false;
  }
}