/**
 * Browser-only estimated load calculator for conceptual 100-rack AI factory.
 * These are user-facing DEMO assumptions, never measured or official NVIDIA
 * rack draw. No connection to a PDU, BMS, UPS, or physical power feed.
 */
export const FLOOR100_POWER_PROFILE=Object.freeze({
 compute:Object.freeze({estimatedKW:120,peakKW:140}),
 fabric:Object.freeze({estimatedKW:18,peakKW:24}),
 storage:Object.freeze({estimatedKW:24,peakKW:32})
});
export const FLOOR100_POWER_SCENARIOS=Object.freeze([60,80,100]);
export const FLOOR100_DEMO_PUE=1.20;
const round=(v)=>Math.round(v*100)/100;
export function buildFloor100PowerModel(racks,loadPercent=100,pue=FLOOR100_DEMO_PUE){
 if(!Array.isArray(racks)||racks.length!==100)throw new RangeError("Expected 100 visual rack positions");
 if(!FLOOR100_POWER_SCENARIOS.includes(loadPercent))throw new RangeError("Unsupported illustrative load scenario");
 if(!Number.isFinite(pue)||pue<1||pue>2.5)throw new RangeError("Unsupported illustrative PUE");
 const seen=new Set();
 const entries=racks.map(r=>{
  const profile=FLOOR100_POWER_PROFILE[r?.kind];
  if(!profile||!/^R[0-9]{3}$/.test(r.id)||seen.has(r.id)||
   !Number.isInteger(r.row)||r.row<0||r.row>9||
   !Number.isInteger(r.column)||r.column<0||r.column>9)
   throw new RangeError("Invalid/duplicate visual rack");
  seen.add(r.id);
  const estimatedKW=round(profile.estimatedKW*loadPercent/100);
  return {id:r.id,row:r.row,column:r.column,kind:r.kind,estimatedKW,
   estimatedW:Math.round(estimatedKW*1000),peakKW:profile.peakKW,
   peakW:profile.peakKW*1000,feedA:"illustrative",feedB:"illustrative",
   heatBand:estimatedKW>=80?"high":estimatedKW>=22?"medium":"low"};
 });
 const totalKW=round(entries.reduce((sum,r)=>sum+r.estimatedKW,0));
 const peakKW=entries.reduce((sum,r)=>sum+r.peakKW,0);
 const rows=Array.from({length:10},(_,i)=>{
  const subset=entries.filter(e=>e.row===i);
  return {row:i+1,racks:subset.length,estimatedKW:round(subset.reduce((sum,r)=>sum+r.estimatedKW,0)),
   estimatedW:Math.round(subset.reduce((sum,r)=>sum+r.estimatedW,0))};
 });
 return {
  loadPercent,pue,totalKW,totalW:Math.round(totalKW*1000),peakKW,peakW:peakKW*1000,
  facilityKW:round(totalKW*pue),facilityW:Math.round(totalKW*pue*1000),
  averageKW:round(totalKW/entries.length),rows,entries,
  kindCounts:{compute:entries.filter(e=>e.kind==="compute").length,
   fabric:entries.filter(e=>e.kind==="fabric").length,
   storage:entries.filter(e=>e.kind==="storage").length},
  disclaimer:"ESTIMATED DEMO POWER ONLY: no actual rack watt reading, electrical redundancy validation, UPS sizing, thermal engineering or live telemetry."
 };
}
