import { BacktestEngine } from '..';
import { SMACrossoverStrategy } from '../../strategies/SMACrossoverStrategy';
import { OHLCV } from '../../indicators';
import { Portfolio } from '../../portfolio';

describe('BacktestEngine', () => {
  
  // Helper to create mock price data
  const createOHLCV = (close: number, timestamp: Date): OHLCV => ({
    open: close,
    high: close,
    low: close,
    close: close,
    volume: 1000,
    timestamp: timestamp,
  });

  // Helper to create trending price data
  const createTrendingData = (length: number, startPrice: number, trend: 'up' | 'down' | 'flat'): OHLCV[] => {
    const data: OHLCV[] = [];
    for (let i = 0; i < length; i++) {
      let price = startPrice;
      if (trend === 'up') {
        price = startPrice + i;
      } else if (trend === 'down') {
        price = startPrice - i;
      }
      data.push(createOHLCV(price, new Date(2024, 0, i + 1)));
    }
    return data;
  };

  describe('constructor', () => {
    it('should create engine with initial capital', () => {
      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      expect(engine).toBeDefined();
      expect(engine.getEquityHistory()).toEqual([]);
    });

    it('should initialize with correct symbol', () => {
      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const strategy = new SMACrossoverStrategy('TSLA', 50, 20);
      const engine = new BacktestEngine('TSLA', 10000, strategy, data);

      expect(engine).toBeDefined();
    });

    it('should initialize with different capital amounts', () => {
      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      
      const engine1 = new BacktestEngine('AAPL', 5000, strategy, data);
      const engine2 = new BacktestEngine('AAPL', 50000, strategy, data);

      expect(engine1).toBeDefined();
      expect(engine2).toBeDefined();
    });
  });

  describe('equity tracking', () => {
    it('should have empty equity history before running', () => {
      const data = createTrendingData(10, 100, 'flat');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      expect(engine.getEquityHistory()).toEqual([]);
    });

    it('should track equity for each bar after running', () => {
      const data = createTrendingData(10, 100, 'flat');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      expect(engine.getEquityHistory().length).toBe(10);
    });

    it('should record correct equity values when no trades', () => {
      // Not enough data for SMA to trigger (needs 50 bars)
      const data = createTrendingData(10, 100, 'flat');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      
      // Should all be 10000 since no trades executed
      history.forEach(point => {
        expect(point.equity).toBe(10000);
      });
    });

    it('should update equity after buying', () => {
      // Create data that will trigger a buy
      const data = createTrendingData(60, 100, 'up');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      
      // Early bars should be 10000 (no trades yet)
      expect(history[0].equity).toBe(10000);
      
      // Later bars should reflect position value
      expect(history.length).toBe(60);
    });

    it('should track timestamps correctly', () => {
      const data = createTrendingData(5, 100, 'flat');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      
      expect(history[0].date).toEqual(new Date(2024, 0, 1));
      expect(history[4].date).toEqual(new Date(2024, 0, 5));
    });
  });

  describe('buy execution', () => {
    it('should not buy when insufficient cash', () => {
      const data = [createOHLCV(10000, new Date('2024-01-01'))]; // Price > available cash
      const strategy = new SMACrossoverStrategy('AAPL', 1, 1); // Triggers immediately
      const engine = new BacktestEngine('AAPL', 100, strategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      expect(history[0].equity).toBe(100); // Should remain unchanged
    });

    it('should calculate quantity based on allocation', () => {
      // Create a simple mock strategy that always buys
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'BUY',
          symbol: 'AAPL',
          confidence: 1,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      // With 10000 capital, 20% allocation, 100% confidence, $100 price
      // Should buy: floor(10000 * 0.2 * 1 / 100) = 20 shares
      // Cost: 20 * 100 = 2000
      // Remaining cash: 8000
      // Equity: 8000 + (20 * 100) = 10000
      
      const history = engine.getEquityHistory();
      expect(history[0].equity).toBe(10000);
    });

    it('should handle partial confidence correctly', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'BUY',
          symbol: 'AAPL',
          confidence: 0.5, // 50% confidence
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      // With 10000 capital, 20% allocation, 50% confidence, $100 price
      // Should buy: floor(10000 * 0.2 * 0.5 / 100) = 10 shares
      
      const history = engine.getEquityHistory();
      expect(history[0].equity).toBe(10000);
    });

    it('should not buy when quantity rounds to zero', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'BUY',
          symbol: 'AAPL',
          confidence: 1,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(10000, new Date('2024-01-01'))]; // Very expensive stock
      const engine = new BacktestEngine('AAPL', 1000, mockStrategy, data); // Small capital

      engine.runEngine();

      // floor(1000 * 0.2 * 1 / 10000) = floor(0.02) = 0 shares
      const history = engine.getEquityHistory();
      expect(history[0].equity).toBe(1000); // Should remain unchanged
    });
  });

  describe('sell execution', () => {
    it('should not sell when no position exists', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'SELL',
          symbol: 'AAPL',
          confidence: 1,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      expect(history[0].equity).toBe(10000); // Should remain unchanged
    });

    it('should sell entire position', () => {
      let callCount = 0;
      const mockStrategy = {
        onBar: jest.fn().mockImplementation((bar, portfolio) => {
          callCount++;
          const hasPosition = portfolio.getPosition('AAPL') !== null;
          
          if (callCount === 1) {
            return {
              action: 'BUY',
              symbol: 'AAPL',
              confidence: 1,
              reason: 'test',
              timestamp: new Date()
            };
          } else if (callCount === 2 && hasPosition) {
            return {
              action: 'SELL',
              symbol: 'AAPL',
              confidence: 1,
              reason: 'test',
              timestamp: new Date()
            };
          }
          return {
            action: 'HOLD',
            symbol: 'AAPL',
            confidence: 0,
            reason: 'test',
            timestamp: new Date()
          };
        }),
        reset: jest.fn()
      };

      const data = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(150, new Date('2024-01-02'))
      ];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      
      // After buy: 20 shares at $100, cash = 8000, equity = 10000
      expect(history[0].equity).toBe(10000);
      
      // After sell: 20 shares sold at $150 = 3000 revenue
      // Cash should be 8000 + 3000 = 11000, no position
      expect(history[1].equity).toBe(11000);
    });

    it('should update equity correctly after sell', () => {
      let callCount = 0;
      const mockStrategy = {
        onBar: jest.fn().mockImplementation((bar, portfolio) => {
          callCount++;
          const hasPosition = portfolio.getPosition('AAPL') !== null;
          
          if (callCount === 1) {
            return { action: 'BUY', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          } else if (callCount === 2 && hasPosition) {
            return { action: 'SELL', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          }
          return { action: 'HOLD', symbol: 'AAPL', confidence: 0, reason: 'test', timestamp: new Date() };
        }),
        reset: jest.fn()
      };

      const data = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(80, new Date('2024-01-02')),  // Loss
        createOHLCV(80, new Date('2024-01-03'))
      ];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      
      // After sell at loss: 20 shares bought at $100, sold at $80
      // Lost: 20 * (100 - 80) = 400
      expect(history[2].equity).toBe(9600);
    });
  });

  describe('getFinalReturn', () => {
    it('should return 0 when no data', () => {
      const data: OHLCV[] = [];
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      expect(engine.getFinalReturn()).toBe(0);
    });

    it('should calculate positive return correctly', () => {
      let callCount = 0;
      const mockStrategy = {
        onBar: jest.fn().mockImplementation((bar, portfolio) => {
          callCount++;
          const hasPosition = portfolio.getPosition('AAPL') !== null;
          
          if (callCount === 1) {
            return { action: 'BUY', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          } else if (callCount === 2 && hasPosition) {
            return { action: 'SELL', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          }
          return { action: 'HOLD', symbol: 'AAPL', confidence: 0, reason: 'test', timestamp: new Date() };
        }),
        reset: jest.fn()
      };

      const data = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(150, new Date('2024-01-02'))
      ];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const finalReturn = engine.getFinalReturn();
      // Started at 10000, ended at 11000 = 10% return
      expect(finalReturn).toBeCloseTo(0.1, 4);
    });

    it('should calculate negative return correctly', () => {
      let callCount = 0;
      const mockStrategy = {
        onBar: jest.fn().mockImplementation((bar, portfolio) => {
          callCount++;
          const hasPosition = portfolio.getPosition('AAPL') !== null;
          
          if (callCount === 1) {
            return { action: 'BUY', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          } else if (callCount === 2 && hasPosition) {
            return { action: 'SELL', symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
          }
          return { action: 'HOLD', symbol: 'AAPL', confidence: 0, reason: 'test', timestamp: new Date() };
        }),
        reset: jest.fn()
      };

      const data = [
        createOHLCV(100, new Date('2024-01-01')),
        createOHLCV(80, new Date('2024-01-02'))
      ];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const finalReturn = engine.getFinalReturn();
      // Started at 10000, ended at 9600 = -4% return
      expect(finalReturn).toBeCloseTo(-0.04, 4);
    });

    it('should return 0% when no change', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'HOLD',
          symbol: 'AAPL',
          confidence: 0,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      expect(engine.getFinalReturn()).toBe(0);
    });
  });

  describe('full backtest integration', () => {
    it('should run complete backtest with SMA strategy', () => {
      // Create data with clear trend for SMA crossover
      const data = createTrendingData(60, 100, 'up');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      expect(history.length).toBe(60);
      expect(history[0].equity).toBeDefined();
      expect(history[59].equity).toBeDefined();
    });

    it('should handle multiple buy/sell cycles', () => {
      let callCount = 0;
      const mockStrategy = {
        onBar: jest.fn().mockImplementation(() => {
          callCount++;
          const action = callCount % 2 === 1 ? 'BUY' : 'SELL';
          return { action, symbol: 'AAPL', confidence: 1, reason: 'test', timestamp: new Date() };
        }),
        reset: jest.fn()
      };

      const data = createTrendingData(10, 100, 'up');
      const engine = new BacktestEngine('AAPL', 10000, mockStrategy, data);

      engine.runEngine();

      const history = engine.getEquityHistory();
      expect(history.length).toBe(10);
    });

    it('should reset properly between runs', () => {
      const data = createTrendingData(10, 100, 'flat');
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();
      const firstRun = engine.getEquityHistory().length;

      engine.runEngine();
      const secondRun = engine.getEquityHistory().length;

      expect(firstRun).toBe(secondRun);
      expect(secondRun).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty data array', () => {
      const data: OHLCV[] = [];
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      expect(engine.getEquityHistory().length).toBe(0);
      expect(engine.getFinalReturn()).toBe(0);
    });

    it('should handle single data point', () => {
      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const strategy = new SMACrossoverStrategy('AAPL', 50, 20);
      const engine = new BacktestEngine('AAPL', 10000, strategy, data);

      engine.runEngine();

      expect(engine.getEquityHistory().length).toBe(1);
    });

    it('should handle zero initial capital', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'BUY',
          symbol: 'AAPL',
          confidence: 1,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(100, new Date('2024-01-01'))];
      const engine = new BacktestEngine('AAPL', 0, mockStrategy, data);

      engine.runEngine();

      // Can't buy anything with 0 capital
      expect(engine.getEquityHistory()[0].equity).toBe(0);
    });

    it('should handle very high price stocks', () => {
      const mockStrategy = {
        onBar: jest.fn().mockReturnValue({
          action: 'BUY',
          symbol: 'BRK.A',
          confidence: 1,
          reason: 'test',
          timestamp: new Date()
        }),
        reset: jest.fn()
      };

      const data = [createOHLCV(500000, new Date('2024-01-01'))]; // Berkshire price
      const engine = new BacktestEngine('BRK.A', 10000, mockStrategy, data);

      engine.runEngine();

      // Can't afford even 1 share
      expect(engine.getEquityHistory()[0].equity).toBe(10000);
    });
  });
});