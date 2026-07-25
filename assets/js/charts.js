class StockChartManager {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
        this.macdChart = null;
    }

    // Helper para calcular la Media Móvil Exponencial (EMA) necesaria para MACD
    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        let emaArray = [data[0]];
        for (let i = 1; i < data.length; i++) {
            emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
        }
        return emaArray;
    }

    renderAll(historical, forecastDays, metrics) {
        if (!historical || historical.length === 0) return;

        const labels = historical.map(item => item.date);
        const prices = historical.map(item => item.price);

        // --- 1. CÁLCULO DE BANDAS DE BOLLINGER (SMA 20) ---
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

        // --- 2. GRÁFICO PRINCIPAL CON EFECTO GLOW ---
        const mainCanvas = document.getElementById('mainChart');
        if (mainCanvas) {
            const mainCtx = mainCanvas.getContext('2d');
            if (this.mainChart) this.mainChart.destroy();

            // Degradado azul brillante para el área
            const glowGradient = mainCtx.createLinearGradient(0, 0, 0, 300);
            glowGradient.addColorStop(0, 'rgba(13, 110, 253, 0.4)');
            glowGradient.addColorStop(1, 'rgba(13, 110, 253, 0.0)');

            // Plugin personalizado para el resplandor (Glow) de la línea de precio
            const glowPlugin = {
                id: 'glowPlugin',
                beforeDatasetDraw(chart, args) {
                    if (args.index === 0) {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.shadowColor = 'rgba(13, 110, 253, 0.8)';
                        ctx.shadowBlur = 12;
                        ctx.shadowOffsetY = 4;
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
                    labels: labels,
                    datasets: [
                        { label: 'Close Price (€)', data: prices, borderColor: '#0d6efd', backgroundColor: glowGradient, fill: true, pointRadius: 0, borderWidth: 2.5, tension: 0.2 },
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

        // --- 3. INDICADOR DE TENDENCIA (GAUGE) SIN CAÍDA AL TOCAR ---
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
                    events: [], // Desactiva eventos táctiles/click para evitar reseteo o rotación
                    animation: { animateRotate: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        }

        // --- 4. GRÁFICO MACD CON LÍNEAS MACD, SIGNAL Y CORTES ---
        const macdCtx = document.getElementById('macdChart')?.getContext('2d');
        if (macdCtx) {
            if (this.macdChart) this.macdChart.destroy();

            // Cálculo estándar: EMA 12, EMA 26 y Señal EMA 9
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
                            label: 'Signal Line (SMA/EMA 9)',
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
