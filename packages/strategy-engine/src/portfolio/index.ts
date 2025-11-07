import {Position, Trade} from './types'

export class Portfolio {
  private availableCash : number;

  private totalAssets : Map<string, Position> = new Map<string, Position>();

  tradeHistory : Trade[] = [];

  constructor(initialCapital: number) {
    this.availableCash = initialCapital;
  }
  
  getValue(): number {
    return 0;
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
        positionSize : quantity * price,
        positionType : 'LONG',
      }

      this.totalAssets.set(symbol, newPosition);
    }else {
      const totalShares = existingPosition.numberOfShares + quantity;
      const totalCost = existingPosition.averagePricePerShare * existingPosition.numberOfShares + price * quantity;
      existingPosition.numberOfShares = totalShares;
      existingPosition.averagePricePerShare = totalCost/totalShares;
      existingPosition.positionSize = totalShares * existingPosition.averagePricePerShare;

      this.totalAssets.set(symbol, existingPosition);
    }

    this.availableCash -= quantity * price;

    const newTrade : Trade = {
      symbol : symbol,
      numberOfShares : quantity,
      pricePerShare : price,
      tradeType : 'BUY',  
      tradeDate : new Date(),    
    }

    this.tradeHistory.push(newTrade);

    return true;
  }
  
  removePosition(symbol: string, quantity: number, price: number): boolean {
    return false;
  }
  reset(): void {}
}
