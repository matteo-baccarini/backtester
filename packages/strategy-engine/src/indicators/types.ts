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

export interface BollingerBandsResult {
  upper : IndicatorResult[] | null;
  middle : IndicatorResult[] | null;
  lower : IndicatorResult[] | null;
}

export interface MACDValue {
  macd: number | null;
  signal : number | null;
  histogram : number | null;
}

export interface BollingerBandsValue {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}
