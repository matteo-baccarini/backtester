export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

export interface IndicatorResult {
  value: number | null;
  timestamp: Date;
}

export interface MACDResult {
  macd: IndicatorResult[];
  signal: IndicatorResult[];
  histogram: IndicatorResult[];
}
