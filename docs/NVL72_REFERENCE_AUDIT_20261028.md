# NVIDIA Vera Rubin NVL72 — public hardware-reference audit
Date: 28 October 2026

## Scope
Public-documentation research and manual comparison against the existing browser-only, 100-rack SPARK scene. **No source-website assets or NVIDIA proprietary CAD are downloaded, rehosted, or copied.** No login/authenticated website accessed. Our art, shapes, spacing and arrangement remain independent and conceptual.

## Authoritative public sources consulted
1. [NVIDIA DGX Vera Rubin NVL72 Hardware](https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html)
2. [NVIDIA DGX Vera Rubin NVL72 Networking](https://docs.nvidia.com/dgx/dgxvr-user-guide/networking.html)
3. [NVIDIA Vera Rubin NVL72 product overview](https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/)

## Verified hardware building blocks (per NVL72 compute rack)
- 18 × 1 RU compute trays, each containing 2 Vera CPUs and 4 Rubin GPUs: **36 Vera CPUs / 72 Rubin GPUs** per rack.
- 9 × NVLink 6 switch trays.
- 2 × top-of-rack switches for management.
- 4 × 3 RU power shelves. Hardware guide specifies AC input conversion to a **54 V DC bus bar**; actual electrical feed sizing and protection are **not represented** by the SPARK model.
- Rear equipment access for passive copper NVLink cable cartridges, power busbar, and liquid cooling manifolds.

The architecture is a source-derived rack hardware fact sheet, **not** a certified blueprint for our particular invented multi-rack floor. For 80 conceptual compute racks, the UI's arithmetic equivalents are 1,440 compute trays, 5,760 GPUs, 2,880 CPUs, 720 NVLink switch trays, 320 power shelves and 160 management switches; these are a multiplication of reference quantities, **not** an assertion that 80 real racks are deployed.

## Implementation
The new `floor100-hardware.mjs` provides a curated, source-identified rack anatomy catalog, unit-count metadata, orientation, and purely illustrative 3D highlight coordinates. The floor inspector lets users choose: compute trays (18), NVLink switch trays (9), power shelves (4), management TOR switches (2), and stylized rear NVLink cartridges (4 drawn vertical columns), liquid manifolds (2 drawn rails), and busbar rails (2 drawn rails). Do **not** treat rear drawn counts as official numbers of cartridges/manifolds/busbars.

On selecting a component group, the interactive model highlights only that set of shapes on the focused compute rack using one bounded InstancedMesh (up to 18 translucent elements). Rear parts request the rear-service camera and front parts request the front camera. Fabric and storage cabinets are not presented as Vera Rubin NVL72 compute racks. Model geometry and camera continue to use the pre-existing independent floor layout. The official guide link is available in the page.

## Explicit nonclaims
This demo does not perform real web-site cloning; site visuals, trademark artwork, authentication, 3D source models and restricted files are not copied. It does not establish power redundancy, actual manifold counts, cooling flow, U-by-U mechanical elevation, rack clearances, power-shelf wiring, permitted service procedures, operational readings or manufacturing accuracy. Compare against authorized OEM drawings and site engineers for physical deployment.
