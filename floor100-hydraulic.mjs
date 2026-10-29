/**
 * Darcy-Weisbach demonstration of one stylized SUPPLY + RETURN row branch.
 * This is a sensitivity study, NOT physical pipe/pump sizing or NVIDIA CAD.
 * No real measured pressures, pump curves, balancing, coolant mixture, or
 * network hydraulic solver. Distances are hypothetical metres, NOT 3D units.
 */
import {FLOOR100_WATER_DENSITY_KG_L} from './floor100-liquid-loop.mjs';
export const FLOOR100_HYDRAULIC_DIAMETERS_MM=Object.freeze([125,160,200]);
export const FLOOR100_HYDRAULIC_LENGTHS_M=Object.freeze([20,30,40]);
export const FLOOR100_HYDRAULIC_ASSUMPTIONS=Object.freeze({
 dynamicViscosityPaS:0.0007,roughnessMM:0.045,minorKPerLeg:3
});
const round=(x,d=2)=>Number(x.toFixed(d));
export function estimatePipeBranch(flowLpm,diameterMM=160,oneWayLengthM=30){
 if(!Number.isFinite(flowLpm)||flowLpm<0||flowLpm>1000000||
  !FLOOR100_HYDRAULIC_DIAMETERS_MM.includes(diameterMM)||
  !FLOOR100_HYDRAULIC_LENGTHS_M.includes(oneWayLengthM))
  throw new RangeError('Unsupported demo pipe branch input');
 const diameterM=diameterMM/1000;
 const density=FLOOR100_WATER_DENSITY_KG_L*1000;
 const q=flowLpm/60000; // liters/min -> cubic metres/second
 const area=Math.PI*diameterM**2/4;
 const velocity=q/area;
 const reynolds=density*velocity*diameterM/FLOOR100_HYDRAULIC_ASSUMPTIONS.dynamicViscosityPaS;
 const frictionFactor=reynolds===0?0:reynolds<2300?64/reynolds:
  0.25/Math.log10(FLOOR100_HYDRAULIC_ASSUMPTIONS.roughnessMM/1000/(3.7*diameterM)+
   5.74/(reynolds**0.9))**2; // Swamee-Jain approximation for turbulent regime
 const dynamicPressurePa=density*velocity*velocity/2;
 const majorPa=2*frictionFactor*(oneWayLengthM/diameterM)*dynamicPressurePa;
 const minorPa=2*FLOOR100_HYDRAULIC_ASSUMPTIONS.minorKPerLeg*dynamicPressurePa;
 const totalPa=majorPa+minorPa;
 return Object.freeze({
  flowLpm:round(flowLpm),diameterMM,oneWayLengthM,returnAndSupplyLengthM:2*oneWayLengthM,
  velocityMps:round(velocity,3),reynolds:round(reynolds,0),
  flowRegime:reynolds===0?'IDLE':reynolds<2300?'LAMINAR':reynolds<4000?'TRANSITIONAL_APPROX':'TURBULENT_APPROX',
  frictionFactor:round(frictionFactor,5),majorLossKPa:round(majorPa/1000),
  minorLossKPa:round(minorPa/1000),lossKPa:round(totalPa/1000),
  velocityFlag:velocity>2?'ABOVE_ILLUSTRATIVE_2_MPS_MARKER':'NO_DEMO_VELOCITY_FLAG'
 });
}
export function buildFloor100HydraulicPlan(water,{diameterMM=160,oneWayLengthM=30}={}){
 if(!water||!Array.isArray(water.rows)||water.rows.length!==10||
  !Array.isArray(water.racks)||water.racks.length!==80||
  water.computeRackCount!==80||water.unmappedRackCount!==20||
  !Number.isFinite(water.designFlowLpm)||water.designFlowLpm<0||
  water.rows.some((r,i)=>r.row!==i+1||!Number.isFinite(r.targetLpm)||r.targetLpm<0))
  throw new RangeError('Expected validated 80-compute-rack liquid heat balance');
 if(!FLOOR100_HYDRAULIC_DIAMETERS_MM.includes(diameterMM)||
  !FLOOR100_HYDRAULIC_LENGTHS_M.includes(oneWayLengthM))
  throw new RangeError('Invalid hypothetical pipe diameter or one-way length');
 const rows=Object.freeze(water.rows.map(r=>Object.freeze({
  row:r.row,computeLiquidKW:r.computeLiquidKW,unmappedLiquidKW:r.unmappedLiquidKW,
  ...estimatePipeBranch(r.targetLpm,diameterMM,oneWayLengthM)
 })));
 const maxPressureDropKPa=Math.max(...rows.map(r=>r.lossKPa));
 const maxVelocityMps=Math.max(...rows.map(r=>r.velocityMps));
 const totalLpm=round(rows.reduce((s,r)=>s+r.flowLpm,0));
 return Object.freeze({
  diameterMM,oneWayLengthM,rows,
  computeRackCount:80,unmappedRackCount:20,
  totalComputeTargetLpm:water.designFlowLpm,representedRowTargetLpm:totalLpm,
  maxRowBranchLossKPa:round(maxPressureDropKPa),
  maxRowVelocityMps:round(maxVelocityMps,3),
  viscosityPaS:FLOOR100_HYDRAULIC_ASSUMPTIONS.dynamicViscosityPaS,
  roughnessMM:FLOOR100_HYDRAULIC_ASSUMPTIONS.roughnessMM,
  minorKPerLeg:FLOOR100_HYDRAULIC_ASSUMPTIONS.minorKPerLeg,
  disclaimer:'SCHEMATIC STRAIGHT-PIPE SENSITIVITY ONLY. Individual row supply+return modeled with Darcy-Weisbach and Swamee-Jain approximation; NOT an interconnected system pressure, CDU pump head, pipe sizing approval, measured differential pressure, real valve/heat exchanger loss, hydraulically balanced network, manufacturer CAD, or vendor-validated operating envelope.'
 });
}
