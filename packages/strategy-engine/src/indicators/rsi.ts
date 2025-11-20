import { IndicatorResult, OHLCV } from "./types";

export class RSI {
  private period: number;
  private avgGain: number | null = null;
  private avgLoss: number | null = null;
  private previousClose: number | null = null;
  private warmUpCount: number = 0;
  private warmUpGainSum: number = 0;
  private warmUpLossSum: number = 0;

  constructor(period: number = 14) {
    this.period = period;
  }

  private hasEnoughData(data: OHLCV[]): boolean {
    return data.length > this.period;
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

    // Wilder's smoothing
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

  update(data: OHLCV): IndicatorResult | null {
    // First bar: just store the close
    if (this.previousClose === null) {
      this.previousClose = data.close;
      return null;
    }

    // Calculate change from previous close
    const change = data.close - this.previousClose;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    // Warm-up phase: we need 'period' changes to calculate first RSI
    // warmUpCount tracks how many changes we've accumulated
    if (this.warmUpCount < this.period) {
      this.warmUpGainSum += gain;
      this.warmUpLossSum += loss;
      this.warmUpCount++;
      this.previousClose = data.close;

      // Still warming up
      if (this.warmUpCount < this.period) {
        return null;
      }

      // We now have exactly 'period' changes, calculate first averages
      this.avgGain = this.warmUpGainSum / this.period;
      this.avgLoss = this.warmUpLossSum / this.period;

      return {
        value: this.calculateRSI(this.avgGain, this.avgLoss),
        timestamp: data.timestamp
      };
    }

    // After warm-up: Wilder's smoothing
    this.avgGain = (this.avgGain! * (this.period - 1) + gain) / this.period;
    this.avgLoss = (this.avgLoss! * (this.period - 1) + loss) / this.period;
    this.previousClose = data.close;

    return {
      value: this.calculateRSI(this.avgGain, this.avgLoss),
      timestamp: data.timestamp
    };
  }

  getValue(): number | null {
    if (this.avgGain === null || this.avgLoss === null) return null;
    return this.calculateRSI(this.avgGain, this.avgLoss);
  }

  reset(): void {
    this.avgGain = null;
    this.avgLoss = null;
    this.previousClose = null;
    this.warmUpCount = 0;
    this.warmUpGainSum = 0;
    this.warmUpLossSum = 0;
  }
}