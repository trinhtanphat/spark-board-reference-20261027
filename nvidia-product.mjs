/**
 * Source-grounded NVIDIA Vera Rubin facts, 28 Oct 2026.
 * Presentation is independently created and not NVIDIA's official product CAD.
 */
export const NVIDIA_PRODUCT=Object.freeze({
 name:"NVIDIA Vera Rubin Superchip",
 system:"NVIDIA Vera Rubin NVL72",
 architecture:"Vera Rubin",
 sourceDate:"2026-10-27",
 superchip:Object.freeze({rubinGPUs:2,veraCPUs:1,hbm4GB:576,nvfp4Pflops:100,nvlinkC2cTbps:1.8}),
 rack:Object.freeze({rubinGPUs:72,veraCPUs:36,hbm4TB:20.7,nvlinkTbps:216}),
 references:Object.freeze([
 "https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/",
 "https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/",
 "https://nvidianews.nvidia.com/news/nvidia-and-oracle-expand-nvidia-vera-rubin-to-multi-gigawatt-scale-and-bring-nvidia-vera-cpu-to-oracle-cloud-infrastructure"
 ]),
 disclaimer:"UNOFFICIAL 3D CONCEPT · NOT NVIDIA CAD · NO VERIFIED PCB ROUTING"
});
