export * from "./types"

import { OHLCV } from "../indicators";
import { Portfolio } from "../portfolio";
import { IsStrategy, Signal } from "../strategies";
import { EquityPoint, backtestResult } from "./types";

export class BacktestEngine {
  private portfolio : Portfolio;
  private strategyInstance : IsStrategy;
  private historicalData : OHLCV[];
  private symbol : string;
  private allocation : number = 0.2;
  private equityHistory: EquityPoint[] = [];

  constructor(symbol : string, inputCash : number, strategy : IsStrategy, historicalData : OHLCV[]) {
    this.historicalData = historicalData;
    this.portfolio = new Portfolio(inputCash);
    this.strategyInstance = strategy;
    this.symbol = symbol;
  }

  runEngine() {
    this.portfolio.reset();
    this.strategyInstance.reset();
    this.equityHistory = [];

    for (let i : number = 0; i < this.historicalData.length; i++){
      const priceData : OHLCV = this.historicalData[i];
      const strategySignal : Signal = this.strategyInstance.onBar(priceData, this.portfolio);

      this.executeSignal(strategySignal, priceData);

      const priceMap = new Map<string, number>([[this.symbol, priceData.close]]);
      const equity = this.portfolio.getValue(priceMap);

      this.equityHistory.push({ date: priceData.timestamp, equity });
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
    const quantity = Math.floor((availableCash * this.allocation * signal.confidence)/priceData.close);

    if (quantity <= 0) {
      return; // Not enough to buy even 1 share
    }
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


  getEquityHistory() : EquityPoint[] {
    return this.equityHistory;
  }

  getFinalReturn() : number {
    if (this.equityHistory.length === 0) return 0;

    const initial = this.equityHistory[0].equity;
    const final = this.equityHistory[this.equityHistory.length - 1].equity;

    return (final-initial) / initial;
  }

  calculateWinLoss() : {wins : number, losses : number} {
    let wins = 0;
    let losses = 0;
    
    const sellTrades = this.portfolio.tradeHistory.filter(t => t.tradeType === 'SELL');

    for (const sellTrade of sellTrades) {

      const buyTrades = this.portfolio.tradeHistory.filter(
        t => t.symbol === sellTrade.symbol &&
        t.tradeType === 'BUY' &&
        t.tradeDate < sellTrade.tradeDate
      );

      if (buyTrades.length > 0){
        const totalCost = buyTrades.reduce((sum, t) =>
        sum + (t.pricePerShare * t.numberOfShares), 0);

        const totalShares = buyTrades.reduce((sum, t) => sum + t.numberOfShares, 0);

        const avgBuyPrice = totalCost/totalShares;

        if (sellTrade.pricePerShare > avgBuyPrice){
          wins ++;
        }else if (sellTrade.pricePerShare < avgBuyPrice){
          losses++;
        }
      }
    }

    return {wins, losses};
  }


  private calculateMaxDrawdown() : { maxDrawdown : number; maxDrawdownPercentage : number}{
    if (this.equityHistory.length === 0){
      return { maxDrawdown : 0, maxDrawdownPercentage : 0};
    }

    let peak = this.equityHistory[0].equity;
    let maxDrawdown = 0;

    for (const point of this.equityHistory){
      if (point.equity > peak){
        peak = point.equity;
      }

      const drawdown = peak - point.equity;

      if(drawdown > maxDrawdown){
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPercentage = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

    return {maxDrawdown, maxDrawdownPercentage};
  }
}