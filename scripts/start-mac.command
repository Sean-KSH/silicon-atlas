#!/bin/bash
# Double-click in Finder to install dependencies, start the dev server and open the app.
# Close this Terminal window (or press Ctrl+C) to stop the server.
cd "$(dirname "$0")/.." || exit 1

# Look for Node in the usual places if it is not already on PATH.
for d in /opt/homebrew/bin /usr/local/bin \
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin" \
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback"; do
  [ -d "$d" ] && PATH="$PATH:$d"
done
export PATH

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Install Node 20 or newer from https://nodejs.org and try again."
  read -r -p "Press Return to close."
  exit 1
fi
if command -v pnpm >/dev/null 2>&1; then PNPM=(pnpm); else PNPM=(npx --yes pnpm@10.34.9); fi

echo "Node $(node -v). Installing dependencies..."
if ! "${PNPM[@]}" install; then
  if [ -d node_modules/vite ]; then
    echo "pnpm reported a problem, but dependencies are present. Continuing."
  else
    read -r -p "Install failed. Press Return to close."
    exit 1
  fi
fi

echo "Starting Silicon Atlas at http://127.0.0.1:5173/ ..."
(sleep 4 && open "http://127.0.0.1:5173/") &
"${PNPM[@]}" dev
