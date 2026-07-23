/**
 * StockCharts - Chart.js Visualizations
 * GitHub: edthedog-debug/telefonica-stock-predictor
 */
class StockCharts {
    constructor() {
        this.mainChart = null;
        this.gaugeChart = null;
    }

    createMainChart(historicalData, forecastData) {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        
        // Prepare data
        const histDates = historicalData.map(d => d.date);
        const histPrices = historicalData.map(d => d.close);
        
        // Generate forecast dates
        const lastHistDate = histDates.length > 0 ? new Date(histDates[histDates.length - 1]) : new Date();
        const forecastDates = forecastData.confidence_intervals.map(d => {
            const d2 = new Date(lastHistDate);
            d2.setDate(d2.getDate() + d.day);
            return d2.toISOString().split('T')[0];
        });
        
        const medianForecast = forecastData.confidence_intervals.map(d => d.median);
        const upperBound = forecastData.confidence_intervals.map(d => d.upper_bound);
        const lowerBound = forecastData.confidence_intervals.map(d => d.lower_bound);
        
        // Destroy previous chart
        if (this.mainChart) {
            this.mainChart.destroy();
            this.mainChart = null;
        }
        
        // Build datasets
        const datasets = [
            {
                label: 'Historical Price',
                data: [...histPrices, ...Array(forecastDates.length - 1).fill(null)],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                order: 1
            }
        ];
        
        // Only add forecast if we have data
        if (medianForecast.length > 0 && medianForecast[0] > 0) {
            datasets.push({
                label: 'Forecast Median',
                data: [...Array(histPrices.length - 1).fill(null), ...medianForecast],
                borderColor: 'rgb(255, 159, 64)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                order: 0
            });
            
            datasets.push({
                label: 'Upper Bound (95%)',
                data: [...Array(histPrices.length - 1).fill(null), ...upperBound],
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                order: 2
            });
            
            datasets.push({
                label: 'Lower Bound (95%)',
                data: [...Array(histPrices.length - 1).fill(null), ...lowerBound],
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderWidth: 1,
                pointRadius: 0,
                fill: {
                    target: 2,
                    above: 'rgba(34, 197, 94, 0.08)',
                    below: 'rgba(239, 68, 68, 0.08)'
                },
                order: 3
            });
        }
        
        // All labels
        const allLabels = [...histDates, ...forecastDates.slice(1)];
        
        // Find divider index
        const dividerIndex = histDates.length - 1;
        
        this.mainChart = new Chart(context, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                let label = ctx.dataset.label || '';
                                if (label) label += ': ';
                                if (ctx.parsed.y !== null && ctx.parsed.y !== undefined) {
                                    label += '€' + ctx.parsed.y.toFixed(4);
                                }
                                return label;
                            }
                        }
                    },
                    // Add vertical line at forecast start
                    annotation: dividerIndex > 0 ? {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: dividerIndex,
                                xMax: dividerIndex,
                                borderColor: 'rgba(0, 0, 0, 0.3)',
                                borderWidth: 1,
                                borderDash: [3, 3],
                                label: {
                                    display: true,
                                    content: '← Historical | Forecast →',
                                    position: 'start',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    font: { size: 10 }
                                }
                            }
                        }
                    } : {}
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Price (EUR)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '€' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            maxTicksLimit: 12,
                            maxRotation: 45
                        }
                    }
                }
            }
        });
        
        console.log('📈 Chart updated: ' + histPrices.length + ' historical + ' + (medianForecast.length - 1) + ' forecast points');
    }

    createGaugeChart(bullishPercentage) {
        const ctx = document.getElementById('gaugeChart');
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        
        if (this.gaugeChart) {
            this.gaugeChart.destroy();
            this.gaugeChart = null;
        }
        
        // Color logic
        let color;
        if (bullishPercentage >= 70) color = 'rgba(34, 197, 94, 0.85)';
        else if (bullishPercentage >= 60) color = 'rgba(34, 197, 94, 0.6)';
        else if (bullishPercentage >= 40) color = 'rgba(251, 191, 36, 0.85)';
        else if (bullishPercentage >= 30) color = 'rgba(249, 115, 22, 0.85)';
        else color = 'rgba(239, 68, 68, 0.85)';
        
        this.gaugeChart = new Chart(context, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [bullishPercentage, 100 - bullishPercentage],
                    backgroundColor: [color, 'rgba(200, 200, 200, 0.2)'],
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
                id: 'gaugeText',
                afterDraw(chart) {
                    const { ctx, width, height } = chart;
                    ctx.save();
                    
                    const cx = width / 2;
                    const cy = height * 0.7;
                    
                    // Percentage
                    ctx.font = 'bold 32px Arial';
                    ctx.fillStyle = '#1a1a1a';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(bullishPercentage + '%', cx, cy - 5);
                    
                    // Label
                    ctx.font = '13px Arial';
                    ctx.fillStyle = '#666';
                    ctx.fillText('BULLISH', cx, cy + 30);
                    
                    // Min/Max labels
                    ctx.font = '10px Arial';
                    ctx.fillStyle = '#999';
                    ctx.fillText('0%', cx - 80, cy + 60);
                    ctx.fillText('100%', cx + 80, cy + 60);
                    
                    ctx.restore();
                }
            }]
        });
        
        console.log('📊 Gauge updated: ' + bullishPercentage + '% bullish');
    }
}