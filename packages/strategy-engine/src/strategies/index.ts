import { OHLCV } from "../indicators";
import { Portfolio } from "../portfolio";

export interface IsStrategy {
  onBar(bar : OHLCV, portfolio : Portfolio) : Signal;
  reset() : void;
}

export type Signal = {
  action : 'BUY' | 'SELL' | 'HOLD';
  symbol : string;
  confidence : number;
  reason : string;
  timestamp : Date;
}