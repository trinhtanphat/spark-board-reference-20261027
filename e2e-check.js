"use strict";
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),{spawn}=require("node:child_process");
const {setTimeout:delay}=require("node:timers/promises");
const chrome=process.env.CHROME_PATH||"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target=process.env.TARGET_URL||"http://127.0.0.1:8788/";
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"spark-gl-e2e-"));
let child,ws,id=0,pending=new Map(),exceptions=[],consoleErrors=[];
function timeout(n=15000){return new Promise((_,reject)=>setTimeout(()=>reject(new Error("CDP timeout")),n))}
async function send(method,params={}){const mid=++id;return Promise.race([new Promise((resolve,reject)=>{pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}))}),timeout()])}
async function js(expr){const o=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});if(o.exceptionDetails)throw new Error(JSON.stringify(o.exceptionDetails));return o.result.value}
const inspect="(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {width:Math.round(r.width),right:Math.round(r.right),x:Math.round(r.x)}};return {w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,main:q('.main-column'),hero:q('.hero-stage'),sidebar:q('.sidebar'),metricLast:q('.metric-card:last-child'),metricCount:document.querySelectorAll('.metric-card').length,engine:document.getElementById('engineLabel')?.textContent,webgl:!!window.SPARK3D?.ready,canvas:document.querySelector('#sceneMount canvas')?.width||0,chip:document.querySelector('.scene-fallback')?.style.display}})()";
async function main(){try{
 child=spawn(chrome,["--headless=new","--enable-unsafe-swiftshader","--use-angle=swiftshader","--enable-webgl","--disable-background-networking","--no-first-run","--no-default-browser-check","--user-data-dir="+profile,"--remote-debugging-port=0","about:blank"],{windowsHide:true,stdio:"ignore"});
 let port;for(let j=0;j<75;j++){await delay(150);try{port=Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]);if(port)break}catch{}}if(!port)throw new Error("DevTools port missing");
 const tab=await (await fetch("http://127.0.0.1:"+port+"/json/new?about:blank",{method:"PUT"})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);await Promise.race([new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no}),timeout()]);
 ws.onmessage=e=>{const o=JSON.parse(e.data);if(o.id&&pending.has(o.id)){const p=pending.get(o.id);pending.delete(o.id);o.error?p.reject(new Error(o.error.message)):p.resolve(o.result)}if(o.method==="Runtime.exceptionThrown")exceptions.push(o.params.exceptionDetails?.text||"exception");if(o.method==="Runtime.consoleAPICalled"&&o.params.type==="error")consoleErrors.push(o.params.args?.map(x=>x.value||x.description).join(" "))};
 await send("Page.enable");await send("Runtime.enable");
 let good=true;
 for(const screen of [{name:"desktop",width:1440,height:900,mobile:false},{name:"mobile",width:390,height:844,mobile:true},{name:"tablet",width:768,height:1000,mobile:true}]){
  await send("Emulation.setDeviceMetricsOverride",{width:screen.width,height:screen.height,deviceScaleFactor:1,mobile:screen.mobile});
  await send("Page.navigate",{url:target});await delay(350);for(let waited=0;waited<42;waited++){const state=await js("({ready:!!window.SPARK3D?.ready,failed:document.getElementById('engineLabel')?.textContent==='2D COMPATIBILITY MODE'})");if(state.ready||state.failed)break;await delay(400)}
  const r=await js(inspect);
  const qaBanner=await js("(()=>{const e=document.querySelector('[data-routing-status]');return {present:!!e,status:e?.dataset.routingStatus,clearlyUnverified:e?.textContent.includes('NOT ELECTRICALLY VERIFIED')}})()");
  console.log('ELECTRICAL_DISCLOSURE',JSON.stringify({screen:screen.name,...qaBanner}));
  const routing=await js("window.SPARK3D?.getVisualRoutingAudit?.()||null");
  console.log("VISUAL_ROUTE_CHECK",JSON.stringify({screen:screen.name,...routing}));
  const drilled=await js("window.SPARK3D?.getBoardDiagnostics?.()||null");
  console.log("PCB_DRILLED_HOLES",JSON.stringify({screen:screen.name,...drilled}));
  await delay(400);
  const firstFrame=await js("window.SPARK3D.exportSnapshotInfo()");
  console.log("EARLY_GPU_SYNC_FRAME",JSON.stringify({screen:screen.name,...firstFrame}));
  const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
  fs.writeFileSync(path.join(__dirname,"test-"+screen.name+".png"),Buffer.from(shot.data,"base64"));
  const controls=await js("(()=>{const first=document.querySelector('.metric-card[data-stat=fable]');first.click();document.getElementById('viewTop').click();document.getElementById('layersToggle').click();document.getElementById('zoomIn').click();return{selected:first.classList.contains('selected'),top:document.getElementById('viewTop').classList.contains('active'),layers:document.getElementById('layersToggle').getAttribute('aria-pressed'),model:!!window.SPARK3D?.ready}})()");
  const advanced=await js("(()=>{document.getElementById('inspectCore').click();const shown=!document.getElementById('partInspector').hidden&&document.getElementById('partName').textContent==='SPARK / FABLE CORE';document.getElementById('viewIso').click();const iso=document.getElementById('viewIso').getAttribute('aria-pressed')==='true';document.getElementById('layersToggle').click();document.getElementById('explodeToggle').click();const exploded=document.getElementById('explodeToggle').getAttribute('aria-pressed')==='true';document.getElementById('closeInspector').click();const closed=document.getElementById('partInspector').hidden;return{shown,exploded,iso,closed,captureAvailable:typeof window.SPARK3D?.capture==='function'}})()");
  if(screen.name==="mobile"){await delay(1100);const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(path.join(__dirname,"test-mobile-exploded.png"),Buffer.from(image.data,"base64"));}
  console.log("ADVANCED",JSON.stringify({...screen,advanced}));
  const newComponents=await js("(()=>{const parts=['J1 / USB TYPE-C','J2 / DEBUG HEADER','Y1 / 16 MHz CRYSTAL','SW1 / RESET','U6 / POWER MANAGEMENT'];const passed=parts.map(name=>{window.SPARK3D.selectPart(name);const text=document.getElementById('partName').textContent;return text===name});document.getElementById('closeInspector').click();return{passed,all:passed.every(Boolean)}})()");
  console.log("REALISTIC_PART_INSPECTOR",JSON.stringify({screen:screen.name,...newComponents}));
  const quality=await js("(()=>{const q=document.getElementById('qualityToggle');q.click();const eco=q.textContent==='ECO'&&window.SPARK3D.getQuality()==='eco';q.click();const ultra=q.textContent==='ULTRA'&&window.SPARK3D.getQuality()==='ultra';q.click();const auto=q.textContent==='AUTO'&&window.SPARK3D.getQuality()==='auto';return{eco,ultra,auto}})()");
  await delay(2000);
  const perf=await js("({fps:window.SPARK3D?.getFPS?.()||0,status:document.getElementById('engineLabel')?.textContent})");
  console.log("QUALITY",JSON.stringify({screen:screen.name,quality,perf}));
  const gestures=await js("(() => {\n const m=document.getElementById('sceneMount'),b=window.SPARK3D.getCameraState();\n const dispatch=(type,id,x,y)=>m.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:id===10,clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1}));\n dispatch('pointerdown',10,150,320);dispatch('pointermove',10,205,350);dispatch('pointerup',10,205,350);\n const rotated=window.SPARK3D.getCameraState(),orbit=Math.abs(rotated.azimuth-b.azimuth)>.1;\n dispatch('pointerdown',10,110,340);dispatch('pointerdown',11,210,340);\n const d0=window.SPARK3D.getCameraState().distance;\n dispatch('pointermove',11,260,340);const d1=window.SPARK3D.getCameraState().distance;\n dispatch('pointerup',10,110,340);dispatch('pointerup',11,260,340);\n return{orbit,pinch:d1<d0,drawCalls:window.SPARK3D.getRenderStats().drawCalls,geometryCount:window.SPARK3D.getRenderStats().geometryCount,cameraDistance:d1};\n})()");
  console.log("GPU_TOUCH",JSON.stringify({screen:screen.name,...gestures}));
  const exportPng=await js("window.SPARK3D.exportSnapshotInfo()");
  console.log("EXPORT",JSON.stringify({screen:screen.name,...exportPng}));
  let idle={ok:true,skipped:true};
  if(screen.name==="desktop"){
   await js("document.getElementById('toggleRun').click()");
   await delay(2100);
   const before=await js("window.SPARK3D.getRenderCount()");
   await delay(1300);
   const after=await js("window.SPARK3D.getRenderCount()");
   await js("window.SPARK3D.zoom(-1)");
   await delay(650);
   const wake=await js("window.SPARK3D.getRenderCount()");
   await js("document.getElementById('toggleRun').click()");
   const resumed=await js("document.getElementById('runLabel').textContent==='PAUSE'");
   idle={before,after,wake,resumed,ok:after-before<=2&&wake>after&&resumed};
   console.log("GPU_IDLE",JSON.stringify(idle));
  }
  const pass=r.scroll<=r.w+2&&r.bodyScroll<=r.w+2&&r.metricLast.right<=r.w+2&&r.metricCount===4&&r.canvas>0&&controls.selected&&controls.top&&controls.layers==="false"&&r.webgl&&Object.values(advanced).every(Boolean)&&exportPng.type==="image/png"&&exportPng.size>25000&&Object.values(quality).every(Boolean)&&perf.fps>0&&gestures.orbit&&gestures.pinch&&gestures.drawCalls>0&&gestures.drawCalls<110&&idle.ok&&newComponents.all&&firstFrame.size>25000&&drilled?.holesPassThroughMask===true&&drilled?.adjacentMaskSolid===true&&drilled?.mountingHoleCount===4&&drilled?.holesPassThroughFR4===true&&drilled?.adjacentFR4Solid===true&&qaBanner.present&&qaBanner.status==='not-verified'&&qaBanner.clearlyUnverified&&routing?.visualGeometryPass===true&&routing?.illustrativeRoutes===224&&routing?.sameLayerIntersections===0&&routing?.sameLayerClearanceWarnings===0&&routing?.fabricationApproved===false;
  good=good&&pass;
  console.log("VIEWPORT",JSON.stringify({...screen,pass,inspected:r,controls}));
 }
 if(process.env.TEST_WEBGL_RECOVERY==="1"){
  const supported=await js("(()=>{const gl=document.querySelector('#sceneMount canvas')?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;window.__sparkRecoveryExt=ext;ext.loseContext();return true})()");
  if(supported){
   await delay(1100);
   const lost=await js("({ready:window.SPARK3D?.ready,status:document.getElementById('engineLabel')?.textContent})");
   await js("window.__sparkRecoveryExt.restoreContext()");
   let restored=false;
   for(let k=0;k<38;k++){await delay(350);const v=await js("({ready:!!window.SPARK3D?.ready,status:document.getElementById('engineLabel')?.textContent})");if(v.ready&&v.status==='3D ENGINE ACTIVE'){restored=true;break}}
   console.log("WEBGL_RECOVERY",JSON.stringify({supported,lost,restored}));
   if(lost.ready!==false||!restored)good=false;
  }else{console.log("WEBGL_RECOVERY","SKIPPED (extension unavailable)")}
 }
 console.log("JS_EXCEPTIONS",JSON.stringify(exceptions));console.log("CONSOLE_ERRORS",JSON.stringify(consoleErrors));console.log("RESULT",good&&exceptions.length===0&&consoleErrors.length===0?"PASS":"FAIL");
 if(!good||exceptions.length||consoleErrors.length)process.exitCode=2;
}finally{try{ws?.close()}catch{};try{child?.kill()}catch{};setTimeout(()=>{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}},1000)}}
main().catch(err=>{console.error("E2E_ERROR",err.stack||err.message);process.exitCode=2;try{child?.kill()}catch{}});