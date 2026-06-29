#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8765}"
CODEX_BIN="${CODEX_BIN:-codex}"
URL="http://${HOST}:${PORT}/"

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Codims already running at ${URL}"
  if command -v open >/dev/null 2>&1; then
    open "${URL}"
  fi
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found" >&2
  exit 1
fi

echo "Starting Codims at ${URL}"
if command -v open >/dev/null 2>&1; then
  (sleep 1 && open "${URL}") &
fi

exec python3 server.py --host "${HOST}" --port "${PORT}" --codex-bin "${CODEX_BIN}"
