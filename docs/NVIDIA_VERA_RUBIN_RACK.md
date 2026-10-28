# NVIDIA Vera Rubin NVL72 Rack — Architectural Visual Study

**Verified public architecture:** NVIDIA DGX Vera Rubin NVL72 user guide.

| Published component | Per rack | Notes |
| --- | ---: | --- |
| Compute trays | 18 | Each tray has 4 Rubin GPUs and 2 Vera CPUs |
| Rubin GPUs | 72 | 18 × 4 |
| Vera CPUs | 36 | 18 × 2 |
| NVLink 6 switch trays | 9 | Four NVSwitch ASICs each |
| NVSwitch ASICs | 36 | 9 × 4 |
| Top-of-rack management switches | 2 | Managed network hardware |
| Cooling | Liquid cooling | Real implementation uses manifolds and cold plates |
| Power | **4 power shelves** | **3 RU each, 110 kW rated per shelf, six 18.3 kW PSUs, 54 V DC busbar output** |
| Per compute tray | 2 ConnectX-9 I/O cards, 1 BlueField-4 DPU, 4 cache E1.S NVMe and 1 boot E1.S NVMe | Manufacturer-published components; not physically drawn to scale |

**What is real:** The component counts and per-tray architecture above are from NVIDIA documentation.

**What is illustrated:** All three-dimensional rack size, placement of front slots, position of the 9 NVLink trays, placement of switches and power shelves, panel design, colors, service rails, indicator LEDs, rear manifold and NVLink spine. These details are NOT reconstructed from official manufacturing CAD and do not represent installation or service procedures.

## Three model modes

1. **VERA RUBIN SUPERCHIP:** stylized 2× Rubin GPU + Vera CPU with optional conceptual cold plates.
2. **NVL72 RACK / 72 GPU:** schematic rack showing the 18 compute trays, 9 NVLink 6 switch trays, 4 power shelves and 2 TOR switches, with 72 GPU and 36 CPU indicators. Controls: orbit, zoom, inspect selected rack tray, take PNG.
3. **SPARK PCB REFERENCE:** preserved legacy fictional board with Route Explorer; no electrical netlist or production approval.

These modes are separate; showing the rack never certifies PCB connectivity, mechanical dimensions or manufacturing DRC. Browser 3D tests validate responsiveness, counts, switching, camera framing, inspector and export — not physical hardware compliance.

## Authoritative documentation

- https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/

## Local regression commands

```powershell
node scripts/test-nvidia-rack.mjs
node scripts/test-nvidia-product.mjs
node e2e-check.js
$env:TEST_NO_WEBGL='1'; node e2e-check.js
$env:TEST_WEBGL_RECOVERY='1'; node e2e-check.js
```

`node scripts/pcb-routing-audit.js --require-manufacturing-ready` must still exit with code 3 because there is no real board schematic/netlist.
## Revision: documented power shelves & rack tray explorer

The original demo used two generic power shelves. NVIDIA's hardware guide specifies **four** shelves at 3 RU each, with six air-cooled PSUs per shelf and 54 V DC busbar distribution. This revision corrects the modeled inventory and checks the counts against fixed official specifications. A rack tray navigator now provides 33 selectable elements (18 compute + 9 NVLink + 4 power + 2 TOR). The relative taller power shelf in the scene is an artistic approximation, **not a validated rack-unit drawing**. All data for display labels comes from NVIDIA's public hardware guide. Selecting a tray highlights the corresponding illustrated tray; this does not validate real locations, electrical connections or service procedures.


## Visual fidelity revision — 28 October 2026

This is a **closer artistic recreation**, not a 1:1 licensed replica of NVIDIA's rack. Compared with the prior simplified black/dark grid, the public WebGL rendering now includes:

