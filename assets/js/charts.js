class StockChartManager {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
        this.macdChart = null;
    }

    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        let emaArray = [data[0]];
        for (let i = 1; i < data.length; i++) {
            emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
        }
        return emaArray;
    }

    renderAll(historical, forecastDays = 30, metrics = {}) {
        if (!historical || historical.length === 0) return;

        const labels = historical.map(item => item.date);
        const prices = historical.map(item => item.price);

        // --- 1. BANDAS DE BOLLINGER (SMA 20) ---
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

        // --- 2. PROYECCIÓN MONTE CARLO ---
        let returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const variance = returns.length > 0 ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length : 0;
        const drift = meanReturn - (variance / 2);

        const fullLabels = [...labels];
        const historicalDataset = [...prices];
        const mcForecastDataset = new Array(prices.length - 1).fill(null);
        
        const lastClosePrice = prices[prices.length - 1];
        mcForecastDataset.push(lastClosePrice);

        const lastDate = new Date(labels[labels.length - 1]);
        const daysToProject = parseInt(forecastDays) || 30;

        for (let day = 1; day <= daysToProject; day++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + day);
            
            fullLabels.push(nextDate.toISOString().split('T')[0]);
            historicalDataset.push(null);
            sma20.push(null);
            upperBand.push(null);
            lowerBand.push(null);

            const projectedPrice = lastClosePrice * Math.exp(drift * day);
            mcForecastDataset.push(projectedPrice);
        }

        // --- 3. GRÁFICO PRINCIPAL (PRECIO + BOLLINGER + MONTE CARLO + GLOW) ---
        const mainCanvas = document.getElementById('mainChart');
        if (mainCanvas) {
            const mainCtx = mainCanvas.getContext('2d');
            if (this.mainChart) this.mainChart.destroy();

            const glowGradient = mainCtx.createLinearGradient(0, 0, 0, 300);
            glowGradient.addColorStop(0, 'rgba(13, 110, 253, 0.35)');
            glowGradient.addColorStop(1, 'rgba(13, 110, 253, 0.0)');

            const glowPlugin = {
                id: 'glowPlugin',
                beforeDatasetDraw(chart, args) {
                    if (args.index === 0) {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.shadowColor = 'rgba(13, 110, 253, 0.8)';
                        ctx.shadowBlur = 10;
                        ctx.shadowOffsetY = 3;
                    }
                },
                afterDatasetDraw(chart, args) {
                    if (args.index === 0) {
                        chart.ctx.restore();
                    }
                }
            };

            this.mainChart = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: fullLabels,
                    datasets: [
                        { label: 'Close Price (€)', data: historicalDataset, borderColor: '#0d6efd', backgroundColor: glowGradient, fill: true, pointRadius: 0, borderWidth: 2.5, tension: 0.1 },
                        { label: 'Monte Carlo Forecast', data: mcForecastDataset, borderColor: '#8b5cf6', borderWidth: 2.5, borderDash: [5, 4], pointRadius: 0, tension: 0.1 },
                        { label: 'SMA 20', data: sma20, borderColor: '#ffc107', borderDash: [4, 4], pointRadius: 0, borderWidth: 1.5 },
                        { label: 'Upper Bollinger', data: upperBand, borderColor: '#dc3545', borderDash: [2, 2], pointRadius: 0, borderWidth: 1 },
                        { label: 'Lower Bollinger', data: lowerBand, borderColor: '#198754', borderDash: [2, 2], pointRadius: 0, borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                },
                plugins: [glowPlugin]
            });
        }

        // --- 4. INDICADOR DE TENDENCIA (GAUGE) - SOLUCIÓN ESPACIO EN BLANCO ---
        const gaugeCanvas = document.getElementById('gaugeChart');
        if (gaugeCanvas) {
            // Eliminamos el espacio blanco sobrante del canvas
            gaugeCanvas.style.maxHeight = '160px';
            gaugeCanvas.style.width = '100%';

            const gaugeCtx = gaugeCanvas.getContext('2d');
            if (this.gaugeChart) this.gaugeChart.destroy();
            const isBullish = (metrics.mcTrendPct !== undefined ? metrics.mcTrendPct : (drift >= 0)) >= 0;

            this.gaugeChart = new Chart(gaugeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Bullish Signal', 'Bearish Signal'],
                    datasets: [{
                        data: [isBullish ? 75 : 25, isBullish ? 25 : 75],
                        backgroundColor: ['#198754', '#dc3545'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2, // Relación exacta 2:1 para eliminar el espacio inferior
                    rotation: -90,
                    circumference: 180,
                    events: [],
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        }

        // --- 5. GRÁFICO MACD COMPLETO ---
        const macdCtx = document.getElementById('macdChart')?.getContext('2d');
        if (macdCtx) {
            if (this.macdChart) this.macdChart.destroy();

            const ema12 = this.calculateEMA(prices, 12);
            const ema26 = this.calculateEMA(prices, 26);
            
            const macdLine = ema12.map((val, i) => val - ema26[i]);
            const signalLine = this.calculateEMA(macdLine, 9);
            const histogram = macdLine.map((val, i) => val - signalLine[i]);

            this.macdChart = new Chart(macdCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            type: 'line',
                            label: 'MACD Line',
                            data: macdLine,
                            borderColor: '#0d6efd',
                            borderWidth: 2,
                            pointRadius: 0
                        },
                        {
                            type: 'line',
                            label: 'Signal Line (EMA 9)',
                            data: signalLine,
                            borderColor: '#fd7e14',
                            borderWidth: 1.5,
                            borderDash: [3, 3],
                            pointRadius: 0
                        },
                        {
                            type: 'bar',
                            label: 'Histogram',
                            data: histogram,
                            backgroundColor: histogram.map(v => v >= 0 ? '#198754' : '#dc3545')
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } }
                }
            });
        }
    }
}

window.stockChart = new StockChartManager();
