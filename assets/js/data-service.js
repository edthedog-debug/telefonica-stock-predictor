/**
 * DataService - Monte Carlo Engine + Signals
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * FIXED: Everything responds to date range filter
 */
class DataService {
    constructor() {
        this.cache = {};
    }

    async fetchHistoricalData(startDate, endDate) {
        try {
            const response = await fetch('data/sample-data.json');
            const data = await response.json();
            const allData = data.historical_prices;
            
            // FILTER by date range
            let filteredData = allData;
            if (startDate) {
                filteredData = filteredData.filter(d => d.date >= startDate);
            }
            if (endDate) {
                filteredData = filteredData.filter(d => d.date <= endDate);
            }
            
            // Cache data
            this.cache.allData = allData;
            this.cache.filteredData = filteredData;
            this.cache.startDate = startDate;
            this.cache.endDate = endDate;
            
            console.log('📅 Filtered data: ' + filteredData.length + ' records (from ' + allData.length + ' total)');
            console.log('📅 Range: ' + (filteredData.length > 0 ? filteredData[0].date : 'N/A') + ' to ' + (filteredData.length > 0 ? filteredData[filteredData.length - 1].date : 'N/A'));
            
            return filteredData;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    async runMonteCarlo(days = 30, simulations = 1000) {
        const prices = this.cache.filteredData 
            ? this.cache.filteredData.map(d => d.close) 
            : [3.95];
        
        if (prices.length < 5) {
            console.warn('⚠️ Not enough data for Monte Carlo');
            return {
                last_price: prices.length > 0 ? prices[prices.length - 1] : 0,
                mean_return: 0,
                volatility: 0,
                forecast: {
                    days: days,
                    simulations: 0,
                    final_price_stats: { p5: 0, p25: 0, median: 0, p75: 0, p95: 0, mean: 0 },
                    confidence_intervals: [],
                    simulation_paths: []
                }
            };
        }
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const lastPrice = prices[prices.length - 1];
        
        console.log('🎲 Monte Carlo - μ: ' + (meanReturn * 100).toFixed(4) + '%, σ: ' + (stdDev * 100).toFixed(2) + '%');
        console.log('🎲 Using ' + prices.length + ' price points, Last: €' + lastPrice.toFixed(4));
        
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
                day: day,
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
                days: days,
                simulations: displaySims,
                final_price_stats: stats,
                confidence_intervals: confidenceIntervals,
                simulation_paths: paths
            }
        };
    }

    async fetchSignals() {
        const data = this.cache.filteredData || [];
        
        console.log('📋 Generating signals from ' + data.length + ' records');
        
        if (data.length < 20) {
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
        
        for (let i = 1; i < prices.length; i++) {
            if (i < 50) continue;
            
            let signal = null;
            
            // Golden Cross / Death Cross
            if (sma20[i] && sma50[i] && sma20[i-1] && sma50[i-1]) {
                if (sma20[i] > sma50[i] && sma20[i-1] <= sma50[i-1]) {
                    signal = {
                        date: dates[i],
                        type: 'ENTRY',
                        price: prices[i].toFixed(4),
                        reason: 'Golden Cross',
                        rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                        sma20: sma20[i].toFixed(4)
                    };
                } else if (sma20[i] < sma50[i] && sma20[i-1] >= sma50[i-1]) {
                    signal = {
                        date: dates[i],
                        type: 'EXIT',
                        price: prices[i].toFixed(4),
                        reason: 'Death Cross',
                        rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                        sma20: sma20[i].toFixed(4)
                    };
                }
            }
            
            // RSI signals
            if (rsi[i] && rsi[i-1] && !signal) {
                if (rsi[i] < 30 && rsi[i-1] >= 30) {
                    signal = {
                        date: dates[i],
                        type: 'ENTRY',
                        price: prices[i].toFixed(4),
                        reason: 'RSI Oversold',
                        rsi: rsi[i].toFixed(2),
                        sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                    };
                } else if (rsi[i] > 70 && rsi[i-1] <= 70) {
                    signal = {
                        date: dates[i],
                        type: 'EXIT',
                        price: prices[i].toFixed(4),
                        reason: 'RSI Overbought',
                        rsi: rsi[i].toFixed(2),
                        sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                    };
                }
            }
            
            if (signal) historicalSignals.push(signal);
        }
        
        // Current signal calculation
        const lastIdx = prices.length - 1;
        const lastPrice = prices[lastIdx];
        const lastSMA20 = sma20[lastIdx];
        const lastSMA50 = sma50[lastIdx];
        const lastRSI = rsi[lastIdx];
        
        let bullishScore = 0;
        let bearishScore = 0;
        
        if (lastSMA20 && lastSMA50) {
            lastSMA20 > lastSMA50 ? bullishScore += 2 : bearishScore += 2;
        }
        if (lastRSI) {
            if (lastRSI < 30) bullishScore += 1;
            else if (lastRSI > 70) bearishScore += 1;
        }
        if (lastPrice && lastSMA20) {
            lastPrice > lastSMA20 ? bullishScore += 1 : bearishScore += 1;
        }
        // Recent trend
        if (prices.length >= 10) {
            const recent = prices.slice(-10);
            recent[recent.length - 1] > recent[0] ? bullishScore += 1 : bearishScore += 1;
        }
        
        const totalScore = bullishScore + bearishScore || 1;
        const bullishPercentage = Math.round((bullishScore / totalScore) * 100);
        
        let signal = 'HOLD';
        if (bullishPercentage >= 70) signal = 'STRONG_BUY';
        else if (bullishPercentage >= 60) signal = 'BUY';
        else if (bullishPercentage <= 30) signal = 'STRONG_SELL';
        else if (bullishPercentage <= 40) signal = 'SELL';
        
        console.log('📊 Signal: ' + signal + ' (' + bullishPercentage + '% bullish)');
        
        return {
            historical_signals: historicalSignals.slice(-20),
            current_signal: {
                signal: signal,
                bullish_percentage: bullishPercentage,
                bearish_percentage: 100 - bullishPercentage,
                confidence: totalScore >= 4 ? 'HIGH' : 'MODERATE'
            },
            trend_strength: prices.length >= 20 
                ? ((lastPrice - prices[prices.length - 20]) / prices[prices.length - 20] * 100).toFixed(2)
                : 0
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
        if (prices.length < period + 1) {
            return prices.map(() => null);
        }
        
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