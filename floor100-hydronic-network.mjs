/**
 * Browser-only hydronic what-if: ten DEMO row branches in parallel, a shared
 * gallery header, and ONE fictional aggregate centrifugal pump curve.
 * NOT the actual architecture, pump schedule, CDU hydraulics or NVIDIA CAD.
 * Numerical branch lengths are assumed metres (independent of 3D scene units).
 *
 * Steady-state common-branch head Hbr:
 *   Hbr = dP_row_pipe(q) + (K_valve + K_HX) * (q/q_design)^2
 * Gallery main Hmain = dP_header(Q_total)
 * Pump H(Q) = H_shutoff*(N/Nmax)^2 - Kpump*(Q/Q_design)^2
 * Solve Hbr + Hmain = H_pump and continuity Q=sum(q_i).
 */
import {estimatePipeBranch} from './floor100-hydraulic.mjs';
import {FLOOR100_WATER_DENSITY_KG_L} from './floor100-liquid-loop.mjs';
export const FLOOR100_NETWORK_PUMP_SPEEDS=Object.freeze([60,80,100]);
export const FLOOR100_NETWORK_HEAD_PRESETS_KPA=Object.freeze([45,55,70]);
export const FLOOR100_NETWORK_VALVE_PRESETS_KPA=Object.freeze([5,10,20]);
export const FLOOR100_NETWORK_HX_PRESETS_KPA=Object.freeze([10,15,25]);
export const FLOOR100_NETWORK_HEADER_DIAMETERS_MM=Object.freeze([300,400,500]);
const round=(x,n=2)=>Number(x.toFixed(n));
const density=1000*FLOOR100_WATER_DENSITY_KG_L;
const viscosity=0.0007,roughness=0.000045;
const physicalPipeLossKPa=(qLpm,dmm,lengthM,minorK=2)=>{
 if(qLpm===0)return 0;
 const d=dmm/1000,v=(qLpm/60000)/(Math.PI*d*d/4),re=density*v*d/viscosity;
 const f=re<2300?64/re:0.25/(Math.log10(roughness/(3.7*d)+5.74/(re**0.9))**2);
 return 2*(f*lengthM/d+minorK)*(density*v*v/2)/1000;
};
const criticalHead=(flowLpm,targetLpm,diameter,length,valveKPa,hxKPa)=>{
 if(!targetLpm)return 0;
 const pipe=estimatePipeBranch(flowLpm,diameter,length).lossKPa;
 return pipe+(valveKPa+hxKPa)*(flowLpm/targetLpm)**2;
};
export function buildFloor100HydronicNetwork(water,hydraulic,fault,opts={}){
 if(!water||!hydraulic||!fault||!Array.isArray(water.rows)||water.rows.length!==10||
  !Array.isArray(hydraulic.rows)||hydraulic.rows.length!==10||
  !Array.isArray(fault.rows)||fault.rows.length!==10||
  water.computeRackCount!==80||water.unmappedRackCount!==20||
  !Number.isFinite(water.designFlowLpm)||water.designFlowLpm<0||
  water.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.targetLpm)||r.targetLpm<0)||
  fault.rows.some((r,i)=>r.row!==i+1||typeof r.blocked!=='boolean')||
  ![125,160,200].includes(hydraulic.diameterMM)||![20,30,40].includes(hydraulic.oneWayLengthM))
  throw new RangeError('Expected validated compute-only water, branch and fault plans');
 const {pumpSpeedPercent=100,shutoffHeadKPa=55,valveDropAtDesignKPa=10,
  heatExchangerDropAtDesignKPa=15,headerDiameterMM=400}=opts;
 if(!FLOOR100_NETWORK_PUMP_SPEEDS.includes(pumpSpeedPercent)||
  !FLOOR100_NETWORK_HEAD_PRESETS_KPA.includes(shutoffHeadKPa)||
  !FLOOR100_NETWORK_VALVE_PRESETS_KPA.includes(valveDropAtDesignKPa)||
  !FLOOR100_NETWORK_HX_PRESETS_KPA.includes(heatExchangerDropAtDesignKPa)||
  !FLOOR100_NETWORK_HEADER_DIAMETERS_MM.includes(headerDiameterMM))
  throw new RangeError('Invalid browser-only hydronic assumptions');
 const designFlow=water.designFlowLpm;
 const available=water.rows.map((r,i)=>({
  row:r.row,blocked:fault.rows[i].blocked,requestedLpm:r.targetLpm,
  requestedLiquidKW:r.computeLiquidKW,requestedRowHeatKW:r.computeLiquidKW,
  valveKPa:valveDropAtDesignKPa,hxKPa:heatExchangerDropAtDesignKPa
 }));
 const pumpZero=shutoffHeadKPa*(pumpSpeedPercent/100)**2;
 // Coefficient calibrated only to the fictitious reference/design flow.
 const pumpCurveDropAtDesignKPa=20;
 const pumpHead=(q)=>Math.max(0,pumpZero-pumpCurveDropAtDesignKPa*(q/(designFlow||1))**2);
 const mainHead=q=>physicalPipeLossKPa(q,headerDiameterMM,60,2);
 const branchHead=(q,target)=>criticalHead(q,target,hydraulic.diameterMM,hydraulic.oneWayLengthM,valveDropAtDesignKPa,heatExchangerDropAtDesignKPa);
 const solveBranch=(head,row)=>{
  if(row.blocked||row.requestedLpm===0||head<=0)return 0;
  let lo=0,hi=row.requestedLpm*3;
  for(let i=0;i<25;i++){
   const mid=(lo+hi)/2;
   if(branchHead(mid,row.requestedLpm)>head)hi=mid;else lo=mid;
  }
  return (lo+hi)/2;
 };
 const atHead=h=>{
  const flows=available.map(r=>solveBranch(h,r));
  const q=flows.reduce((sum,f)=>sum+f,0);
  return {flows,q,main:mainHead(q),pump:pumpHead(q)};
 };
 let head=0,calc=atHead(0);
 if(pumpZero>0&&available.some(r=>!r.blocked&&r.requestedLpm>0)){
  let lo=0,hi=pumpZero;
  for(let i=0;i<31;i++){
   const mid=(lo+hi)/2,c=atHead(mid);
   if(mid+c.main>c.pump)hi=mid;else lo=mid;
  }
  head=(lo+hi)/2;calc=atHead(head);
 }else if(pumpZero>0){
  // Every demand-controlled branch is closed: illustrative pump sits at shutoff.
  // No flowing branch has a resistance curve to intersect, so do not report
  // a fake numerical imbalance or claim normal operation at zero flow.
  head=pumpZero;
 }
 const {flows,q,main,pump}=calc;
 const rows=available.map((r,i)=>{
  const q_i=flows[i],ratio=r.requestedLpm? q_i/r.requestedLpm:0;
  const pipeHead=branchHead(q_i,r.requestedLpm)-(r.valveKPa+r.hxKPa)*ratio*ratio;
  return Object.freeze({row:r.row,blocked:r.blocked,requestedLpm:round(r.requestedLpm),
   modeledLpm:round(q_i),ratioPercent:r.requestedLpm?round(ratio*100):null,
   requestedLiquidKW:round(r.requestedLiquidKW),
   pipeDropKPa:round(Math.max(0,pipeHead)),
   valveDropKPa:round(r.valveKPa*ratio*ratio),
   heatExchangerDropKPa:round(r.hxKPa*ratio*ratio),
   branchDropKPa:round(branchHead(q_i,r.requestedLpm)),
   unmetTargetLpm:round(Math.max(0,r.requestedLpm-q_i))
  });
 });
 const demanded=available.reduce((sum,r)=>sum+r.requestedLpm,0);
 const blockedLpm=available.filter(r=>r.blocked).reduce((sum,r)=>sum+r.requestedLpm,0);
 const requestedOpen=available.filter(r=>!r.blocked).reduce((sum,r)=>sum+r.requestedLpm,0);
 // Flow distribution is modeled, but heat capture cannot be inferred without
 // actual exchanger performance and coolant temperatures. DO NOT label as delivered cooling.
 const residual=head+main-pump;
 return Object.freeze({
  assumptions:Object.freeze({pumpSpeedPercent,shutoffHeadKPa,
   valveDropAtDesignKPa,heatExchangerDropAtDesignKPa,headerDiameterMM,
   headerOneWayLengthM:60,pumpCurveDropAtDesignKPa,
   notRealCDUPumps:true}),
  rows:Object.freeze(rows),
  demandLpm:round(demanded),openDemandLpm:round(requestedOpen),
  isolatedDemandLpm:round(blockedLpm),
  modeledFlowLpm:round(q),
  branchHeadKPa:round(head),mainHeadKPa:round(main),
  pumpHeadKPa:round(pump),pumpShutoffHeadKPa:round(pumpZero),
  // H = rho*g*head_metres; this is only hydraulic mechanical power at this point.
  hydraulicPowerKW:round((q/60000)*(pump*1000)/1000),
  balanceResidualKPa:round(residual,4),
  shortfallVsOpenTargetLpm:round(Math.max(0,requestedOpen-q)),
  aboveTargetLpm:round(Math.max(0,q-requestedOpen)),
  maxBranchMismatchKPa:round(Math.max(...rows.filter(r=>!r.blocked&&r.requestedLpm>0)
   .map(r=>Math.abs(r.branchDropKPa-head)),0),2),
  disclaimer:'ONE FICTIONAL AGGREGATE PUMP + 10 PARALLEL DEMO ROWS with a shared gallery resistance and flow-squared fictional valve and HX losses. NOT the physical eight-CDU pump network, rated/guaranteed delivery, OEM curve, fluid control logic, pump efficiency, cavitation, variable valve positions, redundancy, real temperature, flow measurement, or engineering signoff. Demand targets, connected diagram coordinates and assumed pipe lengths are distinct.'
 });
}
