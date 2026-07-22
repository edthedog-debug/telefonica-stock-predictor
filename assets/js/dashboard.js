/**
 * Dashboard - Main controller
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * UPDATED: Recalculates everything on date change
 */
class Dashboard {
    constructor() {
        this.dataService = new DataService();
        this.charts = new StockCharts();
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
        
        // Also update when changing dates
        document.getElementById('startDate').addEventListener('change', async () => {
            await this.loadAllData();
        });
        
        document.getElementById('endDate').addEventListener('change', async () => {
            await this.loadAllData();
        });
        
        document.getElementById('forecastDays').addEventListener('change', async () => {
            await this.loadAllData();
        });
        
        document.getElementById('simulations').addEventListener('change', async () => {
            await this.loadAllData();
        });
    }

    async loadAllData() {
        try {
            this.showLoading(true);
            
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const forecastDays = parseInt(document.getElementById('forecastDays').value);
            const simulations = parseInt(document.getElementById('simulations').value);
            
            // Get filtered historical data
            const historicalData = await this.dataService.fetchHistoricalData(startDate, endDate);
            
            // Run Monte Carlo with filtered data
            const monteCarloData = await this.dataService.runMonteCarlo(forecastDays, simulations);
            
            // Get signals based on filtered data
            const signalsData = await this.dataService.fetchSignals();
            
            // Update everything
            await this.updateDashboard(historicalData, monteCarloData, signalsData);
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error:', error);
            this.showLoading(false);
        }
    }

    async updateDashboard(historicalData, monteCarloData, signalsData) {
        // Update main chart
        this.charts.createMainChart(historicalData, monteCarloData.forecast);
        
        // Update gauge with new signal
        this.charts.createGaugeChart(signalsData.current_signal.bullish_percentage);
        
        // Update statistics with filtered data
        this.updateStatistics(monteCarloData, historicalData);
        
        // Update signals table
        this.updateSignalsTable(signalsData.historical_signals);
        
        // Update signal display
        this.updateSignalDisplay(signalsData.current_signal);
        
        // Update date range info
        this.updateDateInfo(historicalData);
    }

    updateStatistics(monteCarloData, historicalData) {
        const stats = monteCarloData.forecast.final_price_stats;
        const lastPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
        
        document.getElementById('currentPrice').textContent = lastPrice > 0 ? '€' + lastPrice.toFixed(4) : '-';
        document.getElementById('medianPrice').textContent = stats.median > 0 ? '€' + stats.median.toFixed(4) : '-';
        document.getElementById('meanPrice').textContent = stats.mean > 0 ? '€' + stats.mean.toFixed(4) : '-';
        document.getElementById('confidenceInterval').textContent = stats.p5 > 0 ? '€' + stats.p5.toFixed(4) + ' - €' + stats.p95.toFixed(4) : '-';
        document.getElementById('volatility').textContent = monteCarloData.volatility > 0 ? (monteCarloData.volatility * 100).toFixed(2) + '%' : '-';
        document.getElementById('expectedReturn').textContent = monteCarloData.mean_return !== 0 ? (monteCarloData.mean_return * 100).toFixed(4) + '%' : '-';
        
        // Distribution
        if (monteCarloData.forecast.simulation_paths.length > 0) {
            const finalPrices = monteCarloData.forecast.simulation_paths.map(p => p[p.length - 1]);
            const bearish = finalPrices.filter(p => p < lastPrice * 0.98).length;
            const neutral = finalPrices.filter(p => p >= lastPrice * 0.98 && p <= lastPrice * 1.02).length;
            const bullish = finalPrices.filter(p => p > lastPrice * 1.02).length;
            const total = finalPrices.length;
            
            document.getElementById('bearishProb').textContent = total > 0 ? ((bearish/total)*100).toFixed(1) + '%' : '-';
            document.getElementById('neutralProb').textContent = total > 0 ? ((neutral/total)*100).toFixed(1) + '%' : '-';
            document.getElementById('bullishProb').textContent = total > 0 ? ((bullish/total)*100).toFixed(1) + '%' : '-';
        }
    }

    updateSignalsTable(signals) {
        const tbody = document.getElementById('signalsBody');
        
        if (!signals || signals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No signals in selected date range</td></tr>';
            return;
        }
        
        tbody.innerHTML = signals.reverse().map(s => 
            '<tr>' +
                '<td>' + s.date + '</td>' +
                '<td><span class="signal-' + s.type + '">' + s.type + '</span></td>' +
                '<td>€' + s.price + '</td>' +
                '<td><small>' + s.reason + '</small></td>' +
                '<td>' + s.rsi + '</td>' +
                '<td>€' + s.sma20 + '</td>' +
            '</tr>'
        ).join('');
    }

    updateSignalDisplay(currentSignal) {
        const signalText = document.getElementById('signalText');
        const signalDetails = document.getElementById('signalDetails');
        
        signalText.textContent = currentSignal.signal.replace('_', ' ');
        
        let colorClass = 'text-warning';
        if (currentSignal.signal.includes('BUY')) colorClass = 'text-success';
        if (currentSignal.signal.includes('SELL')) colorClass = 'text-danger';
        
        signalText.className = 'display-6 fw-bold ' + colorClass;
        signalDetails.innerHTML = 
            'Bullish: <strong>' + currentSignal.bullish_percentage + '%</strong> | ' +
            'Bearish: <strong>' + currentSignal.bearish_percentage + '%</strong> | ' +
            'Confidence: <strong>' + currentSignal.confidence + '</strong>';
    }

    updateDateInfo(historicalData) {
        if (historicalData.length > 0) {
            const firstDate = historicalData[0].date;
            const lastDate = historicalData[historicalData.length - 1].date;
            console.log('📅 Showing data from ' + firstDate + ' to ' + lastDate + ' (' + historicalData.length + ' points)');
        }
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
    new Dashboard();
});