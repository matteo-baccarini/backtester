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
    return false;
  }
  removePosition(symbol: string, quantity: number, price: number): boolean {
    return false;
  }
  reset(): void {}
}
