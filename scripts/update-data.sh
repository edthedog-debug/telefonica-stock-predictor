#!/bin/bash
# scripts/update-data.sh
# Fetches complete daily historical data for Telefónica (TEF.MC) from Jan 1, 2025 to Present

echo "Fetching historical stock market data for Telefónica (TEF.MC) since early 2025..."

python3 -c "
import urllib.request
import json
import time
import os
from datetime import datetime, timezone

# Ensure a wide time window including the end of the current day in UTC
now_utc = datetime.now(timezone.utc)
end_timestamp = int(now_utc.timestamp()) + 86400

# Add parameters to include adjusted closes and ensure the latest daily bar is captured
url = f'https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?period1=1735689600&period2={end_timestamp}&interval=1d&includeAdjustedClose=true'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        timestamps = result.get('timestamp', [])
        
        # Retrieve quote and adjusted close indicators
        quotes = result['indicators']['quote'][0]
        closes = quotes.get('close', [])
        adjclose = result.get('indicators', {}).get('adjclose', [{}])[0].get('adjclose', [])
        
        historical = []
        for i, ts in enumerate(timestamps):
            price = None
            if i < len(adjclose) and adjclose[i] is not None:
                price = adjclose[i]
            elif i < len(closes) and closes[i] is not None:
                price = closes[i]
                
            if price is not None:
                date_str = datetime.fromtimestamp(ts, timezone.utc).strftime('%Y-%m-%d')
                historical.append({'date': date_str, 'price': round(price, 3)})
        
        # Remove any potential duplicate dates
        seen = set()
        unique_historical = []
        for item in historical:
            if item['date'] not in seen:
                seen.add(item['date'])
                unique_historical.append(item)

        out_data = {
            'lastUpdated': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            'status': 'Autoupdate Active (Real BME Market Data since 2025)',
            'modelMetrics': {
                'ticker': 'TEF.MC (BME)',
                'exchange': 'BME Exchange',
                'currency': 'EUR (€)',
                'dataProvider': 'Yahoo Finance API',
                'architecture': 'Monte Carlo + Neural Network'
            },
            'historicalPrices': unique_historical
        }
        
        os.makedirs('data', exist_ok=True)
        with open('data/predictions.json', 'w', encoding='utf-8') as f:
            json.dump(out_data, f, indent=2)
            
        print(f'Successfully downloaded {len(unique_historical)} historical trading days up to date.')
except Exception as e:
    print(f'Error fetching market data: {e}')
    exit(1)
"

echo "data/predictions.json updated successfully."
