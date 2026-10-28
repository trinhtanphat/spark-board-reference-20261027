/**
 * NVIDIA DGX Vera Rubin NVL72 rack configuration from official published docs.
 * Counts are official; slot positions and physical dimensions in this 3D demo
 * are NOT NVIDIA manufacturing CAD or a validated mechanical rack drawing.
 */
export const RACK_SPEC=Object.freeze({
 name:"NVIDIA Vera Rubin NVL72",
 computeTrays:18,
 gpusPerComputeTray:4,
 cpusPerComputeTray:2,
 switchTrays:9,
 nvSwitch6AsicsPerSwitchTray:4,
 managementTorSwitches:2,
 gpuCount:72,
 cpuCount:36,
 nvSwitchAsics:36,
 cooling:"Liquid-cooled compute trays and rear manifolds",
 disclaimer:"UNOFFICIAL RACK ARCHITECTURE STUDY - NOT NVIDIA CAD OR A PHYSICAL INSTALLATION GUIDE",
 sources:Object.freeze([
  "https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html",
  "https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/"
 ])
});
export function validateRackArchitecture(s=RACK_SPEC){
 return Object.freeze({
  computeTrays:s.computeTrays,
  switchTrays:s.switchTrays,
  managementTorSwitches:s.managementTorSwitches,
  aggregateGpus:s.computeTrays*s.gpusPerComputeTray,
  aggregateCpus:s.computeTrays*s.cpusPerComputeTray,
  aggregateNvSwitchAsics:s.switchTrays*s.nvSwitch6AsicsPerSwitchTray,
  matchesPublishedCounts:s.computeTrays===18&&s.switchTrays===9&&s.managementTorSwitches===2&&
   s.computeTrays*s.gpusPerComputeTray===72&&
   s.computeTrays*s.cpusPerComputeTray===36&&
   s.switchTrays*s.nvSwitch6AsicsPerSwitchTray===36,
  manufacturingApproved:false
 });
}
