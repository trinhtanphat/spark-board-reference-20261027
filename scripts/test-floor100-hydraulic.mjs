import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance} from '../floor100-liquid-loop.mjs';
import {buildFloor100HydraulicPlan,estimatePipeBranch,
 FLOOR100_HYDRAULIC_DIAMETERS_MM,FLOOR100_HYDRAULIC_LENGTHS_M} from '../floor100-hydraulic.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),
 row:Math.floor(i/10),column:i%10,kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
const base=buildFloor100WaterBalance(buildFloor100PowerModel(racks));
const original=JSON.stringify(base),hyd=buildFloor100HydraulicPlan(base);
assert.deepEqual(FLOOR100_HYDRAULIC_DIAMETERS_MM,[125,160,200]);
assert.deepEqual(FLOOR100_HYDRAULIC_LENGTHS_M,[20,30,40]);
assert.equal(hyd.rows.length,10);assert.equal(hyd.computeRackCount,80);
assert.equal(hyd.totalComputeTargetLpm,base.designFlowLpm);
assert.ok(Math.abs(hyd.representedRowTargetLpm-base.designFlowLpm)<.1);
assert.ok(hyd.maxRowBranchLossKPa>0&&hyd.maxRowVelocityMps>0);
assert.ok(hyd.rows.every(r=>r.flowRegime==='TURBULENT_APPROX'&&r.frictionFactor>0));
assert.ok(hyd.rows.every(r=>r.majorLossKPa>0&&r.minorLossKPa>0));
const fast=buildFloor100HydraulicPlan(base,{diameterMM:125});
const broad=buildFloor100HydraulicPlan(base,{diameterMM:200});
assert.ok(fast.maxRowBranchLossKPa>hyd.maxRowBranchLossKPa);
assert.ok(hyd.maxRowBranchLossKPa>broad.maxRowBranchLossKPa);
assert.ok(fast.maxRowVelocityMps>broad.maxRowVelocityMps);
const short=buildFloor100HydraulicPlan(base,{oneWayLengthM:20});
const long=buildFloor100HydraulicPlan(base,{oneWayLengthM:40});
assert.ok(long.maxRowBranchLossKPa>short.maxRowBranchLossKPa);
assert.ok(Math.abs(long.rows[0].minorLossKPa-short.rows[0].minorLossKPa)<.001);
const heat80=buildFloor100WaterBalance(buildFloor100PowerModel(racks,80));
const less=buildFloor100HydraulicPlan(heat80);
assert.ok(less.maxRowBranchLossKPa<hyd.maxRowBranchLossKPa);
const moreDelta=buildFloor100HydraulicPlan(buildFloor100WaterBalance(buildFloor100PowerModel(racks),{deltaTK:15}));
assert.ok(moreDelta.maxRowBranchLossKPa<hyd.maxRowBranchLossKPa);
const idle=estimatePipeBranch(0);
assert.equal(idle.lossKPa,0);assert.equal(idle.majorLossKPa,0);
assert.equal(idle.minorLossKPa,0);assert.equal(idle.flowRegime,'IDLE');
for(const bad of [[-1,160,30],[NaN,160,30],[100,100,30],[100,160,90]])
 assert.throws(()=>estimatePipeBranch(...bad),RangeError);
for(const opts of [{diameterMM:100},{diameterMM:'160'},{oneWayLengthM:31},{oneWayLengthM:Infinity}])
 assert.throws(()=>buildFloor100HydraulicPlan(base,opts),RangeError);
const broken=structuredClone(base);broken.rows[2].targetLpm=-10;
assert.throws(()=>buildFloor100HydraulicPlan(broken),RangeError);
assert.throws(()=>buildFloor100HydraulicPlan(null),RangeError);
assert.equal(JSON.stringify(base),original);
assert.match(hyd.disclaimer,/NOT an interconnected/);
console.log(JSON.stringify({status:'PASS',rows:hyd.rows.length,
 diameterMM:hyd.diameterMM,oneWayLengthM:hyd.oneWayLengthM,
 maxKPa:hyd.maxRowBranchLossKPa,velocityMps:hyd.maxRowVelocityMps,
 notPumpSizing:true}));
