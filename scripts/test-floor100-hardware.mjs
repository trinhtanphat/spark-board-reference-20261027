import assert from 'node:assert/strict';
import {NVL72_INSPECTION_PARTS,NVL72_COMPUTE_REFERENCE,NVL72_GUIDE_URL,nvl72PartShapes,nvl72GuideTotals} from '../floor100-hardware.mjs';
assert.equal(NVL72_INSPECTION_PARTS.compute.count,18);
assert.equal(NVL72_INSPECTION_PARTS.nvlink.count,9);
assert.equal(NVL72_INSPECTION_PARTS.power.count,4);
assert.equal(NVL72_INSPECTION_PARTS.tor.count,2);
assert.equal(NVL72_COMPUTE_REFERENCE.veraCPUs,36);
assert.equal(NVL72_COMPUTE_REFERENCE.rubinGPUs,72);
assert.ok(NVL72_GUIDE_URL.startsWith('https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware'));
for(const [part,info] of Object.entries(NVL72_INSPECTION_PARTS)){
 const xs=nvl72PartShapes(part,0,0);
 assert.equal(xs.length,info.count,part);
 assert.ok(xs.every(x=>Object.values(x).every(Number.isFinite)));
 if(part==='none')continue;
 assert.ok(xs.every(x=>x.w>0&&x.h>0&&x.d>0));
 assert.ok(xs.every(x=>info.side==='front'?x.z>0:x.z<0));
}
assert.throws(()=>nvl72PartShapes('unknown',0,0),RangeError);
const total=nvl72GuideTotals(80);
assert.deepEqual(total,{computeTrays:1440,veraCPUs:2880,rubinGPUs:5760,nvlinkSwitchTrays:720,managementTOR:160,powerShelves:320});
assert.throws(()=>nvl72GuideTotals(-1),RangeError);
console.log(JSON.stringify({status:'PASS',officialSource:NVL72_GUIDE_URL,groups:Object.keys(NVL72_INSPECTION_PARTS).length,total,physicalGeometryOfficial:false},null,2));
