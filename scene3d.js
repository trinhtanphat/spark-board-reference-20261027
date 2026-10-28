import * as THREE from './vendor/three.module.js';
import {createRubinConcept} from './vera-rubin-concept.mjs';
import {createRackConcept} from './vera-rubin-rack.mjs';
import {createDataCenterConcept} from './data-center-scene.mjs';
import {createDataCenterState} from './data-center-model.mjs';
import {rackTrayFacts} from './nvidia-rack-spec.mjs';
import {NVIDIA_PRODUCT} from './nvidia-product.mjs';
import { VISUAL_ROUTES, ILLUSTRATIVE_STITCHING, LAYER_LABELS, ROUTING_REVISION, auditIllustrativeGeometry, isIllustrativeRoutingCorridor } from './routing/visual-routing.mjs';

/* SPARK 3D hardware board · procedural meshes and textures · Three.js 0.186.1
 * No glTF asset or remote network dependency. All telemetry is illustrative.
 */
const mount=document.getElementById('sceneMount');
const fallback=document.getElementById('sceneFallback');
const engineLabel=document.getElementById('engineLabel');
const fpsLabel=document.getElementById('fpsLabel');
const engineStatus=document.querySelector('.engine-status');
const prefersReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const W=11.7,D=7.2;
const DRILL_LOCATIONS=[[-5.27,-3.0],[-5.27,3.0],[5.27,-3.0],[5.27,3.0]];
let pcbTopMesh=null,pcbSubstrateMesh=null;
let renderer,scene,camera,root,board,glowGroup,coreGroup,coreIndicator,meshReady=false;
let animating=!prefersReducedMotion,running=true,motion=!prefersReducedMotion,traceVisible=true;
let az=.43,el=.69,dist=15.55,azTarget=az,elTarget=el,distTarget=dist,lastTime=0,frames=0;
let dragged=false,pointer=null,touchStart=null;
let hoverHighlight=null,componentGroups=[],layerMeshes=[],layerStack,exploded=false,selectionHelper=null,lastDraw=0;
let qualityMode='auto',actualFPS=0,renderSamples=0,lastSampleTime=0,contextLost=false,autoEco=false,slowWindows=0;
let keyLight,cyanLight,violetLight,needsRender=true,totalRenders=0;
let focusedVisualRouteId=null,routeFocusObject=null;
let nvidiaModel=null,rackModel=null,dataCenterModel=null,dataCenterScene=null,modelMode='nvidia',nvidiaCoolingVisible=false,rackRear=false,rackServiceFocusY=null,dcFocus=null,dcSide='front';
const center=new THREE.Vector3(0,0,0);
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
const r=seeded(20261027);
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function makeMat(hex,metal=.35,rough=.42,extra={}){return new THREE.MeshStandardMaterial({color:hex,metalness:metal,roughness:rough,...extra})}
const chassisMat=makeMat('#102c28',.08,.44), blackMat=makeMat('#17191c',.04,.66), capMat=makeMat('#25282d',.12,.47);
const metalMat=makeMat('#bfc5c6',.83,.34),copperMat=makeMat('#bca676',.78,.29),solderMat=makeMat('#879797',.79,.36);
const innerMat=makeMat('#1a1d20',.04,.8),ledMat=new THREE.MeshBasicMaterial({color:'#769e86'});
const geometryCache=new Map();
function boxGeometry(w,h,d){const key=[w,h,d].join('/');let geo=geometryCache.get(key);if(!geo){geo=new THREE.BoxGeometry(w,h,d);geometryCache.set(key,geo)}return geo}
function box(parent,w,h,d,mat,x=0,y=0,z=0){const obj=new THREE.Mesh(boxGeometry(w,h,d),mat);obj.position.set(x,y,z);parent.add(obj);return obj}
function instancedBoxes(parent,w,h,d,mat,positions){
 const mesh=new THREE.InstancedMesh(boxGeometry(w,h,d),mat,positions.length),dummy=new THREE.Object3D();
 positions.forEach((v,i)=>{dummy.position.set(v[0],v[1],v[2]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();parent.add(mesh);return mesh;
}
function labelTexture(lines,{width=512,height=256,size=42,background=null,color='#e5f8fd',glow=false}={}){
 const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');
 if(background){g.fillStyle=background;g.fillRect(0,0,width,height)}
 g.textAlign='center';g.textBaseline='middle';g.font='700 '+size+'px "Arial",sans-serif';
 if(glow){g.shadowColor='#69ffe2';g.shadowBlur=16}
 lines.forEach((l,i)=>{const fontSize=i===0?size:Math.max(11,Math.round(size*.31));g.font=(i===0?'800 ':'600 ')+fontSize+'px Arial,sans-serif';g.fillStyle=i===0?color:'#75a7ae';g.fillText(l,width/2,height*(.43+i*.28))});
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}
function flatLabel(parent,x,y,z,w,h,lines,settings={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelTexture(lines,settings),transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m}
function pathRing(parent,x,y,z,radius,mat){const obj=new THREE.Mesh(new THREE.TorusGeometry(radius,.019,8,32),mat);obj.rotation.x=-Math.PI/2;obj.position.set(x,y,z);parent.add(obj);return obj}
function circuitTexture(){
 const c=document.createElement('canvas'),mobile=window.innerWidth<860;
 c.width=mobile?1024:2048;c.height=mobile?630:1260;
 const g=c.getContext('2d'),ww=2048,hh=1260;
 if(mobile)g.scale(.5,.5);
 const rnd=seeded(780522);
 const mask=g.createLinearGradient(0,0,ww,hh);
 mask.addColorStop(0,'#18382f');mask.addColorStop(.5,'#0c2822');mask.addColorStop(1,'#16382e');
 g.fillStyle=mask;g.fillRect(0,0,ww,hh);
 for(let i=0;i<12000;i++){g.fillStyle=rnd()>.5?'#ffffff05':'#00000005';g.fillRect(rnd()*ww,rnd()*hh,1+rnd()*3,1+rnd()*3)}
 const px=x=>(x/W+.5)*ww,pz=z=>(.5-z/D)*hh;
 g.lineCap='round';g.lineJoin='round';
 // Render only layer-0 illustrative corridors through the same shared manifest used by Node QA.
 // These shapes are intentionally NOT electrically connected to real IC pin nets.
 for(const route of VISUAL_ROUTES.filter(route=>route.layer===0)){
  g.beginPath();route.points.forEach(([x,z],i)=>i?g.lineTo(px(x),pz(z)):g.moveTo(px(x),pz(z)));
  g.strokeStyle=route.corridor==='RF'||route.corridor==='IO'?'#a6a68178':'#87a39870';
  g.lineWidth=Math.max(2,route.width*ww/W);g.stroke();
 }
 g.strokeStyle='#ced9cc9a';g.lineWidth=2;
 const outlines=[[-3.7,-1.6,1.6,1.35],[3.55,1.76,1.85,1.5],[3.77,-.8,1.4,1.15],
 [-3.65,1.65,1.52,1.0],[.05,.1,3.18,3.0],[-4.65,.1,.9,1.2],
 [4.75,2.6,1.0,.65],[-1.9,2.75,1.25,.6],[1.8,-2.8,1.5,.7]];
 const rect=(x,z,w,d)=>g.strokeRect(px(x-w/2),pz(z+d/2),w/W*ww,d/D*hh);
 for(const [x,z,w,d] of outlines)rect(x,z,w,d);
 g.font='600 22px Consolas, monospace';g.fillStyle='#dbe2d6b5';g.textBaseline='middle';
 for(const [label,x,z] of [['U1',-1.87,.3],['U2',-4.7,-2.45],['U3',4.64,2.7],['U4',4.62,-1.55],
 ['U5',-4.63,2.5],['L1',-4.6,.9],['Y1',-1.95,3.08],['J1',-2.5,-3.08],['J2',2.6,-3.08],
 ['GND',4.6,-2.9],['3V3',-4.75,-2.9],['TP1',1.88,2.6]])g.fillText(label,px(x),pz(z));
 // Deterministic stitching/launch marks; do not imply a fabricated copper net.
 const viaArt=[...ILLUSTRATIVE_STITCHING,...VISUAL_ROUTES.filter(route=>route.layer===0).flatMap(route=>[route.points[0],route.points.at(-1)])];
 for(const [xx,zz] of viaArt){
  const x=px(xx),y=pz(zz),rad=4.0;
  g.beginPath();g.arc(x,y,rad,0,Math.PI*2);g.fillStyle='#b5a87a9b';g.fill();
  g.beginPath();g.arc(x,y,rad*.46,0,Math.PI*2);g.fillStyle='#0c211bbb';g.fill();
 }
 for(const [x,z,w,d] of outlines.slice(0,5)){
  const cx=px(x),cy=pz(z),hw=w/W*ww*.54,hh2=d/D*hh*.54,count=Math.max(8,Math.ceil(w*7));
  g.fillStyle='#b2a379a8';
  for(let i=0;i<count;i++){const u=-1+(2*i+1)/count;g.fillRect(cx+u*hw-3,cy-hh2-11,6,11);g.fillRect(cx+u*hw-3,cy+hh2,6,11)}
 }
 g.fillStyle='#dde2da';g.font='700 32px Consolas,monospace';g.fillText('SPARK  |  S3 / REV 05',120,102);
 g.font='500 20px Consolas,monospace';g.fillStyle='#bbcbbdcc';
 g.fillText('8L FR-4  ·  1.6mm  ·  MATTE GREEN',124,140);
 g.fillText('ASSEMBLY DEMO  /  NOT FOR FABRICATION',120,1188);
 g.fillText('JTAG   GPIO    USB-C',1510,1190);
 g.strokeStyle='#e3eae3ac';g.lineWidth=2;
 for(let i=0;i<17;i++){const x=165+i*102;g.beginPath();g.moveTo(x,170);g.lineTo(x+17,170);g.stroke()}
 g.font='700 19px monospace';
 for(let i=0;i<50;i++){const x=100+rnd()*1800,y=180+rnd()*900;g.fillStyle='#c6d2c58b';g.fillText((i%3?'R':'C')+(30+i),x,y)}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=mobile?4:8;return tex;
}
function boardShape(){
 const shape=new THREE.Shape(),a=-W/2,b=-D/2,rr=.23;
 shape.moveTo(a+rr,b);shape.lineTo(-a-rr,b);shape.quadraticCurveTo(-a,b,-a,b+rr);shape.lineTo(-a,-b-rr);shape.quadraticCurveTo(-a,-b,-a-rr,-b);shape.lineTo(a+rr,-b);shape.quadraticCurveTo(a,-b,a,-b-rr);shape.lineTo(a,b+rr);shape.quadraticCurveTo(a,b,a+rr,b);
 // Four actual mechanically drilled mounting holes in both solder mask and FR-4.
 for(const [x,z] of DRILL_LOCATIONS){const bore=new THREE.Path();bore.absarc(x,-z,.126,0,Math.PI*2,true);shape.holes.push(bore)}
 return shape;
}
/** Projection overlay for the selected illustrative corridor; never exposed as fabricated copper. */
function selectedRouteHeight(layerIndex){
 // In exploded mode align the projection with its corresponding artwork plane.
 return exploded&&layerMeshes[layerIndex]?layerMeshes[layerIndex].position.y+.035:.78;
}
function focusIllustrativeRoute(id){
 if(id&&modelMode!=='reference')applyModelMode('reference');
 const route=VISUAL_ROUTES.find(item=>item.id===id);
 focusedVisualRouteId=route?route.id:null;
 if(routeFocusObject&&board){
  board.remove(routeFocusObject);
  routeFocusObject.geometry.dispose();
  routeFocusObject.material.dispose();
  routeFocusObject=null;
 }
 if(route&&board&&scene){
  const points=route.points.map(([x,z])=>new THREE.Vector3(x,0,z));
  // Use piecewise straight segments; Catmull-Rom smoothing would deviate from the manifest.
  const path=new THREE.CurvePath();
  for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(points[i-1],points[i]));
  const mesh=new THREE.Mesh(
   new THREE.TubeGeometry(path,Math.max(24,(points.length-1)*12),.028,6,false),
   new THREE.MeshBasicMaterial({color:0xffdca0,depthTest:false,depthWrite:false,transparent:true,opacity:.94})
  );
  mesh.name='VISUAL_ROUTE_PROJECTION_NOT_COPPER';
  mesh.renderOrder=1200;
  mesh.userData.routeId=route.id;
  mesh.position.y=selectedRouteHeight(route.layer);
  board.add(mesh);
  routeFocusObject=mesh;
 }
 needsRender=true;
}
document.addEventListener('spark:visual-route-focus',event=>focusIllustrativeRoute(event.detail?.id||null));

function createBoard(){
 board=new THREE.Group();root.add(board);
 // Matte FR-4 material with lightly bevelled, exposed fiberglass edges.
 const geo=new THREE.ExtrudeGeometry(boardShape(),{depth:.17,bevelEnabled:true,bevelThickness:.018,bevelSize:.025,bevelSegments:2,curveSegments:8,steps:1});
 geo.rotateX(Math.PI/2);
 const substrate=new THREE.Mesh(geo,[chassisMat,makeMat('#d7b880',.3,.52)]);
 substrate.position.y=.12;substrate.receiveShadow=true;board.add(substrate);pcbSubstrateMesh=substrate;
 const texture=circuitTexture(),maskMat=new THREE.MeshStandardMaterial({map:texture,metalness:.07,roughness:.73,side:THREE.DoubleSide});
 // ShapeGeometry shares the same drilled holes as the FR-4 extrusion.
 // Normalize generated UV coordinates so the existing silk-screen texture retains its alignment.
 const topGeo=new THREE.ShapeGeometry(boardShape(),10);
 const position=topGeo.getAttribute('position'),uv=topGeo.getAttribute('uv');
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i);
  uv.setXY(i,(x+W/2)/W,(y+D/2)/D);
 }
 uv.needsUpdate=true;topGeo.rotateX(-Math.PI/2);
 const top=new THREE.Mesh(topGeo,maskMat);
 top.position.y=.197;top.receiveShadow=true;top.userData.role='pcb-solder-mask';board.add(top);pcbTopMesh=top;
 const ringGold=new THREE.MeshStandardMaterial({color:'#b8a374',metalness:.78,roughness:.31});
 const washerGeo=new THREE.RingGeometry(.131,.23,32);washerGeo.rotateX(-Math.PI/2);
 for(const [x,z] of DRILL_LOCATIONS){
  const ring=new THREE.Mesh(washerGeo,ringGold);ring.position.set(x,.209,z);board.add(ring);
  // Metallic wall of the bore (open cylinder, NOT a black disc painted onto the board).
  const barrelWall=new THREE.Mesh(new THREE.CylinderGeometry(.126,.126,.21,32,1,true),solderMat);
  barrelWall.position.set(x,.08,z);barrelWall.material.side=THREE.DoubleSide;board.add(barrelWall);
 }
 const tmp=new THREE.Object3D(),count=ILLUSTRATIVE_STITCHING.length;
 const via=new THREE.InstancedMesh(new THREE.CylinderGeometry(.022,.022,.006,10),copperMat,count);
 ILLUSTRATIVE_STITCHING.forEach(([x,z],i)=>{
  tmp.position.set(x,.214,z);tmp.rotation.set(0,0,0);tmp.scale.setScalar(1);
  tmp.updateMatrix();via.setMatrixAt(i,tmp.matrix);
 });
 via.instanceMatrix.needsUpdate=true;via.computeBoundingSphere();board.add(via);
 buildDetailedAssembly();
 makeChip(-3.7,-1.6,1.3,1.08,'RF / 24',12);
 makeChip(3.55,1.76,1.55,1.18,'NPU / 05',16);
 makeChip(3.77,-.8,1.08,.92,'SOC / IO',12);
 makeChip(-3.65,1.65,1.3,.75,'FLASH / 32',10);
 buildCore();buildGlowTraces();buildLayerStack();
 return board;
}
function makeChip(x,z,w,d,title,pins){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.part=title;board.add(group);componentGroups.push(group);
 box(group,w+.09,.035,d+.09,copperMat,0,.229,0);
 const packageBody=box(group,w,.165,d,blackMat,0,.342,0);
 packageBody.userData.part=title;packageBody.castShadow=true;
 const roof=box(group,w-.035,.012,d-.035,makeMat('#252729',.04,.78),0,.432,0);roof.userData.part=title;
 flatLabel(group,0,.442,0,w*.8,d*.65,[title,'SPARK · REV 05'],{width:512,height:256,size:47,color:'#9ba39e'});
 const padCount=Math.max(8,pins),sidePins=[];
 for(let i=0;i<padCount;i++){
  const t=-d/2+(i+.5)*d/padCount;
  sidePins.push([-w/2-.05,.235,t],[w/2+.05,.235,t]);
 }
 instancedBoxes(group,.13,.035,.042,metalMat,sidePins);
 const marker=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.004,12),makeMat('#8c9592',.12,.8));
 marker.position.set(-w/2+.13,.443,-d/2+.13);group.add(marker);
 return group;
}
function buildDetailedAssembly(){
 const ceramic=makeMat('#c6beb0',.03,.83),resistorMat=makeMat('#262626',.04,.81),gold=makeMat('#c6b290',.78,.31);
 const groups={cap:[],res:[],terminal:[],pad:[]},rnd=seeded(22046);
 for(let row=0;row<18;row++)for(let col=0;col<24;col++){
  const x=-4.95+col*.42+(row%2)*.09,z=-2.72+row*.315;
  const reserved=(Math.abs(x)<1.9&&Math.abs(z)<1.73)||
   (Math.abs(x+3.7)<.99&&Math.abs(z+1.6)<.86)||
   (Math.abs(x-3.55)<1.08&&Math.abs(z-1.76)<.88)||
   (Math.abs(x-3.77)<.91&&Math.abs(z+.8)<.82)||
   (Math.abs(x+3.65)<.93&&Math.abs(z-1.65)<.60)||
   (Math.abs(x)<.9&&z>2.25)||(z<-2.45&&Math.abs(x)<3.65)||
   (x<-4.25&&Math.abs(z)<.85)||(x>4.55&&z>2.0)||
   isIllustrativeRoutingCorridor(x,z,.14);
  if(reserved||rnd()>.37)continue;
  const obj=(row+col)%3===0?'res':'cap';
  groups[obj].push([x,.26,z]);groups.pad.push([x-.09,.221,z],[x+.09,.221,z]);
  groups.terminal.push([x-.082,.258,z],[x+.082,.258,z]);
 }
 if(groups.pad.length)instancedBoxes(board,.078,.007,.094,gold,groups.pad);
 if(groups.cap.length)instancedBoxes(board,.13,.075,.105,ceramic,groups.cap);
 if(groups.res.length)instancedBoxes(board,.13,.055,.102,resistorMat,groups.res);
 if(groups.terminal.length)instancedBoxes(board,.046,.053,.106,metalMat,groups.terminal);
 const coilMat=makeMat('#a78054',.79,.32),ferrite=makeMat('#28292a',.1,.8);
 for(const [x,z] of [[-4.58,.63],[4.65,1.0]]){
  const g=new THREE.Group();g.position.set(x,0,z);g.userData.part='L1 / POWER INDUCTOR';
  box(g,.58,.33,.62,ferrite,0,.38,0);
  instancedBoxes(g,.038,.018,.70,coilMat,Array.from({length:5},(_,i)=>[-.2+i*.1,.557,0]));
  board.add(g);componentGroups.push(g);
 }
 const oscillator=new THREE.Group();oscillator.position.set(-1.7,0,2.67);
 oscillator.userData.part='Y1 / 16 MHz CRYSTAL';board.add(oscillator);componentGroups.push(oscillator);
 box(oscillator,.90,.10,.49,gold,0,.248,0);
 const can=box(oscillator,.77,.14,.37,metalMat,0,.35,0);can.userData.part='Y1 / 16 MHz CRYSTAL';
 flatLabel(oscillator,0,.425,0,.66,.26,['16.000','MHz'],{width:512,height:220,size:70,color:'#343c3b'});
 const usb=new THREE.Group();usb.position.set(-2.12,0,-3.27);usb.userData.part='J1 / USB TYPE-C';board.add(usb);componentGroups.push(usb);
 const sh=box(usb,1.27,.29,.66,metalMat,0,.345,0);sh.userData.part='J1 / USB TYPE-C';sh.castShadow=true;
 box(usb,1.09,.15,.035,innerMat,0,.365,-.347);
 box(usb,.91,.045,.36,makeMat('#171a1c',.01,.8),0,.365,-.19);
 instancedBoxes(usb,.034,.006,.21,gold,Array.from({length:9},(_,i)=>[-.38+i*.095,.396,-.20]));
 const header=new THREE.Group();header.position.set(2.32,0,-2.68);
 header.userData.part='J2 / DEBUG HEADER';board.add(header);componentGroups.push(header);
 box(header,1.25,.19,.52,blackMat,0,.315,0);
 const pins=[];for(let i=0;i<5;i++)for(let j=0;j<2;j++)pins.push([-.48+i*.24,.54,-.14+j*.28]);
 instancedBoxes(header,.062,.50,.061,gold,pins);
 const reset=new THREE.Group();reset.position.set(4.72,0,-2.10);
 reset.userData.part='SW1 / RESET';board.add(reset);componentGroups.push(reset);
 box(reset,.60,.15,.54,blackMat,0,.29,0);
 const btn=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.07,24),metalMat);btn.position.y=.40;reset.add(btn);
 const shield=new THREE.Group();shield.position.set(.05,0,2.78);shield.userData.part='U6 / POWER MANAGEMENT';
 board.add(shield);componentGroups.push(shield);
 box(shield,1.14,.27,.58,metalMat,0,.34,0).userData.part='U6 / POWER MANAGEMENT';
 box(shield,.92,.01,.36,makeMat('#a2a7a1',.64,.61),0,.485,0);
 const padGeo=new THREE.CylinderGeometry(.07,.07,.01,16),pads=new THREE.InstancedMesh(padGeo,gold,14),temp=new THREE.Object3D();
 for(let i=0;i<14;i++){temp.position.set(3.1+(i%7)*.29,.229,-2.95+Math.floor(i/7)*.28);temp.updateMatrix();pads.setMatrixAt(i,temp.matrix)}
 pads.instanceMatrix.needsUpdate=true;board.add(pads);
}

