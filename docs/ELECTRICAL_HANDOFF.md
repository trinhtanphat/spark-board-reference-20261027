# SPARK Electrical Design — Engineering Handoff

**Status: NOT READY FOR FABRICATION.** This repo is a 3D visual PCB concept, not the electrical design of a working board.

## Information required before creating a valid KiCad schematic

| Gate | Required evidence | Present |
| --- | --- | --- |
| Product intent | Precise purpose, supported interfaces, test plan | NO |
| Electrical supplies | Input voltage range, sources, regulator choice, maximum current, protections | NO |
| Core electronics | Manufacturer part numbers and actual pinout datasheets for all ICs | NO |
| Signals | Voltage domains, clock design, RF requirements, bus topology and connector pin assignments | NO |
| PCB construction | Layer stackup with real layer order, dielectric thickness, copper thickness and board dimensions in mm | NO |
| Components | Approved BOM, footprints and 3D models with verified mechanical dimensions | NO |
| Assembly | Connector positions, enclosure keepouts, fabrication capabilities, pick-and-place constraints | NO |
| Validation | KiCad schematic ERC, board DRC with schematic parity, zone fill and unconnected-net check | NO |
| Release | Signed engineering DFM review, assembly test and manufacturing files | NO |

The generated 224 tracks in routing/visual-routing.mjs have **no electrical net identity** and use normalized scene units. Zero illustrative track crossings is not the same as an electrically connected circuit.

## Verification once these real inputs exist

Using a supported KiCad version with authoritative .kicad_sch and .kicad_pcb files:

    kicad-cli sch erc --format json --severity-all --exit-code-violations -o schematic-erc.json example.kicad_sch
    kicad-cli pcb drc --format json --severity-all --schematic-parity --refill-zones --exit-code-violations -o board-drc.json example.kicad_pcb

Check the JSON reports, unconnected items, shorts, ERC violations and severity exclusions. KiCad returning 0 for DRC/ERC is not a substitute for validating parts, manufacturer constraints, real-world power/thermal behavior and a hardware engineer's signoff.

**Do not run the above commands against fabricated/generated placeholder data and present them as real verification.** Never turn the visual-only status flag into a manufacturing certificate. Current fail-closed demo gate:

    node scripts/pcb-routing-audit.js --require-manufacturing-ready

This must return exit code 3 until a real electrical design is supplied and independently verified.

## External references reviewed

- https://docs.kicad.org/10.0/en/cli/cli.html
- https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html
- https://github.com/oaslananka/kicad-mcp-pro/tree/main/skills

The third-party skill files are reviewed as plain text in the separate audit folder on WIN11-181. They are not automatically executed as part of the published website.
