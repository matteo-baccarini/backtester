import { OHLCV, IndicatorResult, BollingerBandsResult } from "./types";
import {SMA} from "./sma";


export class BollingerBands {
  private period : number;
  private multiplier : number;
  private smaIndicator : SMA;
  prices : OHLCV[] = [];

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

    const smaResults = this.smaIndicator.calculate(data);
    const standardDeviations = this.calculateStandardDeviation(data);

    const upperBand : IndicatorResult[] = [];
    const lowerBand : IndicatorResult[] = [];

    for (let i = 0; i < standardDeviations.length; i++){
      upperBand.push({ value : smaResults[i].value! + this.multiplier * standardDeviations[i] , timestamp : smaResults[i].timestamp });
      lowerBand.push({ value : smaResults[i].value! - this.multiplier * standardDeviations[i] , timestamp : smaResults[i].timestamp });
    }
    return { upper: upperBand, middle: smaResults, lower: lowerBand };
  }

  update(price: OHLCV): BollingerBandsResult {
    this.prices.push(price);

    // Maintain rolling window
    if (this.prices.length > this.period + 1) {
      this.prices.shift();
    }

    // Only compute once enough data exists
    if (!this.hasEnoughData(this.prices)) {
      return { upper: [], middle: [], lower: [] };
    }

    const stdDev = this.calculateStandardDeviation(this.prices);

    const middle = this.smaIndicator.update(price);

    
  // If middle is null, we can’t compute the bands yet
  if (!middle) {
    return { upper: [], middle: [], lower: [] };
  }


  const upper = middle.value !== null ? middle.value + this.multiplier * stdDev[stdDev.length -1] : null;
  const lower = middle.value !== null ? middle.value - this.multiplier * stdDev[stdDev.length -1] : null;

  return {
    upper: [{ value: upper, timestamp : price.timestamp }],
    middle: [{ value: middle.value, timestamp : price.timestamp }],
    lower: [{ value: lower, timestamp : price.timestamp }],
  };
  }

  reset(): void {
    this.prices = [];
    this.smaIndicator.reset();
  }
}
