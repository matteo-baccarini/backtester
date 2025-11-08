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
      const portfolio = new Portfolio(10000);
      portfolio.addPosition('AAPL', 10, 100);
      portfolio.addPosition('GOOGL', 5, 2000);
      portfolio.removePosition('AAPL', 5, 150);
      
      expect(portfolio.tradeHistory.length).toBe(2);
      expect(portfolio.tradeHistory[0].symbol).toBe('AAPL');
      expect(portfolio.tradeHistory[1].symbol).toBe('AAPL');
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
});