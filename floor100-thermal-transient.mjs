/**
 * Deterministic first-order *proxy-temperature* time response.
 * NOT measured fluid, chip, supply/return, inlet, or coolant temperature.
 * No real-time timers; sample cadence is a fictitious minute timeline.
 *
 * C * dT/dt = P(row) - UA_nominal * flow_fraction * (T - sink).
 * Calibrate UA_nominal = P/(nominalTemp - sink) at a fictitious
 * reference flow. Piecewise constant exact exponential integration.
 */
export const FLOOR100_TRANSIENT_INCIDENT_MINUTES=Object.freeze([5,10,20]);
export const FLOOR100_TRANSIENT_RECOVERY_MINUTES=Object.freeze([10,20,40]);
export const FLOOR100_TRANSIENT_MASS_KJ_PER_K=Object.freeze([120000,180000,300000]);
export const FLOOR100_TRANSIENT_CONSTANTS=Object.freeze({
 preIncidentMinutes:5,baseProxyC:30,sinkProxyC:22,
 note:'Fictional equivalent thermal mass, not water-only or real chip/coolant temperature'
});
const round=(v,n=3)=>Number(v.toFixed(n));
const validate=(water,reference,incident)=>{
 if(!water||!Array.isArray(water.rows)||water.rows.length!==10||
  water.computeRackCount!==80||water.unmappedRackCount!==20||
  water.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.computeLiquidKW)||r.computeLiquidKW<0)||
  !reference||!incident||!Array.isArray(reference.rows)||!Array.isArray(incident.rows)||
  reference.rows.length!==10||incident.rows.length!==10||
  reference.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.modeledLpm)||r.modeledLpm<0)||
  incident.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.modeledLpm)||r.modeledLpm<0||
   typeof r.blocked!=='boolean')||
  !Array.isArray(reference.banks)||reference.banks.length!==8||
  !Array.isArray(incident.banks)||incident.banks.length!==8)
  throw new RangeError('Expected 80-compute-rack energy balance and two 8-CDU model plans');
};
export function buildFloor100ThermalTransient(water,reference,incident,{
 incidentMinutes=10,recoveryMinutes=20,equivalentCapacityKJPerK=180000
}={}){
 validate(water,reference,incident);
 if(!FLOOR100_TRANSIENT_INCIDENT_MINUTES.includes(incidentMinutes)||
  !FLOOR100_TRANSIENT_RECOVERY_MINUTES.includes(recoveryMinutes)||
  !FLOOR100_TRANSIENT_MASS_KJ_PER_K.includes(equivalentCapacityKJPerK))
  throw new RangeError('Unsupported demo transient options');
 const t0=FLOOR100_TRANSIENT_CONSTANTS.baseProxyC,
  sink=FLOOR100_TRANSIENT_CONSTANTS.sinkProxyC,
  pre=FLOOR100_TRANSIENT_CONSTANTS.preIncidentMinutes,
  incidentEnds=pre+incidentMinutes,totalMinutes=incidentEnds+recoveryMinutes;
 const current=Array(10).fill(t0);
 const rows=water.rows.map((r,i)=>{
  const nominal=reference.rows[i].modeledLpm,altered=incident.rows[i].modeledLpm;
  const baseUA=r.computeLiquidKW/(t0-sink);
  const ratio=nominal>0?altered/nominal:0;
  return Object.freeze({
   row:r.row,cdu:incident.rows[i].cduReference,
   heatInputKW:r.computeLiquidKW,referenceLpm:nominal,incidentLpm:altered,
   incidentFlowRatio:round(ratio,4),blocked:incident.rows[i].blocked,
   affected:nominal>0&&Math.abs(altered-nominal)>0.01,
   baseUAkWPerK:round(baseUA),equivalentCapacityKJPerK
  });
 });
 const timeline=[];
 const integrate=(i,mode)=>{
  const r=rows[i],ua=r.baseUAkWPerK*
   (mode==='incident'?r.incidentFlowRatio:1),C=equivalentCapacityKJPerK;
  const old=current[i];
  // Analytic solution for constant P, UA during one fictitious minute.
  const next=ua<=0?old+r.heatInputKW*60/C:
   sink+r.heatInputKW/ua+(old-sink-r.heatInputKW/ua)*Math.exp(-ua*60/C);
  if(!Number.isFinite(next))throw new Error('Unstable hypothetical transient state');
  current[i]=next;
 };
 for(let minute=0;minute<=totalMinutes;minute++){
  const phase=minute<=pre?'baseline':minute<=incidentEnds?'incident':'recovery';
  const temperatures=Object.freeze(current.map(t=>round(t)));
  timeline.push(Object.freeze({
   minute,phase,
   rowProxyC:temperatures,
   maxProxyC:round(Math.max(...current)),
   avgProxyC:round(current.reduce((a,b)=>a+b,0)/10)
  }));
  if(minute===totalMinutes)break;
  const segment=minute<pre?'baseline':minute<incidentEnds?'incident':'recovery';
  for(let i=0;i<10;i++)integrate(i,segment);
 }
 const incidentEnd=timeline[incidentEnds],end=timeline[totalMinutes];
 const peak=Math.max(...timeline.map(t=>t.maxProxyC));
 const affected=rows.filter(r=>r.affected).map(r=>r.row);
 return Object.freeze({
  assumptions:Object.freeze({incidentMinutes,recoveryMinutes,
   equivalentCapacityKJPerK,preIncidentMinutes:pre,baseProxyC:t0,
   sinkProxyC:sink,sampleStepMinutes:1}),
  rows:Object.freeze(rows),timeline:Object.freeze(timeline),
  incidentStartMinute:pre,incidentEndMinute:incidentEnds,totalMinutes,
  affectedRows:Object.freeze(affected),
  maxProxyC:round(peak),peakRiseC:round(peak-t0),
  incidentEndMaxProxyC:incidentEnd.maxProxyC,
  recoveryEndMaxProxyC:end.maxProxyC,
  noInputChange:affected.length===0,
  scope:'DETERMINISTIC ILLUSTRATIVE 10-ROW FIRST-ORDER THERMAL PROXY, NOT PHYSICAL COOLANT/CHIP OR ROOM TEMPERATURE',
  caveat:'NOT ACTUAL WATER/CHIP/INLET TEMPERATURE, SAFE OPERATING LIMIT, THERMAL ALARM OR REAL RECOVERY TIME. Fictional 30 C baseline and 22 C sink, per-row equivalent heat capacity and UA calibrated to fictitious nominal flow. Assumes constant load, perfectly mixed row proxy and instantaneous pump step changes, no water transport lag, CDU exchanger kinetics, rack thermal throttling, backup switch, heat recirculation, control loops, measured sensor data or OEM system validation.'
 });
}
