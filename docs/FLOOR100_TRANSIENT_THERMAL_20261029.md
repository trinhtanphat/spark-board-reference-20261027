# Transient thermal proxy study — 2026-10-29

## Design boundary
This version introduces a **deterministic, entirely hypothetical first-order row temperature proxy**, not measured coolant, GPU, manifold supply/return, inlet air temperature, safety limits or vendor-validated component performance. It is **not CFD or a thermal-management controller**. No real devices are actuated. Numerical examples are fictional.

### Integration
- The ten compute-liquid-load rows (80 fictitious NVL72 compute racks) consume the existing *compute-only* heat balance and the independently solved eight-CDU hydraulic model. Fabric/storage racks have **no** assigned liquid cooling in the demonstrator.
- A reference healthy 8-CDU hydraulic state is recalculated with all pumps at 100%, and no isolated row or failed CDU. The currently selected eight-pump settings and existing one-row/one-CDU incident controls determine the hypothetical incident flow for each row.
- The simulated timeline is 5 healthy minutes, then 5/10/20 minutes at the selected incident settings, then a *hypothetical automatic reset* of all pumps to 100% and all row valves open for 10/20/40 minutes. Real control timing and redundancy are **unknown**. Timeline is generated instantly and does not count down or mutate actual controls.
- For each row an **imagined heat-storage node** follows `C × dT/dt = P_liquid − UA × (T − 22°C)`. Initial `T(0)=30°C`, `C=120000/180000/300000 kJ/K`. The fictional effective `UA_nominal = P_liquid/(30−22)` (kW/K) makes the nominal fictitious 100%-pump operating point an equilibrium. During the incident `UA = UA_nominal × (Q_incident/Q_nominal)`. During recovery `UA=UA_nominal`. This flow-proportional UA relationship is **a teaching assumption**, not measured heat exchanger behavior; no boiling, mixing delay, feedback controller, fluid transport time, or actual water/thermal mass is modeled.
- Exact exponential solution per 60-second step for constant load and UA:
  `T_next = T_sink + P/UA + (T_prev − T_sink − P/UA) exp(−UA Δt/C)` when `UA>0`; otherwise `T_next=T_prev + P Δt/C`. The derived intermediate timeline avoids explicit Euler instability.
- Outputs: 10 per-row temperatures (explicitly called PROXY), selected row, maxima, incident peak and after-recovery proxy values, selected incident duration, assumed thermal inertia, affected rows, and full timeline in the exported study JSON. Graph overlays all 10 rows with maximum and highlighted selected row.
- If only one of two rows served by CDU #2 is isolated, solved flow in the other row can increase, causing the other row's fictitious proxy temperature to *decrease*. This is a numerical illustration, not proof that real equipment will cool more.
- For a 10-minute #2 pump stoppage and 180000 kJ/K/row illustrative mass at full demo load, the model yields approximately **32.88°C maximum proxy** after incident and **31.402°C** after 20 fictional recovery minutes. These numbers are NOT actual operational predictions or design thresholds.

### Scope limitations
No supplied/return liquid temperature, actual cooling capacity, coolant-specific thermal mass, UA measurement, fitted hardware response, heat-exchanger characteristic curve, rack or chip junction temperatures, fan dynamics, air recirculation, NPSH/cavitation, control algorithms, safety limit or thermal alarms. Assumptions are decoupled from real OEM designs; results must not be used to certify NVIDIA hardware or server rooms. The artistic shared gallery spine may not represent individual hydraulic circuits and its coordinates are not physical metres.

Engineering reference — first-order thermal RC model and lumped heat capacity (the governing ODE is energy conservation, but parameters are explicitly invented):
- Engineering heat transfer fundamentals: https://www.engineeringtoolbox.com/heat-capacity-d_338.html
- NIST thermophysical fluid properties: https://webbook.nist.gov/chemistry/fluid/ (NOT calibrated to this app)
- NVIDIA public DGX hardware guide: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html (does NOT provide this model's 8-CDU bank curves)

### Validation
`node scripts/test-floor100-thermal-transient.mjs` validates stable baseline, exact no-flow heating, reduction at 60% pump speed, row isolation and redistribution, 5/10/20-minute incidents, inertia dependence, recovery convergence, legacy one-CDU failure, 60% IT load, 15 K water delta, zero load, invalid inputs, and immutability. Run all unit suites + Chrome E2E desktop/mobile/tablet and 2D fallback using independent WIN11-181 QA server only; do not interrupt existing production or tunnel.
