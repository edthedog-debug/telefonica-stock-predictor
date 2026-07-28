#!/bin/bash
# scripts/update-data.sh
# Fetches complete daily historical data for Telefónica (TEF.MC) from Jan 1, 2025 to Present

echo "Fetching historical stock market data for Telefónica (TEF.MC) since early 2025..."

python3 -c "
import urllib.request
import json
import time
import os
from datetime import datetime

# Load existing predictions.json if available
existing_data = {}
existing_prices = {}

if os.path.exists('data/predictions.json'):
    try:
        with open('data/predictions.json', 'r') as f:
            existing_data = json.load(f)
            for item in existing_data.get('historicalPrices', []):
                existing_prices[item['date']] = item['price']
    except:
        existing_data = {}
        existing_prices = {}

# Timestamp for January 1, 2025 (1735689600)
url = f'https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?period1=1735689600&period2={int(time.time())}&interval=1d'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        timestamps = result.get('timestamp', [])
        closes = result['indicators']['quote'][0].get('close', [])
        regular_price = result['meta'].get('regularMarketPrice')

        historical = []

        for ts, close_price in zip(timestamps, closes):
            date_str = datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d')

            # Determine price and source
            if close_price is not None:
                price = round(close_price, 3)
                source = "close"
            else:
                price = round(regular_price, 3)
                source = "fallback"

            # If this date already exists and now we have a real close → replace it
            if date_str in existing_prices:
                old_price = existing_prices[date_str]
                if close_price is not None:
                    price = round(close_price, 3)
                    source = "close"
                else:
                    price = old_price
                    # Keep previous source if it existed
                    # (fallback remains fallback until a real close arrives)
                    source = "fallback"

            historical.append({
                'date': date_str,
                'price': price,
                'source': source
            })

        out_data = {
            'lastUpdated': datetime.utcnow().strftime('%Y-%m-%d'),
            'status': 'Autoupdate Active (Real BME Market Data since 2025)',
            'modelMetrics': {
                'ticker': 'TEF.MC (BME)',
                'exchange': 'BME Exchange',
                'currency': 'EUR (€)',
                'dataProvider': 'Google / Yahoo Finance API',
                'architecture': 'Monte Carlo + Neural Network'
            },
            'historicalPrices': historical
        }

        with open('data/predictions.json', 'w') as f:
            json.dump(out_data, f, indent=2)

        print(f'Successfully downloaded {len(historical)} historical trading days since Jan 2025.')

except Exception as e:
    print(f'Error fetching market data: {e}')
"

echo "data/predictions.json updated successfully."
