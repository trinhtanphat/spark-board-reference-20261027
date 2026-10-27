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
  const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
  fs.writeFileSync(path.join(__dirname,"test-"+screen.name+".png"),Buffer.from(shot.data,"base64"));
  const controls=await js("(()=>{const first=document.querySelector('.metric-card[data-stat=fable]');first.click();document.getElementById('viewTop').click();document.getElementById('layersToggle').click();document.getElementById('zoomIn').click();return{selected:first.classList.contains('selected'),top:document.getElementById('viewTop').classList.contains('active'),layers:document.getElementById('layersToggle').getAttribute('aria-pressed'),model:!!window.SPARK3D?.ready}})()");
  const pass=r.scroll<=r.w+2&&r.bodyScroll<=r.w+2&&r.metricLast.right<=r.w+2&&r.metricCount===4&&r.canvas>0&&controls.selected&&controls.top&&controls.layers==="false"&&r.webgl;
  good=good&&pass;
  console.log("VIEWPORT",JSON.stringify({...screen,pass,inspected:r,controls}));
 }
 console.log("JS_EXCEPTIONS",JSON.stringify(exceptions));console.log("CONSOLE_ERRORS",JSON.stringify(consoleErrors));console.log("RESULT",good&&exceptions.length===0&&consoleErrors.length===0?"PASS":"FAIL");
 if(!good||exceptions.length||consoleErrors.length)process.exitCode=2;
}finally{try{ws?.close()}catch{};try{child?.kill()}catch{};setTimeout(()=>{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}},1000)}}
main().catch(err=>{console.error("E2E_ERROR",err.stack||err.message);process.exitCode=2;try{child?.kill()}catch{}});
