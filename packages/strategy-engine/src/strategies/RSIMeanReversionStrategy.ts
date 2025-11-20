import {IndicatorResult, IsStrategy, RSI, OHLCV, Portfolio, Signal } from '../index';

export class RSIStrategy implements IsStrategy {
    private RSI : RSI;
    private symbol : string;
    private oversoldThreshold : number;
    private overboughtThreshold : number;
    private timeStop : number;
    private timeLeft : number;
    private lastHadPosition : boolean = false;

    constructor(symbol : string, RSIPeriod : number, oversold : number = 30, overbought : number = 70, timeStop : number = 5){
        this.symbol = symbol;
        this.RSI = new RSI(RSIPeriod);
        this.overboughtThreshold = overbought;
        this.oversoldThreshold = oversold;
        this.timeStop = timeStop;
        this.timeLeft = timeStop;
    }

    onBar(price: OHLCV, portfolio: Portfolio): Signal {
        const rsiResult = this.RSI.update(price);

        if (!rsiResult || rsiResult.value === null) {
            return {
                action: 'HOLD',
                symbol: this.symbol,
                confidence: 0,
                reason: 'RSI not ready -> warming up',
                timestamp: price.timestamp,
            };
        }

        const rsiValue = rsiResult.value;
        const hasPosition = portfolio.getPosition(this.symbol) !== null;

        // Detect NEW position (transition from no position → position)
        const isNewPosition = hasPosition && !this.lastHadPosition;
        
        if (isNewPosition) {
            // Reset timer for new position
            this.timeLeft = this.timeStop;
        }

        // Update tracking BEFORE processing rest of logic
        this.lastHadPosition = hasPosition;

        // If we have a position, check exit conditions
        if (hasPosition) {
            // Check overbought FIRST (before decrementing)
            if (rsiValue > this.overboughtThreshold) {
                this.timeLeft = this.timeStop; // Reset for next position
                
                return {
                    symbol: this.symbol,
                    action: 'SELL',
                    confidence: 0,
                    reason: 'Position is overbought -> RSI > 70',
                    timestamp: price.timestamp,
                };
            }

            // Decrement time stop UNLESS this is the first bar of the position
            if (!isNewPosition) {
                this.timeLeft -= 1;
            }

            // Check time stop expiry
            if (this.timeLeft <= 0) {
                this.timeLeft = this.timeStop; // Reset for next position

                return {
                    symbol: this.symbol,
                    action: 'SELL',
                    confidence: 0,
                    reason: 'Sell due to Time Stop',
                    timestamp: price.timestamp,
                };
            }

            // Position exists but no exit signal yet
            return {
                symbol: this.symbol,
                action: 'HOLD',
                confidence: 0,
                reason: 'Waiting for favorable conditions to buy/sell',
                timestamp: price.timestamp,
            };
        }

        // No position - check for BUY signal
        if (rsiValue < this.oversoldThreshold) {
            return {
                symbol: this.symbol,
                action: 'BUY',
                confidence: (this.oversoldThreshold - rsiValue) / this.oversoldThreshold,
                reason: 'RSI value under over sold threshold',
                timestamp: price.timestamp,
            };
        }

        // No position, no signal
        return {
            symbol: this.symbol,
            action: 'HOLD',
            confidence: 0,
            reason: 'Waiting for favorable conditions to buy/sell',
            timestamp: price.timestamp,
        };
    }

    reset() : void {
        this.RSI.reset();
        this.timeLeft = this.timeStop;
        this.lastHadPosition = false;
    }
}