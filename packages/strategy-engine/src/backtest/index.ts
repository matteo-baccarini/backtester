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
import { IsStrategy, Signal } from "../strategies";

export class BacktestEngine {
  private portfolio : Portfolio;
  private strategyInstance : IsStrategy;
  private historicalData : OHLCV[];
  private symbol : string;
  private allocation : number = 0.2;

  constructor(symbol : string, inputCash : number, strategy : IsStrategy, historicalData : OHLCV[]) {
    this.historicalData = historicalData;
    this.portfolio = new Portfolio(inputCash);
    this.strategyInstance = strategy;
    this.symbol = symbol;
  }

  runEngine() {
    for (let i : number = 0; i < this.historicalData.length; i++){
      const option : OHLCV = this.historicalData[i];
      const order : Signal = this.strategyInstance.onBar(option, this.portfolio);
      let purchaseResult : boolean;
      let quantity : number;

      if (order.action === 'HOLD'){
        continue;
      } else if (order.action === 'BUY'){

        quantity = Math.floor((this.portfolio.getCash() * this.allocation * order.confidence) / option.close);
        purchaseResult = this.portfolio.addPosition(this.symbol, quantity, option.close);

        ///what should I do if purchase ends up not going through (different causes that can lead to this)

      }else {
        ///how much should i sell if signal comes out to be SELL? for now I will totally exit the position
        const position = this.portfolio.getPosition(this.symbol);
        if (!position) {
          continue; // Can't sell what we don't have
        }
        purchaseResult = this.portfolio.removePosition(this.symbol, position.numberOfShares, option.close);
      }
    }
  }
}