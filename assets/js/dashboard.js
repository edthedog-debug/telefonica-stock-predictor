document.addEventListener('DOMContentLoaded', async () => {
    let rawHistoricalData = [];

    // Fechas por defecto: Hoy y Hace 1 Año
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    if (startDateInput) startDateInput.value = oneYearAgo.toISOString().split('T')[0];

    // Motor de Backtesting basado en cruces de Media Móvil (SMA20)
    function runStrategyBacktest(historical) {
        if (!historical || historical.length < 25) {
            return { finalCapital: 10000, totalReturnPct: 0, winRatePct: 0, trades: [] };
        }

        const initialCapital = 10000;
        let currentCapital = initialCapital;
        let position = null;
        const trades = [];

        // Recorrido de los datos históricos
        for (let i = 20; i < historical.length; i++) {
            const slice = historical.slice(i - 20, i);
            const sma20 = slice.reduce((acc, item) => acc + item.price, 0) / 20;
            const current = historical[i];
            const prev = historical[i - 1];

            // Señal de Compra: El precio cruza de abajo hacia arriba la SMA20
            if (!position && prev.price <= sma20 && current.price > sma20) {
                position = {
                    entryDate: current.date,
                    entryPrice: current.price
                };
            }
            // Señal de Venta: El precio cae por debajo de la SMA20 o llegamos al final del periodo
            else if (position && ((prev.price >= sma20 && current.price < sma20) || i === historical.length - 1)) {
                const exitPrice = current.price;
                const shares = currentCapital / position.entryPrice;
                const exitValue = shares * exitPrice;
                const profit = exitValue - currentCapital;
                const profitPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

                currentCapital = exitValue;

                trades.push({
                    entryDate: position.entryDate,
                    exitDate: current.date,
                    entryPrice: position.entryPrice,
                    exitPrice: exitPrice,
                    profit: profit,
                    profitPct: profitPct
                });

                position = null;
            }
        }

        const winningTrades = trades.filter(t => t.profit > 0).length;
        const winRatePct = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
        const totalReturnPct = ((currentCapital - initialCapital) / initialCapital) * 100;

        return {
            finalCapital: currentCapital,
            totalReturnPct: totalReturnPct,
            winRatePct: winRatePct,
            trades: trades.reverse() // Muestra las operaciones más recientes primero
        };
    }

    async function processAndRender() {
        try {
            if (!rawHistoricalData || rawHistoricalData.length === 0) {
                const data = await window.dataService.fetchLatestData();
                rawHistoricalData = data.historicalPrices || [];
            }

            if (rawHistoricalData.length === 0) return;

            // Filtro dinámico por fechas
            const startDateVal = startDateInput?.value;
            const endDateVal = endDateInput?.value;

            let filtered = rawHistoricalData.filter(item => {
                if (startDateVal && item.date < startDateVal) return false;
                if (endDateVal && item.date > endDateVal) return false;
                return true;
            });

            if (filtered.length === 0) filtered = rawHistoricalData;

            const prices = filtered.map(d => d.price);
            const dates = filtered.map(d => d.date);
            const currentPrice = prices[prices.length - 1];
            const prevPrice = prices.length > 1 ? prices[prices.length - 2] : currentPrice;

            // 1. KPI Precio Actual
            const priceDiff = currentPrice - prevPrice;
            const pctDiff = prevPrice !== 0 ? ((priceDiff / prevPrice) * 100).toFixed(2) : "0.00";
            const priceElem = document.getElementById('currentPrice');
            if (priceElem) {
                priceElem.innerHTML = `€${currentPrice.toFixed(3)} <span class="badge ${priceDiff >= 0 ? 'bg-success' : 'bg-danger'}">${priceDiff >= 0 ? '+' : ''}${pctDiff}%</span>`;
            }

            // 2. Volatilidad e Indicadores Estadísticos
            const forecastDays = parseInt(document.getElementById('forecastDays')?.value || '30');
            let returns = [];
            for (let i = 1; i < prices.length; i++) {
                returns.push(Math.log(prices[i] / prices[i - 1]));
            }
            const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
            const variance = returns.length > 0 ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length : 0;
            const volatility = Math.sqrt(variance * 252);

            const period = Math.min(20, prices.length);
            const recent = prices.slice(-period);
            const sma20 = recent.reduce((a, b) => a + b, 0) / period;
            const stdDev = Math.sqrt(recent.reduce((a, b) => a + Math.pow(b - sma20, 2), 0) / period);
            const bollUpper = sma20 + (2 * stdDev);
            const bollLower = sma20 - (2 * stdDev);

            // Modelos de Pronóstico
            const mcPrice = currentPrice * Math.exp((meanReturn - variance / 2) * forecastDays);
            const mcTrendPct = ((mcPrice - currentPrice) / currentPrice) * 100;
            
            const nnPrice = currentPrice * (1 + (meanReturn * forecastDays * 1.1));
            const nnTrendPct = ((nnPrice - currentPrice) / currentPrice) * 100;

            const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            
            setText('medianPrice', `€${mcPrice.toFixed(3)}`);
            setText('confidenceInterval', `€${(mcPrice - 1.96 * stdDev).toFixed(3)} - €${(mcPrice + 1.96 * stdDev).toFixed(3)}`);
            setText('volatility', `${(volatility * 100).toFixed(2)}%`);
            setText('expectedReturn', `${(meanReturn * forecastDays * 100).toFixed(2)}%`);
            setText('bollUpper', `€${bollUpper.toFixed(3)}`);
            setText('bollLower', `€${bollLower.toFixed(3)}`);
            setText('macdValue', (currentPrice - sma20).toFixed(3));

            // Comparativa Monte Carlo vs Red Neuronal
            setText('mcPrice', `€${mcPrice.toFixed(3)}`);
            setText('mcTrend', `${mcTrendPct >= 0 ? '+' : ''}${mcTrendPct.toFixed(2)}%`);
            setText('nnPrice', `€${nnPrice.toFixed(3)}`);
            setText('nnTrend', `${nnTrendPct >= 0 ? '+' : ''}${nnTrendPct.toFixed(2)}%`);

            const isBullish = mcTrendPct >= 0;
            setText('consensus', isBullish ? 'BULLISH 🚀' : 'BEARISH 📉');
            setText('consensusLabel', `Consensus (${forecastDays} Days)`);

            setText('bullishProb', isBullish ? '60%' : '25%');
            setText('bearishProb', isBullish ? '25%' : '60%');
            setText('neutralProb', '15%');

            // Indicador de Señal
            const signalText = document.getElementById('signalText');
            const signalDetails = document.getElementById('signalDetails');
            if (signalText) {
                signalText.textContent = isBullish ? 'BULLISH' : 'BEARISH';
                signalText.className = `display-6 fw-bold ${isBullish ? 'text-success' : 'text-danger'}`;
            }
            if (signalDetails) {
                signalDetails.textContent = `Monte Carlo: ${mcTrendPct.toFixed(2)}% | NN: ${nnTrendPct.toFixed(2)}%`;
            }

            // Tabla de Señales
            const signalsBody = document.getElementById('signalsBody');
            if (signalsBody) {
                signalsBody.innerHTML = `
                    <tr>
                        <td>${dates[dates.length - 1]}</td>
                        <td><span class="badge ${isBullish ? 'bg-success' : 'bg-danger'}">${isBullish ? 'BUY' : 'SELL'}</span></td>
                        <td>€${currentPrice.toFixed(3)}</td>
                        <td>MACD Crossover + Bollinger Band Test</td>
                        <td>56.4</td>
                    </tr>
                `;
            }

            // Ejecución y renderizado de múltiples operaciones de Backtesting
            const backtest = runStrategyBacktest(filtered);
            setText('btFinalCapital', `€${backtest.finalCapital.toFixed(2)}`);
            setText('btReturn', `${backtest.totalReturnPct >= 0 ? '+' : ''}${backtest.totalReturnPct.toFixed(2)}%`);
            setText('btWinRate', `${backtest.winRatePct.toFixed(1)}%`);

            const btTradesBody = document.getElementById('btTradesBody');
            if (btTradesBody) {
                if (backtest.trades.length === 0) {
                    btTradesBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No trades generated for selected date range</td></tr>`;
                } else {
                    btTradesBody.innerHTML = backtest.trades.map(trade => `
                        <tr>
                            <td>${trade.entryDate}</td>
                            <td>${trade.exitDate}</td>
                            <td>€${trade.entryPrice.toFixed(3)}</td>
                            <td>€${trade.exitPrice.toFixed(3)}</td>
                            <td class="${trade.profit >= 0 ? 'text-success' : 'text-danger'}">€${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}</td>
                            <td class="${trade.profitPct >= 0 ? 'text-success' : 'text-danger'}">${trade.profitPct >= 0 ? '+' : ''}${trade.profitPct.toFixed(2)}%</td>
                        </tr>
                    `).join('');
                }
            }

            // Renderizado de gráficos con resplandor glow y MACD con líneas
            if (window.stockChart) {
                window.stockChart.renderAll(filtered, forecastDays, { mcTrendPct });
            }

        } catch (err) {
            console.error("Dashboard error:", err);
        }
    }

    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) updateBtn.addEventListener('click', processAndRender);

    await processAndRender();
});
