/**
 * Dashboard - Main Controller
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * FIXED: Everything updates on date range change
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
        // Run Analysis button
        document.getElementById('updateBtn').addEventListener('click', async () => {
            console.log('🔄 Run Analysis clicked');
            await this.loadAllData();
        });
        
        // Auto-update on any filter change
        const filterElements = ['startDate', 'endDate', 'forecastDays', 'simulations'];
        
        filterElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    console.log('🔔 Filter changed: ' + id + ' = ' + el.value);
                    // Debounce: wait 300ms before updating
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(() => this.loadAllData(), 300);
                });
            }
        });
        
        console.log('✅ Events bound - Dashboard ready');
    }

    async loadAllData() {
        try {
            this.showLoading(true);
            
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const forecastDays = parseInt(document.getElementById('forecastDays').value) || 30;
            const simulations = parseInt(document.getElementById('simulations').value) || 1000;
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔄 LOADING DATA');
            console.log('📅 Dates: ' + startDate + ' to ' + endDate);
            console.log('🔮 Forecast: ' + forecastDays + ' days');
            console.log('🎲 Simulations: ' + simulations);
            
            // Step 1: Fetch filtered historical data
            const historicalData = await this.dataService.fetchHistoricalData(startDate, endDate);
            console.log('✅ Step 1: ' + historicalData.length + ' historical records loaded');
            
            // Step 2: Run Monte Carlo with filtered data
            const monteCarloData = await this.dataService.runMonteCarlo(forecastDays, simulations);
            console.log('✅ Step 2: Monte Carlo complete');
            
            // Step 3: Generate signals from filtered data
            const signalsData = await this.dataService.fetchSignals();
            console.log('✅ Step 3: ' + signalsData.historical_signals.length + ' signals generated');
            
            // Step 4: Update ALL visualizations
            this.updateDashboard(historicalData, monteCarloData, signalsData);
            console.log('✅ Step 4: Dashboard updated');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showLoading(false);
        }
    }

    updateDashboard(historicalData, monteCarloData, signalsData) {
        // Update main price chart
        if (historicalData.length > 0 && monteCarloData.forecast.confidence_intervals.length > 0) {
            this.charts.createMainChart(historicalData, monteCarloData.forecast);
        }
        
        // Update trend gauge
        this.charts.createGaugeChart(signalsData.current_signal.bullish_percentage);
        
        // Update statistics panel
        this.updateStatistics(monteCarloData, historicalData);
        
        // Update signals table
        this.updateSignalsTable(signalsData.historical_signals);
        
        // Update current signal text
        this.updateSignalDisplay(signalsData.current_signal);
        
        // Show data range info
        this.showRangeInfo(historicalData);
    }

    updateStatistics(monteCarloData, historicalData) {
        const stats = monteCarloData.forecast.final_price_stats;
        const lastPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
        const firstPrice = historicalData.length > 0 ? historicalData[0].close : 0;
        
        // Current price
        document.getElementById('currentPrice').textContent = lastPrice ? '€' + lastPrice.toFixed(4) : '-';
        
        // Color code: green if up, red if down
        const priceEl = document.getElementById('currentPrice');
        if (historicalData.length > 1) {
            const prevPrice = historicalData[historicalData.length - 2].close;
            priceEl.className = 'text-end ' + (lastPrice >= prevPrice ? 'price-up' : 'price-down');
        }
        
        // Forecast stats
        document.getElementById('medianPrice').textContent = stats.median ? '€' + stats.median.toFixed(4) : '-';
        document.getElementById('meanPrice').textContent = stats.mean ? '€' + stats.mean.toFixed(4) : '-';
        document.getElementById('confidenceInterval').textContent = stats.p5 ? '€' + stats.p5.toFixed(4) + ' - €' + stats.p95.toFixed(4) : '-';
        document.getElementById('volatility').textContent = monteCarloData.volatility ? (monteCarloData.volatility * 100).toFixed(2) + '%' : '-';
        document.getElementById('expectedReturn').textContent = monteCarloData.mean_return ? (monteCarloData.mean_return * 100).toFixed(4) + '%' : '-';
        
        // Distribution probabilities
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
        
        // Overall change in selected period
        if (firstPrice && lastPrice && historicalData.length > 1) {
            const changePct = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
            document.getElementById('priceRange').textContent = changePct + '%';
            document.getElementById('priceRange').className = 'text-end ' + (changePct >= 0 ? 'price-up' : 'price-down');
        }
    }

    updateSignalsTable(signals) {
        const tbody = document.getElementById('signalsBody');
        
        if (!signals || signals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">⚠️ No signals in selected date range</td></tr>';
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
        
        console.log('📋 Signals table updated: ' + signals.length + ' signals');
    }

    updateSignalDisplay(currentSignal) {
        const signalText = document.getElementById('signalText');
        const signalDetails = document.getElementById('signalDetails');
        
        signalText.textContent = currentSignal.signal.replace(/_/g, ' ');
        
        // Color based on signal
        let colorClass = 'text-warning';
        if (currentSignal.signal.includes('BUY')) colorClass = 'text-success';
        if (currentSignal.signal.includes('SELL')) colorClass = 'text-danger';
        
        signalText.className = 'display-6 fw-bold ' + colorClass;
        
        signalDetails.innerHTML = 
            '🟢 Bullish: <strong>' + currentSignal.bullish_percentage + '%</strong> | ' +
            '🔴 Bearish: <strong>' + currentSignal.bearish_percentage + '%</strong> | ' +
            '📊 Confidence: <strong>' + currentSignal.confidence + '</strong>';
        
        console.log('📊 Signal display: ' + currentSignal.signal + ' (' + currentSignal.bullish_percentage + '% bullish)');
    }

    showRangeInfo(historicalData) {
        if (historicalData.length > 0) {
            const firstDate = historicalData[0].date;
            const lastDate = historicalData[historicalData.length - 1].date;
            const firstPrice = historicalData[0].close;
            const lastPrice = historicalData[historicalData.length - 1].close;
            const change = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
            
            console.log('📅 Showing: ' + firstDate + ' → ' + lastDate);
            console.log('💰 Price: €' + firstPrice.toFixed(4) + ' → €' + lastPrice.toFixed(4) + ' (' + change + '%)');
            console.log('📊 Records: ' + historicalData.length);
        } else {
            console.warn('⚠️ No data in selected range');
        }
    }

    showLoading(show) {
        const btn = document.getElementById('updateBtn');
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Running Analysis...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '🔄 Run Analysis';
        }
    }
}

// Start dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Telefonica Stock Predictor...');
    window.dashboard = new Dashboard();
});