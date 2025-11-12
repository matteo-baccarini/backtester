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
import { Portfolio } from "../portfolio";
import { IsStrategy } from "../strategies";

export class BacktestEngine {
  private portfolio : Portfolio;
  private strategyInstance : IsStrategy;
  private historicalData : OHLCV[];

  constructor(inputCash : number, strategy : IsStrategy, historicalData : OHLCV[]) {
    this.historicalData = historicalData;
    this.portfolio = new Portfolio(inputCash);
    this.strategyInstance = strategy;
  }

  runEngine() {
    for (let i : number = 0; i < this.historicalData.length; i++){
      this.strategyInstance.onBar(this.historicalData[i])
    }
  }
}