function buildCore(){
 coreGroup=new THREE.Group();coreGroup.position.set(.05,0,.1);
 coreGroup.userData.part='SPARK / FABLE CORE';board.add(coreGroup);componentGroups.push(coreGroup);
 const ground=box(coreGroup,2.93,.046,2.77,copperMat,0,.23,0);ground.userData.part='SPARK / FABLE CORE';
 box(coreGroup,2.77,.055,2.61,innerMat,0,.300,0);
 const body=box(coreGroup,2.59,.29,2.46,blackMat,0,.465,0);
 body.userData.part='SPARK / FABLE CORE';body.castShadow=true;body.receiveShadow=true;
 const cap=box(coreGroup,2.50,.012,2.38,makeMat('#252628',.08,.81),0,.618,0);cap.userData.part='SPARK / FABLE CORE';
 const side=[],ends=[];
 for(let i=0;i<22;i++){const x=-1.20+(i+.5)*2.40/22;side.push([x,.257,-1.315],[x,.257,1.315])}
 for(let i=0;i<20;i++){const z=-1.17+(i+.5)*2.34/20;ends.push([-1.386,.257,z],[1.386,.257,z])}
 instancedBoxes(coreGroup,.068,.039,.22,metalMat,side);
 instancedBoxes(coreGroup,.22,.039,.068,metalMat,ends);
 const c=document.createElement('canvas'),mobile=window.innerWidth<640;
 c.width=mobile?512:1024;c.height=mobile?512:1024;
 const g=c.getContext('2d');if(mobile)g.scale(.5,.5);
 g.fillStyle='#222427';g.fillRect(0,0,1024,1024);
 g.textAlign='center';g.textBaseline='middle';g.fillStyle='#aeb2ad';
 g.font='700 98px Arial';g.fillText('SPARK',512,360);
 g.font='500 47px Consolas,monospace';g.fillStyle='#8f9993';g.fillText('FABLE 5.1   /   S3',512,490);
 g.font='500 31px Consolas,monospace';g.fillStyle='#777f7b';g.fillText('3V3 · REV05 · 2026',512,620);
 g.textAlign='left';g.fillStyle='#a8ada8';g.font='700 40px Arial';g.fillText('●',82,100);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=mobile?4:8;
 const top=new THREE.Mesh(new THREE.PlaneGeometry(2.41,2.31).rotateX(-Math.PI/2),
 new THREE.MeshStandardMaterial({map:tex,roughness:.77,metalness:.03}));
 top.position.y=.628;top.userData.part='SPARK / FABLE CORE';coreGroup.add(top);
 coreIndicator=new THREE.PointLight(0x9eaa8c,.12,3,2);
 coreIndicator.position.set(0,.9,0);board.add(coreIndicator);
}
function buildGlowTraces(){
 glowGroup=new THREE.Group();board.add(glowGroup);
 const verts=[];
 for(const route of VISUAL_ROUTES.filter(route=>route.layer===0)){
  for(let k=1;k<route.points.length;k++){
   const [x0,z0]=route.points[k-1],[x1,z1]=route.points[k];
   verts.push(x0,.218,z0,x1,.218,z1);
  }
 }
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 const lines=new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:0x98a995,transparent:true,opacity:.24}));
 glowGroup.add(lines);
}

