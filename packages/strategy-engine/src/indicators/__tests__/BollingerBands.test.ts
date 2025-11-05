import { BollingerBands } from "../bollinger-Bands";
import { OHLCV } from "../types";

describe("BollingerBands", () => {
  let bb: BollingerBands;
  
  beforeEach(() => {
    bb = new BollingerBands(20, 2);
  });

  describe("Constructor", () => {
    it("should create instance with default parameters", () => {
      const indicator = new BollingerBands();
      expect(indicator).toBeInstanceOf(BollingerBands);
    });

    it("should create instance with custom parameters", () => {
      const indicator = new BollingerBands(10, 1.5);
      expect(indicator).toBeInstanceOf(BollingerBands);
    });
  });

  describe("calculate()", () => {
    it("should return empty arrays when not enough data", () => {
      const data: OHLCV[] = generateOHLCVData(10, 100);
      const result = bb.calculate(data);
      
      expect(result.upper).toEqual([]);
      expect(result.middle).toEqual([]);
      expect(result.lower).toEqual([]);
    });

    it("should calculate Bollinger Bands with exact period", () => {
      const data: OHLCV[] = generateOHLCVData(20, 100);
      const result = bb.calculate(data);
      
      expect(result.upper.length).toBe(1);
      expect(result.middle.length).toBe(1);
      expect(result.lower.length).toBe(1);
      
      expect(result.middle[0].value).not.toBeNull();
      expect(result.upper[0].value).toBeGreaterThan(result.middle[0].value!);
      expect(result.lower[0].value).toBeLessThan(result.middle[0].value!);
    });

    it("should calculate Bollinger Bands with more than period data", () => {
      const data: OHLCV[] = generateOHLCVData(30, 100);
      const result = bb.calculate(data);
      
      expect(result.upper.length).toBe(11);
      expect(result.middle.length).toBe(11);
      expect(result.lower.length).toBe(11);
    });

    it("should have upper band above middle and lower band below middle", () => {
      const data: OHLCV[] = generateOHLCVData(25, 100);
      const result = bb.calculate(data);
      
      result.upper.forEach((upper, i) => {
        const middleValue = result.middle[i].value;
        const lowerValue = result.lower[i].value;
        
        expect(middleValue).not.toBeNull();
        expect(lowerValue).not.toBeNull();
        expect(upper.value).toBeGreaterThan(middleValue!);
        expect(lowerValue!).toBeLessThan(middleValue!);
      });
    });

    it("should have symmetric bands around middle with constant prices", () => {
      const data: OHLCV[] = generateConstantOHLCVData(25, 100);
      const result = bb.calculate(data);
      
      // With constant prices, std dev should be 0, so upper = middle = lower
      const lastIndex = result.upper.length - 1;
      const upperValue = result.upper[lastIndex].value;
      const middleValue = result.middle[lastIndex].value;
      const lowerValue = result.lower[lastIndex].value;
      
      expect(upperValue).not.toBeNull();
      expect(middleValue).not.toBeNull();
      expect(lowerValue).not.toBeNull();
      expect(upperValue!).toBeCloseTo(middleValue!);
      expect(lowerValue!).toBeCloseTo(middleValue!);
    });

    it("should calculate with custom period and multiplier", () => {
      const customBB = new BollingerBands(10, 1.5);
      const data: OHLCV[] = generateOHLCVData(15, 100);
      const result = customBB.calculate(data);
      
      expect(result.upper.length).toBe(6);
      expect(result.middle.length).toBe(6);
      expect(result.lower.length).toBe(6);
    });

    it("should maintain timestamps in results", () => {
      const data: OHLCV[] = generateOHLCVData(25, 100);
      const result = bb.calculate(data);
      
      expect(result.upper[0].timestamp).toBe(data[19].timestamp);
      expect(result.middle[0].timestamp).toBe(data[19].timestamp);
      expect(result.lower[0].timestamp).toBe(data[19].timestamp);
    });

    it("should handle volatile price movements", () => {
      const data: OHLCV[] = generateVolatileOHLCVData(25);
      const result = bb.calculate(data);
      
      // Volatile data should have wider bands
      const lastIndex = result.upper.length - 1;
      const upperValue = result.upper[lastIndex].value;
      const lowerValue = result.lower[lastIndex].value;
      
      expect(upperValue).not.toBeNull();
      expect(lowerValue).not.toBeNull();
      
      const bandWidth = upperValue! - lowerValue!;
      expect(bandWidth).toBeGreaterThan(0);
    });
  });

  describe("update()", () => {
    it("should return null values when not enough data", () => {
      for (let i = 0; i < 19; i++) {
        const result = bb.update(createOHLCV(100 + i, Date.now() + i));
        expect(result.upper).toBeNull();
        expect(result.middle).toBeNull();
        expect(result.lower).toBeNull();
      }
    });

    it("should calculate values once enough data exists", () => {
      for (let i = 0; i < 20; i++) {
        bb.update(createOHLCV(100 + i, Date.now() + i));
      }
      
      const result = bb.update(createOHLCV(120, Date.now() + 20));
      
      expect(result.upper).not.toBeNull();
      expect(result.middle).not.toBeNull();
      expect(result.lower).not.toBeNull();
      
      // Now safe to use non-null assertion
      expect(result.upper!).toBeGreaterThan(result.middle!);
      expect(result.lower!).toBeLessThan(result.middle!);
    });

    it("should maintain rolling window of period + 1", () => {
      // Add more than period data points
      for (let i = 0; i < 25; i++) {
        bb.update(createOHLCV(100 + i, Date.now() + i));
      }
      
      // prices array should not exceed period + 1
      expect(bb.prices.length).toBeLessThanOrEqual(21);
    });

    it("should update progressively", () => {
      const results: number[] = [];
      
      for (let i = 0; i < 25; i++) {
        const result = bb.update(createOHLCV(100 + Math.random() * 10, Date.now() + i));
        if (result.middle !== null) {
          results.push(result.middle);
        }
      }
      
      // Should have calculations after period is met
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("reset()", () => {
    it("should clear internal state", () => {
      // Add some data
      for (let i = 0; i < 25; i++) {
        bb.update(createOHLCV(100 + i, Date.now() + i));
      }
      
      bb.reset();
      
      expect(bb.prices.length).toBe(0);
    });

    it("should allow recalculation after reset", () => {
      // Add data and calculate
      for (let i = 0; i < 25; i++) {
        bb.update(createOHLCV(100 + i, Date.now() + i));
      }
      
      bb.reset();
      
      // Should return null after reset
      const result1 = bb.update(createOHLCV(100, Date.now()));
      expect(result1.middle).toBeNull();
      
      // Add enough data again
      for (let i = 0; i < 20; i++) {
        bb.update(createOHLCV(100 + i, Date.now() + i));
      }
      
      const result2 = bb.update(createOHLCV(120, Date.now() + 20));
      expect(result2.middle).not.toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle negative prices", () => {
      const data: OHLCV[] = generateOHLCVData(25, -50);
      const result = bb.calculate(data);
      
      expect(result.upper.length).toBeGreaterThan(0);
      expect(result.middle.length).toBeGreaterThan(0);
      expect(result.lower.length).toBeGreaterThan(0);
    });

    it("should handle zero prices", () => {
      const data: OHLCV[] = generateConstantOHLCVData(25, 0);
      const result = bb.calculate(data);
      
      expect(result.middle[0].value).toBe(0);
    });

    it("should handle very large numbers", () => {
      const data: OHLCV[] = generateOHLCVData(25, 1000000);
      const result = bb.calculate(data);
      
      const upperValue = result.upper[0].value;
      
      expect(result.upper.length).toBeGreaterThan(0);
      expect(upperValue).not.toBeNull();
      expect(Number.isFinite(upperValue!)).toBe(true);
    });
  });
});

// Helper functions
function generateOHLCVData(count: number, basePrice: number): OHLCV[] {
  const data: OHLCV[] = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const price = basePrice + Math.random() * 20 - 10;
    data.push(createOHLCV(price, startTime + i * 1000));
  }
  
  return data;
}

function generateConstantOHLCVData(count: number, price: number): OHLCV[] {
  const data: OHLCV[] = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    data.push(createOHLCV(price, startTime + i * 1000));
  }
  
  return data;
}

function generateVolatileOHLCVData(count: number): OHLCV[] {
  const data: OHLCV[] = [];
  const startTime = Date.now();
  let price = 100;
  
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.5) * 40; // Large swings
    data.push(createOHLCV(price, startTime + i * 1000));
  }
  
  return data;
}

function createOHLCV(price: number, timestamp: number): OHLCV {
  return {
    open: price,
    high: price * 1.01,
    low: price * 0.99,
    close: price,
    volume: 1000,
    timestamp
  };
}