# AI Factory 100 rack: theoretical compute water balance (2026-10-29)

This independently modeled feature estimates theoretical water volumetric flow from a heat-equivalent assumption. It is **not live flow telemetry or an NVIDIA-certified coolant flow design**.

Q [kW] = mass flow [kg/s] x cp [kJ/(kg K)] x DeltaT [K].
L/min = mass flow / assumed density [kg/L] x 60.
Assumed pure-water cp=4.186 kJ/(kg K), density=0.997 kg/L; user-selectable DeltaT 5, 10, or 15 K.

Only 80 fictional NVL72 compute racks have manifold-linked theoretical water targets. Twenty fabric/storage racks are explicitly excluded; their fictional liquid-share heat remains unmapped. This is deliberately different from the original all-100-rack hypothetical CDU capacity budget. At default power 80 x 120 kW, 90% liquid share gives 8,640 kW compute liquid target. Other rack loads 420 kW contribute 378 kW of *unmapped* hypothetical liquid heat.

Adjusting rack watts, load percent and capture percent automatically recomputes L/min and m3/h; JSON exports include hypotheticalComputeWaterBalance. Fluid thermophysical constants are simplified approximations. The model does NOT size pipes, CDU modules or pumps, predict leaks, apply hydraulic balancing, pressure drop, actual coolant mix or supply/return temperatures. A CFD-validated mechanical plant or vendor installation diagram is not implied.

NVIDIA confirms that NVL72 has rear cooling manifolds and internal cold plates, not our invented CDU gallery connection geometry: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html

Run node scripts/test-floor100-liquid-loop.mjs and existing QA. Never change production independently of reviewed, tested main release.
