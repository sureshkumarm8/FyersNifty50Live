#!/bin/bash

# Quick token update script for Vercel
# Usage: ./update-token.sh paytm "new_token_here"
#    or: ./update-token.sh fyers "new_token_here"

PROVIDER=$1
NEW_TOKEN=$2

if [ -z "$PROVIDER" ] || [ -z "$NEW_TOKEN" ]; then
    echo "Usage: ./update-token.sh [paytm|fyers] \"your_new_token\""
    echo ""
    echo "Example:"
    echo "  ./update-token.sh paytm \"eyJ0eXAiOiJKV1Q...\""
    echo "  ./update-token.sh fyers \"eyJ0eXAiOiJKV1Q...\""
    exit 1
fi

if [ "$PROVIDER" == "paytm" ]; then
    VAR_NAME="VITE_PAYTM_ACCESS_TOKEN"
elif [ "$PROVIDER" == "fyers" ]; then
    VAR_NAME="VITE_FYERS_ACCESS_TOKEN"
else
    echo "❌ Invalid provider. Use 'paytm' or 'fyers'"
    exit 1
fi

echo "🔧 Updating $VAR_NAME on Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "Install it: npm install -g vercel"
    exit 1
fi

# Remove old value
echo "1️⃣ Removing old token..."
vercel env rm "$VAR_NAME" production --yes &> /dev/null

# Add new value
echo "2️⃣ Adding new token..."
echo "$NEW_TOKEN" | vercel env add "$VAR_NAME" production --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Token updated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Go to https://vercel.com/dashboard"
    echo "  2. Navigate to Deployments"
    echo "  3. Click 'Redeploy' on the latest deployment"
    echo ""
    echo "Or run: vercel --prod"
else
    echo ""
    echo "❌ Failed to update token"
    echo "Please update manually via Vercel dashboard"
fi
