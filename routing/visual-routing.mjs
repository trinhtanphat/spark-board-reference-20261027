/**
 * SPARK illustrative routing corridors — NOT an electrical netlist.
 * All dimensions are normalized scene units, not millimeters.
 * Deliberately segregates independently labelled corridors on each conceptual
 * layer; no actual MCU pinout, power design or manufacturer constraints exist.
 * Pure ESM, shared verbatim by browser rendering and Node audit.
 */
export const ROUTING_REVISION = "visual-corridors-1";
export const FABRICATION_APPROVED = false;
export const LAYER_LABELS = Object.freeze([
 "TOP ARTWORK", "INNER 1 / ART", "INNER 2 / ART", "INNER 3 / ART",
 "INNER 4 / ART", "INNER 5 / ART", "INNER 6 / ART", "BOTTOM ARTWORK"
]);
export const BOARD_BOUNDS = Object.freeze({halfWidth:5.85,halfDepth:3.6,margin:0.35});
export const ARTWORK_TRACK_WIDTH = 0.018; // scene unit
export const ARTWORK_REQUIRED_GAP = 0.065; // scene unit; visual checker only
const corridors = Object.freeze([
 {id:"RF",xCore:-1.62,xDevice:-2.82,zBase:-1.24,fan:-0.085},
 {id:"FLASH",xCore:-1.62,xDevice:-2.82,zBase:0.58,fan:0.085},
 {id:"IO",xCore:1.62,xDevice:2.65,zBase:-1.24,fan:-0.085},
 {id:"NPU",xCore:1.62,xDevice:2.65,zBase:0.58,fan:0.085}
]);
export const VISUAL_ROUTES = Object.freeze(
 LAYER_LABELS.flatMap((layerLabel,layerIndex)=>
  corridors.flatMap(c=>
   Array.from({length:7},(_,lane)=>{
    const z=c.zBase+lane*0.104+(layerIndex-3.5)*0.001;
    const dx=c.xDevice-c.xCore, a=c.xCore,b=c.xDevice;
    const points=[
     [a,z+c.fan],
     [a+dx*.155,z],
     [b-dx*.155,z],
     [b,z+c.fan]
    ].map(p=>Object.freeze(p));
    return Object.freeze({
     id:"ILLUSTRATIVE_"+layerIndex+"_"+c.id+"_"+lane,
     corridor:c.id,
     layer:layerIndex,
     layerLabel,
     width:ARTWORK_TRACK_WIDTH,
     points:Object.freeze(points)
    });
   })
  )
 )
);
/** Ground-return-like stitching points for visual design only, never valid vias. */
export const ILLUSTRATIVE_STITCHING = Object.freeze([
 ...Array.from({length:18},(_,i)=>[-5.16,-2.52+i*.295]),
 ...Array.from({length:18},(_,i)=>[5.16,-2.52+i*.295]),
 ...Array.from({length:24},(_,i)=>[-4.65+i*.405,-2.87]),
 ...Array.from({length:24},(_,i)=>[-4.65+i*.405,2.87])
].map(p=>Object.freeze(p)));
/** Visual package body bounding boxes; NOT datasheet footprint courtyards. */
export const ILLUSTRATIVE_BODY_KEEPOUTS = Object.freeze([
 {name:"CORE",minX:-1.245,maxX:1.345,minZ:-1.13,maxZ:1.33},
 {name:"RF",minX:-4.35,maxX:-3.05,minZ:-2.14,maxZ:-1.06},
 {name:"FLASH",minX:-4.30,maxX:-3.00,minZ:1.275,maxZ:2.025},
 {name:"NPU",minX:2.775,maxX:4.325,minZ:1.17,maxZ:2.35},
 {name:"IO",minX:3.23,maxX:4.31,minZ:-1.26,maxZ:-.34}
].map(item=>Object.freeze(item)));
/** Keep the visual SMD bank away from illustrative routing corridors. */
export function isIllustrativeRoutingCorridor(x,z,padding=.115){
 return VISUAL_ROUTES.some(route=>{
  if(route.layer!==0)return false;
  const xs=route.points.map(p=>p[0]),zs=route.points.map(p=>p[1]);
  return x>=Math.min(...xs)-padding&&x<=Math.max(...xs)+padding&&
         z>=Math.min(...zs)-padding&&z<=Math.max(...zs)+padding;
 });
}
function distanceToSegment(x,y,a,b){
 const vx=b[0]-a[0],vy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));
 return Math.hypot(x-(a[0]+t*vx),y-(a[1]+t*vy));
}
function ccw(a,b,c){return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])}
function segmentsCross(a,b,c,d){
 const e=1e-10,ab1=ccw(a,b,c),ab2=ccw(a,b,d),cd1=ccw(c,d,a),cd2=ccw(c,d,b);
 return ((ab1>e&&ab2<-e)||(ab1<-e&&ab2>e))&&((cd1>e&&cd2<-e)||(cd1<-e&&cd2>e));
}
function segmentDistance(a,b,c,d){
 if(segmentsCross(a,b,c,d))return 0;
 return Math.min(distanceToSegment(a[0],a[1],c,d),distanceToSegment(b[0],b[1],c,d),distanceToSegment(c[0],c[1],a,b),distanceToSegment(d[0],d[1],a,b));
}
/** Returns the same geometric facts in the browser and in Node. NOT KiCad DRC. */
export function auditIllustrativeGeometry(routes=VISUAL_ROUTES){
 let crossings=0,minGap=Infinity,clearanceViolations=0,outside=0,nonFinite=0,packageKeepoutWarnings=0;
 let invalidRecords=0,invalidLayers=0,invalidWidths=0,duplicateIds=0,degenerateSegments=0;
 const ids=new Set(),accepted=[],firstIssues=[];
 for(const route of routes){
  if(!route||typeof route.id!=='string'||!route.id.trim()||!Array.isArray(route.points)||route.points.length<2){
   invalidRecords++;if(firstIssues.length<10)firstIssues.push({issue:"invalid route record"});continue;
  }
  if(ids.has(route.id)){duplicateIds++;if(firstIssues.length<10)firstIssues.push({issue:"duplicate route id",id:route.id})}
  ids.add(route.id);
  const layerOk=Number.isInteger(route.layer)&&route.layer>=0&&route.layer<LAYER_LABELS.length;
  const widthOk=Number.isFinite(route.width)&&route.width>0&&route.width<=.25;
  const pointsOk=route.points.every(p=>Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
  if(!layerOk)invalidLayers++;
  if(!widthOk)invalidWidths++;
  if(!pointsOk){nonFinite++;invalidRecords++}
  if(!layerOk||!widthOk||!pointsOk){if(firstIssues.length<10)firstIssues.push({issue:"invalid layer/width/coordinates",id:route.id});continue}
  for(let k=1;k<route.points.length;k++){
   const a=route.points[k-1],b=route.points[k];
   if(Math.hypot(b[0]-a[0],b[1]-a[1])<.000001){degenerateSegments++;if(firstIssues.length<10)firstIssues.push({issue:"zero-length segment",id:route.id})}
  }
  accepted.push(route);
 }
 for(const route of accepted){
  for(let k=1;k<route.points.length;k++){
   const a=route.points[k-1],b=route.points[k];
   for(const box of ILLUSTRATIVE_BODY_KEEPOUTS){
    const margin=.048;
    if(Math.max(a[0],b[0])>=box.minX-margin&&Math.min(a[0],b[0])<=box.maxX+margin&&
       Math.max(a[1],b[1])>=box.minZ-margin&&Math.min(a[1],b[1])<=box.maxZ+margin){
      packageKeepoutWarnings++;
      if(firstIssues.length<10)firstIssues.push({route:route.id,package:box.name,issue:"3D body keepout"});
    }
   }
  }
  for(const [x,z] of route.points){
   if(!Number.isFinite(x)||!Number.isFinite(z)){nonFinite++;continue}
   if(Math.abs(x)+route.width/2>BOARD_BOUNDS.halfWidth-BOARD_BOUNDS.margin||
      Math.abs(z)+route.width/2>BOARD_BOUNDS.halfDepth-BOARD_BOUNDS.margin)outside++;
  }
 }
 const layers=[...new Set(accepted.map(route=>route.layer))];
 for(const layer of layers){
  const list=accepted.filter(route=>route.layer===layer);
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i],b=list[j];let pairGap=Infinity;
   for(let k=0;k<a.points.length-1;k++)for(let l=0;l<b.points.length-1;l++){
    const d=segmentDistance(a.points[k],a.points[k+1],b.points[l],b.points[l+1])-(a.width+b.width)/2;
    pairGap=Math.min(pairGap,d);
   }
   minGap=Math.min(minGap,pairGap);
   if(pairGap<-.0000001)crossings++;
   if(pairGap<ARTWORK_REQUIRED_GAP-.0000001){
    clearanceViolations++;
    if(firstIssues.length<10)firstIssues.push({a:a.id,b:b.id,gap:Number(pairGap.toFixed(5))});
   }
  }
 }
 return Object.freeze({
  revision:ROUTING_REVISION,category:"VISUAL_GEOMETRY_ONLY",
  conceptualLayerCount:layers.length,illustrativeRoutes:routes.length,
  sameLayerIntersections:crossings,
  sameLayerClearanceWarnings:clearanceViolations,
  minimumVisibleEdgeGap:Number(minGap.toFixed(5)),
  outOfBounds:outside,nonFiniteCoordinates:nonFinite,packageKeepoutWarnings,
  invalidRouteRecords:invalidRecords,invalidLayerAssignments:invalidLayers,invalidTrackWidths:invalidWidths,duplicateRouteIds:duplicateIds,zeroLengthSegments:degenerateSegments,
  visualGeometryPass:crossings===0&&clearanceViolations===0&&outside===0&&nonFinite===0&&packageKeepoutWarnings===0&&invalidRecords===0&&invalidLayers===0&&invalidWidths===0&&duplicateIds===0&&degenerateSegments===0,
  fabricationApproved:false,ercVerified:false,kicadDrcVerified:false,
  firstIssues
 });
}