/**
 * Illustrative single-phase water heat-balance TARGET for NVL72 compute racks.
 * Physics: Q[kW] = m_dot[kg/s] * cp[kJ/(kg K)] * DeltaT[K].
 * Not a hydraulic solver: no pipe sizing, pressure, pump curves or measurement.
 */
export const FLOOR100_WATER_DELTA_T_PRESETS_K=Object.freeze([5,10,15]);
export const FLOOR100_WATER_CP_KJ_KG_K=4.186;
export const FLOOR100_WATER_DENSITY_KG_L=0.997;
const round=(n,places=2)=>Number(n.toFixed(places));
export function buildFloor100WaterBalance(power,{
 liquidCapturePercent=90,deltaTK=10
}={}){
 if(!power||!Array.isArray(power.entries)||power.entries.length!==100||
  !Number.isFinite(power.totalKW)||power.totalKW<0)
  throw new RangeError("Expected valid 100-rack DEMO power profile");
 if(![80,90,95].includes(liquidCapturePercent)||
  !FLOOR100_WATER_DELTA_T_PRESETS_K.includes(deltaTK))
  throw new RangeError("Unsupported DEMO water balance assumption");
 const ids=new Set(),byRow=Array.from({length:10},()=>[]);
 for(const entry of power.entries){
  if(!entry||!/^R[0-9]{3}$/.test(entry.id)||ids.has(entry.id)||
   !["compute","fabric","storage"].includes(entry.kind)||
   !Number.isInteger(entry.row)||entry.row<0||entry.row>9||
   !Number.isSafeInteger(entry.estimatedW)||entry.estimatedW<0)
    throw new RangeError("Invalid 100-rack water balance input");
  ids.add(entry.id);byRow[entry.row].push(entry);
 }
 const heatToFlow=(kw)=>kw/(FLOOR100_WATER_CP_KJ_KG_K*deltaTK)/
  FLOOR100_WATER_DENSITY_KG_L*60;
 const fraction=liquidCapturePercent/100;
 const computeEntries=power.entries.filter(x=>x.kind==="compute");
 const otherEntries=power.entries.filter(x=>x.kind!=="compute");
 const computeHeatKW=computeEntries.reduce((s,e)=>s+e.estimatedW,0)/1000;
 const unmappedHeatKW=otherEntries.reduce((s,e)=>s+e.estimatedW,0)/1000;
 const computeLiquidKW=computeHeatKW*fraction;
 const unmappedLiquidKW=unmappedHeatKW*fraction;
 const racks=computeEntries.map(e=>{
  const heatKW=e.estimatedW/1000,liquidKW=heatKW*fraction;
  return Object.freeze({id:e.id,row:e.row+1,heatKW:round(heatKW),
   liquidKW:round(liquidKW),targetLpm:round(heatToFlow(liquidKW),2)});
 });
 const rows=byRow.map((entries,i)=>{
  const computeKW=entries.filter(e=>e.kind==="compute")
   .reduce((s,e)=>s+e.estimatedW,0)/1000*fraction;
  const excludedKW=entries.filter(e=>e.kind!=="compute")
   .reduce((s,e)=>s+e.estimatedW,0)/1000*fraction;
  return Object.freeze({row:i+1,computeLiquidKW:round(computeKW),
   targetLpm:round(heatToFlow(computeKW),2),unmappedLiquidKW:round(excludedKW)});
 });
 return Object.freeze({deltaTK,liquidCapturePercent,
  cpKJPerKgK:FLOOR100_WATER_CP_KJ_KG_K,
  waterDensityKgPerL:FLOOR100_WATER_DENSITY_KG_L,
  computeRackCount:computeEntries.length,unmappedRackCount:otherEntries.length,
  computeLiquidKW:round(computeLiquidKW),
  excludedLiquidKW:round(unmappedLiquidKW),
  facilityHypotheticalLiquidKW:round(computeLiquidKW+unmappedLiquidKW),
  designFlowLpm:round(heatToFlow(computeLiquidKW)),
  designFlowM3h:round(heatToFlow(computeLiquidKW)*.06),
  racks:Object.freeze(racks),rows:Object.freeze(rows),
  disclaimer:"DEMO WATER FLOW TARGET from energy balance, NOT measured water flow. Only NVL72 compute racks assigned to the illustrative liquid loop. Noncompute rack loads are explicitly excluded. No pump sizing, pressures, pipe friction, heat exchanger performance, coolant mixture, redundancy, real supply/return temperature or certified NVIDIA flow rating."
 });
}
