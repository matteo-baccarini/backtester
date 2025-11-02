import { IndicatorResult, OHLCV } from "./types";

export class RSI {
  private period: number;
  private avgGain: number | null = null;
  private avgLoss: number | null = null;
  private previousClose: number | null = null;
  private prices: number[] = [];

  constructor(period: number = 14) {
    this.period = period;
  }

  private hasEnoughData(data: OHLCV[]): boolean {
    return data.length >= this.period + 1;
  }

  private calculateGainLoss(data: OHLCV[]): { avgGain: number; avgLoss: number } {
    let gains = 0;
    let losses = 0;

    // Calculate changes from the price data
    // data.length should be period + 1, giving us period changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    // Number of changes is data.length - 1
    const numChanges = data.length - 1;

    return {
      avgGain: gains / numChanges,
      avgLoss: losses / numChanges
    };
  }

  private calculateRSI(avgGain: number, avgLoss: number): number {
    if (avgLoss === 0 && avgGain === 0) return 100; // flat
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  calculate(data: OHLCV[]): IndicatorResult[] {
    if (!this.hasEnoughData(data)) return [];

    const results: IndicatorResult[] = [];

    // First average from first N+1 prices
    let { avgGain, avgLoss } = this.calculateGainLoss(data.slice(0, this.period + 1));

    // First RSI
    results.push({
      value: this.calculateRSI(avgGain, avgLoss),
      timestamp: data[this.period].timestamp
    });

    // Wilder’s smoothing
    for (let i = this.period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (this.period - 1) + gain) / this.period;
      avgLoss = (avgLoss * (this.period - 1) + loss) / this.period;

      results.push({
        value: this.calculateRSI(avgGain, avgLoss),
        timestamp: data[i].timestamp
      });
    }

    return results;
  }

  update(data: OHLCV): number | null {
    this.prices.push(data.close);

    if (this.prices.length < this.period + 1) {
      this.previousClose = data.close;
      return null;
    }

    // Initialize averages
    if (this.avgGain === null || this.avgLoss === null) {
      let gains = 0;
      let losses = 0;
      for (let i = 1; i < this.period + 1; i++) {
        const change = this.prices[i] - this.prices[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
      }

      this.avgGain = gains / this.period;
      this.avgLoss = losses / this.period;
      this.previousClose = data.close;

      return this.calculateRSI(this.avgGain, this.avgLoss);
    }

    // Wilder smoothing
    const change = data.close - (this.previousClose ?? data.close);
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
    this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
    this.previousClose = data.close;

    return this.calculateRSI(this.avgGain, this.avgLoss);
  }

  getValue(): number | null {
    if (this.avgGain === null || this.avgLoss === null) return null;
    return this.calculateRSI(this.avgGain, this.avgLoss);
  }

  reset(): void {
    this.avgGain = null;
    this.avgLoss = null;
    this.previousClose = null;
    this.prices = [];
  }
}
