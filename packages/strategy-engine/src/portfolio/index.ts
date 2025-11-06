export class Portfolio {
  private totalCapital : number;

  constructor(initialCapital: number) {
    this.totalCapital = initialCapital;
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
