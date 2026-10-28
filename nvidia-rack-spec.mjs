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
 powerShelves:4,
 powerShelfHeightRU:3,
 powerShelfRatedKW:110,
 dcOutputVolts:54,
 psusPerPowerShelf:6,
 connectX9CardsPerComputeTray:2,
 bluefield4DPUsPerComputeTray:1,
 cacheNvmePerComputeTray:4,
 bootNvmePerComputeTray:1,
 nvSwitchPortsPerAsic:72,
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
  powerShelves:s.powerShelves,
  aggregateGpus:s.computeTrays*s.gpusPerComputeTray,
  aggregateCpus:s.computeTrays*s.cpusPerComputeTray,
  aggregateNvSwitchAsics:s.switchTrays*s.nvSwitch6AsicsPerSwitchTray,
  totalPowerShelfPSUs:s.powerShelves*s.psusPerPowerShelf,
  matchesPublishedCounts:s.computeTrays===18&&s.switchTrays===9&&s.managementTorSwitches===2&&s.powerShelves===4&&s.powerShelfHeightRU===3&&s.dcOutputVolts===54&&s.powerShelfRatedKW===110&&s.psusPerPowerShelf===6&&
   s.computeTrays*s.gpusPerComputeTray===72&&
   s.computeTrays*s.cpusPerComputeTray===36&&
   s.switchTrays*s.nvSwitch6AsicsPerSwitchTray===36,
  manufacturingApproved:false
 });
}
/** Official component details, distinct from illustrated physical tray placement. */
export function rackTrayFacts(kind){
 const s=RACK_SPEC;
 if(kind==="compute")return {label:"COMPUTE TRAY",facts:`4 Rubin GPUs · 2 Vera CPUs · ${s.connectX9CardsPerComputeTray} ConnectX-9 I/O cards · ${s.bluefield4DPUsPerComputeTray} BlueField-4 DPU · ${s.cacheNvmePerComputeTray} E1.S cache NVMe + ${s.bootNvmePerComputeTray} boot NVMe`};
 if(kind==="nvlink")return {label:"NVLINK 6 SWITCH TRAY",facts:`4 NVSwitch ASICs · ${s.nvSwitchPortsPerAsic} NVLink 6 ports per ASIC · 9 trays per rack`};
 if(kind==="tor")return {label:"TOR MANAGEMENT SWITCH",facts:"One of two rack management switches; illustration of front-panel placement only."};
 if(kind==="power")return {label:"POWER SHELF",facts:`${s.powerShelfHeightRU} RU · ${s.powerShelfRatedKW} kW rated · 54 V DC busbar · ${s.psusPerPowerShelf} air-cooled PSUs per shelf · 4 shelves per rack`};
 throw new RangeError("Invalid tray kind");
}
