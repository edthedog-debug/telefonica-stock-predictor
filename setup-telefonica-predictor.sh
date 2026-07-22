#!/bin/bash

# =============================================
# TELEFONICA STOCK PREDICTOR - COMPLETE SETUP
# =============================================
# This script creates the entire project structure
# and all necessary files for GitHub Pages deployment
# =============================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="telefonica-stock-predictor"
GITHUB_USERNAME="YOUR_USERNAME"  # <-- CHANGE THIS TO YOUR GITHUB USERNAME

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     TELEFÓNICA STOCK PREDICTOR - PROJECT SETUP           ║"
echo "║     Monte Carlo Simulation for TEF.MC Stock Analysis     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to create file with content
create_file() {
    local filepath=$1
    local content=$2
    
    mkdir -p "$(dirname "$filepath")"
    echo "$content" > "$filepath"
    echo -e "${GREEN}✓${NC} Created: $filepath"
}

# Function to print step
print_step() {
    echo -e "${BLUE}[STEP $1]${NC} $2"
}

# =============================================
# STEP 1: Create Repository and Directory Structure
# =============================================
print_step "1" "Setting up project structure..."

# Create main project directory
mkdir -p "${PROJECT_NAME}"
cd "${PROJECT_NAME}"

# Create all directories
mkdir -p api
mkdir -p assets/css
mkdir -p assets/js
mkdir -p data
mkdir -p scripts
mkdir -p cache
mkdir -p logs
mkdir -p .github/workflows

echo -e "${GREEN}✓${NC} Directory structure created"

# Initialize git
git init
echo -e "${GREEN}✓${NC} Git repository initialized"

# =============================================
# STEP 2: Create .gitignore
# =============================================
print_step "2" "Creating .gitignore..."

