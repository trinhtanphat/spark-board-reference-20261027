# SPARK PCB routing — audit revision 2

**NOT ELECTRICALLY VERIFIED — NOT READY FOR FABRICATION**.
This audit tests illustrative geometric routes, not copper nets or KiCad ERC/DRC.

## Before and after
| Check | Old illustration | New illustration |
| --- | --- | --- |
| Routes | 310 pseudo-random texture paths | 224 shared, labelled visual corridors |
| Crossings | 3,063 visual crossing candidates | 0 same-layer crossings |
| Clearance warnings | Unconstrained | 0 |
| Layers | 8 unrelated random drawings | 8 views of the shared route manifest |
| Via markers | 280 randomly distributed | 84 patterned perimeter markers |

Minimum edge gap = 0.0738 normalized scene units. Illustrative required gap = 0.065 scene units. These are NOT manufacturable dimensions in mm.
Route endpoints are NOT actual IC pads and no netlist governs them. Passing the geometry checks does not validate an electrical circuit.

## Missing real design inputs
- schematic: not supplied
- board: not supplied
- netlist: not supplied
- gerber: not supplied
- drill: not supplied

## Blockers
- No schematic, netlist or device/power specification
- Visual corridors do not terminate on verified footprint pins
- 3D body keepouts cover only five conceptual IC packages, not vendor footprint courtyards or all SMD placements
- Stitching markers are cosmetic not proven plated vias
- Eight conceptual layers have no physical stackup or material thickness
- No manufacturer constraints or electrical DRC/DFM

## Steps to real electrical correctness
1. Specify real part numbers and voltage/current/interfaces
2. Build schematic and datasheet-accurate footprints
3. Assign nets and real copper widths/clearances/impedance as required
4. Run KiCad ERC and DRC on actual EDA files
5. Approve fabrication with human engineer

## Test commands
- node scripts/test-visual-routing.mjs
- node scripts/pcb-routing-audit.js
- node scripts/pcb-routing-audit.js --require-manufacturing-ready (expected exit code 3 while unverified)
- node e2e-check.js (WebGL functional tests only)

## External cross-check
Official KiCad CLI and KiCad MCP Pro pcb-design, schematic-review, drc-check and kicad-design-review workflows require actual PCB/net/schematic files. The third-party skills were reviewed as text, not executed.
- https://docs.kicad.org/10.0/en/cli/cli.html
- https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html
- https://github.com/oaslananka/kicad-mcp-pro/tree/main/skills
