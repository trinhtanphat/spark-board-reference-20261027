/**
 * Public NVIDIA DGX Vera Rubin NVL72 reference facts. No proprietary assets.
 * 100-rack floor remains a fictional layout, not an official NVIDIA BOM.
 * Source: https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html
 */
export const NVL72_GUIDE_URL="https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html";
export const NVL72_INSPECTION_PARTS=Object.freeze({
 none:{label:"SELECT A COMPONENT",count:0,side:"front",detail:"Choose a hardware category to highlight its illustrative location."},
 compute:{label:"18 COMPUTE TRAYS",count:18,side:"front",detail:"Official NVL72: 18 compute trays, each carrying 2 Vera CPUs and 4 Rubin GPUs."},
 nvlink:{label:"9 NVLINK 6 SWITCH TRAYS",count:9,side:"front",detail:"Official NVL72: 9 NVLink 6 switch trays supporting the 72-GPU domain."},
 power:{label:"4 POWER SHELVES",count:4,side:"front",detail:"Official NVL72: four AC-to-54 VDC power shelves. Geometry is stylized."},
 tor:{label:"2 MANAGEMENT TOR SWITCHES",count:2,side:"front",detail:"Official NVL72: two top-of-rack switches for management."},
 cartridges:{label:"REAR NVLINK CARTRIDGES",count:4,side:"rear",detail:"The rear provides access to passive copper NVLink cable cartridges; four columns are artistic representation, not documented cartridge quantity."},
 manifolds:{label:"REAR COOLING MANIFOLDS",count:2,side:"rear",detail:"The rear has liquid-cooling manifolds and inlets/outlets; two visual rails here are illustrative."},
 busbar:{label:"REAR POWER BUSBAR",count:2,side:"rear",detail:"The rack uses a 54 VDC power busbar. Dual visual rails are NOT a verified redundant electrical design."}
});
export const NVL72_COMPUTE_REFERENCE=Object.freeze({computeTrays:18,veraCPUs:36,rubinGPUs:72,nvlinkSwitchTrays:9,managementTOR:2,powerShelves:4,source:NVL72_GUIDE_URL});
export function nvl72PartShapes(part,x,z){
 if(!Object.hasOwn(NVL72_INSPECTION_PARTS,part))throw new RangeError("Unknown NVL72 inspection group");
 const entries=[];
 const add=(px,y,pz,w,h,d)=>entries.push({x:px,y,z:pz,w,h,d});
 if(part==="compute")for(let i=0;i<18;i++)add(x,-.47+i*.257,z+1.47,3.22,.21,.055);
 if(part==="nvlink")for(let i=0;i<9;i++)add(x,4.36+i*.208,z+1.47,3.22,.16,.055);
 if(part==="power")for(let i=0;i<4;i++)add(x,6.43+i*.195,z+1.47,3.22,.155,.055);
 if(part==="tor")for(let i=0;i<2;i++)add(x,7.24+i*.14,z+1.47,3.20,.115,.055);
 if(part==="cartridges")for(const dx of [-1.1,-.37,.37,1.1])add(x+dx,3.2,z-1.505,.22,7.14,.06);
 if(part==="manifolds")for(const dx of [-1.6,1.6])add(x+dx,3.23,z-1.58,.16,7.64,.06);
 if(part==="busbar")for(const dx of [-1.6,1.6])add(x+dx*.88,3.2,z-1.55,.13,7.50,.06);
 return entries;
}
export function nvl72GuideTotals(rackCount=80){
 if(!Number.isSafeInteger(rackCount)||rackCount<0)throw new RangeError("Invalid simulated compute rack count");
 const totals={};for(const [key,value] of Object.entries(NVL72_COMPUTE_REFERENCE)){
  if(typeof value==="number")totals[key]=value*rackCount;
 }
 return totals;
}
