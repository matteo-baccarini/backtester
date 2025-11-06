export type Position = {
    symbol : string;
    numberOfShares : number;
    averagePricePerShare : number;
    positionSize : number;
    positionType : 'LONG' | 'SHORT';
    marketValue : number;
    //portfoliValue : number;
}

export type Trade = {
    symbol : string;
    numberOfShares : number;
    pricePerShare : number;
    tradeType : 'BUY' | 'SELL';
    tradeDate : Date;
}