/**
 * Quantitative Risk Analytics & Scoring Module
 * Extends the existing dashboard with risk management metrics without modifying core files.
 */

class RiskAnalytics {
    /**
     * Calculates the Value at Risk (VaR) using the Variance-Covariance Method.
     * 
     * @param {Array<number>} prices - Historical closing prices
     * @param {number} confidenceLevel - Z-score (1.645 for 95%)
     * @param {number} days - Time horizon in days
     * @returns {number} VaR as a percentage
     */
    static calculateVaR(prices, confidenceLevel = 1.645, days = 30) {
        if (!prices || prices.length < 2) return 0;
        
        let returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        const expectedReturn = meanReturn * days;
        const riskVolatility = stdDev * Math.sqrt(days);
        
        const varPercentage = expectedReturn - (confidenceLevel * riskVolatility);
        return varPercentage * 100; 
    }

    /**
     * Calculates the Sharpe Ratio for the strategy.
     * 
     * @param {Array<Object>} trades - Array of trade objects containing 'profitPct'
     * @param {number} riskFreeRate - Annual risk-free rate
     * @returns {number} Sharpe Ratio
     */
    static calculateSharpeRatio(trades, riskFreeRate = 0.03) {
        if (!trades || trades.length === 0) return 0;
        
        const tradeReturns = trades.map(t => t.profitPct);
        const averageReturn = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
        
        const variance = tradeReturns.reduce((a, b) => a + Math.pow(b - averageReturn, 2), 0) / tradeReturns.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev === 0) return 0;
        
        const adjustedRiskFree = riskFreeRate / 252; 
        return (averageReturn - adjustedRiskFree) / stdDev;
    }

    /**
     * Calculates the Maximum Drawdown (Max DD).
     * 
     * @param {Array<number>} prices - Historical prices
     * @returns {number} Maximum Drawdown as a positive percentage
     */
    static calculateMaxDrawdown(prices) {
        if (!prices || prices.length === 0) return 0;
        
        let maxPrice = prices[0];
        let maxDrawdown = 0;
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > maxPrice) {
                maxPrice = prices[i];
            }
            const drawdown = (maxPrice - prices[i]) / maxPrice;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        return maxDrawdown * 100; 
    }

    /**
     * Calculates a composite signal score from 0 to 100 based on multiple indicators.
     * 
     * @param {number} currentPrice - Latest closing price
     * @param {number} sma20 - Current SMA 20
     * @param {number} rsi - Current RSI
     * @param {number} macdLine - Current MACD Line
     * @param {number} signalLine - Current MACD Signal Line
     * @param {number} drift - Monte Carlo drift
     * @returns {number} Score (0-100)
     */
    static getSignalScore(currentPrice, sma20, rsi, macdLine, signalLine, drift) {
        let score = 0;
        
        if (currentPrice > sma20) score += 25;
        if (rsi >= 30 && rsi <= 65) score += 25;
        if (macdLine > signalLine) score += 25;
        if (drift > 0) score += 25;
        
        return score;
    }
}

export default RiskAnalytics;
