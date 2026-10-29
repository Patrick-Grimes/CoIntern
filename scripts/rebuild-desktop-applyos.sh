#!/usr/bin/env bash
# Rebuild ApplyOS.app on Apple Silicon with the Readable PS1 overhaul branch.
# Run on Patrick's Mac (cloud cannot produce the Dock .app).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="cursor/applyos-ui-overhaul-d4c4"
NEEDLE="Improve ApplyOS readability"
BUNDLE="src-tauri/target/aarch64-apple-darwin/release/bundle/macos/ApplyOS.app"
DESKTOP_APP="${HOME}/Desktop/ApplyOS.app"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: this script must run on macOS Apple Silicon (not cloud/Linux)." >&2
  exit 1
fi

echo "==> fetching + checking out ${BRANCH}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

TIP="$(git log -1 --oneline)"
echo "==> tip: ${TIP}"
if ! git log -1 --format=%s | grep -q "${NEEDLE}"; then
  echo "error: tip is not the Readable PS1 overhaul commit. Aborting." >&2
  echo "       expected message containing: ${NEEDLE}" >&2
  exit 1
fi

echo "==> npm install + tauri:build"
npm install
npm run tauri:build

if [[ ! -d "${BUNDLE}" ]]; then
  echo "error: missing bundle at ${BUNDLE}" >&2
  exit 1
fi

echo "==> replacing Desktop ApplyOS.app"
# Quit running instance if present (ignore failures)
osascript -e 'tell application "ApplyOS" to quit' 2>/dev/null || true
sleep 1
rm -rf "${DESKTOP_APP}"
cp -R "${BUNDLE}" "${DESKTOP_APP}"

echo "==> launching Desktop ApplyOS.app"
open "${DESKTOP_APP}"

echo
echo "Done. Confirm: smoother Rubik body text + opaque white inputs in Add application."
echo "Bundle: ${BUNDLE}"
echo "Desktop: ${DESKTOP_APP}"
