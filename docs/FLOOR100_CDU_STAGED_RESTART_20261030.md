# CDU staged pump restart — study (2026-10-30)

## Scope
This adds a third **hypothetical** what-if experiment. The fictional eight-pump independent service zones, no-crossfeed outage scenarios and first-order lumped row thermal proxy remain the basis; the user can choose a single CDU to stop in the simulated incident, and compare **instant** restart against **6-minute** and **12-minute** staged speed ramps. Other seven fictional pumps stay at 100%. This is neither a real hydraulic restart design nor OEM startup guidance and does not actuate equipment.

The 6-minute scenario uses 0% pump speed for 2 fictional minutes then 60% for 2 then 80% for 2, then 100%. The 12-minute version holds each 0/60/80 stage for 4 minutes, then 100%. Instant recovers at 100% immediately. These are deliberately invented discrete control schedules, not measurements. All use the previous incident 5/10/20-minute and recovery 10/20/40-minute selections, identical to the existing transient widget, with a 5-minute steady pre-event phase. An instantaneous switch at a fixed minute is mathematical only; transient flow, startup inrush and water arrival lag are omitted.

For each of four discrete pump speeds 0/60/80/100%, the existing eight-bank solver recomputes independent steady row flow with seven unaffected service domains; it calculates no actual piping system pressures, power efficiency, throttling or NPSH. During each fictional 1-minute integration, the row's heat input P is held constant and `UA(flow)=P/(30-22)*(flow/healthyFlow)`; `C*dT/dt=P-UA(flow)*(T-22)`. The piecewise exact exponential step is used when UA>0 and linear no-flow heating when UA=0. Initial proxy=30°C, imagined sink=22°C, hypothetical per-row heat capacity 120000/180000/300000 kJ/K. **These are model state temperatures, not GPU or coolant temperatures.**

Plots overlay the maximum of all ten proxy curves for each restart plan. The UI includes affected rows, selected scenario's recovery-end peak and extra **positive proxy K·min summed across ten rows** relative to instantaneous restart. K·min is neither energy, actual thermal exposure, device risk or an engineering acceptance level. Results recompute when user changes CDU, ramp, load, row hydraulics, water delta T, duration or equivalent mass; JSON export includes full three-case timelines and the selected ramp.

## Reliability and limitations
No real pump acceleration, electrical power limits, startup sequence, valve interlocks, pump control gains, loop pressure transient, hydraulic inertia, water transport, CDU exchanger capacity, thermal alarms, measured temperatures, OEM rated CDU count, facility redundancy, or N+1 certification. The artistic 3D shared manifold is not a verified individual-banks pipe design. This simulation must **never** control real equipment or serve as safety guidance.

References for **general engineering background only** (neither source certifies demo parameters):
- https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/pump-affinity-laws-1117584

Test `node scripts/test-floor100-cdu-restart.mjs`; run all unit and Chromium E2E tests on WIN11-181 isolated QA before merge and Pages checks. User sessions, production service 8788 and Private Commander tunnel remain untouched.
