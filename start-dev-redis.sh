#!/bin/bash

# Development server with Redis support (like production)
# This uses Vercel CLI to run serverless functions locally

echo "🚀 Starting Development Server with Redis"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  echo "Please create .env.local with Redis credentials"
  exit 1
fi

echo "✅ Environment file found"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo ""
fi

echo "🔧 Starting Vercel Dev (API functions + frontend)"
echo ""
echo "This will start:"
echo "  • Backend API functions (port 3000)"
echo "  • Frontend dev server (auto-detected)"
echo "  • Uses your Upstash Redis (production data)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run vercel dev (handles both frontend and API)
vercel dev
