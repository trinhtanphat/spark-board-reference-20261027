# NVIDIA Vera Rubin Superchip — SPARK Unofficial 3D Concept

**Date checked:** 28 October 2026. **Status:** Visual concept, not affiliated with or endorsed by NVIDIA. This is not a physical PCB design.

## Official product and public facts

| Item | Official specification | Scope |
| --- | --- | --- |
| Platform | Vera Rubin NVL72 | rack-scale AI system |
| NVL72 | 72 NVIDIA Rubin GPUs and 36 Vera CPUs | one NVL72 rack |
| One Vera Rubin Superchip | 2 Rubin GPUs and 1 Vera CPU | one Superchip |
| GPU memory | 576 GB HBM4 | one Superchip (2 × 288 GB) |
| NVFP4 inference | 100 PFLOPS (sparse) | one Superchip |
| NVLink 6 aggregate | 216 TB/s | entire NVL72 rack; NOT one PCB |
| CPU | 88 NVIDIA custom Olympus cores | one Vera CPU |

**Latest announcement checked:** 27 October 2026 NVIDIA/Oracle announcement describes Vera Rubin NVL72 and Vera CPU general availability on Oracle Cloud Infrastructure. Feynman is a later announced roadmap architecture, not presented here as a publicly available shipping product.

## What is represented in the website

Default WebGL view: two Rubin GPU package concepts, one Vera CPU concept, schematic HBM4 memory blocks, and stylized interface structures. A model switch brings back the prior SPARK 8-layer visual routing board and Route Explorer without loss.

**Critical caveats:** GPU packages, HBM4 block count and locations, thermal hardware, connectors, track lines, motherboard dimensions, manufacturing stackup and footprint geometries are ARTISTIC and NOT verified against proprietary NVIDIA production CAD or board schematics. Published NVIDIA specs apply to the named platform, not to the simulated browser model.

The independent study does not claim NVIDIA authorship, endorsement, proprietary CAD access, electrical net connectivity, PCB ERC/DRC, Gerber output or production suitability. Trademarks are referenced only to identify the subject.

## Sources

- https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/
- https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/
- https://nvidianews.nvidia.com/news/nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-and-bring-nvidia-vera-cpu-to-oracle-cloud-infrastructure

## Automated QA

Chrome E2E validates the default NVIDIA model, the 2:1 GPU/CPU architecture, model switch to the original reference PCB, Superchip exploded assembly tiers, legacy 3D geometry/Route Explorer, mobile/tablet support and the WebGL fallback. Unit audit remains visual-only; PCB manufacturing approval is intentionally denied.
