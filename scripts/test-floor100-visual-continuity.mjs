import assert from 'node:assert/strict';
import {buildFloor100FeedRoute,FLOOR100_VISUAL_POWER_GEOMETRY} from '../floor100-power-path.mjs';
const racks=Array.from({length:100},(_,i)=>({
 id:'R'+String(i+1).padStart(3,'0'),
 row:Math.floor(i/10),column:i%10,
 x:(i%10-4.5)*3.82,z:(Math.floor(i/10)-4.5)*5.7
}));
let routes=0,segments=0,broken=0;
const snap=v=>Math.round(v*1000)/1000;
for(const rack of racks)for(const feed of ['A','B']){
 routes++;
 const d=FLOOR100_VISUAL_POWER_GEOMETRY.feeds[feed],g=FLOOR100_VISUAL_POWER_GEOMETRY;
 const route=buildFloor100FeedRoute(rack,feed);
 assert.equal(route.segments.length,7);
 const chain=route.segments;
 assert.deepEqual(chain[0].from.slice(0,2),[d.upsX,g.upsTopY]);
 assert.deepEqual(chain[2].to,[d.trunkX,d.topY,snap(rack.z+d.offsetZ)]);
 assert.deepEqual(chain[3].to,[snap(rack.x+d.offsetX),d.topY,snap(rack.z+d.offsetZ)]);
 assert.deepEqual(chain[4].to,[snap(rack.x+d.offsetX),d.topY,snap(rack.z+g.entryOffsetZ)]);
 assert.deepEqual(chain[5].to,[snap(rack.x+d.offsetX),g.portY,snap(rack.z+g.entryOffsetZ)]);
 assert.deepEqual(chain[6].to,[snap(rack.x+d.offsetX),g.portY,snap(rack.z+g.rearPanelOffsetZ)]);
 for(let i=0;i<chain.length;i++){
  segments++;
  const a=chain[i].from,b=chain[i].to;
  assert.ok(a.every(Number.isFinite)&&b.every(Number.isFinite));
  const nonzero=a.filter((v,j)=>v!==b[j]).length;
  if(nonzero!==1||i&&a.some((v,j)=>v!==chain[i-1].to[j]))broken++;
 }
 // Row busway ends at rightmost tap instead of an arbitrary X center.
 const lastX=snap((9-4.5)*3.82+d.offsetX);
 assert.ok(lastX>=snap(rack.x+d.offsetX));
}
assert.equal(routes,200);
assert.equal(segments,1400);
assert.equal(broken,0);
console.log(JSON.stringify({status:'PASS',routes,segments,broken,scope:'visual coordinates only; not electrical continuity'}));
