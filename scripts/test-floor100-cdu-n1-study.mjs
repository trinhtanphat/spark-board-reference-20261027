import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance} from '../floor100-liquid-loop.mjs';
import {buildFloor100HydraulicPlan} from '../floor100-hydraulic.mjs';
import {buildFloor100CduN1Study} from '../floor100-cdu-n1-study.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),row:Math.floor(i/10),column:i%10,kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
const make=(load=100,options={},hydOpts={},deltaTK=10)=>{
 const water=buildFloor100WaterBalance(buildFloor100PowerModel(racks,load),{deltaTK});
 return buildFloor100CduN1Study(water,buildFloor100HydraulicPlan(water,hydOpts),options);
};
const base=make();
assert.equal(base.comparisons,8);assert.equal(base.scenarios.length,8);
assert.equal(base.ranking.length,8);
assert.equal(new Set(base.ranking.map(x=>x.cdu)).size,8);
assert.equal(base.worstIllustrativeCdu,2);
assert.ok(Math.abs(base.baselineModeledFlowLpm-12790.2)<1);
assert.deepEqual(base.scenarios.map(x=>x.blockedRows),[[1],[2,3],[4],[5],[6],[7],[8,9],[10]]);
assert.ok(base.scenarios.every(x=>x.pumpIsOff&&x.peakRiseC>0&&x.recoveryExcessProxyK>0));
assert.ok(base.scenarios.every(x=>x.modeledLossLpm>0&&x.modeledFlowLpm<base.baselineModeledFlowLpm));
assert.ok(base.scenarios.every(x=>x.maxProxyC>30&&x.recoveryEndMaxProxyC<x.maxProxyC));
assert.ok(base.scenarios.every(x=>x.comparisonOrder>=1&&x.comparisonOrder<=8));
assert.ok(base.scenarios[1].positiveExcessProxyKMinutes>base.scenarios[0].positiveExcessProxyKMinutes*1.8);
assert.equal(base.scenarios[1].positiveExcessProxyKMinutes,base.scenarios[6].positiveExcessProxyKMinutes);
assert.equal(base.ranking[0].cdu,2);assert.equal(base.ranking[1].cdu,7);
assert.equal(base.scenarios[1].comparisonOrder,1);assert.equal(base.scenarios[6].comparisonOrder,2);
const short=make(100,{incidentMinutes:5});
const long=make(100,{incidentMinutes:20});
assert.ok(short.scenarios[1].positiveExcessProxyKMinutes<base.scenarios[1].positiveExcessProxyKMinutes);
assert.ok(long.scenarios[1].positiveExcessProxyKMinutes>base.scenarios[1].positiveExcessProxyKMinutes);
const slow=make(100,{equivalentCapacityKJPerK:300000});
const fast=make(100,{equivalentCapacityKJPerK:120000});
assert.ok(slow.scenarios[1].peakRiseC<base.scenarios[1].peakRiseC);
assert.ok(fast.scenarios[1].peakRiseC>base.scenarios[1].peakRiseC);
const recover=make(100,{recoveryMinutes:40});
assert.ok(recover.scenarios[1].recoveryEndMaxProxyC<base.scenarios[1].recoveryEndMaxProxyC);
assert.ok(recover.scenarios[1].positiveExcessProxyKMinutes>base.scenarios[1].positiveExcessProxyKMinutes);
const half=make(60);
assert.ok(half.scenarios[1].positiveExcessProxyKMinutes<base.scenarios[1].positiveExcessProxyKMinutes);
const wider=make(100,{}, {diameterMM:200});
assert.ok(wider.baselineModeledFlowLpm>base.baselineModeledFlowLpm);
const delta=make(100,{}, {},15);
assert.ok(delta.baselineModeledFlowLpm>0);
const zeroPower=buildFloor100PowerModel(racks,100,1.2,Object.fromEntries(racks.map(r=>[r.id,0])));
const zeroWater=buildFloor100WaterBalance(zeroPower);
const zero=buildFloor100CduN1Study(zeroWater,buildFloor100HydraulicPlan(zeroWater));
assert.ok(zero.scenarios.every(x=>x.peakRiseC===0&&x.positiveExcessProxyKMinutes===0&&x.modeledFlowLpm===0));
assert.equal(zero.worstIllustrativeCdu,1);
for(const opts of [{incidentMinutes:0},{recoveryMinutes:0},{equivalentCapacityKJPerK:-3}])
 assert.throws(()=>make(100,opts),RangeError);
assert.throws(()=>buildFloor100CduN1Study(null,null),RangeError);
assert.throws(()=>buildFloor100CduN1Study(null,null,null),RangeError);
assert.equal(Object.isFrozen(base.scenarios[0].blockedRows),true);
assert.equal(Object.isFrozen(base.ranking),true);
assert.match(base.disclaimer,/NOT N\+1/);
console.log(JSON.stringify({status:'PASS',cases:8,worstCdu:base.worstIllustrativeCdu,
 first:base.scenarios[1].positiveExcessProxyKMinutes,
 baselineLpm:base.baselineModeledFlowLpm,rank:base.ranking.map(x=>x.cdu),
 notTelemetry:true}));
