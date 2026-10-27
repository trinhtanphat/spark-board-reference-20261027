"use strict";
(() => {
const $=id=>document.getElementById(id);
let running=true,motion=true,traces=true,lastTick=Date.now(),elapsed=0,seq=0,toastHandle;
function notify(s){const el=$("toast");el.textContent=s;el.classList.add("show");clearTimeout(toastHandle);toastHandle=setTimeout(()=>el.classList.remove("show"),2800)}
window.sparkNotify=notify;
function esc(s){return s.replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]))}
const referenceLines=[
 "// SPARK / CONCEPTUAL PCB",
 "import { auditIllustrativeGeometry } from './routing/visual-routing.mjs';",
 "",
 "const model = {",
 "  revision: '05',",
 "  type: 'visual demonstration',",
 "  layers: 8,",
 "  schematic: null,",
 "  manufacturerRules: null,",
 "};",
 "",
 "const report = auditIllustrativeGeometry();",
 "if (!report.visualGeometryPass) {",
 "  throw new Error('Visual geometry requires review');",
 "}",
 "",
 "// This is NOT KiCad ERC or DRC",
 "const electricalVerified = false;",
 "const manufacturingApproved = false;",
 "",
 "renderStudioBoard(model);",
 "telemetry.simulate('preview');",
 "console.log('VISUAL PREVIEW READY');"
];
const nvidiaLines=[
 "// NVIDIA VERA RUBIN / PUBLIC ARCHITECTURE",
 "// Unofficial architecture study, not source CAD",
 "",
 "const superchip = {",
 "  gpu: '2 x NVIDIA Rubin',",
 "  cpu: '1 x NVIDIA Vera',",
 "  hbm4: '576 GB total',",
 "  nvfp4: '100 PFLOPS (sparse)',",
 "  interconnect: 'NVLink-C2C',",
 "  layout: 'conceptual only',",
 "};",
 "",
 "// NVL72 = 72 GPU + 36 Vera CPU",
 "// Physical PCB netlist: not disclosed",
 "renderReference(superchip);",
 "console.log('VISUAL PREVIEW READY');"
];
let lines=nvidiaLines;
function colorize(s){return esc(s).replace(/(\/\/.*)$/g,'<span class="token-grey">$1</span>').replace(/\b(import|from|const|new|await|true)\b/g,'<span class="token-purple">$1</span>').replace(/\b(Board|Core|MB|webgl2|realtime)\b/g,'<span class="token-green">$1</span>').replace(/(&#39;.*?&#39;|'[^']*')/g,'<span class="token-orange">$1</span>').replace(/\b([0-9]+)\b/g,'<span class="token-blue">$1</span>')}
function renderTerminal(){ $("codeLines").innerHTML=lines.map((s,i)=>'<div class="code-row"><span class="ln">'+String(i+1).padStart(2,"0")+'</span><span class="code-text">'+colorize(s)+'</span></div>').join(""); }
renderTerminal();
let points=Array.from({length:64},(_,i)=>.34+.14*Math.sin(i*.5)+.08*Math.cos(i*.91));
function graph(){points.push(.32+.22*Math.sin(seq*.13)+.07*Math.sin(seq*.59));points.shift();let xStep=316/(points.length-1);const p=points.map((a,i)=>(i===0?"M":"L")+(i*xStep).toFixed(1)+" "+(52-40*a).toFixed(1)).join(" ");$("chartStroke").setAttribute("d",p);$("chartArea").setAttribute("d",p+" L316 58 L0 58 Z")}
function clock(d){return [d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()].map(x=>String(x).padStart(2,"0")).join(":")+" UTC"}
function uptime(t){return [Math.floor(t/3600),Math.floor(t/60)%60,t%60].map(x=>String(x).padStart(2,"0")).join(":")}
function tick(){const now=Date.now();if(running&&!document.hidden){elapsed+=Math.max(0,Math.min((now-lastTick)/1000,2));seq++;graph();$("cpu").textContent=(22+Math.round(8*Math.sin(seq*.34)+4*Math.sin(seq*.9)))+"%";$("cycle").textContent=(1.45+.06*Math.sin(seq*.18)).toFixed(2)+" GHz";$("currentLine").textContent="Ln "+String(13+seq%11).padStart(3,"0")+" · Col 08";$("uptime").textContent=uptime(Math.floor(elapsed));}lastTick=now;$("headerClock").textContent=clock(new Date())}
tick();setInterval(tick,450);
$("toggleRun").addEventListener("click",()=>{running=!running;$("runLabel").textContent=running?"PAUSE":"RESUME";$("toggleRun").setAttribute("aria-pressed",String(running));$("terminalStatus").textContent=running?"VISUAL PREVIEW READY":"SIMULATION PAUSED";window.SPARK3D?.setRunning(running);notify(running?"Live simulation resumed":"Live simulation paused")});
function setView(name){$("viewIso").classList.toggle("active",name==="iso");$("viewTop").classList.toggle("active",name==="top");$("viewIso").setAttribute("aria-pressed",String(name==="iso"));$("viewTop").setAttribute("aria-pressed",String(name==="top"));window.SPARK3D?.setView(name);if(!window.SPARK3D?.ready)notify("Model view available when WebGL initializes")}
$("viewIso").addEventListener("click",()=>setView("iso"));
$("viewTop").addEventListener("click",()=>setView("top"));
$("zoomIn").addEventListener("click",()=>window.SPARK3D?.zoom(-1)||undefined);
$("zoomOut").addEventListener("click",()=>window.SPARK3D?.zoom(1)||undefined);
$("resetView").addEventListener("click",()=>{setView("iso");window.SPARK3D?.reset();notify("Camera reset")});
$("layersToggle").addEventListener("click",()=>{traces=!traces;$("layersToggle").classList.toggle("active",traces);$("layersToggle").setAttribute("aria-pressed",String(traces));$("layersToggle").innerHTML='<span class="pill-indicator"></span> TRACES '+(traces?"ON":"OFF");window.SPARK3D?.showTraces(traces);notify(traces?"Copper traces visible":"Copper traces hidden")});
$("motionToggle").addEventListener("click",()=>{motion=!motion;$("motionToggle").classList.toggle("active",motion);$("motionToggle").setAttribute("aria-pressed",String(motion));$("motionToggle").textContent="✦ MOTION "+(motion?"ON":"OFF");window.SPARK3D?.setMotion(motion);notify("Ambient motion "+(motion?"enabled":"disabled"))});
const stats={mesh:["GEOMETRY","12.1k triangles in the reference assembly. This is a simulated metric."],fable:["NEURAL CORE","FABLE core confidence 0.97. Simulated dashboard data."],flash:["MEMORY","32 MB flash. No live hardware connection."],post:["SIMULATED PREVIEW SCORE","No physical POST performed. This is demo-only telemetry."]};
document.querySelectorAll(".metric-card").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".metric-card").forEach(el=>{const on=el===btn;el.classList.toggle("selected",on);el.setAttribute("aria-pressed",String(on))});const [name,desc]=stats[btn.dataset.stat]||["SYSTEM",""];notify(name+" · "+desc);window.SPARK3D?.highlight(btn.dataset.stat)}));
$("sceneMount").addEventListener("keydown",ev=>{if(ev.key==="ArrowLeft")window.SPARK3D?.nudge(-1,0);if(ev.key==="ArrowRight")window.SPARK3D?.nudge(1,0);if(ev.key==="ArrowUp")window.SPARK3D?.nudge(0,1);if(ev.key==="ArrowDown")window.SPARK3D?.nudge(0,-1)});
$("sceneMount").tabIndex=0;

