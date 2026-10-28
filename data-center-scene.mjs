/**
 * Browser-only three-rack NVIDIA AI data center concept.
 * Two logical NVL72 racks and an illustrative network-fabric rack.
 * Not a manufacturer's installation CAD or a live cabling controller.
 */
import {FABRICS,DATA_CENTER_DISCLAIMER} from "./data-center-model.mjs";
export function createDataCenterConcept(THREE,model){
 const group=new THREE.Group(),parts=[],slotGroups=new Map(),cableGroup=new THREE.Group();
 group.name="UNOFFICIAL_NVIDIA_AI_DATACENTER";
 const m=(color,metal=.2,rough=.5)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
 const black=m("#10191d",.52,.4),frame=m("#445357",.74,.29),gold=m("#aa9671",.76,.32);
 const green=m("#9cc746",.23,.35),dark=m("#243037",.42,.36),blue=m("#36738a",.45,.38);
 const grey=m("#6a7473",.59,.33),empty=m("#0a1113",.18,.7);
 const matKinds={compute:gold,nvlink:dark,power:grey,tor:blue,ib:green,eth:blue,mgmt:grey};
 const matCable=Object.fromEntries(Object.entries(FABRICS).map(([k,v])=>[k,m(v.color,.2,.39)]));
 const box=(parent,w,h,d,material,x=0,y=0,z=0)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 };
 const nameCanvas=txt=>{
  const canvas=document.createElement("canvas");canvas.width=700;canvas.height=128;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#111c1b";ctx.fillRect(0,0,700,128);
  ctx.font="bold 50px Arial";ctx.fillStyle="#dcefbb";ctx.fillText(txt,22,76);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
 };
 function label(parent,text,x,y,z,w=2.75,h=.24){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),nameCanvas(text));
  mesh.position.set(x,y,z);parent.add(mesh);
 }
 const locations={A:-5.45,B:0,F:5.45},rackY=3.63;
 for(const rack of ["A","B","F"]){
  const root=new THREE.Group();root.position.set(locations[rack],0,0);group.add(root);
  box(root,3.95,8.55,2.25,black,0,rackY,0);
  box(root,3.65,8.12,.14,empty,0,rackY,1.12);
  for(const x of [-1.96,1.96])for(const z of [-1.2,1.2]){
   box(root,.10,8.74,.10,frame,x,rackY,z);
  }
  for(const y of [-.76,7.98])box(root,4.1,.17,2.5,frame,0,y,0);
  label(root,rack==="F"?"NETWORK FABRIC RACK":"NVL72 GPU RACK "+rack,0,7.85,1.23,3.25,.30);
  if(rack==="F"){
   for(let i=0;i<8;i++)box(root,3.28,.04,.10,frame,0,.55+i*.77,1.16);
  }
 }
 const byRack={A:model.slots.filter(s=>s.rack==="A"),B:model.slots.filter(s=>s.rack==="B"),F:model.slots.filter(s=>s.rack==="F")};
 const slotPosition=new Map();
 for(const rack of ["A","B"]){
  let y=-.49;
  for(const s of byRack[rack]){
   const height=s.kind==="power"?.44:.16;
   y+=height/2+.015;
   const localX=locations[rack],root=new THREE.Group();
   root.position.set(localX,y,0);root.userData.part="DC / "+s.id;
   const backing=box(root,3.5,height-.018,.22,empty,0,0,1.10);
   const drawer=new THREE.Group();root.add(drawer);
   const front=box(drawer,3.39,height-.032,.23,matKinds[s.kind],0,0,1.25);
   box(drawer,.55,Math.max(.06,height-.06),.24,dark,-1.13,0,1.40);
   for(let j=0;j<3;j++)box(drawer,.13,.03,.03,black,.55+j*.22,0,1.40);
   if(s.kind==="compute")for(let j=0;j<4;j++)box(drawer,.08,.045,.04,green,1.03+j*.15,0,1.4);
   drawer.userData.part="DC / "+s.id;
   group.add(root);parts.push(root);
   slotGroups.set(s.id,{root,drawer,front,backing,slot:s});
   slotPosition.set(s.id,{x:localX,y,z:1.4});
   y+=height/2+.015;
  }
 }
 const positionsF=[5.83,4.50,3.18];
 byRack.F.forEach((s,i)=>{
  const y=positionsF[i],root=new THREE.Group();
  root.position.set(locations.F,y,0);root.userData.part="DC / "+s.id;
  const backing=box(root,3.54,.50,.29,empty,0,0,1.10);
  const drawer=new THREE.Group();root.add(drawer);drawer.userData.part="DC / "+s.id;
  const front=box(drawer,3.43,.46,.36,matKinds[s.kind],0,0,1.28);
  for(let j=0;j<9;j++)box(drawer,.15,.08,.05,black,-1.23+j*.30,0,1.5);
  group.add(root);parts.push(root);
  slotGroups.set(s.id,{root,drawer,front,backing,slot:s});
  slotPosition.set(s.id,{x:locations.F,y,z:1.5});
  label(group,s.kind==="ib"?"INFINIBAND FABRIC":s.kind==="eth"?"ETHERNET / STORAGE":"MANAGEMENT SWITCH",locations.F,y+.28,1.70,2.52,.19);
 });
 // Static infrastructure: schematic overhead cable ladder and concrete floor.
 box(group,19.3,.07,4.8,dark,0,-.98,0);
 for(const z of [-1.64,1.78]){
  box(group,18.9,.055,.08,frame,0,8.85,z);
  for(let x=-8.7;x<=8.7;x+=.95)box(group,.07,.045,3.43,frame,x,8.84,.07);
 }
 group.add(cableGroup);
 let renderedCables=0;
 function clearCables(){
  for(const child of [...cableGroup.children]){
   cableGroup.remove(child);child.geometry.dispose();
  }
 }
 function cablePath(source,target,id){
  const [fromRack]=source.slotId.split("-");
  const from=slotPosition.get(source.slotId),to=slotPosition.get(target.slotId);
  if(!from||!to)return null;
  const x1=from.x+1.10,x2=to.x-1.05;
  const bend=2.05+(Number(id.slice(1))%5)*.07;
  return new THREE.CatmullRomCurve3([
   new THREE.Vector3(x1,from.y,1.52),
   new THREE.Vector3(x1+.52,from.y,bend),
   new THREE.Vector3((x1+x2)/2,Math.max(from.y,to.y)+.23,bend+.11),
   new THREE.Vector3(x2-.5,to.y,bend),
   new THREE.Vector3(x2,to.y,1.57)
  ]);
 }
 function refresh(){
  for(const [id,mesh] of slotGroups){
   const s=model.slots.find(s=>s.id===id);
   mesh.drawer.visible=s.installed;
   mesh.drawer.position.z=s.drawer?.82:0;
   mesh.backing.visible=true;
  }
  clearCables();
  renderedCables=0;
  for(const c of model.cables){
   const source=model.ports.find(p=>p.id===c.source),target=model.ports.find(p=>p.id===c.target);
   if(!source||!target)continue;
   const curve=cablePath(source,target,c.id);
   if(!curve)continue;
   const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,22,.026,6,false),matCable[c.fabric]);
   tube.name="SIM_CABLE_"+c.id;
   cableGroup.add(tube);renderedCables++;
  }
 }
 refresh();
 return {group,parts,refresh,slotGroups,
  diagnostics:()=>({scope:"THREE_RACK_BROWSER_SIMULATION",visible:group.visible,
   gpuRacks:2,networkRacks:1,slotObjects:slotGroups.size,
   drawnCables:renderedCables,selectedDrawers:model.slots.filter(s=>s.drawer).length,
   installed:model.stats().modulesInstalled,notOfficialCAD:true,
   physicalNetworkChanges:false,disclaimer:DATA_CENTER_DISCLAIMER})
 };
}
