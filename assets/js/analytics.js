/**
 * Risk Analytics & Quantitative Scoring Engine for Stock Predictor v3.0
 */
const RiskAnalytics = {
    // 1. Calculate Value at Risk (VaR 95%) using parametric approach
    calculateVaR(prices, zScore = 1.645, horizonDays = 30) {
        if (!prices || prices.length < 2) return 0;
        let returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        const dailyStdDev = Math.sqrt(variance);
        const horizonStdDev = dailyStdDev * Math.sqrt(horizonDays);
        const varPct = (zScore * horizonStdDev - mean * horizonDays) * 100;
        return Math.max(0, varPct);
    },

    // 2. Calculate Maximum Drawdown from historical price series
    calculateMaxDrawdown(prices) {
        if (!prices || prices.length < 2) return 0;
        let maxPeak = prices[0];
        let maxDd = 0;
        for (let i = 0; i < prices.length; i++) {
            if (prices[i] > maxPeak) {
                maxPeak = prices[i];
            }
            const dd = (maxPeak - prices[i]) / maxPeak;
            if (dd > maxDd) {
                maxDd = dd;
            }
        }
        return maxDd * 100;
    },

    // 3. Calculate Sharpe Ratio based on backtested trades
    calculateSharpeRatio(trades, riskFreeRate = 0.02) {
        if (!trades || trades.length === 0) return 0;
        let returns = trades.map(t => t.profitPct / 100);
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const annualizedReturn = meanReturn * 12; // Assuming ~12 trades/year scaling
        const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length > 1 ? returns.length - 1 : 1);
        const stdDev = Math.sqrt(variance);
        if (stdDev === 0) return 0;
        return (annualizedReturn - riskFreeRate) / stdDev;
    },

    // 4. Calculate Composite Signal Score (0 to 100 scale)
    getSignalScore(currentPrice, sma20, rsi, macdLine, signalLine, mcTrendPct) {
        let score = 50; // Neutral baseline
        
        // Price vs SMA20 trend component (+/- 20 pts)
        if (currentPrice > sma20) score += 20;
        else score -= 20;

        // Monte Carlo prediction component (+/- 20 pts)
        if (mcTrendPct > 0) score += Math.min(20, mcTrendPct * 2);
        else score -= Math.min(20, Math.abs(mcTrendPct) * 2);

        // MACD momentum component (+/- 10 pts)
        if (macdLine >= signalLine) score += 10;
        else score -= 10;

        return Math.max(0, Math.min(100, Math.round(score)));
    }
};

export default RiskAnalytics;
