/**
 * DataService - Monte Carlo Engine for Telefonica Stock Predictor
 * GitHub: edthedog-debug/telefonica-stock-predictor
 */
class DataService {
    constructor() {
        this.cache = {};
    }

    async fetchHistoricalData(startDate, endDate) {
        try {
            const response = await fetch('data/sample-data.json');
            const data = await response.json();
            this.cache.historicalData = data.historical_prices;
            return data.historical_prices;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    async runMonteCarlo(days = 30, simulations = 1000) {
        const prices = this.cache.historicalData 
            ? this.cache.historicalData.map(d => d.close) 
            : [3.95];
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const lastPrice = prices[prices.length - 1];
        
        const finalPrices = [];
        const paths = [];
        const displaySims = Math.min(simulations, 100);
        
        for (let sim = 0; sim < displaySims; sim++) {
            let price = lastPrice;
            const path = [price];
            
            for (let day = 0; day < days; day++) {
                const random = this.boxMullerRandom();
                price *= Math.exp(meanReturn + stdDev * random);
                path.push(price);
            }
            
            paths.push(path);
            finalPrices.push(path[path.length - 1]);
        }
        
        finalPrices.sort((a, b) => a - b);
        const n = finalPrices.length;
        
        const stats = {
            p5: finalPrices[Math.floor(0.05 * n)],
            p25: finalPrices[Math.floor(0.25 * n)],
            median: finalPrices[Math.floor(0.5 * n)],
            p75: finalPrices[Math.floor(0.75 * n)],
            p95: finalPrices[Math.floor(0.95 * n)],
            mean: finalPrices.reduce((a, b) => a + b, 0) / n
        };
        
        const confidenceIntervals = [];
        for (let day = 0; day <= days; day++) {
            const dayPrices = paths.map(p => p[day]).sort((a, b) => a - b);
            confidenceIntervals.push({
                day,
                lower_bound: dayPrices[Math.floor(0.025 * dayPrices.length)],
                upper_bound: dayPrices[Math.floor(0.975 * dayPrices.length)],
                median: dayPrices[Math.floor(0.5 * dayPrices.length)]
            });
        }
        
        return {
            last_price: lastPrice,
            mean_return: meanReturn,
            volatility: stdDev,
            forecast: {
                days,
                simulations: displaySims,
                final_price_stats: stats,
                confidence_intervals: confidenceIntervals,
                simulation_paths: paths
            }
        };
    }

    async fetchSignals() {
        const data = this.cache.historicalData;
        if (!data || data.length < 50) {
            return {
                historical_signals: [],
                current_signal: {
                    signal: 'HOLD',
                    bullish_percentage: 50,
                    bearish_percentage: 50,
                    confidence: 'LOW'
                },
                trend_strength: 0
            };
        }
        
        return this.generateSignals(data);
    }

    generateSignals(data) {
        const prices = data.map(d => d.close);
        const dates = data.map(d => d.date);
        const sma20 = this.calculateSMA(prices, 20);
        const sma50 = this.calculateSMA(prices, 50);
        const rsi = this.calculateRSI(prices, 14);
        
        const historicalSignals = [];
        
        for (let i = 50; i < prices.length; i++) {
            let signal = null;
            
            if (sma20[i] > sma50[i] && sma20[i-1] <= sma50[i-1]) {
                signal = {
                    date: dates[i],
                    type: 'ENTRY',
                    price: prices[i].toFixed(4),
                    reason: 'Golden Cross',
                    rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                    sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                };
            } else if (sma20[i] < sma50[i] && sma20[i-1] >= sma50[i-1]) {
                signal = {
                    date: dates[i],
                    type: 'EXIT',
                    price: prices[i].toFixed(4),
                    reason: 'Death Cross',
                    rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                    sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                };
            }
            
            if (signal) historicalSignals.push(signal);
        }
        
        const lastPrice = prices[prices.length - 1];
        const lastSMA20 = sma20[sma20.length - 1];
        const lastSMA50 = sma50[sma50.length - 1];
        const lastRSI = rsi[rsi.length - 1];
        
        let bullishScore = 0;
        let bearishScore = 0;
        
        if (lastSMA20 > lastSMA50) bullishScore += 2; else bearishScore += 2;
        if (lastRSI < 30) bullishScore += 1;
        else if (lastRSI > 70) bearishScore += 1;
        if (lastPrice > lastSMA20) bullishScore += 1; else bearishScore += 1;
        
        const totalScore = bullishScore + bearishScore;
        const bullishPercentage = Math.round((bullishScore / totalScore) * 100);
        
        let signal = 'HOLD';
        if (bullishPercentage >= 70) signal = 'STRONG_BUY';
        else if (bullishPercentage >= 60) signal = 'BUY';
        else if (bullishPercentage <= 30) signal = 'STRONG_SELL';
        else if (bullishPercentage <= 40) signal = 'SELL';
        
        return {
            historical_signals: historicalSignals.slice(-20),
            current_signal: {
                signal,
                bullish_percentage: bullishPercentage,
                bearish_percentage: 100 - bullishPercentage,
                confidence: 'MODERATE'
            },
            trend_strength: ((lastPrice - prices[prices.length - 20]) / prices[prices.length - 20] * 100).toFixed(2)
        };
    }

    calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) sum += prices[j];
                sma.push(sum / period);
            }
        }
        return sma;
    }

    calculateRSI(prices, period) {
        const rsi = [];
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            gains.push(Math.max(change, 0));
            losses.push(Math.max(-change, 0));
        }
        
        for (let i = 0; i < period; i++) rsi.push(null);
        
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        let rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
        rsi.push(100 - (100 / (1 + rs)));
        
        for (let i = period; i < gains.length; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
            rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
            rsi.push(100 - (100 / (1 + rs)));
        }
        
        return rsi;
    }

    boxMullerRandom() {
        let u1 = 0, u2 = 0;
        while (u1 === 0) u1 = Math.random();
        while (u2 === 0) u2 = Math.random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }
}