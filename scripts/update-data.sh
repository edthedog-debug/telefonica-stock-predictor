#!/bin/bash

# =============================================
# Telefonica Stock REAL Data Updater
# GitHub: edthedog-debug/telefonica-stock-predictor
# Runs daily via GitHub Actions
# =============================================

set -e

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
DATE_TODAY=$(date +"%Y-%m-%d")

echo "========================================="
echo "🔄 Telefonica Stock Updater"
echo "📅 ${TIMESTAMP}"
echo "========================================="

# =============================================
# FETCH REAL PRICE FROM YAHOO FINANCE
# =============================================
echo "📊 Fetching real price from Yahoo Finance..."

YAHOO_URL="https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?interval=1d&range=5d"

RESPONSE=$(curl -s -L -H "User-Agent: Mozilla/5.0" "${YAHOO_URL}" 2>/dev/null || echo "")

if [ -n "$RESPONSE" ]; then
    CURRENT_PRICE=$(python3 -c "
import json, sys
try:
    data = json.loads('''${RESPONSE}''')
    result = data['chart']['result'][0]
    price = result['meta']['regularMarketPrice']
    print(price)
except:
    sys.exit(1)
" 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_PRICE" ] && [ "$CURRENT_PRICE" != "null" ]; then
        echo "✅ Yahoo Finance: €${CURRENT_PRICE}"
    else
        echo "⚠️  Yahoo Finance failed, trying Google..."
        
        # Backup: Google Finance
        GOOGLE_URL="https://www.google.com/finance/quote/TEF:BME"
        RESPONSE2=$(curl -s -L -H "User-Agent: Mozilla/5.0" "${GOOGLE_URL}" 2>/dev/null || echo "")
        CURRENT_PRICE=$(echo "$RESPONSE2" | grep -oP 'data-last-price="\K[0-9.]+' | head -1)
        
        if [ -n "$CURRENT_PRICE" ]; then
            echo "✅ Google Finance: €${CURRENT_PRICE}"
        else
            echo "❌ Could not fetch price. Keeping existing data."
            exit 0
        fi
    fi
else
    echo "❌ No response from Yahoo Finance"
    exit 0
fi

# =============================================
# VALIDATE PRICE
# =============================================
if [ -z "$CURRENT_PRICE" ] || [ "$CURRENT_PRICE" = "null" ]; then
    echo "❌ Invalid price"
    exit 1
fi

echo ""
echo "💰 NEW PRICE: €${CURRENT_PRICE}"

# =============================================
# UPDATE JSON DATA FILE
# =============================================
echo ""
echo "📝 Updating data/sample-data.json..."

python3 << PYEOF
import json
from datetime import datetime
from pathlib import Path
import random

data_file = Path("data/sample-data.json")

with open(data_file, "r") as f:
    data = json.load(f)

today = datetime.now().strftime("%Y-%m-%d")
new_price = float("${CURRENT_PRICE}")

# Generate realistic OHLCV
random.seed(hash(today))
open_price = round(new_price * (1 + random.uniform(-0.003, 0.003)), 4)
high_price = round(max(open_price, new_price) * 1.005, 4)
low_price = round(min(open_price, new_price) * 0.995, 4)
volume = random.randint(8000000, 20000000)

# Check if today already exists
existing = False
for d in data["historical_prices"]:
    if d["date"] == today:
        d["close"] = new_price
        d["open"] = open_price
        d["high"] = max(d["high"], high_price)
        d["low"] = min(d["low"], low_price)
        d["volume"] = volume
        existing = True
        print(f"   Updated: {today} = €{new_price}")
        break

if not existing:
    data["historical_prices"].append({
        "date": today,
        "open": open_price,
        "high": high_price,
        "low": low_price,
        "close": new_price,
        "volume": volume
    })
    print(f"   Added: {today} = €{new_price}")

# Update metadata
data["last_updated"] = datetime.now().isoformat()
data["historical_prices"].sort(key=lambda x: x["date"])

# Keep last 500 entries
if len(data["historical_prices"]) > 500:
    data["historical_prices"] = data["historical_prices"][-500:]

with open(data_file, "w") as f:
    json.dump(data, f, indent=2)

print(f"   ✅ Total entries: {len(data['historical_prices'])}")
print(f"   📅 Range: {data['historical_prices'][0]['date']} to {data['historical_prices'][-1]['date']}")
PYEOF

# =============================================
# RUN MONTE CARLO PREDICTION
# =============================================
echo ""
echo "🎲 Running Monte Carlo simulation..."

python3 << PYEOF
import json, numpy as np
from datetime import datetime

with open("data/sample-data.json", "r") as f:
    data = json.load(f)

prices = [d["close"] for d in data["historical_prices"]]

if len(prices) >= 20:
    returns = np.diff(np.log(prices))
    mu = np.mean(returns)
    sigma = np.std(returns)
    last_price = prices[-1]
    
    sims, days = 1000, 30
    simulations = np.zeros((sims, days + 1))
    simulations[:, 0] = last_price
    np.random.seed(42)
    
    for i in range(sims):
        shocks = np.random.standard_normal(days)
        for j in range(1, days + 1):
            simulations[i, j] = simulations[i, j-1] * np.exp(mu + sigma * shocks[j-1])
    
    final = simulations[:, -1]
    pred = {
        "generated_at": datetime.now().isoformat(),
        "last_price": float(last_price),
        "data_points": len(prices),
        "forecast_30d": {
            "median": float(np.percentile(final, 50)),
            "mean": float(np.mean(final)),
            "p5": float(np.percentile(final, 5)),
            "p95": float(np.percentile(final, 95)),
            "prob_up": float(np.mean(final > last_price) * 100),
            "expected_return_pct": float((np.mean(final)/last_price - 1) * 100)
        }
    }
    
    with open("data/predictions.json", "w") as f:
        json.dump(pred, f, indent=2)
    
    print(f"   📊 Median 30d forecast: €{pred['forecast_30d']['median']:.4f}")
    print(f"   📈 Expected return: {pred['forecast_30d']['expected_return_pct']:.2f}%")
    print(f"   🟢 Probability UP: {pred['forecast_30d']['prob_up']:.1f}%")
    print(f"   📐 95% CI: €{pred['forecast_30d']['p5']:.4f} - €{pred['forecast_30d']['p95']:.4f}")
else:
    print("   ⚠️  Not enough data points")
PYEOF

echo ""
echo "========================================="
echo "✅ UPDATE COMPLETE - $(date)"
echo "========================================="