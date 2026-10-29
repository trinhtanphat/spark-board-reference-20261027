# 100-Rack A/B cables: disconnected visual junction bugfix (29 October 2026)

## Symptom and root causes
Users correctly noticed overhead A/B busway, rear rack drops, UPS gallery, generator and battery drawings had visible air gaps. In the previous model the row bar was fixed at X -10 with width 53, ending at X 16.5, while the B power tap of the rightmost cabinet is X 18.54. The vertical rear feed top was at Y 8.75, below the A top busway at Y 8.87 and the B top busway at Y 9.02. The lower elbow cube ended slightly short of the port. UPS riser and backup gallery artwork also contained long independent shapes not visibly joined.

## Fix
- The two row busways now span from their actual gallery trunks to each outermost rack tap, using exact matching 3D X/Z coordinates rather than a fixed generic box.
- Both rack feed lines now extend without a visible gap from overhead bar to rear rack connector. Short orthogonal conduit bends and junction couplers physically overlap each adjoining visual element.
- The simplified UPS gallery risers begin at each enclosure top and end at the overhead trunk, instead of leaving a vertical piece suspended below it.
- Battery and generator graphics feed into one shared visible utility gallery instead of detached horizontal artwork.
- A single exported FLOOR100_VISUAL_POWER_GEOMETRY records source X, trunk X, top Y, row offsets, rack entry and back panel positions. The interactive Power Path Explorer now contains **seven continuous visual segments per feed**, including the rear-port coupler; it starts at the UPS enclosure top and uses the same coordinates as the static scene.
- Runtime geometric coverage audit checks the actual instanced Three.js cuboids: 100 racks x 2 feeds x 7 line segments = **1,400 segments, 200 complete visual routes**. A route passes only if both ends of each highlighted segment are covered by the SAME colored existing rendered conduit object. All paths are checked, not sampled. This is also asserted in browser E2E desktop/mobile/tablet.
- Node route continuity test covers all 200 paths, exact common endpoints, axis alignment, cabinet-port contact, outermost rack spans and finite coordinates.

No NVIDIA proprietary CAD, real panel schematic, ATS connection sequence, live electrical device access or manufacturer-specific cable details are reproduced. These remain independently modeled fictional browser visualizations. QA runs in an isolated server and Chrome profile on WIN11-181 before deployment to GitHub Pages; the original production and user Chrome tabs remain untouched.
