# Power Path Explorer — 100-rack SPARK visual demo

Date: 2026-10-28. Source reference: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html

## Vendor facts (documentation only)
NVIDIA DGX Vera Rubin NVL72 user guide explains that AC whips feed the rack power shelves, which convert AC to 54 VDC distributed by a liquid-cooled rack bus bar. It lists four power shelves per NVL72 rack, two 100 A AC whips per shelf and 415–480 V AC input, but these details are NOT evidence of the specific multi-building or multi-rack UPS and dual-feed topology drawn in SPARK. No NVIDIA images, HTML, CAD, credentials or proprietary assets have been copied into this repository.

## Independent visual enhancement
The new independent module floor100-power-path.mjs generates a six-segment artistic path from the nearest of four conceptual UPS gallery points through an overhead service corridor A/B busway, a row spur and an individual rack's rear feed drop. Segment positions are deterministic functions of rack index/3D position, feed A or B, and the existing illustrated outage scenario. Changing the selected rack rebuilds the highlight at the newly selected cabinet. The browser viewer draws at most 12 bright 3D segment boxes in its own grouped scene layer — no 100-rack duplicate-path geometry, no per-frame animation overhead.

The UI offers OFF, BOTH A+B, ONLY A, ONLY B, with six named stages, feed-specific visual states and source gallery bank reference. The selected rack Watt/KW label remains an independent estimated IT load from the prior illustrative power model; it is never treated as real A/B utilization, breaker/UPS load, ampacity, power transfer, failover, availability or telemetry. The UI switches to the rear and opens the POWER layer when tracing. Clearing the trace leaves the currently selected rack/camera focus unchanged.

When an incident is selected, the corresponding highlighted A/B line becomes translucent. During fictional grid-loss both lines are dimmed even if the generator concept changes color: generator illumination does NOT claim validated transfer, restored supply or battery backup. The line is a depiction of visual topology only, not an OEM-approved electrical/wiring schematic or installer guide.

QA: stand-alone pure unit tests cover 4 incidents, A/B/off modes, exact six-segment continuity, changing rack coordinates, unsupported inputs and no real telemetry. Headless Chrome E2E tests exercise actual scene data and UI for R001/R100, camera side, POWER layer, feed filtering, scenario dimming and clearing. Run QA in isolated WIN11-181 port; leave original production and user Chrome session 2 unchanged.
