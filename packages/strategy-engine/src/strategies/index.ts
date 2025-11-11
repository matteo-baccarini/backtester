import { OHLCV } from "../indicators";
import { Portfolio } from "../portfolio";

interface IsStragey {
  onBar(bar : OHLCV, portfolio : Portfolio) : Signal;
  reset() : void;
}

type Signal = {
  action : 'BUY' | 'SELL' | 'HOLD';
  symbol : string;
  confidence : number;
  reason : string;
  timestamp : Date;
}