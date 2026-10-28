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
 if(process.env.TEST_NO_WEBGL==="1"){
  await send("Page.addScriptToEvaluateOnNewDocument",{source:"(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl2')return null;return original.call(this,kind,...args)}})();"});
  await send("Page.navigate",{url:target});
  let state={};
  for(let i=0;i<28;i++){
   await delay(300);
   state=await js("(()=>{const e=document.getElementById('engineLabel'),detail=document.getElementById('routingDetails');return{engine:e?.textContent,routeCount:document.getElementById('routingCount')?.textContent,detailStatus:detail?.dataset.visualPass,warning:document.querySelector('[data-routing-status]')?.dataset.routingStatus}})()");
   if(state.engine==='2D COMPATIBILITY MODE'&&state.routeCount==='224 / 8')break;
  }
  const explorer=await js("window.SPARK_ROUTE_EXPLORER?.getState()||null");
  const pass=state.engine==='2D COMPATIBILITY MODE'&&state.routeCount==='224 / 8'&&state.detailStatus==='true'&&state.warning==='not-verified'&&explorer?.ready===true&&explorer.visibleRoutes===28&&explorer.manufacturingApproved===false;
  console.log("WEBGL_FALLBACK_WITH_ROUTING_AUDIT",JSON.stringify({...state,pass}));
  if(!pass)process.exitCode=2;
  return;
 }
 let good=true;
 for(const screen of [{name:"desktop",width:1440,height:900,mobile:false},{name:"mobile",width:390,height:844,mobile:true},{name:"tablet",width:768,height:1000,mobile:true}]){
  await send("Emulation.setDeviceMetricsOverride",{width:screen.width,height:screen.height,deviceScaleFactor:1,mobile:screen.mobile});
  await send("Page.navigate",{url:target});await delay(350);for(let waited=0;waited<42;waited++){const state=await js("({ready:!!window.SPARK3D?.ready,failed:document.getElementById('engineLabel')?.textContent==='2D COMPATIBILITY MODE'})");if(state.ready||state.failed)break;await delay(400)}
  const r=await js(inspect);
  const nvidiaQA=await js("(()=>{const p=window.SPARK3D.getNvidiaProductInfo(),d=window.SPARK3D.getNvidiaModelDiagnostics(),btn=document.getElementById('modelNvidia');const headline=document.querySelector('.stage-title h2').textContent;return{defaultModel:window.SPARK3D.getModelMode()==='nvidia',visible:d.visible,gpus:d.gpuPackages,cpus:d.cpuPackages,hbmArt:d.hbmArtPackages,config:p.rubinGPUs===2&&p.veraCPUs===1,memory:p.hbm4GB===576,headline:headline.includes('RUBIN'),nvidiaButton:btn?.getAttribute('aria-pressed')==='true',notOfficial:document.querySelector('.nvidia-facts-head')?.textContent.includes('not an official NVIDIA')}})()");
  console.log('VERA_RUBIN_3D',JSON.stringify({screen:screen.name,...nvidiaQA}));
  if(screen.name==='desktop'){
   const snap=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
   fs.writeFileSync(path.join(__dirname,"test-rubin-desktop.png"),Buffer.from(snap.data,"base64"));
  }
  const coolingOn=await js("(()=>{const b=document.getElementById('coolingToggle');b.click();const d=window.SPARK3D.getNvidiaModelDiagnostics();return {button:b.getAttribute('aria-pressed')==='true',plates:d.coldPlateModules,visible:d.coolingVisible,active:d.coolingOn,product:window.SPARK3D.getModelMode()==='nvidia'}})()");
  console.log("VERA_RUBIN_COOLING_ON",JSON.stringify({screen:screen.name,...coolingOn}));
  const coolingFrame=await js("window.SPARK3D.exportSnapshotInfo()");
  console.log("VERA_RUBIN_COOLING_RENDER",JSON.stringify({screen:screen.name,...coolingFrame}));
  if(screen.name==='desktop'){
   const snap=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
   fs.writeFileSync(path.join(__dirname,"test-rubin-cooling.png"),Buffer.from(snap.data,"base64"));
  }
  const coolingOff=await js("(()=>{document.getElementById('coolingToggle').click();const d=window.SPARK3D.getNvidiaModelDiagnostics();return {plates:d.coldPlateModules,hidden:d.coolingVisible===0,off:d.coolingOn===false}})()");
  console.log("VERA_RUBIN_COOLING_OFF",JSON.stringify({screen:screen.name,...coolingOff}));
  const switches=await js("(()=>{document.getElementById('modelReference').click();const old=window.SPARK3D.getModelMode()==='reference';document.getElementById('modelNvidia').click();const latest=window.SPARK3D.getModelMode()==='nvidia';return{old,latest}})()");
  console.log('MODEL_SWITCH',JSON.stringify({screen:screen.name,...switches}));


  const rackQA=await js("(()=>{const b=document.getElementById('modelRack');b.click();const d=window.SPARK3D.getRackDiagnostics();const c=d.counts;const v=window.SPARK3D.getRackViewDiagnostics();const state={cameraCentered:Math.abs(v.cameraTargetY-3.65)<.03&&v.cameraDistance>=19.5,isRack:window.SPARK3D.getModelMode()==='rack',pressed:b.getAttribute('aria-pressed')==='true',visible:d.visible,allRows:d.renderedTrays===33,powerShelves:c.powerShelves===4,physicalPowerShape:d.powerShelfVisualHeightRatio>2.5,compute:c.computeTrays===18,switches:c.switchTrays===9,tor:c.managementTorSwitches===2,gpus:c.aggregateGpus===72,cpus:c.aggregateCpus===36,asics:c.aggregateNvSwitchAsics===36,renderedGPUs:d.gpuIndicators===72,renderedCPUs:d.cpuIndicators===36,rackTitle:document.querySelector('.stage-title h2')?.textContent.includes('NVL72'),factsTitle:document.getElementById('productFactsTitle')?.textContent.includes('18 compute trays'),coolingDisabled:document.getElementById('coolingToggle').disabled,explosionDisabled:document.getElementById('explodeToggle').disabled,notForManufacture:!d.manufacturingApproved&&d.notActualRackGeometry};document.getElementById('inspectCore').click();state.inspector=document.getElementById('partType').textContent.includes('COMPUTE TRAY');return state})()");
  console.log("NVL72_RACK_ARCHITECTURE",JSON.stringify({screen:screen.name,...rackQA}));

  const rackInventoryQA=await js("(()=>{const e=document.getElementById('rackTrayExplorer'),select=document.getElementById('rackTraySelect');const all=window.SPARK3D.getRackTrays();const counts={power:all.filter(t=>t.kind==='power').length,compute:all.filter(t=>t.kind==='compute').length,nvlink:all.filter(t=>t.kind==='nvlink').length,tor:all.filter(t=>t.kind==='tor').length};select.value='NVIDIA / NVL72 POWER SHELF 04';select.dispatchEvent(new Event('change'));const power={inspected:document.getElementById('partName').textContent.endsWith('POWER SHELF 04'),info:document.getElementById('rackTrayDetails').textContent.includes('110 kW')&&document.getElementById('rackTrayDetails').textContent.includes('54 V'),height:window.SPARK3D.getRackTrays().find(t=>t.part===select.value)?.height>.5};select.value='NVIDIA / NVL72 COMPUTE TRAY 02';select.dispatchEvent(new Event('change'));const compute=select.value.includes('TRAY 02')&&document.getElementById('rackTrayDetails').textContent.includes('ConnectX-9')&&document.getElementById('rackTrayDetails').textContent.includes('BlueField-4');document.getElementById('rackTrayNext').click();const next=select.value==='NVIDIA / NVL72 COMPUTE TRAY 03';document.getElementById('rackTrayPrev').click();const prev=select.value==='NVIDIA / NVL72 COMPUTE TRAY 02';select.value='NVIDIA / NVL72 NVLINK SWITCH TRAY 03';select.dispatchEvent(new Event('change'));const nvlink=select.value.endsWith('TRAY 03')&&document.getElementById('rackTrayDetails').textContent.includes('72 NVLink 6 ports per ASIC');return {visible:!e.hidden,options:select.options.length===33,counts:counts.power===4&&counts.compute===18&&counts.nvlink===9&&counts.tor===2,power:power.inspected&&power.info&&power.height,compute,next,prev,nvlink}})()");
  console.log("NVL72_RACK_TRAY_NAVIGATION",JSON.stringify({screen:screen.name,...rackInventoryQA}));

  if(screen.name==='desktop'){
   await js("(()=>{const s=document.getElementById('rackTraySelect');s.value='NVIDIA / NVL72 COMPUTE TRAY 02';s.dispatchEvent(new Event('change'));document.getElementById('rackServiceDrawer').click()})()");
   await delay(420);
   const pullFrame=await js("window.SPARK3D.exportSnapshotInfo()");
   console.log("RACK_SERVICE_TRAY_IMAGE",JSON.stringify(pullFrame));
   const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
   fs.writeFileSync(path.join(__dirname,"test-nvl72-pullout.png"),Buffer.from(shot.data,"base64"));
   await js("document.getElementById('rackServiceDrawer').click()");
  }
  const rackServiceQA=await js("(()=>{const sel=document.getElementById('rackTraySelect'),btn=document.getElementById('rackServiceDrawer'),rear=document.getElementById('rackRearView'),api=window.SPARK3D;function choose(part){sel.value=part;sel.dispatchEvent(new Event('change'))}choose('NVIDIA / NVL72 COMPUTE TRAY 02');btn.click();let st=api.getRackServiceState();const compute=st.open&&st.kind==='compute'&&st.counts.gpu===4&&st.counts.cpu===2&&st.counts.storage===5&&st.projectionOffsetZ>1&&st.maintenanceInstructions===false;const button=btn.getAttribute('aria-pressed')==='true'&&btn.textContent.includes('CLOSE');const fd=api.getRackViewDiagnostics();const focused=fd.serviceFocusY!==null&&Math.abs(fd.cameraDistance-12.7)<.05;choose('NVIDIA / NVL72 COMPUTE TRAY 03');const switchesClose=!api.getRackServiceState().open&&btn.getAttribute('aria-pressed')==='false'&&api.getRackViewDiagnostics().serviceFocusY===null;choose('NVIDIA / NVL72 NVLINK SWITCH TRAY 03');btn.click();st=api.getRackServiceState();const nvlink=st.open&&st.counts.nvSwitch===4;btn.click();choose('NVIDIA / NVL72 POWER SHELF 04');btn.click();st=api.getRackServiceState();const power=st.open&&st.counts.psu===6;btn.click();choose('NVIDIA / NVL72 TOR SWITCH 01');btn.click();st=api.getRackServiceState();const tor=st.open&&st.kind==='tor';rear.click();const rearGuard=!api.getRackServiceState().open&&btn.disabled;rear.click();const reset=!btn.disabled&&!api.getRackServiceState().open;return{compute,button,focused,switchesClose,nvlink,power,tor,rearGuard,reset}})()");
  console.log("NVL72_TRAY_PULL_OUT",JSON.stringify({screen:screen.name,...rackServiceQA}));

  const rackCamera=await js("(()=>{document.getElementById('viewTop').click();const t=window.SPARK3D.getCameraState();document.getElementById('viewIso').click();const iso=window.SPARK3D.getCameraState();document.getElementById('zoomOut').click();const zoom=window.SPARK3D.getCameraState();document.getElementById('resetView').click();const reset=window.SPARK3D.getCameraState();return{top:t.elevation>1.5,iso:Math.abs(iso.distance-23.3)<.01&&Math.abs(iso.elevation-.24)<.01,zoomOut:zoom.distance>iso.distance,reset:Math.abs(reset.distance-23.3)<.01}})()");
  console.log("NVL72_RACK_CAMERA_CONTROLS",JSON.stringify({screen:screen.name,...rackCamera}));
  const rackDetailQA=await js("(()=>{const d=window.SPARK3D.getRackDiagnostics(),b=document.getElementById('rackRearView');b.click();const back=window.SPARK3D.getRackRear()&&b.getAttribute('aria-pressed')==='true'&&window.SPARK3D.getCameraState().azimuth>Math.PI;b.click();const front=!window.SPARK3D.getRackRear()&&window.SPARK3D.getCameraState().azimuth<.5;return {metallic:d.facade==='champagne-metallic-with-dense-grilles',rearParts:d.rearComponents>=30,instanced:d.instancedDetails>=7,back,front}})()");
  console.log("NVL72_PHYSICAL_VISUAL_DETAIL",JSON.stringify({screen:screen.name,...rackDetailQA}));
  await js("document.getElementById('rackRearView').click()");
  await delay(420);
  const rackRearFrame=await js("window.SPARK3D.exportSnapshotInfo()");
  if(screen.name==='desktop'){
   const rearSnap=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
   fs.writeFileSync(path.join(__dirname,"test-nvl72-rack-rear.png"),Buffer.from(rearSnap.data,"base64"));
  }
  await js("document.getElementById('rackRearView').click()");
  console.log("NVL72_REAR_VIEW_PNG",JSON.stringify({screen:screen.name,...rackRearFrame}));

  const rackFrame=await js("window.SPARK3D.exportSnapshotInfo()");
  console.log("NVL72_RACK_RENDER",JSON.stringify({screen:screen.name,...rackFrame}));
  if(screen.name==='desktop'){
   const snap=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
   fs.writeFileSync(path.join(__dirname,"test-nvl72-rack.png"),Buffer.from(snap.data,"base64"));
  }
  const rackReturn=await js("(()=>{document.getElementById('modelNvidia').click();return {nvidia:window.SPARK3D.getModelMode()==='nvidia',coolingEnabled:!document.getElementById('coolingToggle').disabled,explosionEnabled:!document.getElementById('explodeToggle').disabled}})()");
  console.log("NVL72_RETURN_TO_SUPERCHIP",JSON.stringify({screen:screen.name,...rackReturn}));
  const panelHiddenAfterSwitch=await js("document.getElementById('rackTrayExplorer').hidden");
  console.log("RACK_PANEL_MODE_GUARD",JSON.stringify({screen:screen.name,hidden:panelHiddenAfterSwitch}));

  const nvidiaExplode=await js("(()=>{const b=document.getElementById('explodeToggle');b.click();const ex=window.SPARK3D.getNvidiaModelDiagnostics();const ys=ex.assemblyHeights;const gpu=ys.find(x=>x.name.includes('RUBIN GPU'));const cpu=ys.find(x=>x.name.includes('VERA CPU'));const mem=ys.find(x=>x.name.includes('HBM4'));const tiers=gpu?.y>cpu?.y&&cpu?.y>mem?.y&&mem?.y>0;b.click();const cleared=window.SPARK3D.getNvidiaModelDiagnostics().assemblyHeights.every(x=>x.y===0);return{tiers,cleared}})()");
  console.log('NVIDIA_SUPERCHIP_EXPLODE',JSON.stringify({screen:screen.name,...nvidiaExplode}));

  const qaBanner=await js("(()=>{const e=document.querySelector('[data-routing-status]');return {present:!!e,status:e?.dataset.routingStatus,clearlyUnverified:e?.textContent.includes('NOT ELECTRICALLY VERIFIED')}})()");
  console.log('ELECTRICAL_DISCLOSURE',JSON.stringify({screen:screen.name,...qaBanner}));
  const routing=await js("window.SPARK3D?.getVisualRoutingAudit?.()||null");
  console.log("VISUAL_ROUTE_CHECK",JSON.stringify({screen:screen.name,...routing}));
  const readiness=await js("(()=>{const details=document.getElementById('routingDetails');details.open=true;const text=document.getElementById('codeLines').textContent;const fields=['routingCount','routingCrossings','routingSpacing'].map(k=>document.getElementById(k).textContent);return{hasDetails:!!details,opens:details.open,counts:fields[0]==='224 / 8',crossings:fields[1]==='0',spacing:fields[2]==='0 / 0',noFakeDRC:!text.includes('verifyDRC()'),showsEngineeringLimit:document.getElementById('routingAuditContent').textContent.includes('No real netlist')}})()");
  console.log("TRUTHFUL_ENGINEERING_UI",JSON.stringify({screen:screen.name,...readiness}));

  const explorer=await js("(()=>{const p=document.getElementById('routeExplorer'),level=document.getElementById('routeExplorerLayer'),corr=document.getElementById('routeExplorerGroup'),svg=document.getElementById('routeExplorerMap');const all=svg.querySelectorAll('[data-route-id]').length===28;level.value='3';level.dispatchEvent(new Event('change'));corr.value='RF';corr.dispatchEvent(new Event('change'));const paths=svg.querySelectorAll('[data-route-id]');const first=paths[0];first?.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));const selected=first?.getAttribute('aria-pressed')==='true';const linked=window.SPARK3D?.getFocusedVisualRoute?.()===first?.getAttribute('data-route-id');level.value='2';level.dispatchEvent(new Event('change'));const cleared=window.SPARK3D?.getFocusedVisualRoute?.()===null;level.value='3';level.dispatchEvent(new Event('change'));corr.value='RF';corr.dispatchEvent(new Event('change'));return {linked,cleared,ready:p.dataset.ready==='true',all,filtered:paths.length===7,selected,layer:p.dataset.layer==='3',group:p.dataset.corridor==='RF',visualOnly:window.SPARK_ROUTE_EXPLORER?.getState().manufacturingApproved===false}})()");
  console.log("ROUTE_EXPLORER",JSON.stringify({screen:screen.name,...explorer}));

  const exportQA=await js("(async()=>{const api=window.SPARK_ROUTE_EXPLORER,files=api.getExports(),j=JSON.parse(files.json);const a=HTMLAnchorElement.prototype.click,make=URL.createObjectURL,seen=[],created=[];const svgDocument=new DOMParser().parseFromString(files.svg,'image/svg+xml');const validSvg=svgDocument.documentElement.localName==='svg'&&!svgDocument.querySelector('parsererror');HTMLAnchorElement.prototype.click=function(){seen.push({name:this.download,href:this.href})};URL.createObjectURL=blob=>{created.push(blob);return 'blob:visual-e2e-'+seen.length};try{document.getElementById('routeExplorerExportSvg').click();document.getElementById('routeExplorerExportJson').click()}finally{HTMLAnchorElement.prototype.click=a;URL.createObjectURL=make}const binary=await Promise.all(created.map(b=>b.text()));return{validSvg,downloadContentsMatch:created.length===2&&binary[0]===files.svg&&binary[1]===files.json,svgContainsDisclaimer:files.svg.includes('NOT FOR FABRICATION'),jsonContainsDisclaimer:j.disclaimer.includes('NOT FOR FABRICATION'),isNotManufacturing:j.manufacturingApproved===false&&j.electricalVerification===false&&j.kiCadDRC===false,svgPaths:(files.svg.match(/<polyline\\b/g)||[]).length,jsonPaths:j.visualRouteCount,triggered:seen.length===2,fileNames:seen.map(x=>x.name),correctNames:seen[0]?.name.endsWith('.svg')&&seen[1]?.name.endsWith('.json')&&seen.every(x=>x.name.includes('NOT-FOR-FAB'))}})()");
  console.log("VISUAL_FILE_EXPORT",JSON.stringify({screen:screen.name,...exportQA}));

  const drilled=await js("window.SPARK3D?.getBoardDiagnostics?.()||null");
  console.log("PCB_DRILLED_HOLES",JSON.stringify({screen:screen.name,...drilled}));
  await delay(400);
  const firstFrame=await js("window.SPARK3D.exportSnapshotInfo()");
  console.log("EARLY_GPU_SYNC_FRAME",JSON.stringify({screen:screen.name,...firstFrame}));
  const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
  fs.writeFileSync(path.join(__dirname,"test-"+screen.name+".png"),Buffer.from(shot.data,"base64"));
  const layerFocus=await js("(()=>{const l=document.getElementById('routeExplorerLayer'),g=document.getElementById('routeExplorerGroup');l.value='5';l.dispatchEvent(new Event('change'));g.value='RF';g.dispatchEvent(new Event('change'));document.querySelector('#routeExplorerMap [data-route-id]')?.dispatchEvent(new MouseEvent('click',{bubbles:true}));const d=window.SPARK3D.getFocusedRouteDiagnostics();return {found:d.overlayPresent,layer:d.layer,initialHeight:d.projectionY,exactPolyline:d.exactPolyline,collapsed:!d.exploded,id:d.id}})()");
  console.log("FOCUSED_LAYER_BASELINE",JSON.stringify({screen:screen.name,...layerFocus}));
  const controls=await js("(()=>{const first=document.querySelector('.metric-card[data-stat=fable]');first.click();document.getElementById('viewTop').click();document.getElementById('layersToggle').click();document.getElementById('zoomIn').click();return{selected:first.classList.contains('selected'),top:document.getElementById('viewTop').classList.contains('active'),layers:document.getElementById('layersToggle').getAttribute('aria-pressed'),model:!!window.SPARK3D?.ready}})()");

  const advanced=await js("(()=>{document.getElementById('inspectCore').click();const shown=!document.getElementById('partInspector').hidden&&document.getElementById('partName').textContent==='SPARK / FABLE CORE';document.getElementById('viewIso').click();const iso=document.getElementById('viewIso').getAttribute('aria-pressed')==='true';document.getElementById('layersToggle').click();document.getElementById('explodeToggle').click();const exploded=document.getElementById('explodeToggle').getAttribute('aria-pressed')==='true';document.getElementById('closeInspector').click();const closed=document.getElementById('partInspector').hidden;return{shown,exploded,iso,closed,captureAvailable:typeof window.SPARK3D?.capture==='function'}})()");
  if(screen.name==="mobile"){await delay(1100);const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(path.join(__dirname,"test-mobile-exploded.png"),Buffer.from(image.data,"base64"));}
  console.log("ADVANCED",JSON.stringify({...screen,advanced}));
  await delay(320);
  const layerSync=await js("(()=>{const d=window.SPARK3D.getFocusedRouteDiagnostics();return {layer:d.layer,exploded:d.exploded,overlay:d.overlayPresent,aligned:d.projectionY!==null&&d.planeY!==null&&Math.abs(d.projectionY-d.planeY-.035)<.007,projectionY:d.projectionY,planeY:d.planeY}})()");
  console.log("FOCUSED_LAYER_EXPLODE_SYNC",JSON.stringify({screen:screen.name,...layerSync}));
  await js("document.getElementById('explodeToggle').click()");
  await delay(180);
  const collapsedLayer=await js("(()=>{const d=window.SPARK3D.getFocusedRouteDiagnostics();return {layer:d.layer,collapsed:!d.exploded,overlay:d.overlayPresent,returnedToProjection:Math.abs(d.projectionY-.78)<.0001}})()");
  console.log("FOCUSED_LAYER_COLLAPSE_SYNC",JSON.stringify({screen:screen.name,...collapsedLayer}));
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
  const pass=r.scroll<=r.w+2&&r.bodyScroll<=r.w+2&&r.metricLast.right<=r.w+2&&r.metricCount===4&&r.canvas>0&&controls.selected&&controls.top&&controls.layers==="false"&&r.webgl&&Object.values(advanced).every(Boolean)&&exportPng.type==="image/png"&&exportPng.size>25000&&Object.values(quality).every(Boolean)&&perf.fps>0&&gestures.orbit&&gestures.pinch&&gestures.drawCalls>0&&gestures.drawCalls<110&&idle.ok&&newComponents.all&&firstFrame.size>25000&&drilled?.holesPassThroughMask===true&&drilled?.adjacentMaskSolid===true&&drilled?.mountingHoleCount===4&&drilled?.holesPassThroughFR4===true&&drilled?.adjacentFR4Solid===true&&qaBanner.present&&qaBanner.status==='not-verified'&&qaBanner.clearlyUnverified&&routing?.visualGeometryPass===true&&routing?.illustrativeRoutes===224&&routing?.sameLayerIntersections===0&&routing?.sameLayerClearanceWarnings===0&&routing?.fabricationApproved===false&&Object.values(readiness).every(Boolean)&&nvidiaQA.defaultModel&&nvidiaQA.visible&&nvidiaQA.gpus===2&&nvidiaQA.cpus===1&&nvidiaQA.hbmArt>0&&nvidiaQA.config&&nvidiaQA.memory&&nvidiaQA.headline&&nvidiaQA.nvidiaButton&&nvidiaQA.notOfficial&&coolingOn.button&&coolingOn.plates===3&&coolingOn.visible===3&&coolingOn.active&&coolingOn.product&&coolingFrame.type==='image/png'&&coolingFrame.size>25000&&coolingOff.plates===3&&coolingOff.hidden&&coolingOff.off&&switches.old&&switches.latest&&Object.values(rackQA).every(Boolean)&&Object.values(rackInventoryQA).every(Boolean)&&Object.values(rackServiceQA).every(Boolean)&&Object.values(rackCamera).every(Boolean)&&Object.values(rackDetailQA).every(Boolean)&&rackRearFrame.type==='image/png'&&rackRearFrame.size>25000&&rackFrame.type==='image/png'&&rackFrame.size>25000&&Object.values(rackReturn).every(Boolean)&&panelHiddenAfterSwitch&&nvidiaExplode.tiers&&nvidiaExplode.cleared&&Object.values(explorer).every(Boolean)&&exportQA.validSvg&&exportQA.downloadContentsMatch&&exportQA.svgContainsDisclaimer&&exportQA.jsonContainsDisclaimer&&exportQA.isNotManufacturing&&exportQA.svgPaths===7&&exportQA.jsonPaths===7&&exportQA.triggered&&exportQA.correctNames&&layerFocus.found&&layerFocus.layer===5&&layerFocus.collapsed&&layerFocus.initialHeight===.78&&layerFocus.exactPolyline&&layerSync.layer===5&&layerSync.exploded&&layerSync.overlay&&layerSync.aligned&&collapsedLayer.layer===5&&collapsedLayer.collapsed&&collapsedLayer.overlay&&collapsedLayer.returnedToProjection;
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