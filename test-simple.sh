#!/bin/bash
# Simple PayTM API test

source .env.local

echo "Testing PayTM API..."
echo "Token: ${PAYTM_ACCESS_TOKEN:0:50}..."
echo ""

# Test with single stock
curl -s "https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:3351:EQUITY" \
  -H "x-jwt-token: $PAYTM_ACCESS_TOKEN" \
  -H "Accept: application/json" | jq '.'

