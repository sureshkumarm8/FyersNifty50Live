#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
  echo "✅ Loaded environment from .env.local"
else
  echo "⚠️  Warning: .env.local not found"
fi

# Use development mode (installs dev dependencies)
# IMPORTANT: Must be 'development' for npm to install devDependencies like vite
export NODE_ENV=development

echo ""
echo "🚀 Starting dev server with Redis support"
echo "   Data will be fetched from: Upstash Redis"
echo "   Backend: http://localhost:5001"
echo "   Frontend: http://localhost:5173"
echo ""

# .env.local points Redis at the local stand-in (scripts/localRedisServer.mjs on :5055).
# Start it unless it is already running; without it every Redis read fails (kill-switch
# status, history, discovery). It stops with this script.
REDIS_PID=""
if echo "${UPSTASH_REDIS_REST_URL:-}" | grep -q "localhost:5055"; then
  if lsof -nP -iTCP:5055 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Local Redis already running on :5055"
  else
    node scripts/localRedisServer.mjs &
    REDIS_PID=$!
    sleep 1
  fi
fi

# Start the backend server in the background
node server.js &
SERVER_PID=$!

# Start Vite dev server in the foreground
npx vite

# When Vite exits, kill the backend server
kill $SERVER_PID 2>/dev/null
[ -n "$REDIS_PID" ] && kill $REDIS_PID 2>/dev/null
