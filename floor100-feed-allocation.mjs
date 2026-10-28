/**
 * Planning-only dual-feed A/B load allocation, NOT measured electrical current.
 *
 * Every rack's illustrative estimated IT load is allocated 50/50 in Normal.
 * A/B incident modes hypothetically allocate 100% to the other feed, only to
 * expose capacity planning pressure. This is a WHAT-IF demand target, not
 * an assertion that power transfer occurs or that redundancy exists.
 * Grid-loss leaves all estimated demand UNASSIGNED, without implying actual
 * downtime or generator/UPS restoration.
 */
export const FLOOR100_DEMO_FEED_CAPACITIES=Object.freeze([6000,11000,14000]);
export const FLOOR100_FEED_ALLOCATION_METHOD="ILLUSTRATIVE_WORST_CASE_DEMAND_ALLOCATION_NOT_LIVE_TELEMETRY";
const scenarios=new Set(["normal","a-loss","b-loss","grid-loss"]);
const r2=v=>Math.round(v*100)/100;
export function buildFloor100FeedAllocation(power,scenario="normal",capacityKW=6000){
 if(!power||!Array.isArray(power.entries)||power.entries.length!==100 ||
  !Number.isFinite(power.totalKW)||power.totalKW<0)throw new RangeError("Invalid estimated power model");
 if(!scenarios.has(scenario))throw new RangeError("Invalid outage illustration");
 if(!FLOOR100_DEMO_FEED_CAPACITIES.includes(capacityKW))throw new RangeError("Unsupported DEMO feed capacity");
 const allocations=scenario==="normal"?[.5,.5,0]:
  scenario==="a-loss"?[0,1,0]:
  scenario==="b-loss"?[1,0,0]:[0,0,1];
 const rows=Array.from({length:10},(_,row)=>{
  const entries=power.entries.filter(r=>r.row===row);
  if(entries.length!==10)throw new RangeError("Invalid 10-rack floor row");
  const demandKW=r2(entries.reduce((sum,r)=>sum+r.estimatedKW,0));
  const aKW=r2(demandKW*allocations[0]),bKW=r2(demandKW*allocations[1]);
  const unassignedKW=r2(demandKW*allocations[2]),rowCapacityKW=capacityKW/10;
  return Object.freeze({row:row+1,demandKW,aKW,bKW,unassignedKW,
   capacityPerFeedKW:rowCapacityKW,
   aPct:r2(aKW/rowCapacityKW*100),bPct:r2(bKW/rowCapacityKW*100),
   aOver:aKW>rowCapacityKW,bOver:bKW>rowCapacityKW});
 });
 const aKW=r2(rows.reduce((s,r)=>s+r.aKW,0)),bKW=r2(rows.reduce((s,r)=>s+r.bKW,0));
 const unassignedKW=r2(rows.reduce((s,r)=>s+r.unassignedKW,0));
 const aPct=r2(aKW/capacityKW*100),bPct=r2(bKW/capacityKW*100);
 const status=unassignedKW>0?"UNASSIGNED_DEMAND":
  aKW>capacityKW||bKW>capacityKW?"OVER_CAPACITY":"WITHIN_DEMO_CAPACITY";
 return Object.freeze({
  scenario,capacityKW,status,demandKW:r2(power.totalKW),aKW,bKW,unassignedKW,
  aW:Math.round(aKW*1000),bW:Math.round(bKW*1000),
  unassignedW:Math.round(unassignedKW*1000),
  aPct,bPct,rows,
  assumptions:FLOOR100_FEED_ALLOCATION_METHOD,
  disclaimer:"Planning-only A/B WHAT-IF: not real transfer, breaker/PDU ratings, UPS autonomy, operational status, safety verification, manufacturer consumption or telemetry."
 });
}
