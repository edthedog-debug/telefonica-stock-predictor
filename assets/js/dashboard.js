document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await window.dataService.fetchLatestData();
        
        if (!data || !data.historicalPrices || data.historicalPrices.length === 0) {
            throw new Error('No historical price data available.');
        }

        const historical = data.historicalPrices;
        const lastClose = historical[historical.length - 1];
        const previousClose = historical.length > 1 ? historical[historical.length - 2] : lastClose;
        
        // Price metrics update
        const currentPriceElem = document.getElementById('current-price');
        const priceChangeElem = document.getElementById('price-change');
        
        currentPriceElem.textContent = `€${lastClose.price.toFixed(3)}`;
        
        const priceDiff = lastClose.price - previousClose.price;
        const pctDiff = ((priceDiff / previousClose.price) * 100).toFixed(2);
        const isPositive = priceDiff >= 0;
        
        priceChangeElem.textContent = `${isPositive ? '+' : ''}${priceDiff.toFixed(3)} (${isPositive ? '+' : ''}${pctDiff}%)`;
        priceChangeElem.className = `metric-sub ${isPositive ? 'positive' : 'negative'}`;

        // Model predictions calculation
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

        // Timestamp and autoupdate status
        const lastUpdateElem = document.getElementById('last-update');
        const updateStatusElem = document.getElementById('update-status');
        
        lastUpdateElem.textContent = data.lastUpdated || new Date().toLocaleDateString();
        updateStatusElem.textContent = data.status || 'Autoupdate Active';

        // Render stock chart
        window.stockChart.render(historical, prediction);

        // Populate technical model details
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
        console.error('Error initializing predictor dashboard:', error);
        const updateStatusElem = document.getElementById('update-status');
        if (updateStatusElem) {
            updateStatusElem.textContent = 'Error loading data';
            updateStatusElem.className = 'metric-sub negative';
        }
    }
});
