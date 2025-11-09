import { Portfolio } from '../index';
import { Position } from '../types';

describe('Portfolio', () => {

  describe('constructor', () => {
    it('should create portfolio with initial capital', () => {
      const portfolio = new Portfolio(10000);
      expect(portfolio).toBeDefined();
      expect(portfolio.getCash()).toBe(10000);
    });

    it('should start with no positions', () => {
      const portfolio = new Portfolio(5000);
      expect(portfolio.getPositions().size).toBe(0);
    });

    it('should start with empty trade history', () => {
      const portfolio = new Portfolio(1000);
      expect(portfolio.tradeHistory).toEqual([]);
    });
  });

  describe('getCash()', () => {
    it('should return available cash', () => {
      const portfolio = new Portfolio(10000);
      expect(portfolio.getCash()).toBe(10000);
    });

    it('should return updated cash after purchase', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      expect(portfolio.getCash()).toBe(9000);
    });
  });

  describe('getPosition()', () => {
    it('should return null for non-existent position', () => {
      const portfolio = new Portfolio(10000);
      expect(portfolio.getPosition('AAPL')).toBeNull();
    });

    it('should return position after adding', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      const position = portfolio.getPosition('AAPL');
      expect(position).not.toBeNull();
      expect(position?.symbol).toBe('AAPL');
      expect(position?.numberOfShares).toBe(10);
      expect(position?.averagePricePerShare).toBe(100);
    });
  });

  describe('getPositions()', () => {
    it('should return empty map initially', () => {
      const portfolio = new Portfolio(10000);
      const positions = portfolio.getPositions();
      expect(positions.size).toBe(0);
    });

    it('should return all positions', () => {
      const portfolio = new Portfolio(20000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.addPosition('GOOGL', 5, 2000);
      const positions = portfolio.getPositions();
      expect(positions.size).toBe(2);
      expect(positions.has('AAPL')).toBe(true);
      expect(positions.has('GOOGL')).toBe(true);
    });

    it('should return a copy that does not affect internal state', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      const positions = portfolio.getPositions();
      positions.clear();
      expect(portfolio.getPositions().size).toBe(1);
    });
  });

  describe('addPosition()', () => {
    describe('validation', () => {
      it('should reject negative quantity', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('AAPL', -5, 100);
        expect(result).toBe(false);
        expect(portfolio.getPosition('AAPL')).toBeNull();
      });

      it('should reject zero quantity', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('AAPL', 0, 100);
        expect(result).toBe(false);
      });

      it('should reject negative price', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('AAPL', 10, -100);
        expect(result).toBe(false);
      });

      it('should reject zero price', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('AAPL', 10, 0);
        expect(result).toBe(false);
      });

      it('should reject empty symbol', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('', 10, 100);
        expect(result).toBe(false);
      });

      it('should reject whitespace-only symbol', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('   ', 10, 100);
        expect(result).toBe(false);
      });
    });

    describe('insufficient funds', () => {
      it('should reject purchase when insufficient cash', () => {
        const portfolio = new Portfolio(500);
        const result = portfolio.addPosition('AAPL', 10, 100);
        expect(result).toBe(false);
        expect(portfolio.getCash()).toBe(500);
        expect(portfolio.getPosition('AAPL')).toBeNull();
      });

      it('should not record trade when insufficient funds', () => {
        const portfolio = new Portfolio(500);
        portfolio.addPosition('AAPL', 10, 100);
        expect(portfolio.tradeHistory.length).toBe(0);
      });
    });

    describe('new position', () => {
      it('should create new position successfully', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.addPosition('AAPL', 10, 100);
        expect(result).toBe(true);
        
        const position = portfolio.getPosition('AAPL');
        expect(position).not.toBeNull();
        if (position === null) return;
        expect(position.symbol).toBe('AAPL');
        expect(position.numberOfShares).toBe(10);
        expect(position.averagePricePerShare).toBe(100);
        expect(position.positionType).toBe('LONG');
      });

      it('should deduct cash correctly', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 150);
        expect(portfolio.getCash()).toBe(8500);
      });

      it('should record trade in history', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        
        expect(portfolio.tradeHistory.length).toBe(1);
        const trade = portfolio.tradeHistory[0];
        expect(trade.symbol).toBe('AAPL');
        expect(trade.numberOfShares).toBe(10);
        expect(trade.pricePerShare).toBe(100);
        expect(trade.tradeType).toBe('BUY');
        expect(trade.tradeDate).toBeInstanceOf(Date);
      });
    });

    describe('position averaging', () => {
      it('should calculate average price correctly when adding to existing position', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        portfolio.addPosition('AAPL', 10, 120);
        
        const position = portfolio.getPosition('AAPL');
        expect(position).not.toBeNull();
        if (position === null) return;
        expect(position.numberOfShares).toBe(20);
        expect(position.averagePricePerShare).toBe(110);
      });

      it('should handle multiple purchases at different prices', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // 1000 spent, avg = 100
        portfolio.addPosition('AAPL', 5, 140);  // 700 spent, total 1700, avg = 113.33
        portfolio.addPosition('AAPL', 15, 80);  // 1200 spent, total 2900, avg = 96.67
        
        const position = portfolio.getPosition('AAPL');
        expect(position).not.toBeNull();
        if (position === null) return;
        expect(position.numberOfShares).toBe(30);
        expect(position.averagePricePerShare).toBeCloseTo(96.67, 2);
      });

      it('should update cash correctly with multiple purchases', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // 9000 remaining
        portfolio.addPosition('AAPL', 10, 120); // 7800 remaining
        expect(portfolio.getCash()).toBe(7800);
      });

      it('should record all trades in history', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        portfolio.addPosition('AAPL', 10, 120);
        
        expect(portfolio.tradeHistory.length).toBe(2);
        expect(portfolio.tradeHistory[0].pricePerShare).toBe(100);
        expect(portfolio.tradeHistory[1].pricePerShare).toBe(120);
      });
    });

    describe('multiple positions', () => {
      it('should handle multiple different stocks', () => {
        const portfolio = new Portfolio(20000);
        portfolio.addPosition('AAPL', 10, 100);
        portfolio.addPosition('GOOGL', 5, 2000);
        portfolio.addPosition('MSFT', 20, 300);
        
        expect(portfolio.getPositions().size).toBe(3);
        expect(portfolio.getPosition('AAPL')?.numberOfShares).toBe(10);
        expect(portfolio.getPosition('GOOGL')?.numberOfShares).toBe(5);
        expect(portfolio.getPosition('MSFT')?.numberOfShares).toBe(20);
      });
    });
  });

  describe('removePosition()', () => {
    describe('validation', () => {
      it('should reject negative quantity', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        const result = portfolio.removePosition('AAPL', -5, 150);
        expect(result).toBe(false);
      });

      it('should reject zero quantity', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        const result = portfolio.removePosition('AAPL', 0, 150);
        expect(result).toBe(false);
      });

      it('should reject negative price', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        const result = portfolio.removePosition('AAPL', 5, -150);
        expect(result).toBe(false);
      });

      it('should reject empty symbol', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.removePosition('', 5, 150);
        expect(result).toBe(false);
      });
    });

    describe('position existence checks', () => {
      it('should reject selling non-existent position', () => {
        const portfolio = new Portfolio(10000);
        const result = portfolio.removePosition('AAPL', 10, 150);
        expect(result).toBe(false);
        expect(portfolio.getCash()).toBe(10000);
      });

      it('should reject selling more shares than owned', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        const result = portfolio.removePosition('AAPL', 20, 150);
        expect(result).toBe(false);
        
        const position = portfolio.getPosition('AAPL');
        expect(position?.numberOfShares).toBe(10);
      });
    });

    describe('partial sell', () => {
      it('should reduce position correctly', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 20, 100);
        const result = portfolio.removePosition('AAPL', 5, 150);
        
        expect(result).toBe(true);
        const position = portfolio.getPosition('AAPL');
        expect(position).not.toBeNull();
        if (position === null) return;
        expect(position.numberOfShares).toBe(15);
      });

      it('should maintain average cost basis after sell', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 20, 100);
        portfolio.removePosition('AAPL', 5, 150);
        
        const position = portfolio.getPosition('AAPL');
        expect(position?.averagePricePerShare).toBe(100);
      });

      it('should increase cash by sale proceeds', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 20, 100); // 8000 cash remaining
        portfolio.removePosition('AAPL', 5, 150); // +750 cash
        expect(portfolio.getCash()).toBe(8750);
      });

      it('should record sell trade correctly', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 20, 100);
        portfolio.removePosition('AAPL', 5, 150);
        
        expect(portfolio.tradeHistory.length).toBe(2);
        const sellTrade = portfolio.tradeHistory[1];
        expect(sellTrade.symbol).toBe('AAPL');
        expect(sellTrade.numberOfShares).toBe(5);
        expect(sellTrade.pricePerShare).toBe(150);
        expect(sellTrade.tradeType).toBe('SELL');
      });
    });

    describe('complete sell', () => {
      it('should remove position when all shares sold', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        portfolio.removePosition('AAPL', 10, 150);
        
        expect(portfolio.getPosition('AAPL')).toBeNull();
        expect(portfolio.getPositions().size).toBe(0);
      });

      it('should increase cash correctly when selling all', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // 9000 remaining
        portfolio.removePosition('AAPL', 10, 150); // +1500 cash
        expect(portfolio.getCash()).toBe(10500);
      });

      it('should record trade even when position is removed', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100);
        portfolio.removePosition('AAPL', 10, 150);
        
        expect(portfolio.tradeHistory.length).toBe(2);
        const sellTrade = portfolio.tradeHistory[1];
        expect(sellTrade.tradeType).toBe('SELL');
        expect(sellTrade.numberOfShares).toBe(10);
      });
    });

    describe('profit and loss scenarios', () => {
      it('should handle profit scenario', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // Cost: 1000
        portfolio.removePosition('AAPL', 10, 150); // Revenue: 1500
        expect(portfolio.getCash()).toBe(10500); // Profit: 500
      });

      it('should handle loss scenario', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // Cost: 1000
        portfolio.removePosition('AAPL', 10, 80); // Revenue: 800
        expect(portfolio.getCash()).toBe(9800); // Loss: 200
      });

      it('should handle breakeven scenario', () => {
        const portfolio = new Portfolio(10000);
        portfolio.addPosition('AAPL', 10, 100); // Cost: 1000
        portfolio.removePosition('AAPL', 10, 100); // Revenue: 1000
        expect(portfolio.getCash()).toBe(10000); // No profit/loss
      });
    });
  });

  describe('trade history', () => {
    it('should record all trades in order', () => {
      const portfolio = new Portfolio(20000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.addPosition('GOOGL', 5, 1000);
      portfolio.removePosition('AAPL', 5, 150);
      
      expect(portfolio.tradeHistory.length).toBe(3);
      expect(portfolio.tradeHistory[0].symbol).toBe('AAPL');
      expect(portfolio.tradeHistory[1].symbol).toBe('GOOGL');
      expect(portfolio.tradeHistory[2].symbol).toBe('AAPL');
    });

    it('should maintain trade data integrity', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const trade = portfolio.tradeHistory[0];
      expect(trade.symbol.trim()).not.toBe('');
      expect(trade.numberOfShares).toBeGreaterThan(0);
      expect(trade.pricePerShare).toBeGreaterThan(0);
      expect(trade.tradeDate).toBeInstanceOf(Date);
      expect(['BUY', 'SELL']).toContain(trade.tradeType);
    });

    it('should not record failed transactions', () => {
      const portfolio = new Portfolio(500);
      portfolio.addPosition('AAPL', 10, 100); // Should fail
      portfolio.removePosition('TSLA', 5, 200); // Should fail
      
      expect(portfolio.tradeHistory.length).toBe(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle buy-sell-buy same stock', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // Buy at 100
      portfolio.removePosition('AAPL', 10, 150); // Sell all at 150
      portfolio.addPosition('AAPL', 5, 120); // Buy again at 120
      
      const position = portfolio.getPosition('AAPL');
      expect(position).not.toBeNull();
      if (position === null) return;
      expect(position.numberOfShares).toBe(5);
      expect(position.averagePricePerShare).toBe(120);
    });

    it('should handle multiple partial sells', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 100, 100);
      portfolio.removePosition('AAPL', 20, 110);
      portfolio.removePosition('AAPL', 30, 120);
      portfolio.removePosition('AAPL', 50, 130);
      
      expect(portfolio.getPosition('AAPL')).toBeNull();
      expect(portfolio.tradeHistory.length).toBe(4);
    });

    it('should handle alternating buys and sells', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // 10 shares at avg 100
      portfolio.addPosition('AAPL', 10, 120); // 20 shares at avg 110
      portfolio.removePosition('AAPL', 5, 150); // 15 shares at avg 110
      portfolio.addPosition('AAPL', 5, 130); // 20 shares at avg 115
      
      const position = portfolio.getPosition('AAPL');
      expect(position).not.toBeNull();
      if (position === null) return;
      expect(position.numberOfShares).toBe(20);
      expect(position.averagePricePerShare).toBe(115);
    });
  });

  describe('edge cases', () => {
    it('should handle very small quantities', () => {
      const portfolio = new Portfolio(10000);
      const result = portfolio.addPosition('AAPL', 1, 100);
      expect(result).toBe(true);
      expect(portfolio.getPosition('AAPL')?.numberOfShares).toBe(1);
    });

    it('should handle decimal prices', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 99.99);
      expect(portfolio.getCash()).toBeCloseTo(9000.10, 2);
    });

    it('should handle large quantities', () => {
      const portfolio = new Portfolio(1000000);
      portfolio.addPosition('AAPL', 10000, 50);
      expect(portfolio.getPosition('AAPL')?.numberOfShares).toBe(10000);
      expect(portfolio.getCash()).toBe(500000);
    });

    it('should handle position with symbol containing spaces when trimmed', () => {
      const portfolio = new Portfolio(10000);
      const result = portfolio.addPosition('AAPL  ', 10, 100);
      expect(result).toBe(true);
      expect(portfolio.getPosition('AAPL  ')?.symbol).toBe('AAPL  ');
    });
  });

  describe('getValue()', () => {
    it('should return only cash when no positions', () => {
      const portfolio = new Portfolio(10000);
      const currentPrices = new Map<string, number>();
      expect(portfolio.getValue(currentPrices)).toBe(10000);
    });

    it('should calculate total portfolio value with single position', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // Spent 1000, have 9000 cash
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 150); // Position now worth 1500
      
      expect(portfolio.getValue(currentPrices)).toBe(10500); // 9000 cash + 1500 position
    });

    it('should calculate total portfolio value with multiple positions', () => {
      const portfolio = new Portfolio(20000);
      portfolio.addPosition('AAPL', 10, 100); // 1000 spent
      portfolio.addPosition('GOOGL', 5, 1000); // 5000 spent
      portfolio.addPosition('MSFT', 20, 300); // 6000 spent
      // Remaining cash: 8000
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 150);  // 1500
      currentPrices.set('GOOGL', 1200); // 6000
      currentPrices.set('MSFT', 350);   // 7000
      
      expect(portfolio.getValue(currentPrices)).toBe(22500); // 8000 + 1500 + 6000 + 7000
    });

    it('should handle positions with profit', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 200);
      
      expect(portfolio.getValue(currentPrices)).toBe(11000); // 9000 cash + 2000 position
    });

    it('should handle positions with loss', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 50);
      
      expect(portfolio.getValue(currentPrices)).toBe(9500); // 9000 cash + 500 position
    });

    it('should handle missing price data gracefully', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.addPosition('GOOGL', 5, 1000);
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 150); // Only AAPL price available
      
      // Should either skip GOOGL or handle it appropriately
      // This test depends on your implementation choice
      const value = portfolio.getValue(currentPrices);
      expect(value).toBeGreaterThanOrEqual(4000); // At least cash remaining
    });

    it('should update value after trades', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const prices1 = new Map<string, number>();
      prices1.set('AAPL', 150);
      expect(portfolio.getValue(prices1)).toBe(10500);
      
      portfolio.removePosition('AAPL', 5, 150);
      
      const prices2 = new Map<string, number>();
      prices2.set('AAPL', 150);
      expect(portfolio.getValue(prices2)).toBe(10500); // 9750 cash + 750 position
    });

    it('should handle decimal current prices', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const currentPrices = new Map<string, number>();
      currentPrices.set('AAPL', 123.45);
      
      expect(portfolio.getValue(currentPrices)).toBeCloseTo(10234.50, 2);
    });
  });

  describe('getPositionProfitLoss()', () => {
    it('should return null for non-existent position', () => {
      const portfolio = new Portfolio(10000);
      expect(portfolio.getPositionProfitLoss('AAPL', 150)).toBeNull();
    });

    it('should calculate profit correctly', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // Cost: 1000
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 150);
      expect(profitLoss).toBe(500); // (10 * 150) - (10 * 100) = 500
    });

    it('should calculate loss correctly', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // Cost: 1000
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 80);
      expect(profitLoss).toBe(-200); // (10 * 80) - (10 * 100) = -200
    });

    it('should return zero for breakeven', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 100);
      expect(profitLoss).toBe(0);
    });

    it('should calculate profit/loss after averaging', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100); // avg: 100
      portfolio.addPosition('AAPL', 10, 120); // avg: 110
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 150);
      expect(profitLoss).toBe(800); // (20 * 150) - (20 * 110) = 800
    });

    it('should calculate profit/loss after partial sell', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 20, 100); // avg: 100
      portfolio.removePosition('AAPL', 10, 150); // Still 10 shares at avg 100
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 130);
      expect(profitLoss).toBe(300); // (10 * 130) - (10 * 100) = 300
    });

    it('should handle decimal prices', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 99.50);
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 105.75);
      expect(profitLoss).toBeCloseTo(62.50, 2);
    });

    it('should handle large positions', () => {
      const portfolio = new Portfolio(1000000);
      portfolio.addPosition('AAPL', 10000, 50);
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 75);
      expect(profitLoss).toBe(250000); // 25 profit per share * 10000 shares
    });

    it('should validate negative current price', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      // Depending on your implementation, this might return null or handle differently
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', -50);
      // This test assumes you validate currentPrice
      expect(profitLoss).toBeNull();
    });

    it('should validate zero current price', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      const profitLoss = portfolio.getPositionProfitLoss('AAPL', 0);
      // This test assumes you validate currentPrice
      expect(profitLoss).toBeNull();
    });
  });

  describe('reset()', () => {
    it('should clear all positions', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.addPosition('GOOGL', 5, 1000);
      
      portfolio.reset();
      expect(portfolio.getPositions().size).toBe(0);
    });

    it('should clear trade history', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.removePosition('AAPL', 5, 150);
      
      portfolio.reset();
      expect(portfolio.tradeHistory.length).toBe(0);
    });

    it('should reset cash to initial capital', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      portfolio.reset();
      // Note: This test assumes reset() sets cash back to initialCapital
      // If your implementation sets it to 0, adjust this test
      expect(portfolio.getCash()).toBe(10000);
    });

    it('should allow trading after reset', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.reset();
      
      const result = portfolio.addPosition('GOOGL', 5, 1000);
      expect(result).toBe(true);
      expect(portfolio.getPosition('GOOGL')).not.toBeNull();
    });

    it('should be idempotent', () => {
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      
      portfolio.reset();
      portfolio.reset();
      portfolio.reset();
      
      expect(portfolio.getPositions().size).toBe(0);
      expect(portfolio.tradeHistory.length).toBe(0);
      expect(portfolio.getCash()).toBe(10000);
    });
  });
});