function buildLayerStack(){
 // Same illustrated route data as the top artwork and Node static QA.
 // Eight planes are conceptual only, NOT a real PCB stackup.
 layerStack=new THREE.Group();layerStack.visible=false;board.add(layerStack);
 const palette=["#aebfae","#a4afb0","#b7aa93","#929b96"];
 for(let n=0;n<LAYER_LABELS.length;n++){
  const c=document.createElement('canvas');c.width=1024;c.height=640;
  const g=c.getContext('2d'),col=palette[n%4];
  const xCoord=x=>(x/W+.5)*1024,zCoord=z=>(.5-z/D)*640;
  g.fillStyle='rgba(9,20,32,.27)';g.fillRect(0,0,c.width,c.height);
  g.strokeStyle=col;g.globalAlpha=.36;g.lineWidth=4;g.strokeRect(15,15,994,610);
  g.lineJoin='round';g.lineCap='round';
  for(const route of VISUAL_ROUTES.filter(route=>route.layer===n)){
   g.beginPath();route.points.forEach(([x,z],i)=>i?g.lineTo(xCoord(x),zCoord(z)):g.moveTo(xCoord(x),zCoord(z)));
   g.strokeStyle=palette[(n+(route.corridor==='RF'?0:route.corridor==='FLASH'?1:route.corridor==='NPU'?2:3))%4];
   g.lineWidth=2.1;g.stroke();
  }
  g.globalAlpha=.86;g.font='700 24px monospace';g.fillStyle=col;
  g.fillText('L'+(n+1)+' / '+LAYER_LABELS[n],42,59);
  g.font='600 14px monospace';g.fillText('VISUAL ART · NOT GERBER',42,606);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.66,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(W-.17,D-.17).rotateX(-Math.PI/2),mat);
  mesh.position.y=.24+n*.003;mesh.renderOrder=2+n;layerStack.add(mesh);layerMeshes.push(mesh);
 }
}