- A dark outer cabinet with four corner posts, side enclosures, base/top rails, and an architectural rear panel.
- Champagne-gold metallic compute-tray faceplates and denser visible airflow grilles/fasteners to better resemble public NVIDIA rack photography.
- Dark NVLink switch band, management hardware and power shelves, with different surface treatments.
- Port silhouettes and separate GPU/CPU/NVSwitch visual indicators; repeated components are batched to limit draw calls.
- An interactive REAR / ON control showing *illustrative* NVLink cable cartridges, cord bundles, busbar-like spines and liquid-cooling manifolds. The 3D interaction does **not** encode NVIDIA's true copper network topology or coolant routing.

Grounding: NVIDIA's public images and official hardware user guide show a vertical black MGX-style rack, metal compute trays, rear NVLink passive-copper cable cartridge backplane and liquid manifold. The tray count and architecture are verified separately by the rack unit test.

**Not verified:** Individual front-panel cutout dimensions, enclosure width/depth/height, rack-slot ordering, port locations, hole pitch, enclosure part numbers, exact cable geometry, manifold coolant flow, pressure drops, tolerances, thermal capacity, power wiring, EMI compliance, service clearances, pinouts, assembly steps or production material finishes. These require actual NVIDIA/OEM CAD and installation drawings. Do not use this visualization for fabrication, procurement, infrastructure installation, physical maintenance or certification. The model intentionally does not reproduce NVIDIA's official logos as a fake manufacturer deliverable.

**Image reference:** https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/ and https://developer.nvidia.com/blog/nvidia-vera-rubin-pod-seven-chips-five-rack-scale-systems-one-ai-supercomputer/

**E2E scope:** verify front↔rear mode switching, GPU-synchronized rear PNG export, batching, rack tray inventory (18 compute + 9 NVLink + 4 power + 2 management), Superchip/PCB modes, and GPU context loss/recovery. The tests verify app behaviour and published inventory—not physical similarity to a proprietary CAD model.


## Conceptual service-tray inspection (28 October 2026)

An extra **PULL TRAY / OFF** button is now available beside Rack Tray Explorer. It temporarily slides a selected *illustrated* rack drawer forward and reveals a deliberately schematic package arrangement. This is a browser visualization, **not a maintenance manual or a physically validated tray sliding mechanism**.

The open-tray content is generated only for one selected drawer and is returned to storage when the selection changes, another model is selected, or the rear view is enabled. Its inspector shows:
- Compute tray: two concept Superchip carriers, each with 2 Rubin GPU indicators and 1 Vera CPU indicator, plus five schematic NVMe slots (four cache + one boot per the DGX hardware guide).
- NVLink 6 switch tray: four concept NVSwitch ASIC packages.
- Power shelf: six concept PSU modules.
- TOR switch: a simplified set of network module blocks with no exact published port layout.

These are **semantic count representations** sourced from the [official NVIDIA DGX VR hardware guide](https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html). They do not claim accurate board/rack dimensions, wiring, cooling, connector locations, tray extraction clearance, electrical/net topology, torque sequence, power isolation, safety, service procedure, or right to use NVIDIA original CAD. No data is exported as actual PCB or manufacturing geometry.

Visual performance: only the selected tray receives extra interior meshes. Other rack components reuse instance batches. Browser E2E verifies all three viewports, service selection/close, per-kind package counts, previous tray reset, rear-view lockout, PNG and WebGL recovery.

## Restored 3D rectangular rack frame and cuboid selection (28 October 2026)

Following feedback that the rectangular *box* disappeared after converting its outline to a flat face, the rack now has a **permanent 12-edge gold 3D cabinet wireframe** following only the approximate enclosure envelope (4.55 × 9.50 × 2.53 scene units). Selecting a tray now adds a **full-server 12-edge gold cuboid** (2.39 illustrative scene units deep) attached to that tray. The 3D box encompasses the entire modeled server chassis rather than only its front face or the entire rack. This preserves 3D depth in the top/isometric view without the previous oversized/skewed box. Rear inspection hides only the selected front-tray cuboid; the enclosing frame stays visible. Both are illustrative scene geometry, not physical NVIDIA dimensions.

