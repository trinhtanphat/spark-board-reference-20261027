/**
 * Interactive VISUAL route explorer for the reference assembly.
 * Uses only the same frozen manifest as the 3D PCB and local geometry audit.
 * No electrical connectivity / KiCad nets are implied.
 */
import {VISUAL_ROUTES,LAYER_LABELS,ILLUSTRATIVE_BODY_KEEPOUTS,auditIllustrativeGeometry} from "./routing/visual-routing.mjs";
import {exportVisualSvg,exportVisualManifest,EXPORT_DISCLAIMER} from "./routing/visual-export.mjs";
const $=id=>document.getElementById(id);
const svgNS="http://www.w3.org/2000/svg",panel=$("routeExplorer"),layer=$("routeExplorerLayer"),group=$("routeExplorerGroup");
const canvas=$("routeExplorerMap"),count=$("routeExplorerCount"),detail=$("routeExplorerSelection");
const exportSvgButton=$("routeExplorerExportSvg"),exportJsonButton=$("routeExplorerExportJson");
const audit=auditIllustrativeGeometry();
const categories=["ALL","RF","FLASH","IO","NPU"];
const create=(name,attrs={},text=null)=>{
 const el=document.createElementNS(svgNS,name);
 for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
 if(text!==null)el.textContent=text;
 return el;
};
const toPixel=([x,z])=>[Number(((x+5.85)*100).toFixed(4)),Number(((3.6-z)*100).toFixed(4))];
const routeLength=route=>route.points.slice(1).reduce((sum,b,i)=>{
 const a=route.points[i];return sum+Math.hypot(b[0]-a[0],b[1]-a[1]);
},0);
let focusedId=null;
function choose(route){
 focusedId=route.id;
 detail.textContent=route.corridor+" / "+route.id+" · "+route.points.length+" points · "+routeLength(route).toFixed(2)+" scene units (not mm) · 3D projection (not copper)";
 for(const p of canvas.querySelectorAll("[data-route-id]")){
  const selected=p.getAttribute("data-route-id")===focusedId;
  p.setAttribute("stroke-width",selected?"8":"3.0");
  p.setAttribute("opacity",selected?"1":".62");
  p.setAttribute("aria-pressed",String(selected));
 }
 document.dispatchEvent(new CustomEvent("spark:visual-route-focus",{detail:{id:route.id,layer:route.layer,corridor:route.corridor}}));
}
function render(){
 const level=Number(layer.value),filter=group.value;
 if(!Number.isInteger(level)||level<0||level>=LAYER_LABELS.length||!categories.includes(filter))return;
 const selected=VISUAL_ROUTES.filter(r=>r.layer===level&&(filter==="ALL"||r.corridor===filter));
 canvas.replaceChildren();
 canvas.append(create("rect",{x:4,y:4,width:1162,height:712,rx:24,fill:"#12322b",stroke:"#a7b49f","stroke-width":5}));
 canvas.append(create("text",{x:38,y:46,fill:"#bbcbb7","font-size":25,"font-family":"monospace"},LAYER_LABELS[level]+" / VISUAL ART"));
 for(const box of ILLUSTRATIVE_BODY_KEEPOUTS){
  const [x,y]=toPixel([box.minX,box.maxZ]);
  canvas.append(create("rect",{x,y,width:(box.maxX-box.minX)*100,height:(box.maxZ-box.minZ)*100,rx:7,fill:"#495353",opacity:.46,stroke:"#bec4aa","stroke-dasharray":"8,7","stroke-width":2}));
  canvas.append(create("text",{x:x+6,y:y+24,"font-size":18,fill:"#e4e7d8","font-family":"monospace"},box.name));
 }
 const colors={RF:"#efc693",FLASH:"#9cd6c5",IO:"#d4b7f0",NPU:"#c4cf8f"};
 for(const route of selected){
  const pts=route.points.map(p=>toPixel(p).join(",")).join(" ");
  const poly=create("polyline",{points:pts,fill:"none",stroke:colors[route.corridor],"stroke-width":3,
   "stroke-linecap":"round","stroke-linejoin":"round",opacity:.62,"data-route-id":route.id,
   tabindex:"0",role:"button","aria-label":"Inspect visual route "+route.id,"aria-pressed":"false"});
  poly.addEventListener("click",()=>choose(route));
  poly.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();choose(route)}});
  canvas.append(poly);
 }
 count.textContent=selected.length+" / "+VISUAL_ROUTES.length+" visual routes";
 focusedId=null;
 document.dispatchEvent(new CustomEvent("spark:visual-route-focus",{detail:{id:null}}));
 detail.textContent="Select a colored line for illustrative corridor details. No real PCB net connections.";
 panel.dataset.ready="true";
 panel.dataset.layer=String(level);
 panel.dataset.corridor=filter;
 panel.dataset.geometryPass=String(audit.visualGeometryPass);
}
for(let i=0;i<LAYER_LABELS.length;i++){
 const option=document.createElement("option");option.value=String(i);option.textContent="L"+(i+1)+" — "+LAYER_LABELS[i];layer.append(option);
}
for(const name of categories){
 const option=document.createElement("option");option.value=name;option.textContent=name==="ALL"?"All corridors":name+" corridor";group.append(option);
}

function downloadVisualFile(contents,mime,extension){
 const blob=new Blob([contents],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="spark-VISUAL-NOT-FOR-FAB-L"+(Number(layer.value)+1)+"-"+group.value+"."+extension;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
exportSvgButton.addEventListener("click",()=>{
 downloadVisualFile(exportVisualSvg(Number(layer.value),group.value),"image/svg+xml;charset=utf-8","svg");
 window.sparkNotify?.("Illustrative SVG exported - NOT for fabrication");
});
exportJsonButton.addEventListener("click",()=>{
 downloadVisualFile(exportVisualManifest(Number(layer.value),group.value),"application/json;charset=utf-8","json");
 window.sparkNotify?.("Illustrative route JSON exported - NOT a netlist");
});

layer.addEventListener("change",render);
group.addEventListener("change",render);
render();
window.SPARK_ROUTE_EXPLORER={getExports:()=>({svg:exportVisualSvg(Number(layer.value),group.value),json:exportVisualManifest(Number(layer.value),group.value)}),getState:()=>({
 ready:panel.dataset.ready==="true",layer:Number(layer.value),corridor:group.value,
 visibleRoutes:canvas.querySelectorAll("[data-route-id]").length,focusedId,
 auditPassed:audit.visualGeometryPass,manufacturingApproved:false,disclaimer:EXPORT_DISCLAIMER
})};