#!/bin/bash

# =============================================
# Telefonica Stock - FULL REAL DATA Updater
# GitHub: edthedog-debug/telefonica-stock-predictor
# Downloads complete historical data from Yahoo Finance
# =============================================

set -e

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
DATE_TODAY=$(date +"%Y-%m-%d")

echo "========================================="
echo "🔄 Telefonica Stock - FULL DATA UPDATE"
echo "📅 ${TIMESTAMP}"
echo "========================================="

# =============================================
# DOWNLOAD FULL HISTORICAL DATA FROM YAHOO FINANCE
# =============================================
echo ""
echo "📊 Downloading FULL historical data from Yahoo Finance..."
echo "   (From 2020 to today)"

# Download all historical data
YAHOO_URL="https://query1.finance.yahoo.com/v7/finance/download/TEF.MC?period1=1577836800&period2=9999999999&interval=1d&events=history"

CSV_DATA=$(curl -s -L -H "User-Agent: Mozilla/5.0" "${YAHOO_URL}" 2>/dev/null || echo "")

if [ -z "$CSV_DATA" ] || [ "$(echo "$CSV_DATA" | wc -l)" -lt 5 ]; then
    echo "❌ Failed to download historical data"
    exit 1
fi

echo "✅ Downloaded $(echo "$CSV_DATA" | tail -n +2 | wc -l) days of real data"

# =============================================
# CONVERT CSV TO JSON
# =============================================
echo ""
echo "🔄 Converting CSV to JSON..."

python3 << PYEOF
import csv
import json
from datetime import datetime
from pathlib import Path

csv_data = """${CSV_DATA}"""

# Parse CSV
lines = csv_data.strip().split('\n')
reader = csv.DictReader(lines)

historical_prices = []
for row in reader:
    if row['Date'] and row['Close'] and row['Close'] != 'null':
        try:
            historical_prices.append({
                "date": row['Date'],
                "open": round(float(row['Open']), 4),
                "high": round(float(row['High']), 4),
                "low": round(float(row['Low']), 4),
                "close": round(float(row['Close']), 4),
                "volume": int(float(row['Volume']))
            })
        except:
            continue

# Sort by date
historical_prices.sort(key=lambda x: x['date'])

# Create data structure
data = {
    "symbol": "TEF.MC",
    "isin": "ES0178430E18",
    "company": "Telefónica S.A.",
    "market": "BME (Bolsa de Madrid)",
    "last_updated": datetime.now().isoformat(),
    "data_source": "Yahoo Finance (REAL DATA)",
    "total_records": len(historical_prices),
    "first_date": historical_prices[0]['date'] if historical_prices else "",
    "last_date": historical_prices[-1]['date'] if historical_prices else "",
    "historical_prices": historical_prices
}

# Save to file
data_file = Path("data/sample-data.json")
data_file.parent.mkdir(parents=True, exist_ok=True)

with open(data_file, "w") as f:
    json.dump(data, f, indent=2)

print(f"   ✅ Saved {len(historical_prices)} real historical records")
print(f"   📅 From: {data['first_date']}")
print(f"   📅 To: {data['last_date']}")
print(f"   💰 Last close: €{historical_prices[-1]['close']:.4f}")
PYEOF

# =============================================
# RUN MONTE CARLO WITH REAL DATA
# =============================================
echo ""
echo "🎲 Running Monte Carlo with REAL historical data..."

python3 << PYEOF
import json, numpy as np
from datetime import datetime

with open("data/sample-data.json", "r") as f:
    data = json.load(f)

prices = [d["close"] for d in data["historical_prices"]]
last_price = prices[-1]

# Calculate returns from real data
returns = np.diff(np.log(prices))
mu = np.mean(returns)
sigma = np.std(returns)

print(f"   📊 Real data points: {len(prices)}")
print(f"   📈 Daily drift (μ): {mu:.6f}")
print(f"   📉 Daily volatility (σ): {sigma:.6f}")
print(f"   💰 Current price: €{last_price:.4f}")

# Monte Carlo simulation
sims, days = 1000, 30
simulations = np.zeros((sims, days + 1))
simulations[:, 0] = last_price
np.random.seed(42)

for i in range(sims):
    shocks = np.random.standard_normal(days)
    for j in range(1, days + 1):
        simulations[i, j] = simulations[i, j-1] * np.exp(mu + sigma * shocks[j-1])

final = simulations[:, -1]

# Calculate statistics
pred = {
    "generated_at": datetime.now().isoformat(),
    "data_points_used": len(prices),
    "last_price": float(last_price),
    "parameters": {
        "mu_daily": float(mu),
        "sigma_daily": float(sigma),
        "mu_annualized": float(mu * 252),
        "sigma_annualized": float(sigma * np.sqrt(252))
    },
    "forecast_30d": {
        "percentile_5": float(np.percentile(final, 5)),
        "percentile_25": float(np.percentile(final, 25)),
        "median": float(np.percentile(final, 50)),
        "percentile_75": float(np.percentile(final, 75)),
        "percentile_95": float(np.percentile(final, 95)),
        "mean": float(np.mean(final)),
        "std": float(np.std(final)),
        "probability_up": float(np.mean(final > last_price) * 100),
        "expected_return_pct": float((np.mean(final)/last_price - 1) * 100)
    },
    "confidence_95": {
        "lower": float(np.percentile(final, 2.5)),
        "upper": float(np.percentile(final, 97.5))
    }
}

# Save predictions
with open("data/predictions.json", "w") as f:
    json.dump(pred, f, indent=2)

print(f"\n   🎯 PREDICTION (30 days):")
print(f"   📊 Median: €{pred['forecast_30d']['median']:.4f}")
print(f"   📈 Expected return: {pred['forecast_30d']['expected_return_pct']:.2f}%")
print(f"   🟢 Prob UP: {pred['forecast_30d']['probability_up']:.1f}%")
print(f"   📐 95% CI: €{pred['forecast_30d']['percentile_5']:.4f} - €{pred['forecast_30d']['percentile_95']:.4f}")
PYEOF

# =============================================
# UPDATE CURRENT PRICE ONLY (for daily runs)
# =============================================
echo ""
echo "📊 Fetching TODAY's closing price..."

CURRENT_PRICE=$(python3 -c "
import json
try:
    response = '''$(curl -s -L -H 'User-Agent: Mozilla/5.0' 'https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?interval=1d&range=1d' 2>/dev/null || echo '')'''
    if response:
        data = json.loads(response)
        price = data['chart']['result'][0]['meta']['regularMarketPrice']
        print(price)
except:
    pass
" 2>/dev/null || echo "")

if [ -n "$CURRENT_PRICE" ] && [ "$CURRENT_PRICE" != "null" ]; then
    echo "   ✅ Today's price: €${CURRENT_PRICE}"
else
    echo "   ⚠️  Market may be closed. Using last known price."
fi

echo ""
echo "========================================="
echo "✅ UPDATE COMPLETE - $(date)"
echo "   📁 Data: REAL from Yahoo Finance"
echo "   🔄 Next auto-update: Next trading day 19:30"
echo "========================================="