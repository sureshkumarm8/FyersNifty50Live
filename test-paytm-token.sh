#!/bin/bash

# Test script to verify Paytm token exchange

echo "Testing Paytm Token Exchange..."
echo ""

# Test token (use the one you got from OTP)
REQUEST_TOKEN="6d18120bed654c55887008bdd68d0439"
API_KEY="${PAYTM_API_KEY:-ebb89582a5214f3bbf93fa7f7866ce28}"
API_SECRET="${PAYTM_API_SECRET:-d145b65bf63c4c83a67d19d7bf3b70a7}"

echo "📝 Using:"
echo "  API Key: ${API_KEY:0:8}..."
echo "  Request Token: ${REQUEST_TOKEN}"
echo ""

echo "🔄 Calling Paytm API directly..."
curl -X POST "https://developer.paytmmoney.com/accounts/v2/gettoken" \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"${API_KEY}\",
    \"request_token\": \"${REQUEST_TOKEN}\",
    \"api_secret_key\": \"${API_SECRET}\"
  }" 2>&1 | python3 -m json.tool

