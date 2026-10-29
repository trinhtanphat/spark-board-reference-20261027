# 100-rack parallel hydronic pump operating-point what-if (2026-10-29)

## New demonstration
This browser-only module builds a **separate hypothetical topology**, distinct from both real manufacturer installations and the app's geometric pipe scene. There are TEN parallel equivalent row branches, a single shared gallery-header resistance, and ONE aggregate fictional pump. The existing 8 CDU symbols remain visual representations and do not correspond to this synthetic pump curve. No manual/automatic physical control is available.

The energy-balance model estimates an input **target** flow for 80 compute racks; 20 fabric/storage rack loads remain unmapped. The row pipe dimension and imaginary metre lengths are shared with the previous Darcy–Weisbach sensitivity inputs. Ten branches have modeled pressure loss:

`ΔP_branch_i(q) = ΔP_pipe_i(q) + (ΔP_valve,design + ΔP_HX,design) × (q/Qtarget_i)^2`.

The pipe component uses Darcy–Weisbach with Swamee–Jain approximation or laminar 64/Re; input density 997 kg/m³ and viscosity 0.0007 Pa·s. This ignores the transitional regime uncertainty. The common header assumes supply + return 60 metres each, an invented K=2 per side and an internal diameter selectable as 300/400/500 mm. **The 3D visualization's scene coordinates are not metres.**

The pump curve is **entirely invented**:

`ΔP_pump(Q,N) = max(0, H_shutoff × (N/100)^2 − 20 kPa × (Q/Qdesign)^2)`.

Full-speed shutoff head options 45/55/70 kPa, and speed 60/80/100%. These values are *not* a real physical CDU pump, real vendor performance curve, net positive suction head, efficiency, rated flow or guarantee. The quadratic variation with speed follows the **idealized affinity laws** at fixed geometry.

The algorithm bisects common branch differential pressure; for each candidate pressure it bisects the flow of every OPEN row; it enforces `Qtotal=Σq_i` and solves `ΔP_branch+ΔP_header(Qtotal)=ΔP_pump(Qtotal)`. It reports computed, **not measured**, operating flow, pressure, per-row pipe/valve/HX losses, flow target gaps and numerical residual. A closed row or failed illustrative CDU is treated as blocked *with no automatic rerouting*. Other parallel branches may have increased calculated flow at fixed pump speed, which is **not a prediction of actual operation or delivered cooling**. Under zero electrical target loads, the simplified model fixes branch flows to zero (idealized demand-controlled shut valves), which is not a real pump minimum-flow scheme.

## Engineering limits
No certified hydraulic balance, exchanger curves, pump efficiencies, cavitation/NPSH, pump-on-pump interaction, real control valves, rack manifold resistance, real eight-CDU routing, pressure transients, fluid mixture variation, measured telemetry or actual temperature calculation. Rows have a design-dependent virtual resistance. Actual site data and expert engineering validation are required before any use beyond illustration.

References:
- ASHRAE Handbook Chapter 44, Centrifugal Pumps: https://handbook.ashrae.org/Handbooks/S24/IP/s24_ch44_ip.aspx
- KSB pump affinity laws and similarity limits: https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/pump-affinity-laws-1117584
- Open Darcy–Weisbach overview: https://www.engineeringtoolbox.com/darcy-weisbach-equation-d_646.html
- NVIDIA hardware guide (public rear cooling manifolds only): https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html

Tests: `node scripts/test-floor100-hydronic-network.mjs`, previous unit suite and full headless Chrome WebGL E2E desktop/mobile/tablet, 2D fallback and public Pages smoke tests on WIN11-181. QA must not touch production tunnel or Chrome user profile.
