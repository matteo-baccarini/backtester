import { IndicatorResult, OHLCV } from "./types";

export class RSI {
  private period : number;
  private avgGain: number = 0;
  private avgLosses: number = 0;
  private previousClose: number | null = null;
  private prices: number[] = [];

  constructor(period: number = 14) {
    this.period = period;
  }

  private hasEnoughData(data : OHLCV[]): boolean {
    return data.length >= this.period + 1;
  }

  private calculateGainLoss(data: OHLCV[]): { avgGain: number; avgLosses: number } {
    let gains: number = 0;
    let losses : number = 0;

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    return { avgGain : gains/this.period , avgLosses : losses/this.period };
  }

  calculateRSI(avgGain: number, avgLosses: number): number {
    if (avgLosses === 0) {
      return 100;
    }
    const rs = avgGain / avgLosses;
    return 100 - (100 / (1 + rs));
  }
  
  calculate(data: OHLCV[]): IndicatorResult[] {
    if (!this.hasEnoughData(data)) {
      return [];
    }

    const results : IndicatorResult[] = [];

    const { avgGain, avgLosses } = this.calculateGainLoss(data);
    let gain = avgGain;
    let loss = avgLosses;

    const firstRSI = this.calculateRSI(gain, loss);
    results.push({
      value: firstRSI,
      timestamp: data[this.period].timestamp
    });
      
    for (let i = this.period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gain = 0;
      loss = 0;
      
      if (change > 0) {
        gain = change;
      } else {
        loss = Math.abs(change);
      }

      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLosses = (this.avgLosses * (this.period - 1) + loss) / this.period;
    
      let rsi = this.calculateRSI(this.avgGain, this.avgLosses);

      results.push({
        value: rsi,
        timestamp: data[i].timestamp
      });
    }

    return results;    
  }

  getValue(): number | null {
    return null;
  }
  
  update(data: OHLCV): number | null {
    const close = data.close;

    this.prices.push(close);

    if (this.prices.length < this.period + 1) {
      return null;
    }

    if (this.avgGain === null || this.avgLosses === null) {
      let gains: number = 0;
      let losses: number = 0;

      for (let i = 1; i < this.prices.length; i++) {
        const change = this.prices[i] - this.prices[i - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }

      this.avgGain = gains / this.period;
      this.avgLosses = losses / this.period;
      this.previousClose = this.prices[this.period];

      return this.calculateRSI(this.avgGain, this.avgLosses);
    }

    
    return null;
  }
  reset(): void {}
}
