# SPARK — Interactive 3D Engineering Board

A high-resolution, responsive hardware dashboard with an actual WebGL 3D PCB model. Built independently from the user-provided visual reference; this is a creative reinterpretation, not a pixel-identical copy of its original website.

## Live website

**https://trinhtanphat.github.io/spark-board-reference-20261027/**

The GitHub Pages website is published directly from `main` in branch mode (no custom GitHub Actions workflows). The same source is also served locally on WIN11-181 at `http://127.0.0.1:8788/` and, when running, through the separate ephemeral Cloudflare Quick Tunnel.

## 3D features

- Local, vendored Three.js 0.186.1; no third-party 3D CDN.
- Actual 3D circuit board: extruded eight-layer-inspired substrate, physically based metallic materials, central SPARK/FABLE 5.1 chip, surrounding chips, package pins, capacitors, dozens of component geometries, hundreds of solder vias and custom high-resolution PCB copper-trace texture.
- Adjustable orbit camera, drag to rotate, mouse wheel to zoom, 3D and top views, reset, zoom buttons, trace visibility control, motion control and selectable 3D components.
- Hardware-style diagnostics, 4 metric cards, animated simulated telemetry and code editor panel.
- WebGL2 fallback artwork with a meaningful status when GPU/WebGL is unavailable.
- Mobile-first 3D hero, responsive desktop and tablet layouts, accessible button labels and reduced-motion support.

All metrics and hardware statuses are **synthetic demonstration data**, not a live connection to a real PCB, chip, firmware or build pipeline.

## Development and tests

From the repository root:

```powershell
node server.js
node e2e-check.js
```

The local server allows only the website's exact public asset filenames. All other paths, including `.git/`, return HTTP 404. Chrome headless E2E tests use their own temporary profiles, validate real WebGL2 initialization with software GPU, controls, simulated metrics, JavaScript exceptions, and horizontal overflow on 1440px desktop, 768px tablet and 390px phone. The test writes ignored `test-*.png` screenshots.

## Dependencies and license

The JavaScript module files in `vendor/` are **Three.js**, installed from npm at version **0.186.1**, licensed under the MIT license. See `vendor/THREE-LICENSE.txt`. All other custom web files are original code for this demonstration.

This independent design project is not affiliated with Anthropic or any other referenced company.
