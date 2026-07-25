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

        // --- 2. PROYECCIÓN MONTE CARLO Y BANDAS DE ERROR ---
        let returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const variance = returns.length > 0 ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length : 0;
        const dailyStdDev = Math.sqrt(variance);
        const drift = meanReturn - (variance / 2);

        const fullLabels = [...labels];
        const historicalDataset = [...prices];
        const mcForecastDataset = new Array(prices.length - 1).fill(null);
        const mcUpperDataset = new Array(prices.length - 1).fill(null);
        const mcLowerDataset = new Array(prices.length - 1).fill(null);
        
        const lastClosePrice = prices[prices.length - 1];
        mcForecastDataset.push(lastClosePrice);
        mcUpperDataset.push(lastClosePrice);
        mcLowerDataset.push(lastClosePrice);

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
            const upperPrice = lastClosePrice * Math.exp(drift * day + (1.96 * dailyStdDev * Math.sqrt(day)));
            const lowerPrice = lastClosePrice * Math.exp(drift * day - (1.96 * dailyStdDev * Math.sqrt(day)));

            mcForecastDataset.push(projectedPrice);
            mcUpperDataset.push(upperPrice);
            mcLowerDataset.push(lowerPrice);
        }

        // --- 3. GRÁFICO PRINCIPAL SIN GLOW + CON BANDAS DE ERROR MONTE CARLO Y TOOLTIP ---
        const mainCanvas = document.getElementById('mainChart');
        if (mainCanvas) {
            const mainCtx = mainCanvas.getContext('2d');
            if (this.mainChart) this.mainChart.destroy();

            const bgGradient = mainCtx.createLinearGradient(0, 0, 0, 300);
            bgGradient.addColorStop(0, 'rgba(13, 110, 253, 0.15)');
            bgGradient.addColorStop(1, 'rgba(13, 110, 253, 0.0)');

            this.mainChart = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: fullLabels,
                    datasets: [
                        {
                            label: 'Precio de Cierre (€)',
                            data: historicalDataset,
                            borderColor: '#0d6efd',
                            backgroundColor: bgGradient,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#0d6efd',
                            borderWidth: 2,
                            tension: 0.1
                        },
                        {
                            label: 'Proyección Monte Carlo',
                            data: mcForecastDataset,
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            borderDash: [5, 4],
                            pointRadius: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#8b5cf6',
                            tension: 0.1
                        },
                        {
                            label: 'Banda Superior MC',
                            data: mcUpperDataset,
                            borderColor: 'rgba(139, 92, 246, 0.5)',
                            borderWidth: 1,
                            borderDash: [2, 2],
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'Banda Inferior MC',
                            data: mcLowerDataset,
                            borderColor: 'rgba(139, 92, 246, 0.5)',
                            borderWidth: 1,
                            borderDash: [2, 2],
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'SMA 20',
                            data: sma20,
                            borderColor: '#ffc107',
                            borderDash: [4, 4],
                            pointRadius: 0,
                            borderWidth: 1.5
                        },
                        {
                            label: 'Upper Bollinger',
                            data: upperBand,
                            borderColor: '#dc3545',
                            borderDash: [2, 2],
                            pointRadius: 0,
                            borderWidth: 1
                        },
                        {
                            label: 'Lower Bollinger',
                            data: lowerBand,
                            borderColor: '#198754',
                            borderDash: [2, 2],
                            pointRadius: 0,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 10,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null && context.parsed.y !== undefined) {
                                        label += '€' + context.parsed.y.toFixed(3);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }

        // --- 4. INDICADOR DE TENDENCIA (GAUGE) CON TAMAÑO FIJO ---
        const gaugeCanvas = document.getElementById('gaugeChart');
        if (gaugeCanvas) {
            gaugeCanvas.style.maxHeight = '160px';
            const gaugeCtx = gaugeCanvas.getContext('2d');
            if (this.gaugeChart) this.gaugeChart.destroy();
            const isBullish = (metrics.mcTrendPct !== undefined ? metrics.mcTrendPct : (drift >= 0)) >= 0;

            this.gaugeChart = new Chart(gaugeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Señal Alcista', 'Señal Bajista'],
                    datasets: [{
                        data: [isBullish ? 75 : 25, isBullish ? 25 : 75],
                        backgroundColor: ['#198754', '#dc3545'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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

        // --- 5. GRÁFICO MACD ---
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
                            label: 'Histograma',
                            data: histogram,
                            backgroundColor: histogram.map(v => v >= 0 ? '#198754' : '#dc3545')
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null && context.parsed.y !== undefined) {
                                        label += context.parsed.y.toFixed(4);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}

window.stockChart = new StockChartManager();
