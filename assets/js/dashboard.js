document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch real market data loaded via autoupdate
        const data = await window.dataService.fetchLatestData();
        
        if (!data || !data.historicalPrices || data.historicalPrices.length === 0) {
            throw new Error('No real-time market data available.');
        }

        const historical = data.historicalPrices;
        const lastClose = historical[historical.length - 1];
        const previousClose = historical.length > 1 ? historical[historical.length - 2] : lastClose;
        
        // Dynamic price metrics update
        const currentPriceElem = document.getElementById('current-price');
        const priceChangeElem = document.getElementById('price-change');
        
        currentPriceElem.textContent = `€${parseFloat(lastClose.price).toFixed(3)}`;
        
        const priceDiff = lastClose.price - previousClose.price;
        const pctDiff = previousClose.price !== 0 ? ((priceDiff / previousClose.price) * 100).toFixed(2) : "0.00";
        const isPositive = priceDiff >= 0;
        
        priceChangeElem.textContent = `${isPositive ? '+' : ''}${priceDiff.toFixed(3)} (${isPositive ? '+' : ''}${pctDiff}%)`;
        priceChangeElem.className = `metric-sub ${isPositive ? 'positive' : 'negative'}`;

        // Neural Network model forecast calculation based on dynamic data
        const prediction = window.neuralNetworkPredictor.predictNext(historical);
        
        const predictedPriceElem = document.getElementById('predicted-price');
        const predictionTrendElem = document.getElementById('prediction-trend');
        const modelAccuracyElem = document.getElementById('model-accuracy');
        
        if (prediction) {
            predictedPriceElem.textContent = `€${prediction.predictedPrice.toFixed(3)}`;
            predictionTrendElem.textContent = `Trend: ${prediction.trend}`;
            predictionTrendElem.className = `metric-sub ${prediction.trend === 'UP' ? 'positive' : 'negative'}`;
            modelAccuracyElem.textContent = `${prediction.confidence}%`;
        }

        // Real-time market sync timestamps
        const lastUpdateElem = document.getElementById('last-update');
        const updateStatusElem = document.getElementById('update-status');
        
        lastUpdateElem.textContent = data.lastUpdated || new Date().toISOString().split('T')[0];
        updateStatusElem.textContent = data.status || 'BME / Google Finance Live Sync';

        // Render dynamic stock chart
        window.stockChart.render(historical, prediction);

        // Technical indicators and parameters grid population
        const detailsContainer = document.getElementById('model-details');
        if (detailsContainer && data.modelMetrics) {
            detailsContainer.innerHTML = Object.entries(data.modelMetrics)
                .map(([key, val]) => `
                    <div class="detail-item">
                        <span class="detail-label">${key.toUpperCase()}</span>
                        <span class="detail-val">${val}</span>
                    </div>
                `).join('');
        }

    } catch (error) {
        console.error('Error loading dynamic stock dashboard:', error);
        const updateStatusElem = document.getElementById('update-status');
        if (updateStatusElem) {
            updateStatusElem.textContent = 'Data Sync Error';
            updateStatusElem.className = 'metric-sub negative';
        }
    }
});
