import { OHLCV } from "./types";

export class RSI {
  constructor(period: number = 14) {}
  calculate(data: OHLCV[]): any[] {
    return [];
  }
  getValue(): number | null {
    return null;
  }
  update(price: number): number | null {
    return null;
  }
  reset(): void {}
}
