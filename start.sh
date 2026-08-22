#!/bin/sh
set -e

NGINX_PORT="${PORT:-8080}"
export DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

PORT=4000 node /app/backend/src/index.js &
BACKEND_PID=$!

for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://127.0.0.1:4000/health >/dev/null; then
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Backend failed to start"
    exit 1
  fi
  sleep 1
done

export PORT="$NGINX_PORT"
envsubst '${PORT}' < /app/nginx.prod.conf > /etc/nginx/sites-enabled/default
nginx -g 'daemon off;' &
NGINX_PID=$!

trap 'kill $BACKEND_PID $NGINX_PID 2>/dev/null; wait' TERM INT

while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $NGINX_PID 2>/dev/null; do
  sleep 1
done

wait $BACKEND_PID 2>/dev/null || true
wait $NGINX_PID 2>/dev/null || true
exit 1
