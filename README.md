# SPARK / The Bare Board

**Live static site:** https://trinhtanphat.github.io/spark-board-reference-20261027/

Responsive HTML/CSS/Canvas reference-inspired recreation of the user-provided SPARK hardware design video. Original code and dynamically drawn artwork; no full-image screenshot is used for the UI.

## Features
- Dual-pane desktop dashboard: code editor, animated wave scope, seeded procedural PCB, brand mark, diagnostics and four selectable metrics.
- Mobile vertical layout and tablet layout; mouse, touch and keyboard support.
- Fully deterministic Canvas generation. Demo metrics and statuses are **simulated**, not connected to hardware.
- **No frontend framework**, no build dependencies, no backend database, no API keys.
- Isolated Node.js HTTP test server with strict route allowlist and security headers.

## Local demo

Run `node server.js` and open `http://127.0.0.1:8788/`.

## Browser integration tests

Run `node e2e-check.js` (Windows 11, Node 24+, Google Chrome).
The test uses its **own isolated Chrome headless profile** and verifies desktop (1365), mobile (390), tablet (768), four metric cards, canvas, pause behavior, absence of JS exceptions, and viewport overflow. It saves local screenshots to `test-*.png` (ignored by Git).

## Deployment

Static source is directly publishable from `main` using GitHub Pages in **branch (legacy) mode** with `.nojekyll` so no user-authored GitHub Actions workflow is required. It also runs through an optional Cloudflare Quick Tunnel, though those URLs are ephemeral.

## Scope and attribution

An independent visual reconstruction inspired by a provided screenshot. Not affiliated with Anthropic or the original designer. For accurate hardware telemetry, real data sources and authentication must be added separately.