## Precise whole-server click / 3D highlight (28 October 2026)

Each of the 33 illustrated rack slots now has an individual **full-chassis invisible picking volume** (3.96 x slot height x 2.39 scene units). It uses dedicated raycast layer 29, excluded from the rendering camera. Front, side and rear hits resolve to the correct tray without relying on global instanced front indicators or cabinet decorations. A selection draws a 12-edge **full-server** 3D gold cuboid at that tray's own transform; tray extraction moves this frame with the drawer. This is not the huge group BoxHelper that produced the earlier incorrect frame.

Mouse drag detection now ignores movements of up to 6px before treating a pointer as a rotate gesture. Browser E2E checks **actual Chrome mouse input** on compute and NVLink trays on desktop, mobile and tablet, including a one-pixel-movement click. Tests verify matching tray IDs in the inspector/dropdown and depth greater than 2 scene units, in addition to previous tray service, rear viewing, camera and data-center tests. These are approximate interaction volumes, not engineering collision geometry.

## Correct tray-selection highlight geometry (28 October 2026)

The old `THREE.BoxHelper` highlighted the entire depth of a selected rack tray and produced an oversized perspective rectangle at steep angles. The tray selector now uses a **fixed-size full-chassis 3D cuboid**, alongside the separate permanent 3D cabinet frame. The outline follows drawer extension, disappears during rear inspection, and is disposed on selection change. Other modes retain their previous BoxHelper behavior. This is a selection UI correction only; it does not imply exact NVIDIA mechanical dimensions.

## Rear infrastructure layered inspection (28 October 2026)

The REAR / ON camera now enables a **REAR LAYERS** selector: ALL SYSTEMS, NVLINK 6 / COPPER CARTRIDGES, LIQUID / MANIFOLDS, and POWER / 54 VDC BUSBAR. The rendered backplane contains **four illustrative cartridge columns**, two manifold pipes and two conceptual busbar rails. Single-system focus hides other rear systems but keeps the rack frame. Returning to the front restores all rear layers. Rack and service-drawer modes remain separate.

