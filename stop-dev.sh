#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .dev.pids ]]; then
  echo "No .dev.pids file found; nothing to stop." >&2
  exit 0
fi

mapfile -t PIDS < .dev.pids
rm -f .dev.pids

for pid in "${PIDS[@]}"; do
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
  fi
done

echo "Stopped dev/ngrok (if they were running)."