const modelDescriptions={
 "NVIDIA / RUBIN GPU A":["NVIDIA RUBIN GPU · 1 / 2","Reference for the first Rubin GPU. NVIDIA publishes 288 GB HBM4 per Rubin GPU; this package geometry is artistic."],
 "NVIDIA / RUBIN GPU B":["NVIDIA RUBIN GPU · 2 / 2","Reference for the second Rubin GPU in the Vera Rubin Superchip. Not an official NVIDIA CAD file."],
 "NVIDIA / VERA CPU":["NVIDIA VERA CPU","NVIDIA Vera CPU: 88 custom Olympus cores, with NVLink-C2C to GPUs. Position and dimensions are illustrative."],
 "NVIDIA / HBM4 MEMORY":["HBM4 MEMORY (CONCEPT)","HBM4 placement and individual package counts are illustrative; not copied from NVIDIA's production board."]
};
const parts={
"SPARK / FABLE CORE":["U1 / SYSTEM CORE","Central FABLE 5.1 processing package with simulated memory bus and high-density solder contacts."],
"RF / 24":["U2 / RADIO FRONT END","Illustrative 2.4 GHz radio-frequency package and signal routing network."],
"NPU / 05":["U3 / NEURAL PROCESSOR","Illustrative co-processor package paired with simulated neural inference diagnostics."],
"SOC / IO":["U4 / I/O CONTROLLER","I/O package illustrating peripheral, GPIO and JTAG signal access."],
"FLASH / 32":["U5 / MEMORY","32 MB memory package and simulated firmware image storage."],
"L1 / POWER INDUCTOR":["L1 / MAGNETIC COMPONENT","Ferrite-cored switch-mode inductor with copper winding, modeled as a visual engineering reference."],
"Y1 / 16 MHz CRYSTAL":["Y1 / CLOCK SOURCE","Surface-mount quartz oscillator housing with stamped metal can."],
"J1 / USB TYPE-C":["J1 / USB-C RECEPTACLE","Board-edge connector with plated metallic shield and an inset contact tongue."],
"J2 / DEBUG HEADER":["J2 / JTAG / DEBUG","2-by-5 plated pin-header, representative debug port arrangement."],
"SW1 / RESET":["SW1 / TACTILE SWITCH","Small surface-mount reset push switch and metal actuator."],
"U6 / POWER MANAGEMENT":["U6 / REGULATOR","Power-management shield can, modeled for the studio assembly."]
};
window.sparkInspectPart=name=>{
 const [type,desc]=modelDescriptions[name]||parts[name]||["PCB / COMPONENT","Illustrative printed-circuit-board component."];
 $("partInspector").hidden=false;$("partType").textContent=type;$("partName").textContent=name;$("partDescription").textContent=desc;
};
$("inspectCore").addEventListener("click",()=>{
 if(!window.SPARK3D?.ready){notify("3D model is still loading");return}
 window.SPARK3D.selectPart(window.SPARK3D.getModelMode?.()==="nvidia"?"NVIDIA / RUBIN GPU A":"SPARK / FABLE CORE");
});
$("closeInspector").addEventListener("click",()=>{ $("partInspector").hidden=true;window.SPARK3D?.clearSelection() });
let exploded=false;
$("explodeToggle").addEventListener("click",()=>{
 exploded=!exploded;$("explodeToggle").classList.toggle("active",exploded);
 $("explodeToggle").setAttribute("aria-pressed",String(exploded));
 $("explodeToggle").textContent=exploded?"⫶ ASSEMBLE":window.SPARK3D?.getModelMode?.()==="nvidia"?"⫶ EXPLODE MODULE":"⫶ EXPLODE 8L";
 window.SPARK3D?.setExploded(exploded);
 notify(exploded?(window.SPARK3D?.getModelMode?.()==="nvidia"?"Superchip concept exploded":"Exploded view · 8 conceptual signal layers"):"Assembly restored");
});


