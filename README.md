# SPARK — Interactive 3D Engineering Board

A high-resolution, responsive hardware dashboard with an actual WebGL 3D PCB model. Built independently from the user-provided visual reference; this is a creative reinterpretation, not a pixel-identical copy of its original website.

## Live website

**https://trinhtanphat.github.io/spark-board-reference-20261027/**

The GitHub Pages website is published directly from `main` in branch mode (no custom GitHub Actions workflows). The same source is also served locally on WIN11-181 at `http://127.0.0.1:8788/` and, when running, through the separate ephemeral Cloudflare Quick Tunnel.

## 3D features

- Local, vendored Three.js 0.186.1; no third-party 3D CDN.
- Actual 3D circuit board: extruded eight-layer-inspired substrate, physically based metallic materials, central SPARK/FABLE 5.1 chip, surrounding chips, package pins, capacitors, dozens of component geometries, hundreds of solder vias and custom high-resolution PCB copper-trace texture.
- Adjustable orbit camera, drag to rotate, mouse wheel to zoom, 3D and top views, reset, zoom buttons, trace visibility control, motion control and selectable 3D components.
- **Exploded 8-layer teaching view** with independently rendered conceptual routing planes and selectable 3D component inspection panels.
- **Export PNG** of the WebGL board using the download control; the render is generated locally in the browser.
- Keyboard shortcuts: **E** explode/assemble, **R** reset camera, **Q** cycle quality, **Esc** close inspector, arrow keys rotate while board has keyboard focus.
- Adaptive rendering resolution for handheld devices and support for reduced-motion preferences.
- Hardware-style diagnostics, 4 metric cards, animated simulated telemetry and code editor panel.
- WebGL2 fallback artwork with a meaningful status when GPU/WebGL is unavailable.
- Mobile-first 3D hero, responsive desktop and tablet layouts, accessible button labels and reduced-motion support.

All metrics and hardware statuses are **synthetic demonstration data**, not a live connection to a real PCB, chip, firmware or build pipeline.


## Render optimization (October 2026)

- **GPU instancing:** repeated IC package leads and cylindrical capacitor parts use instanced meshes rather than separate draw calls. Shared box geometry is cached; chip picking/inspection remains interactive.
- **Adaptive textures:** PCB and central-chip texture canvases use half-size backing images on mobile/tablet while preserving sharp desktop assets. The quality menu still offers Auto, Eco and Ultra.
- **Adaptive lighting:** mobile disables expensive directional shadow mapping in Auto. Eco/Auto-Eco reduce the two accent point-light intensities as well as pixel ratio and render cadence.
- **Touch interactions:** touch-drag rotates the 3D PCB; a two-finger pinch zooms the camera inside the model viewport. Use the rest of the page to scroll vertically. Native page pinch-zoom remains browser-dependent.
- Browser integration tests verify single-finger rotation and two-finger zoom via pointer events, the approximate number of draw calls, export PNG and the previous camera/inspector controls. These tests run with **software-rendered WebGL in headless Chrome**; FPS is not a benchmark for real GPU hardware.

## Development and tests

From the repository root:

```powershell
node server.js
node e2e-check.js
```

The local server allows only the website's exact public asset filenames. All other paths, including `.git/`, return HTTP 404. Chrome headless E2E tests use their own temporary profiles, validate real WebGL2 initialization with software GPU, controls, simulated metrics, JavaScript exceptions, and horizontal overflow on 1440px desktop, 768px tablet and 390px phone. The test writes ignored `test-*.png` screenshots and checks inspect, exploded layer state, camera controls and JavaScript errors on all three form factors.

## Dependencies and license

The JavaScript module files in `vendor/` are **Three.js**, installed from npm at version **0.186.1**, licensed under the MIT license. See `vendor/THREE-LICENSE.txt`. All other custom web files are original code for this demonstration.

This independent design project is not affiliated with Anthropic or any other referenced company.

