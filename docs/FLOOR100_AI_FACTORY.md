# SPARK AI Factory — 100-rack single-floor 3D demo

## Scope and preserved features
New independent **AI FACTORY FLOOR / 100 RACKS** model mode complements (does not replace) the original 16-rack laboratory, NVL72 tray explorer, Vera Rubin Superchip and SPARK PCB reference. The original 16-rack equipment simulator continues to support selective module pull/install, port classes, virtual cabling, import/export/undo and browser-local session restore. This floor is a **separate visualization**, not 100 copies of the heavy 16-rack simulator.

## Visual layout (not engineering dimensions)
One open-plan floor with 100 cabinets, 10 rows by 10 columns: 80 illustrative NVL72-style compute racks, 10 network fabric racks and 10 storage racks (the latter two are artistic category labels, not a certified BOM). Each compute rack's illustrated 18 GPU compute-tray fascia, 9 NVLink switch fascia, 4 PSU shelves and 2 ToR elements are geometrically repeated. 80 × 72 = **5,760 modeled GPU equivalents**, not installed physical GPUs or a verified NVIDIA system topology.

Racks are close-packed across columns: 3.72 units wide with 3.82-unit center pitch (0.10-unit side gap); front/back rows have 2.52-unit illustrative rack depth with 5.70-unit pitch (3.18-unit free gap). Hot/cold aisle overlays alternate between adjacent rows. These are arbitrary Three.js scene units: **not meters, site service clearances or fire-code dimensions**.

## Infrastructure
- Cooling gallery: **8 CDU concepts**, **12 CRAH concepts** with highlighted coolant supply/return manifolds, aisle temperature zones and cross-rack header lines.
- Electrical service gallery: **4 UPS banks**, **8 battery cabinets**, **2 generator concepts**, overhead A/B power rail visualizations.
- Network paths: overhead fabric ribbons, separate from the existing detailed 16-rack virtual cable manager.
- Interactive controls: 10×10 rack map, focus any cabinet via map, dropdown or clicking the 3D cabinet; overview reset, front/rear orbit, system layer selector (all / cooling / power / network / airflow). Full 12-edge selection frame envelopes the selected cabinet.
- Renderer: aggressively batched per-material/per-zone **InstancedMesh** geometry for racks, front/rear faces, devices, coolant and UPS equipment. No continuous auto-rotation for large floor. Rendering remains responsive with desktop/mobile scaling and WebGL 2D fallback if unsupported.

This design is a **browser-only visualization**. No real temperature, electricity, load balancing, power failover, cooling hydraulics, rack elevation, cable topology, physical safety or NVIDIA CAD has been computed, certified, connected or deployed.

## QA and rollout rules
Test on WIN11-181 in an isolated QA server (TCP 8789), without restarting the existing 8788 local service or touching user's Chrome session 2. Validate floor unit tests, original 16-rack model tests, full headless Chrome E2E desktop/mobile/tablet, WebGL fallback and public GitHub Pages asset checks. Merge main only after QA passes. Preserve the existing production web until GitHub Pages is independently verified.


## Utility incident explorer and rear cabinet details (28 October 2026)

The BACKUP POWER SCENARIO control offers Normal A+B, simulated A feed loss, simulated B feed loss, and simulated grid loss. It changes the actual conceptual 3D materials for independent A/B overhead paths and rear busbars. During grid-loss illustration, two generator indicators illuminate. This is **not** an electrical failover design: no UPS autonomy, ATS transfer time, battery runtime, fuel consumption, capacity or N+1/2N redundancy is computed. The user interface clearly marks every state as illustration only.

The COOLING CIRCUIT VIEW control independently displays both supply and return, only supply, or only return geometry. The change affects the actual InstancedMesh visibility in the cooling group; it is not real thermal/hydraulic telemetry. Reset Utility View restores Normal A+B and both cooling paths. The modes preserve selected rack, front/rear view, row map and other system views. Compute-rack rear details now include 18 connector rows, status indicators and four illustrative rear PSU panels per rack. Detail is batched with instancing, not 80 individual sets of draw calls.

Browser E2E tests check all four power scenarios, both cooling paths, unsupported inputs, reset and actual mesh/material appearance on desktop/mobile/tablet, alongside existing tests. The simulation does not control physical equipment.

## Per-rack schematic route impact explorer (28 October 2026)

The 100-rack floor now has a live, clearly labeled **schematic feed-route visibility** overlay: a colored indicator on the front face of each of the 100 3D cabinets and matching colored status on the 10-by-10 floor map, including 10 row summary chips and a per-rack description. These indicators explicitly do **not** report power on/off, actual rack health, telemetry, thermal availability, ATS behavior, power capacity or validated redundancy. Every value is deterministically derived from the visible artwork and the selected A/B **illustration** scenario.

The current floor concept only contains indicative A/B feed stubs for 80 compute racks, alternated by schematic column parity (four A and four B compute racks in each row). Fabric and storage cabinets (20 racks) have no physical feed design in this model; they are marked **UNMAPPED** rather than incorrectly presented as healthy or unpowered. Under Normal, 80 schematic paths are visible. When visual A or B loss is selected, 40 indicated compute paths are dimmed, 40 remain shown and 20 are unmapped. When both grid paths are dimmed, 80 compute paths are dimmed and 20 remain unmapped; the conceptual generator indicator is illuminated, but no assumption is made that any rack has restored actual power.

A pure deterministic model lives in floor100-impact.mjs and is independently unit-tested for all 4 scenarios, counts per row, unmapped equipment, unsupported inputs and no mutation of input. The 3D scene uses a single InstancedMesh of 100 small front-panel indicator lights, updated by per-instance colors as the selection changes; no draw call per rack is added. The UI reads the same shared model for floor map, row chips and selected-rack details. E2E tests assert synchrony among visual scene materials, the 3D indicator colors, floor map and detailed text at desktop/mobile/tablet sizes. This is browser-only visual art, NOT an electrical engineering solution.

## NVIDIA public reference inspector (2026-10-28)

The floor has a **NVL72 HARDWARE INSPECTOR** anchored in NVIDIA's public DGX Vera Rubin NVL72 hardware documentation. On any compute rack, it can highlight the illustrative locations of 18 compute trays, nine NVLink 6 switch trays, four power shelves and two management TOR switches; rear inspection highlights our schematic NVLink cartridge columns, coolant rails and 54 VDC busbar rails. The controls switch the camera to the relevant front/rear service side, while preserving the original map, module overlays and utility scenarios. A bounded 18-instance highlight mesh avoids adding per-rack draw calls. Selecting a fabric or storage rack correctly indicates that the compute-rack layout is not modeled for that rack.

The factual per-rack component quantities and their source links are documented in `docs/NVL72_REFERENCE_AUDIT_20261028.md` and encoded in the independent `floor100-hardware.mjs` module. The rear cable/manifold/busbar highlight counts reflect this project's **artistic shapes**, not OEM physical quantities. No NVIDIA CAD, proprietary images or restricted files were copied. The browser UI exposes the official hardware guide for verification. This is not an exact clone of NVIDIA's documentation website or deployable rack hardware design.
