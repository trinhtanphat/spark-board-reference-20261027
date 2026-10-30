# Eight single-CDU-outage comparisons: computed illustration, NOT N+1 certification (2026-10-30)

The study in `floor100-cdu-n1-study.mjs` is an **eight-case, single-failure fault sweep** built entirely from the fictional 8-CDU independent hydraulic bank and first-order 10-row proxy-temperature model. All 80 conceptual NVL72 compute rack loads are carried from the existing water energy balance; 20 fabric/storage racks remain unmapped to liquid loops.

Each case sets one conceptual CDU to 0% speed, seven other pumps to 100%, all row valves open and no separate failed-CDU switch; there is **no crossfeed**. For every case, the solver recomputes 10 row flows and then the 5-minute pre-event healthy baseline, the selected 5/10/20-minute incident and 10/20/40-minute **hypothetical** recovery with 120000/180000/300000 kJ/K/row equivalent lumped inertia. It does *not* change any physical equipment or run in real time. Thermal proxy temperatures are NOT coolant, chip, air inlet, enclosure or liquid supply/return temperatures.

For meaningful comparisons across the eight simulated pump domains, a proxy burden metric is calculated by **trapezoidally integrating the positive part of each row's temperature above the fictional 30°C baseline**, summing all 10 rows across event and recovery:

`B = Σ_rows Σ_minutes (max(0,T_t−30°C)+max(0,T_(t+1)−30°C))/2 × 1 minute`.

Units are K·min summed across rows, **not energy** and not a damage/risk/safety metric. The scenario is sorted decreasing by B, then proxy peak, then CDU ID for a deterministic order; numerical ties do not imply real reliability parity. At the demo's full load, CDU #2 and #7 (two row-service zones each) tie in B, ahead of single-row zones. Numerical ranking is not a true N+1 reliability conclusion. No redundant pump or crossover path is represented, so it cannot show safe backup cooling capability.

The dashboard presents eight scenario bars with proxy-burden scores, peak rise and modeled flow loss. Clicking a bar resets all prior fictional faults, runs **that sole CDU at 0%** and redraws the 8-CDU cards, affected pipe status and temperature proxy graph. A reset button restores all eight fictional pumps and clears incident flags. The comparison itself recomputes when load, pipe diameter/length, thermal share, assumed water ΔT, incident/recovery duration or fictional lumped heat capacity changes. The JSON export includes the independent eight-case study. The original single-aggregate pump and hydronic study continue to exist as alternative hypothetical models, not additive hydraulics.

## Caveats
Not a single-point-of-failure guarantee, N+1 engineering qualification, manufacturer rack/CDU topology, certified redundancy level, sensor-driven commissioning, thermal alarm criterion, or CFD. The three-dimensional shared pipe spine is an artistic scene and does not depict actual independent secondary piping. Pump curves, heat transfer coefficients, failure modes, water transport and rack temperatures remain unvalidated fiction.

For trusted source context see NVIDIA published high-level hardware guidance: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html — it does NOT validate any of these modeled pump or room-performance assumptions.

Run unit tests using `node scripts/test-floor100-cdu-n1-study.mjs` then all Node suites, headless Chrome full app on desktop/mobile/tablet and 2D fallback, with QA running on an isolated WIN11-181 local port, never on production tunnel/browser sessions.
