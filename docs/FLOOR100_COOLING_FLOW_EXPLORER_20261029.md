# COOLING FLOW EXPLORER — SPARK 100-rack floor, 29 October 2026

## Factual hardware anchor
The public NVIDIA DGX Vera Rubin NVL72 user guide describes rear manifold inlets/outlets and liquid passing through inner manifolds and cold plates attached to CPUs, GPUs and other components:
https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html

NVIDIA does **not** supply the fictional 100-rack floor's complete CDU location, facility-level coolant pipe geometry, hydraulic layout, inlet/outlet temperatures, pressures, sensor data, redundancy or flow rate. We do not clone or redistribute NVIDIA CAD, images or the manufacturer's website.

## Functional browser-only feature
The new pure floor100-cooling-path.mjs gives a **schematic route from the nearest of eight stylized CDUs to the selected COMPUTE rack**, and one reverse return route. Each supply/return route consists of four spatial segments: CDU gallery riser, overhead row corridor, rack rear manifold spur, cabinet manifold drop. Selecting mode SUPPLY, RETURN, BOTH or OFF controls a private 3D highlight group of maximum eight bright segments. Moving from R001 to R091 recomputes the route and CDU ID. A fabric/storage rack deliberately shows NO NVL72 compute coolant manifold route.

This does not calculate flow, pressure, hydraulic capacity, thermal performance or real uptime and never controls physical facilities. The only numeric demands remain imaginary heat-equivalent kW from the previous Cooling & Thermal Planner and user-defined rack watt assumption. Showing a highlighted pipe is not evidence of available cooling. Changing existing 3D layer filters/camera still works, including front/rear and other routing explorer.

Browser tests exercise actual selected rack identities, 3D segment counts and endpoints, channel modes, noncompute safety, UI labels, no JavaScript exceptions and preservation of original 16-rack service simulator. QA is run on isolated WIN11-181 port with disposable Chrome profiles, and only a reviewed merge triggers GitHub Pages deployment.
