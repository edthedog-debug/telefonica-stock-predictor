#!/bin/bash

# =============================================
# Telefonica Stock - REAL DATA Updater (FIXED)
# GitHub: edthedog-debug/telefonica-stock-predictor
# =============================================

set -e

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "========================================="
echo "🔄 Telefonica Stock - DATA UPDATE"
echo "📅 ${TIMESTAMP}"
echo "========================================="

# =============================================
# METHOD 1: Yahoo Finance CSV Download
# =============================================
download_yahoo_csv() {
    echo "📊 Method 1: Yahoo Finance CSV..."
    
    YAHOO_URL="https://query1.finance.yahoo.com/v7/finance/download/TEF.MC?period1=1577836800&period2=9999999999&interval=1d&events=history"
    
    CSV_DATA=$(curl -s -L --max-time 30 \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        -H "Accept: text/csv,application/json" \
        -H "Accept-Language: en-US,en;q=0.9" \
        "${YAHOO_URL}" 2>/dev/null || echo "")
    
    if [ -n "$CSV_DATA" ] && [ "$(echo "$CSV_DATA" | wc -l)" -gt 5 ]; then
        echo "   ✅ Downloaded $(echo "$CSV_DATA" | tail -n +2 | wc -l) rows"
        echo "$CSV_DATA" > /tmp/tef_data.csv
        return 0
    else
        echo "   ❌ Yahoo CSV failed"
        return 1
    fi
}

# =============================================
# METHOD 2: Yahoo Finance API
# =============================================
download_yahoo_api() {
    echo "📊 Method 2: Yahoo Finance API..."
    
    # Get current quote
    QUOTE_URL="https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?range=2y&interval=1d"
    
    RESPONSE=$(curl -s -L --max-time 30 \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        "${QUOTE_URL}" 2>/dev/null || echo "")
    
    if [ -n "$RESPONSE" ] && echo "$RESPONSE" | grep -q "regularMarketPrice"; then
        echo "$RESPONSE" > /tmp/tef_api.json
        echo "   ✅ API response received"
        return 0
    else
        echo "   ❌ Yahoo API failed"
        return 1
    fi
}

# =============================================
# METHOD 3: Alpha Vantage (free API)
# =============================================
download_alphavantage() {
    echo "📊 Method 3: Alpha Vantage..."
    
    API_KEY="demo"
    AV_URL="https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=TEF.MC&outputsize=full&apikey=${API_KEY}"
    
    RESPONSE=$(curl -s --max-time 30 "${AV_URL}" 2>/dev/null || echo "")
    
    if [ -n "$RESPONSE" ] && echo "$RESPONSE" | grep -q "Time Series"; then
        echo "$RESPONSE" > /tmp/tef_av.json
        echo "   ✅ Alpha Vantage response received"
        return 0
    else
        echo "   ❌ Alpha Vantage failed"
        return 1
    fi
}

# =============================================
# TRY ALL METHODS
# =============================================
SUCCESS=false

if download_yahoo_csv; then
    echo ""
    echo "🔄 Converting CSV to JSON..."
    
    python3 << 'PYEOF'
import csv, json
from datetime import datetime
from pathlib import Path

with open("/tmp/tef_data.csv", "r") as f:
    reader = csv.DictReader(f)
    prices = []
    for row in reader:
        if row['Date'] and row['Close'] and row['Close'] != 'null':
            try:
                prices.append({
                    "date": row['Date'],
                    "open": round(float(row['Open']), 4),
                    "high": round(float(row['High']), 4),
                    "low": round(float(row['Low']), 4),
                    "close": round(float(row['Close']), 4),
                    "volume": int(float(row['Volume']))
                })
            except:
                continue
    
    prices.sort(key=lambda x: x['date'])
    
    data = {
        "symbol": "TEF.MC",
        "isin": "ES0178430E18",
        "company": "Telefónica S.A.",
        "market": "BME (Bolsa de Madrid)",
        "last_updated": datetime.now().isoformat(),
        "data_source": "Yahoo Finance CSV (REAL DATA)",
        "total_records": len(prices),
        "first_date": prices[0]['date'] if prices else "",
        "last_date": prices[-1]['date'] if prices else "",
        "historical_prices": prices
    }
    
    Path("data").mkdir(parents=True, exist_ok=True)
    with open("data/sample-data.json", "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Saved {len(prices)} real records")
    print(f"📅 {prices[0]['date']} to {prices[-1]['date']}")
    print(f"💰 Last: €{prices[-1]['close']:.4f}")
