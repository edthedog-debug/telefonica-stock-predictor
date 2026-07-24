/**
 * StockCharts - Chart.js Visualizations v2.0
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * Added: MACD subchart, Bollinger Bands
 */
class StockCharts {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
        this.macdChart = null;
    }

    createMainChart(historicalData, forecastData, indicators = null) {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        const context = ctx.getContext('2d');
        
        const histDates = historicalData.map(d => d.date);
        const histPrices = historicalData.map(d => d.close);
        
        const lastHistDate = histDates.length > 0 ? new Date(histDates[histDates.length - 1]) : new Date();
        const forecastDates = forecastData.confidence_intervals.map(d => {
            const d2 = new Date(lastHistDate);
            d2.setDate(d2.getDate() + d.day);
            return d2.toISOString().split('T')[0];
        });
        
        const medianForecast = forecastData.confidence_intervals.map(d => d.median);
        const upperBound = forecastData.confidence_intervals.map(d => d.upper_bound);
        const lowerBound = forecastData.confidence_intervals.map(d => d.lower_bound);
        
        if (this.mainChart) { this.mainChart.destroy(); this.mainChart = null; }
        
        const datasets = [
            {
                label: 'Price',
                data: [...histPrices, ...Array(forecastDates.length - 1).fill(null)],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2, pointRadius: 0, fill: false, order: 1, yAxisID: 'y'
            }
        ];
        
        // Bollinger Bands
        if (indicators && indicators.bollinger) {
            const bollUpper = indicators.bollinger.upper.filter(v => v !== null);
            const bollLower = indicators.bollinger.lower.filter(v => v !== null);
            const bollMiddle = indicators.bollinger.middle.filter(v => v !== null);
            
            if (bollUpper.length > 0) {
                const startIdx = histPrices.length - bollUpper.length;
                datasets.push({
                    label: 'Bollinger Upper',
                    data: [...Array(startIdx).fill(null), ...bollUpper, ...Array(forecastDates.length - 1).fill(null)],
                    borderColor: 'rgba(255, 99, 132, 0.4)', borderWidth: 1, borderDash: [3, 3],
                    pointRadius: 0, fill: false, order: 3, yAxisID: 'y'
                });
                datasets.push({
                    label: 'Bollinger Lower',
                    data: [...Array(startIdx).fill(null), ...bollLower, ...Array(forecastDates.length - 1).fill(null)],
                    borderColor: 'rgba(255, 99, 132, 0.4)', borderWidth: 1, borderDash: [3, 3],
                    pointRadius: 0, fill: { target: '+1', above: 'rgba(255, 99, 132, 0.05)', below: 'rgba(255, 99, 132, 0.05)' },
                    order: 4, yAxisID: 'y'
                });
            }
        }
        
        // Forecast
        if (medianForecast.length > 0 && medianForecast[0] > 0) {
            datasets.push({
                label: 'Forecast Median', yAxisID: 'y',
                data: [...Array(histPrices.length - 1).fill(null), ...medianForecast],
                borderColor: 'rgb(255, 159, 64)', borderWidth: 2, borderDash: [5, 5],
                pointRadius: 0, fill: false, order: 0
            });
            datasets.push({
                label: 'Upper 95%', yAxisID: 'y',
                data: [...Array(histPrices.length - 1).fill(null), ...upperBound],
                borderColor: 'rgba(34, 197, 94, 0.3)', borderWidth: 1,
                pointRadius: 0, fill: false, order: 2
            });
            datasets.push({
                label: 'Lower 95%', yAxisID: 'y',
                data: [...Array(histPrices.length - 1).fill(null), ...lowerBound],
                borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1,
                pointRadius: 0, fill: { target: '+2', above: 'rgba(34, 197, 94, 0.06)', below: 'rgba(239, 68, 68, 0.06)' },
                order: 3
            });
        }
        
        const allLabels = [...histDates, ...forecastDates.slice(1)];
        
        this.mainChart = new Chart(context, {
            type: 'line',
            data: { labels: allLabels, datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 10 } } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                let label = ctx.dataset.label || '';
                                if (label) label += ': ';
                                if (ctx.parsed.y !== null && ctx.parsed.y !== undefined) label += '€' + ctx.parsed.y.toFixed(4);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: { title: { display: true, text: 'Price (EUR)' }, ticks: { callback: v => '€' + v.toFixed(2) } },
                    x: { title: { display: true, text: 'Date' }, ticks: { maxTicksLimit: 10, maxRotation: 45 } }
                }
            }
        });
        
        console.log('📈 Main chart updated with Bollinger Bands');
    }

    createMACDChart(indicators) {
        const container = document.getElementById('macdChartContainer');
        if (!container) return;
        const canvas = document.getElementById('macdChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (this.macdChart) { this.macdChart.destroy(); this.macdChart = null; }
        if (!indicators || !indicators.macd) return;
        
        const macd = indicators.macd;
        const validData = macd.macdLine.filter(v => v !== null);
        if (validData.length === 0) return;
        
        const labels = Array.from({ length: macd.macdLine.length }, (_, i) => i);
        
        this.macdChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'MACD Histogram',
                        data: macd.histogram,
                        backgroundColor: ctx => {
                            const value = ctx.raw;
                            return value >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
                        },
                        borderWidth: 0,
                        order: 2
                    },
                    {
                        label: 'MACD Line',
                        data: macd.macdLine,
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2, pointRadius: 0, fill: false, type: 'line', order: 0
                    },
                    {
                        label: 'Signal Line',
                        data: macd.signalLine,
                        borderColor: 'rgb(255, 159, 64)',
                        borderWidth: 1.5, pointRadius: 0, fill: false, type: 'line', order: 1
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top', labels: { font: { size: 9 }, usePointStyle: true } } },
                scales: {
                    y: { title: { display: true, text: 'MACD' }, ticks: { font: { size: 9 } } },
                    x: { display: false }
                }
            }
        });
        
        console.log('📊 MACD chart created');
    }

    createGaugeChart(bullishPercentage) {
        const ctx = document.getElementById('gaugeChart');
        if (!ctx) return;
        const context = ctx.getContext('2d');
        if (this.gaugeChart) { this.gaugeChart.destroy(); this.gaugeChart = null; }
        
        let color;
        if (bullishPercentage >= 70) color = 'rgba(34, 197, 94, 0.85)';
        else if (bullishPercentage >= 60) color = 'rgba(34, 197, 94, 0.6)';
        else if (bullishPercentage >= 40) color = 'rgba(251, 191, 36, 0.85)';
        else if (bullishPercentage >= 30) color = 'rgba(249, 115, 22, 0.85)';
        else color = 'rgba(239, 68, 68, 0.85)';
        
        this.gaugeChart = new Chart(context, {
            type: 'doughnut',
            data: { datasets: [{ data: [bullishPercentage, 100 - bullishPercentage], backgroundColor: [color, 'rgba(200,200,200,0.2)'], borderWidth: 0, circumference: 180, rotation: 270 }] },
            options: { cutout: '75%', responsive: true, maintainAspectRatio: true, plugins: { tooltip: { enabled: false }, legend: { display: false } } },
            plugins: [{
                id: 'gaugeText',
                afterDraw(chart) {
                    const { ctx, width, height } = chart;
                    ctx.save();
                    const cx = width / 2, cy = height * 0.7;
                    ctx.font = 'bold 30px Arial'; ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(bullishPercentage + '%', cx, cy - 5);
                    ctx.font = '12px Arial'; ctx.fillStyle = '#666'; ctx.fillText('BULLISH', cx, cy + 28);
                    ctx.restore();
                }
            }]
        });
    }

    destroyAll() {
        if (this.mainChart) this.mainChart.destroy();
        if (this.gaugeChart) this.gaugeChart.destroy();
        if (this.macdChart) this.macdChart.destroy();
    }
}