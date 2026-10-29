/**
 * Fictional 100-rack thermal/cooling "what-if". It converts estimated IT
 * electric demand to a heat-equivalent planning target, then partitions this
 * target by an assumed liquid-heat-capture ratio.
 * This is NOT inlet temperature, coolant mass flow, CDU nameplate capacity,
 * rack operating state, certified heat rejection or NVIDIA telemetry.
 */
export const FLOOR100_LIQUID_CAPTURE_PRESETS=Object.freeze([80,90,95]);
export const FLOOR100_CDU_CAPACITY_PRESETS_KW=Object.freeze([1200,1400,1600]);
export const FLOOR100_DEMO_CDU_COUNT=8;
const round=v=>Math.round(v*100)/100;
export function buildFloor100ThermalPlan(power,{liquidCapturePercent=90,cduCapacityKW=1200,availableCDUs=8}={}){
 if(!power||!Array.isArray(power.entries)||power.entries.length!==100||
  !Array.isArray(power.rows)||power.rows.length!==10||
  !Number.isFinite(power.totalKW)||power.totalKW<0)
  throw new RangeError("Invalid DEMO rack electrical load model");
 if(!FLOOR100_LIQUID_CAPTURE_PRESETS.includes(liquidCapturePercent)||
  !FLOOR100_CDU_CAPACITY_PRESETS_KW.includes(cduCapacityKW)||
  !Number.isInteger(availableCDUs)||availableCDUs<0||availableCDUs>FLOOR100_DEMO_CDU_COUNT)
  throw new RangeError("Unsupported illustrative cooling planning assumptions");
 const fraction=liquidCapturePercent/100;
 const rows=power.rows.map((row,i)=>{
  const heatKW=round(row.estimatedKW),liquidKW=round(heatKW*fraction);
  const airKW=round(heatKW-liquidKW);
  const allocatedCapacityKW=availableCDUs*cduCapacityKW/10;
  return Object.freeze({row:i+1,heatKW,heatW:Math.round(heatKW*1000),
   liquidKW,liquidW:Math.round(liquidKW*1000),airKW,airW:Math.round(airKW*1000),
   nominalShareCapacityKW:allocatedCapacityKW,
   nominalUtilizationPercent:allocatedCapacityKW>0?round(liquidKW/allocatedCapacityKW*100):liquidKW>0?null:0,
   nominalExcessKW:round(Math.max(0,liquidKW-allocatedCapacityKW))});
 });
 const heatKW=round(power.totalKW);
 const liquidKW=round(rows.reduce((s,row)=>s+row.liquidKW,0));
 const airKW=round(heatKW-liquidKW);
 const capacityKW=availableCDUs*cduCapacityKW;
 const excessKW=round(Math.max(0,liquidKW-capacityKW));
 const utilizationPercent=capacityKW>0?round(liquidKW/capacityKW*100):liquidKW>0?null:0;
 const status=excessKW>0?"OVER_DEMO_CAPACITY":
  !availableCDUs&&liquidKW===0?"NO_ACTIVE_CDU":"WITHIN_DEMO_CAPACITY";
 return Object.freeze({
  liquidCapturePercent,cduCapacityKW,availableCDUs,
  installedCDUs:FLOOR100_DEMO_CDU_COUNT,
  heatKW,heatW:Math.round(heatKW*1000),liquidKW,liquidW:Math.round(liquidKW*1000),
  airKW,airW:Math.round(airKW*1000),capacityKW,excessKW,utilizationPercent,status,rows,
  disclaimer:"ILLUSTRATIVE HEAT-EQUIVALENT ONLY: no actual coolant capacity, measured temperature, liquid-flow estimate, redundancy, refrigeration, heat transfer or operational telemetry."
 });
}