function clearRackServiceFocus(){
 rackServiceFocusY=null;
 if(modelMode==='rack'){
  distTarget=23.3;elTarget=.24;azTarget=.33;center.y=3.68;
  if(camera)updateCamera(true);
  needsRender=true;
 }
}
function setRackServiceFocus(part){
 const tray=rackModel?.trays.find(item=>item.part===part);
 if(!tray||modelMode!=='rack')return;
 rackServiceFocusY=tray.y;
 distTarget=12.7;elTarget=.27;azTarget=.38;center.y=tray.y;
 if(camera)updateCamera(true);
 needsRender=true;
}

function selectPart(name){
 if(rackModel?.getServiceState().open&&rackModel.getServiceState().part!==name){rackModel.clearService();clearRackServiceFocus();}
 const dcTarget=dataCenterScene?.parts.find(g=>g.userData.part===name);
 const rackTarget=rackModel?.parts.find(g=>g.userData.part===name);
 const nvidiaTarget=nvidiaModel?.parts.find(g=>g.userData.part===name);
 const targetMode=dcTarget?'datacenter':rackTarget?'rack':nvidiaTarget?'nvidia':'reference';
 if(modelMode!==targetMode)applyModelMode(targetMode);
 const target=dcTarget||rackTarget||nvidiaTarget||componentGroups.find(g=>g.userData.part===name);
 if(!target)return;
 if(selectionHelper){selectionHelper.removeFromParent();selectionHelper.geometry.dispose();selectionHelper.material.dispose();selectionHelper=null}
 dataCenterScene?.clearSlotSelection();
 if(dcTarget){
  selectionHelper=dataCenterScene.createSlotSelectionFrame(name);
 }else if(rackTarget){
  selectionHelper=rackModel.createTraySelectionFrame(name);
  if(selectionHelper)selectionHelper.visible=!rackRear;
 }else{
  selectionHelper=new THREE.BoxHelper(target,0xd4b37d);
  selectionHelper.material.depthTest=false;selectionHelper.material.transparent=true;selectionHelper.material.opacity=.9;
  scene.add(selectionHelper);
 }
 window.sparkInspectPart?.(name);
}
function clearSelection(){
 if(selectionHelper){selectionHelper.removeFromParent();selectionHelper.geometry.dispose();selectionHelper.material.dispose();selectionHelper=null}
 dataCenterScene?.clearSlotSelection();
}

