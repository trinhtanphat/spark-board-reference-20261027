import assert from 'node:assert/strict';
import {buildFloor100PowerModel} from '../floor100-power.mjs';
import {buildFloor100WaterBalance,FLOOR100_WATER_DELTA_T_PRESETS_K,
 FLOOR100_WATER_CP_KJ_KG_K,FLOOR100_WATER_DENSITY_KG_L} from '../floor100-liquid-loop.mjs';
const racks=Array.from({length:100},(_,i)=>({id:'R'+String(i+1).padStart(3,'0'),
 row:Math.floor(i/10),column:i%10,kind:i%10<8?'compute':i%10===8?'fabric':'storage'}));
const power=buildFloor100PowerModel(racks),snapshot=JSON.stringify(power);
const p=buildFloor100WaterBalance(power);
assert.deepEqual(FLOOR100_WATER_DELTA_T_PRESETS_K,[5,10,15]);
assert.equal(p.computeRackCount,80);assert.equal(p.unmappedRackCount,20);
assert.equal(p.computeLiquidKW,8640);
assert.equal(p.excludedLiquidKW,378);
assert.equal(p.facilityHypotheticalLiquidKW,9018);
assert.equal(p.racks.length,80);assert.equal(p.rows.length,10);
assert.equal(p.rows[0].computeLiquidKW,864);
assert.equal(p.rows[0].unmappedLiquidKW,37.8);
assert.equal(p.racks[0].liquidKW,108);
assert.equal(p.racks[0].targetLpm,Number((108/(FLOOR100_WATER_CP_KJ_KG_K*10)/FLOOR100_WATER_DENSITY_KG_L*60).toFixed(2)));
assert.ok(Math.abs(p.designFlowLpm*10*FLOOR100_WATER_CP_KJ_KG_K*FLOOR100_WATER_DENSITY_KG_L/60-8640)<.01);
const halfDelta=buildFloor100WaterBalance(power,{deltaTK:5});
const highDelta=buildFloor100WaterBalance(power,{deltaTK:15});
assert.ok(Math.abs(halfDelta.designFlowLpm/p.designFlowLpm-2)<.00001);
assert.ok(Math.abs(highDelta.designFlowLpm/p.designFlowLpm-2/3)<.00001);
const p80=buildFloor100WaterBalance(power,{liquidCapturePercent:80});
assert.equal(p80.computeLiquidKW,7680);assert.equal(p80.excludedLiquidKW,336);
const changed=buildFloor100PowerModel(racks,80,1.2,{R001:180000,R009:30000});
const update=buildFloor100WaterBalance(changed,{deltaTK:10});
assert.equal(update.computeLiquidKW,6955.2);
assert.equal(update.excludedLiquidKW,311.04);
assert.equal(update.racks.find(x=>x.id==='R001').heatKW,144);
assert.equal(update.racks.find(x=>x.id==='R001').liquidKW,129.6);
assert.ok(update.racks.every(x=>x.id!=='R009'));
const zero=buildFloor100PowerModel(racks,100,1.2,Object.fromEntries(racks.map(r=>[r.id,0])));
const idle=buildFloor100WaterBalance(zero);
assert.equal(idle.designFlowLpm,0);
assert.equal(idle.computeLiquidKW,0);
for(const opts of [{deltaTK:0},{deltaTK:1},{deltaTK:Infinity},{deltaTK:"10"},{liquidCapturePercent:99}])
 assert.throws(()=>buildFloor100WaterBalance(power,opts),RangeError);
assert.throws(()=>buildFloor100WaterBalance(null),RangeError);
const bad=JSON.parse(JSON.stringify(power));bad.entries[3].estimatedW=-1;
assert.throws(()=>buildFloor100WaterBalance(bad),RangeError);
assert.equal(JSON.stringify(power),snapshot);
assert.match(p.disclaimer,/NOT measured/);
console.log(JSON.stringify({status:"PASS",computeRacks:80,unmappedRacks:20,
 liquidKW:p.computeLiquidKW,excludedKW:p.excludedLiquidKW,flowLpm:p.designFlowLpm,
 deltaTK:p.deltaTK,notMeasured:true}));
