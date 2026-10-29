# AI Factory 100: hydraulics *sensitivity* (2026-10-29)

This independently implemented browser-only module computes a hypothetical row supply+return pipe pressure-loss estimate **for comparison only**. It is deliberately NOT connected to a CDU/pump performance curve or real hardware.

## Scope and formula
- The upstream heat-balance model provides demand flow for **80 compute racks in ten rows**. 20 fabric/storage rack liquid shares are **unmapped**.
- The modeled circuit is ten *independent* row branches with the same selectable internal diameter (125/160/200 mm) and assumed one-way pipe length (20/30/40 metres). Each branch has identical supply and return flow, so the model doubles both major and fitting losses. This is **not** a connected pipe network solver: no trunk/main header, valves, rack inlet restrictions, air-cooled loads or plant components are modeled.
- Convert row L/min to m³/s; velocity v = Q/A, A = πD²/4.
- Assume pure-water density 997 kg/m³; dynamic viscosity 0.0007 Pa·s; roughness 0.045 mm; K minor-loss coefficient **3 per leg**. These are invented demo constants, not NVIDIA specifications and not intended for construction.
- Re=ρvD/μ. Laminar uses f=64/Re. Turbulent branch uses **Swamee–Jain explicit friction approximation**, 0.25/[log10(roughness/(3.7D)+5.74/Re^0.9)]². 2300–4000 transitional regime uses this approximation, and is labeled **TRANSITIONAL_APPROX**, not certified.
- Major ΔP [Pa] = **2** × f × L/D × ρv²/2. Minor ΔP [Pa] = **2** × K × ρv²/2. Roundtrip row ΔP = major + minor. Report **maximum individual row branch loss**, **never sum parallel branch losses**.
- Zero flow safely gives exactly 0 loss. A display-only 2 m/s velocity marker is not an industry or OEM design threshold.

## Truthful use
This is a *steady single-branch sensitivity exercise*, NOT CFD, hydraulic network balancing, certified pipe sizing, pump head, CDU capability, valve differential loss, heat exchanger loss, actual supply/return lengths, measured flows, measured pressure or safety engineering. The 3D geometry has fictional coordinates and cannot be used to infer lengths. The 8 fictional CDUs are unrelated to the row branch estimate.

## Evidence
- NVIDIA DGX Vera Rubin NVL72 public guide establishes rear manifold/cold plate architecture but not our plant/pressure/pipe geometry: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- Darcy-Weisbach: https://www.engineeringtoolbox.com/darcy-weisbach-equation-d_646.html
- Fluid modeling and friction coefficient approximation: https://www.engineeringtoolbox.com/colebrook-equation-d_1031.html
- All numeric results are labeled assumed NOT TELEMETRY.

## QA
Run node scripts/test-floor100-hydraulic.mjs and the existing unit/browser suites on WIN11-181 isolated QA. Any merge to main must follow browser acceptance and should not touch private desktop sessions or production infrastructure.
