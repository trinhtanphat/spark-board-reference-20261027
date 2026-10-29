/**
 * SPARK 100-RACK SINGLE-FLOOR CONCEPT — OFFICIAL HARDWARE COUNTS NOT IMPLIED.
 * 10 x 10 visual floor; no electrical engineering, mechanical CAD or live telemetry.
 * All geometry is procedural, with InstancedMesh used for repeated fascias.
 */
import {buildFloor100Impact} from './floor100-impact.mjs';
import {buildFloor100PowerModel,validateFloor100RackWatts,FLOOR100_RACK_BASELINE_MAX_W} from './floor100-power.mjs';
import {buildFloor100ThermalPlan} from './floor100-thermal.mjs';
import {buildFloor100CoolingRoutes,FLOOR100_COOLING_TRACE_MODES} from './floor100-cooling-path.mjs';
import {buildFloor100FeedAllocation,FLOOR100_DEMO_FEED_CAPACITIES} from './floor100-feed-allocation.mjs';
import {buildFloor100FeedRoutes,FLOOR100_TRACE_MODES,FLOOR100_VISUAL_POWER_GEOMETRY} from './floor100-power-path.mjs';
import {NVL72_INSPECTION_PARTS,nvl72PartShapes} from './floor100-hardware.mjs';
export const FLOOR100_SPEC=Object.freeze({
 rows:10,columns:10,rackCount:100,rackWidth:3.72,rackDepth:2.52,
 pitchX:3.82,pitchZ:5.70,computeRacks:80,fabricRacks:10,storageRacks:10,
 serviceClearanceX:.10,serviceClearanceZ:3.18,cduCount:8,crahCount:12,
 upsCount:4,batteryCabinets:8,generators:2,designStatus:"ILLUSTRATIVE ONLY"
});
export function createFloor100Concept(THREE){
 const group=new THREE.Group();group.name="SPARK_SINGLE_FLOOR_100_RACKS_CONCEPT";
 const racks=[],pickTargets=[],zones={cooling:new THREE.Group(),power:new THREE.Group(),network:new THREE.Group(),airflow:new THREE.Group()};
 for(const [k,v] of Object.entries(zones)){v.name="FLOOR100_"+k.toUpperCase();group.add(v)}
 const materials={
  shell:new THREE.MeshStandardMaterial({color:"#19252b",metalness:.7,roughness:.33}),
  steel:new THREE.MeshStandardMaterial({color:"#70818b",metalness:.8,roughness:.31}),
  face:new THREE.MeshStandardMaterial({color:"#293942",metalness:.52,roughness:.45}),
  gpu:new THREE.MeshStandardMaterial({color:"#879871",metalness:.6,roughness:.37}),
  nv:new THREE.MeshStandardMaterial({color:"#567e8b",metalness:.55,roughness:.35}),
  psu:new THREE.MeshStandardMaterial({color:"#bc9972",metalness:.7,roughness:.3}),
  led:new THREE.MeshBasicMaterial({color:"#9ff5ab"}),
  fabric:new THREE.MeshStandardMaterial({color:"#497d89",metalness:.6,roughness:.3}),
  storage:new THREE.MeshStandardMaterial({color:"#796a90",metalness:.6,roughness:.34}),
  coolant:new THREE.MeshStandardMaterial({color:"#31c8de",metalness:.65,roughness:.25}),
  returnFlow:new THREE.MeshStandardMaterial({color:"#e0a278",metalness:.55,roughness:.3}),
  source:new THREE.MeshStandardMaterial({color:"#e3b46c",metalness:.7,roughness:.33}),
  powerA:new THREE.MeshStandardMaterial({color:"#ffd06a",emissive:"#b1781d",emissiveIntensity:.35,metalness:.66,roughness:.32}),
  powerB:new THREE.MeshStandardMaterial({color:"#68d2ed",emissive:"#176b8a",emissiveIntensity:.35,metalness:.68,roughness:.31}),
  generatorLive:new THREE.MeshStandardMaterial({color:"#5b6a5b",emissive:"#25462a",emissiveIntensity:.06,metalness:.35,roughness:.48}),
  battery:new THREE.MeshStandardMaterial({color:"#a6b3a0",metalness:.45,roughness:.42}),
  floor:new THREE.MeshStandardMaterial({color:"#202c30",metalness:.1,roughness:.85}),
  aisleCold:new THREE.MeshBasicMaterial({color:"#2c879c",transparent:true,opacity:.37,depthWrite:false}),
  aisleHot:new THREE.MeshBasicMaterial({color:"#9b6448",transparent:true,opacity:.24,depthWrite:false}),
  cable:new THREE.MeshStandardMaterial({color:"#8fc59d",metalness:.4,roughness:.4}),
  stripe:new THREE.MeshBasicMaterial({color:"#d8cfa4"}),
  filter:new THREE.MeshBasicMaterial({color:"#59e6fa",transparent:true,opacity:.55,depthWrite:false})
 };
 const boxGeom=new THREE.BoxGeometry(1,1,1),instanceRecords=new Map(),batched=[];
 const o=new THREE.Object3D();
 function cube(kind,x,y,z,w,h,d,owner=group){
  if(!instanceRecords.has(kind))instanceRecords.set(kind,[]);
  // Group each repeated unit by geometry, material and owning visibility zone.
  instanceRecords.get(kind).push({x,y,z,w,h,d,owner});
 }
 function makeBox(owner,kind,x,y,z,w,h,d){
  // Utility equipment is also instanced. Avoid 200+ separate draw calls from
  // CDU/CRAH/UPS façades and emergency generators in the 100-rack overview.
  let zone=owner;
  while(zone!==group&&!Object.values(zones).includes(zone)&&zone.parent)zone=zone.parent;
  cube(kind,x,y,z,w,h,d,zone);
 }
 const PX=FLOOR100_SPEC.pitchX,PZ=FLOOR100_SPEC.pitchZ;
 const xR=(c)=>(c-4.5)*PX,zR=(r)=>(r-4.5)*PZ;
 for(let r=0;r<10;r++)for(let c=0;c<10;c++){
  const n=r*10+c+1,id="R"+String(n).padStart(3,"0");
  const kind=c<8?"compute":c===8?"fabric":"storage",x=xR(c),z=zR(r);
  const rack={id,row:r,column:c,kind,x,z,gpuEquivalent:kind==="compute"?72:0};
  racks.push(rack);
  cube("shell",x,3.28,z,3.55,8.03,2.43);
  cube("face",x,3.35,z+1.265,3.44,7.7,.09);
  cube("face",x,3.35,z-1.265,3.44,7.7,.09);
  for(const dx of [-1.79,1.79])for(const dz of [-1.18,1.18])
   cube("steel",x+dx,3.35,z+dz,.11,8.24,.11);
  for(const y of [-.77,7.47])cube("steel",x,y,z,3.70,.15,2.51);
  const tier=kind==="compute"?"gpu":kind==="fabric"?"fabric":"storage";
  // Compute/management/power slot front facias. Visual RU count is conceptual.
  if(kind==="compute"){
   for(let i=0;i<18;i++){
    const y=-.47+i*.257;
    cube("gpu",x,y,z+1.337,3.20,.20,.065);
    for(const dx of [-1.43,1.43])cube("steel",x+dx,y,z+1.39,.065,.13,.07);
    cube("led",x+1.1,y,z+1.39,.06,.035,.028);
   }
   for(let i=0;i<9;i++)cube("nv",x,4.36+i*.208,z+1.337,3.20,.15,.066);
   for(let i=0;i<4;i++)cube("psu",x,6.43+i*.195,z+1.34,3.20,.145,.06);
   for(let i=0;i<2;i++)cube("fabric",x,7.24+i*.14,z+1.34,3.18,.105,.06);
   // Rear cabinet cartridge columns + manifolds + dual power bars.
   // 3D front and rear face connectors are placed in instanced rows;
   // the orientation here is illustrative rather than actual electrical CAD.
   for(let j=0;j<18;j++){
    const y=-.49+j*.257;
    for(const dx of [-1.37,-.97,-.57,-.17,.23,.63]){
     cube("steel",x+dx,y,z-1.426,.22,.06,.028);
    }
    if(j%3===0)cube("led",x+1.08,y,z-1.455,.075,.047,.02);
   }
   for(let j=0;j<4;j++){
    cube("psu",x-.9+j*.58,6.54,z-1.44,.43,.12,.05);
   }
   for(const dx of [-1.1,-.37,.37,1.1]){
    cube("nv",x+dx,3.2,z-1.37,.17,7.1,.14);
    for(let j=0;j<13;j++)cube("steel",x+dx,.15+j*.49,z-1.455,.12,.077,.02);
   }
   for(const dx of [-1.6,1.6]){
    cube("coolant",x+dx,3.23,z-1.49,.11,7.6,.11,zones.cooling);
    cube(dx<0?"powerA":"powerB",x+dx*.88,3.2,z-1.48,.065,7.45,.07,zones.power);
   }
  }else{
   for(let j=0;j<18;j++){
    const y=-.25+j*.36;
    cube(tier,x,y,z+1.35,3.12,.22,.075);
    for(let k=0;k<8;k++)cube("steel",x-1.35+k*.36,y,z-1.355,.22,.065,.036);
   }
  }
  const pick=new THREE.Mesh(new THREE.BoxGeometry(3.66,8.24,2.54),new THREE.MeshBasicMaterial({visible:false}));
  pick.layers.set(29);pick.position.set(x,3.35,z);pick.userData.rackId=id;
  pick.name="FLOOR100_PICK_"+id;group.add(pick);pickTargets.push(pick);
 }
 // Floor, active aisle overlays, protective border and in-floor cable ribbons.
 const floorW=77,floorD=79;
 makeBox(group,"floor",0,-1.04,0,floorW,.14,floorD);
 for(let row=0;row<9;row++){
  const z=(zR(row)+zR(row+1))/2;
  cube(row%2===0?"aisleCold":"aisleHot",0,-.938,z,38.65,.016,3.04,zones.airflow);
  // Cooling headers over all ten rows; separate supply & return lines.
  cube("coolant",0,8.20,z,39,.095,.09,zones.cooling);
  cube("returnFlow",0,8.36,z+.38,39,.09,.09,zones.cooling);
  cube("cable",0,8.62,z-.33,39,.11,.075,zones.network);
 }
 // Row aisle labels are visible from top and do not use WebGL text fonts.
 for(let row=0;row<10;row++)for(const x of [-20.45,20.45]){
  cube("stripe",x,-.945,zR(row),.1,.02,2.65);
 }
 // CDU and coolant connections in east wing.
 for(let i=0;i<8;i++){
  const z=(i-3.5)*7.0;
  const unit=new THREE.Group();unit.name="CDU_"+(i+1);zones.cooling.add(unit);
  makeBox(unit,"coolant",26,2.05,z,3.25,4.8,2.4);
  makeBox(unit,"face",26,2.05,z+1.24,2.85,4.2,.07);
  for(let j=0;j<6;j++)makeBox(unit,"steel",25.03+j*.38,1.8,z+1.32,.18,.11,.045);
  for(let j=0;j<3;j++)makeBox(unit,"returnFlow",25.16+j*.79,3.92,z+.7,.22,.22,.23);
 }
 // Air handlers (CRAH) split along two corridors.
 for(let i=0;i<12;i++){
  const z=(i%6-2.5)*9.0;
  const x=i<6?31:22.8;
  const u=new THREE.Group();zones.cooling.add(u);u.name="CRAH_"+String(i+1);
  makeBox(u,"steel",x,1.65,z,2.7,4,2.15);
  makeBox(u,"face",x,1.6,z+1.1,2.4,3.6,.065);
  for(let j=0;j<6;j++)makeBox(u,"coolant",x-1.0+j*.4,1.0,z+1.17,.15,1.6,.025);
 }
 // Backup power equipment remains a separate simulated electric service zone.
 for(let i=0;i<4;i++){
  const z=(i-1.5)*12.0;
  const g=new THREE.Group();g.name="UPS_BANK_"+(i+1);zones.power.add(g);
  makeBox(g,"source",-26,1.8,z,4.4,4.3,3.65);
  makeBox(g,"face",-26,1.8,z+1.86,4.08,3.82,.10);
  for(let j=0;j<4;j++)makeBox(g,"led",-27.46+j*.82,2.54,z+1.94,.16,.10,.025);
 }
 for(let i=0;i<8;i++){
  const z=(i-3.5)*6.7;
  makeBox(zones.power,"battery",-32.0,1.65,z,2.4,3.9,2.1);
  makeBox(zones.power,"source",-32.0,2.4,z+1.12,1.8,.15,.03);
 }
 for(let i=0;i<2;i++){
  const z=i===0?-25:25;
  const g=new THREE.Group();g.name="GENERATOR_"+(i+1);zones.power.add(g);
  makeBox(g,"source",-27,1.25,z,7.7,3.55,3.7);
  for(let j=0;j<7;j++)makeBox(g,"face",-29.8+j*.9,1.5,z+1.94,.55,1.8,.08);
  makeBox(g,"steel",-27,3.65,z,1,.45,1);
  makeBox(g,"generatorLive",-27,3.98,z,.8,.14,.8);
 }
 // Dedicated A/B visual utility routing from equipment gallery to rack trunks.
 // These schematic conduits are NOT actual cable sizing, safe busway installation
 // or a verified UPS/generator connection sequence.
 for(const d of Object.values(FLOOR100_VISUAL_POWER_GEOMETRY.feeds)){
  cube(d.kind,d.trunkX,d.topY,0,.15,.16,55,zones.power);
 }
 for(let bank=0;bank<4;bank++){
  const z=(bank-1.5)*12.0;
  for(const [kind,trunkX,top,upsX] of [
   ["powerA",-20.7,8.87,-26.1],["powerB",-20.3,9.02,-25.9]
  ]){
   // Attach the riser to the UPS enclosure upper surface (Y=3.95).
   // Keep A/B offset visually separate and join each riser to its trunk.
   cube(kind,upsX,(FLOOR100_VISUAL_POWER_GEOMETRY.upsTopY+top)/2,z,
    .16,top-FLOOR100_VISUAL_POWER_GEOMETRY.upsTopY+.22,.17,zones.power);
   cube(kind,(upsX+trunkX)/2,top,z,trunkX-upsX+.22,.16,.17,zones.power);
   cube(kind,upsX,top,z,.26,.24,.26,zones.power);
   cube(kind,trunkX,top,z,.26,.24,.26,zones.power);
  }
 }
 // This is only a visual service-gallery connection, not ATS/switchgear CAD.
 // One continuous gallery ties the fictional battery and generator symbols
 // into the UPS enclosures instead of leaving separate floating rails.
 cube("source",-26.3,4.0,0,.18,.18,50.3,zones.power);
 for(const generatorZ of [-25,25]){
  cube("source",-26.3,3.75,generatorZ,.18,1.35,.18,zones.power);
  cube("source",-26.3,4.0,generatorZ,.28,.24,.28,zones.power);
 }
 for(let i=0;i<8;i++){
  const z=(i-3.5)*6.7;
  cube("source",-29.15,4.0,z,5.9,.18,.18,zones.power);
  cube("source",-32,3.6,z,.18,1.80,.18,zones.power);
  cube("source",-26.3,4.0,z,.27,.25,.27,zones.power);
 }
 // Full-length visual busways, ending exactly at the outermost cabinet
 // tap. Both A/B tracks share landing coordinates with the rack drops below.
 // This is a render-geometry fix, not a facility electrical circuit design.
 for(let row=0;row<10;row++){
  for(const d of Object.values(FLOOR100_VISUAL_POWER_GEOMETRY.feeds)){
   const x0=d.trunkX,xEnd=xR(9)+d.offsetX;
   cube(d.kind,(x0+xEnd)/2,d.topY,zR(row)+d.offsetZ,
    xEnd-x0+.24,.16,.17,zones.power);
  }
 }
 for(let row=0;row<10;row++)for(let c=0;c<10;c++){
  const x=xR(c),z=zR(row);
  if(c<8)cube("coolant",x,8.04,z,.065,.18,2.20,zones.cooling);
  // Each vertical conduit now touches its overhead spur AND a connector
  // terminating on the actual cabinet rear. No free-floating endpoints.
  for(const [dx,kind,headerZ,top] of [[-1.35,"powerA",z,8.87],[1.35,"powerB",z+.3,9.02]]){
   const px=x+dx,entryZ=z-1.64,rearPanelZ=z-1.37,portY=2.75;
   const yCenter=(top+portY)/2;
   cube(kind,px,yCenter,entryZ,.105,top-portY+.2,.12,zones.power);
   cube(kind,px,top,(headerZ+entryZ)/2,.13,.13,Math.abs(headerZ-entryZ)+.2,zones.power);
   cube(kind,px,top,headerZ,.24,.23,.24,zones.power);
   cube(kind,px,top,entryZ,.24,.23,.24,zones.power);
   cube(kind,px,portY,(entryZ+rearPanelZ)/2,.22,.25,Math.abs(rearPanelZ-entryZ)+.20,zones.power);
   cube("steel",px,portY,rearPanelZ,.34,.32,.13,zones.power);
  }
 }
 // Place repeating details into one InstancedMesh per (zone, material).
 const groups=new Map();
 for(const [kind,records] of instanceRecords){
  for(const rec of records){
   const key=(rec.owner===group?"rack":Object.entries(zones).find(([,v])=>v===rec.owner)?.[0]||"rack")+"|"+kind;
   if(!groups.has(key))groups.set(key,{kind,owner:rec.owner,records:[]});
   groups.get(key).records.push(rec);
  }
 }
 for(const {kind,owner,records} of groups.values()){
  const mesh=new THREE.InstancedMesh(boxGeom,materials[kind],records.length);
  mesh.name="FLOOR100_BATCH_"+kind;mesh.userData.kind=kind;mesh.frustumCulled=true;
  records.forEach((r,i)=>{o.position.set(r.x,r.y,r.z);o.rotation.set(0,0,0);o.scale.set(r.w,r.h,r.d);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();owner.add(mesh);batched.push(mesh);
 }
 // Geometry-only overlap audit: verify the visible prisms actually cover
 // both endpoints of every highlighted segment, for all 200 fictional paths.
 // This checks 3D mesh topology, not electrical continuity or safety.
 const visualCableAudit=(()=>{
  const byKind=new Map();
  for(const kind of ["powerA","powerB"]){
   byKind.set(kind,(instanceRecords.get(kind)||[]).filter(r=>r.owner===zones.power));
  }
  const contained=(r,p)=>{
   return Math.abs(p[0]-r.x)<=r.w/2+.005&&
    Math.abs(p[1]-r.y)<=r.h/2+.005&&
    Math.abs(p[2]-r.z)<=r.d/2+.005;
  };
  let paths=0,segments=0,missing=0;
  for(const rack of racks)for(const feed of ["A","B"]){
   paths++;
   const kind=feed==="A"?"powerA":"powerB";
   for(const s of buildFloor100FeedRoutes(rack,feed)[0].segments){
    segments++;
    if(!byKind.get(kind).some(r=>contained(r,s.from)&&contained(r,s.to)))missing++;
   }
  }
  return Object.freeze({paths,segments,missing,connected:missing===0,
   scope:"Visual 3D cuboid overlaps only, NOT electrical continuity"});
 })();
 // Per-rack live SCHEMATIC ROUTE indicator. Operational availability is not measured.
 const indicatorMat=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false});
 const routeIndicators=new THREE.InstancedMesh(boxGeom,indicatorMat,racks.length);
 routeIndicators.name='FLOOR100_SCHEMATIC_FEED_INDICATORS';
 racks.forEach((r,i)=>{
  o.position.set(r.x,7.33,r.z+1.48);o.rotation.set(0,0,0);o.scale.set(.45,.145,.048);o.updateMatrix();
  routeIndicators.setMatrixAt(i,o.matrix);
 });
 routeIndicators.instanceMatrix.needsUpdate=true;routeIndicators.computeBoundingSphere();group.add(routeIndicators);
 // Single-draw-call heatmap strip above each rack's front-facing panel.
 const heatMat=new THREE.MeshBasicMaterial({color:"#ffffff",toneMapped:false});
 const heatIndicators=new THREE.InstancedMesh(boxGeom,heatMat,racks.length);
 heatIndicators.name="FLOOR100_ESTIMATED_POWER_HEATMAP";heatIndicators.frustumCulled=false;
 racks.forEach((r,i)=>{o.position.set(r.x,7.09,r.z+1.49);o.rotation.set(0,0,0);o.scale.set(1.5,.14,.07);
  o.updateMatrix();heatIndicators.setMatrixAt(i,o.matrix)});
 heatIndicators.instanceMatrix.needsUpdate=true;heatIndicators.visible=false;
 group.add(heatIndicators);
 // One efficient 20-instance row-end visual load meter (A/B per row).
 // Its lengths and colors are only hypothetical demand/capacity ratios.
 const rowLoadMaterial=new THREE.MeshBasicMaterial({color:"#ffffff",toneMapped:false});
 const rowFeedMeters=new THREE.InstancedMesh(boxGeom,rowLoadMaterial,20);
 rowFeedMeters.name="FLOOR100_DEMO_ROW_AB_LOAD_GAUGES";
 rowFeedMeters.frustumCulled=false;zones.power.add(rowFeedMeters);
 // Ten compact visible row-end cooling budget strips (one draw call).
 const coolingMeterMat=new THREE.MeshBasicMaterial({color:"#ffffff",toneMapped:false});
 const coolingRowMeters=new THREE.InstancedMesh(boxGeom,coolingMeterMat,10);
 coolingRowMeters.name="FLOOR100_THERMAL_COOLING_ROW_BUDGET";
 coolingRowMeters.frustumCulled=false;zones.cooling.add(coolingRowMeters);
 const coolingColors={safe:new THREE.Color("#71dddc"),high:new THREE.Color("#eebf78"),
  over:new THREE.Color("#f37a6a"),idle:new THREE.Color("#566a70")};
 const meterColors={safe:new THREE.Color("#8fe2bb"),
  warning:new THREE.Color("#f1bf72"),over:new THREE.Color("#ef786a"),
  none:new THREE.Color("#52636b")};
 // Rack frame selection is 12 unwarped cuboid edges.
 const outline=new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(3.78,8.30,2.59)),
  new THREE.LineBasicMaterial({color:0xf8d18a,depthTest:false,transparent:true,opacity:.97}));
 outline.renderOrder=70;outline.visible=false;group.add(outline);
 let selected=null,filter="all",serviceSide="front";
 let rackBaselineOverrides=Object.create(null);
 let loadPercent=100,powerHeatmap=false,powerModel=buildFloor100PowerModel(racks,loadPercent);
 let feedCapacityKW=6000,feedAllocation=buildFloor100FeedAllocation(powerModel,"normal",feedCapacityKW);
 let thermalCapturePercent=90,thermalCduCapacityKW=1200,thermalAvailableCDUs=8;
 let thermalPlan=buildFloor100ThermalPlan(powerModel);
 function refreshThermalPlan(){
  thermalPlan=buildFloor100ThermalPlan(powerModel,{
   liquidCapturePercent:thermalCapturePercent,cduCapacityKW:thermalCduCapacityKW,
   availableCDUs:thermalAvailableCDUs
  });
  for(let i=0;i<10;i++){
   const row=thermalPlan.rows[i],util=row.nominalUtilizationPercent;
   const length=Math.max(.08,Math.min(2.4,(util??200)/100*1.35));
   o.position.set(xR(0)-2.15,7.82,zR(i));
   o.rotation.set(0,0,0);o.scale.set(.22,.15,length);
   o.updateMatrix();coolingRowMeters.setMatrixAt(i,o.matrix);
   coolingRowMeters.setColorAt(i,util===null||util>100?coolingColors.over:
    util>=85?coolingColors.high:util>0?coolingColors.safe:coolingColors.idle);
  }
  coolingRowMeters.instanceMatrix.needsUpdate=true;
  coolingRowMeters.instanceColor.needsUpdate=true;
 }
 function setThermalAssumptions({liquidCapturePercent=thermalCapturePercent,
  cduCapacityKW=thermalCduCapacityKW,availableCDUs=thermalAvailableCDUs}={}){
  try{
   buildFloor100ThermalPlan(powerModel,{liquidCapturePercent,cduCapacityKW,availableCDUs});
   thermalCapturePercent=liquidCapturePercent;
   thermalCduCapacityKW=cduCapacityKW;
   thermalAvailableCDUs=availableCDUs;
   refreshThermalPlan();return true;
  }catch{return false}
 }
 function refreshFeedAllocation(){
  feedAllocation=buildFloor100FeedAllocation(powerModel,powerScenario,feedCapacityKW);
  for(let i=0;i<10;i++)for(let j=0;j<2;j++){
   const row=feedAllocation.rows[i],pct=j?row.bPct:row.aPct;
   const length=Math.max(.09,Math.min(2.5,pct/100*1.8));
   o.position.set(xR(9)+2.0+j*.40,7.7,zR(i));
   o.rotation.set(0,0,0);o.scale.set(.16,.14,length);
   o.updateMatrix();rowFeedMeters.setMatrixAt(i*2+j,o.matrix);
   rowFeedMeters.setColorAt(i*2+j,pct>100?meterColors.over:
    pct>=85?meterColors.warning:pct>0?meterColors.safe:meterColors.none);
  }
  rowFeedMeters.instanceMatrix.needsUpdate=true;
  rowFeedMeters.instanceColor.needsUpdate=true;
 }
 function setFeedCapacityKW(next){
  if(!FLOOR100_DEMO_FEED_CAPACITIES.includes(next))return false;
  feedCapacityKW=next;refreshFeedAllocation();return true;
 }
 const powerHeatColors={high:new THREE.Color("#ed8359"),medium:new THREE.Color("#e6c66f"),low:new THREE.Color("#73c5c8")};
 function refreshPowerEstimate(){
  powerModel=buildFloor100PowerModel(racks,loadPercent,1.20,rackBaselineOverrides);
  refreshFeedAllocation();
  refreshThermalPlan();
  powerModel.entries.forEach((r,i)=>heatIndicators.setColorAt(i,powerHeatColors[r.heatBand]));
  heatIndicators.instanceColor.needsUpdate=true;heatIndicators.visible=powerHeatmap;
 }
 function setPowerLoadPercent(value){
  if(![60,80,100].includes(value))return false;
  loadPercent=value;refreshPowerEstimate();return true;
 }
 function replaceRackBaselineOverrides(next){
  try{
   const checked=validateFloor100RackWatts(next,racks.map(r=>r.id));
   rackBaselineOverrides=checked;refreshPowerEstimate();return true;
  }catch{return false}
 }
 function setRackBaselineWatts(id,watts){
  if(!rackById.has(id)||!Number.isSafeInteger(watts)||watts<0||
   watts>FLOOR100_RACK_BASELINE_MAX_W||watts%100!==0)return false;
  return replaceRackBaselineOverrides({...rackBaselineOverrides,[id]:watts});
 }
 function resetRackBaselineWatts(id=null){
  if(id!==null&&!rackById.has(id))return false;
  if(id===null)return replaceRackBaselineOverrides({});
  const next={...rackBaselineOverrides};delete next[id];
  return replaceRackBaselineOverrides(next);
 }
 function setPowerHeatmap(value){
  if(typeof value!=="boolean")return false;
  powerHeatmap=value;refreshPowerEstimate();return true;
 }
 let hardwarePart='none';
 const highlightMat=new THREE.MeshBasicMaterial({color:'#ffe7a2',transparent:true,opacity:.49,depthTest:false,depthWrite:false,toneMapped:false});
 const highlight=new THREE.InstancedMesh(boxGeom,highlightMat,18);
 highlight.name='FLOOR100_GUIDE_BACKED_HARDWARE_HIGHLIGHT';highlight.renderOrder=66;highlight.frustumCulled=false;
 highlight.visible=false;group.add(highlight);
 function refreshHardwareHighlight(){
  const rack=rackById.get(selected),part=NVL72_INSPECTION_PARTS[hardwarePart];
  const parts=rack?.kind==='compute'?nvl72PartShapes(hardwarePart,rack.x,rack.z):[];
  highlight.count=parts.length;highlight.visible=parts.length>0;
  for(let i=0;i<parts.length;i++){
   const p=parts[i];o.position.set(p.x,p.y,p.z);o.rotation.set(0,0,0);
   o.scale.set(p.w,p.h,p.d);o.updateMatrix();highlight.setMatrixAt(i,o.matrix);
  }
  if(parts.length)highlight.instanceMatrix.needsUpdate=true;
  return Boolean(part);
 }
 function setHardwarePart(next){
  if(!Object.hasOwn(NVL72_INSPECTION_PARTS,next))return false;
  hardwarePart=next;refreshHardwareHighlight();return true;
 }
 let powerScenario="normal",coolingCircuit="both";
 // Highlight exactly one selected compute rack's fictional CDU -> manifold
 // routes. Rack position changes rebuild at most 8 mesh segments.
 const coolingTraceGroup=new THREE.Group();coolingTraceGroup.name="FLOOR100_SELECTED_COOLING_PATH";
 zones.cooling.add(coolingTraceGroup);
 const coolingTraceMaterials={
  supply:new THREE.MeshBasicMaterial({color:"#44e6f4",transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false}),
  return:new THREE.MeshBasicMaterial({color:"#ffa36f",transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false})
 };
 let coolingTraceMode="off",activeCoolingPaths=[];
 function rebuildCoolingPaths(){
  for(const mesh of [...coolingTraceGroup.children]){
   coolingTraceGroup.remove(mesh);mesh.geometry.dispose();
  }
  const selectedRack=racks.find(r=>r.id===selected);
  activeCoolingPaths=selectedRack?buildFloor100CoolingRoutes(selectedRack,coolingTraceMode):[];
  const axis=new THREE.Vector3(0,1,0);
  for(const route of activeCoolingPaths){
   for(const segment of route.segments){
    const a=new THREE.Vector3(...segment.from),b=new THREE.Vector3(...segment.to);
    const delta=b.clone().sub(a);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.2,delta.length(),.2),coolingTraceMaterials[route.channel]);
    mesh.name="FLOOR100_COOLING_TRACE_"+route.channel.toUpperCase()+"_"+segment.name.replace(/[^A-Z0-9]+/g,"_");
    mesh.userData={rackId:route.rackId,channel:route.channel,segment:segment.name};
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(axis,delta.normalize());mesh.renderOrder=79;
    coolingTraceGroup.add(mesh);
   }
  }
 }
 function setCoolingTraceMode(value){
  if(!FLOOR100_COOLING_TRACE_MODES.includes(value))return false;
  coolingTraceMode=value;rebuildCoolingPaths();return true;
 }
 // Both routes remain off until the user requests an individual rack trace.
 const powerPathGroup=new THREE.Group();powerPathGroup.name="FLOOR100_SELECTED_RACK_POWER_PATH";
 zones.power.add(powerPathGroup);
 const powerPathMats={
  A:new THREE.MeshBasicMaterial({color:"#ffe16c",transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false}),
  B:new THREE.MeshBasicMaterial({color:"#74e8ff",transparent:true,opacity:.98,depthTest:false,depthWrite:false,toneMapped:false})
 };
 let powerPathMode="off",activePowerPaths=[];
 function rebuildPowerPaths(){
  for(const child of [...powerPathGroup.children]){
   powerPathGroup.remove(child);
   child.geometry.dispose();
  }
  const rack=rackById.get(selected);
  activePowerPaths=rack?buildFloor100FeedRoutes(rack,powerPathMode,powerScenario):[];
  const axis=new THREE.Vector3(0,1,0);
  for(const route of activePowerPaths){
   const mat=powerPathMats[route.feed];
   for(const step of route.segments){
    const start=new THREE.Vector3(...step.from),end=new THREE.Vector3(...step.to);
    const delta=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.19,delta.length(),.19),mat);
    mesh.name="FLOOR100_TRACE_"+route.feed+"_"+step.name.replace(/[^A-Z0-9]+/g,"_");
    mesh.userData={feed:route.feed,segment:step.name,rackId:route.rackId};
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(axis,delta.normalize());mesh.renderOrder=78;
    powerPathGroup.add(mesh);
   }
  }
  for(const route of activePowerPaths){
   powerPathMats[route.feed].opacity=route.visualState==="dimmed"?.28:.98;
  }
  // Hide unselected material stale state while user switches racks.
  if(!activePowerPaths.some(r=>r.feed==="A"))powerPathMats.A.opacity=.98;
  if(!activePowerPaths.some(r=>r.feed==="B"))powerPathMats.B.opacity=.98;
 }
 function setPowerPathMode(next){
  if(!FLOOR100_TRACE_MODES.includes(next))return false;
  powerPathMode=next;rebuildPowerPaths();return true;
 }
 let routeImpact=buildFloor100Impact(racks,powerScenario);
 const indicatorColors={visible:new THREE.Color('#a4e7aa'),dimmed:new THREE.Color('#dc6d52'),unmapped:new THREE.Color('#719cb5')};
 const scenarioOptions=["normal","a-loss","b-loss","grid-loss"];
 const coolingOptions=["both","supply","return"];
 function updateInfrastructureVisuals(){
  routeImpact=buildFloor100Impact(racks,powerScenario);
  routeImpact.entries.forEach((entry,i)=>routeIndicators.setColorAt(i,indicatorColors[entry.status]));
  routeIndicators.instanceColor.needsUpdate=true;
  const unavailableA=powerScenario==="a-loss"||powerScenario==="grid-loss";
  const unavailableB=powerScenario==="b-loss"||powerScenario==="grid-loss";
  materials.powerA.color.set(unavailableA?"#373c42":"#ffd06a");
  materials.powerA.emissiveIntensity=unavailableA?0:.35;
  materials.powerB.color.set(unavailableB?"#30383b":"#68d2ed");
  materials.powerB.emissiveIntensity=unavailableB?0:.35;
  const generator=powerScenario==="grid-loss";
  materials.generatorLive.color.set(generator?"#a6ff7a":"#5b6a5b");
  materials.generatorLive.emissiveIntensity=generator?.85:.06;
  refreshFeedAllocation();
  rebuildPowerPaths();
  for(const batch of batched){
   const activeZone=batch.parent;
   if(activeZone!==zones.cooling)continue;
   const kind=batch.userData.kind;
   if(kind==="coolant")batch.visible=coolingCircuit!=="return";
   if(kind==="returnFlow")batch.visible=coolingCircuit!=="supply";
  }
 }
 function setPowerScenario(next){
  if(!scenarioOptions.includes(next))return false;
  powerScenario=next;updateInfrastructureVisuals();return true;
 }
 function setCoolingCircuit(next){
  if(!coolingOptions.includes(next))return false;
  coolingCircuit=next;updateInfrastructureVisuals();return true;
 }
 const rackById=new Map(racks.map(r=>[r.id,r]));
 function selectRack(id){
  if(id!==null&&!rackById.has(id))return false;
  selected=id;outline.visible=Boolean(id);
  if(id){const r=rackById.get(id);outline.position.set(r.x,3.35,r.z)}
  refreshHardwareHighlight();rebuildPowerPaths();rebuildCoolingPaths();return true;
 }
 function setFilter(next){
  if(!["all","cooling","power","network","airflow"].includes(next))return false;
  filter=next;for(const [name,g] of Object.entries(zones))g.visible=next==="all"||next===name;
  return true;
 }
 function setSide(side){if(side!=="front"&&side!=="rear")return false;serviceSide=side;return true}
 function diagnostics(){
  return {racks:racks.length,computeRacks:racks.filter(r=>r.kind==="compute").length,
   powerScenario,coolingCircuit,
   coolingAvailableCDUs:thermalAvailableCDUs,coolingCapturePercent:thermalCapturePercent,
   coolingRowMeterInstances:coolingRowMeters.count,
   coolingTraceMode,coolingTraceSegments:coolingTraceGroup.children.length,
   coolingTraceRack:activeCoolingPaths[0]?.rackId??null,
   coolingTraceChannels:activeCoolingPaths.map(r=>r.channel),
   coolingTraceVisible:coolingTraceGroup.visible&&zones.cooling.visible,
   coolingDemandKW:thermalPlan.liquidKW,coolingBudgetKW:thermalPlan.capacityKW,
   feedCapacityKW,feedAllocationStatus:feedAllocation.status,
   feedAPlanningKW:feedAllocation.aKW,feedBPlanningKW:feedAllocation.bKW,
   feedUnassignedPlanningKW:feedAllocation.unassignedKW,
   feedRowMeterInstances:rowFeedMeters.count,
   powerPathMode,powerPathSegments:powerPathGroup.children.length,
   powerPathFeeds:activePowerPaths.map(p=>p.feed),
   powerPathStatuses:activePowerPaths.map(p=>p.visualState),
   powerPathRack:activePowerPaths[0]?.rackId??null,
   powerPathVisible:powerPathGroup.visible&&zones.power.visible,
   powerLoadPercent:loadPercent,powerHeatmap,
   customRackWattCount:Object.keys(rackBaselineOverrides).length,
   powerTotalW:powerModel.totalW,powerFacilityW:powerModel.facilityW,
   powerDualDrops:200,powerHeatIndicators:heatIndicators.count,
   visualCableAudit,
   powerHeatVisible:heatIndicators.visible,
   hardwarePart,hardwareHighlightVisible:highlight.visible,
   hardwareHighlightCount:highlight.count,
   hardwareHighlightFirstZ:(()=>{if(!highlight.visible)return null;const m=new THREE.Matrix4();highlight.getMatrixAt(0,m);return Number(m.elements[14].toFixed(3));})(),
   hardwareSelectedRackKind:rackById.get(selected)?.kind??null,
   hardwareHighlightSide:NVL72_INSPECTION_PARTS[hardwarePart].side,
   routeStatusCounts:{...routeImpact.counts},routeIndicatorCount:routeIndicators.count,
   routeIndicatorColors:[0,1,8].map(i=>{const color=new THREE.Color();routeIndicators.getColorAt(i,color);return color.getHexString()}),
   routeRowCounts:routeImpact.rows.map(r=>({...r})),
   routeDisclaimer:routeImpact.disclaimer,
   powerFeedAVisible:powerScenario==="normal"||powerScenario==="b-loss",
   powerFeedBVisible:powerScenario==="normal"||powerScenario==="a-loss",
   backupGeneratorIllustrated:powerScenario==="grid-loss",
   coolingSupplyVisible:coolingCircuit!=="return",
   coolingReturnVisible:coolingCircuit!=="supply",
   visual:{
    feedA:materials.powerA.color.getHexString(),
    feedB:materials.powerB.color.getHexString(),
    backupIndicator:materials.generatorLive.color.getHexString(),
    supplyGeometryVisible:batched.some(m=>m.parent===zones.cooling&&m.userData.kind==="coolant"&&m.visible),
    returnGeometryVisible:batched.some(m=>m.parent===zones.cooling&&m.userData.kind==="returnFlow"&&m.visible),
    utilityBatchCount:batched.filter(m=>m.parent!==group).length
   },
   fabricRacks:10,storageRacks:10,gpuEquivalent:5760,selected,filter,serviceSide,
   rackWidth:FLOOR100_SPEC.rackWidth,sideGap:FLOOR100_SPEC.serviceClearanceX,
   frontRearGap:FLOOR100_SPEC.serviceClearanceZ,rows:10,columns:10,
   cdu:8,crah:12,ups:4,batteryCabinets:8,generators:2,
   batchCount:batched.length,instances:[...instanceRecords.values()].reduce((s,r)=>s+r.length,0),
   pickTargets:pickTargets.length,serviceZones:Object.keys(zones),illustrative:true};
 }
 group.visible=false;
 updateInfrastructureVisuals();
 refreshPowerEstimate();
 return {group,racks,pickTargets,selectRack,setFilter,setSide,setPowerScenario,setCoolingCircuit,setHardwarePart,
  setPowerLoadPercent,setPowerHeatmap,setPowerPathMode,setFeedCapacityKW,
  setThermalAssumptions,getThermalPlan:()=>thermalPlan,
  setCoolingTraceMode,getCoolingPaths:()=>activeCoolingPaths,
  setRackBaselineWatts,resetRackBaselineWatts,replaceRackBaselineOverrides,
  getRackBaselineOverrides:()=>({...rackBaselineOverrides}),
  getFeedAllocation:()=>feedAllocation,getPowerPaths:()=>activePowerPaths,
  getPowerModel:()=>powerModel,diagnostics,
  getRouteImpact:()=>routeImpact,getHardwareInfo:()=>NVL72_INSPECTION_PARTS[hardwarePart],
  rackPosition:id=>rackById.get(id)||null,getSelected:()=>selected};
}
