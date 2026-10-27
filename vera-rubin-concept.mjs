/**
 * Unofficial Vera Rubin Superchip architectural visualisation.
 * NOT mechanically accurate; no netlist, board layout or manufacturing data.
 * Architecture follows NVIDIA public docs: two Rubin GPU + one Vera CPU.
 */
export function createRubinConcept(THREE){
 const group=new THREE.Group(),assemblies=[],parts=[];
 group.name="UNOFFICIAL_VERA_RUBIN_SUPERCHIP_CONCEPT";
 const mat=(color,metalness=.2,roughness=.55)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const dark=mat("#101b19",.18,.47),green=mat("#213e27",.22,.5),edge=mat("#a5b88d",.67,.37);
 const graphite=mat("#212528",.44,.32),black=mat("#101315",.19,.6),silver=mat("#bec7bc",.73,.3);
 const gold=mat("#ceb88b",.78,.33),emerald=mat("#79b916",.34,.37),memory=mat("#242c30",.25,.38);
 function box(parent,w,h,d,material,x=0,y=0,z=0){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function label(parent,x,y,z,w,d,text,sub,color="#e9f6d8"){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=196;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#151b18";ctx.fillRect(0,0,512,196);
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle=color;ctx.font="bold 43px Arial";ctx.fillText(text,256,76);
  ctx.fillStyle="#97b68b";ctx.font="bold 19px Arial";ctx.fillText(sub,256,130);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({map:texture,transparent:false,side:THREE.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);
 }
 const base=new THREE.Group();group.add(base);
 box(base,11.5,.24,7.0,dark,0,-.14,0);
 box(base,11.15,.04,6.73,green,0,.01,0);
 box(base,11.55,.045,7.02,edge,0,-.19,0);
 // Mechanical support/heat-spreader structure is visual-only, not a reproduced PCB.
 for(const x of [-5.46,5.46]){
  box(base,.11,.16,6.47,silver,x,.12,0);
  for(let z=-2.75;z<=2.75;z+=.55)box(base,.25,.09,.18,graphite,x,.26,z);
 }
 for(const z of [-3.26,3.26])box(base,10.9,.18,.13,graphite,0,.14,z);
 // Reference interconnect bands: NOT actual routed copper or physical NVLink traces.
 for(const z of [-.48,-.17,.14,.45]){
  box(base,8.5,.019,.031,emerald,0,.063,z);
 }
 for(const x of [-2.55,2.55]){
  for(let k=0;k<10;k++){
   const z=-2.66+k*.50;
   box(base,.11,.035,.19,gold,x+Math.sin(k)*.35,.09,z);
  }
 }
 const makePackage=(name,short,subtitle,x,z,w,d,kind)=>{
  const holder=new THREE.Group();holder.position.set(x,0,z);group.add(holder);
  holder.userData.part=name;parts.push(holder);assemblies.push({group:holder,x,z});
  box(holder,w+.28,.075,d+.25,edge,0,.14,0);
  box(holder,w+.10,.15,d+.10,graphite,0,.25,0);
  const pkg=box(holder,w,.29,d,black,0,.44,0);pkg.userData.part=name;
  const cap=box(holder,w-.12,.025,d-.12,kind==="cpu"?silver:mat("#272f2b",.23,.52),0,.602,0);
  cap.userData.part=name;
  label(holder,0,.624,0,Math.min(w-.24,2.0),Math.min(d-.3,1.1),short,subtitle,kind==="cpu"?"#273d29":"#a8e33f");
  return holder;
 };
 makePackage("NVIDIA / RUBIN GPU A","RUBIN","GPU / NVFP4", -3.00,-.16,2.10,2.20,"gpu");
 makePackage("NVIDIA / RUBIN GPU B","RUBIN","GPU / NVFP4", 3.00,-.16,2.10,2.20,"gpu");
 makePackage("NVIDIA / VERA CPU","VERA","88 OLYMPUS CORES",0,1.98,2.28,1.72,"cpu");
 // The HBM4 packages are intentionally illustrative; positions and chip counts
 // are NOT sourced from a physical NVIDIA compute board drawing.
 for(const gx of [-3,3]){
  for(const dx of [-1.48,1.48]){
   for(let z of [-1.32,-.10,1.12]){
    const x=gx+dx;
    if(Math.abs(x)>5.25)continue;
    const a=new THREE.Group();a.position.set(x,0,z);group.add(a);
    a.userData.part="NVIDIA / HBM4 MEMORY";parts.push(a);
    assemblies.push({group:a,x,z});
    box(a,.70,.085,.95,gold,0,.18,0);
    box(a,.65,.26,.88,memory,0,.355,0);
    label(a,0,.495,0,.55,.67,"HBM4","MEMORY","#d3e8bf");
   }
  }
 }
 // Stylized power-delivery and high-speed interconnect interfaces.
 for(const z of [-2.95,2.91]){
  for(let x=-4.6;x<=4.6;x+=.44){
   box(base,.18,.12,.27,silver,x,.19,z);
   box(base,.11,.11,.18,black,x,.26,z);
  }
 }
 for(const x of [-4.93,4.93]){
  for(let z=-2.55;z<=2.50;z+=.28){
   box(base,.22,.12,.08,gold,x,.21,z);
  }
 }
 // Banner etched into the assembly: visibly marked non-official reference.
 label(base,0,.095,-2.63,3.4,.58,"VERA RUBIN","UNOFFICIAL CONCEPT","#d7e9c9");
 return {group,assemblies,parts};
}
