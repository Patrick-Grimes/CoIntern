## ApplyOS

Local-only application tracker for Apple Silicon Macs. Retro / PS1-inspired UI, offline Dock app via Tauri 2 + Next.js static export. Data stays on your machine in IndexedDB.

## Prerequisites (macOS Apple Silicon)

- Apple Silicon Mac (`aarch64`)
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)
- Xcode Command Line Tools (`xcode-select --install`)

```bash
# Confirm Apple Silicon Rust target
rustup target add aarch64-apple-darwin
```

## Install

```bash
npm install
```

## Develop

Web UI only (browser):

```bash
npm run dev
```

Open `http://localhost:3001/` — the dashboard is the entry page.

Native Dock app (requires macOS):

```bash
npm run tauri:dev
```

## Build the Mac app

On an Apple Silicon Mac:

```bash
npm run tauri:build
```

This runs `next build` (static export → `out/`), then packages **ApplyOS.app** for `aarch64-apple-darwin`.

Find the app under:

```
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/ApplyOS.app
```

### First open (Gatekeeper)

Unsigned local builds are quarantined. To open:

1. Right-click **ApplyOS.app** → **Open**
2. Confirm **Open** in the dialog

(Or move it to `/Applications` after the first trusted open.)

## Data + privacy

- Offline at runtime — no network calls from the app.
- Data lives in IndexedDB (`applyos`) inside the app’s webview store.
- Use **Export / Import** in the dashboard to back up or move data between machines.
- `recovery.html` can extract IndexedDB data as JSON if you ever need a standalone recovery path (open it in a browser against the same origin / after importing a backup).

Fresh installs start empty. Use **Add application** on the empty-state CTA to log your first entry.

## Tech

- Next.js App Router (`output: 'export'`) + React Compiler
- Zustand + IndexedDB (`idb`)
- Tauri 2 — bundle id `local.applyos.app`, Apple Silicon only
