# SPARK 100-rack AI Factory: visual electrical model (28 October 2026)

## Critical limitation
Browser-only demonstration: NOT real power meter readings, NVIDIA watt consumption ratings, engineering CAD, electrical safety design, verified 2N/N+1 redundancy, ATS/UPS specifications or physical operating instructions. Never size circuit breakers, busways, UPS, generator or cooling plant from these values.

## Public references
NVIDIA DGX Vera Rubin NVL72 Hardware Guide (https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html) specifies four power shelves, AC input conversion to a liquid-cooled 54V DC busbar and external AC whips. The rating of the power shelves does not establish actual rack draw. All watt figures below are deliberately FICTITIOUS DEMO ASSUMPTIONS.

## Power assumptions (100% selector)
80 illustrated compute racks at 120 kW each (140 kW assumed peak); ten fabric racks at 18 kW each (24 kW peak); ten storage racks at 24 kW each (32 kW peak). Default estimated IT total 10,020 kW = 10,020,000 W, or 1,002 kW per row. Assumed peak IT total 11,760 kW; fake PUE factor 1.20 implies 12,024 kW of facility load. These are not measured, vendor-certified or site-verified.

Workload selector supports 60%, 80%, 100% multipliers on assumed IT draw, separately from peak; heatmap groups visualize the resulting estimates per rack. Feed A/B outage modes DIM colored 3D busways; they do not calculate true load transfer, generator operation or electrical failure, and estimated IT demand stays a hypothetical target.

## Stylized 3D cable routing
Distinct colored A and B overhead busway lines span ten rows and connect to the modeled UPS gallery with fictional risers. Two overhead branches reach every cabinet's rear panel: 200 paired feed drops (including 20 fabric/storage racks), elbow segments, rear-side connector panels. Battery gallery and generator concept links are separate illustrative boxes/rails. This is NOT approved busway sizing, exact feeder or ATS topology. Existing historical single-parity route visibility map remains an independent simplified visual artifact; it does not establish actual rack electrical availability.

## User interface
The separate floor100-power.mjs module returns estimated watts and kilowatts for every rack/row and the whole floor, plus peak IT totals, facility PUE estimates and heat categories. The UI shows both W and kW with a workload dropdown, heatmap toggle in the 10x10 map and 3D, per-rack tooltip, row totals and downloaded illustrative JSON with source tag BROWSER_ONLY_DEMO_ASSUMPTIONS. No user files or external accounts are used.

Verify Node power tests and full WebGL / No-WebGL isolated Chrome tests on WIN11-181. Keep current deployed production and active user browser sessions unaffected until QA and successful GitHub Pages verification.
