import { IndicatorResult, OHLCV, MACDResult } from './types';
import { EMA } from './ema';

export class MACD {
  private fastEMA : EMA;
  private slowEMA : EMA;
  private signalEMA : EMA;
  private slowPeriod : number;
  private fastPeriod : number;
  private signalPeriod : number;

  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ) {
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;

    this.fastEMA = new EMA(this.fastPeriod);
    this.slowEMA = new EMA(this.slowPeriod);
    this.signalEMA = new EMA(this.signalPeriod);
  }

  private hasEnoughData(data: OHLCV[]): boolean {
    return data.length >= this.slowPeriod && data.length >= this.fastPeriod && data.length >= this.signalPeriod;
  }

calculate(data: OHLCV[]): MACDResult {

  if (!this.hasEnoughData(data)) {
    return {
      macd : [],
      signal : [],
      histogram :  [],
    }
  }

  // Step 1: Calculate the fast and slow EMAs from the price data
  const fastEMAResults = this.fastEMA.calculate(data);
  const slowEMAResults = this.slowEMA.calculate(data);

  const macdLine: IndicatorResult[] = [];
  
  // Step 2: Calculate MACD line (fast EMA - slow EMA)
  // The slow EMA needs more periods to warm up (26 vs 12), so it will have fewer values
  // We need to align the arrays so we're subtracting the correct corresponding values
  
  // Calculate how many more values the fast EMA has compared to slow EMA
  // For example: if fast has 100 values and slow has 85, lengthDiff = 15
  const lengthDiff = fastEMAResults.length - slowEMAResults.length;
  
  // Loop through all slow EMA values (these are our limiting factor)
  for (let i = 0; i < slowEMAResults.length; i++) {
    // To get the corresponding fast EMA value, we offset by lengthDiff
    // This ensures we're matching the same timestamps
    // Example: slowEMA[0] matches fastEMA[15], slowEMA[1] matches fastEMA[16], etc.
    const fastIndex = i + lengthDiff;
    
    const fastValue = fastEMAResults[fastIndex].value;
    const slowValue = slowEMAResults[i].value;
    
    // Check if both values are non-null before calculating MACD
    // (EMA should never return null after warm-up, but TypeScript needs the check)
    if (fastValue !== null && slowValue !== null) {
      // MACD line = fast EMA - slow EMA
      const macdValue = fastValue - slowValue;
      
      // Store the MACD value with its timestamp
      macdLine.push({
        value: macdValue,
        timestamp: slowEMAResults[i].timestamp,
      });
    }
  }

  // Step 3: Calculate signal line (EMA of the MACD line)
  // We need to convert MACD values back into OHLCV format for the EMA calculator
  // Since MACD is just a single value, we use it for open, high, low, and close
  const signalLine = this.signalEMA.calculate(
    macdLine
      .filter(res => res.value !== null) // Filter out any null values
      .map((res) => ({
        close: res.value!,   // Use non-null assertion since we filtered
        high: res.value!,    // Use MACD value for all price fields
        low: res.value!,     // since MACD is a single value per timestamp
        open: res.value!,
        volume: 0,           // Volume doesn't matter for EMA calculation
        timestamp: res.timestamp,
      }))
  );

  // Step 4: Calculate histogram (MACD line - signal line)
  // The signal line also needs time to warm up (9 periods), so it will be shorter than MACD line
  const histogram: IndicatorResult[] = macdLine.map((macdRes, i) => {
    // Calculate the offset to align signal line with MACD line
    // Signal line is shorter, so early MACD values won't have corresponding signal values
    const signalIndex = i - (macdLine.length - signalLine.length);
    
    // If we have a valid signal value (signalIndex >= 0), calculate histogram
    // Otherwise, return null for the warm-up period
    if (signalIndex >= 0 && macdRes.value !== null && signalLine[signalIndex].value !== null) {
      return {
        value: macdRes.value - signalLine[signalIndex].value,
        timestamp: macdRes.timestamp
      };
    } else {
      return {
        value: null,
        timestamp: macdRes.timestamp
      };
    }
  });

  // Return all three components of MACD
  return {
    macd: macdLine,      // The MACD line (fast EMA - slow EMA)
    signal: signalLine,   // The signal line (EMA of MACD line)
    histogram: histogram  // The histogram (MACD line - signal line)
  };
}



  update(price: OHLCV): any {
    ///add value to all EMAs
    const fastValue =this.fastEMA.update(price);
    const slowValue = this.slowEMA.update(price);

    let macdValue : number | null = null;

    if (fastValue !== null || slowValue !== null){
      macdValue = fastValue! - slowValue!;
    }

    let signalValue : number | null = null;

    if (macdValue !== null){
      
      const signalPrice : OHLCV = {
        open : macdValue,
        high : macdValue,
        low : macdValue,
        close : macdValue,
        volume : 0,
        timestamp : price.timestamp,
      }

      signalValue = this.signalEMA.update(signalPrice);
    }

    let histogramValue : number | null = null;

    if (macdValue !== null && signalValue !== null){
      histogramValue = macdValue - signalValue;
    }

    return {
      macd : macdValue,
      signal : signalValue,
      histogram : histogramValue,
    };
  }

  reset(): void {}
}
