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
  getPositions(): any[] {
    return [];
  }
  getCash(): number {
    return 0;
  }
  addPosition(symbol: string, quantity: number, price: number): boolean {
    return false;
  }
  removePosition(symbol: string, quantity: number, price: number): boolean {
    return false;
  }
  reset(): void {}
}
