/**
 * StockCharts - Chart.js visualization
 * GitHub: edthedog-debug/telefonica-stock-predictor
 */
class StockCharts {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
    }

    createMainChart(historicalData, forecastData) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        const histDates = historicalData.map(d => d.date);
        const histPrices = historicalData.map(d => d.close);
        
        const forecastDates = forecastData.confidence_intervals.map(d => {
            const lastDate = new Date(histDates[histDates.length - 1]);
            lastDate.setDate(lastDate.getDate() + d.day);
            return lastDate.toISOString().split('T')[0];
        });
        
        const medianForecast = forecastData.confidence_intervals.map(d => d.median);
        const upperBound = forecastData.confidence_intervals.map(d => d.upper_bound);
        const lowerBound = forecastData.confidence_intervals.map(d => d.lower_bound);
        
        if (this.mainChart) this.mainChart.destroy();
        
        this.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...histDates, ...forecastDates.slice(1)],
                datasets: [
                    {
                        label: 'Historical Price',
                        data: [...histPrices, ...Array(forecastDates.length - 1).fill(null)],
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Forecast Median',
                        data: [...Array(histPrices.length - 1).fill(null), ...medianForecast],
                        borderColor: 'rgb(255, 159, 64)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Upper Bound (95%)',
                        data: [...Array(histPrices.length - 1).fill(null), ...upperBound],
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Lower Bound (95%)',
                        data: [...Array(histPrices.length - 1).fill(null), ...lowerBound],
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: {
                            target: 2,
                            above: 'rgba(34, 197, 94, 0.05)',
                            below: 'rgba(239, 68, 68, 0.05)'
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': €' + context.parsed.y.toFixed(4);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Price (EUR)' },
                        ticks: { callback: v => '€' + v.toFixed(2) }
                    },
                    x: {
                        title: { display: true, text: 'Date' },
                        ticks: { maxTicksLimit: 10 }
                    }
                }
            }
        });
    }

    createGaugeChart(bullishPercentage) {
        const ctx = document.getElementById('gaugeChart').getContext('2d');
        
        if (this.gaugeChart) this.gaugeChart.destroy();
        
        let color;
        if (bullishPercentage >= 60) color = 'rgba(34, 197, 94, 0.8)';
        else if (bullishPercentage >= 40) color = 'rgba(251, 191, 36, 0.8)';
        else color = 'rgba(239, 68, 68, 0.8)';
        
        this.gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [bullishPercentage, 100 - bullishPercentage],
                    backgroundColor: [color, 'rgba(200, 200, 200, 0.3)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                cutout: '75%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                }
            },
            plugins: [{
                id: 'gaugeCenter',
                afterDraw(chart) {
                    const { ctx, width, height } = chart;
                    ctx.save();
                    const centerX = width / 2;
                    const centerY = height * 0.7;
                    ctx.font = 'bold 36px Arial';
                    ctx.fillStyle = '#333';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(bullishPercentage + '%', centerX, centerY);
                    ctx.font = '14px Arial';
                    ctx.fillText('Bullish', centerX, centerY + 35);
                    ctx.restore();
                }
            }]
        });
    }
}