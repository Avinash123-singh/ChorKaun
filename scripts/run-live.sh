#!/bin/bash
# Start ChorKaun production stack + public HTTPS tunnel.
set -e
cd "$(dirname "$0")/.."

echo "Building and starting Docker..."
docker build -t chorkaun:prod . -q
docker rm -f chorkaun-test 2>/dev/null || true
docker run -d --name chorkaun-test --restart unless-stopped -p 8080:8080 chorkaun:prod

echo "Waiting for health..."
for i in $(seq 1 20); do
  if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
    echo "✓ Backend healthy"
    break
  fi
  sleep 1
done

pkill -f "cloudflared tunnel --url http://127.0.0.1:8080" 2>/dev/null || true
sleep 1

echo "Starting Cloudflare tunnel..."
LOG=/tmp/chorkaun-tunnel.log
cloudflared tunnel --url http://127.0.0.1:8080 > "$LOG" 2>&1 &
sleep 6
URL=$(grep -o 'https://[^ ]*trycloudflare.com' "$LOG" | head -1)

echo ""
echo "=========================================="
echo "  ChorKaun is LIVE"
echo "  Local:  http://127.0.0.1:8080"
if [ -n "$URL" ]; then
  echo "  Public: $URL"
else
  echo "  Public: (check $LOG for URL)"
fi
echo "=========================================="
echo "Keep this Mac awake. Tunnel stops if Mac sleeps."
