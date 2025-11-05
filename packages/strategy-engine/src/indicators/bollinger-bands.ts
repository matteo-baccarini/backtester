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

  private calculateStandardDeviation(data : OHLCV[], mean : IndicatorResult[]) : number[] {
    const stdDevs : number[] = [];
    let averageSquares : number = 0;

    for (let i = 0; i < data.length; i++) {
      const smaIndex = i % this.period;
      const difference = data[i].close - mean[smaIndex].value!;
      averageSquares += ( difference * difference) / (i + 1);

      if (i % this.period - 1 === 0 && i > 0){
        stdDevs.push(Math.sqrt(averageSquares));
        averageSquares = 0;
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
