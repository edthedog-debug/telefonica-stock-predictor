class ChartManager {
  constructor() {
    this.mainChart = null;
    this.trendChart = null;
  }

  renderMainChart(canvasId, historicalData, monteCarloResults) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.mainChart) {
      this.mainChart.destroy();
    }

    const labels = historicalData.map(d => d.date);
    const closePrices = historicalData.map(d => d.close);
    const upperBands = historicalData.map(d => d.upper);
    const lowerBands = historicalData.map(d => d.lower);
    const sma = historicalData.map(d => d.sma);

    // Fechas para la predicción
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const forecastLabels = [...labels];
    
    for (let i = 1; i < monteCarloResults.medianPath.length; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      forecastLabels.push(nextDate.toISOString().split('T')[0]);
    }

    const padArray = (arr, length) => [...arr, ...Array(length - arr.length).fill(null)];

    const historicalLen = historicalData.length;
    const medianForecast = Array(historicalLen - 1).fill(null).concat(monteCarloResults.medianPath);
    const upperForecast = Array(historicalLen - 1).fill(null).concat(monteCarloResults.upperPath);
    const lowerForecast = Array(historicalLen - 1).fill(null).concat(monteCarloResults.lowerPath);

    this.mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: forecastLabels,
        datasets: [
          {
            label: 'Precio Cierre (€)',
            data: padArray(closePrices, forecastLabels.length),
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Banda Superior',
            data: padArray(upperBands, forecastLabels.length),
            borderColor: 'rgba(108, 117, 125, 0.4)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Banda Inferior',
            data: padArray(lowerBands, forecastLabels.length),
            borderColor: 'rgba(108, 117, 125, 0.4)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Predicción Media Monte Carlo',
            data: medianForecast,
            borderColor: '#20c997',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Rango Predicción (90%)',
            data: upperForecast,
            borderColor: 'rgba(32, 201, 151, 0.2)',
            backgroundColor: 'rgba(32, 201, 151, 0.15)',
            borderWidth: 0,
            pointRadius: 0,
            fill: '+1'
          },
          {
            label: 'Rango Inferior',
            data: lowerForecast,
            borderColor: 'rgba(32, 201, 151, 0.2)',
            borderWidth: 0,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top' },
          tooltip: { enabled: true }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' } }
        }
      }
    });
  }

  renderTrendChart(canvasId, historicalData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const recentData = historicalData.slice(-60);
    const labels = recentData.map(d => d.date);
    const volumes = recentData.map(d => d.volume || 0);

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Volumen',
          data: volumes,
          backgroundColor: 'rgba(0, 184, 217, 0.5)',
          borderColor: '#00b8d9',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' } }
        }
      }
    });
  }
}

window.chartManager = new ChartManager();
