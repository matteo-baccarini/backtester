export class BaseStrategy {
  initialize(data?: any[]): void {}
  update(data: any): void {}
  generateSignals(): any[] {
    return [];
  }
  reset(): void {}
}

export class MovingAverageStrategy extends BaseStrategy {
  constructor(fastPeriod: number = 20, slowPeriod: number = 50) {
    super();
  }
  generateSignals(): any[] {
    return [];
  }
}