const viewButtons={nvidia:$("modelNvidia"),reference:$("modelReference")};
function updateModelView(mode){
 lines=mode==="nvidia"?nvidiaLines:referenceLines;
 renderTerminal();
 for(const [key,button] of Object.entries(viewButtons)){
  button.classList.toggle("active",key===mode);
  button.setAttribute("aria-pressed",String(key===mode));
 }
 document.querySelector(".stage-title h2").innerHTML=mode==="nvidia"?
  'VERA <span>RUBIN</span><span class="h2-suffix"> / 2026</span>':
  'THE BARE <span>BOARD</span><span class="h2-suffix"> / 05</span>';
 document.querySelector(".stage-title p").textContent=mode==="nvidia"?
  "2 Rubin GPUs · 1 Vera CPU · HBM4 memory":"Matte FR-4 · plated copper · assembly concept";
 document.querySelector(".label-a").textContent=mode==="nvidia"?"MODEL / VERA RUBIN":"MODEL / SPARK S3";
 $("explodeToggle").textContent=exploded?"⫶ ASSEMBLE":mode==="nvidia"?"⫶ EXPLODE MODULE":"⫶ EXPLODE 8L";
 $("layersToggle").disabled=mode==="nvidia";
 $("coolingToggle").disabled=mode!=="nvidia";
 $("coolingToggle").setAttribute("aria-pressed",String(Boolean(window.SPARK3D?.getNvidiaCooling?.())));
 $("inspectCore").setAttribute("aria-label",mode==="nvidia"?"Inspect NVIDIA Rubin GPU":"Inspect SPARK core");
}
for(const [mode,button] of Object.entries(viewButtons))button.addEventListener("click",()=>{
 window.SPARK3D?.setModelMode?.(mode);
 updateModelView(mode);
 notify(mode==="nvidia"?"Vera Rubin concept active":"SPARK PCB reference active");
});
document.addEventListener("spark:model-mode-change",ev=>updateModelView(ev.detail.mode));
$("coolingToggle").addEventListener("click",()=>{
 if(window.SPARK3D?.getModelMode?.()!=="nvidia")return;
 const on=!window.SPARK3D.getNvidiaCooling();
 window.SPARK3D.setNvidiaCooling(on);
 $("coolingToggle").textContent=on?"COOLING / ON":"COOLING / OFF";
 $("coolingToggle").setAttribute("aria-pressed",String(on));
 notify(on?"Conceptual liquid cold plates visible (not official CAD)":"Showing exposed Rubin/Vera chip packages");
});

