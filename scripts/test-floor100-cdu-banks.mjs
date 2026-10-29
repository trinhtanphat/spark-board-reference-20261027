import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance} from '../floor100-liquid-loop.mjs';
import {buildFloor100HydraulicPlan} from '../floor100-hydraulic.mjs';
import {buildFloor100CoolantFault} from '../floor100-coolant-topology.mjs';
import {buildFloor100CduBanks} from '../floor100-cdu-banks.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),row:Math.floor(i/10),column:i%10,
 kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
const make=(speed=Array(8).fill(100),faultOptions={},load=100)=>{
 const water=buildFloor100WaterBalance(buildFloor100PowerModel(racks,load));
 return buildFloor100CduBanks(water,buildFloor100HydraulicPlan(water),
  buildFloor100CoolantFault(water,faultOptions),{pumpSpeeds:speed});
};
const normal=make();
assert.equal(normal.banks.length,8);assert.equal(normal.rows.length,10);
assert.equal(normal.computeRacksMapped,80);assert.equal(normal.maxPressureResidualKPa,0);
assert.equal(normal.rows.filter(r=>r.blocked).length,0);
assert.deepEqual(normal.banks.map(x=>x.rowNumbers),[[1],[2,3],[4],[5],[6],[7],[8,9],[10]]);
assert.ok(normal.banks.every(x=>x.status==='SIMULATED_FLOW'&&x.modeledLpm>0&&x.pumpHeadKPa>0));
assert.ok(normal.banks.every(x=>Math.abs(x.pumpHeadKPa-x.commonBranchHeadKPa-x.headerLossKPa)<.07));
assert.ok(Math.abs(normal.rows.reduce((s,r)=>s+r.modeledLpm,0)-normal.modeledFlowLpm)<.15);
const speeds=Array(8).fill(100);speeds[1]=60;
const slower=make(speeds);
assert.ok(slower.banks[1].modeledLpm<normal.banks[1].modeledLpm);
for(let i=0;i<8;i++)if(i!==1)assert.equal(slower.banks[i].modeledLpm,normal.banks[i].modeledLpm);
speeds[1]=0;
const off=make(speeds);
assert.equal(off.banks[1].modeledLpm,0);assert.equal(off.banks[1].status,'PUMP_OFF');
assert.deepEqual(off.rows.filter(x=>x.blocked).map(x=>x.row),[2,3]);
assert.ok(off.banks.every((x,i)=>i===1||x.modeledLpm===normal.banks[i].modeledLpm));
const failure=make(Array(8).fill(100),{failedCdu:2});
assert.equal(failure.banks[1].status,'PUMP_OFF');
assert.equal(failure.rows[1].modeledLpm,0);assert.equal(failure.rows[2].modeledLpm,0);
const rowIsolation=make(Array(8).fill(100),{isolatedRow:2});
assert.equal(rowIsolation.rows[1].modeledLpm,0);
assert.ok(rowIsolation.rows[2].modeledLpm>normal.rows[2].modeledLpm);
assert.ok(rowIsolation.banks[1].modeledLpm<normal.banks[1].modeledLpm);
assert.ok(rowIsolation.banks.every((x,i)=>i===1||x.modeledLpm===normal.banks[i].modeledLpm));
const noDouble=make(speeds,{failedCdu:2,isolatedRow:2});
assert.equal(noDouble.blockedDemandLpm,off.blockedDemandLpm);
assert.equal(noDouble.rows.filter(r=>r.blocked).length,2);
const lower=make(Array(8).fill(100),{},60);
assert.ok(lower.designTargetLpm<normal.designTargetLpm);
assert.ok(lower.modeledFlowLpm>0);
const zeroPower=buildFloor100PowerModel(racks,100,1.2,Object.fromEntries(racks.map(r=>[r.id,0])));
const zw=buildFloor100WaterBalance(zeroPower);
const zero=buildFloor100CduBanks(zw,buildFloor100HydraulicPlan(zw),buildFloor100CoolantFault(zw));
assert.equal(zero.modeledFlowLpm,0);assert.equal(zero.maxPressureResidualKPa,0);
assert.ok(zero.banks.every(x=>x.status==='NO_DESIGN_DEMAND'));
for(const arr of [[],[100],Array(8).fill(120),Array(8).fill('100')]){
 assert.throws(()=>make(arr),RangeError);
}
assert.throws(()=>buildFloor100CduBanks(null,null,null),RangeError);
assert.equal(Object.isFrozen(normal),true);
assert.equal(Object.isFrozen(normal.rows),true);
assert.equal(Object.isFrozen(normal.pumpSpeeds),true);
assert.match(normal.caveat,/NO CROSSFEED/);
console.log(JSON.stringify({status:'PASS',banks:8,rows:10,assigned:normal.banks.map(x=>x.rowNumbers),
 modeledLpm:normal.modeledFlowLpm,targetLpm:normal.designTargetLpm,residual:normal.maxPressureResidualKPa,
 stoppedCduRows:off.rows.filter(r=>r.blocked).map(r=>r.row),noActualTelemetry:true}));
