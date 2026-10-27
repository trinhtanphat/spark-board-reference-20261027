import * as THREE from './vendor/three.module.js';

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
let renderer,scene,camera,root,board,glowGroup,coreGroup,coreIndicator,meshReady=false;
let animating=!prefersReducedMotion,running=true,motion=!prefersReducedMotion,traceVisible=true;
let az=.34,el=.82,dist=13.8,azTarget=az,elTarget=el,distTarget=dist,lastTime=0,frames=0;
let dragged=false,pointer=null,touchStart=null;
let hoverHighlight=null;
const center=new THREE.Vector3(0,0,0);
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
const r=seeded(20261027);
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function makeMat(hex,metal=.35,rough=.42,extra={}){return new THREE.MeshStandardMaterial({color:hex,metalness:metal,roughness:rough,...extra})}
const chassisMat=makeMat('#0a202b',.56,.34), blackMat=makeMat('#101b29',.2,.38), capMat=makeMat('#1b2934',.6,.29);
const metalMat=makeMat('#c8c8b7',.88,.2),copperMat=makeMat('#c49c5f',.8,.27),solderMat=makeMat('#779fa5',.87,.3);
const innerMat=makeMat('#0a141d',.38,.25),ledMat=new THREE.MeshBasicMaterial({color:'#5cffe4'});
function box(parent,w,h,d,mat,x=0,y=0,z=0){const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);obj.position.set(x,y,z);parent.add(obj);return obj}
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
 const c=document.createElement('canvas');c.width=2048;c.height=1260;
 const g=c.getContext('2d'),ww=c.width,hh=c.height;
 const gr=g.createLinearGradient(0,0,ww,hh);gr.addColorStop(0,'#10232e');gr.addColorStop(.4,'#0c1c27');gr.addColorStop(1,'#13212a');g.fillStyle=gr;g.fillRect(0,0,ww,hh);
 g.fillStyle='#1e35402b';for(let i=0;i<33000;i++){const x=r()*ww,y=r()*hh;g.fillRect(x,y,.5+r(),.5+r())}
 // Hairline board grid.
 g.strokeStyle='#48738413';g.lineWidth=1;for(let x=0;x<ww;x+=43){g.beginPath();g.moveTo(x,0);g.lineTo(x,hh);g.stroke()}for(let y=0;y<hh;y+=43){g.beginPath();g.moveTo(0,y);g.lineTo(ww,y);g.stroke()}
 // Guard rings and routing envelopes.
 g.lineWidth=5;g.strokeStyle='#b49a6582';g.strokeRect(40,42,ww-80,hh-84);g.lineWidth=2;g.strokeStyle='#7caaa146';g.strokeRect(65,67,ww-130,hh-134);
 g.lineWidth=1.7;g.strokeStyle='#476d72a0';g.strokeRect(90,90,ww-180,hh-180);
 const centerX=ww*.5,centerY=hh*.51;
 const palettes=['#b08752a8','#b1a06b78','#4d9b9a7a','#4b7b876e','#9876a66b'];
 for(let i=0;i<660;i++){
  const src=r(),side=Math.floor(r()*4),x0=(r()*.97+.015)*ww,y0=(r()*.96+.02)*hh;
  let x1=src>.5?centerX+(r()-.5)*680:x0+(r()-.5)*370;
  let y1=src>.5?centerY+(r()-.5)*540:y0+(r()-.5)*260;
  const mx=x0+(x1-x0)*(.22+r()*.52);const my=y0+(y1-y0)*(.28+r()*.42);
  g.beginPath();g.moveTo(x0,y0);g.lineTo(mx,y0);g.lineTo(mx+(x1>mx?1:-1)*11,my+(y1>y0?1:-1)*11);g.lineTo(x1,my);g.lineTo(x1,y1);
  g.strokeStyle=palettes[side%palettes.length];g.lineWidth=r()>.89?3.5:1.2+r()*1.6;g.stroke();
  if(i%3===0){g.beginPath();g.arc(x0,y0,2+r()*2.5,0,Math.PI*2);g.fillStyle='#b4a37cba';g.fill()}
 }
 // Gold annular vias and exposed copper through holes.
 for(let i=0;i<500;i++){let x=55+r()*(ww-110),y=55+r()*(hh-110),rr=2+r()*4;
  g.beginPath();g.arc(x,y,rr,0,Math.PI*2);g.fillStyle=r()>.25?'#bea16a':'#6d9e9b';g.fill();
  g.beginPath();g.arc(x,y,rr*.5,0,Math.PI*2);g.fillStyle='#071721';g.fill();
 }
 // Fine SMD pads + markings.
 for(let i=0;i<380;i++){const x=100+r()*(ww-200),y=115+r()*(hh-230),a=r()*5+3;g.fillStyle=r()>.43?'#81776694':'#69868893';g.fillRect(x,y,a,2)}
 const pad=(x,y,w,h)=>{g.strokeStyle='#aeb6b05e';g.lineWidth=2;g.strokeRect(x,y,w,h);for(let i=0;i<12;i++){g.fillStyle='#c9b68c80';g.fillRect(x+i*w/12+2,y-8,7,6);g.fillRect(x+i*w/12+2,y+h+2,7,6)}};
 pad(270,170,225,170);pad(1520,170,210,150);pad(210,840,230,170);pad(1530,810,225,175);
 // Silkscreen labelling.
 g.font='700 23px monospace';g.fillStyle='#c6e9dfbb';g.fillText('SPARK / THE BARE BOARD',140,112);g.font='18px monospace';g.fillText('REV 05   ·   8L   ·   2026',140,141);
 g.fillText('PWR_IN     3V3  · GND',100,1158);g.fillText('GPIO 00...31   /   JTAG · USB-C',1270,1160);
 g.fillStyle='#8caeac9a';g.font='700 15px monospace';
 for(let i=0;i<100;i++){g.fillText(['R'+(1+Math.floor(r()*399)),'C'+(1+Math.floor(r()*80)),'TP'+(1+Math.floor(r()*44)),'GND','5V','SCLK'][Math.floor(r()*6)],r()*1960+32,r()*1130+60)}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=16;return tex;
}
function boardShape(){
 const shape=new THREE.Shape(),a=-W/2,b=-D/2,rr=.23;
 shape.moveTo(a+rr,b);shape.lineTo(-a-rr,b);shape.quadraticCurveTo(-a,b,-a,b+rr);shape.lineTo(-a,-b-rr);shape.quadraticCurveTo(-a,-b,-a-rr,-b);shape.lineTo(a+rr,-b);shape.quadraticCurveTo(a,-b,a,-b-rr);shape.lineTo(a,b+rr);shape.quadraticCurveTo(a,b,a+rr,b);
 return shape;
}
function createBoard(){
 board=new THREE.Group();root.add(board);
 const geo=new THREE.ExtrudeGeometry(boardShape(),{depth:.19,bevelEnabled:true,bevelThickness:.035,bevelSize:.045,bevelSegments:3,curveSegments:8,steps:1});geo.rotateX(Math.PI/2);
 const substrate=new THREE.Mesh(geo,[chassisMat,makeMat('#1b4a4e',.5,.36)]);substrate.position.y=.14;substrate.receiveShadow=true;board.add(substrate);
 const texture=circuitTexture();const top=new THREE.Mesh(new THREE.PlaneGeometry(W-.03,D-.03).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:texture,metalness:.33,roughness:.53,side:THREE.DoubleSide}));top.position.y=.183;top.receiveShadow=true;board.add(top);
 // Beveled mounting rings and through holes at the corners.
 for(const x of [-5.3,5.3])for(const z of [-3.05,3.05]){
  const under=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.028,32),solderMat);under.position.set(x,.2,z);board.add(under);
  const cut=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.034,32),new THREE.MeshBasicMaterial({color:'#071018'}));cut.position.set(x,.221,z);board.add(cut);
  pathRing(board,x,.243,z,.185,copperMat);
 }
 // A slim illuminated perimeter, floating a hair above the substrate.
 let pts=[];for(let i=0;i<=200;i++){const t=i/200*Math.PI*2;const x=Math.cos(t)*(W/2-.17),z=Math.sin(t)*(D/2-.17);pts.push(new THREE.Vector3(x,.207,z))}
 const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x55c2aa,transparent:true,opacity:.45}));board.add(outline);
 // 3D pads, exposed stitching vias, solder joints, capacitors and resistors.
 const viaGeo=new THREE.CylinderGeometry(.025,.025,.009,8),viaCount=420;
 const vias=new THREE.InstancedMesh(viaGeo,copperMat,viaCount);
 const tmp=new THREE.Object3D();for(let i=0;i<viaCount;i++){let x=(r()-.5)*(W-.75),z=(r()-.5)*(D-.75);if(Math.abs(x)<1.5&&Math.abs(z)<1.35){x+=Math.sign(x||1)*1.7}tmp.position.set(clamp(x,-5.5,5.5),.208,clamp(z,-3.2,3.2));tmp.rotation.set(0,0,0);tmp.scale.setScalar(.8+r()*.5);tmp.updateMatrix();vias.setMatrixAt(i,tmp.matrix)}vias.instanceMatrix.needsUpdate=true;board.add(vias);
 const resistorGeo=new THREE.BoxGeometry(.16,.075,.09),resistors=new THREE.InstancedMesh(resistorGeo,capMat,150);
 for(let i=0;i<150;i++){let x=(r()-.5)*10.5,z=(r()-.5)*5.9;if(Math.abs(x)<1.3&&Math.abs(z)<1.25)x+=Math.sign(x||1)*1.7;tmp.position.set(x,.253,z);tmp.rotation.set(0,Math.round(r()*3)*Math.PI/2,0);tmp.scale.set(1,.75+r()*.4,1);tmp.updateMatrix();resistors.setMatrixAt(i,tmp.matrix)}resistors.instanceMatrix.needsUpdate=true;board.add(resistors);
 const cylinderGeo=new THREE.CylinderGeometry(.11,.12,.35,18);
 for(const [x,z] of [[-4.1,2.45],[-3.55,2.45],[-3.0,2.45],[3.65,-2.2],[4.2,-2.2],[4.75,-2.2]]){
  const cap=new THREE.Mesh(cylinderGeo,capMat);cap.position.set(x,.39,z);board.add(cap);const top=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.014,18),metalMat);top.position.set(x,.576,z);board.add(top)
 }
 // Textured secondary packages.
 makeChip(-3.7,-1.6,1.4,1.15,'RF / 24',10);
 makeChip(3.55,1.76,1.65,1.25,'NPU / 05',11);
 makeChip(3.77,-.8,1.18,.97,'SOC / IO',9);
 makeChip(-3.65,1.65,1.35,.82,'FLASH / 32',11);
 buildCore();
 buildGlowTraces();
 return board;
}
function makeChip(x,z,w,d,title,pins){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.part=title;board.add(group);
 box(group,w+.17,.08,d+.17,copperMat,0,.238,0);
 const block=box(group,w,.24,d,blackMat,0,.38,0);block.userData.part=title;block.castShadow=true;
 const roof=box(group,w-.10,.013,d-.10,capMat,0,.507,0);roof.userData.part=title;
 flatLabel(group,0,.518,0,w*.86,d*.6,[title,'REV 05'],{width:512,height:200,size:65,color:'#bbcdd3'});
 const n=Math.max(4,pins);
 for(let i=0;i<n;i++){const p=-d/2+(i+.5)*d/n;box(group,.17,.05,.06,metalMat,-w/2-.06,.252,p);box(group,.17,.05,.06,metalMat,w/2+.06,.252,p)}
 return group;
}
function buildCore(){
 coreGroup=new THREE.Group();coreGroup.position.set(.05,0,.1);board.add(coreGroup);
 const x=0,z=0;
 const ground=box(coreGroup,3.05,.13,2.87,metalMat,x,.26,z);ground.userData.part='SPARK / FABLE CORE';
 box(coreGroup,2.91,.045,2.73,innerMat,0,.359,0);
 const chip=box(coreGroup,2.68,.31,2.52,blackMat,x,.529,z);chip.userData.part='SPARK / FABLE CORE';chip.castShadow=true;chip.receiveShadow=true;
 const cover=box(coreGroup,2.43,.01,2.27,makeMat('#132a38',.85,.2),0,.692,0);cover.userData.part='SPARK / FABLE CORE';
 for(let i=0;i<18;i++){const x0=-1.22+(i+.5)*(2.44/18);box(coreGroup,.085,.046,.21,metalMat,x0,.368,-1.39);box(coreGroup,.085,.046,.21,metalMat,x0,.368,1.39)}
 for(let i=0;i<17;i++){const z0=-1.22+(i+.5)*(2.44/17);box(coreGroup,.21,.046,.085,metalMat,-1.52,.368,z0);box(coreGroup,.21,.046,.085,metalMat,1.52,.368,z0)}
 const faceCanvas=document.createElement('canvas');faceCanvas.width=1024;faceCanvas.height=1024;const g=faceCanvas.getContext('2d');
 g.fillStyle='#0c1c29';g.fillRect(0,0,1024,1024);g.strokeStyle='#5caeac7b';g.lineWidth=6;g.strokeRect(26,26,972,972);g.strokeStyle='#a6d8d45e';g.lineWidth=2;g.strokeRect(55,55,914,914);
 for(let i=0;i<15;i++){g.strokeStyle='#356c7060';g.lineWidth=1;g.beginPath();g.moveTo(90+i*60,75);g.lineTo(90+i*60,150);g.moveTo(90+i*60,870);g.lineTo(90+i*60,952);g.stroke()}
 g.fillStyle='#a5fff1';g.font='800 145px Arial';g.textAlign='center';g.fillText('✦',512,354);
 g.font='900 142px Arial';g.fillStyle='#efffff';g.fillText('SPARK',512,535);
 g.font='700 45px monospace';g.fillStyle='#72ddc9';g.fillText('FABLE  5.1  /  S3',512,640);
 g.font='500 27px monospace';g.fillStyle='#719aaa';g.fillText('8L  |  REV 05  |  2026',512,878);
 const faceTex=new THREE.CanvasTexture(faceCanvas);faceTex.colorSpace=THREE.SRGBColorSpace;faceTex.anisotropy=16;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.25).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:faceTex,roughness:.32,metalness:.05}));face.position.y=.705;face.userData.part='SPARK / FABLE CORE';coreGroup.add(face);
 const ringMat=new THREE.MeshBasicMaterial({color:0x69ffe0,transparent:true,opacity:.72});
 for(let i=0;i<4;i++){const edge=box(coreGroup,2.8+i*.1,.008,.013,ringMat,0,.732,1.35+i*.05);edge.material=ringMat}
 coreIndicator=new THREE.PointLight(0x44ffd2,2.0,6,2);coreIndicator.position.set(0,1.8,0);board.add(coreIndicator);
}
function buildGlowTraces(){
 glowGroup=new THREE.Group();board.add(glowGroup);
 const verts=[];for(let i=0;i<150;i++){
  let angle=r()*Math.PI*2,rad=1.85+r()*.9,px=Math.cos(angle)*rad,pz=Math.sin(angle)*rad;
  const ex=(r()-.5)*10.5,ez=(r()-.5)*6.25;const bendX=px+(ex-px)*(.35+r()*.3);
  const bendZ=pz+(ez-pz)*(.35+r()*.3);
  const pts=[[px,.214,pz],[bendX,.214,pz],[bendX,.214,bendZ],[ex,.214,bendZ],[ex,.214,ez]];
  for(let j=1;j<pts.length;j++)verts.push(...pts[j-1],...pts[j]);
 }
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 const lines=new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:0x65d9ca,transparent:true,opacity:.3}));glowGroup.add(lines);
}
function createSky(){
 const stars=[];for(let i=0;i<320;i++){const x=(r()-.5)*23,y=(r()-.5)*11,z=(r()-.5)*22;if(Math.abs(x)<6&&Math.abs(z)<4)continue;stars.push(x,y,z)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
 const material=new THREE.PointsMaterial({color:0x6dacc6,size:.028,transparent:true,opacity:.7,sizeAttenuation:true});scene.add(new THREE.Points(geometry,material));
 const grid=new THREE.GridHelper(26,26,0x244f59,0x16303b);grid.position.y=-1.15;grid.material.opacity=.35;grid.material.transparent=true;scene.add(grid);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(7,.008,4,180),new THREE.MeshBasicMaterial({color:0x2c7479,transparent:true,opacity:.26}));halo.rotation.x=-Math.PI/2;halo.position.y=-.89;scene.add(halo);
}
function updateCamera(hard=false){
 if(hard){az=azTarget;el=elTarget;dist=distTarget}else{az+=(azTarget-az)*.13;el+=(elTarget-el)*.13;dist+=(distTarget-dist)*.13}
 const c=Math.cos(el);camera.position.set(dist*c*Math.sin(az),dist*Math.sin(el),dist*c*Math.cos(az));camera.lookAt(center);
}
function resize(){
 if(!renderer||!camera)return;
 const w=Math.max(2,mount.clientWidth),h=Math.max(2,mount.clientHeight);
 if(w<3||h<3)return;
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<640?42:35;if(root)root.scale.setScalar(w<640?.53:w<860?.82:1);camera.updateProjectionMatrix();
 if(!animating)renderer.render(scene,camera);
}
function notifyPart(name){window.sparkNotify?.('3D COMPONENT · '+name+' · selectable model element')}
function interactions(){
 let down=null;
 mount.addEventListener('pointerdown',e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY};pointer={x:e.clientX,y:e.clientY};dragged=false;mount.setPointerCapture?.(e.pointerId)});
 mount.addEventListener('pointermove',e=>{if(!pointer)return;let dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>1)dragged=true;azTarget-=dx*.007;elTarget=clamp(elTarget+dy*.006,.18,1.55);pointer={x:e.clientX,y:e.clientY}});
 const release=e=>{if(!pointer)return;const didDrag=dragged;pointer=null;if(!didDrag&&down&&meshReady){const rect=renderer.domElement.getBoundingClientRect(),pt=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(pt,camera);const intersections=ray.intersectObjects(board.children,true);const item=intersections.find(v=>v.object.userData.part);if(item)notifyPart(item.object.userData.part)}};
 mount.addEventListener('pointerup',release);mount.addEventListener('pointercancel',()=>{pointer=null});
 mount.addEventListener('wheel',e=>{if(!e.ctrlKey)e.preventDefault();distTarget=clamp(distTarget+Math.sign(e.deltaY)*.5,8.5,21)}, {passive:false});
}
function fallbackMode(err){
 console.warn('[SPARK 3D] WebGL fallback:',err?.message||err);
 meshReady=false;engineLabel.textContent='2D COMPATIBILITY MODE';fpsLabel.textContent='WEBGL NOT AVAILABLE';engineStatus.classList.add('offline');fallback.style.display='grid';fallback.querySelector('.fallback-note').textContent='WEBGL UNAVAILABLE · 2D REFERENCE MODE';window.SPARK3D={ready:false,zoom(){},reset(){},setView(){},nudge(){},highlight(){},setMotion(){},setRunning(){},showTraces(){}};
}
function init(){
 if(!document.createElement('canvas').getContext('webgl2'))throw new Error('WebGL2 unavailable');
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',stencil:false,depth:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.55;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label','Interactive 3D printed circuit board');
 mount.appendChild(renderer.domElement);
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0b1524,.032);
 camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(4.5,8.8,9);
 scene.add(new THREE.AmbientLight(0xa5bdde,1.65));
 const hemi=new THREE.HemisphereLight(0x84d6f5,0x14202b,2);hemi.position.set(0,6,0);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xe7f5ff,3.6);key.position.set(-3,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.bias=-.0003;scene.add(key);
 const cyan=new THREE.PointLight(0x42caff,42,18,2);cyan.position.set(-6,4,-2);scene.add(cyan);
 const violet=new THREE.PointLight(0x7b54ff,48,17,2);violet.position.set(5,4,4);scene.add(violet);
 root=new THREE.Group();scene.add(root);createBoard();createSky();
 updateCamera(true);resize();interactions();
 meshReady=true;engineLabel.textContent='3D ENGINE ACTIVE';fpsLabel.textContent='THREE.JS / PBR MATERIALS';engineStatus.classList.remove('offline');fallback.style.display='none';
 window.SPARK3D={ready:true,
 zoom(dir){distTarget=clamp(distTarget+dir*.8,8.5,21);if(!animating)requestAnimationFrame(()=>{updateCamera(true);renderer.render(scene,camera)})},
 setView(mode){azTarget=mode==='top'?0:.34;elTarget=mode==='top'?1.57:.82;distTarget=mode==='top'?14:13.8;if(!animating)requestAnimationFrame(()=>{updateCamera(true);renderer.render(scene,camera)})},
 reset(){azTarget=.34;elTarget=.82;distTarget=13.8;if(!animating)requestAnimationFrame(()=>{updateCamera(true);renderer.render(scene,camera)})},
 nudge(x,y){azTarget+=x*.14;elTarget=clamp(elTarget+y*.12,.18,1.57)},
 showTraces(show){traceVisible=show;glowGroup.visible=show;coreIndicator.intensity=show?2:0;renderer.render(scene,camera)},
 setMotion(val){motion=val},
 setRunning(val){running=val},
 highlight(kind){coreIndicator.color.set(kind==='fable'?0x9873ff:kind==='flash'?0x60caff:kind==='post'?0xffd288:0x52ffe1);if(!animating)renderer.render(scene,camera)}
 };
 function animate(t){
 requestAnimationFrame(animate);if(!meshReady)return;
 const dt=Math.min(.05,Math.max(0,(t-lastTime)/1000));lastTime=t;
 const visible=!document.hidden,animateNow=visible&&running;
 if(animateNow&&motion){root.rotation.y=Math.sin(t*.00014)*.085;coreIndicator.intensity=1.8+.6*Math.sin(t*.0015)}
 updateCamera();if(visible)renderer.render(scene,camera);
 frames++;if(frames%90===0){const tris=renderer.info.render.triangles;document.getElementById('meshValue').innerHTML=(tris/1000).toFixed(1)+'<span>k</span>';fpsLabel.textContent='THREE.JS · '+tris.toLocaleString()+' TRIS'}
 }
 requestAnimationFrame(animate);
 const obs=new ResizeObserver(()=>resize());obs.observe(mount);
 window.addEventListener('pagehide',()=>{obs.disconnect();renderer.setAnimationLoop(null)});
}
try{init()}catch(err){fallbackMode(err)}
