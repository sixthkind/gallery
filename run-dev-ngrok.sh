#!/usr/bin/env bash
set -euo pipefail

# Starts the Gallery dev stack + an ngrok tunnel to the Nuxt dev server.
# Nuxt dev server: http://localhost:3000
# Ngrok inspector:  http://127.0.0.1:4040

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found. Install it first." >&2
  exit 1
fi

if [[ -f .dev.pids ]]; then
  echo "Found .dev.pids from a previous run. If things are already running, stop them first (see stop-dev.sh)." >&2
fi

# Start dev servers
( npm start ) > devserver.log 2>&1 &
DEV_PID=$!

# Give Nuxt a moment to boot
sleep 2

# Start ngrok
( ngrok http "$PORT" --log=stdout ) > ngrok.log 2>&1 &
NGROK_PID=$!

printf "%s\n" "$DEV_PID" "$NGROK_PID" > .dev.pids

# Poll ngrok local API for the public URL
node - <<'NODE'
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

(async () => {
  const api = 'http://127.0.0.1:4040/api/tunnels';
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const { status, data } = await get(api);
      if (status === 200) {
        const json = JSON.parse(data);
        const tunnels = Array.isArray(json.tunnels) ? json.tunnels : [];
        const httpTunnel = tunnels.find(t => (t.proto === 'https' || t.proto === 'http') && t.public_url);
        if (httpTunnel) {
          console.log('NGROK_URL=' + httpTunnel.public_url);
          process.exit(0);
        }
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('NGROK_URL=UNKNOWN (check ngrok.log)');
})();
NODE

echo "\nLogs:" 
echo "- devserver.log" 
echo "- ngrok.log" 
