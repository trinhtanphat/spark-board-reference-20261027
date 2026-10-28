/**
 * Indicative electrical *route visibility* for the 100-rack artwork.
 * This does not model power redundancy or measure rack availability.
 * Computer rack stubs alternate A/B by COLUMN for schematic visibility.
 * Fabric/storage feed wiring is not modeled, therefore "unmapped".
 */
export const FLOOR100_ROUTE_SCENARIOS=Object.freeze(["normal","a-loss","b-loss","grid-loss"]);
export function buildFloor100Impact(racks,scenario="normal"){
 if(!FLOOR100_ROUTE_SCENARIOS.includes(scenario))throw new RangeError("Unsupported visual scenario");
 if(!Array.isArray(racks)||racks.length!==100)throw new RangeError("Expected 100 visual rack positions");
 const entries=racks.map(r=>{
  if(r.kind!=="compute")return {id:r.id,row:r.row,kind:r.kind,feed:"unmapped",status:"unmapped"};
  const feed=r.column%2===0?"A":"B";
  const pathVisible=scenario==="normal"||(scenario==="a-loss"&&feed==="B")||(scenario==="b-loss"&&feed==="A");
  return {id:r.id,row:r.row,kind:r.kind,feed,status:pathVisible?"visible":"dimmed"};
 });
 const counts={visible:0,dimmed:0,unmapped:0};
 for(const entry of entries)counts[entry.status]++;
 const rows=Array.from({length:10},(_,i)=>{
  const record=entries.filter(e=>e.row===i);
  return {row:i+1,visible:record.filter(e=>e.status==="visible").length,
   dimmed:record.filter(e=>e.status==="dimmed").length,
   unmapped:record.filter(e=>e.status==="unmapped").length};
 });
 return {scenario,entries,counts,rows,disclaimer:"ILLUSTRATIVE ROUTE VISIBILITY ONLY: does not indicate actual rack power, redundancy, cooling or operational state."};
}