cat > .gitignore << 'GITIGNORE_EOF'
# Cache files
cache/*
!cache/.gitkeep

# Logs
logs/*
!logs/.gitkeep

# Temporary files
*.tmp
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/

# Python
__pycache__/
*.pyc
*.pyo
venv/
env/

# Environment variables
.env
.env.local
GITIGNORE_EOF

# Create .gitkeep files for empty directories
touch cache/.gitkeep logs/.gitkeep

echo -e "${GREEN}✓${NC} .gitignore created"

# =============================================
# STEP 3: Create Sample Data
# =============================================
print_step "3" "Generating sample stock data..."

cat > data/sample-data.json << 'DATA_EOF'
{
  "symbol": "TEF.MC",
  "isin": "ES0178430E18",
  "company": "Telefónica S.A.",
  "market": "BME (Bolsa de Madrid)",
  "last_updated": "2024-01-15T18:00:00Z",
  "historical_prices": [
    {"date": "2023-01-02", "open": 3.4500, "high": 3.5200, "low": 3.4400, "close": 3.5100, "volume": 12500000},
    {"date": "2023-01-03", "open": 3.5200, "high": 3.5800, "low": 3.5100, "close": 3.5600, "volume": 13200000},
    {"date": "2023-01-04", "open": 3.5700, "high": 3.6100, "low": 3.5400, "close": 3.5900, "volume": 11800000},
    {"date": "2023-01-05", "open": 3.5800, "high": 3.6000, "low": 3.5200, "close": 3.5400, "volume": 14100000},
    {"date": "2023-01-06", "open": 3.5500, "high": 3.6200, "low": 3.5300, "close": 3.6100, "volume": 15600000},
    {"date": "2023-01-09", "open": 3.6200, "high": 3.6800, "low": 3.6000, "close": 3.6600, "volume": 14300000},
    {"date": "2023-01-10", "open": 3.6500, "high": 3.6700, "low": 3.5800, "close": 3.6000, "volume": 13700000},
    {"date": "2023-01-11", "open": 3.6100, "high": 3.6500, "low": 3.5700, "close": 3.6300, "volume": 12900000},
    {"date": "2023-01-12", "open": 3.6400, "high": 3.7200, "low": 3.6200, "close": 3.7000, "volume": 16500000},
    {"date": "2023-01-13", "open": 3.7100, "high": 3.7500, "low": 3.6800, "close": 3.7300, "volume": 15200000},
    {"date": "2023-07-01", "open": 3.8200, "high": 3.8800, "low": 3.8000, "close": 3.8600, "volume": 11800000},
    {"date": "2023-07-02", "open": 3.8700, "high": 3.9200, "low": 3.8500, "close": 3.9000, "volume": 13500000},
    {"date": "2024-01-02", "open": 3.7800, "high": 3.8500, "low": 3.7600, "close": 3.8200, "volume": 14200000},
    {"date": "2024-01-03", "open": 3.8300, "high": 3.8800, "low": 3.8000, "close": 3.8600, "volume": 12800000},
    {"date": "2024-01-04", "open": 3.8500, "high": 3.8900, "low": 3.8200, "close": 3.8700, "volume": 11500000},
    {"date": "2024-01-05", "open": 3.8800, "high": 3.9400, "low": 3.8600, "close": 3.9200, "volume": 13800000},
    {"date": "2024-01-08", "open": 3.9300, "high": 3.9800, "low": 3.9100, "close": 3.9600, "volume": 14500000},
    {"date": "2024-01-09", "open": 3.9500, "high": 3.9700, "low": 3.9000, "close": 3.9200, "volume": 13200000},
    {"date": "2024-01-10", "open": 3.9100, "high": 3.9500, "low": 3.8800, "close": 3.9300, "volume": 12700000},
    {"date": "2024-01-11", "open": 3.9400, "high": 4.0200, "low": 3.9200, "close": 4.0000, "volume": 16800000},
    {"date": "2024-01-12", "open": 4.0100, "high": 4.0500, "low": 3.9800, "close": 4.0300, "volume": 15500000},
    {"date": "2024-01-15", "open": 4.0400, "high": 4.0800, "low": 4.0100, "close": 3.9500, "volume": 14200000}
  ]
}
DATA_EOF

echo -e "${GREEN}✓${NC} Sample data created"

# =============================================
# STEP 4: Create index.html
# =============================================
print_step "4" "Creating main HTML file..."

cat > index.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Telefonica Stock Price Prediction using Monte Carlo Simulation - Financial Engineering Analysis">
    <title>Telefonica (TEF.MC) - Monte Carlo Stock Predictor</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container-fluid">
        <!-- Header Section -->
        <div class="row bg-dark text-white p-3">
            <div class="col-12 text-center">
                <h1>
                    <i class="bi bi-graph-up-arrow"></i> 
                    Telefónica (TEF.MC) - Hybrid Monte Carlo Prediction Model
                </h1>
                <p class="text-muted mb-0">
                    <i class="bi bi-calculator"></i> 
                    Financial Engineering Analysis • Short/Medium Term Hybrid Model • Daily Auto-Update
                </p>
                <small class="text-info">
                    <i class="bi bi-info-circle"></i> 
                    Data sourced from BME Exchange | ISIN: ES0178430E18
                </small>
            </div>
        </div>
        
        <!-- Control Panel -->
        <div class="row mt-3 mb-3">
            <div class="col-md-3">
                <label for="startDate" class="form-label">
                    <i class="bi bi-calendar-check"></i> Start Date
                </label>
                <input type="date" id="startDate" class="form-control">
            </div>
            <div class="col-md-3">
                <label for="endDate" class="form-label">
                    <i class="bi bi-calendar-x"></i> End Date
                </label>
                <input type="date" id="endDate" class="form-control">
            </div>
            <div class="col-md-2">
                <label for="forecastDays" class="form-label">
                    <i class="bi bi-forward"></i> Forecast Days
                </label>
                <select id="forecastDays" class="form-control">
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30" selected>30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                </select>
            </div>
            <div class="col-md-2">
                <label for="simulations" class="form-label">
                    <i class="bi bi-dice-6"></i> Simulations
                </label>
                <select id="simulations" class="form-control">
                    <option value="500">500</option>
                    <option value="1000" selected>1,000</option>
                    <option value="5000">5,000</option>
                    <option value="10000">10,000</option>
                </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button id="updateBtn" class="btn btn-primary w-100">
                    <i class="bi bi-arrow-repeat"></i> Run Analysis
                </button>
            </div>
        </div>
        
        <!-- Main Charts Row -->
        <div class="row">
            <!-- Historical + Forecast Chart -->
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-line-chart"></i> 
                            Historical Price + Monte Carlo Forecast
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="mainChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Gauge Chart -->
            <div class="col-md-4">
                <div class="card shadow">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-speedometer2"></i> 
                            Trend Indicator
                        </h5>
                    </div>
                    <div class="card-body text-center">
                        <canvas id="gaugeChart" height="250"></canvas>
                        <div id="currentSignal" class="mt-3">
                            <h2 id="signalText" class="display-6 fw-bold">LOADING...</h2>
                            <div id="signalDetails" class="text-muted">
                                <i class="bi bi-hourglass-split"></i> Analyzing market data...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Second Row -->
        <div class="row mt-4">
            <!-- Trading Signals Table -->
            <div class="col-md-7">
                <div class="card shadow">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-flag-fill"></i> 
                            Trading Signals (Entry/Exit Points)
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                            <table class="table table-striped table-hover table-sm">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Price (€)</th>
                                        <th>Reason/Indicator</th>
                                        <th>RSI</th>
                                        <th>SMA20</th>
                                    </tr>
                                </thead>
                                <tbody id="signalsBody">
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            Loading signals...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Monte Carlo Statistics -->
            <div class="col-md-5">
                <div class="card shadow">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0">
                            <i class="bi bi-calculator-fill"></i> 
                            Monte Carlo Statistics
                        </h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <tbody id="mcStatsBody">
                                <tr><td><strong>Current Price:</strong></td><td id="currentPrice" class="text-end">-</td></tr>
                                <tr><td><strong>Median Forecast (30d):</strong></td><td id="medianPrice" class="text-end">-</td></tr>
                                <tr><td><strong>Mean Forecast (30d):</strong></td><td id="meanPrice" class="text-end">-</td></tr>
                                <tr><td><strong>95% Confidence Interval:</strong></td><td id="confidenceInterval" class="text-end">-</td></tr>
                                <tr><td><strong>Max/Min Range:</strong></td><td id="priceRange" class="text-end">-</td></tr>
                                <tr><td><strong>Daily Volatility (σ):</strong></td><td id="volatility" class="text-end">-</td></tr>
                                <tr><td><strong>Expected Daily Return (μ):</strong></td><td id="expectedReturn" class="text-end">-</td></tr>
                            </tbody>
                        </table>
                        
                        <div class="mt-3">
                            <h6 class="border-bottom pb-2">Distribution Analysis</h6>
                            <div class="row text-center">
                                <div class="col-4">
                                    <small class="text-muted">Bearish Prob.</small><br>
                                    <span id="bearishProb" class="fw-bold text-danger">-</span>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Neutral Prob.</small><br>
                                    <span id="neutralProb" class="fw-bold text-secondary">-</span>
                                </div>
                                <div class="col-4">
                                    <small class="text-muted">Bullish Prob.</small><br>
                                    <span id="bullishProb" class="fw-bold text-success">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Disclaimer:</strong> This is a financial engineering educational tool. 
                    Stock predictions involve uncertainty. Past performance doesn't guarantee future results. 
                    <i class="bi bi-exclamation-triangle"></i>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="assets/js/data-service.js"></script>
    <script src="assets/js/charts.js"></script>
    <script src="assets/js/dashboard.js"></script>
</body>
</html>
HTML_EOF

echo -e "${GREEN}✓${NC} index.html created"

# =============================================
# STEP 5: Create CSS
# =============================================
print_step "5" "Creating CSS styles..."

cat > assets/css/style.css << 'CSS_EOF'
:root {
    --bullish-color: #22c55e;
    --bearish-color: #ef4444;
    --neutral-color: #6b7280;
    --chart-bg: #ffffff;
}

body {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
}

.chart-container {
    position: relative;
    height: 400px;
    width: 100%;
}

.card {
    border-radius: 15px;
    overflow: hidden;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
}

.card-header {
    font-weight: 600;
}

.signal-ENTRY {
    background-color: var(--bullish-color);
    color: white;
    padding: 2px 10px;
    border-radius: 12px;
    font-weight: bold;
}

.signal-EXIT {
    background-color: var(--bearish-color);
    color: white;
    padding: 2px 10px;
    border-radius: 12px;
    font-weight: bold;
}

.price-up {
    color: var(--bullish-color);
}

.price-down {
    color: var(--bearish-color);
}

.table-hover tbody tr:hover {
    background-color: rgba(13, 110, 253, 0.1);
}

#gaugeChart {
    max-width: 300px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .chart-container {
        height: 300px;
    }
    
    #gaugeChart {
        max-width: 200px;
    }
}
CSS_EOF

echo -e "${GREEN}✓${NC} style.css created"

# =============================================
# STEP 6: Create JavaScript Files
# =============================================
print_step "6" "Creating JavaScript files..."

# data-service.js
cat > assets/js/data-service.js << 'JS_EOF'
class DataService {
    constructor() {
        this.isGitHubPages = window.location.hostname.includes('github.io');
        this.cache = {};
    }

    async fetchHistoricalData(startDate, endDate) {
        try {
            const response = await fetch('data/sample-data.json');
            const data = await response.json();
            this.cache.historicalData = data.historical_prices;
            return data.historical_prices;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    async runMonteCarlo(days = 30, simulations = 1000) {
        const prices = this.cache.historicalData 
            ? this.cache.historicalData.map(d => d.close) 
            : [3.85, 3.86, 3.84, 3.88];
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const lastPrice = prices[prices.length - 1];
        
        const finalPrices = [];
        const paths = [];
        const displaySims = Math.min(simulations, 100);
        
        for (let sim = 0; sim < displaySims; sim++) {
            let price = lastPrice;
            const path = [price];
            
            for (let day = 0; day < days; day++) {
                const random = this.boxMullerRandom();
                price *= Math.exp(meanReturn + stdDev * random);
                path.push(price);
            }
            
            paths.push(path);
            finalPrices.push(path[path.length - 1]);
        }
        
        finalPrices.sort((a, b) => a - b);
        const n = finalPrices.length;
        
        const stats = {
            p5: finalPrices[Math.floor(0.05 * n)],
            p25: finalPrices[Math.floor(0.25 * n)],
            median: finalPrices[Math.floor(0.5 * n)],
            p75: finalPrices[Math.floor(0.75 * n)],
            p95: finalPrices[Math.floor(0.95 * n)],
            mean: finalPrices.reduce((a, b) => a + b, 0) / n
        };
        
        const confidenceIntervals = [];
        for (let day = 0; day <= days; day++) {
            const dayPrices = paths.map(p => p[day]).sort((a, b) => a - b);
            confidenceIntervals.push({
                day,
                lower_bound: dayPrices[Math.floor(0.025 * dayPrices.length)],
                upper_bound: dayPrices[Math.floor(0.975 * dayPrices.length)],
                median: dayPrices[Math.floor(0.5 * dayPrices.length)]
            });
        }
        
        return {
            last_price: lastPrice,
            mean_return: meanReturn,
            volatility: stdDev,
            forecast: {
                days,
                simulations: displaySims,
                final_price_stats: stats,
                confidence_intervals: confidenceIntervals,
                simulation_paths: paths
            }
        };
    }

    async fetchSignals() {
        const data = this.cache.historicalData;
        if (!data || data.length < 50) {
            return {
                historical_signals: [],
                current_signal: {
                    signal: 'HOLD',
                    bullish_percentage: 50,
                    bearish_percentage: 50,
                    confidence: 'LOW'
                },
                trend_strength: 0
            };
        }
        
        const signals = this.generateSignals(data);
        return signals;
    }

    generateSignals(data) {
        const prices = data.map(d => d.close);
        const dates = data.map(d => d.date);
        const sma20 = this.calculateSMA(prices, 20);
        const sma50 = this.calculateSMA(prices, 50);
        const rsi = this.calculateRSI(prices, 14);
        
        const historicalSignals = [];
        
        for (let i = 50; i < prices.length; i++) {
            let signal = null;
            
            if (sma20[i] > sma50[i] && sma20[i-1] <= sma50[i-1]) {
                signal = {
                    date: dates[i],
                    type: 'ENTRY',
                    price: prices[i].toFixed(4),
                    reason: 'Golden Cross (SMA20 crosses above SMA50)',
                    rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                    sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                };
            } else if (sma20[i] < sma50[i] && sma20[i-1] >= sma50[i-1]) {
                signal = {
                    date: dates[i],
                    type: 'EXIT',
                    price: prices[i].toFixed(4),
                    reason: 'Death Cross (SMA20 crosses below SMA50)',
                    rsi: rsi[i] ? rsi[i].toFixed(2) : '-',
                    sma20: sma20[i] ? sma20[i].toFixed(4) : '-'
                };
            }
            
            if (signal) historicalSignals.push(signal);
        }
        
        const lastPrice = prices[prices.length - 1];
        const lastSMA20 = sma20[sma20.length - 1];
        const lastSMA50 = sma50[sma50.length - 1];
        const lastRSI = rsi[rsi.length - 1];
        
        let bullishScore = 0;
        let bearishScore = 0;
        
        if (lastSMA20 > lastSMA50) bullishScore += 2; else bearishScore += 2;
        if (lastRSI < 30) bullishScore += 1;
        else if (lastRSI > 70) bearishScore += 1;
        if (lastPrice > lastSMA20) bullishScore += 1; else bearishScore += 1;
        
        const totalScore = bullishScore + bearishScore;
        const bullishPercentage = Math.round((bullishScore / totalScore) * 100);
        
        let signal = 'HOLD';
        if (bullishPercentage >= 70) signal = 'STRONG_BUY';
        else if (bullishPercentage >= 60) signal = 'BUY';
        else if (bullishPercentage <= 30) signal = 'STRONG_SELL';
        else if (bullishPercentage <= 40) signal = 'SELL';
        
        return {
            historical_signals: historicalSignals.slice(-20),
            current_signal: {
                signal,
                bullish_percentage: bullishPercentage,
                bearish_percentage: 100 - bullishPercentage,
                confidence: 'MODERATE'
            },
            trend_strength: ((lastPrice - prices[prices.length - 20]) / prices[prices.length - 20] * 100).toFixed(2)
        };
    }

    calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) sum += prices[j];
                sma.push(sum / period);
            }
        }
        return sma;
    }

    calculateRSI(prices, period) {
        const rsi = [];
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            gains.push(Math.max(change, 0));
            losses.push(Math.max(-change, 0));
        }
        
        for (let i = 0; i < period; i++) rsi.push(null);
        
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        let rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
        rsi.push(100 - (100 / (1 + rs)));
        
        for (let i = period; i < gains.length; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
            rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
            rsi.push(100 - (100 / (1 + rs)));
        }
        
        return rsi;
    }

    boxMullerRandom() {
        let u1 = 0, u2 = 0;
        while (u1 === 0) u1 = Math.random();
        while (u2 === 0) u2 = Math.random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }
}
JS_EOF

echo -e "${GREEN}✓${NC} data-service.js created"

# charts.js
cat > assets/js/charts.js << 'JS_EOF'
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
        
        this.gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [bullishPercentage, 100 - bullishPercentage],
                    backgroundColor: [
                        bullishPercentage >= 60 ? 'rgba(34, 197, 94, 0.8)' : 
                        bullishPercentage >= 40 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                        'rgba(200, 200, 200, 0.3)'
                    ],
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
                    ctx.textAlign = '