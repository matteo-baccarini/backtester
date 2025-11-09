import {Position, Trade} from './types'

export class Portfolio {
  private initialCapital : number;
  private availableCash : number;

  private totalAssets : Map<string, Position> = new Map<string, Position>();

  tradeHistory : Trade[] = [];

  constructor(initialCapital: number) {
    this.availableCash = initialCapital;
    this.initialCapital = initialCapital;
  }
  
  getValue(currentPrices : Map<string, number>): number {
    ///current prices are obtained through API call to trading platform

    let totalValue : number = 0;

    for (const [key, value] of this.totalAssets){
      if (currentPrices === undefined){
        continue;
      }
      totalValue += value.numberOfShares * currentPrices.get(key)!;
    }

    return totalValue + this.availableCash;
  }

  getPosition(stock : string) : Position | null  {
      return this.totalAssets.get(stock) ?? null;
  }

  getPositions() : Map<string, Position> {
    return new Map(this.totalAssets);
  }

  getCash(): number {
    return this.availableCash;
  }

  addPosition(symbol: string, quantity: number, price: number): boolean {
    ///TODO
    //step 1: validate inputs (negative quantity, empty stock string, negative price)
    ///step 2: check if there is enough cash for the purchase
    ///step 3: does the input already exist? -> if yes, update existing, if no -> create new entry for stock
    /// step 4: update cash
    ///step 5: record new entry in trade history
    ///step 6: return success/failure boolean

    if (quantity <= 0 || price <= 0 || symbol.trim() === '') {
      return false;
    }

    if (this.availableCash < quantity * price) {
      return false;
    }

    const existingPosition = this.totalAssets.get(symbol);

    if (!existingPosition) {
      const newPosition : Position = {
        symbol : symbol,
        numberOfShares : quantity,
        averagePricePerShare : price,
        positionType : 'LONG',
      }

      this.totalAssets.set(symbol, newPosition);
    }else {
      const totalShares = existingPosition.numberOfShares + quantity;
      const totalCost = existingPosition.averagePricePerShare * existingPosition.numberOfShares + price * quantity;
      existingPosition.numberOfShares = totalShares;
      existingPosition.averagePricePerShare = totalCost/totalShares;

      this.totalAssets.set(symbol, existingPosition);
    }

    this.availableCash -= quantity * price;

    const newTrade : Trade = {
      symbol,
      numberOfShares : quantity,
      pricePerShare : price,
      tradeType : 'BUY',  
      tradeDate : new Date(),    
    }

    this.tradeHistory.push(newTrade);

    return true;
  }

  removePosition(symbol: string, quantity: number, price: number): boolean {
    ///step 1: validate inputs (assert user holds stock, negative quantity, empty stock string, negative price)
    ///step 2: check if there is enough shares to sell
    ///step 3: update or remove position from total assets (remove if none left, update if partially sold)
    ///Average price per share remains unchanges on sale
    ///step 4: update cash
    ///step 5: record new entry in trade history
    ///step 6: return success/failure boolean

    if (quantity <= 0 || price <= 0 || symbol.trim() === '') {
      return false;
    }

    const existingPosition = this.totalAssets.get(symbol);

    if (!existingPosition){
      return false;
    }

    if (existingPosition.numberOfShares < quantity) {
      return false;
    }

    this.tradeHistory.push({
      symbol,
      numberOfShares : quantity,
      pricePerShare : price,
      tradeType : 'SELL',
      tradeDate : new Date(),
    })

    if (existingPosition.numberOfShares === quantity) {
      this.totalAssets.delete(symbol);
    }else {
      existingPosition.numberOfShares -= quantity;
      this.totalAssets.set(symbol, existingPosition);
    }

    this.availableCash += quantity * price;
    return true;
  }

  reset(): void {
    this.availableCash = this.initialCapital;
    this.totalAssets.clear();
    this.tradeHistory = [];
  }
}
