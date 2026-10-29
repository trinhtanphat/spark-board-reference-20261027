/**
 * Eight fictional INDEPENDENT CDU hydronic modules (not eight real OEM curves).
 * These are separate topology assumptions from the one-aggregate pump scenario.
 * Each CDU feeds only assigned rows from floor100CduForRow(). NO crossfeed.
 * All lengths are invented metres, unrelated to render scene coordinates.
 */
import {floor100CduForRow} from './floor100-cooling-path.mjs';
import {estimatePipeBranch,FLOOR100_HYDRAULIC_DIAMETERS_MM,FLOOR100_HYDRAULIC_LENGTHS_M} from './floor100-hydraulic.mjs';
import {FLOOR100_WATER_DENSITY_KG_L} from './floor100-liquid-loop.mjs';
export const FLOOR100_CDU_PUMP_SPEEDS=Object.freeze([0,60,80,100]);
export const FLOOR100_CDU_IDS=Object.freeze(Array.from({length:8},(_,i)=>i+1));
export const FLOOR100_CDU_FICTIONAL_CURVE=Object.freeze({
 shutoffKPaAt100:55,quadraticDropAtDesignKPa:20,headerDiameterMM:400,
 headerOneWayLengthM:60,headerMinorKPerLeg:2,
 valveDropKPaAtRowDesign:10,hxDropKPaAtRowDesign:15,
 densityKgM3:FLOOR100_WATER_DENSITY_KG_L*1000,
 dynamicViscosityPaS:0.0007,roughnessM:0.000045
});
const round=(x,n=2)=>Number(x.toFixed(n));
function headerLoss(q){
 if(q<=0)return 0;
 const p=FLOOR100_CDU_FICTIONAL_CURVE,d=p.headerDiameterMM/1000;
 const area=Math.PI*d*d/4,v=q/60000/area;
 const re=p.densityKgM3*v*d/p.dynamicViscosityPaS;
 const friction=re<2300?64/re:0.25/(Math.log10(p.roughnessM/(3.7*d)+5.74/(re**0.9))**2);
 return 2*(friction*p.headerOneWayLengthM/d+p.headerMinorKPerLeg)*
  (p.densityKgM3*v*v/2)/1000;
}
const branchLoss=(flow,target,hydraulic)=>{
 if(flow<=0||target<=0)return 0;
 const p=FLOOR100_CDU_FICTIONAL_CURVE,ratio=flow/target;
 return estimatePipeBranch(flow,hydraulic.diameterMM,hydraulic.oneWayLengthM).lossKPa+
  (p.valveDropKPaAtRowDesign+p.hxDropKPaAtRowDesign)*ratio*ratio;
};
export function buildFloor100CduBanks(water,hydraulic,fault,{pumpSpeeds=Array(8).fill(100)}={}){
 if(!water||!hydraulic||!fault||!Array.isArray(water.rows)||water.rows.length!==10||
  !Array.isArray(fault.rows)||fault.rows.length!==10||water.computeRackCount!==80||
  water.unmappedRackCount!==20||!Number.isFinite(water.designFlowLpm)||water.designFlowLpm<0||
  !FLOOR100_HYDRAULIC_DIAMETERS_MM.includes(hydraulic.diameterMM)||
  !FLOOR100_HYDRAULIC_LENGTHS_M.includes(hydraulic.oneWayLengthM)||
  water.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.targetLpm)||r.targetLpm<0||
   !Number.isFinite(r.computeLiquidKW)||r.computeLiquidKW<0)||
  fault.rows.some((r,i)=>r.row!==i+1||typeof r.blocked!=='boolean'))
  throw new RangeError('Expected complete 80-compute-rack plans');
 if(!Array.isArray(pumpSpeeds)||pumpSpeeds.length!==8||
  pumpSpeeds.some(x=>!FLOOR100_CDU_PUMP_SPEEDS.includes(x)))
  throw new RangeError('Eight permitted fictional pump speeds required');
 const speeds=Object.freeze([...pumpSpeeds]);
 const assigned=water.rows.map((row,i)=>({
  row:row.row,cdu:floor100CduForRow(i),targetLpm:row.targetLpm,
  heatKW:row.computeLiquidKW,blockedByValveOrFault:fault.rows[i].blocked
 }));
 const bankResults=[];
 for(let number=1;number<=8;number++){
  const speed=speeds[number-1],rows=assigned.filter(r=>r.cdu===number);
  const designFlow=rows.reduce((a,r)=>a+r.targetLpm,0);
  const manualFault=fault.failedCdu===number,off=manualFault||speed===0;
  const openRows=rows.filter(r=>!off&&!r.blockedByValveOrFault&&r.targetLpm>0);
  const zeroHead=off?0:FLOOR100_CDU_FICTIONAL_CURVE.shutoffKPaAt100*(speed/100)**2;
  const pumpHead=q=>Math.max(0,zeroHead-
   FLOOR100_CDU_FICTIONAL_CURVE.quadraticDropAtDesignKPa*(q/(designFlow||1))**2);
  const atHead=h=>{
   const flows=rows.map(r=>{
    if(off||r.blockedByValveOrFault||r.targetLpm<=0||h<=0)return 0;
    let lo=0,hi=r.targetLpm*3;
    for(let j=0;j<28;j++){
     const mid=(lo+hi)/2;
     if(branchLoss(mid,r.targetLpm,hydraulic)>h)hi=mid;else lo=mid;
    }
    return (lo+hi)/2;
   });
   const total=flows.reduce((a,b)=>a+b,0);
   return {flows,total,header:headerLoss(total),pump:pumpHead(total)};
  };
  let operatingBranchHead=0,calc=atHead(0);
  if(openRows.length&&zeroHead){
   let lo=0,hi=zeroHead;
   for(let j=0;j<32;j++){
    const h=(lo+hi)/2,c=atHead(h);
    if(h+c.header>c.pump)hi=h;else lo=h;
   }
   operatingBranchHead=(lo+hi)/2;calc=atHead(operatingBranchHead);
  }
  // Deliberately do not claim a validated operating point for zero design load.
  const status=off?'PUMP_OFF':!openRows.length?'NO_DESIGN_DEMAND':'SIMULATED_FLOW';
  const resultRows=rows.map((r,i)=>{
   const value=calc.flows[i];
   const blocked=off||r.blockedByValveOrFault;
   return Object.freeze({
    row:r.row,cduReference:number,blocked,
    targetLpm:round(r.targetLpm),modeledLpm:round(value),
    targetHeatKW:round(r.heatKW),
    branchHeadKPa:round(branchLoss(value,r.targetLpm,hydraulic)),
    ratioPercent:r.targetLpm?round(100*value/r.targetLpm):null,
    shortfallLpm:round(Math.max(0,r.targetLpm-value))
   });
  });
  const demandOpen=rows.filter(r=>!off&&!r.blockedByValveOrFault)
   .reduce((s,r)=>s+r.targetLpm,0);
  const headResidual=status==='SIMULATED_FLOW'?
   operatingBranchHead+calc.header-calc.pump:0;
  bankResults.push(Object.freeze({
   cdu:number,rowNumbers:Object.freeze(rows.map(r=>r.row)),pumpSpeedPercent:speed,
   status,failedByLegacyScenario:manualFault,
   demandLpm:round(designFlow),openDemandLpm:round(demandOpen),
   modeledLpm:round(calc.total),pumpHeadKPa:round(calc.pump),
   commonBranchHeadKPa:round(operatingBranchHead),
   headerLossKPa:round(calc.header),headResidualKPa:round(headResidual,4),
   computedHydraulicPowerKW:round((calc.total/60000)*calc.pump),
   rows:Object.freeze(resultRows)
  }));
 }
 const rows=Object.freeze(bankResults.flatMap(bank=>bank.rows).sort((a,b)=>a.row-b.row));
 const totalDemand=round(rows.reduce((s,r)=>s+r.targetLpm,0));
 const totalFlow=round(bankResults.reduce((s,b)=>s+b.modeledLpm,0));
 const isolated=round(rows.filter(r=>r.blocked).reduce((s,r)=>s+r.targetLpm,0));
 const openDemand=round(rows.filter(r=>!r.blocked).reduce((s,r)=>s+r.targetLpm,0));
 const maxResidual=round(Math.max(0,...bankResults.map(b=>Math.abs(b.headResidualKPa))),4);
 return Object.freeze({
  pumpSpeeds:speeds,banks:Object.freeze(bankResults),rows,
  designTargetLpm:totalDemand,modeledFlowLpm:totalFlow,
  blockedDemandLpm:isolated,openDemandLpm:openDemand,
  maxPressureResidualKPa:maxResidual,computeRacksMapped:80,
  caveat:'EIGHT FICTIONAL, INDEPENDENT PUMP BANKS, NO CROSSFEED. CDU symbols and nearest-row allocation do not establish actual NVIDIA eight-CDU architecture or curves. Computed flows, pressures, power and deficit are hypothetical design-scenario values, NOT telemetry, cooling capacity, measured/guaranteed delivery, actual redundancy, pump efficiency, NPSH, transient behavior or construction approval.'
 });
}
