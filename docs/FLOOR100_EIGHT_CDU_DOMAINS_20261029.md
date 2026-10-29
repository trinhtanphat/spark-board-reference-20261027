# Eight hypothetical CDU pump service domains (2026-10-29)

## Model scope and assumptions
This experimental what-if introduces **eight separately solved fictional pump domains** to compare against the prior single *aggregate* pump model in `floor100-hydronic-network.mjs`. They are **alternative assumptions**, not cumulative networks. Geometry in the 3D scene still shows one artistic shared gallery spine: it **does not** establish that each domain actually has isolated piping; there is no validated NVIDIA facility piping or CDU pump layout.

The 80 compute racks each have a thermal-demand water flow target from the existing water balance; 20 noncompute racks are not assigned NVL72 liquid hardware. Rows 1–10 are assigned via nearest-fictional-CDU service zone: CDU 1=[1], 2=[2,3], 3=[4], 4=[5], 5=[6], 6=[7], 7=[8,9], 8=[10]. Every bank independently computes a shared fictional header pressure loss and flows through its 1 or 2 parallel row branches. There is **no hydraulic crossfeed between CDUs**. If one CDU is stopped, its assigned rows' model flows become zero; other groups remain unchanged. Existing row-valve and one-CDU outage scenarios are unioned with explicit per-CDU pump off selections without double-counting blocked demand.

The pump characteristic is *invented*: shutoff head 55 kPa at 100% speed and a quadratic head decrement of 20 kPa at the CDU's own design-target flow. Illustrative speeds are 0/60/80/100%, with the speed affinity assumption `H(0) = H0 × (speed/100)^2`. Branches use Darcy-Weisbach/Swamee–Jain for assumed 125/160/200 mm inside diameter and 20/30/40 m one-way length, plus fictional 10 kPa valve and 15 kPa exchanger losses at target flow scaled as the square of relative flow. The fictional 400 mm internal-diameter gallery has 60 metres one-way and K=2 per leg. No actual building/mechanical geometry is inferred from 3D coordinates.

Each bank solves `H_branch(qi) + H_gallery(sum qi) = H_pump(sum qi)` by nested 32-step (bank) and 28-step (row) bisection, conserving flow among its open rows. Results include bank flow, pressure, head residual, rows, individual row targets and theoretical demands disconnected by faults. 0 design-demand banks report `NO_DESIGN_DEMAND` rather than invented operation at a validated duty point. No rerouting, valve actuator operation or efficiency/temperature estimate is made.

## Trust limits
This is a demonstrator, not instrumentation or an engineering study to build a datacenter. Neither NVIDIA CDU count, row-to-CDU arrangement, secondary hydraulics, pump performance, safety systems nor real thermohydraulic behavior is established by the model. It cannot predict true coolant temperature, NPSH/cavitation, pump efficiency, cavitation, valve control, resilience, coolant chemistry, actual adequacy or OEM design standards. Pump-speed choices DO NOT actuate real devices.

KSB's affinity law reference provides the idealized speed/head relationship and warns about similarity/viscous limits: https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/pump-affinity-laws-1117584

Implementation and regression testing: `node scripts/test-floor100-cdu-banks.mjs`, existing unit suites and headless Chrome E2E on WIN11-181 private QA port. Production, Chrome user profiles, tunnel, original local server :8788 must remain untouched.
