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

# Load existing predictions.json if available and not empty
existing_prices = {}
existing_sources = {}

file_path = 'data/predictions.json'
if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            if isinstance(existing_data, dict):
                for item in existing_data.get('historicalPrices', []):
                    if 'date' in item and 'price' in item:
                        existing_prices[item['date']] = item['price']
                        existing_sources[item['date']] = item.get('source', 'close')
    except Exception as e:
        print(f'Warning: Could not parse existing predictions.json ({e}), starting fresh.')

# Ensure a wide time window including the end of the current day in UTC
now_utc = datetime.now(timezone.utc)
end_timestamp = int(now_utc.timestamp()) + 86400

url = f'https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?period1=1735689600&period2={end_timestamp}&interval=1d&includeAdjustedClose=true'
req = urllib.request.Request(
    url, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
        if 'chart' not in data or not data['chart']['result']:
            raise ValueError('Invalid JSON structure returned by Yahoo Finance.')

        result = data['chart']['result'][0]
        timestamps = result.get('timestamp', [])
        
        quotes = result['indicators']['quote'][0]
        closes = quotes.get('close', [])
        adjclose = result.get('indicators', {}).get('adjclose', [{}])[0].get('adjclose', [])
        meta = result.get('meta', {})
        regular_price = meta.get('regularMarketPrice')

        historical_map = {}

        # First, load existing historical prices into our working map
        for date_str, price in existing_prices.items():
            historical_map[date_str] = {
                'date': date_str,
                'price': price,
                'source': existing_sources.get(date_str, 'close')
            }

        # Process new data from API
        for i, ts in enumerate(timestamps):
            price = None
            if i < len(adjclose) and adjclose[i] is not None:
                price = adjclose[i]
            elif i < len(closes) and closes[i] is not None:
                price = closes[i]

            date_str = datetime.fromtimestamp(ts, timezone.utc).strftime('%Y-%m-%d')

            if price is not None:
                historical_map[date_str] = {
                    'date': date_str,
                    'price': round(price, 3),
                    'source': 'Yahoo Finance'
                }
            elif regular_price is not None and date_str not in historical_map:
                historical_map[date_str] = {
                    'date': date_str,
                    'price': round(regular_price, 3),
                    'source': 'fallback'
                }

        # Sort historical prices chronologically by date
        sorted_historical = sorted(list(historical_map.values()), key=lambda x: x['date'])

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
            'historicalPrices': sorted_historical
        }
        
        os.makedirs('data', exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(out_data, f, indent=2)
            
        print(f'Successfully updated predictions.json with {len(sorted_historical)} total historical records.')

except Exception as e:
    print(f'Error fetching market data: {e}')
    exit(1)
"

echo "data/predictions.json updated successfully."
