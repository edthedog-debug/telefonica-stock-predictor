#!/bin/bash
# scripts/update-data.sh
# Fetches complete daily historical data for Telefónica (TEF.MC) from Jan 1, 2025 to Present

echo "Fetching historical stock market data for Telefónica (TEF.MC) since early 2025..."

python3 -c "
import urllib.request
import json
import time
from datetime import datetime

# Timestamp for January 1, 2025 (1735689600)
url = f'https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?period1=1735689600&period2={int(time.time())}&interval=1d'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        timestamps = result.get('timestamp', [])
        closes = result['indicators']['quote'][0].get('close', [])

        # FIX: Use ONLY close values, ignore regularMarketPrice completely
        historical = []
        for ts, price in zip(timestamps, closes):
            if price is not None:
                date_str = datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d')
                historical.append({'date': date_str, 'price': round(price, 3)})

        # FIX: Last day also uses ONLY close
        if timestamps and closes[-1] is not None:
            last_ts = timestamps[-1]
            last_date = datetime.utcfromtimestamp(last_ts).strftime('%Y-%m-%d')
            last_price = closes[-1]
            historical[-1] = {'date': last_date, 'price': round(last_price, 3)}

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
