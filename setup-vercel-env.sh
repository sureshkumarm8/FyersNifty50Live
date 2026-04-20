#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you add all environment variables to Vercel in one go

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will guide you through setting up environment variables on Vercel."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo ""
    echo "Install it first:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Read the JSON config file
CONFIG_FILE="Nifty50_AI_config_tokens (7).json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo ""
    echo "Please ensure the file exists in the current directory."
    exit 1
fi

echo "📄 Reading config from: $CONFIG_FILE"
echo ""

# Extract values using node
PAYTM_API_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).paytm.apiKey")
PAYTM_API_SECRET=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).paytm.apiSecret")
PAYTM_ACCESS_TOKEN=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).paytm.accessToken")

FYERS_CLIENT_ID=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).fyers.clientId")
FYERS_SECRET_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).fyers.secretKey")
FYERS_ACCESS_TOKEN=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).fyers.accessToken")

GOOGLE_API_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).google.apiKey")
GROQ_API_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).groq.apiKey")
CLAUDE_API_KEY=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).claudeApiKey.apiKey")

BYPASS_MARKET_HOURS=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).config.bypassMarketHours")
REFRESH_INTERVAL=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE')).config.refreshInterval")

echo "🔍 Preview of values to be set:"
echo "  PAYTM_API_KEY: ${PAYTM_API_KEY:0:20}..."
echo "  FYERS_CLIENT_ID: $FYERS_CLIENT_ID"
echo "  GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:20}..."
echo ""

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔧 Setting environment variables on Vercel..."
echo ""

# Function to add env var
add_env() {
    local name=$1
    local value=$2
    
    if [ -z "$value" ] || [ "$value" == "undefined" ]; then
        echo "⚠️  Skipping $name (empty value)"
        return
    fi
    
    echo "Adding: $name"
    echo "$value" | vercel env add "$name" production --yes &> /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Added successfully"
    else
        echo "  ⚠️  Already exists or failed (check manually)"
    fi
}

# Add all environment variables
add_env "VITE_PAYTM_API_KEY" "$PAYTM_API_KEY"
add_env "VITE_PAYTM_API_SECRET" "$PAYTM_API_SECRET"
add_env "VITE_PAYTM_ACCESS_TOKEN" "$PAYTM_ACCESS_TOKEN"

add_env "VITE_FYERS_CLIENT_ID" "$FYERS_CLIENT_ID"
add_env "VITE_FYERS_SECRET_KEY" "$FYERS_SECRET_KEY"
add_env "VITE_FYERS_ACCESS_TOKEN" "$FYERS_ACCESS_TOKEN"

add_env "VITE_GOOGLE_API_KEY" "$GOOGLE_API_KEY"
add_env "VITE_GROQ_API_KEY" "$GROQ_API_KEY"
add_env "VITE_CLAUDE_API_KEY" "$CLAUDE_API_KEY"

add_env "VITE_BYPASS_MARKET_HOURS" "$BYPASS_MARKET_HOURS"
add_env "VITE_REFRESH_INTERVAL" "$REFRESH_INTERVAL"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Navigate to your project → Settings → Environment Variables"
echo "  3. Verify all variables are set"
echo "  4. Redeploy your project"
echo ""
echo "💡 To update a token in the future:"
echo "   vercel env rm VITE_PAYTM_ACCESS_TOKEN production"
echo "   echo 'new_token_here' | vercel env add VITE_PAYTM_ACCESS_TOKEN production"
echo ""
