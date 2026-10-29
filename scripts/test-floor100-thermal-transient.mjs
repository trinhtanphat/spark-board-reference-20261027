import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance} from '../floor100-liquid-loop.mjs';
import {buildFloor100HydraulicPlan} from '../floor100-hydraulic.mjs';
import {buildFloor100CoolantFault} from '../floor100-coolant-topology.mjs';
import {buildFloor100CduBanks} from '../floor100-cdu-banks.mjs';
import {buildFloor100ThermalTransient} from '../floor100-thermal-transient.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),
 row:Math.floor(i/10),column:i%10,kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
function setup({speeds=Array(8).fill(100),faultOptions={},load=100,deltaTK=10}={}){
 const water=buildFloor100WaterBalance(buildFloor100PowerModel(racks,load),{deltaTK});
 const hydraulic=buildFloor100HydraulicPlan(water);
 const healthy=buildFloor100CduBanks(water,hydraulic,buildFloor100CoolantFault(water));
 const disturbed=buildFloor100CduBanks(water,hydraulic,
  buildFloor100CoolantFault(water,faultOptions),{pumpSpeeds:speeds});
 return {water,healthy,disturbed};
}
const p=setup();
const steady=buildFloor100ThermalTransient(p.water,p.healthy,p.disturbed);
assert.equal(steady.timeline.length,36);
assert.deepEqual(steady.affectedRows,[]);
assert.equal(steady.peakRiseC,0);
assert.equal(steady.recoveryEndMaxProxyC,30);
assert.ok(steady.timeline.every(t=>t.rowProxyC.every(x=>x===30)));
const speeds=Array(8).fill(100);speeds[1]=0;
const fault=setup({speeds});
const stop=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed);
assert.deepEqual(stop.affectedRows,[2,3]);
assert.equal(stop.incidentStartMinute,5);assert.equal(stop.incidentEndMinute,15);
assert.equal(stop.timeline[5].maxProxyC,30);
assert.ok(stop.timeline[15].rowProxyC[1]>30&&stop.timeline[15].rowProxyC[2]>30);
assert.ok(stop.timeline[15].rowProxyC[1]>stop.timeline[6].rowProxyC[1]);
assert.equal(stop.timeline[15].rowProxyC[0],30);
assert.equal(stop.timeline[15].rowProxyC[3],30);
assert.ok(stop.timeline[35].rowProxyC[1]<stop.timeline[15].rowProxyC[1]);
assert.ok(stop.timeline[35].rowProxyC[1]>30);
assert.ok(Math.abs(stop.timeline[15].rowProxyC[1]-
 (30+fault.water.rows[1].computeLiquidKW*600/180000))<0.003);
const half=Array(8).fill(100);half[1]=60;
const slow=setup({speeds:half});
const slowed=buildFloor100ThermalTransient(slow.water,slow.healthy,slow.disturbed);
assert.ok(slowed.peakRiseC>0&&slowed.peakRiseC<stop.peakRiseC);
const short=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,{incidentMinutes:5});
const long=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,{incidentMinutes:20});
assert.ok(short.peakRiseC<stop.peakRiseC&&stop.peakRiseC<long.peakRiseC);
const lessMass=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,{equivalentCapacityKJPerK:120000});
const moreMass=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,{equivalentCapacityKJPerK:300000});
assert.ok(lessMass.peakRiseC>stop.peakRiseC&&moreMass.peakRiseC<stop.peakRiseC);
const longerRecovery=buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,{recoveryMinutes:40});
assert.ok(longerRecovery.recoveryEndMaxProxyC<stop.recoveryEndMaxProxyC);
const outage=setup({faultOptions:{failedCdu:2}});
const faultLegacy=buildFloor100ThermalTransient(outage.water,outage.healthy,outage.disturbed);
assert.deepEqual(faultLegacy.affectedRows,[2,3]);assert.equal(faultLegacy.peakRiseC,stop.peakRiseC);
const row=setup({faultOptions:{isolatedRow:2}});
const isolated=buildFloor100ThermalTransient(row.water,row.healthy,row.disturbed);
assert.deepEqual(isolated.affectedRows,[2,3]);
assert.ok(isolated.timeline[15].rowProxyC[1]>30);
assert.ok(isolated.timeline[15].rowProxyC[2]<30); // Shared CDU #2 sends more modeled flow to row 3.
const low=setup({speeds,load:60}),loaded=buildFloor100ThermalTransient(low.water,low.healthy,low.disturbed);
assert.ok(loaded.peakRiseC<stop.peakRiseC);
const mixed=setup({speeds,deltaTK:15});
assert.ok(Number.isFinite(buildFloor100ThermalTransient(mixed.water,mixed.healthy,mixed.disturbed).peakRiseC));
const zeroPower=buildFloor100PowerModel(racks,100,1.2,Object.fromEntries(racks.map(r=>[r.id,0])));
const w0=buildFloor100WaterBalance(zeroPower);const h0=buildFloor100HydraulicPlan(w0);
const z0=buildFloor100CduBanks(w0,h0,buildFloor100CoolantFault(w0));
const zero=buildFloor100ThermalTransient(w0,z0,z0);
assert.equal(zero.peakRiseC,0);assert.ok(zero.timeline.every(p=>p.maxProxyC===30));
for(const config of [{incidentMinutes:0},{incidentMinutes:999},{recoveryMinutes:0},{equivalentCapacityKJPerK:0},
 {equivalentCapacityKJPerK:Infinity}])
 assert.throws(()=>buildFloor100ThermalTransient(fault.water,fault.healthy,fault.disturbed,config),RangeError);
assert.throws(()=>buildFloor100ThermalTransient(null,fault.healthy,fault.disturbed),RangeError);
assert.throws(()=>buildFloor100ThermalTransient(fault.water,null,fault.disturbed),RangeError);
assert.ok(Object.isFrozen(stop.timeline)&&Object.isFrozen(stop.rows));
assert.match(stop.caveat,/NOT ACTUAL WATER\/CHIP/);
console.log(JSON.stringify({status:'PASS',rows:stop.rows.length,steps:stop.timeline.length,
 affected:stop.affectedRows,peakProxyC:stop.maxProxyC,recovered:stop.recoveryEndMaxProxyC,
 numericalIntegrator:'EXACT_PIECEWISE_EXPONENTIAL',notTelemetry:true}));
