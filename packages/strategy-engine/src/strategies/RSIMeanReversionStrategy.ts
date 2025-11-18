import {IndicatorResult, IsStrategy, RSI, OHLCV, Portfolio, Signal } from '../index';

export class RSIStrategy implements IsStrategy {
    ///usually calculates RSI over 14 day period
    ///if RSI goes above 70 (80 or 90 for more aggressive strategy) sell / short
    ///
    ///if RSI goes below 30 (20 or 10 for more aggressive strategy) BUY / long
    ///
    ///possible improvement -> only take longs when price is above 200 day SMA and shorts when below
    private RSI : RSI;
    private symbol : string;
    private oversoldThreshold : number;
    private overboughtThreshold : number;
    private timeStop : number;
    private timeLeft : number;

    constructor(symbol : string, RSIPeriod : number, oversold : number = 30, overbought : number = 70, timeStop : number = 5){
        this.symbol = symbol;
        this.RSI = new RSI(RSIPeriod);
        this.overboughtThreshold = overbought;
        this.oversoldThreshold = oversold;
        this.timeStop = timeStop;
        this.timeLeft = timeStop;
    }

    onBar(price : OHLCV, portfolio : Portfolio) : Signal {
        const rsiResult : IndicatorResult | null = this.RSI.update(price);

        if (!rsiResult || rsiResult.value === null){
            return {
                action : 'HOLD',
                symbol : this.symbol,
                confidence : 0,
                reason : 'RSI not ready -> warming up',
                timestamp : price.timestamp,
            };
        }

        const rsiValue : number = rsiResult.value;
        const hasPosition = portfolio.getPosition(this.symbol);

        if (hasPosition){
            this.timeLeft -= 1;

            if (rsiValue > this.overboughtThreshold){
                this.timeLeft = this.timeStop;
                
                return {
                    symbol : this.symbol,
                    action : 'SELL',
                    confidence : 0,
                    reason : 'Position is overbought -> RSI > 70',
                    timestamp : price.timestamp,
                };
            }

            if (this.timeLeft === 0){
                this.timeLeft = this.timeStop;

                return {
                    symbol : this.symbol,
                    action : 'SELL',
                    confidence : 0,
                    reason : 'Sell due to Time Stop',
                    timestamp : price.timestamp,
                };
            }
        }

        if (!hasPosition && rsiValue < this.oversoldThreshold){
            this.timeLeft = this.timeStop;

            return {
                symbol : this.symbol,
                action : 'BUY',
                confidence : (this.oversoldThreshold - rsiValue) / this.oversoldThreshold,
                reason : 'RSI value under over sold threshold',
                timestamp : price.timestamp,
            }
        }

        return {
            symbol : this.symbol,
            action : 'HOLD',
            confidence : 0,
            reason : 'Waiting for favorable conditions to buy/sell',
            timestamp : price.timestamp,
        }
    }

    reset() : void {
        this.RSI.reset();
        this.timeLeft = this.timeStop;
    }
}