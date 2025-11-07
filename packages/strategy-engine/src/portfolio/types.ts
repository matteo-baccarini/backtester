export type Position = {
    symbol : string;
    numberOfShares : number;
    averagePricePerShare : number;
    positionType : 'LONG' | 'SHORT';
}

export type Trade = {
    symbol : string;
    numberOfShares : number;
    pricePerShare : number;
    tradeType : 'BUY' | 'SELL';
    tradeDate : Date;
}