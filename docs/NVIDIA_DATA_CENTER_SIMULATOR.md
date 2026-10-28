# NVIDIA GPU Data Center — Browser-only 3D Simulator

**Scope:** independent NVIDIA Vera Rubin architecture learning/demo. This is not NVIDIA-authorized CAD, switch management software, live hardware control, an as-built wiring plan, or validated maintenance instructions.

## Rack inventory

| Rack | Modeled devices |
| --- | --- |
| GPU rack A | 18 compute trays, 9 NVLink 6 switch trays, 4 power shelves, 2 TOR management switches |
| GPU rack B | Identical illustrative second NVL72 rack |
| Fabric rack F | Concept InfiniBand switch, Ethernet storage switch, Ethernet management switch |

Each complete NVL72 rack represents 72 Rubin GPUs and 36 Vera CPUs; total 144 GPUs and 72 CPUs with every compute tray installed. The browser model contains 69 service slots and 216 **logical** port endpoints. Logical endpoint counts are application abstractions, not physical port counts certified by NVIDIA.

## Interaction

Select GPU DATA CENTER / 3 RACKS, then CONFIGURE DEVICES & NETWORK. Choose a rack and slot; PULL DEVICE, REMOVE MODULE or INSTALL MODULE operates on the virtual equipment state. Slot type mismatches are rejected. GPU/CPU totals update when compute trays are virtually removed or installed. Choose compute-tray source and compatible fabric-rack target ports to PLUG CABLE and draw color-coded 3D lines; UNPLUG SELECTED CABLE releases a connection. Remove is blocked while a virtual cable is attached. RESET LAB restores the original simulated inventory and removes cables. EXPORT SIM JSON downloads a local, clearly labeled simulated snapshot. No backend/network-control endpoints were added.

## Fabric compatibility

| Simulated fabric | Compute-side documented interface | Logical fabric termination |
| --- | --- | --- |
| InfiniBand computenet | ConnectX-9 OSFP | Illustrative OSFP InfiniBand fabric switch port |
| Ethernet storagenet | BlueField-4 QSFP | Illustrative QSFP Ethernet storage-fabric port |
| Ethernet ipminet | BMC RJ45 | Illustrative RJ45 management-switch port |

NVIDIA documentation distinguishes NVLink 6 **inside** each 72-GPU rack, InfiniBand scale-out between racks, and Ethernet management/storage. The simulator does NOT allow NVLink to plug into an Ethernet port. The fabric chassis, port counts and cable geometry are conceptual and do not represent certified NVIDIA Spectrum/Quantum switch as-built port specs. Media/fabric validation is a simplified UI-level constraint, not a physical cabling standard or link compatibility certification.

## Safety boundaries

NVIDIA DGX Vera Rubin NVL72 Service Manual lists customer-replaceable units such as E1.S NVMe cache drives, certain batteries, PSUs, and power shelf management modules; other replacement operations require an authorized NVIDIA representative. Virtual module removal in this demo must NOT be interpreted as permission to hot-swap any real tray, disconnect coolant/power, or perform physical service. Do not use the model for live switch configuration, rack installation, real wiring or manufacturing. Physical topology, power, cooling, optical signaling, FEC, timing, dimensions and redundancy are not validated.

## QA

node scripts/test-data-center.mjs : inventory, 3 kinds of cable, mismatched fabric/media and busy-port safeguards, invalid replacements, safe reset.
node e2e-check.js : desktop/mobile/tablet browser actions, module pulls/installs, 3D cable display, original NVL72 and PCB regressions.
TEST_NO_WEBGL=1 and TEST_WEBGL_RECOVERY=1 node e2e-check.js : fallback/recovery.
node scripts/pcb-routing-audit.js --require-manufacturing-ready : MUST exit 3.

## Official NVIDIA sources

- https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
- https://docs.nvidia.com/dgx/dgxvr-user-guide/networking.html
- https://docs.nvidia.com/dgx/dgxvr-service-manual/introduction.html
- https://www.nvidia.com/en-us/networking/spectrumx/

**BROWSER-ONLY SIMULATION; NO PHYSICAL DEVICE IS ACCESSED.**