function nvidiaExplodedHeight(assembly){
 if(!exploded||modelMode!=='nvidia')return 0;
 const name=assembly.group.userData.part||'';
 if(name.includes('RUBIN GPU'))return 1.55;
 if(name.includes('VERA CPU'))return 1.10;
 return .66;
}
function applyModelMode(mode){
 if(!['nvidia','reference','rack','datacenter'].includes(mode))return;
 const previousMode=modelMode;
 modelMode=mode;
 // Stable picking: only processor/PCB showcases get ambient yaw animation.
 if(root&&(mode==='rack'||mode==='datacenter'))root.rotation.y=0;
 rackServiceFocusY=null;
 if(mode!=='rack'&&rackModel)rackModel.clearService();
 exploded=false;
 dcFocus=null;dcSide='front';dataCenterScene?.focusRack(null);
 if(mode==='datacenter'){
  distTarget=49;elTarget=1.07;azTarget=.50;center.x=0;center.z=0;center.y=3.68;
 }else if(mode==='rack'){
  rackRear=false;
  rackModel?.setRearSystemFocus("all");
  distTarget=23.3;elTarget=.24;azTarget=.33;
  center.y=3.65;
 }else if(previousMode==='rack'||previousMode==='datacenter'){
  distTarget=15.55;elTarget=.82;azTarget=.43;
  center.y=0;
 }
 if(camera)updateCamera(true);
 if(board)board.visible=mode==='reference';
 if(rackModel)rackModel.group.visible=mode==='rack';
 if(dataCenterScene)dataCenterScene.group.visible=mode==='datacenter';
 if(nvidiaModel){
  nvidiaModel.group.visible=mode==='nvidia';
  for(const coldplate of nvidiaModel.coolingGroups)coldplate.visible=mode==='nvidia'&&nvidiaCoolingVisible;
 }
 // Product mode uses a processor assembly exploded view; the reference retains the
 // existing conceptual PCB layer animation. Never confuse either with physical PCB CAD.
 if(mode!=='reference'&&layerStack)layerStack.visible=false;
 clearSelection();
 if(nvidiaModel){
  for(const assembly of nvidiaModel.assemblies)assembly.group.position.y=
   nvidiaExplodedHeight(assembly);
 }
 needsRender=true;
 document.dispatchEvent(new CustomEvent('spark:model-mode-change',{detail:{mode}}));
}

function createSky(){
 // Neutral photographic studio: matte ground and soft contact-shadow billboard.
 scene.background=new THREE.Color('#171c1f');
 scene.fog=new THREE.FogExp2(0x171c1f,.012);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(140,140).rotateX(-Math.PI/2),
 new THREE.MeshStandardMaterial({color:'#22272a',metalness:.04,roughness:.9}));
 floor.position.y=-1.13;floor.receiveShadow=true;scene.add(floor);
 const c=document.createElement('canvas');c.width=512;c.height=512;
 const g=c.getContext('2d'),grad=g.createRadialGradient(256,256,15,256,256,250);
 grad.addColorStop(0,'#00000088');grad.addColorStop(.48,'#00000038');grad.addColorStop(1,'#00000000');
 g.fillStyle=grad;g.fillRect(0,0,512,512);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const contact=new THREE.Mesh(new THREE.PlaneGeometry(15,10).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.55}));
 contact.position.y=-1.119;scene.add(contact);
}
function updateCamera(hard=false){
 if(hard){az=azTarget;el=elTarget;dist=distTarget}else{az+=(azTarget-az)*.13;el+=(elTarget-el)*.13;dist+=(distTarget-dist)*.13}
 const targetX=modelMode==='datacenter'&&dcFocus?dcFocus.x:0;
 const targetZ=modelMode==='datacenter'&&dcFocus?dcFocus.z:0;
 const targetY=modelMode==='rack'?(rackServiceFocusY??3.65):modelMode==='datacenter'?3.68:exploded?.75:0;
 if(hard)center.set(targetX,targetY,targetZ);
 else {center.x+=(targetX-center.x)*.13;center.y+=(targetY-center.y)*.09;center.z+=(targetZ-center.z)*.13}
 const c=Math.cos(el);
 camera.position.set(center.x+dist*c*Math.sin(az),center.y+dist*Math.sin(el),center.z+dist*c*Math.cos(az));
 camera.lookAt(center);
}
function resize(){
 if(!renderer||!camera)return;
 const w=Math.max(2,mount.clientWidth),h=Math.max(2,mount.clientHeight);
 if(w<3||h<3)return;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<640?42:35;
 if(root)root.scale.setScalar(w<640?.53:w<860?.82:1);
 if(dcFocus&&dataCenterScene){const at=dataCenterScene.rackPosition(dcFocus.id);if(at){dcFocus.x=at.x*root.scale.x;dcFocus.z=at.z*root.scale.z}}
 camera.updateProjectionMatrix();
 needsRender=true;
 if(!meshReady&&!contextLost&&scene)renderer.render(scene,camera);
}
function notifyPart(name){selectPart(name)}
function interactions(){
 const active=new Map();let gesture=null,moved=false,clickPos=null;
 const point=e=>({x:e.clientX,y:e.clientY});
 const span=()=>{const p=Array.from(active.values());return p.length<2?0:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)};
 mount.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'&&e.button!==0)return;
  active.set(e.pointerId,point(e));clickPos=point(e);moved=false;
  try{mount.setPointerCapture(e.pointerId)}catch{}
  gesture=active.size>1?{distance:span()}:null;
 });
 mount.addEventListener('pointermove',e=>{
  if(!active.has(e.pointerId))return;
  const previous=active.get(e.pointerId),current=point(e);
  active.set(e.pointerId,current);
  if(active.size>=2){
   const next=span();
   if(gesture?.distance&&next>0){distTarget=clamp(distTarget*gesture.distance/next,8.5,36)}
   gesture={distance:next};moved=true;return;
  }
  // Do not mistake sub-pixel mouse jitter or a small finger tremor for orbit.
  // A deliberate drag begins only after six CSS pixels from pointerdown.
  if(!moved&&clickPos&&Math.hypot(current.x-clickPos.x,current.y-clickPos.y)>6)moved=true;
  if(moved){
   azTarget-=(current.x-previous.x)*.007;
   elTarget=clamp(elTarget+(current.y-previous.y)*.006,.18,1.57);
  }
 });
 function release(e){
  if(!active.has(e.pointerId))return;
  const click=!moved&&active.size===1&&clickPos&&
   Math.hypot(e.clientX-clickPos.x,e.clientY-clickPos.y)<8;
  active.delete(e.pointerId);gesture=active.size>1?{distance:span()}:null;
  if(click&&meshReady){
   const rect=renderer.domElement.getBoundingClientRect();
   const pt=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
   const ray=new THREE.Raycaster();ray.setFromCamera(pt,camera);
   // Rack-specific click volumes precisely represent a full physical tray
   // across its front, sides and rear. Exclude decorative instanced meshes,
   // cable layers and the cabinet outline from the picking ray.
   if(modelMode==='rack'){
    ray.layers.set(29);
    const hit=ray.intersectObjects(rackModel.pickTargets,false)[0];
    if(hit?.object?.userData.part)notifyPart(hit.object.userData.part);
    if(active.size===0){clickPos=null;gesture=null}
    return;
   }
   if(modelMode==='datacenter'){
    ray.layers.set(29);
    const hit=ray.intersectObjects(dataCenterScene.pickTargets,false)[0];
    if(hit?.object?.userData.part)notifyPart(hit.object.userData.part);
    if(active.size===0){clickPos=null;gesture=null}
    return;
   }
   const intersections=ray.intersectObjects(modelMode==='nvidia'?nvidiaModel.group.children:board.children,true);
   const item=intersections.map(v=>{let o=v.object;while(o&&!o.userData.part)o=o.parent;return o}).find(o=>o&&o.userData.part);
   if(item)notifyPart(item.userData.part);
  }
  if(active.size===0){clickPos=null;gesture=null}
 }
 mount.addEventListener('pointerup',release);
 mount.addEventListener('pointercancel',e=>{active.delete(e.pointerId);gesture=null;clickPos=null;moved=true});
 mount.addEventListener('lostpointercapture',e=>{active.delete(e.pointerId);if(!active.size)gesture=null});
 mount.addEventListener('wheel',e=>{
  e.preventDefault();distTarget=clamp(distTarget+Math.sign(e.deltaY)*(modelMode==="datacenter"?1.1:.5),8.5,modelMode==="datacenter"?65:26);
 },{passive:false});
}

