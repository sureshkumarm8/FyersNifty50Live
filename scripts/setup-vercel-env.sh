#!/bin/bash

# ==============================================
# Vercel Environment Variables Setup Script
# ==============================================
# This script helps you upload all environment variables to Vercel
# from your Nifty50_AI_config_tokens.json file

set -e  # Exit on error

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Install it with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check if config file exists
CONFIG_FILE="$HOME/Downloads/Nifty50_AI_config_tokens (3).json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found at: $CONFIG_FILE"
    echo ""
    echo "Please provide the path to your config file:"
    read -p "Path: " CONFIG_FILE
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "❌ File still not found. Exiting."
        exit 1
    fi
fi

echo "✅ Config file found: $CONFIG_FILE"
echo ""

# Parse JSON and extract values
echo "📖 Reading configuration..."

PAYTM_API_KEY=$(cat "$CONFIG_FILE" | grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
PAYTM_API_SECRET=$(cat "$CONFIG_FILE" | grep -o '"apiSecret"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
PAYTM_ACCESS_TOKEN=$(cat "$CONFIG_FILE" | grep -o '"accessToken"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
FYERS_CLIENT_ID=$(cat "$CONFIG_FILE" | grep -o '"clientId"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
FYERS_SECRET_KEY=$(cat "$CONFIG_FILE" | grep -o '"secretKey"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
GOOGLE_API_KEY=$(cat "$CONFIG_FILE" | grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' | tail -1 | sed 's/.*: *"\(.*\)"/\1/')
GROQ_API_KEY=$(cat "$CONFIG_FILE" | grep '"groq"' -A 3 | grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\(.*\)"/\1/')
BYPASS_MARKET_HOURS=$(cat "$CONFIG_FILE" | grep -o '"bypassMarketHours"[[:space:]]*:[[:space:]]*[^,}]*' | sed 's/.*: *\(.*\)/\1/')
REFRESH_INTERVAL=$(cat "$CONFIG_FILE" | grep -o '"refreshInterval"[[:space:]]*:[[:space:]]*[^,}]*' | sed 's/.*: *\(.*\)/\1/')

echo ""
echo "Found the following values:"
echo "  - PayTM API Key: ${PAYTM_API_KEY:0:20}..."
echo "  - PayTM API Secret: ${PAYTM_API_SECRET:0:20}..."
echo "  - PayTM Access Token: ${PAYTM_ACCESS_TOKEN:0:30}..."
echo "  - Fyers Client ID: $FYERS_CLIENT_ID"
echo "  - Fyers Secret Key: ${FYERS_SECRET_KEY:0:10}..."
echo "  - Google API Key: ${GOOGLE_API_KEY:0:20}..."
echo "  - Groq API Key: ${GROQ_API_KEY:0:20}..."
echo "  - Bypass Market Hours: $BYPASS_MARKET_HOURS"
echo "  - Refresh Interval: $REFRESH_INTERVAL"
echo ""

# Generate a random CRON_SECRET
CRON_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "🔐 Generated CRON_SECRET: ${CRON_SECRET:0:20}... (save this!)"
echo ""

# Ask for confirmation
echo "⚠️  This will upload environment variables to Vercel."
echo "Make sure you're in the correct Vercel project directory."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 0
fi

echo ""
echo "🔄 Uploading environment variables to Vercel..."
echo ""

# Set environment variables using Vercel CLI
vercel env add PAYTM_API_KEY production <<< "$PAYTM_API_KEY"
vercel env add PAYTM_API_SECRET production <<< "$PAYTM_API_SECRET"
vercel env add PAYTM_ACCESS_TOKEN production <<< "$PAYTM_ACCESS_TOKEN"

if [ ! -z "$FYERS_CLIENT_ID" ]; then
    vercel env add FYERS_CLIENT_ID production <<< "$FYERS_CLIENT_ID"
fi

if [ ! -z "$FYERS_SECRET_KEY" ]; then
    vercel env add FYERS_SECRET_KEY production <<< "$FYERS_SECRET_KEY"
fi

if [ ! -z "$GOOGLE_API_KEY" ]; then
    vercel env add GOOGLE_API_KEY production <<< "$GOOGLE_API_KEY"
fi

if [ ! -z "$GROQ_API_KEY" ]; then
    vercel env add GROQ_API_KEY production <<< "$GROQ_API_KEY"
fi

vercel env add BYPASS_MARKET_HOURS production <<< "$BYPASS_MARKET_HOURS"
vercel env add REFRESH_INTERVAL production <<< "$REFRESH_INTERVAL"
vercel env add CRON_SECRET production <<< "$CRON_SECRET"

echo ""
echo "✅ Environment variables uploaded successfully!"
echo ""
echo "📋 Summary:"
echo "  - PAYTM_API_KEY ✓"
echo "  - PAYTM_API_SECRET ✓"
echo "  - PAYTM_ACCESS_TOKEN ✓"
echo "  - FYERS_CLIENT_ID ✓"
echo "  - FYERS_SECRET_KEY ✓"
echo "  - GOOGLE_API_KEY ✓"
echo "  - GROQ_API_KEY ✓"
echo "  - BYPASS_MARKET_HOURS ✓"
echo "  - REFRESH_INTERVAL ✓"
echo "  - CRON_SECRET ✓"
echo ""
echo "🔐 Save your CRON_SECRET somewhere safe:"
echo "    $CRON_SECRET"
echo ""
echo "🚀 Next steps:"
echo "  1. Commit and push your code: git add . && git commit -m 'Add env support' && git push"
echo "  2. Deploy to Vercel: vercel --prod"
echo "  3. Check Vercel Dashboard → Cron Jobs"
echo ""
echo "✨ Done!"
