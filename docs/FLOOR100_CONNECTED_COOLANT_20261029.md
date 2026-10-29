# Connected 100-rack cooling 3D & hypothetical isolation (2026-10-29)

## Why
Previous water lines were decorative and did not share endpoints with rack pipe traces. This revision generates a coherent axis-aligned set of 374 cuboid pipe segments: 2 gallery spines, 32 CDU connectors, 20 row headers and 320 rack manifold spurs/drops. Each route from 8 stylized CDU boxes to 80 conceptual compute racks has six orthogonal contiguous segments per channel. 160 supply/return paths and 960 route segments are audited against the physical 3D pipe segment bounds. A second audit reads back each InstancedMesh transform to verify all 748 actual 3D pipe endpoints are enclosed (0 misses), not simply trusting logical coordinates.

## Isolation *what-if*
Ten illustrated row shut-off valve status markers and eight CDU pump markers are provided. Row valve scenario isolates the chosen row; CDU pump failure marks only the nearest assigned rows as affected, with NO automatic rerouting. Concurrent faults are counted by affected-row union. The affected kW and L/min are the originally requested compute-only target, not a computed or measured post-isolation flow; there is no capacity redistribution or thermal prediction. User-editable load and ΔT continue to drive estimated demand. Supply/return display selection hides only the relevant 3D instanced pipe layer; fault status dims branch pipe instances and marker colors.

## Engineering boundaries
Fictional schematic scene units are not metres and are **not** the real pipe lengths in the Darcy–Weisbach hypothetical *sensitivity* panel. CDU mapping, pipe routing, valves and pump symbols are authored visualization, not NVIDIA as-built geometry. No CFD or validated hydronic solver, pump performance curve, real leak/valve/flow telemetry, pressure balancing, commissioning or safety certification. 20 fabric/storage rack coolant paths explicitly remain unmapped. NVIDIA's public rear-manifold architecture reference: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html

## QA
Run `node scripts/test-floor100-coolant-topology.mjs`, prior unit suites, and Chrome e2e desktop/mobile/tablet plus 2D fallback on isolated QA port on WIN11-181. Verify old 8788 still serves, GitHub Pages exact commit is successful, and live browser E2E passes after deployment.
