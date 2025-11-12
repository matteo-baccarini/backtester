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
      const priceData : OHLCV = this.historicalData[i];
      const strategySignal : Signal = this.strategyInstance.onBar(priceData, this.portfolio);

      this.executeSignal(strategySignal, priceData);
    }
  }

  private executeSignal(signal : Signal, priceData : OHLCV) : void{
    if (signal.action === 'HOLD'){
      return;
    }

    if (signal.action === 'BUY'){
      this.executeBuy(signal, priceData);
    }

    if (signal.action === 'SELL'){
      this.executeSell(signal, priceData);
    }
  }

  private executeBuy(signal : Signal, priceData : OHLCV) : void {
    const availableCash = this.portfolio.getCash();
    if (availableCash < priceData.close){
      console.log("Not available cash");
      return;
    }
    const quantity = Math.floor((availableCash * this.allocation * signal.confidence)/priceData.close);
    this.portfolio.addPosition(this.symbol, quantity, priceData.close);
  }

  private executeSell(signal : Signal, priceData : OHLCV) : void {
    const position = this.portfolio.getPosition(this.symbol);

    if (!position){
      console.log("Stock not in assets");
      return;
    }

    this.portfolio.removePosition(this.symbol, position.numberOfShares, priceData.close);
  }
}