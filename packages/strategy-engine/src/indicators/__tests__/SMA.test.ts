import { SMA } from '../sma';
import { OHLCV } from '../types';

describe('SMA (Simple Moving Average)', () => {

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
    it('should create SMA with default period of 20', () => {
      const sma = new SMA();
      expect(sma).toBeDefined();
    });

    it('should create SMA with custom period', () => {
      const sma = new SMA(50);
      expect(sma).toBeDefined();
    });
  });

  describe('calculate()', () => {
    it('should return empty array when insufficient data', () => {
      const sma = new SMA(5);
      const data: OHLCV[] = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(102, new Date('2024-01-02')),
      ];
      const results = sma.calculate(data);
      expect(results).toEqual([]);
    });

    it('should calculate SMA correctly for exact period', () => {
      const sma = new SMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date('2024-01-01')),
        createOHLCV(20, new Date('2024-01-02')),
        createOHLCV(30, new Date('2024-01-03')),
      ];
      const results = sma.calculate(data);
      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(20);
      expect(results[0].timestamp).toEqual(new Date('2024-01-03'));
    });

    it('should calculate multiple SMA values for longer dataset', () => {
      const sma = new SMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date('2024-01-01')),
        createOHLCV(20, new Date('2024-01-02')),
        createOHLCV(30, new Date('2024-01-03')),
        createOHLCV(40, new Date('2024-01-04')),
        createOHLCV(50, new Date('2024-01-05')),
      ];
      const results = sma.calculate(data);
      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(20);
      expect(results[1].value).toBe(30);
      expect(results[2].value).toBe(40);
    });

    it('should handle empty array', () => {
      const sma = new SMA(3);
      const results = sma.calculate([]);
      expect(results).toEqual([]);
    });

    it('should calculate 20-period SMA correctly', () => {
      const sma = new SMA(20);
      const data: OHLCV[] = [];
      for (let i = 1; i <= 25; i++) {
        data.push(createOHLCV(i * 10, new Date(`2024-01-${i.toString().padStart(2, '0')}`)));
      }
      const results = sma.calculate(data);
      expect(results).toHaveLength(6);
      expect(results[0].value).toBe(105);
    });
  });

  describe('update()', () => {
    it('should return null until enough data', () => {
      const sma = new SMA(3);
      expect(sma.update(createOHLCV(100, new Date()))).toBeNull();
      expect(sma.update(createOHLCV(200, new Date()))).toBeNull();
    });

    it('should return SMA value once enough data is added', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      const result = sma.update(createOHLCV(300, new Date())); // should now calculate
      expect(result).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should maintain sliding window correctly', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(10, new Date()));
      sma.update(createOHLCV(20, new Date()));
      sma.update(createOHLCV(30, new Date()));
      const sma1 = sma.update(createOHLCV(40, new Date()));
      const sma2 = sma.update(createOHLCV(50, new Date()));
      const sma3 = sma.update(createOHLCV(60, new Date()));
      expect(sma1).toBe(30);
      expect(sma2).toBe(40);
      expect(sma3).toBe(50);
    });

    it('should work correctly after multiple updates', () => {
      const sma = new SMA(2);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      expect(sma.update(createOHLCV(300, new Date()))).toBe(250);
      expect(sma.update(createOHLCV(400, new Date()))).toBe(350);
    });
  });

  describe('getValue()', () => {
    it('should return null when no data', () => {
      const sma = new SMA(3);
      expect(sma.getValue()).toBeNull();
    });

    it('should return null when insufficient data', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      expect(sma.getValue()).toBeNull();
    });

    it('should return current SMA value after enough updates', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      sma.update(createOHLCV(300, new Date()));
      sma.update(createOHLCV(400, new Date()));
      expect(sma.getValue()).toBe(300);
    });

    it('should return same value as last update()', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      sma.update(createOHLCV(300, new Date()));
      const updateResult = sma.update(createOHLCV(400, new Date()));
      expect(sma.getValue()).toBe(updateResult);
    });

    it('should return null after calculate() is used', () => {
      const sma = new SMA(3);
      const data: OHLCV[] = [
        createOHLCV(10, new Date()),
        createOHLCV(20, new Date()),
        createOHLCV(30, new Date()),
      ];
      sma.calculate(data);
      expect(sma.getValue()).toBeNull();
    });
  });

  describe('reset()', () => {
    it('should clear internal state', () => {
      const sma = new SMA(3);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      sma.update(createOHLCV(300, new Date()));
      sma.update(createOHLCV(400, new Date()));
      expect(sma.getValue()).toBe(300);
      sma.reset();
      expect(sma.getValue()).toBeNull();
    });

    it('should allow starting fresh after reset', () => {
      const sma = new SMA(2);
      sma.update(createOHLCV(100, new Date()));
      sma.update(createOHLCV(200, new Date()));
      sma.reset();
      expect(sma.update(createOHLCV(50, new Date()))).toBeNull();
      expect(sma.update(createOHLCV(100, new Date()))).toBe(75); // FIXED: (50+100)/2
      expect(sma.update(createOHLCV(150, new Date()))).toBe(125);
    });
  });

  describe('edge cases', () => {
    it('should handle period of 1', () => {
      const sma = new SMA(1);
      expect(sma.update(createOHLCV(100, new Date()))).toBe(100);
      expect(sma.update(createOHLCV(200, new Date()))).toBe(200);
      expect(sma.update(createOHLCV(300, new Date()))).toBe(300);
    });

    it('should handle large datasets', () => {
      const sma = new SMA(50);
      const data: OHLCV[] = [];
      for (let i = 0; i < 1000; i++) {
        data.push(createOHLCV(i + 100, new Date(`2024-01-01`)));
      }
      const results = sma.calculate(data);
      expect(results).toHaveLength(951);
      expect(results[0].value).toBeCloseTo(124.5, 1);
    });

    it('should handle decimal values correctly', () => {
      const sma = new SMA(3);
      const data: OHLCV[] = [
        createOHLCV(10.5, new Date()),
        createOHLCV(20.7, new Date()),
        createOHLCV(30.3, new Date()),
      ];
      const results = sma.calculate(data);
      expect(results[0].value).toBeCloseTo(20.5, 2);
    });
  });
});