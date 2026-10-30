/**
 * Fictional staged restart after a SINGLE illustrative CDU outage.
 * No real controls, startup interlocks, commissioning data, sensor input or
 * OEM restart curves. Compares instantaneous return with 6/12-minute profiles.
 */
import {buildFloor100CduBanks} from './floor100-cdu-banks.mjs';
import {buildFloor100CoolantFault} from './floor100-coolant-topology.mjs';
import {FLOOR100_TRANSIENT_INCIDENT_MINUTES,
 FLOOR100_TRANSIENT_RECOVERY_MINUTES,FLOOR100_TRANSIENT_MASS_KJ_PER_K,
 FLOOR100_TRANSIENT_CONSTANTS} from './floor100-thermal-transient.mjs';
export const FLOOR100_RESTART_RAMP_MINUTES=Object.freeze([0,6,12]);
const round=(x,n=3)=>Number(x.toFixed(n));
const positiveBurden=timeline=>{
 let burden=0;
 for(let i=1;i<timeline.length;i++)for(let row=0;row<10;row++){
  const a=Math.max(0,timeline[i-1].rowProxyC[row]-30);
  const b=Math.max(0,timeline[i].rowProxyC[row]-30);
  burden+=(a+b)/2;
 }
 return round(burden);
};
export function buildFloor100CduRestartComparison(water,hydraulic,{
 cdu=2,incidentMinutes=10,recoveryMinutes=20,equivalentCapacityKJPerK=180000,
 selectedRampMinutes=6
}={}){
 if(!Number.isInteger(cdu)||cdu<1||cdu>8||
  !FLOOR100_TRANSIENT_INCIDENT_MINUTES.includes(incidentMinutes)||
  !FLOOR100_TRANSIENT_RECOVERY_MINUTES.includes(recoveryMinutes)||
  !FLOOR100_TRANSIENT_MASS_KJ_PER_K.includes(equivalentCapacityKJPerK)||
  !FLOOR100_RESTART_RAMP_MINUTES.includes(selectedRampMinutes))
  throw new RangeError('Unsupported fictional CDU restart assumptions');
 // The underlying bank builder validates water balance, rack counts and pipe presets.
 const fault=buildFloor100CoolantFault(water);
 const healthy=buildFloor100CduBanks(water,hydraulic,fault);
 const stages=new Map();
 for(const speed of [0,60,80,100]){
  const speeds=Array(8).fill(100);speeds[cdu-1]=speed;
  stages.set(speed,buildFloor100CduBanks(water,hydraulic,fault,{pumpSpeeds:speeds}));
 }
 const affected=Object.freeze(healthy.banks[cdu-1].rowNumbers.slice());
 const pre=FLOOR100_TRANSIENT_CONSTANTS.preIncidentMinutes;
 const sink=FLOOR100_TRANSIENT_CONSTANTS.sinkProxyC;
 const t0=FLOOR100_TRANSIENT_CONSTANTS.baseProxyC;
 const incidentEnd=pre+incidentMinutes,total=incidentEnd+recoveryMinutes;
 const curve=(rampMinutes)=>{
  const state=Array(10).fill(t0),timeline=[];
  const schedule=[];
  const speedForRecovery=elapsed=>{
   if(rampMinutes===0||elapsed>=rampMinutes)return 100;
   const step=rampMinutes/3;
   return elapsed<step?0:elapsed<2*step?60:80;
  };
  for(let minute=0;minute<=total;minute++){
   const phase=minute<pre?'baseline':minute<incidentEnd?'incident':'recovery';
   const elapsed=minute-incidentEnd;
   const speed=phase==='baseline'?100:phase==='incident'?0:speedForRecovery(elapsed);
   const bank=stages.get(speed);
   const rowProxyC=Object.freeze(state.map(x=>round(x)));
   timeline.push(Object.freeze({
    minute,phase,cduPumpSpeedPercent:speed,
    cduModeledFlowLpm:bank.banks[cdu-1].modeledLpm,
    rowProxyC,maxProxyC:round(Math.max(...state)),
    avgProxyC:round(state.reduce((a,b)=>a+b,0)/10)
   }));
   if(minute===total)break;
   if(phase==='recovery')schedule.push(Object.freeze({
    minute,elapsedRecoveryMinute:elapsed,cduPumpSpeedPercent:speed,
    cduModeledFlowLpm:bank.banks[cdu-1].modeledLpm
   }));
   for(let row=0;row<10;row++){
    const kw=water.rows[row].computeLiquidKW;
    const qHealthy=healthy.rows[row].modeledLpm,q=bank.rows[row].modeledLpm;
    const effectiveUA=kw/(t0-sink)*(qHealthy>0?q/qHealthy:0);
    const old=state[row];
    state[row]=effectiveUA<=0?old+kw*60/equivalentCapacityKJPerK:
     sink+kw/effectiveUA+
       (old-sink-kw/effectiveUA)*Math.exp(-effectiveUA*60/equivalentCapacityKJPerK);
    if(!Number.isFinite(state[row]))throw new Error('Unstable fictitious restart');
   }
  }
  const peak=Math.max(...timeline.map(x=>x.maxProxyC));
  const final=timeline[total];
  return Object.freeze({
   rampMinutes,stageSchedule:Object.freeze(schedule),
   timeline:Object.freeze(timeline),maxProxyC:round(peak),peakRiseC:round(peak-t0),
   afterRecoveryMaxProxyC:final.maxProxyC,
   positiveExcessProxyKMinutes:positiveBurden(timeline),
   cduFinalPumpSpeedPercent:final.cduPumpSpeedPercent,
   remainingProxyExcessK:round(final.rowProxyC.reduce((s,x)=>s+Math.max(0,x-t0),0)),
   completeRampWithinWindow:rampMinutes<=recoveryMinutes
  });
 };
 const cases=Object.freeze(FLOOR100_RESTART_RAMP_MINUTES.map(curve));
 const selected=cases.find(x=>x.rampMinutes===selectedRampMinutes);
 const instant=cases[0];
 return Object.freeze({
  cdu,affectedRows:affected,incidentStartMinute:pre,incidentEndMinute:incidentEnd,
  recoveryEndMinute:total,selectedRampMinutes,comparisons:cases.length,
  options:Object.freeze({cdu,incidentMinutes,recoveryMinutes,equivalentCapacityKJPerK,selectedRampMinutes}),
  healthyCduFlowLpm:healthy.banks[cdu-1].modeledLpm,
  cases,selected,
  additionalProxyBurdenVsInstantKMinutes:round(selected.positiveExcessProxyKMinutes-instant.positiveExcessProxyKMinutes),
  disclaimer:'FICTIONAL COMPARATIVE RAMP 0/6/12 MINUTES. A 6-minute ramp holds 0% for 2 min, 60% for 2 min, 80% for 2 min, then 100%; 12-minute ramp holds each stage for 4 min. Other seven CDU pump domains remain 100% with no crossfeed. These are not NVIDIA restart procedures, actual pump acceleration, safe thermal thresholds, telemetry, commissioning, coolant temperature, coolant transport, control-system logic, automatic backup or N+1 proof.'
 });
}