## Quality and resilience

- The renderer provides **AUTO / ECO / ULTRA** settings via the top-of-canvas quality button (shortcut **Q**). AUTO chooses a device-aware pixel ratio and frame cap; if two consecutive FPS sampling intervals drop below 16 FPS, AUTO switches to a lower resolution and disables shadow rendering for the rest of that AUTO session. ECO prioritizes battery usage and ULTRA sharpness.
- A live FPS counter replaces the static "renderer active" diagnostic after initialization. Actual results depend on the GPU, available memory, screen size, and browser. Software-only WebGL used in CI-like headless Chrome can render far more slowly than a real graphics adapter.
- WebGL context loss displays a reconnecting state and retained 2D fallback; renderer state is reconfigured after the browser restores the graphics context.
- Missing or slow WebGL module loading also produces an explicit "module loading" status after 10 seconds instead of an indefinitely opaque initialization message.
- The browser-test script runs in an **isolated temporary Chrome profile** and never uses an active user browser session. Optional context-loss QA is available by setting `TEST_WEBGL_RECOVERY=1` while running `node e2e-check.js`.

## Render-on-demand in Pause mode

The scene no longer redraws continuously after Pause. Pending camera and exploded-layer transitions are resolved to their target poses, then WebGL submissions stop until the user changes the view, toggles a layer, selects a component, changes render quality, or requests PNG export. Resume restores normal animation. The HUD reports **GPU IDLE · PAUSED**.

The Chrome E2E suite checks that total render submissions stay unchanged during a settled Pause interval and increase again when zooming while paused. This verifies fewer redundant WebGL submissions, not a measured electricity or battery saving. The render loop still uses `requestAnimationFrame` for state checks; hardware performance still requires direct testing.

## October 2026 — Realistic PCB studio redesign

This release replaces the earlier neon/cyberpunk procedural model with a **manufacturing-inspired, studio-lit reference assembly**. It features matte green FR-4 solder mask, restrained ENIG-style metal contacts, plated annular rings, subdued exposed routing, authentic-looking silkscreen and matte black laser-marked IC packages.

New modeled features include distributed 0402/0603-style SMD passive banks, solder terminations, inductors, a metal-can quartz resonator, a USB Type-C receptacle, two-row debug header, tactile reset switch, regulator shield and accessible test points. These components use a mix of shared/instanced geometries and independent selectable model groups. The inspector now names the newly modeled packages.

The hero uses neutral key/fill studio lighting, a contact-shadow plane and quieter PBR materials rather than neon lights, colored starfields and glowing outlines. Camera framing has been updated while preserving zoom/orbit, Top View, eight **conceptual** exploded layers, PNG export, simulated telemetry and GPU quality options.

**Engineering scope:** The board, PCB routing and component footprints are artistically modeled. They are **not real KiCad/Altium board files, Gerbers, validated electrical circuits or manufacturing-ready data**. The product-render styling should not be taken as a claim of electrical functionality.

Local verification: `node e2e-check.js`, with `TEST_WEBGL_RECOVERY=1` for optional simulated context-loss recovery.
## Machined mounting holes and deterministic screenshot capture

- The four corner holes now cut through **both** the FR-4 solid geometry and textured solder-mask surface, rather than being dark circles painted onto a solid board. Each has a plated ring and open barrel wall. Custom UV remapping keeps top-side PCB legends aligned after triangulating the perforated mask.
- The browser test raycasts the hole centers and adjacent copper-mask/FR-4 areas in transformed world coordinates, including the smaller mobile scale, so regression tests detect fake or blocked holes.
- Browser PNG export now forces a fresh WebGL render, waits for GPU completion before readback, and checks for an actual nonempty PNG. This improves reliability when the user switches rendering quality immediately before exporting.
- The model remains a **visual, non-manufacturing reference**. Hole sizes, mounting clearances and footprints are illustrative, not validated mechanical or electronic design data.
