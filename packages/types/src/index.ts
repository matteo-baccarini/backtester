// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Strategy Types
export interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: StrategyRule[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyRule {
  id: string;
  type: "buy" | "sell" | "hold";
  condition: string;
  parameters: Record<string, any>;
}

// Backtest Types
export interface Backtest {
  id: string;
  strategyId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  results: BacktestResults;
  createdAt: Date;
}

export interface BacktestResults {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  equityCurve: EquityPoint[];
}

export interface EquityPoint {
  date: Date;
  value: number;
}

// Trading Types
export interface Order {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: "simple" | "bracket" | "oco" | "oto";
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  side: "buy" | "sell";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: string;
  stop_price?: string;
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
  extended_hours: boolean;
  legs?: OrderLeg[];
  status:
    | "new"
    | "partially_filled"
    | "filled"
    | "done_for_day"
    | "canceled"
    | "expired"
    | "replaced"
    | "pending_cancel"
    | "pending_replace"
    | "accepted"
    | "pending_new"
    | "accepted_for_bidding"
    | "stopped"
    | "rejected"
    | "suspended"
    | "calculated";
}

export interface OrderLeg {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: "simple" | "bracket" | "oco" | "oto";
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  side: "buy" | "sell";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: string;
  stop_price?: string;
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
  extended_hours: boolean;
  status:
    | "new"
    | "partially_filled"
    | "filled"
    | "done_for_day"
    | "canceled"
    | "expired"
    | "replaced"
    | "pending_cancel"
    | "pending_replace"
    | "accepted"
    | "pending_new"
    | "accepted_for_bidding"
    | "stopped"
    | "rejected"
    | "suspended"
    | "calculated";
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
