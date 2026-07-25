class StockChartManager {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
        this.macdChart = null;
    }

    renderAll(historical, forecastDays, metrics) {
        if (!historical || historical.length === 0) return;

        const labels = historical.map(item => item.date);
        const prices = historical.map(item => item.price);

        // Calculate Bollinger Bands (SMA 20)
        const period = 20;
        const upperBand = [];
        const lowerBand = [];
        const sma20 = [];

        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma20.push(null);
                upperBand.push(null);
                lowerBand.push(null);
            } else {
                const slice = prices.slice(i - period + 1, i + 1);
                const mean = slice.reduce((a, b) => a + b, 0) / period;
                const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
                const std = Math.sqrt(variance);
                sma20.push(mean);
                upperBand.push(mean + (2 * std));
                lowerBand.push(mean - (2 * std));
            }
        }

        // 1. Render Main Chart (Price + Bollinger Bands)
        const mainCtx = document.getElementById('mainChart')?.getContext('2d');
        if (mainCtx) {
            if (this.mainChart) this.mainChart.destroy();
            this.mainChart = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Close Price (€)', data: prices, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.05)', fill: true, pointRadius: 0, borderWidth: 2 },
                        { label: 'SMA 20', data: sma20, borderColor: '#ffc107', borderDash: [4, 4], pointRadius: 0, borderWidth: 1.5 },
                        { label: 'Upper Bollinger', data: upperBand, borderColor: '#dc3545', borderDash: [2, 2], pointRadius: 0, borderWidth: 1 },
                        { label: 'Lower Bollinger', data: lowerBand, borderColor: '#198754', borderDash: [2, 2], pointRadius: 0, borderWidth: 1 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
            });
        }

        // 2. Render Trend Gauge Chart
        const gaugeCtx = document.getElementById('gaugeChart')?.getContext('2d');
        if (gaugeCtx) {
            if (this.gaugeChart) this.gaugeChart.destroy();
            const isBullish = metrics.mcTrendPct >= 0;
            this.gaugeChart = new Chart(gaugeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Bullish Signal', 'Bearish Signal'],
                    datasets: [{
                        data: [isBullish ? 75 : 25, isBullish ? 25 : 75],
                        backgroundColor: ['#198754', '#dc3545'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    rotation: -90,
                    circumference: 180,
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 3. Render MACD Chart
        const macdCtx = document.getElementById('macdChart')?.getContext('2d');
        if (macdCtx) {
            if (this.macdChart) this.macdChart.destroy();
            const macdValues = prices.map((p, idx) => idx >= 20 ? p - sma20[idx] : 0);
            this.macdChart = new Chart(macdCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'MACD Histogram',
                        data: macdValues,
                        backgroundColor: macdValues.map(v => v >= 0 ? '#198754' : '#dc3545')
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    }
}

window.stockChart = new StockChartManager();
