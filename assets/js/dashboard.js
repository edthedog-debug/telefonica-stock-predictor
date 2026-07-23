/**
 * Dashboard - Main Controller v2.0
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * Added: MACD chart, Backtesting display, Bollinger stats
 */
class Dashboard {
    constructor() {
        this.dataService = new DataService();
        this.charts = new StockCharts();
        this.updateTimeout = null;
        this.init();
    }

    async init() {
        this.setDefaultDates();
        this.bindEvents();
        await this.loadAllData();
    }

    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    bindEvents() {
        document.getElementById('updateBtn').addEventListener('click', async () => {
            await this.loadAllData();
        });
        
        ['startDate', 'endDate', 'forecastDays', 'simulations'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(() => this.loadAllData(), 300);
                });
            }
        });
    }

    async loadAllData() {
        try {
            this.showLoading(true);
            
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const forecastDays = parseInt(document.getElementById('forecastDays').value) || 30;
            const simulations = parseInt(document.getElementById('simulations').value) || 1000;
            
            // Fetch data
            const historicalData = await this.dataService.fetchHistoricalData(startDate, endDate);
            
            // Monte Carlo
            const monteCarloData = await this.dataService.runMonteCarlo(forecastDays, simulations);
            
            // Signals with MACD + Bollinger
            const signalsData = await this.dataService.fetchSignals();
            
            // Backtesting
            const backtestData = await this.dataService.runBacktest();
            
            // Update all visualizations
            this.updateDashboard(historicalData, monteCarloData, signalsData, backtestData);
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error:', error);
            this.showLoading(false);
        }
    }

    updateDashboard(historicalData, monteCarloData, signalsData, backtestData) {
        // Main price chart with Bollinger
        this.charts.createMainChart(historicalData, monteCarloData.forecast, signalsData.indicators);
        
        // MACD chart
        if (signalsData.indicators) {
            this.charts.createMACDChart(signalsData.indicators);
        }
        
        // Gauge
        this.charts.createGaugeChart(signalsData.current_signal.bullish_percentage);
        
        // Statistics
        this.updateStatistics(monteCarloData, historicalData, signalsData);
        
        // Signals table
        this.updateSignalsTable(signalsData.historical_signals);
        
        // Signal display
        this.updateSignalDisplay(signalsData.current_signal);
        
        // Backtesting
        if (backtestData) {
            this.updateBacktest(backtestData);
        }
    }

    updateStatistics(monteCarloData, historicalData, signalsData) {
        const stats = monteCarloData.forecast.final_price_stats;
        const lastPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
        
        document.getElementById('currentPrice').textContent = lastPrice ? '€' + lastPrice.toFixed(4) : '-';
        document.getElementById('medianPrice').textContent = stats.median ? '€' + stats.median.toFixed(4) : '-';
        document.getElementById('confidenceInterval').textContent = stats.p5 ? '€' + stats.p5.toFixed(4) + ' - €' + stats.p95.toFixed(4) : '-';
        document.getElementById('volatility').textContent = monteCarloData.volatility ? (monteCarloData.volatility * 100).toFixed(2) + '%' : '-';
        document.getElementById('expectedReturn').textContent = monteCarloData.mean_return ? (monteCarloData.mean_return * 100).toFixed(4) + '%' : '-';
        
        // Bollinger and MACD
        if (signalsData.indicators) {
            document.getElementById('bollUpper').textContent = signalsData.indicators.lastBollUpper !== '-' ? '€' + signalsData.indicators.lastBollUpper : '-';
            document.getElementById('bollLower').textContent = signalsData.indicators.lastBollLower !== '-' ? '€' + signalsData.indicators.lastBollLower : '-';
            document.getElementById('macdValue').textContent = signalsData.indicators.lastMACD !== '-' ? signalsData.indicators.lastMACD : '-';
        }
        
        // Distribution
        if (monteCarloData.forecast.simulation_paths.length > 0 && lastPrice > 0) {
            const finalPrices = monteCarloData.forecast.simulation_paths.map(p => p[p.length - 1]);
            const bearish = finalPrices.filter(p => p < lastPrice * 0.98).length;
            const neutral = finalPrices.filter(p => p >= lastPrice * 0.98 && p <= lastPrice * 1.02).length;
            const bullish = finalPrices.filter(p => p > lastPrice * 1.02).length;
            const total = finalPrices.length;
            
            document.getElementById('bearishProb').textContent = ((bearish/total)*100).toFixed(1) + '%';
            document.getElementById('neutralProb').textContent = ((neutral/total)*100).toFixed(1) + '%';
            document.getElementById('bullishProb').textContent = ((bullish/total)*100).toFixed(1) + '%';
        }
    }

    updateSignalsTable(signals) {
        const tbody = document.getElementById('signalsBody');
        if (!signals || signals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">⚠️ No signals in selected date range</td></tr>';
            return;
        }
        tbody.innerHTML = signals.reverse().map(s => 
            '<tr>' +
                '<td>' + s.date + '</td>' +
                '<td><span class="signal-' + s.type + '">' + s.type + '</span></td>' +
                '<td>€' + s.price + '</td>' +
                '<td><small>' + s.reason + '</small></td>' +
                '<td>' + s.rsi + '</td>' +
            '</tr>'
        ).join('');
    }

    updateSignalDisplay(currentSignal) {
        const signalText = document.getElementById('signalText');
        const signalDetails = document.getElementById('signalDetails');
        signalText.textContent = currentSignal.signal.replace(/_/g, ' ');
        
        let colorClass = 'text-warning';
        if (currentSignal.signal.includes('BUY')) colorClass = 'text-success';
        if (currentSignal.signal.includes('SELL')) colorClass = 'text-danger';
        signalText.className = 'display-6 fw-bold ' + colorClass;
        
        signalDetails.innerHTML = 
            '🟢 Bullish: <strong>' + currentSignal.bullish_percentage + '%</strong> | ' +
            '🔴 Bearish: <strong>' + currentSignal.bearish_percentage + '%</strong> | ' +
            '📊 Confidence: <strong>' + currentSignal.confidence + '</strong>';
    }

    updateBacktest(backtest) {
        document.getElementById('btFinalCapital').textContent = '€' + backtest.finalCapital;
        document.getElementById('btReturn').textContent = backtest.totalReturn + '%';
        document.getElementById('btReturn').className = 'fw-bold ' + (parseFloat(backtest.totalReturn) >= 0 ? 'text-success' : 'text-danger');
        document.getElementById('btWinRate').textContent = backtest.winRate + '%';
        
        const tbody = document.getElementById('btTradesBody');
        if (backtest.trades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No trades in selected period</td></tr>';
            return;
        }
        
        tbody.innerHTML = backtest.trades.reverse().map(t => 
            '<tr>' +
                '<td>' + t.entryDate + '</td>' +
                '<td>' + t.exitDate + (t.open ? ' <span class="badge bg-warning">OPEN</span>' : '') + '</td>' +
                '<td>€' + t.entryPrice.toFixed(4) + '</td>' +
                '<td>€' + t.exitPrice.toFixed(4) + '</td>' +
                '<td class="' + (parseFloat(t.profit) >= 0 ? 'text-success' : 'text-danger') + '">€' + t.profit + '</td>' +
                '<td class="' + (parseFloat(t.profitPct) >= 0 ? 'text-success' : 'text-danger') + '">' + t.profitPct + '%</td>' +
            '</tr>'
        ).join('');
    }

    showLoading(show) {
        const btn = document.getElementById('updateBtn');
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Running...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '🔄 Run Analysis';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Telefonica Stock Predictor v2.0');
    window.dashboard = new Dashboard();
});