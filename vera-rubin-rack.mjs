/**
 * NVIDIA Vera Rubin NVL72 – unofficial high-detail WebGL architectural study.
 *
 * Engineering boundaries: official public tray counts and function; entirely
 * illustrative mechanical geometry, cable route, rack slot order and dimensions.
 * This is NOT NVIDIA production CAD, thermal engineering or an installation plan.
 */
import {RACK_SPEC,validateRackArchitecture} from "./nvidia-rack-spec.mjs";

export function createRackConcept(THREE){
 const group=new THREE.Group(),parts=[],trays=[],coolingParts=[],pickTargets=[];
 group.name="UNOFFICIAL_VERA_RUBIN_NVL72_RACK";
 const mat=(c,metalness=.25,roughness=.43)=>new THREE.MeshStandardMaterial({color:c,metalness,roughness});
 const black=mat("#0c1012",.48,.47),chassis=mat("#1e2526",.72,.3);
 const iron=mat("#586363",.83,.28),darkPort=mat("#070c10",.24,.59);
 const titanium=mat("#949a92",.8,.28),champagne=mat("#b7a47d",.78,.25);
 const gold=mat("#ddc597",.78,.2),bronze=mat("#635742",.75,.29);
 const switchMat=mat("#4c493d",.78,.25),torMat=mat("#29323b",.69,.30);
 const powerMat=mat("#737b78",.65,.31),coolantMat=mat("#3a7179",.65,.23);
 const ledG=mat("#a8cf6d",.15,.22),ledB=mat("#79b9d0",.1,.25);
 const labelMats=new Map(),featureInstances=[];
 const put=(parent,w,h,d,material,x,y,z,name)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);if(name)m.name=name;
  m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 function labelTexture(head,sub,tint){
  const key=head+"/"+sub;
  if(labelMats.has(key))return labelMats.get(key);
  const cv=document.createElement("canvas");cv.width=640;cv.height=110;
  const ctx=cv.getContext("2d");
  ctx.fillStyle="#202725";ctx.fillRect(0,0,640,110);
  ctx.fillStyle=tint;ctx.font="bold 38px Arial";ctx.fillText(head,17,49);
  ctx.fillStyle="#a4b0a8";ctx.font="23px Arial";ctx.fillText(sub,18,89);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  labelMats.set(key,m);return m;
 }
 const labels={
  compute:labelTexture("RUBIN COMPUTE","4 GPU / 2 VERA CPU","#e9d6a8"),
  nvlink:labelTexture("NVLINK 6","4 x SWITCH ASIC","#d9c79d"),
  tor:labelTexture("TOR MANAGEMENT","ETHERNET / MGMT","#b4c7d0"),
  power:labelTexture("POWER / 54 VDC","3RU / CONCEPT","#d6dbd5")
 };
 const labelTop=labelTexture("VERA RUBIN NVL72","UNOFFICIAL WEBGL STUDY","#e9d6a6");
 const rows=[
  ...Array.from({length:RACK_SPEC.powerShelves},()=>({kind:"power"})),
  ...Array.from({length:8},()=>({kind:"compute"})),
  ...Array.from({length:RACK_SPEC.switchTrays},()=>({kind:"nvlink"})),
  ...Array.from({length:10},()=>({kind:"compute"})),
  ...Array.from({length:RACK_SPEC.managementTorSwitches},()=>({kind:"tor"}))
 ];
 const typeIndex={compute:0,nvlink:0,power:0,tor:0};
 const positionsGPU=[],positionsCPU=[],positionsSwitch=[];
 const grille=[],grilleCompute=[],fasteners=[],portCovers=[],goldFins=[],statusLights=[];
 let rackY=-.82;
 for(let i=0;i<rows.length;i++){
  const {kind}=rows[i],number=++typeIndex[kind];
  const trayHeight=kind==="power"?.57:.20;
  const y=rackY+trayHeight*.5;rackY+=trayHeight+.02;
  const tray=new THREE.Group();tray.position.y=y;
  tray.name="RACK_"+kind.toUpperCase()+"_"+String(number).padStart(2,"0");
  tray.userData.part="NVIDIA / NVL72 "+(kind==="compute"?"COMPUTE TRAY":kind==="nvlink"?"NVLINK SWITCH TRAY":kind==="tor"?"TOR SWITCH":"POWER SHELF")+" "+String(number).padStart(2,"0");
  group.add(tray);parts.push(tray);
  trays.push({kind,number,y,height:trayHeight,part:tray.userData.part});
  // A dedicated whole-device click volume, including front, side and rear.
  // Use an isolated layer excluded from the camera: raycastable, never drawn.
  // This prevents tiny instanced LEDs / cabinet surfaces from stealing clicks.
  const clickBody=new THREE.Mesh(
   new THREE.BoxGeometry(3.96,trayHeight-.004,2.39),
   new THREE.MeshBasicMaterial({visible:false}));
  clickBody.position.z=.035;clickBody.layers.set(29);
  clickBody.name="PICK_WHOLE_SERVER_"+tray.name;
  clickBody.userData.part=tray.userData.part;
  tray.add(clickBody);pickTargets.push(clickBody);
  // Rack drawer; gold anodized compute front and vent metal contrast with black rails.
  put(tray,3.91,trayHeight-.015,1.90,black,0,0,-.03);
  put(tray,3.85,trayHeight-.024,.18,
    kind==="compute"?champagne:kind==="nvlink"?switchMat:kind==="tor"?torMat:powerMat,
    0,0,1.025);
  put(tray,3.84,.020,.075,kind==="compute"?gold:iron,0,trayHeight*.42,1.120);
  put(tray,.044,Math.min(trayHeight-.03,.19),.06,iron,-1.83,0,1.155);
  put(tray,.044,Math.min(trayHeight-.03,.19),.06,iron,1.83,0,1.155);
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.20,Math.min(.155,trayHeight-.03)),labels[kind]);
  tag.position.set(-.77,0,1.132);tray.add(tag);
  for(let j=0;j<2;j++)fasteners.push([-1.78+j*3.55,y,1.190]);
  if(kind==="compute"){
   // A denser grille and black double NIC port arrangement, seen in product photography.
   for(let j=0;j<12;j++)grilleCompute.push([-.06+j*.105,y,1.148]);
   for(let j=0;j<2;j++){
    portCovers.push([.24+j*.26,y,1.161]);
    statusLights.push([1.49+j*.12,y,1.181]);
   }
   for(let k=0;k<4;k++)positionsGPU.push([.47+k*.23,y,1.167]);
   for(let k=0;k<2;k++)positionsCPU.push([1.42+k*.21,y,1.167]);
  }else if(kind==="nvlink"){
   for(let j=0;j<11;j++)grille.push([-.01+j*.13,y,1.16]);
   for(let k=0;k<4;k++)positionsSwitch.push([.68+k*.23,y,1.178]);
  }else if(kind==="power"){
   // PSU ventilation: a stylized six-column honeycomb field, not real PSU geometry.
   for(let row=0;row<4;row++)for(let col=0;col<18;col++){
    grille.push([-.12+col*.09,y-.17+row*.105,1.16]);
   }
   for(let k=0;k<6;k++)goldFins.push([.65+k*.20,y,1.17]);
  }else{
   for(let j=0;j<8;j++)grille.push([.04+j*.15,y,1.16]);
  }
 }
 // Batch repetitive front details, avoiding a large number of WebGL draw calls.
 function instances(positions,geometry,material,name){
  if(!positions.length)return;
  const im=new THREE.InstancedMesh(geometry,material,positions.length),o=new THREE.Object3D();
  positions.forEach(([x,y,z],i)=>{
   o.position.set(x,y,z);o.updateMatrix();im.setMatrixAt(i,o.matrix);
  });
  im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.name=name;
  group.add(im);featureInstances.push(im);
 }
 instances(grilleCompute,new THREE.BoxGeometry(.060,.060,.038),bronze,"BRASS_COMPUTE_VENTS");
 instances(grille,new THREE.BoxGeometry(.055,.050,.040),darkPort,"RACK_PERFORATED_GRILLES");
 instances(fasteners,new THREE.CylinderGeometry(.022,.022,.022,8).rotateX(Math.PI/2),titanium,"TRAY_FASTENERS");
 instances(portCovers,new THREE.BoxGeometry(.19,.076,.045),darkPort,"DUAL_NIC_PORTS_ILLUSTRATIVE");
 instances(positionsGPU,new THREE.BoxGeometry(.13,.077,.040),gold,"GPU_STATUS_INDICATORS_72");
 instances(positionsCPU,new THREE.BoxGeometry(.11,.079,.040),ledB,"VERA_CPU_STATUS_INDICATORS_36");
 instances(positionsSwitch,new THREE.BoxGeometry(.12,.077,.048),gold,"NVSWITCH_INDICATORS_36");
 instances(goldFins,new THREE.BoxGeometry(.065,.078,.050),bronze,"POWER_SHELF_RELEASES");
 instances(statusLights,new THREE.BoxGeometry(.036,.035,.024),ledG,"COMPUTE_STATUS_LEDS");
 // Tall, black MGX-inspired enclosure with champagne-colored metal blades inside.
 for(const x of [-2.14,2.14]){
  for(const z of [-1.13,1.21]){
   put(group,.14,9.37,.14,chassis,x,3.64,z,"ENCL_CABINET_POST");
   put(group,.045,9.0,.06,iron,x*.94,3.64,z>0?1.19:-1.08);
  }
  put(group,.27,9.25,2.23,chassis,x,3.64,.03);
  for(let k=0;k<15;k++)put(group,.025,.045,.42,iron,x, .02+k*.50,.87);
 }
 for(const y of [-1.03,8.29]){
  put(group,4.45,.16,2.53,chassis,0,y,0,"CABINET_CROSSBAR");
 }
 put(group,4.13,9.11,.055,black,0,3.64,-1.14,"REAR_CHASSIS_PANEL");
 // Restore a slim, true 3D rectangular rack frame with all twelve edges.
 // Unlike the old selection BoxHelper, this is anchored to fixed cabinet
 // dimensions, never computed from unrelated tray or rear assemblies.
 const cabinetOutlineBox=new THREE.BoxGeometry(4.55,9.50,2.53);
 const cabinetOutlineGeometry=new THREE.EdgesGeometry(cabinetOutlineBox);
 cabinetOutlineBox.dispose();
 const cabinetOutline=new THREE.LineSegments(cabinetOutlineGeometry,
  new THREE.LineBasicMaterial({color:0xbca478,transparent:true,opacity:.8,depthTest:true,depthWrite:false}));
 cabinetOutline.name="CABINET_3D_RECTANGULAR_GOLD_FRAME";
 cabinetOutline.position.set(0,3.64,.02);
 group.add(cabinetOutline);
 // Dark inner ceiling and base, with prominent perforated fan/switch sections.
 for(const y of [7.99,.16]){
  put(group,3.78,.28,.27,black,0,y,1.14,"BLACK_FAN_GRILLE");
 }
 // Independently selectable rear infrastructure layers. Geometries are
 // conceptual, not verified routing, voltage clearances or OEM service CAD.
 const rearCooling=new THREE.Group(),rearNvlink=new THREE.Group(),rearPower=new THREE.Group();
 rearCooling.name="CONCEPT_REAR_COOLANT";rearNvlink.name="CONCEPT_REAR_NVLINK";rearPower.name="CONCEPT_REAR_54V_BUSBAR";
 group.add(rearCooling,rearNvlink,rearPower);
 let rearFocus="all";
 function setRearSystemFocus(next){
  if(!["all","nvlink","cooling","power"].includes(next))return false;
  rearFocus=next;
  for(const [kind,obj] of [["nvlink",rearNvlink],["cooling",rearCooling],["power",rearPower]])obj.visible=next==="all"||next===kind;
  return true;
 }
 // Rear manifolds, NVLink spine and cable cartridge silhouette – artistic.
 const hose=mat("#252e2e",.22,.57),connector=mat("#989c8e",.85,.25);
 for(const x of [-2.29,2.29]){
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.069,.069,8.88,12),coolantMat);
  pipe.position.set(x,3.63,-.77);rearCooling.add(pipe);coolingParts.push(pipe);
  for(const y of [-.57,2.12,4.76,7.96]){
   const fitting=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.22,12),connector);
   fitting.position.set(x,y,-.77);rearCooling.add(fitting);coolingParts.push(fitting);
  }
 }
 // Functional-looking cable cartridges: four broad vertical rails and bundled
 // radial link cords. These are not NVIDIA's real copper connection map.
 for(const x of [-1.37,-.46,.46,1.37]){
  put(rearNvlink,.24,8.68,.22,bronze,x,3.65,-1.28,"BACKPLANE_CARTRIDGE");
  for(let j=0;j<16;j++){
   const y=-.18+j*.48;
   put(rearNvlink,.14,.050,.04,connector,x,y,-1.43);
  }
 }
 const cableCurves=[];
 for(let j=0;j<14;j++){
  const yy=.22+j*.51;
  for(let k=0;k<2;k++){
   const x1=k===0?-1.6:1.6,x2=k===0?-.46:.46;
   cableCurves.push(new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1,yy,-1.27),
    new THREE.Vector3(x1*.9,yy+.12,-1.48),
    new THREE.Vector3(x2,yy+.11,-1.48)
   ]));
  }
 }
 const cableMat=mat("#222b2c",.35,.48);
 for(const curve of cableCurves){
  const cord=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.023,5,false),cableMat);
  rearNvlink.add(cord);coolingParts.push(cord);
 }
 // Schematic dual 54 VDC busbar rails; exact OEM geometry and creepage are unknown.
 // These shapes DO NOT represent electrical wiring or installation details.
 const busbar=mat("#9d754c",.85,.25),busbarInsulator=mat("#191e23",.35,.47);
 for(const x of [-1.90,1.90]){
  put(rearPower,.085,8.65,.085,busbar,x,3.65,-1.40,"CONCEPT_DC_BUSBAR_RAIL");
  for(const y of [-.51,.08,.67,1.26]){
   put(rearPower,.23,.11,.11,busbarInsulator,x,y,-1.47,"BUS_BAR_INSULATOR_CONCEPT");
   put(rearPower,.13,.035,.075,busbar,x,y,-1.54,"POWER_SHELF_TAP_CONCEPT");
  }
 }
 // Represent paired quick-disconnect positions at intervals, NOT pipe routing.
 for(let j=0;j<9;j++){
  const y=.46+j*.78;
  for(const x of [-2.29,2.29]){
   const port=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.13,12).rotateZ(Math.PI/2),connector);
   port.position.set(x+(x>0?-.13:.13),y,-.77);
   rearCooling.add(port);coolingParts.push(port);
  }
 }
 // Studio branding: deliberately say UNOFFICIAL, rather than impersonating
 // NVIDIA's exact logos or official product label.
 const header=new THREE.Mesh(new THREE.PlaneGeometry(3.83,.28),labelTop);
 header.position.set(0,8.06,1.25);group.add(header);

 // Single shared service inspection assembly: only the currently selected
 // tray is drawn with internal silhouettes, keeping GPU cost bounded.
 const serviceAssembly=new THREE.Group();
 serviceAssembly.name="ILLUSTRATIVE_SERVICE_INTERIOR_NOT_NVIDIA_CAD";
 let serviced=null,serviceConfig=null;
 function clearService(){
  if(serviced)serviced.position.z=0;
  serviceAssembly.removeFromParent();
  for(const child of [...serviceAssembly.children]){
   serviceAssembly.remove(child);
   if(child.geometry)child.geometry.dispose();
  }
  serviced=null;serviceConfig=null;
 }
 function openService(part){
  const index=trays.findIndex(item=>item.part===part);
  if(index<0)return false;
  clearService();
  const tray=trays[index],target=parts[index];
  target.position.z=1.72;
  target.add(serviceAssembly);
  const h=tray.height,top=h*.50+.11;
  const counts={gpu:0,cpu:0,nvSwitch:0,psu:0,storage:0};
  const body=put(serviceAssembly,3.42,.034,1.32,iron,0,top-.055,-.10,"CONCEPTUAL_INTERIOR_CARRIER");
  body.castShadow=false;
  function chip(x,z,w,d,material,name){
   return put(serviceAssembly,w,.095,d,material,x,top+.033,z,name);
  }
  if(tray.kind==="compute"){
   // Two schematic superchips per tray: 2 GPU + 1 Vera CPU each.
   for(const cx of [-.83,.83]){
    chip(cx,-.09,1.43,.92,chassis,"TWO_SUPERCHIPS_PER_COMPUTE_TRAY");
    for(const delta of [-.36,.36]){
     chip(cx+delta,.06,.38,.42,gold,"RUBIN_GPU_CONCEPT");counts.gpu++;
    }
    chip(cx,-.43,.52,.28,ledB,"VERA_CPU_CONCEPT");counts.cpu++;
   }
   for(let i=0;i<5;i++){
    chip(-1.36+i*.68,.64,.37,.17,darkPort,"NVME_BAYS_CONCEPT");counts.storage++;
   }
  }else if(tray.kind==="nvlink"){
   for(const x of [-1.16,-.39,.39,1.16]){
    chip(x,-.12,.55,.82,switchMat,"NVSWITCH6_ASIC_CONCEPT");counts.nvSwitch++;
   }
  }else if(tray.kind==="power"){
   for(let i=0;i<6;i++){
    chip(-1.38+i*.55,-.09,.47,.93,powerMat,"PSU_CONCEPT");counts.psu++;
   }
  }else{
   for(let i=0;i<4;i++)chip(-1.13+i*.77,0,.53,.89,torMat,"TOR_NETWORK_MODULE_CONCEPT");
  }
  serviced=target;
  serviceConfig={part,kind:tray.kind,counts,projectionOffsetZ:1.72,
   source:"PUBLIC_PRODUCT_ARCHITECTURE_WITH_UNOFFICIAL_MECHANICAL_RENDER",
   maintenanceInstructions:false};
  return true;
 }
 function getServiceState(){
  return serviceConfig?{open:true,...serviceConfig}:{open:false,part:null,kind:null,
   counts:{gpu:0,cpu:0,nvSwitch:0,psu:0,storage:0},maintenanceInstructions:false};
 }

 // A full-chassis 3D cuboid highlights the entire selected server/tray,
 // not just a shallow faceplate; its dimensions are fixed independently of
 // nested meshes and cannot balloon into the entire cabinet.
 function createTraySelectionFrame(part){
  const index=trays.findIndex(t=>t.part===part);
  if(index<0)return null;
  const w=3.98,h=Math.max(.16,trays[index].height-.008),d=2.39;
  const box=new THREE.BoxGeometry(w,h,d);
  const geometry=new THREE.EdgesGeometry(box);box.dispose();
  const material=new THREE.LineBasicMaterial({color:0xe1bb79,transparent:true,opacity:.96,depthTest:false,depthWrite:false});
  const frame=new THREE.LineSegments(geometry,material);
  frame.position.z=.035; // x/y/z tightly match the full chassis pick volume.
  frame.name="RACK_WHOLE_SERVER_3D_CUBOID_SELECTION";frame.renderOrder=60;
  frame.userData={selectionType:"rack-tray-cuboid",part,faceWidth:w,faceHeight:h,faceDepth:d,edgeCount:12};
  parts[index].add(frame); // Follow conceptual drawer extension.
  return frame;
 }

 return {group,parts,trays,pickTargets,coolingParts,featureInstances,openService,clearService,getServiceState,setRearSystemFocus,createTraySelectionFrame,
  diagnostics:()=>({
   scope:"UNOFFICIAL_RACK_ARCHITECTURE_ONLY",visible:group.visible,
   counts:validateRackArchitecture(),renderedTrays:trays.length,
   racksPowerShelves:typeIndex.power,powerShelfVisualHeightRatio:Number((.57/.20).toFixed(2)),
   gpuIndicators:positionsGPU.length,cpuIndicators:positionsCPU.length,
   nvSwitchIndicators:positionsSwitch.length,typeCounts:{...typeIndex},
   facade:"champagne-metallic-with-dense-grilles",
   cabinetFrame:{kind:"3d-cuboid",edgeCount:12,width:4.55,height:9.50,depth:2.53,visible:cabinetOutline.visible},
   pickVolumes:pickTargets.length,pickVolumeLayer:29,
   rearComponents:coolingParts.length,instancedDetails:featureInstances.length,
   rearCableCartridges:4,rearManifoldPipes:2,rearBusbarRails:2,rearFocus,
   rearVisible:{nvlink:rearNvlink.visible,cooling:rearCooling.visible,power:rearPower.visible},
   serviceDrawerOpen:!!serviced,serviceElementsDrawn:serviceAssembly.children.length,
   notActualRackGeometry:true,manufacturingApproved:false
  })};
}