const qualityLevels=["auto","eco","ultra"];
$("qualityToggle").addEventListener("click",()=>{
 const current=window.SPARK3D?.getQuality?.()||"auto";
 const next=qualityLevels[(qualityLevels.indexOf(current)+1)%qualityLevels.length];
 $("qualityToggle").textContent=next.toUpperCase();
 $("qualityToggle").dataset.mode=next;
 window.SPARK3D?.setQuality(next);
 notify("3D render quality: "+next.toUpperCase()+(next==="eco"?" · power-saving mode":""));
});
setTimeout(()=>{
 if(!window.SPARK3D&&$("engineLabel").textContent==="INITIALIZING 3D"){
  $("engineLabel").textContent="3D MODULE LOADING";
  $("fpsLabel").textContent="CHECKING GPU / CONNECTION";
  document.querySelector(".fallback-note").textContent="WAITING FOR WEBGL MODULE · 2D PREVIEW ACTIVE";
 }
},10000);

$("captureScene").addEventListener("click",()=>{
 if(!window.SPARK3D?.ready){notify("3D capture requires WebGL");return}
 window.SPARK3D.capture();
});
document.addEventListener("keydown",ev=>{
 if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
 if(ev.key==="Escape"){$("partInspector").hidden=true;window.SPARK3D?.clearSelection();}
 if((ev.key==="e"||ev.key==="E")&&!ev.repeat)$("explodeToggle").click();
 if((ev.key==="r"||ev.key==="R")&&!ev.repeat)$("resetView").click();
 if((ev.key==="q"||ev.key==="Q")&&!ev.repeat)$("qualityToggle").click();
});


function renderRoutingDetails(result){
 $("routingCount").textContent=result.illustrativeRoutes+" / "+result.conceptualLayerCount;
 $("routingCrossings").textContent=String(result.sameLayerIntersections);
 $("routingSpacing").textContent=result.sameLayerClearanceWarnings+" / "+result.packageKeepoutWarnings;
 $("routingDetails").dataset.visualPass=String(result.visualGeometryPass);
}
function syncRoutingDetails(){
 const result=window.SPARK3D?.getVisualRoutingAudit?.();
 if(result)renderRoutingDetails(result);
}
document.addEventListener("spark3d:ready",syncRoutingDetails);
// This audit is independent of GPU readiness: it remains accessible in 2D fallback mode.
import("./routing/visual-routing.mjs").then(module=>{
 renderRoutingDetails(module.auditIllustrativeGeometry());
}).catch(()=>{
 $("routingCount").textContent="UNAVAILABLE";
 $("routingCrossings").textContent="UNAVAILABLE";
 $("routingSpacing").textContent="UNAVAILABLE";
 $("routingDetails").dataset.visualPass="false";
});
syncRoutingDetails();

document.addEventListener("visibilitychange",()=>{lastTick=Date.now()});
})();