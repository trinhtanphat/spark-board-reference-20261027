import assert from 'node:assert/strict';
import {buildFloor100FeedRoute,buildFloor100FeedRoutes,FLOOR100_TRACE_MODES,FLOOR100_POWER_REFERENCE} from '../floor100-power-path.mjs';
const rack=(id,row,column)=>({id,row,column,x:(column-4.5)*3.82,z:(row-4.5)*5.7});
const r1=rack("R001",0,0),r100=rack("R100",9,9);
assert.deepEqual(FLOOR100_TRACE_MODES,["off","both","A","B"]);
assert.ok(FLOOR100_POWER_REFERENCE.startsWith("https://docs.nvidia.com/dgx/dgxvr-user-guide/"));
const modes=[["normal",["shown","shown"]],["a-loss",["dimmed","shown"]],["b-loss",["shown","dimmed"]],["grid-loss",["dimmed","dimmed"]]];
for(const [scenario,states] of modes){
 const paths=buildFloor100FeedRoutes(r1,"both",scenario);
 assert.equal(paths.length,2);
 assert.deepEqual(paths.map(x=>x.feed),["A","B"]);
 assert.deepEqual(paths.map(x=>x.visualState),states);
 assert.equal(paths[0].rackId,"R001");
 assert.ok(paths.every(x=>x.segments.length===6&&x.disclaimer.includes("no live load reading")));
 for(const path of paths){
  for(let i=0;i<path.segments.length;i++){
   const seg=path.segments[i];
   assert.equal(seg.from.length,3);
   assert.equal(seg.to.length,3);
   assert.ok(seg.to.every(Number.isFinite));
   assert.notDeepEqual(seg.from,seg.to);
   if(i>0)assert.deepEqual(path.segments[i-1].to,seg.from);
  }
  assert.equal(path.segments.at(-1).to[1],2.75);
  assert.equal(path.segments.at(-1).to[2],r1.z-1.64);
  assert.equal(path.segments.at(-1).to[0],r1.x+(path.feed==="A"?-1.35:1.35));
 }
}
assert.equal(buildFloor100FeedRoutes(r1,"off").length,0);
assert.equal(buildFloor100FeedRoutes(r1,"A")[0].feed,"A");
assert.equal(buildFloor100FeedRoutes(r1,"B")[0].feed,"B");
assert.equal(buildFloor100FeedRoute(r100,"B","grid-loss").rackId,"R100");
assert.equal(buildFloor100FeedRoute(r100,"A").row,10);
assert.throws(()=>buildFloor100FeedRoutes(r1,"invalid"),RangeError);
assert.throws(()=>buildFloor100FeedRoute(r1,"C"),RangeError);
assert.throws(()=>buildFloor100FeedRoute(r1,"A","invalid"),RangeError);
assert.throws(()=>buildFloor100FeedRoute({...r1,z:NaN},"A"),RangeError);
console.log(JSON.stringify({status:"PASS",oneRack:"R001",scenarios:modes.length,perFeedSegments:6,dualFeedSegments:12,allRacksSupported:true,officialElectricalTopology:false}));
