export interface EquityPoint {
    date : Date;
    equity : number;
}

export interface BacktestResult {
    initialCapital : number;
    finalValue : number;
    totalReturn : number;
    totalReturnPercent : number;
    equityCurve : EquityPoint[];
    trades : number;
    winningTrades : number;
    losingTrades : number;
    winRate : number;
    maxDrawdown : number;
    maxDrawDownPercent : number;
    sharpeRatio : number;
}