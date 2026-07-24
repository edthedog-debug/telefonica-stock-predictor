document.addEventListener('DOMContentLoaded', async () => {
  const runBtn = document.getElementById('run-analysis');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const forecastDaysSelect = document.getElementById('forecastDays');
  const simulationsInput = document.getElementById('simulations');

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  async function executeAnalysis() {
    try {
      if (runBtn) {
        runBtn.disabled = true;
        runBtn.innerHTML = '🔄 Cargando...';
      }

      const rawData = await window.dataService.loadHistoricalData();
      const processedData = window.dataService.calculateBollingerBands(rawData);
      const lastPrice = processedData[processedData.length - 1].close;

      const forecastDays = forecastDaysSelect ? parseInt(forecastDaysSelect.value) || 30 : 30;
      const simCount = simulationsInput ? parseInt(simulationsInput.value.replace(/,/g, '')) || 1000 : 1000;

      const monteCarloResults = window.dataService.runMonteCarlo(lastPrice, forecastDays, simCount);

      if (startDateInput && processedData.length > 0) {
        startDateInput.value = formatDate(processedData[0].date);
      }
      if (endDateInput && processedData.length > 0) {
        endDateInput.value = formatDate(processedData[processedData.length - 1].date);
      }

      window.chartManager.renderMainChart('mainChart', processedData, monteCarloResults);
      window.chartManager.renderTrendChart('trendChart', processedData);

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = '🔄 Run Analysis';
      }
    }
  }

  if (runBtn) {
    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeAnalysis();
    });
  }

  await executeAnalysis();
});
