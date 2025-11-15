export interface EquityPoint {
    date : Date;
    equity : number;
}

export interface backtestResult {
    initialCapital : number;
    finalValue : number;
    totalReturn : number;
    totalReturnPercentage : number;
    equityCurve : EquityPoint[];
    trades : number;
    winningTrades : number;
    losingTrades : number;
    winRate : number;
    maxDrawdown : number;
    maxDrawDownPercentage : number;
    sharpeRatio : number;
}