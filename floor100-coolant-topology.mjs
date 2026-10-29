/**
 * Coherent procedural COOLANT VISUAL TOPOLOGY with independently testable
 * segment endpoint containment. Fictional 3D coordinates, not site CAD.
 */
import {buildFloor100CoolingRoute,floor100CduForRow,FLOOR100_COOLANT_CHANNELS} from './floor100-cooling-path.mjs';
export const FLOOR100_COOLANT_FAULT_ROWS=Object.freeze(Array.from({length:11},(_,i)=>i));
export const FLOOR100_COOLANT_FAULT_CDUS=Object.freeze(Array.from({length:9},(_,i)=>i));
const point=(x,y,z)=>Object.freeze([Number(x.toFixed(3)),Number(y.toFixed(3)),Number(z.toFixed(3))]);
const pipe=(channel,kind,row,cdu,from,to)=>Object.freeze({channel,kind,row,cdu,from,to});
function validateRacks(racks){
 if(!Array.isArray(racks)||racks.length!==100)throw new RangeError("Expected 100 scene racks");
 const ids=new Set();
 for(const r of racks){
  if(!r||!/^R[0-9]{3}$/.test(r.id)||ids.has(r.id)||!Number.isInteger(r.row)||r.row<0||r.row>9||
   !Number.isInteger(r.column)||r.column<0||r.column>9||!Number.isFinite(r.x)||!Number.isFinite(r.z)||
   !["compute","fabric","storage"].includes(r.kind))throw new RangeError("Malformed schematic scene rack");
  ids.add(r.id);
 }
 if(racks.filter(r=>r.kind==="compute").length!==80)throw new RangeError("Expected 80 compute racks");
}
export function buildFloor100CoolantTopology(racks){
 validateRacks(racks);
 const pipes=[];
 for(const channel of FLOOR100_COOLANT_CHANNELS){
  const supply=channel==="supply",y=supply?8.08:8.38,dx=supply?-1.60:1.60;
  const startZ=-29,endZ=27;
  pipes.push(pipe(channel,"spine",0,0,point(23,y,startZ),point(23,y,endZ)));
  for(let cdu=1;cdu<=8;cdu++){
   const z=(cdu-4.5)*7;
   pipes.push(pipe(channel,"cdu-port",0,cdu,point(25,4.5,z),point(23,4.5,z)));
   pipes.push(pipe(channel,"cdu-riser",0,cdu,point(23,4.5,z),point(23,y,z)));
  }
  for(let row=0;row<10;row++){
   const sample=racks.find(r=>r.row===row&&r.kind==="compute");
   const left=Math.min(...racks.filter(r=>r.row===row&&r.kind==="compute").map(r=>r.x+dx));
   const z=sample.z+(supply?-1.90:-2.18);
   pipes.push(pipe(channel,"row-header",row+1,floor100CduForRow(row),point(23,y,z),point(left,y,z)));
  }
  for(const rack of racks.filter(r=>r.kind==="compute")){
   const x=rack.x+dx,z=rack.z+(supply?-1.90:-2.18),rear=rack.z-1.49;
   pipes.push(pipe(channel,"rack-spur",rack.row+1,floor100CduForRow(rack.row),point(x,y,z),point(x,y,rear)));
   pipes.push(pipe(channel,"rack-drop",rack.row+1,floor100CduForRow(rack.row),point(x,y,rear),point(x,3.25,rear)));
  }
 }
 const covers=(p,a,b)=>{
  const eps=.003;
  return a.every((v,i)=>v>=Math.min(p.from[i],p.to[i])-eps&&v<=Math.max(p.from[i],p.to[i])+eps)
   &&b.every((v,i)=>v>=Math.min(p.from[i],p.to[i])-eps&&v<=Math.max(p.from[i],p.to[i])+eps);
 };
 // Three-dimensional axis-aligned segments: one rendered pipe contains both path endpoints.
 let paths=0,segments=0,missing=0;
 for(const rack of racks.filter(x=>x.kind==="compute"))
 for(const channel of FLOOR100_COOLANT_CHANNELS){
  paths++;
  const p=buildFloor100CoolingRoute(rack,channel);
  for(const s of p.segments){
   segments++;
   if(!pipes.some(g=>g.channel===channel&&covers(g,s.from,s.to)))missing++;
  }
 }
 const audit=Object.freeze({paths,segments,missing,connected:missing===0,
  meaning:"Rendered pipe segment envelopes contain both endpoints of every conceptual route segment; not actual flow/valve connectivity"});
 if(!audit.connected)throw new Error("Disconnected procedural coolant route "+missing);
 return Object.freeze({pipes:Object.freeze(pipes),audit});
}
export function buildFloor100CoolantFault(water,{isolatedRow=0,failedCdu=0}={}){
 if(!FLOOR100_COOLANT_FAULT_ROWS.includes(isolatedRow)||!FLOOR100_COOLANT_FAULT_CDUS.includes(failedCdu))
  throw new RangeError("Invalid illustrative coolant isolation scenario");
 if(!water||!Array.isArray(water.rows)||water.rows.length!==10||water.computeRackCount!==80||
  !Number.isFinite(water.designFlowLpm)||water.rows.some((r,i)=>r.row!==i+1||r.targetLpm<0||
   !Number.isFinite(r.targetLpm)||r.computeLiquidKW<0||!Number.isFinite(r.computeLiquidKW)))
  throw new RangeError("Expected compute-only energy balance");
 const rows=water.rows.map(r=>{
  const cdu=floor100CduForRow(r.row-1);
  const blocked=(isolatedRow===r.row)||(failedCdu===cdu);
  return Object.freeze({row:r.row,cduReference:cdu,blocked,reason:isolatedRow===r.row?
   "ROW_ISOLATION":failedCdu===cdu?"CDU_PUMP_OUT":"NONE",
   modeledDemandKW:r.computeLiquidKW,modeledTargetLpm:r.targetLpm});
 });
 const blockedComputeKW=Number(rows.filter(r=>r.blocked).reduce((s,r)=>s+r.modeledDemandKW,0).toFixed(2));
 const blockedFlowLpm=Number(rows.filter(r=>r.blocked).reduce((s,r)=>s+r.modeledTargetLpm,0).toFixed(2));
 return Object.freeze({isolatedRow,failedCdu,rows:Object.freeze(rows),
  blockedRows:rows.filter(r=>r.blocked).map(r=>r.row),blockedComputeKW,blockedFlowLpm,
  remainingUnblockedDemandKW:Number((water.computeLiquidKW-blockedComputeKW).toFixed(2)),
  remainingUnblockedTargetLpm:Number((water.designFlowLpm-blockedFlowLpm).toFixed(2)),
  caveat:"ISOLATION WHAT-IF ONLY: blocked flow is theoretical DEMAND for rows mapped to the isolated branch/CDU, NOT real measured flow, delivered capacity, backup switchover, pump curve or thermal throttling."});
}
