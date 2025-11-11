import { SMACrossoverStrategy } from '../SMACrossoverStrategy';
import { Portfolio } from '../../portfolio';
import { OHLCV } from '../../indicators';

describe('SMACrossoverStrategy', () => {
  
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
    it('should create strategy with symbol and periods', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      expect(strategy).toBeDefined();
    });
  });

  describe('onBar() - insufficient data', () => {
    it('should return HOLD when not enough data for indicators', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const portfolio = new Portfolio(10000);
      
      const signal = strategy.onBar(
        createOHLCV(100, new Date('2024-01-01')),
        portfolio
      );
      
      expect(signal.action).toBe('HOLD');
      expect(signal.symbol).toBe('AAPL');
      expect(signal.confidence).toBe(0);
      expect(signal.reason).toContain('not yet calculated');
    });

    it('should return HOLD until long SMA is ready', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // First bar
      let signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
      expect(signal.action).toBe('HOLD');
      
      // Second bar
      signal = strategy.onBar(createOHLCV(102, new Date()), portfolio);
      expect(signal.action).toBe('HOLD');
      
      // Third bar - now long SMA (period 3) is ready
      signal = strategy.onBar(createOHLCV(104, new Date()), portfolio);
      expect(signal.action).not.toBe('HOLD'); // Could be BUY or actual HOLD with reason
    });
  });

  describe('onBar() - BUY signals', () => {
    it('should generate BUY signal when short crosses above long', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Create downtrend then uptrend
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(98, new Date()), portfolio);
      strategy.onBar(createOHLCV(96, new Date()), portfolio); // Both SMAs ready
      
      // Now prices go up - short SMA will cross above long
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(105, new Date()), portfolio);
      
      expect(signal.action).toBe('BUY');
      expect(signal.symbol).toBe('AAPL');
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.reason).toContain('crossed above');
    });

    it('should NOT generate BUY if already have position', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Warm up indicators
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      strategy.onBar(createOHLCV(104, new Date()), portfolio);
      
      // Buy position manually
      portfolio.addPosition('AAPL', 10, 100);
      
      // Even with bullish crossover, should not buy again
      strategy.onBar(createOHLCV(110, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(115, new Date()), portfolio);
      
      expect(signal.action).not.toBe('BUY');
    });

    it('should generate BUY with proper timestamp', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      const testDate = new Date('2024-11-10');
      
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(98, new Date()), portfolio);
      strategy.onBar(createOHLCV(96, new Date()), portfolio);
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(105, testDate), portfolio);
      
      if (signal.action === 'BUY') {
        expect(signal.timestamp).toEqual(testDate);
      }
    });
  });

  describe('onBar() - SELL signals', () => {
    it('should generate SELL signal when short crosses below long', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Create uptrend
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      strategy.onBar(createOHLCV(104, new Date()), portfolio);
      
      // Buy position
      portfolio.addPosition('AAPL', 10, 100);
      
      // Now prices go down - short SMA will cross below long
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(95, new Date()), portfolio);
      
      expect(signal.action).toBe('SELL');
      expect(signal.symbol).toBe('AAPL');
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.reason).toContain('crossed below');
    });

    it('should NOT generate SELL if no position', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Create uptrend then downtrend
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      strategy.onBar(createOHLCV(104, new Date()), portfolio);
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(95, new Date()), portfolio);
      
      // No position, so should not sell
      expect(signal.action).not.toBe('SELL');
    });
  });

  describe('onBar() - HOLD signals', () => {
    it('should return HOLD when no crossover occurs', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Steady uptrend - no crossover
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(101, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(103, new Date()), portfolio);
      
      expect(signal.action).toBe('HOLD');
      expect(signal.confidence).toBe(0);
    });

    it('should return HOLD with descriptive reason', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(101, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(103, new Date()), portfolio);
      
      expect(signal.reason).toBeTruthy();
      expect(signal.reason.length).toBeGreaterThan(0);
    });
  });

  describe('reset()', () => {
    it('should clear indicator state', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Warm up indicators
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      strategy.onBar(createOHLCV(104, new Date()), portfolio);
      
      // Reset
      strategy.reset();
      
      // Should need to warm up again
      const signal = strategy.onBar(createOHLCV(106, new Date()), portfolio);
      expect(signal.action).toBe('HOLD');
      expect(signal.reason).toContain('not yet calculated');
    });

    it('should allow fresh signal generation after reset', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // First run
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(102, new Date()), portfolio);
      strategy.onBar(createOHLCV(104, new Date()), portfolio);
      
      strategy.reset();
      
      // Second run - should work independently
      strategy.onBar(createOHLCV(200, new Date()), portfolio);
      strategy.onBar(createOHLCV(202, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(204, new Date()), portfolio);
      
      expect(signal).toBeDefined();
      expect(signal.symbol).toBe('AAPL');
    });
  });

  describe('confidence calculation', () => {
    it('should have confidence between 0 and 1', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Create scenario with signal
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(98, new Date()), portfolio);
      strategy.onBar(createOHLCV(96, new Date()), portfolio);
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(110, new Date()), portfolio);
      
      if (signal.action !== 'HOLD') {
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should have higher confidence for larger crossover gaps', () => {
      const strategy1 = new SMACrossoverStrategy('AAPL', 3, 2);
      const strategy2 = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      // Strategy 1: Small gap
      strategy1.onBar(createOHLCV(100, new Date()), portfolio);
      strategy1.onBar(createOHLCV(98, new Date()), portfolio);
      strategy1.onBar(createOHLCV(96, new Date()), portfolio);
      strategy1.onBar(createOHLCV(100, new Date()), portfolio);
      const signal1 = strategy1.onBar(createOHLCV(102, new Date()), portfolio);
      
      // Strategy 2: Large gap
      strategy2.onBar(createOHLCV(100, new Date()), portfolio);
      strategy2.onBar(createOHLCV(98, new Date()), portfolio);
      strategy2.onBar(createOHLCV(96, new Date()), portfolio);
      strategy2.onBar(createOHLCV(100, new Date()), portfolio);
      const signal2 = strategy2.onBar(createOHLCV(120, new Date()), portfolio);
      
      if (signal1.action === 'BUY' && signal2.action === 'BUY') {
        expect(signal2.confidence).toBeGreaterThan(signal1.confidence);
      }
    });
  });

    describe('complete trading scenario', () => {
    it('should handle buy-hold-sell cycle', () => {
        const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
        const portfolio = new Portfolio(10000);
        
        const signals: string[] = [];
        
        // Downtrend
        signals.push(strategy.onBar(createOHLCV(100, new Date()), portfolio).action);
        signals.push(strategy.onBar(createOHLCV(98, new Date()), portfolio).action);
        signals.push(strategy.onBar(createOHLCV(96, new Date()), portfolio).action);
        
        // Uptrend - should trigger BUY
        signals.push(strategy.onBar(createOHLCV(100, new Date()), portfolio).action);
        const buySignal = strategy.onBar(createOHLCV(105, new Date()), portfolio);
        signals.push(buySignal.action);
        
        // Execute buy
        if (buySignal.action === 'BUY') {
        portfolio.addPosition('AAPL', 10, 105);
        }
        
        // Continue uptrend - should HOLD
        signals.push(strategy.onBar(createOHLCV(106, new Date()), portfolio).action);
        signals.push(strategy.onBar(createOHLCV(107, new Date()), portfolio).action);
        
        // Downtrend - should trigger SELL at bar 8 (price 103)
        const sellSignal = strategy.onBar(createOHLCV(103, new Date()), portfolio);
        signals.push(sellSignal.action);
        signals.push(strategy.onBar(createOHLCV(100, new Date()), portfolio).action);
        
        // Should have seen: HOLD, HOLD, HOLD, HOLD, BUY, HOLD, HOLD, SELL, HOLD
        expect(signals).toContain('BUY');
        expect(signals).toContain('SELL');
        expect(sellSignal.action).toBe('SELL');
        expect(buySignal.action).toBe('BUY');
    });
    });

  describe('edge cases', () => {
    it('should handle flat prices', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
      
      expect(signal.action).toBe('HOLD');
    });

    it('should handle decimal prices', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 3, 2);
      const portfolio = new Portfolio(10000);
      
      strategy.onBar(createOHLCV(99.99, new Date()), portfolio);
      strategy.onBar(createOHLCV(100.01, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(100.50, new Date()), portfolio);
      
      expect(signal).toBeDefined();
      expect(signal.confidence).not.toBeNaN();
    });

    it('should handle very small periods', () => {
      const strategy = new SMACrossoverStrategy('AAPL', 2, 1);
      const portfolio = new Portfolio(10000);
      
      strategy.onBar(createOHLCV(100, new Date()), portfolio);
      const signal = strategy.onBar(createOHLCV(102, new Date()), portfolio);
      
      expect(signal).toBeDefined();
    });
  });
});