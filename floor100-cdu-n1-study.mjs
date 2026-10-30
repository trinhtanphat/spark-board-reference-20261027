/**
 * Fictional SINGLE-CDU-OUTAGE comparison (8 independent scenarios).
 * Derived only from the existing 8-bank and 10-row first-order proxy models.
 * This is NOT N+1 proof, cooling service-level evidence, or failure probability.
 */
import {buildFloor100CduBanks} from './floor100-cdu-banks.mjs';
import {buildFloor100CoolantFault} from './floor100-coolant-topology.mjs';
import {buildFloor100ThermalTransient} from './floor100-thermal-transient.mjs';
const round=(x,p=3)=>Number(x.toFixed(p));
const speeds=Object.freeze(Array(8).fill(100));
function burden(timeline,reference=30){
 let sum=0;
 for(let i=1;i<timeline.length;i++){
  const a=timeline[i-1].rowProxyC,b=timeline[i].rowProxyC;
  for(let row=0;row<10;row++)sum+=
   (Math.max(0,a[row]-reference)+Math.max(0,b[row]-reference))/2;
 }
 return round(sum);
}
export function buildFloor100CduN1Study(water,hydraulic,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new RangeError('Invalid demo thermal options');
 // Existing solvers validate the 80 compute racks and the prescribed presets.
 const normalFault=buildFloor100CoolantFault(water);
 const reference=buildFloor100CduBanks(water,hydraulic,normalFault,{pumpSpeeds:speeds});
 const cases=[];
 for(let cdu=1;cdu<=8;cdu++){
  const pumpSpeeds=[...speeds];pumpSpeeds[cdu-1]=0;
  const incident=buildFloor100CduBanks(water,hydraulic,normalFault,{pumpSpeeds});
  const transient=buildFloor100ThermalTransient(water,reference,incident,options);
  const bank=incident.banks[cdu-1];
  const blocked=incident.rows.filter(x=>x.blocked);
  const recoveredEnd=transient.timeline.at(-1).rowProxyC;
  const residual=round(recoveredEnd.reduce((total,v)=>total+Math.max(0,v-30),0));
  const caseData=Object.freeze({
   cdu,blockedRows:Object.freeze(blocked.map(x=>x.row)),
   blockedRowCount:blocked.length,
   blockedDemandLpm:incident.blockedDemandLpm,
   modeledFlowLpm:incident.modeledFlowLpm,
   modeledLossLpm:round(reference.modeledFlowLpm-incident.modeledFlowLpm),
   nominalModelFlowLpm:reference.modeledFlowLpm,
   maxProxyC:transient.maxProxyC,
   peakRiseC:transient.peakRiseC,
   recoveryEndMaxProxyC:transient.recoveryEndMaxProxyC,
   positiveExcessProxyKMinutes:burden(transient.timeline),
   recoveryExcessProxyK:residual,
   affectedRows:transient.affectedRows,
   reason:'ONE_FICTIONAL_CDU_PUMP_OFF_NO_CROSSFEED',
   pumpIsOff:bank.status==='PUMP_OFF'
  });
  if(!caseData.pumpIsOff||caseData.blockedRowCount!==bank.rowNumbers.length)
   throw new Error('Inconsistent independent CDU outage');
  cases.push(caseData);
 }
 // Rank by modeled aggregate proxy exposure, then by peak, then by CDU number.
 // This is a numerical demonstration comparison, not an operational priority.
 const ranking=Object.freeze([...cases].sort((a,b)=>
  b.positiveExcessProxyKMinutes-a.positiveExcessProxyKMinutes||
  b.peakRiseC-a.peakRiseC||a.cdu-b.cdu).map((c,i)=>Object.freeze({cdu:c.cdu,order:i+1})));
 const ranked=new Map(ranking.map(r=>[r.cdu,r.order]));
 const scenarios=Object.freeze(cases.map(c=>Object.freeze({...c,comparisonOrder:ranked.get(c.cdu)})));
 const top=scenarios.find(s=>s.cdu===ranking[0].cdu);
 return Object.freeze({
  scenarios,ranking,
  worstIllustrativeCdu:top.cdu,
  worstPositiveExcessProxyKMinutes:top.positiveExcessProxyKMinutes,
  baselineModeledFlowLpm:reference.modeledFlowLpm,
  options:Object.freeze({...{
   incidentMinutes:10,recoveryMinutes:20,equivalentCapacityKJPerK:180000
  },...options}),
  comparisons:8,computeRacksMapped:80,
  disclaimer:'FICTIONAL SINGLE-CDU-OUTAGE SWEEP ONLY: the ranking sums 10 first-order proxy-temperature excursions in K-min across rows. It is NOT N+1 capability evidence, measured temperatures, failure likelihood, danger thresholds, actual downtime, construction approval, guaranteed cooling, true CDU configuration or backup hydraulics. Every test assumes other seven CDU pumps healthy with NO CROSSFEED; assumed recovery affects only the generated timeline.'
 });
}
