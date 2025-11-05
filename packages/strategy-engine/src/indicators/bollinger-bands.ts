import { OHLCV, IndicatorResult, BollingerBandsResult } from "./types";
import {SMA} from "./sma";


export class BollingerBands {
  private period : number;
  private multiplier : number;
  private smaIndicator : SMA;

  constructor(period: number = 20, multiplier: number = 2) {
    this.period = period;
    this.multiplier = multiplier;
    this.smaIndicator = new SMA(period);
  }

  private hasEnoughData(data : OHLCV[]) : boolean {
    return data.length > this.period;
  }

  private calculateStandardDeviation(data: OHLCV[]): number[] {
    const stdDevs: number[] = [];

    let sum = 0;
    let sumSquares = 0;

    for (let i = 0; i < data.length; i++) {
      const price = data[i].close;

      sum += price;
      sumSquares += price * price;

      // Once we exceed the window, subtract the price that’s sliding out
      if (i >= this.period) {
        const old = data[i - this.period].close;
        sum -= old;
        sumSquares -= old * old;
      }

      // Once the window is full, compute std deviation
      if (i >= this.period - 1) {
        const mean = sum / this.period;
        const variance = (sumSquares / this.period) - (mean * mean);
        stdDevs.push(Math.sqrt(Math.max(variance, 0))); // handle rounding errors
      }
    }

    return stdDevs;
  }

  calculate(data: OHLCV[]): BollingerBandsResult {
    if (!this.hasEnoughData(data)){
      return { upper: [], middle: [], lower: [] };
    }
    const middleBand = this.smaIndicator.calculate(data);

    return { upper: [], middle: [], lower: [] };
  }
  update(price: number): BollingerBandsResult {
    return { upper: [], middle: [], lower: [] };
  }
  reset(): void {}
}
