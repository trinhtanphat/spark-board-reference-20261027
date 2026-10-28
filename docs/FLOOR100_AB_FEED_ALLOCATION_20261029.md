# A/B hypothetical feeder load planner, AI Factory 100-rack demo
Date: 29 October 2026

This component is a **what-if electrical demand ALLOCATION**, not a test of actual load transfer, live rack consumption, PSU redundancy, generator/UPS backup, switchgear protection, electric safety, equipment topology, design approval or fault isolation. **All capacities are invented DEMO planning values**. It does not alter the physical equipment or the original SPARK 16-rack demonstration.

Public manufacturer research: NVIDIA DGX VR NVL72 hardware documentation (https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html) confirms AC whips from remote panels, four AC-to-54 VDC shelves and rack bus bar; it does not establish the 100-rack virtual site's 6/11/14 MW feed capacities, 50:50 division, transfer ability or demand measurements. Do not use these hypothetical values to size any system.

The independent model \`floor100-feed-allocation.mjs\` computes purely illustrative allocations based on \`buildFloor100PowerModel\`:
* Normal scenario: 50% assumed IT demand target on A, 50% on B.
* A-loss or B-loss scenario: 100% **hypothetical planning target** on the remaining route; NOT confirmation any electrical load actually moved or survived.
* Grid-loss scenario: all hypothetical IT demand shown as UNASSIGNED; no generator or UPS availability assumed.
* Capacity selector 6,000 / 11,000 / 14,000 kW per feed. The 10 row planning capacities are simple division by ten (not actual busway rating). An overload alert means the invented planning demand exceeds the invented planning capacity only. No actual network or rack is marked off.
* Default 100% load = 10,020 kW IT, each row 1,002 kW; Normal 5,010/5,010 kW; lost A => B target 10,020 kW vs fictional 6,000 kW capacity, planning excess 4,020 kW; grid loss unassigned 10,020 kW.
* Changing the simulated workload (100/80/60%) updates allocation, and changing incident also updates allocation. 20 instanced 3D row-end meters (two per row) and a responsive 10-row inspector show within/warning/over/unassigned. These are just stylized colored indicators.
* Export power-estimate JSON includes the labeled \`hypotheticalFeedPlan\` with explicit non-measurement language. No hidden telemetry or material from a logged-in site is copied. Browser-only and fully reversible.

Checks include numeric unit tests (capacity, scenarios, no mutation, overload and unassigned states), Chrome E2E controls/map/3D diagnostics with real rack navigation, original 100-rack and separate 16-rack/2D fallback.
