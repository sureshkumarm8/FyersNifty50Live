#!/bin/bash

# Enable local mode for development (uses in-memory storage, no Redis needed)
export LOCAL_MODE=true
export NODE_ENV=development

# Start the backend server in the background
node server.js &
SERVER_PID=$!

# Start Vite dev server in the foreground
npx vite

# When Vite exits, kill the backend server
kill $SERVER_PID 2>/dev/null
