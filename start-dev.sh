#!/bin/bash

# Start the backend server in the background
node server.js &
SERVER_PID=$!

# Start Vite dev server in the foreground
npx vite

# When Vite exits, kill the backend server
kill $SERVER_PID 2>/dev/null