NVIDIA's [DGX VR NVL72 hardware guide](https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html) establishes the 4 power shelves, 54 V DC distribution, the rear manifolds, cable cartridge backplane and busbar. NVIDIA's [Vera Rubin POD architecture article](https://developer.nvidia.com/blog/nvidia-vera-rubin-pod-seven-chips-five-rack-scale-systems-one-ai-supercomputer) describes four NVLink cartridge assemblies. All modeled busbar dimensions, coolant taps, cable paths, colors and slot locations are invented **for visualization**; no physical electrical or fluid installation geometry is implied. Browser E2E checks front/rear state and subsystem visibility across desktop, tablet and mobile.


## Dense 16-rack GPU data center demo (28 October 2026)

The browser-only GPU Data Center has been expanded from **3** to **16** rack concepts in a **4 x 4** layout: **15 NVL72 compute racks plus one simulated network/fabric rack**. Each NVL72 rack has its own 18 compute trays (4 GPUs + 2 Vera CPUs each), 9 NVLink trays, 4 power shelves and 2 management switches. Total simulated inventory: **270 compute trays, 1080 Rubin GPUs, 540 Vera CPUs, 498 module positions**, with three conceptual network source port types per compute tray and an equal number of matching simulated fabric endpoints (1620 logical ports total). These source/target counts are the demo's simulation topology, NOT an assertion of real switch-port capability or officially supported fabrics.

The spacing is deliberately visually close: 4.16 x scene-unit horizontal pitch for 4.10-wide cabinets (a 0.06 scene-unit side gap); 3.15 deep-row pitch for 2.50-deep cabinets (a 0.65 scene-unit row gap). These values are **artistic scene units only** and must not be interpreted as ventilation aisle, service clearance, emergency access or compliant physical spacing. A selectable 4 x 4 floor map lets users navigate any of the 16 racks, and the default camera is elevated so rows behind the front row are visible.

The dense scene uses `THREE.InstancedMesh` for repeated chassis, posts and faceplates, with independent invisible raycast volumes and live per-slot drawer/replace operations. The existing simulation supports virtual 3-class networking, cable connect/disconnect, compatible slot replacement and JSON export. All changes are browser-side only and never control real equipment. Browser E2E checks the rack inventory, batched rendering, floor-selector UI, deployment semantics, and no-WebGL compatibility.

## Dense rack focus, precise 3D clicks and overview navigation (28 October 2026)

The 4x4 floor map now focuses the 3D camera on the selected rack, draws a dedicated 12-edge gold **whole-cabinet frame**, and draws a separate 12-edge gold box around the selected **individual server/slot**. The slot box travels with its conceptual drawer extension and returns when retracted; selection/Inspector/rack dropdown are synchronized. **ALL 16 RACKS / OVERVIEW** restores the complete scene, and camera 3D/TOP controls retain the rack focus until Reset.

A key interaction fix separates the selection geometry from hit testing: each simulated slot uses a thin, non-rendering front-face hit target on raycast layer 29, while the full-depth 3D server box is used strictly for visualization. This prevents elevated camera rays from hitting the wrong, higher server. Picking also accounts for the scene's scaled dimensions on mobile/tablet, re-centers correctly after viewport resizing, and allows pointer events through the read-only mobile Inspector body while keeping its Close button usable. Chrome E2E performs actual mouse click events on a focused rack's second compute module in desktop/mobile/tablet layouts; it verifies Inspector and slot selection plus return to the 16-rack overview. All dimensions, focus positions and clearances are visual-only and are not NVIDIA CAD or physical installation guidance.

## Front/rear rack fidelity and separated service aisles (28 October 2026)

The conceptual 4x4 data-center layout keeps the near-touching side-by-side cabinet pitch **X=4.16** for an illustrated cabinet width **4.10** (0.06 scene-unit gap). It increases the front-to-back row pitch from 3.15 to **5.25** for an illustrated cabinet depth **2.50**, providing **2.75 scene units of separation** between rows; three visually distinct floor service lanes now sit between the four rows. These are arbitrary visualization units and **NOT** safe or standards-compliant aisle/service clearances. No real hardware or networking is affected.

The 16-rack scene now has additional **front view** detail per slot: vent grille segments, service handles, compute IO/status ports, power-shelf PSU groups, switch port indicators. These GPU-batched fascia geometries follow the corresponding virtual tray when it is pulled and disappear when it is removed. The **rear service view** shows 4 stylized copper NVLink cable-cartridge columns per GPU rack (60), 2 illustrated cooling manifold pipes per GPU rack (30), 2 separate copper 54V DC busbar rails per GPU rack (30), indicative coolant fitting patterns and cartridge connector markers, rear-facing cabinet labels and rear-facing server connector plates. It is a visual study inspired by NVIDIA's [DGX Vera Rubin hardware guide](https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html) and [networking guide](https://docs.nvidia.com/dgx/dgxvr-user-guide/networking.html); module layout, colors, cable paths, pipe positions and electrical geometry are not NVIDIA CAD, engineering wiring or service instructions. The single fabric rack is also a simulation concept, not a verified real switch installation.

**REAR / SERVICE VIEW** switches the camera and enables rear-side slot clicks. **FRONT / FACE VIEW** returns to the front, preserving per-rack focus and Inspector. The rear view has a dedicated 498 non-rendering rear pick surfaces so choosing a compute tray from behind cannot accidentally select a different slot. Together with the 498 front surfaces, these remain on the separate raycast-only layer 29. Browser E2E verifies front and rear click events, aisle spacing and batching across desktop/mobile/tablet.

## Rear subsystem explorer and stable camera interactions (28 October 2026)

The Data Center **REAR SYSTEM** picker is available when **REAR / SERVICE VIEW** is active. It provides five choices: ALL SYSTEMS, NVLINK / CARTRIDGES, COOLANT / MANIFOLDS, 54 VDC BUSBARS, and SERVER REAR PANELS. Each filter masks only the corresponding instanced rear-detail geometry. Rack housings, selections, floor/aisle geometry, and simulated cabling are retained. These are stylized visualization groups, not real routing drawings or approved electrical installation plans.

Server rear-panel indicators are now slot-scoped instanced parts, synchronized with the module lifecycle: extending the drawer moves them by the same illustrated offset, removing the simulated module hides its panel geometry, and reinstalling a compatible module restores the panel. The UI tests inspect actual instance matrices (translation Z and Y-scale), not merely textual slot states. All 498 front and 498 rear interactive selection volumes remain independently addressable.

A previously intermittent click error was traced to a subtle global ambient yaw animation being applied to the **rack and 16-rack Data Center** while the pointer was used. To keep selection stable, ambient model rotation is now disabled only in those equipment-inspection modes; manual orbit, camera focus, 3D/top views, zoom and feature controls remain supported. Superchip and PCB showcase motion retain their existing behavior. Browser tests use an immediate scroll-to-scene and run actual mouse pointer input on desktop, tablet and mobile. This is a browser demo; it does not instruct live hardware servicing.

## Live 4×4 rack inventory board and keyboard navigation (28 October 2026)

The Data Center mini floor map now derives **per-rack live status** from the simulator itself: current module installation (33 slots per compute rack, 3 fabric slots), equivalent GPU/CPU inventory, connected simulated cables and currently extended drawer counts. It does not claim live hardware telemetry. The map uses three meaningful visual statuses: READY (all modules installed, no drawers pulled), SERVICE (at least one drawer extended) and MISSING (one or more simulated modules removed). A selected-rack summary updates synchronously when an action changes the virtual topology, and selection exposes detailed, accessible tooltips.

**PREV RACK / NEXT RACK** buttons cycle through all 16 rack IDs and preserve camera focus. For keyboard navigation, focus a rack button in the 4×4 map and use left/right to move one cabinet, or up/down to move one row (four cabinets). The browser app does not affect real servers, and these are simulated statuses rather than NVIDIA operational health readings.

New model unit tests validate summary correctness before/after cable changes, drawer extension, removal, reinstallation and reset. Browser regression checks verify map colors, summary texts, previous/next navigation, arrow-key navigation, and return to rack N while retaining the existing front/rear click and render tests.

## Network Cable Explorer for dense 16-rack visualization (28 October 2026)

The Data Center now has accessible NETWORK LINES and CABLE SCOPE selectors alongside its existing 4x4 rack status map. Cables are synthetic curves derived from the browser-only, three-network simulator, not real port positions or validated cable pathways. Users can show ALL FABRICS, INFINIBAND / COMPUTE, ETHERNET / STORAGE or ETHERNET / MANAGEMENT, and restrict displayed paths to the currently selected rack or all racks. A live visible/connected counter distinguishes filtered display from the number of simulated links. Selecting a virtual cable and clicking HIGHLIGHT SELECTED CABLE emphasizes just that logical link in the 3D view. Changing the selected rack updates the rack-scope filter; unplugging a highlighted cable clears the stale highlight; resetting the simulation restores zero links. This does not configure actual switches, fabrics or network devices.

The front/rear face filters and cable filters are independent. DrawnCable/visibleCable counters are read from actual 3D scene state; all existing interface constraints remain. The new E2E test constructs one link in each of the three fabric classes, checks filtering across rack A (two), rack B (one) and fabric rack F (three), validates highlighting and cleanup after disconnect, then restores the unfiltered state. Browser tests run for desktop, mobile and tablet; 2D fallback remains available.
