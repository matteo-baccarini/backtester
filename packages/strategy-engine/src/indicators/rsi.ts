import { IndicatorResult, OHLCV } from "./types";

export class RSI {
  private period : number;

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
  
  // calculate(data: OHLCV[]): IndicatorResult[] {
  //   if (!this.hasEnoughData(data)) {
  //     return [];
  //   }

  //   const results : IndicatorResult[] = [];
  //   const {avgGain, avgLosses} = this.calculateGainLoss(data.slice(0, this.period + 1));

  //   let currentAvgGain = avgGain;
  //   let currentAvgLosses = avgLosses;


  // }

  getValue(): number | null {
    return null;
  }
  update(price: number): number | null {
    return null;
  }
  reset(): void {}
}
