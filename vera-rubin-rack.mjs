/**
 * Unofficial rack-scale, service-tray architectural model of NVIDIA Vera Rubin
 * NVL72. Only component counts match publicly documented NVIDIA configuration.
 * Position, rack slot ordering, cooling path and dimensions are purely artistic.
 */
import {RACK_SPEC,validateRackArchitecture} from "./nvidia-rack-spec.mjs";

export function createRackConcept(THREE){
 const group=new THREE.Group(),parts=[],trays=[],coolingParts=[];
 group.name="UNOFFICIAL_VERA_RUBIN_NVL72_RACK";
 const material=(c,metal=.2,rough=.5)=>new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
 const chassis=material("#202a2e",.66,.34),dark=material("#0b1317",.20,.58);
 const silver=material("#adb9b4",.73,.30),black=material("#10191b",.27,.49);
 const gpuColor=material("#88c63b",.48,.25),cpuColor=material("#82bcdb",.48,.33);
 const linkColor=material("#c6b17c",.55,.3),powerColor=material("#a6b5ba",.61,.33);
 const labelMats=new Map();
 const put=(parent,w,h,d,mat,x,y,z,name)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);if(name)m.name=name;
  m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 function labelTexture(head,sub,tint){
  const key=head+"/"+sub;if(labelMats.has(key))return labelMats.get(key);
  const cv=document.createElement("canvas");cv.width=512;cv.height=90;
  const ctx=cv.getContext("2d");ctx.fillStyle="#101c1c";ctx.fillRect(0,0,512,90);
  ctx.fillStyle=tint;ctx.font="bold 31px Arial";ctx.fillText(head,20,37);
  ctx.fillStyle="#9eae9f";ctx.font="17px Arial";ctx.fillText(sub,21,69);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  labelMats.set(key,mat);return mat;
 }
 const rowLabels={
  compute:labelTexture("RUBIN / COMPUTE","4 GPU   +   2 VERA CPU","#a9e65f"),
  nvlink:labelTexture("NVLINK 6 / SWITCH","4 NVSWITCH ASICs","#dfc58c"),
  tor:labelTexture("TOP OF RACK","MANAGEMENT SWITCH","#9ac6d7"),
  power:labelTexture("POWER SUPPLY","ILLUSTRATIVE SHELF","#bdc6c9")
 };
 // The slot order is NOT a published hardware placement drawing.
 const rows=[
  ...Array.from({length:2},()=>({kind:"power"})),
  ...Array.from({length:9},()=>({kind:"compute"})),
  ...Array.from({length:9},()=>({kind:"nvlink"})),
  ...Array.from({length:9},()=>({kind:"compute"})),
  ...Array.from({length:2},()=>({kind:"tor"}))
 ];
 const colorByType={compute:chassis,nvlink:material("#44412c",.65,.32),
  tor:material("#263943",.65,.29),power:powerColor};
 const typeIndex={compute:0,nvlink:0,power:0,tor:0};
 const positionsGPU=[],positionsCPU=[],positionsSwitch=[];
 for(let i=0;i<rows.length;i++){
  const {kind}=rows[i],number=++typeIndex[kind];
  const y=-.84+(i+.5)*.29;
  const tray=new THREE.Group();tray.position.y=y;
  tray.userData.part="NVIDIA / NVL72 "+(kind==="compute"?"COMPUTE TRAY":kind==="nvlink"?"NVLINK SWITCH TRAY":kind==="tor"?"TOR SWITCH":"POWER SHELF")+" "+String(number).padStart(2,"0");
  tray.name="RACK_"+kind.toUpperCase()+"_"+String(number).padStart(2,"0");
  group.add(tray);parts.push(tray);
  trays.push({kind,number,y,part:tray.userData.part});
  put(tray,3.92,.25,1.92,black,0,0,-.04);
  put(tray,3.90,.226,.23,colorByType[kind],0,0,1.00);
  put(tray,3.85,.026,.08,silver,0,.13,1.06);
  // Matching front labels are shared textures, not a separate unique draw per tray.
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.72,.205),rowLabels[kind]);
  tag.position.set(-.92,0,1.133);tray.add(tag);
  put(tray,.055,.18,.055,silver,-1.84,0,1.136);
  put(tray,.055,.18,.055,silver,1.84,0,1.136);
  if(kind==="compute"){
   for(let k=0;k<4;k++)positionsGPU.push([.47+k*.23,y,1.144]);
   for(let k=0;k<2;k++)positionsCPU.push([1.42+k*.21,y,1.144]);
  }else if(kind==="nvlink"){
   for(let k=0;k<4;k++)positionsSwitch.push([.68+k*.23,y,1.144]);
  }
 }
 function installIndicators(positions,color,width=.14){
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(width,.083,.045),color,positions.length);
  const o=new THREE.Object3D();
  positions.forEach(([x,y,z],i)=>{o.position.set(x,y,z);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);return mesh;
 }
 installIndicators(positionsGPU,gpuColor);
 installIndicators(positionsCPU,cpuColor,.12);
 installIndicators(positionsSwitch,linkColor);
 // Enclosure posts, service frames, and back panel: design study, not measured.
 for(const x of [-2.05,2.05]){
  for(const z of [-1.04,1.17])put(group,.14,9.35,.13,silver,x,3.66,z);
 }
 for(const y of [-.99,8.30]){
  put(group,4.31,.13,2.34,chassis,0,y,.05);
 }
 put(group,4.10,9.1,.07,black,0,3.66,-1.12);
 for(const x of [-2.20,2.20]){
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.078,.078,8.77,12),material("#478c97",.74,.25));
  pipe.position.set(x,3.67,-.76);group.add(pipe);coolingParts.push(pipe);
  const inlet=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.25,12),silver);
  inlet.position.set(x,8.22,-.76);group.add(inlet);coolingParts.push(inlet);
 }
 const rearSpine=put(group,.19,8.64,.20,linkColor,0,3.68,-1.20,"ILLUSTRATIVE_NVLINK_SPINE");coolingParts.push(rearSpine);
 // Label above rack: distinguish study from genuine NVIDIA rack CAD.
 const header=new THREE.Mesh(new THREE.PlaneGeometry(3.82,.27),
  labelTexture("VERA RUBIN NVL72","UNOFFICIAL RACK STUDY","#cef29a"));
 header.position.set(0,8.23,1.20);group.add(header);
 return {group,parts,trays,coolingParts,
  diagnostics:()=>({
   scope:"UNOFFICIAL_RACK_ARCHITECTURE_ONLY",
   visible:group.visible,
   counts:validateRackArchitecture(),
   renderedTrays:trays.length,
   gpuIndicators:positionsGPU.length,
   cpuIndicators:positionsCPU.length,
   nvSwitchIndicators:positionsSwitch.length,
   typeCounts:{...typeIndex},
   notActualRackGeometry:true,
   manufacturingApproved:false
  })};
}
