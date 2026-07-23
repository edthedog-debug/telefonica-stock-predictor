/**
 * DataService - Monte Carlo Engine + Signals + MACD + Bollinger
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * v2.0 - Added MACD, Bollinger Bands, Backtesting
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
            
            let filteredData = allData;
            if (startDate) filteredData = filteredData.filter(d => d.date >= startDate);
            if (endDate) filteredData = filteredData.filter(d => d.date <= endDate);
            
            this.cache.allData = allData;
            this.cache.filteredData = filteredData;
            this.cache.startDate = startDate;
            this.cache.endDate = endDate;
            
            console.log('📅 Filtered: ' + filteredData.length + ' records');
            return filteredData;
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    async runMonteCarlo(days = 30, simulations = 1000) {
        const prices = this.cache.filteredData ? this.cache.filteredData.map(d => d.close) : [3.95];
        
        if (prices.length < 5) {
            return {
                last_price: prices.length > 0 ? prices[prices.length - 1] : 0,
                mean_return: 0, volatility: 0,
                forecast: { days, simulations: 0,
                    final_price_stats: { p5: 0, p25: 0, median: 0, p75: 0, p95: 0, mean: 0 },
                    confidence_intervals: [], simulation_paths: [] }
            };
        }
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) returns.push(Math.log(prices[i] / prices[i - 1]));
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const lastPrice = prices[prices.length - 1];
        
        const finalPrices = [], paths = [];
        const displaySims = Math.min(simulations, 100);
        
        for (let sim = 0; sim < displaySims; sim++) {
            let price = lastPrice;
            const path = [price];
            for (let day = 0; day < days; day++) {
                price *= Math.exp(meanReturn + stdDev * this.boxMullerRandom());
                path.push(price);
            }
            paths.push(path);
            finalPrices.push(path[path.length - 1]);
        }
        
        finalPrices.sort((a, b) => a - b);
        const n = finalPrices.length;
        
        const stats = {
            p5: finalPrices[Math.floor(0.05 * n)], p25: finalPrices[Math.floor(0.25 * n)],
            median: finalPrices[Math.floor(0.5 * n)], p75: finalPrices[Math.floor(0.75 * n)],
            p95: finalPrices[Math.floor(0.95 * n)], mean: finalPrices.reduce((a, b) => a + b, 0) / n
        };
        
        const confidenceIntervals = [];
        for (let day = 0; day <= days; day++) {
            const dayPrices = paths.map(p => p[day]).sort((a, b) => a - b);
            confidenceIntervals.push({
                day, lower_bound: dayPrices[Math.floor(0.025 * dayPrices.length)],
                upper_bound: dayPrices[Math.floor(0.975 * dayPrices.length)],
                median: dayPrices[Math.floor(0.5 * dayPrices.length)]
            });
        }
        
        return { last_price: lastPrice, mean_return: meanReturn, volatility: stdDev,
            forecast: { days, simulations: displaySims, final_price_stats: stats,
                confidence_intervals: confidenceIntervals, simulation_paths: paths } };
    }

    async fetchSignals() {
        const data = this.cache.filteredData || [];
        if (data.length < 50) {
            return { historical_signals: [], current_signal: { signal: 'HOLD', bullish_percentage: 50, bearish_percentage: 50, confidence: 'LOW' }, trend_strength: 0, indicators: {} };
        }
        return this.generateSignals(data);
    }

    generateSignals(data) {
        const prices = data.map(d => d.close);
        const dates = data.map(d => d.date);
        const sma20 = this.calculateSMA(prices, 20);
        const sma50 = this.calculateSMA(prices, 50);
        const rsi = this.calculateRSI(prices, 14);
        const macd = this.calculateMACD(prices);
        const bollinger = this.calculateBollinger(prices, 20, 2);
        
        const historicalSignals = [];
        
        for (let i = 50; i < prices.length; i++) {
            let signal = null;
            
            // Golden/Death Cross
            if (sma20[i] && sma50[i] && sma20[i-1] && sma50[i-1]) {
                if (sma20[i] > sma50[i] && sma20[i-1] <= sma50[i-1]) {
                    signal = { date: dates[i], type: 'ENTRY', price: prices[i].toFixed(4), reason: 'Golden Cross', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i].toFixed(4) };
                } else if (sma20[i] < sma50[i] && sma20[i-1] >= sma50[i-1]) {
                    signal = { date: dates[i], type: 'EXIT', price: prices[i].toFixed(4), reason: 'Death Cross', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i].toFixed(4) };
                }
            }
            
            // RSI
            if (rsi[i] && rsi[i-1] && !signal) {
                if (rsi[i] < 30 && rsi[i-1] >= 30) {
                    signal = { date: dates[i], type: 'ENTRY', price: prices[i].toFixed(4), reason: 'RSI Oversold', rsi: rsi[i].toFixed(2), sma20: sma20[i]?.toFixed(4) || '-' };
                } else if (rsi[i] > 70 && rsi[i-1] <= 70) {
                    signal = { date: dates[i], type: 'EXIT', price: prices[i].toFixed(4), reason: 'RSI Overbought', rsi: rsi[i].toFixed(2), sma20: sma20[i]?.toFixed(4) || '-' };
                }
            }
            
            // MACD
            if (macd.macdLine[i] && macd.signalLine[i] && macd.macdLine[i-1] && macd.signalLine[i-1] && !signal) {
                if (macd.macdLine[i] > macd.signalLine[i] && macd.macdLine[i-1] <= macd.signalLine[i-1]) {
                    signal = { date: dates[i], type: 'ENTRY', price: prices[i].toFixed(4), reason: 'MACD Bullish Cross', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i]?.toFixed(4) || '-' };
                } else if (macd.macdLine[i] < macd.signalLine[i] && macd.macdLine[i-1] >= macd.signalLine[i-1]) {
                    signal = { date: dates[i], type: 'EXIT', price: prices[i].toFixed(4), reason: 'MACD Bearish Cross', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i]?.toFixed(4) || '-' };
                }
            }
            
            // Bollinger
            if (bollinger.upper[i] && bollinger.lower[i] && !signal) {
                if (prices[i] < bollinger.lower[i]) {
                    signal = { date: dates[i], type: 'ENTRY', price: prices[i].toFixed(4), reason: 'Bollinger Lower Band', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i]?.toFixed(4) || '-' };
                } else if (prices[i] > bollinger.upper[i]) {
                    signal = { date: dates[i], type: 'EXIT', price: prices[i].toFixed(4), reason: 'Bollinger Upper Band', rsi: rsi[i]?.toFixed(2) || '-', sma20: sma20[i]?.toFixed(4) || '-' };
                }
            }
            
            if (signal) historicalSignals.push(signal);
        }
        
        // Current signal
        const last = prices.length - 1;
        let bull = 0, bear = 0;
        if (sma20[last] && sma50[last]) sma20[last] > sma50[last] ? bull += 2 : bear += 2;
        if (rsi[last]) { if (rsi[last] < 30) bull++; else if (rsi[last] > 70) bear++; }
        if (prices[last] && sma20[last]) prices[last] > sma20[last] ? bull++ : bear++;
        if (macd.macdLine[last] && macd.signalLine[last]) macd.macdLine[last] > macd.signalLine[last] ? bull++ : bear++;
        if (bollinger.upper[last]) {
            if (prices[last] < bollinger.lower[last]) bull++;
            else if (prices[last] > bollinger.upper[last]) bear++;
        }
        
        const total = bull + bear || 1;
        const bullPct = Math.round((bull / total) * 100);
        
        let signal = 'HOLD';
        if (bullPct >= 70) signal = 'STRONG_BUY';
        else if (bullPct >= 60) signal = 'BUY';
        else if (bullPct <= 30) signal = 'STRONG_SELL';
        else if (bullPct <= 40) signal = 'SELL';
        
        return {
            historical_signals: historicalSignals.slice(-30),
            current_signal: { signal, bullish_percentage: bullPct, bearish_percentage: 100 - bullPct, confidence: total >= 5 ? 'HIGH' : total >= 3 ? 'MODERATE' : 'LOW' },
            trend_strength: prices.length >= 20 ? ((prices[last] - prices[prices.length - 20]) / prices[prices.length - 20] * 100).toFixed(2) : 0,
            indicators: {
                sma20: sma20, sma50: sma50, rsi: rsi,
                macd: macd, bollinger: bollinger,
                lastMACD: macd.macdLine[last]?.toFixed(6) || '-',
                lastBollUpper: bollinger.upper[last]?.toFixed(4) || '-',
                lastBollLower: bollinger.lower[last]?.toFixed(4) || '-'
            }
        };
    }

    runBacktest() {
        const data = this.cache.filteredData || [];
        if (data.length < 50) return null;
        
        const signals = this.generateSignals(data);
        const prices = data.map(d => d.close);
        const dates = data.map(d => d.date);
        
        let capital = 10000;
        let shares = 0;
        let trades = [];
        let inPosition = false;
        let entryPrice = 0;
        let entryDate = '';
        
        const allSignals = signals.historical_signals;
        
        for (let i = 0; i < allSignals.length; i++) {
            const sig = allSignals[i];
            const price = parseFloat(sig.price);
            
            if (sig.type === 'ENTRY' && !inPosition) {
                shares = Math.floor(capital / price);
                capital -= shares * price;
                entryPrice = price;
                entryDate = sig.date;
                inPosition = true;
            } else if (sig.type === 'EXIT' && inPosition) {
                capital += shares * price;
                const profit = (price - entryPrice) * shares;
                const profitPct = ((price - entryPrice) / entryPrice * 100).toFixed(2);
                trades.push({ entryDate, entryPrice, exitDate: sig.date, exitPrice: price, shares, profit: profit.toFixed(2), profitPct });
                shares = 0;
                inPosition = false;
            }
        }
        
        // Close open position at last price
        if (inPosition) {
            const lastPrice = prices[prices.length - 1];
            capital += shares * lastPrice;
            const profit = (lastPrice - entryPrice) * shares;
            const profitPct = ((lastPrice - entryPrice) / entryPrice * 100).toFixed(2);
            trades.push({ entryDate, entryPrice, exitDate: dates[dates.length - 1], exitPrice: lastPrice, shares, profit: profit.toFixed(2), profitPct, open: true });
        }
        
        const totalReturn = ((capital - 10000) / 10000 * 100).toFixed(2);
        const winTrades = trades.filter(t => parseFloat(t.profit) > 0).length;
        
        return {
            initialCapital: 10000,
            finalCapital: capital.toFixed(2),
            totalReturn: totalReturn,
            totalTrades: trades.length,
            winningTrades: winTrades,
            winRate: trades.length > 0 ? ((winTrades / trades.length) * 100).toFixed(1) : 0,
            trades: trades.slice(-10)
        };
    }

    calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.calculateEMA(prices, fast);
        const emaSlow = this.calculateEMA(prices, slow);
        const macdLine = [];
        const signalLine = [];
        const histogram = [];
        
        for (let i = 0; i < prices.length; i++) {
            if (emaFast[i] !== null && emaSlow[i] !== null) {
                macdLine.push(emaFast[i] - emaSlow[i]);
            } else {
                macdLine.push(null);
            }
        }
        
        const validMACD = macdLine.filter(v => v !== null);
        const signalEMA = this.calculateEMA(validMACD, signal);
        
        let sigIdx = 0;
        for (let i = 0; i < macdLine.length; i++) {
            if (macdLine[i] !== null && sigIdx < signalEMA.length) {
                signalLine.push(signalEMA[sigIdx]);
                histogram.push(macdLine[i] - signalEMA[sigIdx]);
                sigIdx++;
            } else {
                signalLine.push(null);
                histogram.push(null);
            }
        }
        
        return { macdLine, signalLine, histogram };
    }

    calculateBollinger(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        const upper = [], lower = [];
        
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1 || sma[i] === null) {
                upper.push(null); lower.push(null);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) sum += Math.pow(prices[j] - sma[i], 2);
                const std = Math.sqrt(sum / period);
                upper.push(sma[i] + stdDev * std);
                lower.push(sma[i] - stdDev * std);
            }
        }
        return { upper, lower, middle: sma };
    }

    calculateEMA(prices, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        let firstValid = -1;
        
        for (let i = 0; i < prices.length; i++) {
            if (prices[i] === null || prices[i] === undefined) { ema.push(null); continue; }
            if (firstValid === -1) { firstValid = i; ema.push(prices[i]); continue; }
            ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
        }
        return ema;
    }

    calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) { sma.push(null); }
            else { let sum = 0; for (let j = i - period + 1; j <= i; j++) sum += prices[j]; sma.push(sum / period); }
        }
        return sma;
    }

    calculateRSI(prices, period) {
        const rsi = [];
        if (prices.length < period + 1) return prices.map(() => null);
        const gains = [], losses = [];
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            gains.push(Math.max(change, 0)); losses.push(Math.max(-change, 0));
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