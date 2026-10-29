import assert from "node:assert/strict";
import {buildFloor100CoolingRoute,buildFloor100CoolingRoutes,FLOOR100_COOLING_TRACE_MODES,FLOOR100_COOLING_HARDWARE_GUIDE} from "../floor100-cooling-path.mjs";
const racks=Array.from({length:100},(_,i)=>({
 id:"R"+String(i+1).padStart(3,"0"),row:Math.floor(i/10),column:i%10,
 kind:i%10<8?"compute":i%10===8?"fabric":"storage",
 x:(i%10-4.5)*3.82,z:(Math.floor(i/10)-4.5)*5.70
}));
assert.deepEqual(FLOOR100_COOLING_TRACE_MODES,["off","both","supply","return"]);
assert.equal(FLOOR100_COOLING_HARDWARE_GUIDE,"https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html");
const r1=racks[0],r91=racks[90];
const check=(path,rack)=>{
 assert.equal(path.rackId,rack.id);assert.equal(path.segments.length,6);
 assert.equal(path.visualOnly,true);
 assert.ok(path.disclaimer.includes("NO real pump-head"));
 for(let i=0;i<path.segments.length;i++){
  const s=path.segments[i];
  assert.ok(s.from.every(Number.isFinite)&&s.to.every(Number.isFinite));
  assert.notDeepEqual(s.from,s.to);
  if(i)assert.deepEqual(path.segments[i-1].to,s.from);
 }
};
const both=buildFloor100CoolingRoutes(r1);
assert.equal(both.length,2);
assert.deepEqual(both.map(p=>p.channel),["supply","return"]);
for(const p of both)check(p,r1);
assert.equal(both[0].segments[0].from[0],25);
assert.equal(both[0].segments.at(-1).to[0],Math.round((r1.x-1.6)*1000)/1000);
assert.equal(both[1].segments[0].from[0],Math.round((r1.x+1.6)*1000)/1000);
assert.equal(both[1].segments.at(-1).to[0],25);
assert.deepEqual(buildFloor100CoolingRoutes(r1,"supply").map(p=>p.channel),["supply"]);
assert.deepEqual(buildFloor100CoolingRoutes(r1,"return").map(p=>p.channel),["return"]);
assert.deepEqual(buildFloor100CoolingRoutes(r1,"off"),[]);
assert.equal(buildFloor100CoolingRoutes(racks[8],"both").length,0);
assert.equal(buildFloor100CoolingRoutes(racks[9],"both").length,0);
assert.equal(buildFloor100CoolingRoutes(racks[98],"return").length,0);
assert.notEqual(buildFloor100CoolingRoute(r1,"supply").cduReference,
 buildFloor100CoolingRoute(r91,"supply").cduReference);
assert.equal(buildFloor100CoolingRoute(r91,"return").rackId,"R091");
const allCompute=racks.filter(r=>r.kind==="compute");
assert.equal(allCompute.length,80);
for(const rack of allCompute){
 const routes=buildFloor100CoolingRoutes(rack);
 assert.equal(routes.length,2);
 for(const path of routes)check(path,rack);
}
assert.throws(()=>buildFloor100CoolingRoute(racks[8],"supply"),RangeError);
assert.throws(()=>buildFloor100CoolingRoute(r1,"air"),RangeError);
assert.throws(()=>buildFloor100CoolingRoutes(r1,"invalid"),RangeError);
assert.throws(()=>buildFloor100CoolingRoutes(null),RangeError);
assert.throws(()=>buildFloor100CoolingRoute({...r1,x:Infinity},"return"),RangeError);
assert.throws(()=>buildFloor100CoolingRoute({...r1,row:12},"supply"),RangeError);
console.log(JSON.stringify({status:"PASS",computeRacks:80,liquidRoutesPerComputeRack:2,
 visualSegmentsPerSelectedRack:12,nonComputeRacksUnmapped:20,officialSitePipeCAD:false}));
