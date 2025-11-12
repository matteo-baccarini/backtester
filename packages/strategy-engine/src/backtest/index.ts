// export class BacktestEngine {
//   constructor(initialCapital: number) {}
//   run(strategy: any, data: any[]): any {
//     return {};
//   }
//   getResults(): any {
//     return {};
//   }
//   reset(): void {}
// }

import { OHLCV } from "../indicators";
import { IsStrategy } from "../strategies";

export class BacktestEngine {
  private initialCapital : number;
  private strategyInstance : IsStrategy;
  private historicalData : OHLCV[];

  constructor(inputCash : number, strategy : IsStrategy, historicalData : OHLCV[]) {
    this.historicalData = historicalData;
    this.initialCapital = inputCash;
    this.strategyInstance = strategy;
  }

  
}