'use strict';
// Isolated Chrome DevTools Protocol smoke tests; does not interact with user browser sessions.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const {setTimeout:delay}=require('node:timers/promises');
const chrome=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const target=process.env.TARGET_URL||'http://127.0.0.1:8788/';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spark-cdp-'));
let child,ws,nextId=0,pending=new Map(),exceptions=[];
function timeout(ms=12000){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('CDP_TIMEOUT')),ms))}
async function send(method,params={}){let id=++nextId;return Promise.race([new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))}),timeout()])}
async function evalJS(expression){let res=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(res.exceptionDetails)throw new Error(JSON.stringify(res.exceptionDetails));return res.result.value}
const metricExpression="(() => { const q=s=>{let e=document.querySelector(s),r=e?.getBoundingClientRect();return r?{x:Math.round(r.left),w:Math.round(r.width),right:Math.round(r.right)}:null};return {innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,devicePixelRatio:devicePixelRatio,app:q('.app'),board:q('.board'),footer:q('.board-footer'),stats:q('.stats'),fourth:q('.stat-card:last-child'),live:document.getElementById('liveText')?.textContent,canvasPixels:document.getElementById('pcbCanvas')?.width,statCards:document.querySelectorAll('.stat-card').length}})()";
async function run(){try{const dir=__dirname;
child=spawn(chrome,['--headless=new','--disable-gpu','--disable-background-networking','--no-first-run','--no-default-browser-check','--user-data-dir='+profile,'--remote-debugging-port=0','about:blank'],{windowsHide:true,stdio:'ignore'});
let port;
for(let i=0;i<60;i++){await delay(150);try{port=+fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];if(port)break}catch{}}
if(!port)throw new Error('CDP debug port unavailable');
const endpoint='http://127.0.0.1:'+port;
const tab=await(await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
ws=new WebSocket(tab.webSocketDebuggerUrl);await Promise.race([new Promise((ok,err)=>{ws.onopen=ok;ws.onerror=err}),timeout()]);
ws.onmessage=ev=>{let m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){let p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails?.text)};
await send('Page.enable');await send('Runtime.enable');
let results=[];
for(let item of [{name:'desktop',width:1365,height:900,mobile:false},{name:'mobile',width:390,height:844,mobile:true},{name:'tablet',width:768,height:1000,mobile:true}]){
await send('Emulation.setDeviceMetricsOverride',{width:item.width,height:item.height,deviceScaleFactor:1,mobile:item.mobile});
await send('Page.navigate',{url:target});await delay(1300);
let before=await evalJS(metricExpression);
const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
fs.writeFileSync(path.join(dir,'test-'+item.name+'.png'),Buffer.from(screenshot.data,'base64'));
let changed=await evalJS("(() => {document.querySelector('.stat-card[data-stat=\"fable\"]').click();return {selected:document.querySelector('.stat-card[data-stat=\"fable\"]').classList.contains('selected'),toast:document.getElementById('toast').textContent};})()");
let pause=await evalJS("(() => {document.getElementById('liveToggle').click();return {pressed:document.getElementById('liveToggle').getAttribute('aria-pressed'),text:document.getElementById('liveText').textContent};})()");
let ok=before.scrollWidth<=before.innerWidth+2&&before.bodyScrollWidth<=before.innerWidth+2&&before.fourth.right<=before.innerWidth+2&&changed.selected&&pause.pressed==='false'&&before.canvasPixels>0&&before.statCards===4;
results.push({...item,ok,before,changed,pause});console.log('VIEWPORT',JSON.stringify(results[results.length-1]));}
console.log('EXCEPTIONS',JSON.stringify(exceptions));console.log('OVERALL',results.every(r=>r.ok)&&exceptions.length===0?'PASS':'FAIL');if(results.some(x=>!x.ok)||exceptions.length)process.exitCode=2;
}finally{try{ws?.close()}catch{};try{child?.kill()}catch{};setTimeout(()=>{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}},1000)}}
run().catch(e=>{console.error('E2E_FAILURE',e.message);process.exitCode=2;try{child?.kill()}catch{}});
