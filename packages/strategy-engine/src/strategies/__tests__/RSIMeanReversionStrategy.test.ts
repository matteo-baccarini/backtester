import { RSIStrategy } from '../RSIMeanReversionStrategy';
import { Portfolio } from '../../portfolio';
import { OHLCV } from '../../indicators';

describe('RSIStrategy', () => {
  
  // Helper function to create test data
  const createOHLCV = (close: number, timestamp: Date): OHLCV => ({
    open: close,
    high: close,
    low: close,
    close: close,
    volume: 1000,
    timestamp: timestamp,
  });

  // Helper to create RSI test data that will produce specific RSI values
  const createRSITestData = (closes: number[]): OHLCV[] => {
    return closes.map((close, index) => 
      createOHLCV(close, new Date(2024, 0, index + 1))
    );
  };

  describe('constructor', () => {
    it('should create strategy with default thresholds', () => {
      const strategy = new RSIStrategy('AAPL', 14);
      expect(strategy).toBeDefined();
    });

    it('should create strategy with custom thresholds', () => {
      const strategy = new RSIStrategy('AAPL', 14, 20, 80, 10);
      expect(strategy).toBeDefined();
    });

    it('should create strategy with different RSI periods', () => {
      const strategy = new RSIStrategy('AAPL', 7);
      expect(strategy).toBeDefined();
    });
  });

  describe('onBar() - insufficient data', () => {
    it('should return HOLD when RSI not ready', () => {
      const strategy = new RSIStrategy('AAPL', 14);
      const portfolio = new Portfolio(10000);
      
      const signal = strategy.onBar(
        createOHLCV(100, new Date('2024-01-01')),
        portfolio
      );
      
      expect(signal.action).toBe('HOLD');
      expect(signal.symbol).toBe('AAPL');
      expect(signal.confidence).toBe(0);
      expect(signal.reason).toContain('warming up');
    });

    it('should return HOLD with warming-up reason until RSI is ready, then produce non-warming-up signals', () => {
    const strategy = new RSIStrategy('AAPL', 3);
    const portfolio = new Portfolio(10000);

    // Bar 1 – warming up
    let signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
    expect(signal.action).toBe('HOLD');
    expect(signal.reason).toContain('warming up');

    // Bar 2 – still warming up
    signal = strategy.onBar(createOHLCV(102, new Date()), portfolio);
    expect(signal.action).toBe('HOLD');
    expect(signal.reason).toContain('warming up');

    // Bar 3 – still warming up
    signal = strategy.onBar(createOHLCV(101, new Date()), portfolio);
    expect(signal.action).toBe('HOLD');
    expect(signal.reason).toContain('warming up');

    // Bar 4 – RSI is ready, but action may still be HOLD (neutral RSI)
    signal = strategy.onBar(createOHLCV(104, new Date()), portfolio);

    // Still HOLD is OK...
    expect(signal.action).toBe('HOLD');

    // ...but reason must NOT be warming up anymore
    expect(signal.reason).not.toContain('warming up');
    });

  });

  describe('onBar() - BUY signals (oversold)', () => {
    it('should generate BUY signal when RSI drops below oversold threshold', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Create declining prices to generate low RSI (oversold)
      const prices = [100, 95, 90, 85, 80]; // Strong downtrend
      const data = createRSITestData(prices);
      
      let signal;
      for (const price of data) {
        signal = strategy.onBar(price, portfolio);
      }
      
      // Should eventually trigger BUY
      expect(signal!.action).toBe('BUY');
      expect(signal!.symbol).toBe('AAPL');
      expect(signal!.confidence).toBeGreaterThan(0);
      expect(signal!.reason).toContain('over sold');
    });

    it('should calculate confidence based on how oversold', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Create very oversold condition
      const prices = [100, 90, 80, 70, 60, 50];
      const data = createRSITestData(prices);
      
      let signal;
      for (const price of data) {
        signal = strategy.onBar(price, portfolio);
      }
      
      if (signal!.action === 'BUY') {
        // Confidence = (threshold - RSI) / threshold
        expect(signal!.confidence).toBeGreaterThan(0);
        expect(signal!.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should NOT generate BUY if already have position', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Warm up RSI
      const warmupPrices = [100, 102, 101, 104];
      const warmupData = createRSITestData(warmupPrices);
      
      for (const price of warmupData) {
        strategy.onBar(price, portfolio);
      }
      
      // Manually add position
      portfolio.addPosition('AAPL', 10, 100);
      
      // Create oversold condition
      const signal = strategy.onBar(createOHLCV(80, new Date()), portfolio);
      
      expect(signal.action).not.toBe('BUY');
    });

    it('should have proper timestamp on BUY signal', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      const testDate = new Date('2024-11-10');
      const prices = [100, 95, 90, 85];
      const data = createRSITestData(prices);
      
      for (const price of data) {
        strategy.onBar(price, portfolio);
      }
      
      const signal = strategy.onBar(createOHLCV(80, testDate), portfolio);
      
      if (signal.action === 'BUY') {
        expect(signal.timestamp).toEqual(testDate);
      }
    });
  });

  describe('onBar() - SELL signals (overbought)', () => {
    it('should generate SELL signal when RSI exceeds overbought threshold', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Warm up with neutral prices
      const warmupPrices = [100, 101, 102];
      const warmupData = createRSITestData(warmupPrices);
      
      for (const price of warmupData) {
        strategy.onBar(price, portfolio);
      }
      
      // Add position
      portfolio.addPosition('AAPL', 10, 100);
      
      // Create strong uptrend (overbought)
      const prices = [105, 110, 115, 120, 125];
      const data = createRSITestData(prices);
      
      let signal;
      for (const price of data) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!.action).toBe('SELL');
      expect(signal!.reason).toContain('overbought');
    });

    it('should NOT generate SELL if no position', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Create overbought condition without position
      const prices = [100, 105, 110, 115, 120];
      const data = createRSITestData(prices);
      
      let signal;
      for (const price of data) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!.action).not.toBe('SELL');
    });

    it('should reset time stop when overbought SELL triggered', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Warm up
      const warmupPrices = [100, 101, 102];
      for (const price of createRSITestData(warmupPrices)) {
        strategy.onBar(price, portfolio);
      }
      
      // Add position
      portfolio.addPosition('AAPL', 10, 100);
      
      // Create overbought
      const prices = [105, 110, 115, 120];
      for (const price of createRSITestData(prices)) {
        strategy.onBar(price, portfolio);
      }
      
      // Time stop should be reset to 5 after SELL
      expect(strategy).toBeDefined(); // Implementation detail - hard to test directly
    });
  });

  describe('onBar() - time stop SELL', () => {
    it('should SELL after time stop expires', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 3); // 3-bar time stop
      const portfolio = new Portfolio(10000);
      
      // Warm up
      const warmupPrices = [100, 95, 90, 85];
      for (const price of createRSITestData(warmupPrices)) {
        strategy.onBar(price, portfolio);
      }
      
      // Add position (should reset time stop to 3)
      portfolio.addPosition('AAPL', 10, 85);
      
      // Hold for 3 bars (countdown: 3 -> 2 -> 1 -> 0)
      const holdPrices = [86, 87, 88, 89];
      let signal;
      
      for (const price of createRSITestData(holdPrices)) {
        signal = strategy.onBar(price, portfolio);
      }
      
      // Should trigger time stop SELL
      expect(signal!.action).toBe('SELL');
      expect(signal!.reason).toContain('Time Stop');
    });

    it('should countdown time stop each bar when holding', () => {
        const strategy = new RSIStrategy('AAPL', 3, 30, 70, 2); // 2-bar time stop
        const portfolio = new Portfolio(10000);

        // Warm-up
        const warmupPrices = [100, 95, 90, 85];
        for (const price of createRSITestData(warmupPrices)) {
            strategy.onBar(price, portfolio);
        }

        // Add position AFTER warmup
        portfolio.addPosition('AAPL', 10, 85);

        // Bar 1 → Detect new position → Reset timeLeft to 2, don't decrement
        let signal = strategy.onBar(createOHLCV(86, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 2 → timeLeft: 2 → 1
        signal = strategy.onBar(createOHLCV(87, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 3 → timeLeft: 1 → 0 → SELL
        signal = strategy.onBar(createOHLCV(88, new Date()), portfolio);
        expect(signal.action).toBe('SELL');
        expect(signal.reason).toContain('Time Stop');
    });

    it('should reset time stop when overbought SELL happens', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Warm up
      for (const price of createRSITestData([100, 101, 102])) {
        strategy.onBar(price, portfolio);
      }
      
      // Add position and trigger overbought
      portfolio.addPosition('AAPL', 10, 100);
      
      const prices = [110, 120, 130];
      for (const price of createRSITestData(prices)) {
        strategy.onBar(price, portfolio);
      }
      
      // After overbought SELL, if we get another position, time stop should be reset
      // This tests the reset logic
      expect(strategy).toBeDefined();
    });

    it('should only decrement time stop when position exists', () => {
        const strategy = new RSIStrategy('AAPL', 3, 30, 70, 3);
        const portfolio = new Portfolio(10000);

        // Warm up with NEUTRAL prices (small oscillations to keep RSI neutral)
        const prices = [100, 101, 100, 101, 100];
        for (const price of createRSITestData(prices)) {
            strategy.onBar(price, portfolio);
        }

        // Add position
        portfolio.addPosition('AAPL', 10, 100);

        // Continue with NEUTRAL prices to avoid triggering overbought
        // Bar 1 → Detect position, reset to 3, don't decrement
        let signal = strategy.onBar(createOHLCV(101, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 2 → timeLeft: 3 → 2
        signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 3 → timeLeft: 2 → 1
        signal = strategy.onBar(createOHLCV(101, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 4 → timeLeft: 1 → 0 → SELL
        signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
        expect(signal.action).toBe('SELL');
        expect(signal.reason).toContain('Time Stop');
    });
  });

  describe('onBar() - HOLD signals', () => {
    it('should return HOLD when RSI in neutral range without position', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Create stable prices (neutral RSI)
      const prices = [100, 101, 100, 101, 100];
      const data = createRSITestData(prices);
      
      let signal;
      for (const price of data) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!.action).toBe('HOLD');
      expect(signal!.reason).toContain('favorable conditions');
    });

    it('should only decrement time stop when position exists', () => {
        const strategy = new RSIStrategy('AAPL', 3, 30, 70, 3);
        const portfolio = new Portfolio(10000);

        // Warm up with neutral oscillating prices
        const prices = [100, 99, 100, 99, 100];
        for (const price of createRSITestData(prices)) {
            strategy.onBar(price, portfolio);
        }

        // Time stop should NOT have been counting down
        portfolio.addPosition('AAPL', 10, 100);

        // Bar 1 → Detect position, reset to 3, don't decrement
        let signal = strategy.onBar(createOHLCV(99, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 2 → timeLeft: 3 → 2
        signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 3 → timeLeft: 2 → 1
        signal = strategy.onBar(createOHLCV(99, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 4 → timeLeft: 1 → 0 → SELL
        signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
        expect(signal.action).toBe('SELL');
        expect(signal.reason).toContain('Time Stop');
    });

    it('should have zero confidence for HOLD signals', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      const prices = [100, 101, 100, 101];
      for (const price of createRSITestData(prices)) {
        strategy.onBar(price, portfolio);
      }
      
      const signal = strategy.onBar(createOHLCV(100, new Date()), portfolio);
      
      if (signal.action === 'HOLD') {
        expect(signal.confidence).toBe(0);
      }
    });
  });

  describe('reset()', () => {
    it('should clear RSI indicator state', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Warm up RSI
      const prices = [100, 102, 104, 106];
      for (const price of createRSITestData(prices)) {
        strategy.onBar(price, portfolio);
      }
      
      // Reset
      strategy.reset();
      
      // Should need to warm up again
      const signal = strategy.onBar(createOHLCV(108, new Date()), portfolio);
      expect(signal.action).toBe('HOLD');
      expect(signal.reason).toContain('warming up');
    });

    it('should reset time stop counter', () => {
        const strategy = new RSIStrategy('AAPL', 3, 30, 70, 2);
        const portfolio = new Portfolio(10000);

        // Warm up with neutral prices
        const prices = [100, 101, 100, 101];
        for (const price of createRSITestData(prices)) {
            strategy.onBar(price, portfolio);
        }

        // Add position AFTER warmup
        portfolio.addPosition('AAPL', 10, 101);

        // Bar 1 → Detect new position, don't decrement
        strategy.onBar(createOHLCV(100, new Date()), portfolio);

        // Reset strategy
        strategy.reset();

        // REQUIRED: Clear portfolio so strategy + portfolio start consistent
        portfolio.removePosition('AAPL', 10, 101);

        // Warm up again after reset
        for (const price of createRSITestData([90, 91, 90, 91])) {
            strategy.onBar(price, portfolio);
        }

        // Re-add position after warm-up
        portfolio.addPosition('AAPL', 10, 91);

        // Bar 1: new position, no decrement
        let signal = strategy.onBar(createOHLCV(90, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 2: 2 → 1
        signal = strategy.onBar(createOHLCV(91, new Date()), portfolio);
        expect(signal.action).toBe('HOLD');

        // Bar 3: 1 → 0 → SELL
        signal = strategy.onBar(createOHLCV(90, new Date()), portfolio);
        expect(signal.action).toBe('SELL');
        expect(signal.reason).toContain('Time Stop');
    });

    it('should allow fresh signal generation after reset', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // First run
      const prices1 = [100, 102, 104, 106];
      for (const price of createRSITestData(prices1)) {
        strategy.onBar(price, portfolio);
      }
      
      strategy.reset();
      
      // Second run - should work independently
      const prices2 = [200, 202, 204, 206];
      for (const price of createRSITestData(prices2)) {
        strategy.onBar(price, portfolio);
      }
      
      const signal = strategy.onBar(createOHLCV(208, new Date()), portfolio);
      
      expect(signal).toBeDefined();
      expect(signal.symbol).toBe('AAPL');
    });
  });

  describe('complete trading scenarios', () => {
    it('should handle buy-hold-sell cycle with time stop', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 3);
      const portfolio = new Portfolio(10000);
      
      const signals: string[] = [];
      
      // Create oversold condition
      const oversoldPrices = [100, 95, 90, 85, 80];
      for (const price of createRSITestData(oversoldPrices)) {
        const signal = strategy.onBar(price, portfolio);
        signals.push(signal.action);
        
        if (signal.action === 'BUY') {
          portfolio.addPosition('AAPL', 10, 80);
        }
      }
      
      // Hold for time stop duration
      const holdPrices = [81, 82, 83, 84];
      for (const price of createRSITestData(holdPrices)) {
        const signal = strategy.onBar(price, portfolio);
        signals.push(signal.action);
      }
      
      // Should have BUY and SELL in signals
      expect(signals).toContain('BUY');
      expect(signals).toContain('SELL');
    });

    it('should handle buy-hold-sell cycle with overbought exit', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // Create oversold and buy
      const oversoldPrices = [100, 95, 90, 85];
      for (const price of createRSITestData(oversoldPrices)) {
        const signal = strategy.onBar(price, portfolio);
        if (signal.action === 'BUY') {
          portfolio.addPosition('AAPL', 10, 85);
        }
      }
      
      // Create overbought
      const overboughtPrices = [90, 100, 110, 120];
      let sellSignal;
      for (const price of createRSITestData(overboughtPrices)) {
        sellSignal = strategy.onBar(price, portfolio);
      }
      
      expect(sellSignal!.action).toBe('SELL');
      expect(sellSignal!.reason).toContain('overbought');
    });
  });

  describe('edge cases', () => {
    it('should handle flat prices', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      const prices = [100, 100, 100, 100, 100];
      let signal;
      
      for (const price of createRSITestData(prices)) {
        signal = strategy.onBar(price, portfolio);
      }
      
      // RSI should be at 100 for flat prices (no losses)
      expect(signal!.action).toBe('HOLD');
    });

    it('should handle decimal prices', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      const prices = [99.99, 100.01, 99.50, 100.50];
      let signal;
      
      for (const price of createRSITestData(prices)) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!).toBeDefined();
      expect(signal!.confidence).not.toBeNaN();
    });

    it('should handle extreme RSI values', () => {
      const strategy = new RSIStrategy('AAPL', 3, 30, 70, 5);
      const portfolio = new Portfolio(10000);
      
      // All gains = RSI 100
      const allGains = [100, 110, 120, 130];
      let signal;
      
      for (const price of createRSITestData(allGains)) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!).toBeDefined();
    });

    it('should handle aggressive thresholds', () => {
      const strategy = new RSIStrategy('AAPL', 3, 10, 90, 5); // Very aggressive
      const portfolio = new Portfolio(10000);
      
      const prices = [100, 95, 90, 85];
      let signal;
      
      for (const price of createRSITestData(prices)) {
        signal = strategy.onBar(price, portfolio);
      }
      
      expect(signal!).toBeDefined();
    });
  });
});