import { OHLCV, IndicatorResult, BollingerBandsResult, BollingerBandsValue } from "./types";
import {SMA} from "./sma";


export class BollingerBands {
  private period : number;
  private multiplier : number;
  private smaIndicator : SMA;
  private prices : OHLCV[] = [];
  
  // Running statistics for O(1) updates
  private sum: number = 0;
  private sumSquares: number = 0;

  constructor(period: number = 20, multiplier: number = 2) {
    this.period = period;
    this.multiplier = multiplier;
    this.smaIndicator = new SMA(period);
  }

  private hasEnoughData(data : OHLCV[]) : boolean {
    return data.length >= this.period;
  }

  private calculateStandardDeviation(data: OHLCV[]): number[] {
    const stdDevs: number[] = [];

    let sum = 0;
    let sumSquares = 0;

    for (let i = 0; i < data.length; i++) {
      const price = data[i].close;

      sum += price;
      sumSquares += price * price;

      // Once we exceed the window, subtract the price that's sliding out
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

  update(price: OHLCV): BollingerBandsValue {
    const closePrice = price.close;
    
    // Add new price to running totals
    this.sum += closePrice;
    this.sumSquares += closePrice * closePrice;
    
    this.prices.push(price);

    // Maintain rolling window - remove oldest price from running totals
    if (this.prices.length > this.period) {
      const oldPrice = this.prices.shift()!;
      this.sum -= oldPrice.close;
      this.sumSquares -= oldPrice.close * oldPrice.close;
    }

    // Only compute once enough data exists
    if (!this.hasEnoughData(this.prices)) {
      return { upper : null, middle :null, lower : null };
    }

    // O(1) calculation of mean and std dev
    const mean = this.sum / this.period;
    const variance = (this.sumSquares / this.period) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(variance, 0));

    return {
      upper: mean + this.multiplier * stdDev,
      middle: mean,
      lower: mean - this.multiplier * stdDev,
    };
  }

  reset(): void {
    this.prices = [];
    this.sum = 0;
    this.sumSquares = 0;
    this.smaIndicator.reset();
  }

  getPrices(): OHLCV[] { return this.prices;}
}