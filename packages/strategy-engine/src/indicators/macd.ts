export class MACD {
  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {}
  calculate(data: any[]): any {
    return { macd: [], signal: [], histogram: [] };
  }
  update(price: number): any {
    return { macd: null, signal: null, histogram: null };
  }
  reset(): void {}
}