function qualityDpr(){
 const native=window.devicePixelRatio||1;
 if(qualityMode==="eco")return Math.min(native,1);
 if(qualityMode==="auto"&&autoEco)return Math.min(native,.85);
 if(qualityMode==="ultra")return Math.min(native,2);
 return Math.min(native,window.innerWidth<640?1.25:1.6);
}
function qualityInterval(){
 if(!running)return 1000/8;
 if(qualityMode==="eco"||(qualityMode==="auto"&&autoEco))return 1000/24;
 if(qualityMode==="ultra")return 1000/60;
 return window.innerWidth<640?1000/30:1000/50;
}
function applyQuality(name){
 if(!["auto","eco","ultra"].includes(name))return;
 if(name!==qualityMode){autoEco=false;slowWindows=0;}
 qualityMode=name;
 if(!renderer||!meshReady||contextLost)return;
 needsRender=true;
 renderer.setPixelRatio(qualityDpr());
 const reduced=name==="eco"||(name==="auto"&&autoEco);
 renderer.shadowMap.enabled=!reduced&&(name==="ultra"||window.innerWidth>=900);
 renderer.shadowMap.needsUpdate=true;
 if(keyLight){keyLight.intensity=reduced?1.7:2.4;cyanLight.intensity=reduced?8:14;violetLight.intensity=reduced?6:10}
 resize();
}
function setEngineReady(){
 engineLabel.textContent="3D ENGINE ACTIVE";engineStatus.classList.remove("offline");
 fallback.style.display="none";
}

