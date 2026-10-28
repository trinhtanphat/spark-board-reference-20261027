/**
 * Dense, browser-only NVIDIA GPU data-center visualization.
 * 15 NVL72 compute rack concepts + 1 fabric rack, 4x4 close-packed.
 * 3D dimensions/clearances and cable paths are artistic, NOT deployment CAD.
 */
import {FABRICS,DATA_CENTER_DISCLAIMER,DATA_CENTER_RACKS,DATA_CENTER_LAYOUT} from "./data-center-model.mjs";
export function createDataCenterConcept(THREE,model){
 const group=new THREE.Group(),parts=[],slotGroups=new Map(),pickTargets=[],cableGroup=new THREE.Group();
 group.name="UNOFFICIAL_DENSE_16_RACK_DATA_CENTER";
 const material=(color,metalness=.2,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const materials={
  black:material("#11191e",.55,.39),frame:material("#536068",.72,.32),
  gold:material("#b7a077",.74,.31),dark:material("#2a353c",.45,.39),
  power:material("#828a86",.61,.38),blue:material("#387d94",.51,.37),
  green:material("#a7ce58",.31,.35),empty:material("#091013",.19,.71),
  led:material("#8dbbcc",.22,.35),floor:material("#1a242a",.2,.8),
  vent:material("#1e2a31",.31,.59),handle:material("#c0b59d",.63,.31),
  port:material("#325b69",.39,.36),copper:material("#b78d57",.78,.31),
  pipe:material("#4a9bab",.75,.32),socket:material("#3c6975",.48,.39),
  aisle:material("#39454b",.11,.74)
 };
 const moduleMaterials={compute:"gold",nvlink:"dark",power:"power",tor:"blue",ib:"green",eth:"blue",mgmt:"power"};
 const cableMaterials=Object.fromEntries(Object.entries(FABRICS).map(([key,value])=>[key,material(value.color,.2,.42)]));
 const instanceData=new Map(),batches=[];
 const rackCenters=new Map(),slotPositions=new Map(),dynamicRecords=[];
 const rackInfo=new Map(DATA_CENTER_RACKS.map(r=>[r.id,r]));
 let selectedRack=null,selectedSlot=null,slotFrame=null;
 const rackOutlineGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(4.12,8.76,2.51));
 const rackOutline=new THREE.LineSegments(rackOutlineGeometry,new THREE.LineBasicMaterial({color:0xe2ca89,depthTest:false,transparent:true,opacity:.97}));
 rackOutline.name="DENSE_DC_SELECTED_RACK_12_EDGE_FRAME";rackOutline.renderOrder=85;rackOutline.visible=false;group.add(rackOutline);
 const dummy=new THREE.Object3D();
 function instance(kind,w,h,d,x,y,z,slotId=null){
  if(!instanceData.has(kind))instanceData.set(kind,[]);
  const record={kind,w,h,d,x,y,z,slotId,batch:null,index:-1};
  instanceData.get(kind).push(record);
  if(slotId)dynamicRecords.push(record);
  return record;
 }
 function matrixFor(record,installed=true,drawer=false){
  dummy.position.set(record.x,record.y,record.z+(drawer?.82:0));
  dummy.rotation.set(0,0,0);
  dummy.scale.set(record.w,installed?record.h:.00001,record.d);
  dummy.updateMatrix();return dummy.matrix;
 }
 function labelTexture(text){
  const canvas=document.createElement("canvas");canvas.width=768;canvas.height=128;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#152021";ctx.fillRect(0,0,768,128);
  ctx.fillStyle="#e5f0d8";ctx.font="bold 52px Arial";ctx.fillText(text,18,78);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,depthWrite:false});
 }
 const xPitch=DATA_CENTER_LAYOUT.pitchX,zPitch=DATA_CENTER_LAYOUT.pitchZ;
 const countX=DATA_CENTER_LAYOUT.columns,countZ=DATA_CENTER_LAYOUT.rows;
 const width=(countX-1)*xPitch+DATA_CENTER_LAYOUT.rackWidth;
 const depth=(countZ-1)*zPitch+DATA_CENTER_LAYOUT.rackDepth;
 const rackHeight=8.75,frameY=3.63;
 for(const rack of DATA_CENTER_RACKS){
  const x=(rack.column-(countX-1)/2)*xPitch;
  const z=(rack.row-(countZ-1)/2)*zPitch;
  rackCenters.set(rack.id,{x,z});
  instance("black",3.91,8.53,2.25,x,frameY,z);
  instance("empty",3.64,8.09,.13,x,frameY,z+1.12);
  for(const dx of [-1.97,1.97])for(const dz of [-1.19,1.19])
   instance("frame",.105,rackHeight,.105,x+dx,frameY,z+dz);
  for(const y of [-.77,8.02])instance("frame",4.10,.16,2.48,x,y,z);
  // Tiny side status strip, makes columns distinguishable even at a distance.
  instance(rack.kind==="fabric"?"green":"led",.055,7.3,.04,x+1.84,3.62,z+1.26);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.60,.30),labelTexture(rack.label));
  face.position.set(x,7.86,z+1.27);face.name="DC_RACK_LABEL_"+rack.id;group.add(face);
  const rearLabel=new THREE.Mesh(new THREE.PlaneGeometry(3.60,.30),labelTexture(rack.id+" / REAR SERVICE"));
  rearLabel.position.set(x,7.86,z-1.33);rearLabel.rotation.y=Math.PI;
  rearLabel.name="DC_REAR_LABEL_"+rack.id;group.add(rearLabel);
  // Schematic, non-engineering rear service hardware: passive copper NVLink
  // cartridges, coolant manifolds and independent 54V power busbars.
  if(rack.kind==="compute"){
   for(const bx of [-1.12,-.38,.38,1.12]){
    instance("copper",.14,7.30,.13,x+bx,3.52,z-1.36);
    for(let j=0;j<24;j++)instance("socket",.11,.068,.055,x+bx,.08+j*.302,z-1.46);
   }
   for(const side of [-1,1]){
    instance("pipe",.10,8.1,.11,x+side*1.72,3.50,z-1.46);
    instance("copper",.085,8.1,.09,x+side*1.91,3.50,z-1.54);
    for(let j=0;j<18;j++)instance("socket",.18,.082,.12,x+side*1.72,.05+j*.41,z-1.53);
   }
  }else{
   for(const side of [-1,1])instance("pipe",.08,7.6,.09,x+side*1.73,3.55,z-1.43);
  }
  // A separate 3D rack-picking volume for blank cabinet sections.
  const whole=new THREE.Mesh(new THREE.BoxGeometry(3.95,8.58,2.32),new THREE.MeshBasicMaterial({visible:false}));
  whole.layers.set(28);whole.position.set(x,3.63,z);
  whole.userData.part="DC_RACK / "+rack.id;whole.name="PICK_RACK_"+rack.id;group.add(whole);
 }
 const slotsByRack=new Map(DATA_CENTER_RACKS.map(r=>[r.id,model.slots.filter(s=>s.rack===r.id)]));
 const pickMaterial=new THREE.MeshBasicMaterial({visible:false});
 for(const rack of DATA_CENTER_RACKS){
  const center=rackCenters.get(rack.id);
  let y=-.49;
  const slots=slotsByRack.get(rack.id);
  for(const slot of slots){
   const h=rack.kind==="fabric"?.46:slot.kind==="power"?.44:.16;
   if(rack.kind==="fabric")y=slot.kind==="ib"?5.83:slot.kind==="eth"?4.50:3.18;
   else y+=h/2+.015;
   const x=center.x,z=center.z,id=slot.id;
   const root=new THREE.Group();root.position.set(x,y,z);
   root.userData.part="DC / "+id;
   group.add(root);parts.push(root);
   // Front-face-only click target. Full-depth ray volumes caused wrong slot
   // selection from elevated/oblique angles by intersecting adjacent trays.
   const click=new THREE.Mesh(new THREE.BoxGeometry(3.52,Math.max(h-.006,.05),.13),pickMaterial);
   click.position.z=1.30;
   click.layers.set(29);click.userData.part=root.userData.part;
   click.name="DC_SLOT_HIT_"+id;click.userData.side="front";root.add(click);pickTargets.push(click);
   const rearClick=new THREE.Mesh(new THREE.BoxGeometry(3.52,Math.max(h-.006,.05),.13),pickMaterial);
   rearClick.position.z=-1.30;rearClick.layers.set(29);
   rearClick.userData={part:root.userData.part,side:"rear"};
   rearClick.name="DC_SLOT_REAR_HIT_"+id;root.add(rearClick);pickTargets.push(rearClick);
   instance("empty",3.48,h-.015,.14,x,y,z+1.11);
   // Front/back fascia details are batched; they do not control physical ports.
   const rearFace=z-1.345,frontFace=z+1.405;
   const movingFace=[];
   const facade=(kind,w,h,d,px,py,pz)=>movingFace.push(instance(kind,w,h,d,px,py,pz,id));
   for(let j=0;j<6;j++)facade("vent",.34,Math.max(.012,h*.30),.019,x-.97+j*.38,y,frontFace);
   for(const hx of [-1.59,1.59])facade("handle",.042,Math.max(.064,h*.68),.08,x+hx,y,frontFace+.015);
   if(slot.kind==="compute"){
    for(let k=0;k<3;k++)facade("port",.13,.035,.027,x+.53+k*.20,y,frontFace+.035);
    facade("green",.045,.044,.03,x+1.43,y,frontFace+.04);
   }else if(slot.kind==="power"){
    for(let k=0;k<6;k++)facade("power",.42,Math.max(.06,h*.48),.045,x-1.28+k*.51,y,frontFace+.015);
    facade("green",.09,.07,.03,x+1.52,y,frontFace+.055);
   }else{
    for(let k=0;k<6;k++)facade("port",.12,.035,.024,x-.58+k*.21,y,frontFace+.038);
   }
   for(const px of [-.90,-.20,.50])instance("socket",.13,.047,.045,x+px,y,rearFace);
   for(const hx of [-1.6,1.6])instance("handle",.048,.047,.032,x+hx,y,rearFace-.055);
   if(slot.kind==="power")for(let k=0;k<6;k++)
    instance("copper",.38,Math.max(.045,h*.4),.035,x-1.25+k*.5,y,rearFace-.024);
   const records=[...movingFace,
    instance(moduleMaterials[slot.kind],3.39,Math.max(.05,h-.024),.22,x,y,z+1.25,id),
    instance("dark",.42,Math.max(.04,h-.055),.06,x-1.19,y,z+1.39,id),
    instance(slot.kind==="compute"?"green":"frame",.38,.065,.04,x+.98,y,z+1.39,id)
   ];
   slotGroups.set(id,{root,slotId:id,drawables:records,pick:click,rearPick:rearClick,height:h});
   slotPositions.set(id,{x,y,z:z+1.42});
   if(rack.kind!=="fabric")y+=h/2+.015;
  }
 }
 // Side-by-side racks still nearly touch; front-to-back service aisles open up.
 instance("floor",width+.70,.075,depth+.70,0,-.98,0);
 for(let row=0;row<countZ-1;row++){
  const middle=(row-(countZ-2)/2)*zPitch;
  instance("aisle",width+.12,.018,zPitch-DATA_CENTER_LAYOUT.rackDepth-.20,0,-.92,middle);
 }
 for(let row=0;row<countZ;row++){
  const z=(row-(countZ-1)/2)*zPitch;
  instance("frame",width+.24,.065,.065,0,8.87,z-1.36);
  instance("frame",width+.24,.065,.065,0,8.87,z+1.36);
  for(let col=0;col<countX;col++){
   const x=(col-(countX-1)/2)*xPitch;
   instance("frame",.07,.045,2.72,x,8.86,z);
  }
 }
 for(const [kind,records] of instanceData){
  const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),materials[kind],records.length);
  inst.name="DC_BATCH_"+kind;
  inst.castShadow=false;inst.receiveShadow=false;
  inst.frustumCulled=false;
  for(let i=0;i<records.length;i++){
   records[i].index=i;records[i].batch=inst;
   inst.setMatrixAt(i,matrixFor(records[i]));
  }
  inst.instanceMatrix.needsUpdate=true;
  group.add(inst);batches.push(inst);
 }
 group.add(cableGroup);
 let renderedCables=0;
 function clearCables(){
  for(const child of [...cableGroup.children]){cableGroup.remove(child);child.geometry.dispose();}
 }
 function cablePath(source,target,id){
  const from=slotPositions.get(source.slotId),to=slotPositions.get(target.slotId);
  if(!from||!to)return null;
  // Animated/pluggable conceptual run via the overhead ladder; no real routing.
  const n=Number(id.slice(1))||1,offset=(n%7)*.08;
  const y=8.96+offset;
  return new THREE.CatmullRomCurve3([
   new THREE.Vector3(from.x+.72,from.y,from.z+.03),
   new THREE.Vector3(from.x+.85,y-.7,from.z+.25),
   new THREE.Vector3(from.x,y,from.z-.12),
   new THREE.Vector3((from.x+to.x)/2,y+.12,(from.z+to.z)/2),
   new THREE.Vector3(to.x,y,to.z-.18),
   new THREE.Vector3(to.x-.45,y-.7,to.z+.20),
   new THREE.Vector3(to.x-.30,to.y,to.z+.08)
  ]);
 }
 function refresh(){
  // reset() replaces slot records; read live slot IDs on every refresh.
  const slotIndex=new Map(model.slots.map(s=>[s.id,s]));
  for(const [id,entry] of slotGroups){
   const slot=slotIndex.get(id);
   entry.pick.position.z=1.30+(slot.drawer?.82:0);
   entry.rearPick.position.z=-1.30;
   if(selectedSlot===id&&slotFrame)slotFrame.position.z=.035+(slot.drawer?.82:0);
   for(const record of entry.drawables){
    record.batch.setMatrixAt(record.index,matrixFor(record,slot.installed,slot.drawer));
    record.batch.instanceMatrix.needsUpdate=true;
   }
  }
  clearCables();renderedCables=0;
  const portIndex=new Map(model.ports.map(p=>[p.id,p]));
  for(const cable of model.cables){
   const from=portIndex.get(cable.source),to=portIndex.get(cable.target);
   if(!from||!to)continue;
   const curve=cablePath(from,to,cable.id);if(!curve)continue;
   const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.024,5,false),cableMaterials[cable.fabric]);
   mesh.name="SIMULATED_CABLE_"+cable.id;
   cableGroup.add(mesh);renderedCables++;
  }
 }
 refresh();
 function focusRack(id){
  if(id!==null&&!rackInfo.has(id))return false;
  selectedRack=id;
  rackOutline.visible=id!==null;
  if(id!==null){const point=rackCenters.get(id);rackOutline.position.set(point.x,3.63,point.z)}
  return true;
 }
 function rackPosition(id){const v=rackCenters.get(id);return v?{...v}:null}
 function createSlotSelectionFrame(part){
  const id=part.startsWith("DC / ")?part.slice(5):part;
  const entry=slotGroups.get(id);if(!entry)return null;
  if(slotFrame){slotFrame.removeFromParent();slotFrame.geometry.dispose();slotFrame.material.dispose();slotFrame=null}
  const geometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(3.54,Math.max(.055,entry.height-.007),2.37));
  slotFrame=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xe4bd69,depthTest:false,transparent:true,opacity:.97}));
  slotFrame.name="DENSE_DC_SELECTED_FULL_SERVER_BOX";slotFrame.renderOrder=86;
  slotFrame.position.z=.035+(model.slots.find(s=>s.id===id)?.drawer?.82:0);
  slotFrame.userData={kind:"full-chassis-slot",slotId:id,boxDepth:2.37,edgeCount:12};
  entry.root.add(slotFrame);selectedSlot=id;return slotFrame;
 }
 function clearSlotSelection(){selectedSlot=null;slotFrame=null}
 return {
  group,parts,pickTargets,refresh,slotGroups,focusRack,rackPosition,createSlotSelectionFrame,clearSlotSelection,
  diagnostics:()=>({
   scope:"DENSE_16_RACK_BROWSER_SIMULATION",visible:group.visible,
   gpuRacks:DATA_CENTER_RACKS.filter(r=>r.kind==="compute").length,
   networkRacks:DATA_CENTER_RACKS.filter(r=>r.kind==="fabric").length,
   rackCount:DATA_CENTER_RACKS.length,
   layout:{...DATA_CENTER_LAYOUT,clearanceX:Number((xPitch-DATA_CENTER_LAYOUT.rackWidth).toFixed(3)),
    clearanceZ:Number((zPitch-DATA_CENTER_LAYOUT.rackDepth).toFixed(3))},
   slotObjects:slotGroups.size,pickingVolumes:pickTargets.length,
   frontPickVolumes:slotGroups.size,rearPickVolumes:slotGroups.size,
   rearDetailCartridges:DATA_CENTER_RACKS.filter(r=>r.kind==="compute").length*4,
   liquidManifolds:DATA_CENTER_RACKS.filter(r=>r.kind==="compute").length*2,
   rearBusbarRails:DATA_CENTER_RACKS.filter(r=>r.kind==="compute").length*2,
   frontVentGrilles:slotGroups.size*6,serviceAisles:countZ-1,
   selectedRack,selectedSlot,selectedRackOutlined:rackOutline.visible,
   selectedSlotBoxOffset:slotFrame?.position.z??null,selectedSlotBoxDepth:slotFrame?.userData.boxDepth??null,
   instanceBatches:batches.length,instances:batches.reduce((n,b)=>n+b.count,0),
   drawnCables:renderedCables,selectedDrawers:model.slots.filter(s=>s.drawer).length,
   installed:model.stats().modulesInstalled,notOfficialCAD:true,
   physicalNetworkChanges:false,disclaimer:DATA_CENTER_DISCLAIMER
  })
 };
}