PYEOF
    SUCCESS=true

elif download_yahoo_api; then
    echo ""
    echo "🔄 Converting API response to JSON..."
    
    python3 << 'PYEOF'
import json
from datetime import datetime
from pathlib import Path

with open("/tmp/tef_api.json", "r") as f:
    api_data = json.load(f)

result = api_data['chart']['result'][0]
timestamps = result['timestamp']
quotes = result['indicators']['quote'][0]
current_price = result['meta']['regularMarketPrice']

prices = []
for i in range(len(timestamps)):
    if quotes['close'][i] is not None:
        date = datetime.fromtimestamp(timestamps[i]).strftime('%Y-%m-%d')
        prices.append({
            "date": date,
            "open": round(float(quotes['open'][i]), 4) if quotes['open'][i] else 0,
            "high": round(float(quotes['high'][i]), 4) if quotes['high'][i] else 0,
            "low": round(float(quotes['low'][i]), 4) if quotes['low'][i] else 0,
            "close": round(float(quotes['close'][i]), 4),
            "volume": int(quotes['volume'][i]) if quotes['volume'][i] else 0
        })

prices.sort(key=lambda x: x['date'])

data = {
    "symbol": "TEF.MC",
    "isin": "ES0178430E18",
    "company": "Telefónica S.A.",
    "market": "BME (Bolsa de Madrid)",
    "last_updated": datetime.now().isoformat(),
    "data_source": "Yahoo Finance API (REAL DATA)",
    "total_records": len(prices),
    "first_date": prices[0]['date'] if prices else "",
    "last_date": prices[-1]['date'] if prices else "",
    "current_price": current_price,
    "historical_prices": prices
}

Path("data").mkdir(parents=True, exist_ok=True)
with open("data/sample-data.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"✅ Saved {len(prices)} records")
print(f"📅 {prices[0]['date']} to {prices[-1]['date']}")
print(f"💰 Current: €{current_price:.4f}")
PYEOF
    SUCCESS=true

elif download_alphavantage; then
    echo ""
    echo "🔄 Converting Alpha Vantage response..."
    
    python3 << 'PYEOF'
import json
from datetime import datetime
from pathlib import Path

with open("/tmp/tef_av.json", "r") as f:
    av_data = json.load(f)

time_series = av_data.get("Time Series (Daily)", {})

prices = []
for date_str, values in sorted(time_series.items()):
    prices.append({
        "date": date_str,
        "open": round(float(values["1. open"]), 4),
        "high": round(float(values["2. high"]), 4),
        "low": round(float(values["3. low"]), 4),
        "close": round(float(values["4. close"]), 4),
        "volume": int(values["5. volume"])
    })

data = {
    "symbol": "TEF.MC",
    "isin": "ES0178430E18",
    "company": "Telefónica S.A.",
    "market": "BME (Bolsa de Madrid)",
    "last_updated": datetime.now().isoformat(),
    "data_source": "Alpha Vantage (REAL DATA)",
    "total_records": len(prices),
    "first_date": prices[0]['date'] if prices else "",
    "last_date": prices[-1]['date'] if prices else "",
    "historical_prices": prices
}

Path("data").mkdir(parents=True, exist_ok=True)
with open("data/sample-data.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"✅ Saved {len(prices)} records")
print(f"📅 {prices[0]['date']} to {prices[-1]['date']}")
PYEOF
    SUCCESS=true

else
    echo ""
    echo "❌ ALL METHODS FAILED"
    echo "   Keeping existing data."
    exit 0
fi

# =============================================
# RUN MONTE CARLO PREDICTION
# =============================================
if [ "$SUCCESS" = true ]; then
    echo ""
    echo "🎲 Running Monte Carlo with real data..."
    
    python3 << 'PYEOF'
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
        "data_points": len(prices),
        "last_price": float(last_price),
        "parameters": {
            "mu_daily": float(mu),
            "sigma_daily": float(sigma),
            "mu_annual": float(mu * 252),
            "sigma_annual": float(sigma * np.sqrt(252))
        },
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
    
    print(f"   📊 Median 30d: €{pred['forecast_30d']['median']:.4f}")
    print(f"   📈 Expected return: {pred['forecast_30d']['expected_return_pct']:.2f}%")
    print(f"   🟢 Prob UP: {pred['forecast_30d']['prob_up']:.1f}%")
PYEOF
fi

echo ""
echo "========================================="
echo "✅ UPDATE COMPLETE - $(date)"
echo "========================================="