function fallbackMode(err){
 console.warn('[SPARK 3D] WebGL fallback:',err?.message||err);
 meshReady=false;engineLabel.textContent='2D COMPATIBILITY MODE';fpsLabel.textContent='WEBGL NOT AVAILABLE';engineStatus.classList.add('offline');fallback.style.display='grid';fallback.querySelector('.fallback-note').textContent='WEBGL UNAVAILABLE · 2D REFERENCE MODE';window.SPARK3D={ready:false,zoom(){},reset(){},setView(){},nudge(){},highlight(){},setMotion(){},setRunning(){},showTraces(){},setExploded(){},selectPart(){},clearSelection(){},capture(){},setQuality(){},getQuality(){return 'auto'},getFPS(){return 0}};
}
function init(){
 if(!document.createElement('canvas').getContext('webgl2'))throw new Error('WebGL2 unavailable');
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance',stencil:false,depth:true});
 renderer.setPixelRatio(qualityDpr());
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.22;
 renderer.shadowMap.enabled=window.innerWidth>=900;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label','Interactive unofficial Vera Rubin Superchip, NVL72 rack and SPARK reference board models');
 renderer.domElement.addEventListener('webglcontextlost',ev=>{ev.preventDefault();contextLost=true;meshReady=false;if(window.SPARK3D)window.SPARK3D.ready=false;engineLabel.textContent='GPU RECONNECTING';fpsLabel.textContent='WEBGL CONTEXT LOST';engineStatus.classList.add('offline');fallback.style.display='grid';fallback.querySelector('.fallback-note').textContent='GPU CONTEXT LOST · AWAITING RESTORE';});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;meshReady=true;if(window.SPARK3D)window.SPARK3D.ready=true;applyQuality(qualityMode);setEngineReady();lastSampleTime=performance.now();renderSamples=0;});
 mount.appendChild(renderer.domElement);
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x171c1f,.012);
 camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(4.5,8.8,9);
 scene.add(new THREE.AmbientLight(0xffffff,.85));
 const hemi=new THREE.HemisphereLight(0xf4f6f2,0x373d38,1.7);hemi.position.set(0,6,0);scene.add(hemi);
 keyLight=new THREE.DirectionalLight(0xfff7ec,2.4);keyLight.position.set(-3,10,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-9;keyLight.shadow.camera.right=9;keyLight.shadow.camera.top=9;keyLight.shadow.camera.bottom=-9;keyLight.shadow.bias=-.0003;scene.add(keyLight);
 cyanLight=new THREE.PointLight(0xe4edf0,14,19,2);cyanLight.position.set(-6,7,-1);scene.add(cyanLight);
 violetLight=new THREE.PointLight(0xffecd8,10,20,2);violetLight.position.set(7,6,4);scene.add(violetLight);
 // Studio fill for rear manifold/cable-cartridge inspection; shadows disabled for GPU budget.
 const rearFill=new THREE.DirectionalLight(0xe6d5b1,1.75);rearFill.position.set(2.8,7,-8);scene.add(rearFill);
 root=new THREE.Group();scene.add(root);createBoard();nvidiaModel=createRubinConcept(THREE);root.add(nvidiaModel.group);rackModel=createRackConcept(THREE);root.add(rackModel.group);dataCenterModel=createDataCenterState();dataCenterScene=createDataCenterConcept(THREE,dataCenterModel);root.add(dataCenterScene.group);dataCenterModel.onChange(()=>{dataCenterScene.refresh();needsRender=true;document.dispatchEvent(new Event('spark:datacenter-update'))});applyModelMode('nvidia');createSky();if(focusedVisualRouteId)focusIllustrativeRoute(focusedVisualRouteId);
 updateCamera(true);resize();interactions();
 renderer.render(scene,camera);totalRenders++;lastDraw=performance.now();
 meshReady=true;setEngineReady();fpsLabel.textContent='THREE.JS / STUDIO MATERIALS';
 async function captureFrameBlob(){
  if(contextLost||!renderer)return null;
  // Finish GPU work before PNG readback, especially after changing quality/pixel ratio.
  await new Promise(resolve=>requestAnimationFrame(resolve));
  renderer.render(scene,camera);totalRenders++;
  renderer.getContext().finish();
  return new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
 }
 window.SPARK3D={ready:true,
 getModelMode(){return modelMode},
 getRackDiagnostics(){return rackModel?.diagnostics()||null},
 getRackSelectionDiagnostics(){const s=selectionHelper;return s?.userData?.selectionType==="rack-tray-cuboid"?{...s.userData,attachedToTray:s.parent?.userData?.part===s.userData.part,visible:s.visible}: {selectionType:s?"other":"none"}},
 getDataCenterAPI(){return dataCenterModel},
 getDataCenterDiagnostics(){return dataCenterScene?.diagnostics()||null},
 getDataCenterRearModuleState(id){return dataCenterScene?.getRearModuleState(id)||null},
 setDataCenterRearLayer(value){
  if(modelMode!=="datacenter"||dcSide!=="rear")return false;
  const ok=dataCenterScene?.setRearLayer(value)===true;
  if(ok)needsRender=true;
  return ok;
 },
 getDataCenterFocusState(){return {rack:dcFocus?.id??null,x:dcFocus?.x??0,z:dcFocus?.z??0,distance:distTarget,elevation:elTarget,side:dcSide,selectedSlot:dataCenterScene?.diagnostics().selectedSlot??null}},
 getDataCenterPickPoint(slotId){
  if(modelMode!=='datacenter'||!renderer||!camera)return null;
  const body=dataCenterScene?.pickTargets.find(t=>t.userData.part==='DC / '+slotId&&t.userData.side===dcSide);
  if(!body)return null;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const point=body.localToWorld(new THREE.Vector3(0,0,dcSide==='rear'?-.065:.065)).project(camera);
  const rect=renderer.domElement.getBoundingClientRect();
  return {slotId,x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2,
   inside:Math.abs(point.x)<1&&Math.abs(point.y)<1};
 },
 focusDataCenterRack(id){
  if(modelMode!=='datacenter')return false;
  const point=dataCenterScene?.rackPosition(id);if(!point)return false;
  const scale=root?.scale.x??1;
  dcFocus={id,x:point.x*scale,z:point.z*scale};dataCenterScene.focusRack(id);
  distTarget=17.5;elTarget=.88;azTarget=dcSide==='rear'?Math.PI+.38:.38;needsRender=true;if(camera)updateCamera(true);return true;
 },
 resetDataCenterOverview(){
  if(modelMode!=='datacenter')return false;
  dcFocus=null;dataCenterScene?.focusRack(null);
  distTarget=49;elTarget=1.07;azTarget=dcSide==='rear'?Math.PI+.50:.50;needsRender=true;if(camera)updateCamera(true);return true;
 },
 setDataCenterSide(side){
  if(modelMode!=='datacenter'||!['front','rear'].includes(side))return false;
  dcSide=side;azTarget=(side==='rear'?Math.PI:0)+(dcFocus?.38:.50);
  elTarget=dcFocus?.88:1.07;distTarget=dcFocus?17.5:49;
  needsRender=true;if(camera)updateCamera(true);return true;
 },
 selectDataCenterSlot(id){selectPart('DC / '+id)},

 getRackServiceState(){return rackModel?.getServiceState()||{open:false}},
 openRackService(part){
  if(modelMode!=='rack'||rackRear)return false;
  const ok=rackModel.openService(part);
  if(ok){selectPart(part);setRackServiceFocus(part);needsRender=true;}
  return ok;
 },
 closeRackService(){
  if(!rackModel)return;
  rackModel.clearService();clearSelection();clearRackServiceFocus();needsRender=true;
 },
 setRackRear(show){
  rackRear=Boolean(show);
  if(selectionHelper?.userData?.selectionType==="rack-tray-cuboid")selectionHelper.visible=!rackRear;
  if(!rackRear)rackModel?.setRearSystemFocus("all");
  if(rackRear&&rackModel?.getServiceState().open){rackModel.clearService();clearSelection();clearRackServiceFocus()}
  if(modelMode==='rack'){
   azTarget=rackRear?Math.PI+.33:.33;
   elTarget=.24;
   distTarget=23.3;
   needsRender=true;
  }
 },
 getRackRear(){return rackRear},
 setRackRearSystem(focus){
  if(modelMode!=="rack"||!rackRear)return false;
  const ok=rackModel?.setRearSystemFocus(focus)||false;
  if(ok)needsRender=true;
  return ok;
 },
 getRackTrays(){return rackModel?.trays.map(t=>({kind:t.kind,number:t.number,part:t.part,height:t.height}))||[]},
 getRackTrayPickPoint(part){
  const target=rackModel?.pickTargets.find(t=>t.userData.part===part);
  if(modelMode!=='rack'||!target||!camera)return null;
  // Browser QA uses this projection to exercise REAL pointer events, rather
  // than only calling the selection API or changing the dropdown.
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const world=target.localToWorld(new THREE.Vector3(.50,0,rackRear?-1.235:1.235));
  const ndc=world.project(camera),rect=renderer.domElement.getBoundingClientRect();
  const x=rect.left+(ndc.x+1)*rect.width/2,y=rect.top+(1-ndc.y)*rect.height/2;
  return {part,x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),inside:Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1,visibleOnScreen:x>0&&y>0&&x<innerWidth&&y<innerHeight};
 },
 getRackTrayDetails(part){const t=rackModel?.trays.find(t=>t.part===part);return t?{...rackTrayFacts(t.kind),kind:t.kind,number:t.number,part:t.part}:null},
 getRackViewDiagnostics(){return {mode:modelMode,cameraDistance:Number(dist.toFixed(2)),cameraTargetY:Number(center.y.toFixed(2)),cameraElevation:Number(el.toFixed(2)),serviceFocusY:rackServiceFocusY}},
 setNvidiaCooling(on){nvidiaCoolingVisible=Boolean(on);if(nvidiaModel){for(const coldplate of nvidiaModel.coolingGroups)coldplate.visible=modelMode==='nvidia'&&nvidiaCoolingVisible}needsRender=true},
 getNvidiaCooling(){return nvidiaCoolingVisible},
 setModelMode(mode){applyModelMode(mode)},
 getNvidiaProductInfo(){return {name:NVIDIA_PRODUCT.name,...NVIDIA_PRODUCT.superchip}},
 getNvidiaModelDiagnostics(){return {mode:modelMode,visible:nvidiaModel.group.visible,gpuPackages:nvidiaModel.parts.filter(p=>p.userData.part.includes('RUBIN GPU')).length,cpuPackages:nvidiaModel.parts.filter(p=>p.userData.part.includes('VERA CPU')).length,hbmArtPackages:nvidiaModel.parts.filter(p=>p.userData.part.includes('HBM4')).length,coldPlateModules:nvidiaModel.coolingGroups.length,coolingOn:nvidiaCoolingVisible,coolingVisible:nvidiaModel.coolingGroups.filter(g=>g.visible).length,assemblyHeights:nvidiaModel.assemblies.map(p=>({name:p.group.userData.part,y:Number(p.group.position.y.toFixed(3))}))}},
 async exportSnapshotInfo(){const blob=await captureFrameBlob();return {size:blob?.size||0,type:blob?.type||''}},
 getQuality(){return qualityMode},
 setQuality(mode){applyQuality(mode)},
 getFPS(){return actualFPS},
 getRenderCount(){return totalRenders},
 getFocusedVisualRoute(){return focusedVisualRouteId},
 getFocusedRouteDiagnostics(){
  const route=VISUAL_ROUTES.find(item=>item.id===focusedVisualRouteId);
  const layer=route?.layer??null;
  const curves=routeFocusObject?.geometry?.parameters?.path?.curves||[];
  const exactPolyline=!!route&&curves.length===route.points.length-1&&curves.every((curve,i)=>
   curve instanceof THREE.LineCurve3&&
   Math.hypot(curve.v1.x-route.points[i][0],curve.v1.z-route.points[i][1])<1e-8&&
   Math.hypot(curve.v2.x-route.points[i+1][0],curve.v2.z-route.points[i+1][1])<1e-8);
  return {id:route?.id??null,layer,exploded,overlayPresent:!!routeFocusObject,
   exactPolyline,segmentCount:curves.length,
   projectionY:routeFocusObject?Number(routeFocusObject.position.y.toFixed(4)):null,
   planeY:layer!==null&&layerMeshes[layer]?Number(layerMeshes[layer].position.y.toFixed(4)):null};
 },
 getVisualRoutingAudit(){return auditIllustrativeGeometry()},
 getVisualRoutingRevision(){return ROUTING_REVISION},
 getBoardDiagnostics(){
  const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,-1,0);
  const intersects=(mesh,x,z)=>{mesh.updateWorldMatrix(true,false);const origin=pcbTopMesh.localToWorld(new THREE.Vector3(x,0,z));ray.set(origin.clone().add(new THREE.Vector3(0,2,0)),direction);return ray.intersectObject(mesh,false).length>0};
  const check=(mesh)=>({clear:DRILL_LOCATIONS.every(([x,z])=>!intersects(mesh,x,z)),adjacentSolid:DRILL_LOCATIONS.every(([x,z])=>intersects(mesh,x+(x<0?.37:-.37),z))});
  const mask=check(pcbTopMesh),fiberglass=check(pcbSubstrateMesh);
  return {mountingHoleCount:DRILL_LOCATIONS.length,holesPassThroughMask:mask.clear,adjacentMaskSolid:mask.adjacentSolid,holesPassThroughFR4:fiberglass.clear,adjacentFR4Solid:fiberglass.adjacentSolid,componentGroups:componentGroups.length};
 },
 getRenderStats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,dpr:renderer.getPixelRatio(),textureCount:renderer.info.memory.textures,geometryCount:renderer.info.memory.geometries}},
 getCameraState(){return {azimuth:azTarget,elevation:elTarget,distance:distTarget}},
 zoom(dir){distTarget=clamp(distTarget+dir*(modelMode==='datacenter'?1.4:.8),8.5,modelMode==='datacenter'?65:26);needsRender=true},
 setView(mode){
  if(modelMode==='datacenter'&&dcFocus){
   azTarget=mode==='top'?0:(dcSide==='rear'?Math.PI+.38:.38);elTarget=mode==='top'?1.57:.88;distTarget=mode==='top'?19:17.5;
  }else{
   azTarget=mode==='top'?0:modelMode==='rack'?.33:modelMode==='datacenter'?(dcSide==='rear'?Math.PI+.50:.50):.43;
   elTarget=mode==='top'?1.57:modelMode==='rack'?.24:modelMode==='datacenter'?1.07:.69;
   distTarget=modelMode==='datacenter'?49:modelMode==='rack'?(mode==='top'?22:23.3):(mode==='top'?15.2:15.55);
  }
  needsRender=true
 },
 reset(){if(modelMode==='datacenter'){dcFocus=null;dataCenterScene?.focusRack(null)}azTarget=modelMode==='rack'?.33:modelMode==='datacenter'?(dcSide==='rear'?Math.PI+.50:.50):.43;elTarget=modelMode==='rack'?.24:modelMode==='datacenter'?1.07:.69;distTarget=modelMode==='rack'?23.3:modelMode==='datacenter'?49:15.55;needsRender=true},
 nudge(x,y){azTarget+=x*.14;elTarget=clamp(elTarget+y*.12,.18,1.57);needsRender=true},
 showTraces(show){traceVisible=show;glowGroup.visible=show;coreIndicator.intensity=show?2:0;needsRender=true},
 setMotion(val){motion=val;needsRender=true},
 setRunning(val){
  running=Boolean(val);
  if(!running)fpsLabel.textContent='GPU IDLE · PAUSED';
  if(!running){
   if(nvidiaModel)for(const assembly of nvidiaModel.assemblies)assembly.group.position.y=nvidiaExplodedHeight(assembly);
   // Pause resolves pending transitions in one draw, then leaves the GPU idle.
   az=azTarget;el=elTarget;dist=distTarget;updateCamera(true);
   if(layerStack){
    for(let i=0;i<layerMeshes.length;i++)layerMeshes[i].position.y=exploded?.35+i*.23:.24+i*.003;
    for(const group of componentGroups)group.position.y=exploded?2.50:0;
    layerStack.visible=exploded;
   }
   if(selectionHelper?.update)selectionHelper.update();
  }
  needsRender=true;
 },
 setExploded(on){
  exploded=Boolean(on);layerStack.visible=true;
  elTarget=exploded?.40:.82;distTarget=exploded?16.5:15.55;azTarget=exploded?.48:.43;
  if(nvidiaModel)for(const assembly of nvidiaModel.assemblies)assembly.group.position.y=nvidiaExplodedHeight(assembly);
  // Immediately align selected route when entering/leaving exploded mode.
  // Animation still follows subsequent per-layer easing frames.
  const route=VISUAL_ROUTES.find(item=>item.id===focusedVisualRouteId);
  if(route&&routeFocusObject)routeFocusObject.position.y=selectedRouteHeight(route.layer);
  needsRender=true;
 },
 selectPart(name){selectPart(name);needsRender=true},
 clearSelection(){clearSelection();needsRender=true},
 async capture(){
  const blob=await captureFrameBlob();
  if(!blob||blob.size<25000){window.sparkNotify?.('PNG render incomplete · please retry');return}
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='spark-3d-board.png';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  window.sparkNotify?.('3D board PNG captured');
 },
 highlight(kind){coreIndicator.color.set(kind==='fable'?0x9873ff:kind==='flash'?0x60caff:kind==='post'?0xffd288:0x52ffe1);needsRender=true}
 };
 document.dispatchEvent(new CustomEvent("spark3d:ready"));
 function animate(t){
 requestAnimationFrame(animate);
 if(!meshReady||contextLost)return;
 const visible=!document.hidden,ambientNow=visible&&running&&motion&&!prefersReducedMotion&&modelMode!=='rack'&&modelMode!=='datacenter';
 // Camera and exploded layers keep easing after the user releases a pointer,
 // but settled scenes no longer submit redundant WebGL frames.
 const targetY=modelMode==='rack'?(rackServiceFocusY??3.65):modelMode==='datacenter'?3.68:exploded?.75:0;
 const cameraMoving=Math.abs(az-azTarget)+Math.abs(el-elTarget)+Math.abs(dist-distTarget)+Math.abs(center.y-targetY)+Math.abs(center.x-(modelMode==='datacenter'&&dcFocus?dcFocus.x:0))+Math.abs(center.z-(modelMode==='datacenter'&&dcFocus?dcFocus.z:0))>.002;
 let layersMoving=false;
 if(ambientNow){
  root.rotation.y=Math.sin(t*.00014)*.085;
  coreIndicator.intensity=traceVisible?.12:0;
 }
 if(layerStack&&modelMode==='reference'){
  for(let i=0;i<layerMeshes.length;i++){
   const layer=layerMeshes[i],target=exploded?.35+i*.23:.24+i*.003;
   if(Math.abs(layer.position.y-target)>.002)layersMoving=true;
   layer.position.y=THREE.MathUtils.lerp(layer.position.y,target,.16);
  }
  for(const group of componentGroups){
   const target=exploded?2.50:0;
   if(Math.abs(group.position.y-target)>.002)layersMoving=true;
   group.position.y=THREE.MathUtils.lerp(group.position.y,target,.16);
  }
  if(!exploded&&!layersMoving)layerStack.visible=false;
 }
 if(routeFocusObject&&focusedVisualRouteId){
  const focusedRoute=VISUAL_ROUTES.find(item=>item.id===focusedVisualRouteId);
  if(focusedRoute){
   const nextY=selectedRouteHeight(focusedRoute.layer);
   if(Math.abs(routeFocusObject.position.y-nextY)>.0001){
    routeFocusObject.position.y=nextY;
    needsRender=true;
   }
  }
 }
 if(selectionHelper?.update&&layersMoving)selectionHelper.update();
 if(cameraMoving||needsRender)updateCamera();
 const draw=visible&&(ambientNow||cameraMoving||layersMoving||needsRender);
 if(draw&&t-lastDraw>=qualityInterval()){
  if(selectionHelper?.update)selectionHelper.update();
  renderer.render(scene,camera);
  lastDraw=t;renderSamples++;totalRenders++;needsRender=false;
 }
 if(!lastSampleTime)lastSampleTime=t;
 if(t-lastSampleTime>=1750){
  actualFPS=Math.round(renderSamples*1000/(t-lastSampleTime));
  renderSamples=0;lastSampleTime=t;
  if(qualityMode==='auto'&&!autoEco&&running&&ambientNow){
   slowWindows=actualFPS<16?slowWindows+1:0;
   if(slowWindows>=2){
    autoEco=true;applyQuality('auto');
    const badge=document.getElementById('qualityToggle');
    if(badge){badge.textContent='AUTO ECO';badge.dataset.mode='eco'}
    window.sparkNotify?.('Auto quality reduced GPU load after slow frame rate');
   }
  }
  const tris=renderer.info.render.triangles;
  fpsLabel.textContent=!running?'GPU IDLE · PAUSED':actualFPS+' FPS · '+(tris/1000).toFixed(1)+'K TRI'+(autoEco?' · ECO':'');
 }
 frames++;
 if(frames%90===0){
  const tris=renderer.info.render.triangles;
  document.getElementById('meshValue').innerHTML=(tris/1000).toFixed(1)+'<span>k</span>';
 }
 }
 requestAnimationFrame(animate);
 const obs=new ResizeObserver(()=>resize());obs.observe(mount);
 window.addEventListener('pagehide',()=>{obs.disconnect();renderer.setAnimationLoop(null)});
}
try{init()}catch(err){fallbackMode(err)}