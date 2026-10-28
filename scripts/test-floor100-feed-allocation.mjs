import assert from "node:assert/strict";
import {buildFloor100PowerModel} from "../floor100-power.mjs";
import {buildFloor100FeedAllocation,FLOOR100_DEMO_FEED_CAPACITIES,
 FLOOR100_FEED_ALLOCATION_METHOD} from "../floor100-feed-allocation.mjs";
const racks=Array.from({length:100},(_,i)=>({id:"R"+String(i+1).padStart(3,"0"),
 row:Math.floor(i/10),column:i%10,kind:i%10<8?"compute":i%10===8?"fabric":"storage"}));
const watts=buildFloor100PowerModel(racks);
const normal=buildFloor100FeedAllocation(watts);
assert.deepEqual(FLOOR100_DEMO_FEED_CAPACITIES,[6000,11000,14000]);
assert.ok(FLOOR100_FEED_ALLOCATION_METHOD.includes("NOT_LIVE_TELEMETRY"));
assert.equal(normal.status,"WITHIN_DEMO_CAPACITY");
assert.equal(normal.demandKW,10020);
assert.equal(normal.aKW,5010);assert.equal(normal.bKW,5010);
assert.equal(normal.aW,5010000);assert.equal(normal.bW,5010000);
assert.equal(normal.aPct,83.5);assert.equal(normal.bPct,83.5);
assert.equal(normal.rows.length,10);
assert.ok(normal.rows.every(r=>r.aKW===501&&r.bKW===501&&r.aPct===83.5&&!r.aOver&&!r.bOver));
const lossA=buildFloor100FeedAllocation(watts,"a-loss");
assert.equal(lossA.status,"OVER_CAPACITY");
assert.equal(lossA.aKW,0);assert.equal(lossA.bKW,10020);
assert.equal(lossA.bPct,167);
assert.ok(lossA.rows.every(r=>r.aKW===0&&r.bKW===1002&&r.bOver&&!r.aOver));
const lossB=buildFloor100FeedAllocation(watts,"b-loss");
assert.equal(lossB.status,"OVER_CAPACITY");
assert.equal(lossB.aKW,10020);assert.equal(lossB.bKW,0);
const blackout=buildFloor100FeedAllocation(watts,"grid-loss");
assert.equal(blackout.status,"UNASSIGNED_DEMAND");
assert.equal(blackout.aKW,0);assert.equal(blackout.bKW,0);
assert.equal(blackout.unassignedKW,10020);assert.equal(blackout.unassignedW,10020000);
assert.ok(blackout.rows.every(r=>r.unassignedKW===1002&&!r.aOver&&!r.bOver));
const larger=buildFloor100FeedAllocation(watts,"a-loss",11000);
assert.equal(larger.status,"WITHIN_DEMO_CAPACITY");assert.equal(larger.bKW,10020);
assert.equal(buildFloor100FeedAllocation(watts,"a-loss",14000).status,"WITHIN_DEMO_CAPACITY");
const smaller=buildFloor100FeedAllocation(buildFloor100PowerModel(racks,60),"a-loss");
assert.equal(smaller.status,"OVER_CAPACITY");assert.equal(smaller.bKW,6012);
assert.equal(buildFloor100FeedAllocation(buildFloor100PowerModel(racks,60),"normal").aKW,3006);
assert.throws(()=>buildFloor100FeedAllocation(null),RangeError);
assert.throws(()=>buildFloor100FeedAllocation(watts,"bad"),RangeError);
assert.throws(()=>buildFloor100FeedAllocation(watts,"normal",1234),RangeError);
assert.ok(normal.disclaimer.includes("not real transfer"));
assert.equal(watts.totalKW,10020); // read-only allocations
console.log(JSON.stringify({status:"PASS",racks:100,normal:{a:normal.aKW,b:normal.bKW},
 lossA:{a:lossA.aKW,b:lossA.bKW,status:lossA.status},gridUnassigned:blackout.unassignedKW,
 rowMeters:20,telemetry:false,actualTransfer:false}));
