import { RSI } from '../rsi';
import { OHLCV } from '../types';

describe('RSI (Relative Strength Index)', () => {
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
    it('should initialize with default period of 14', () => {
      const rsi = new RSI();
      expect(rsi.getValue()).toBeNull();
    });

    it('should initialize with custom period', () => {
      const rsi = new RSI(5);
      expect(rsi.getValue()).toBeNull();
    });
  });

  describe('calculate()', () => {
    it('should return empty array when not enough data', () => {
      const rsi = new RSI(5);
      const data = createTestData([100, 102, 101, 103]);
      
      const results = rsi.calculate(data);
      
      expect(results).toEqual([]);
    });

    it('should calculate RSI correctly with minimal data', () => {
      const rsi = new RSI(3);
      // Need 4 prices to get 3 changes
      const data = createTestData([100, 102, 101, 104]);
      
      const results = rsi.calculate(data);
      
      expect(results).toHaveLength(1);
      
      // Manual calculation:
      // Changes: [+2, -1, +3]
      // Gains: 2, 0, 3 → Avg = 5/3 = 1.67
      // Losses: 0, 1, 0 → Avg = 1/3 = 0.33
      // RS = 1.67 / 0.33 = 5.06
      // RSI = 100 - (100 / (1 + 5.06)) = 83.5
      
      expect(results[0].value).toBeCloseTo(83.33, 1);
    });

    it('should calculate RSI with Wilder smoothing for subsequent values', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 103]);
      
      const results = rsi.calculate(data);
      
      expect(results).toHaveLength(2);
      
      // First RSI (day 3)
      expect(results[0].value).toBeCloseTo(83.33, 1);
      
      // Second RSI (day 4) with Wilder's smoothing
      // Change = 103 - 104 = -1 (loss = 1, gain = 0)
      // Avg Gain = ((1.67 * 2) + 0) / 3 = 1.11
      // Avg Loss = ((0.33 * 2) + 1) / 3 = 0.55
      // RS = 1.11 / 0.55 = 2.02
      // RSI = 100 - (100 / (1 + 2.02)) = 66.9
      
      expect(results[1].value).toBeCloseTo(66.67, 1);
    });

    it('should return 100 when there are only gains (no losses)', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 104, 106, 108]);
      
      const results = rsi.calculate(data);
      
      // All gains, no losses → RSI = 100
      expect(results[0].value).toBe(100);
    });

    it('should return 0 when there are only losses (no gains)', () => {
      const rsi = new RSI(3);
      const data = createTestData([108, 106, 104, 102, 100]);
      
      const results = rsi.calculate(data);
      
      // All losses, no gains → RSI = 0
      expect(results[0].value).toBe(0);
    });

    it('should be stateless - multiple calls return same results', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 106, 108]);
      
      const results1 = rsi.calculate(data);
      const results2 = rsi.calculate(data);
      
      expect(results1).toEqual(results2);
    });

    it('should include correct timestamps', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 106]);
      
      const results = rsi.calculate(data);
      
      expect(results[0].timestamp).toEqual(data[3].timestamp); // Day 3 (index 3)
      expect(results[1].timestamp).toEqual(data[4].timestamp); // Day 4 (index 4)
    });
  });

  describe('update()', () => {
    it('should return null when not enough data', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101]);
      
      expect(rsi.update(data[0])).toBeNull();
      expect(rsi.update(data[1])).toBeNull();
      expect(rsi.update(data[2])).toBeNull();
    });

    it('should return RSI after enough data', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104]);
      
      rsi.update(data[0]);
      rsi.update(data[1]);
      rsi.update(data[2]);
      const result = rsi.update(data[3]);
      
      expect(result).toBeCloseTo(83.33, 1);
    });

    it('should update RSI correctly with new data using Wilder smoothing', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 103]);
      
      rsi.update(data[0]);
      rsi.update(data[1]);
      rsi.update(data[2]);
      const rsi1 = rsi.update(data[3]);
      const rsi2 = rsi.update(data[4]);
      
      expect(rsi1).toBeCloseTo(83.33, 1);
      expect(rsi2).toBeCloseTo(66.67, 1);
    });

    it('should match calculate() results when called sequentially', () => {
      const rsiUpdate = new RSI(3);
      const rsiCalculate = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 106, 103, 107]);
      
      // Use update()
      const updateResults: number[] = [];
      for (const candle of data) {
        const result = rsiUpdate.update(candle);
        if (result !== null) {
          updateResults.push(result);
        }
      }
      
      // Use calculate()
      const calculateResults = rsiCalculate.calculate(data);
      
      expect(updateResults.length).toBe(calculateResults.length);
        updateResults.forEach((value, index) => {
            const calcValue = calculateResults[index].value;
            expect(calcValue).not.toBeNull(); // Check it's not null first
            expect(value).toBeCloseTo(calcValue!, 1); // Then use non-null assertion
        });
    });

    it('should handle RSI = 100 case (only gains)', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 104, 106, 108]);
      
      for (const candle of data) {
        rsi.update(candle);
      }
      
      expect(rsi.getValue()).toBe(100);
    });

    it('should handle RSI = 0 case (only losses)', () => {
      const rsi = new RSI(3);
      const data = createTestData([108, 106, 104, 102, 100]);
      
      for (const candle of data) {
        rsi.update(candle);
      }
      
      expect(rsi.getValue()).toBe(0);
    });
  });

  describe('getValue()', () => {
    it('should return null before any updates', () => {
      const rsi = new RSI(3);
      
      expect(rsi.getValue()).toBeNull();
    });

    it('should return current RSI after updates', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 106]);
      
      rsi.update(data[0]);
      rsi.update(data[1]);
      rsi.update(data[2]);
      rsi.update(data[3]);
      const lastUpdate = rsi.update(data[4]);
      
      expect(rsi.getValue()).toBe(lastUpdate);
    });

    it('should return same value when called multiple times', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104]);
      
      for (const candle of data) {
        rsi.update(candle);
      }
      
      const value1 = rsi.getValue();
      const value2 = rsi.getValue();
      
      expect(value1).toBe(value2);
    });
  });

  describe('reset()', () => {
    it('should clear all internal state', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104, 106]);
      
      for (const candle of data) {
        rsi.update(candle);
      }
      expect(rsi.getValue()).not.toBeNull();
      
      rsi.reset();
      
      expect(rsi.getValue()).toBeNull();
    });

    it('should allow fresh calculations after reset', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 102, 101, 104]);
      
      for (const candle of data) {
        rsi.update(candle);
      }
      const before = rsi.getValue();
      
      rsi.reset();
      
      for (const candle of data) {
        rsi.update(candle);
      }
      const after = rsi.getValue();
      
      expect(after).toBe(before);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array in calculate()', () => {
      const rsi = new RSI(3);
      
      const results = rsi.calculate([]);
      
      expect(results).toEqual([]);
    });

    it('should handle standard 14-period RSI', () => {
      const rsi = new RSI(14);
      
      // Create realistic price data
      const closes = [
        44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84,
        46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00
      ];
      const data = createTestData(closes);
      
      const results = rsi.calculate(data);
      
      expect(results).toHaveLength(1);
      // Standard RSI calculation should be around 70 for uptrending data
      expect(results[0].value).toBeGreaterThan(60);
      expect(results[0].value).toBeLessThan(80);
    });

    it('should handle volatile price swings', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 150, 75, 125, 80, 140]);
      
      const results = rsi.calculate(data);
      
      expect(results).toHaveLength(3);
      // RSI should be between 0 and 100
      results.forEach(result => {
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThanOrEqual(100);
      });
    });

    it('should handle flat prices (no change)', () => {
      const rsi = new RSI(3);
      const data = createTestData([100, 100, 100, 100, 100]);
      
      const results = rsi.calculate(data);
      
      // No gains or losses → RSI should be 100 (division by zero case)
      expect(results[0].value).toBe(100);
    });
  });
});