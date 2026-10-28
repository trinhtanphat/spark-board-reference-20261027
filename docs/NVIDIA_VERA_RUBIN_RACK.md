# NVIDIA Vera Rubin NVL72 Rack — Architectural Visual Study

**Verified public architecture:** NVIDIA DGX Vera Rubin NVL72 user guide.

| Published component | Per rack | Notes |
| --- | ---: | --- |
| Compute trays | 18 | Each tray has 4 Rubin GPUs and 2 Vera CPUs |
| Rubin GPUs | 72 | 18 × 4 |
| Vera CPUs | 36 | 18 × 2 |
| NVLink 6 switch trays | 9 | Four NVSwitch ASICs each |
| NVSwitch ASICs | 36 | 9 × 4 |
| Top-of-rack management switches | 2 | Managed network hardware |
| Cooling | Liquid cooling | Real implementation uses manifolds and cold plates |
| Power | **4 power shelves** | **3 RU each, 110 kW rated per shelf, six 18.3 kW PSUs, 54 V DC busbar output** |
| Per compute tray | 2 ConnectX-9 I/O cards, 1 BlueField-4 DPU, 4 cache E1.S NVMe and 1 boot E1.S NVMe | Manufacturer-published components; not physically drawn to scale |

**What is real:** The component counts and per-tray architecture above are from NVIDIA documentation.

**What is illustrated:** All three-dimensional rack size, placement of front slots, position of the 9 NVLink trays, placement of switches and power shelves, panel design, colors, service rails, indicator LEDs, rear manifold and NVLink spine. These details are NOT reconstructed from official manufacturing CAD and do not represent installation or service procedures.

## Three model modes

1. **VERA RUBIN SUPERCHIP:** stylized 2× Rubin GPU + Vera CPU with optional conceptual cold plates.
2. **NVL72 RACK / 72 GPU:** schematic rack showing the 18 compute trays, 9 NVLink 6 switch trays, 4 power shelves and 2 TOR switches, with 72 GPU and 36 CPU indicators. Controls: orbit, zoom, inspect selected rack tray, take PNG.
3. **SPARK PCB REFERENCE:** preserved legacy fictional board with Route Explorer; no electrical netlist or production approval.

These modes are separate; showing the rack never certifies PCB connectivity, mechanical dimensions or manufacturing DRC. Browser 3D tests validate responsiveness, counts, switching, camera framing, inspector and export — not physical hardware compliance.

## Authoritative documentation

- https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/

## Local regression commands

```powershell
node scripts/test-nvidia-rack.mjs
node scripts/test-nvidia-product.mjs
node e2e-check.js
$env:TEST_NO_WEBGL='1'; node e2e-check.js
$env:TEST_WEBGL_RECOVERY='1'; node e2e-check.js
```

`node scripts/pcb-routing-audit.js --require-manufacturing-ready` must still exit with code 3 because there is no real board schematic/netlist.
## Revision: documented power shelves & rack tray explorer

The original demo used two generic power shelves. NVIDIA's hardware guide specifies **four** shelves at 3 RU each, with six air-cooled PSUs per shelf and 54 V DC busbar distribution. This revision corrects the modeled inventory and checks the counts against fixed official specifications. A rack tray navigator now provides 33 selectable elements (18 compute + 9 NVLink + 4 power + 2 TOR). The relative taller power shelf in the scene is an artistic approximation, **not a validated rack-unit drawing**. All data for display labels comes from NVIDIA's public hardware guide. Selecting a tray highlights the corresponding illustrated tray; this does not validate real locations, electrical connections or service procedures.
