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
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  type: "market" | "limit" | "stop";
  price?: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  createdAt: Date;
  filledAt?: Date;
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
