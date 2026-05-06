#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
  echo "✅ Loaded environment from .env.local"
else
  echo "⚠️  Warning: .env.local not found"
fi

# Use production-like mode (with Redis)
export NODE_ENV=development

echo ""
echo "🚀 Starting dev server with Redis support"
echo "   Data will be fetched from: Upstash Redis"
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:5173"
echo ""

# Start the backend server in the background
node server.js &
SERVER_PID=$!

# Start Vite dev server in the foreground
npx vite

# When Vite exits, kill the backend server
kill $SERVER_PID 2>/dev/null
