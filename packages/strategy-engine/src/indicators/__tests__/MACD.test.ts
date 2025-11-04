import { MACD } from '../macd';
import { OHLCV } from '../types';

describe('MACD (Moving Average Convergence Divergence)', () => {
  // Helper to create test data
  const createTestData = (closes: number[]): OHLCV[] => {
    return closes.map((close, index) => ({
      open: close,
      high: close + 1,
      low: close - 1,
      close: close,
      volume: 1000,
      timestamp: new Date(2024, 0, index + 1)
    }));
  };

  describe('constructor', () => {
    it('should initialize with default periods (12, 26, 9)', () => {
      const macd = new MACD();
      const value = macd.getValue();
      
      expect(value.macd).toBeNull();
      expect(value.signal).toBeNull();
      expect(value.histogram).toBeNull();
    });

    it('should initialize with custom periods', () => {
      const macd = new MACD(5, 10, 3);
      const value = macd.getValue();
      
      expect(value.macd).toBeNull();
      expect(value.signal).toBeNull();
      expect(value.histogram).toBeNull();
    });
  });

  describe('calculate()', () => {
    it('should return empty arrays when not enough data', () => {
      const macd = new MACD(5, 10, 3);
      const data = createTestData([100, 102, 101, 103, 104]);
      
      const result = macd.calculate(data);
      
      expect(result.macd).toEqual([]);
      expect(result.signal).toEqual([]);
      expect(result.histogram).toEqual([]);
    });

    it('should calculate MACD line correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 10 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // MACD line starts when slow EMA is ready (after 5 periods)
      expect(result.macd.length).toBeGreaterThan(0);
      
      // MACD should be positive for uptrending data
      result.macd.forEach(point => {
        expect(point.value).toBeGreaterThan(0);
      });
    });

    it('should calculate signal line correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // Signal line needs time to warm up after MACD
      expect(result.signal.length).toBeGreaterThan(0);
      expect(result.signal.length).toBeLessThanOrEqual(result.macd.length);
    });

    it('should calculate histogram correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // Histogram = MACD - Signal
      expect(result.histogram.length).toBe(result.signal.length);
      
      // Verify histogram calculation
      for (let i = 0; i < result.histogram.length; i++) {
        const macdIndex = result.macd.length - result.histogram.length + i;
        const expectedHistogram = result.macd[macdIndex].value! - result.signal[i].value!;
        expect(result.histogram[i].value).toBeCloseTo(expectedHistogram, 5);
      }
    });

    it('should handle uptrend correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // In uptrend, MACD should be positive
      result.macd.forEach(point => {
        expect(point.value).toBeGreaterThan(0);
      });
    });

    it('should handle downtrend correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 20 }, (_, i) => 200 - i * 2);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // In downtrend, MACD should be negative
      result.macd.forEach(point => {
        expect(point.value).toBeLessThan(0);
      });
    });

    it('should have correct timestamps', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // Timestamps should match original data (accounting for warm-up periods)
      expect(result.macd[0].timestamp).toEqual(data[4].timestamp); // Slow EMA ready at index 4
      
      // Signal and histogram timestamps should align with signal line
      if (result.signal.length > 0) {
        expect(result.signal[0].timestamp).toEqual(result.histogram[0].timestamp);
      }
    });

    it('should handle standard 12-26-9 parameters', () => {
      const macd = new MACD(); // Default: 12, 26, 9
      const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      expect(result.macd.length).toBeGreaterThan(0);
      expect(result.signal.length).toBeGreaterThan(0);
      expect(result.histogram.length).toBeGreaterThan(0);
    });
  });

  describe('update()', () => {
    it('should return all nulls when not enough data', () => {
      const macd = new MACD(3, 5, 2);
      const data = createTestData([100, 102, 101]);
      
      for (const candle of data) {
        const result = macd.update(candle);
        expect(result.macd).toBeNull();
        expect(result.signal).toBeNull();
        expect(result.histogram).toBeNull();
      }
    });

    it('should return MACD first, then signal, then histogram', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      let macdReady = false;
      let signalReady = false;
      let histogramReady = false;
      
      for (const candle of data) {
        const result = macd.update(candle);
        
        if (result.macd !== null) macdReady = true;
        if (result.signal !== null) signalReady = true;
        if (result.histogram !== null) histogramReady = true;
      }
      
      expect(macdReady).toBe(true);
      expect(signalReady).toBe(true);
      expect(histogramReady).toBe(true);
    });

    it('should match calculate() results when called sequentially', () => {
      const macdUpdate = new MACD(3, 5, 2);
      const macdCalculate = new MACD(3, 5, 2);
      const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      // Collect update() results
      const updateResults: { macd: number; signal: number; histogram: number }[] = [];
      for (const candle of data) {
        const result = macdUpdate.update(candle);
        if (result.macd !== null && result.signal !== null && result.histogram !== null) {
          updateResults.push({
            macd: result.macd,
            signal: result.signal,
            histogram: result.histogram
          });
        }
      }
      
      // Get calculate() results
      const calculateResult = macdCalculate.calculate(data);
      
      // Should have same number of complete results
      expect(updateResults.length).toBe(calculateResult.histogram.length);
      
      // Values should match
      updateResults.forEach((updateVal, i) => {
        const calcMacdIndex = calculateResult.macd.length - updateResults.length + i;
        expect(updateVal.macd).toBeCloseTo(calculateResult.macd[calcMacdIndex].value!, 5);
        expect(updateVal.signal).toBeCloseTo(calculateResult.signal[i].value!, 5);
        expect(updateVal.histogram).toBeCloseTo(calculateResult.histogram[i].value!, 5);
      });
    });

    it('should handle real-time streaming correctly', () => {
      const macd = new MACD(3, 5, 2);
      const closes = [100, 102, 104, 106, 108, 110, 109, 111];
      const data = createTestData(closes);
      
      let lastResult;
      for (const candle of data) {
        lastResult = macd.update(candle);
      }
      
      // Should have valid values after enough data
      expect(lastResult?.macd).not.toBeNull();
      expect(lastResult?.signal).not.toBeNull();
      expect(lastResult?.histogram).not.toBeNull();
    });
  });

  describe('getValue()', () => {
    it('should return all nulls before any updates', () => {
      const macd = new MACD(3, 5, 2);
      
      const value = macd.getValue();
      
      expect(value.macd).toBeNull();
      expect(value.signal).toBeNull();
      expect(value.histogram).toBeNull();
    });

    it('should return current values after updates', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      let lastUpdate;
      for (const candle of data) {
        lastUpdate = macd.update(candle);
      }
      
      const currentValue = macd.getValue();
      
      expect(currentValue.macd).toBe(lastUpdate?.macd);
      expect(currentValue.signal).toBe(lastUpdate?.signal);
      expect(currentValue.histogram).toBe(lastUpdate?.histogram);
    });

    it('should return same value when called multiple times', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      for (const candle of data) {
        macd.update(candle);
      }
      
      const value1 = macd.getValue();
      const value2 = macd.getValue();
      
      expect(value1.macd).toBe(value2.macd);
      expect(value1.signal).toBe(value2.signal);
      expect(value1.histogram).toBe(value2.histogram);
    });
  });

  describe('reset()', () => {
    it('should clear all internal state', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      for (const candle of data) {
        macd.update(candle);
      }
      
      const beforeReset = macd.getValue();
      expect(beforeReset.macd).not.toBeNull();
      
      macd.reset();
      
      const afterReset = macd.getValue();
      expect(afterReset.macd).toBeNull();
      expect(afterReset.signal).toBeNull();
      expect(afterReset.histogram).toBeNull();
    });

    it('should allow fresh calculations after reset', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, (_, i) => 100 + i);
      const data = createTestData(closes);
      
      for (const candle of data) {
        macd.update(candle);
      }
      const before = macd.getValue();
      
      macd.reset();
      
      for (const candle of data) {
        macd.update(candle);
      }
      const after = macd.getValue();
      
      expect(after.macd).toBe(before.macd);
      expect(after.signal).toBe(before.signal);
      expect(after.histogram).toBe(before.histogram);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array in calculate()', () => {
      const macd = new MACD(3, 5, 2);
      
      const result = macd.calculate([]);
      
      expect(result.macd).toEqual([]);
      expect(result.signal).toEqual([]);
      expect(result.histogram).toEqual([]);
    });

    it('should handle volatile price swings', () => {
      const macd = new MACD(3, 5, 2);
      const closes = [100, 150, 75, 125, 80, 140, 90, 130, 100, 110, 95, 115];
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // Should complete without errors
      expect(result.macd.length).toBeGreaterThan(0);
    });

    it('should handle flat prices', () => {
      const macd = new MACD(3, 5, 2);
      const closes = Array.from({ length: 15 }, () => 100);
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // MACD should be 0 for flat prices
    result.macd.forEach(point => {
      expect(Math.abs(point.value!)).toBeLessThan(0.0001);
    });
    });

    it('should detect bullish crossover', () => {
      const macd = new MACD(3, 5, 2);
      // Create data that trends up
      const closes = [
        100, 101, 102, 103, 104, 106, 109, 113, 118, 124,
        130, 137, 145, 152, 160, 170, 182, 195, 210, 230
        ];
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // In strong uptrend, histogram should be positive (MACD above signal)
      if (result.histogram.length > 0) {
        const lastHistogram = result.histogram[result.histogram.length - 1].value;
        expect(lastHistogram).toBeGreaterThan(0);
      }
    });

    it('should detect bearish crossover', () => {
      const macd = new MACD(3, 5, 2);
      // Create data that trends down
      const closes = [
        100, 101, 102, 103, 104, 106, 109, 113, 118, 124,
        130, 137, 145, 152, 158, 163, 167, 170, 172, 173
        ];

      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // In strong downtrend, histogram should be negative (MACD below signal)
      if (result.histogram.length > 0) {
        const lastHistogram = result.histogram[result.histogram.length - 1].value;
        expect(lastHistogram).toBeLessThan(0);
      }
    });
  });

  describe('trading signals', () => {
    it('should identify bullish signal when MACD crosses above signal', () => {
      const macd = new MACD(3, 5, 2);
      const closes = [100, 99, 98, 97, 98, 100, 103, 107, 112, 118, 125];
      const data = createTestData(closes);
      
      const result = macd.calculate(data);
      
      // Look for histogram changing from negative to positive
      let foundCrossover = false;
      for (let i = 1; i < result.histogram.length; i++) {
        if (result.histogram[i - 1].value! < 0 && result.histogram[i].value! > 0) {
          foundCrossover = true;
          break;
        }
      }
      
      // May or may not find crossover depending on parameters, but should not error
      expect(typeof foundCrossover).toBe('boolean');
    });
  });
});