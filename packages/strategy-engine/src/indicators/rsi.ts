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
    return data.length >= 14;
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
  
  calculate(data: OHLCV[]): IndicatorResult[] {
    if (!this.hasEnoughData(data)) {
      return [];
    }

    const results : IndicatorResult[] = [];

    const { avgGain, avgLosses } = this.calculateGainLoss(data);
    this.avgGain = avgGain;
    this.avgLosses = avgLosses;

    for (let i = this.period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      let gain = 0;
      let loss = 0;
      
      if (change > 0) {
        gain = change;
      } else {
        loss = Math.abs(change);
      }

      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLosses = (this.avgLosses * (this.period - 1) + loss) / this.period;
      
      let rs = this.avgLosses === 0 ? 100 : this.avgGain / this.avgLosses;
      let rsi = 100 - (100 / (1 + rs));
    }

    return results;    
  }

  getValue(): number | null {
    return null;
  }
  update(data: OHLCV): number | null {
    
    return null;
  }
  reset(): void {}
}
