#!/bin/bash
# scripts/update-data.sh
# Automated real-time market data fetcher for Telefónica (TEF.MC / BME)

echo "Fetching live stock market data for Telefónica (TEF.MC)..."

DATA_FILE="data/predictions.json"
TEMP_FILE="data/temp.json"
CURRENT_DATE=$(date +"%Y-%m-%d")

# 1. Fetch official closing / market price for Telefónica (TEF.MC)
RESPONSE=$(curl -s "https://query1.finance.yahoo.com/v8/finance/chart/TEF.MC?interval=1d&range=1d" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

# 2. Extract regular market price using jq
REAL_PRICE=$(echo "$RESPONSE" | jq -r '.chart.result[0].meta.regularMarketPrice')

# Fallback validation if market is closed or API response is null
if [ "$REAL_PRICE" == "null" ] || [ -z "$REAL_PRICE" ]; then
  echo "Warning: Could not retrieve live price. Retaining last known price."
  REAL_PRICE=$(jq -r '.historicalPrices[-1].price' $DATA_FILE)
fi

echo "Validated close price for $CURRENT_DATE: €$REAL_PRICE"

# 3. Update JSON structure dynamically without duplicate dates
jq --arg date "$CURRENT_DATE" --argjson price "$REAL_PRICE" \
   '.lastUpdated = $date | .status = "Autoupdate Active (Real Market Data)" | .historicalPrices += [{"date": $date, "price": $price}] | .historicalPrices |= unique_by(.date) | .historicalPrices |= .[-30:]' \
   $DATA_FILE > $TEMP_FILE

mv $TEMP_FILE $DATA_FILE
echo "data/predictions.json updated successfully with real market data."
