export class BollingerBands {
  constructor(period: number = 20, multiplier: number = 2) {}
  calculate(data: any[]): any {
    return { upper: [], middle: [], lower: [] };
  }
  update(price: number): any {
    return { upper: null, middle: null, lower: null };
  }
  reset(): void {}
}
