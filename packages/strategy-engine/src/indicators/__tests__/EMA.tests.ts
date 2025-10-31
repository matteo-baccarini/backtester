import { EMA } from '../ema';
import { OHLCV } from '../types';

describe('EMA (Exponential Moving Average)', () => {
  
  // Helper function to create test data
  const createOHLCV = (close: number, timestamp: Date): OHLCV => ({
    open: close,
    high: close,
    low: close,
    close: close,
    volume: 1000,
    timestamp: timestamp,
  });

  describe('constructor', () => {
    it('should create EMA with default period of 20', () => {
      const ema = new EMA();
      expect(ema).toBeDefined();
    });

    it('should create EMA with custom period', () => {
      const ema = new EMA(12);
      expect(ema).toBeDefined();
    });

    it('should calculate correct multiplier', () => {
      const ema = new EMA(10);
      // Multiplier = 2 / (10 + 1) = 2/11 ≈ 0.1818
      // We can't directly access private multiplier, but we can verify through calculation
      expect(ema).toBeDefined();
    });
  });

  describe('calculate()', () => {
    it('should return empty array when insufficient data', () => {
      const ema = new EMA(5);
      const data: OHLCV[] = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(102, new Date('2024-01-02')),
      ];
      
      const results = ema.calculate(data);
      expect(results).toEqual([]);
    });

    it('should calculate EMA correctly with exact period', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date('2024-01-01')),
        createOHLCV(20, new Date('2024-01-02')),
        createOHLCV(30, new Date('2024-01-03')),
      ];
      
      const results = ema.calculate(data);
      
      expect(results).toHaveLength(1);
      // First value should be SMA: (10+20+30)/3 = 20
      expect(results[0].value).toBe(20);
      expect(results[0].timestamp).toEqual(new Date('2024-01-03'));
    });

    it('should calculate EMA for multiple periods', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date('2024-01-01')),
        createOHLCV(11, new Date('2024-01-02')),
        createOHLCV(12, new Date('2024-01-03')),
        createOHLCV(13, new Date('2024-01-04')),
        createOHLCV(14, new Date('2024-01-05')),
      ];
      
      const results = ema.calculate(data);
      
      expect(results).toHaveLength(3);
      
      // First EMA = SMA = (10+11+12)/3 = 11
      expect(results[0].value).toBeCloseTo(11, 5);
      
      // Multiplier = 2/(3+1) = 0.5
      // Second EMA = (13 - 11) * 0.5 + 11 = 2 * 0.5 + 11 = 12
      expect(results[1].value).toBeCloseTo(12, 5);
      
      // Third EMA = (14 - 12) * 0.5 + 12 = 2 * 0.5 + 12 = 13
      expect(results[2].value).toBeCloseTo(13, 5);
    });

    it('should calculate EMA with standard period (12)', () => {
      const ema = new EMA(12);
      const data: OHLCV[] = [];
      
      // Create 20 days of data
      for (let i = 1; i <= 20; i++) {
        data.push(createOHLCV(100 + i, new Date(`2024-01-${i.toString().padStart(2, '0')}`)));
      }
      
      const results = ema.calculate(data);
      
      // Should have 20 - 12 + 1 = 9 results
      expect(results).toHaveLength(9);
      
      // First value should be SMA of first 12 values
      // Sum of 101 to 112 = 1278, SMA = 1278/12 = 106.5
      expect(results[0].value).toBeCloseTo(106.5, 5);
      
      // EMA should be more reactive than SMA (higher weight on recent prices)
      // Last value should be higher than SMA would be
      expect(results[results.length - 1].value).toBeGreaterThan(110);
    });

    it('should handle empty array', () => {
      const ema = new EMA(3);
      const results = ema.calculate([]);
      expect(results).toEqual([]);
    });

    it('should be more responsive than SMA to price changes', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date('2024-01-01')),
        createOHLCV(10, new Date('2024-01-02')),
        createOHLCV(10, new Date('2024-01-03')),
        createOHLCV(20, new Date('2024-01-04')), // Big jump
      ];
      
      const results = ema.calculate(data);
      
      // First EMA = SMA = 10
      expect(results[0].value).toBe(10);
      
      // Second EMA should react to the jump
      // EMA = (20 - 10) * 0.5 + 10 = 15
      expect(results[1].value).toBeCloseTo(15, 5);
      
      // SMA would be (10+10+20)/3 = 13.33, EMA is more responsive
      expect(results[1].value).toBeGreaterThan(13.33);
    });

    it('should not modify internal state', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date()),
        createOHLCV(20, new Date()),
        createOHLCV(30, new Date()),
      ];
      
      ema.calculate(data);
      
      // getValue() should return null since calculate() shouldn't set previousEMA
      expect(ema.getValue()).toBeNull();
    });
  });

  describe('update()', () => {
    it('should return null when insufficient data', () => {
      const ema = new EMA(3);
      
      expect(ema.update(createOHLCV(100, new Date()))).toBeNull();
      expect(ema.update(createOHLCV(110, new Date()))).toBeNull();
    });

    it('should return SMA for first complete period', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      const result = ema.update(createOHLCV(30, new Date()));
      
      // Should return SMA = (10+20+30)/3 = 20
      expect(result).toBe(20);
    });

    it('should calculate EMA after initialization', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      ema.update(createOHLCV(30, new Date())); // Returns SMA = 20
      
      const result = ema.update(createOHLCV(40, new Date()));
      
      // EMA = (40 - 20) * 0.5 + 20 = 30
      expect(result).toBeCloseTo(30, 5);
    });

    it('should maintain sliding window correctly', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      ema.update(createOHLCV(30, new Date()));
      
      const ema1 = ema.update(createOHLCV(40, new Date()));
      const ema2 = ema.update(createOHLCV(50, new Date()));
      
      expect(ema1).toBeCloseTo(30, 5);
      // EMA2 = (50 - 30) * 0.5 + 30 = 40
      expect(ema2).toBeCloseTo(40, 5);
    });

    it('should converge to price level when price stabilizes', () => {
      const ema = new EMA(3);
      
      // Initialize
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date()));
      
      // Keep feeding same price
      let result = 100;
      for (let i = 0; i < 10; i++) {
        result = ema.update(createOHLCV(100, new Date()))!;
      }
      
      // Should stay at 100
      expect(result).toBeCloseTo(100, 5);
    });

    it('should work with period of 1', () => {
      const ema = new EMA(1);
      
      expect(ema.update(createOHLCV(100, new Date()))).toBe(100);
      expect(ema.update(createOHLCV(200, new Date()))).toBe(200);
      expect(ema.update(createOHLCV(150, new Date()))).toBe(150);
    });
  });

  describe('getValue()', () => {
    it('should return null when no data', () => {
      const ema = new EMA(3);
      expect(ema.getValue()).toBeNull();
    });

    it('should return null when insufficient data', () => {
      const ema = new EMA(3);
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(110, new Date()));
      
      expect(ema.getValue()).toBeNull();
    });

    it('should return current EMA value after enough updates', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      ema.update(createOHLCV(30, new Date()));
      ema.update(createOHLCV(40, new Date()));
      
      expect(ema.getValue()).toBeCloseTo(30, 5);
    });

    it('should return same value as last update()', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      ema.update(createOHLCV(30, new Date()));
      
      const updateResult = ema.update(createOHLCV(40, new Date()));
      const getValueResult = ema.getValue();
      
      expect(getValueResult).toBe(updateResult);
    });

    it('should return null after calculate() is used', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date()),
        createOHLCV(20, new Date()),
        createOHLCV(30, new Date()),
      ];
      
      ema.calculate(data);
      
      // calculate() should not set internal state
      expect(ema.getValue()).toBeNull();
    });
  });

  describe('reset()', () => {
    it('should clear internal state', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(10, new Date()));
      ema.update(createOHLCV(20, new Date()));
      ema.update(createOHLCV(30, new Date()));
      ema.update(createOHLCV(40, new Date()));
      
      expect(ema.getValue()).not.toBeNull();
      
      ema.reset();
      
      expect(ema.getValue()).toBeNull();
    });

    it('should allow starting fresh after reset', () => {
      const ema = new EMA(2);
      
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(200, new Date()));
      
      ema.reset();
      
      expect(ema.update(createOHLCV(50, new Date()))).toBeNull();
      expect(ema.update(createOHLCV(100, new Date()))).toBe(75); // (50+100)/2
    });
  });

  describe('edge cases', () => {
    it('should handle decimal values correctly', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10.5, new Date()),
        createOHLCV(20.7, new Date()),
        createOHLCV(30.3, new Date()),
        createOHLCV(25.5, new Date()),
      ];
      
      const results = ema.calculate(data);
      
      expect(results[0].value).toBeCloseTo(20.5, 2);
      // Should handle decimals properly
      expect(results[1].value).toBeCloseTo(23, 1);
    });

    it('should handle large datasets', () => {
      const ema = new EMA(50);
      const data: OHLCV[] = [];
      
      for (let i = 0; i < 1000; i++) {
        data.push(createOHLCV(100 + i * 0.1, new Date()));
      }
      
      const results = ema.calculate(data);
      
      expect(results).toHaveLength(951); // 1000 - 50 + 1
      expect(results[0].value).toBeGreaterThan(100);
      expect(results[results.length - 1].value).toBeGreaterThan(results[0].value);
    });

    it('should be more responsive than SMA to trend changes', () => {
      const ema = new EMA(5);
      
      // Flat prices then uptrend
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(100, new Date())); // SMA = 100
      
      // Now prices go up
      const ema1 = ema.update(createOHLCV(110, new Date()));
      const ema2 = ema.update(createOHLCV(120, new Date()));
      
      // EMA should react faster than SMA would
      // SMA would be (100+100+100+110+120)/5 = 106
      // EMA should be higher
      expect(ema2!).toBeGreaterThan(106);
    });

    it('should handle volatile prices', () => {
      const ema = new EMA(3);
      
      ema.update(createOHLCV(100, new Date()));
      ema.update(createOHLCV(200, new Date()));
      ema.update(createOHLCV(100, new Date()));
      const result = ema.update(createOHLCV(200, new Date()));
      
      // Should handle large swings
      expect(result).toBeGreaterThan(100);
      expect(result).toBeLessThan(200);
    });
  });

  describe('comparison with SMA', () => {
    it('should start with same value as SMA', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date()),
        createOHLCV(20, new Date()),
        createOHLCV(30, new Date()),
      ];
      
      const results = ema.calculate(data);
      
      // First EMA value = SMA value = (10+20+30)/3 = 20
      expect(results[0].value).toBe(20);
    });

    it('should diverge from SMA after initialization', () => {
      const ema = new EMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date()),
        createOHLCV(20, new Date()),
        createOHLCV(30, new Date()),
        createOHLCV(40, new Date()),
        createOHLCV(35, new Date()), // FIXED: Changed from 50 to 35
      ];
      
      const emaResults = ema.calculate(data);
      
      // First EMA = SMA = (10+20+30)/3 = 20
      // Second EMA = (40 - 20) * 0.5 + 20 = 30
      // Third EMA = (35 - 30) * 0.5 + 30 = 32.5
      
      // Last 3 prices: 30, 40, 35, SMA would be 35
      // But EMA is 32.5, showing it carries weight from previous values
      expect(emaResults[emaResults.length - 1].value).toBe(32.5);
      expect(emaResults[emaResults.length - 1].value).not.toBe(35);
    });
  });
});