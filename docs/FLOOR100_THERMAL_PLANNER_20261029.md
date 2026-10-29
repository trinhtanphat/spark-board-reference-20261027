# SPARK 100-rack cooling and heat budget what-if (29 October 2026)

This enhancement is an **illustrative calculation**, not NVIDIA site engineering data, real coolant temperature, mass flow, CDU nameplate, fault tolerance, PUE analysis or equipment telemetry.

## Public background
NVIDIA's Vera Rubin hardware guide documents liquid-cooled compute trays, cold plates, inlet/outlet manifolds and power distribution. NVIDIA describes warm-water direct liquid cooling, but actual capture percentages, CDU capacities, liquid/air share and per-row cooling budget in this demo are NOT official NVIDIA values:
- https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/

## Assumptions
Treat the estimated IT electrical demand (adjusted by user-set W/rack and 60/80/100% workload) as a **heat-equivalent what-if** in kW. Split into hypothetical liquid share presets of 80%, 90%, 95% and residual "air heat equivalent". This is not actual heat capture or a cooling COP/PUE measurement.

Model eight imaginary CDU modules (the 3D floor already depicts 8); editable fictional capacity per CDU 1,200 / 1,400 / 1,600 kW. Choose 8, 7, 6 or 0 available modules to see aggregate planning capacity, "gap" if demand exceeds that imaginary capacity, and 10 per-row planning shares. Equal division of theoretical CDU budget by ten rows is a visualization shortcut, *not a real hydraulic network or N+1 redundancy model*. An excess does not predict throttling or outage.

At untouched defaults: IT demand (heat equivalent) 10,020 kW; 90% illustrative liquid capture = 9,018 kW; remainder 1,002 kW for assumed air cooling; 8 x 1,200 kW = 9,600 kW fake CDU capacity, leaving 582 kW arithmetic headroom. In a what-if one-CDU-unavailable state 7 x 1,200 = 8,400 kW, i.e. 618 kW imaginary shortfall. No physical health/temperature inference is made.

The code is pure `floor100-thermal.mjs`, with unit tests and live UI updates when user edits rack watt, applies load percent, changes liquid capture / CDU capacity / CDU available. There are ten 3D cooling budget indicators rendered as one batched instanced mesh; color reflects only the illustrative demand/capacity ratio. Site CDN/installation and logged-in browser profiles are untouched during QA. This feature does not copy NVIDIA proprietary CAD or fetch privileged site material.
