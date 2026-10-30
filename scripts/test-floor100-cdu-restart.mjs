import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance} from '../floor100-liquid-loop.mjs';
import {buildFloor100HydraulicPlan} from '../floor100-hydraulic.mjs';
import {buildFloor100CduRestartComparison} from '../floor100-cdu-restart.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),
 row:Math.floor(i/10),column:i%10,kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
function run(options={},load=100,hydOpts={}){
 const w=buildFloor100WaterBalance(buildFloor100PowerModel(racks,load));
 return buildFloor100CduRestartComparison(w,buildFloor100HydraulicPlan(w,hydOpts),options);
}
const x=run();assert.equal(x.comparisons,3);
assert.deepEqual(x.cases.map(c=>c.rampMinutes),[0,6,12]);
assert.deepEqual(x.affectedRows,[2,3]);
assert.equal(x.healthyCduFlowLpm>0,true);
assert.equal(x.recoveryEndMinute,35);assert.equal(x.incidentEndMinute,15);
assert.equal(x.selectedRampMinutes,6);
for(const c of x.cases){
 assert.equal(c.timeline.length,36);assert.equal(c.stageSchedule.length,20);
 assert.equal(c.timeline[0].maxProxyC,30);
 assert.equal(c.timeline[5].maxProxyC,30);
 assert.equal(c.timeline[15].cduPumpSpeedPercent,c.rampMinutes?0:100);
 assert.equal(c.timeline[15].maxProxyC,c.timeline[15].rowProxyC[1]);
 assert.equal(c.cduFinalPumpSpeedPercent,100);
 assert.ok(c.afterRecoveryMaxProxyC>30&&c.afterRecoveryMaxProxyC<c.maxProxyC);
 assert.ok(c.timeline.every(t=>t.rowProxyC[0]===30&&t.rowProxyC[3]===30));
 assert.ok(c.completeRampWithinWindow);
}
assert.deepEqual(x.cases[1].stageSchedule.map(s=>s.cduPumpSpeedPercent).slice(0,8),[0,0,60,60,80,80,100,100]);
assert.deepEqual(x.cases[2].stageSchedule.map(s=>s.cduPumpSpeedPercent).slice(0,14),[0,0,0,0,60,60,60,60,80,80,80,80,100,100]);
assert.ok(x.cases[0].positiveExcessProxyKMinutes<x.cases[1].positiveExcessProxyKMinutes);
assert.ok(x.cases[1].positiveExcessProxyKMinutes<x.cases[2].positiveExcessProxyKMinutes);
assert.ok(x.cases[0].afterRecoveryMaxProxyC<x.cases[1].afterRecoveryMaxProxyC);
assert.ok(x.cases[1].afterRecoveryMaxProxyC<x.cases[2].afterRecoveryMaxProxyC);
assert.ok(x.additionalProxyBurdenVsInstantKMinutes>0);
const y=run({selectedRampMinutes:0});
assert.equal(y.additionalProxyBurdenVsInstantKMinutes,0);
assert.equal(y.selected.rampMinutes,0);
const seven=run({cdu:7});assert.deepEqual(seven.affectedRows,[8,9]);
const one=run({cdu:1});assert.deepEqual(one.affectedRows,[1]);
assert.ok(one.cases[2].positiveExcessProxyKMinutes<x.cases[2].positiveExcessProxyKMinutes);
const w=run({incidentMinutes:20,recoveryMinutes:40});
assert.equal(w.recoveryEndMinute,65);
assert.ok(w.cases[2].positiveExcessProxyKMinutes>x.cases[2].positiveExcessProxyKMinutes);
const short=run({incidentMinutes:5});
assert.ok(short.cases[2].positiveExcessProxyKMinutes<x.cases[2].positiveExcessProxyKMinutes);
const heavy=run({},60);assert.ok(heavy.cases[2].peakRiseC<x.cases[2].peakRiseC);
const narrow=run({},100,{diameterMM:125});
assert.ok(narrow.healthyCduFlowLpm<x.healthyCduFlowLpm);
const lowMass=run({equivalentCapacityKJPerK:120000});
assert.ok(lowMass.cases[2].peakRiseC>x.cases[2].peakRiseC);
const zeroPower=buildFloor100PowerModel(racks,100,1.2,Object.fromEntries(racks.map(r=>[r.id,0])));
const zw=buildFloor100WaterBalance(zeroPower);
const zero=buildFloor100CduRestartComparison(zw,buildFloor100HydraulicPlan(zw));
assert.ok(zero.cases.every(c=>c.maxProxyC===30&&c.positiveExcessProxyKMinutes===0));
for(const opt of [{cdu:0},{cdu:9},{cdu:1.5},{selectedRampMinutes:5},{incidentMinutes:7},{recoveryMinutes:4},{equivalentCapacityKJPerK:123}])
 assert.throws(()=>run(opt),RangeError);
assert.throws(()=>buildFloor100CduRestartComparison(null,null),RangeError);
assert.equal(Object.isFrozen(x.cases),true);assert.equal(Object.isFrozen(x.selected.timeline),true);
assert.match(x.disclaimer,/not NVIDIA restart procedures/i);
console.log(JSON.stringify({status:'PASS',cases:3,rows:x.affectedRows,window:x.recoveryEndMinute,burdens:x.cases.map(c=>c.positiveExcessProxyKMinutes),noTelemetry:true}));
