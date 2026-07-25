class StockChart {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.chart = null;
    }

    /**
     * Renders the price trend and projected forecast on the canvas element.
     * @param {Array} historicalData Array containing timestamped stock quotes.
     * @param {Object} prediction Object containing predicted price and trend metadata.
     */
    render(historicalData, prediction) {
        const ctx = document.getElementById(this.canvasId).getContext('2d');

        const labels = historicalData.map(item => item.date);
        const prices = historicalData.map(item => item.price);

        if (prediction) {
            labels.push('Next (Pred)');
            prices.push(prediction.predictedPrice);
        }

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Price (€)',
                    data: prices,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: prices.map((_, idx) => idx === prices.length - 1 && prediction ? '#22c55e' : '#38bdf8'),
                    pointRadius: prices.map((_, idx) => idx === prices.length - 1 && prediction ? 6 : 3)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8fafc'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
}

window.stockChart = new StockChart('stockChart');
