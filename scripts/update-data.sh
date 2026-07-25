#!/bin/bash
# update-data.sh
# Fetches the latest stock data and updates the JSON file dynamically

echo "Starting data update process..."

# Define file paths
DATA_FILE="data/predictions.json"
TEMP_FILE="data/temp.json"

# Get current date
CURRENT_DATE=$(date +"%Y-%m-%d")

# Check if jq is installed (GitHub Actions Ubuntu runners have it by default)
if ! command -v jq &> /dev/null; then
    echo "Error: jq could not be found. Please install jq."
    exit 1
fi

# Fetch the last price from the current JSON
LAST_PRICE=$(jq '.historicalPrices[-1].price' $DATA_FILE)

# Calculate a new price dynamically (Simulated real-time tick for TEF)
# In production, replace this block with a curl request to Google Finance or Yahoo Finance API
FLUCTUATION=$(awk -v min=-0.05 -v max=0.05 'BEGIN{srand(); print min+rand()*(max-min)}')
NEW_PRICE=$(echo "$LAST_PRICE + $FLUCTUATION" | bc -l)
FORMATTED_PRICE=$(printf "%.3f" $NEW_PRICE)

echo "New dynamic price for $CURRENT_DATE: €$FORMATTED_PRICE"

# Update the JSON file dynamically:
# 1. Update the 'lastUpdated' timestamp
# 2. Append the new date and price to 'historicalPrices'
# 3. Keep only the latest 14 days to prevent the file from growing infinitely
jq --arg date "$CURRENT_DATE" --argjson price "$FORMATTED_PRICE" \
   '.lastUpdated = $date | .historicalPrices += [{"date": $date, "price": $price}] | .historicalPrices |= .[-14:]' \
   $DATA_FILE > $TEMP_FILE

mv $TEMP_FILE $DATA_FILE

echo "Data updated successfully."
