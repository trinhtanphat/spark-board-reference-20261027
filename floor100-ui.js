/* Interactive controls for single-floor 100 rack conceptual AI factory. */
(()=>{
 const $=id=>document.getElementById(id),panel=$("floor100Lab"),map=$("floor100Map");
 if(!panel||!map)return;
 const state=()=>window.SPARK3D;
 const rackSelector=$("floor100Rack"),filter=$("floor100Layer"),rear=$("floor100Rear"),description=$("floor100Selected");
 let racks=[];
 function selectRack(id){
  if(!state()?.focusFloor100Rack?.(id||null))return;
  render();
 }
 function render(){
  const d=state()?.getFloor100Diagnostics?.();
  if(!d)return;
  const focus=d.selected||"";
  rackSelector.value=focus;
  for(const b of map.children)b.setAttribute("aria-pressed",String(b.dataset.id===focus));
  if(focus){
   const r=racks.find(r=>r.id===focus);
   if(r)description.textContent=r.id+" · ROW "+(r.row+1)+" / BAY "+(r.column+1)+" · "+r.kind.toUpperCase()+
    (r.kind==="compute"?" · 72 GPU / 36 CPU equivalents":" · Conceptual service rack")+
    " · FRONT + REAR 3D inspectable";
  }else description.textContent="100 racks / 10 × 10 · Select a cabinet to focus the 3D camera. Zone groups represent illustration only.";
  rear.textContent=d.serviceSide==="rear"?"REAR SERVICE / ON":"REAR SERVICE / OFF";
  rear.setAttribute("aria-pressed",String(d.serviceSide==="rear"));
  filter.value=d.filter;
 }
 function populate(){
  if(racks.length)return;
  racks=state()?.getFloor100Racks?.()||[];
  for(const r of racks){
   const option=document.createElement("option");option.value=r.id;
   option.textContent=r.id+" · ROW "+(r.row+1)+" · "+r.kind.toUpperCase();
   rackSelector.appendChild(option);
   const b=document.createElement("button");b.type="button";b.dataset.id=r.id;b.dataset.kind=r.kind;
   b.textContent=String(r.row+1)+"-"+String(r.column+1);
   b.title=r.id+" / "+r.kind+" / conceptual GPU count "+r.gpuEquivalent;
   b.setAttribute("aria-label",r.id+" row "+(r.row+1)+" bay "+(r.column+1)+" "+r.kind);
   b.setAttribute("aria-pressed","false");
   b.addEventListener("click",()=>selectRack(r.id));
   map.appendChild(b);
  }
 }
 $("floor100Overview").addEventListener("click",()=>selectRack(null));
 rackSelector.addEventListener("change",()=>selectRack(rackSelector.value));
 filter.addEventListener("change",()=>{state()?.setFloor100Filter?.(filter.value);render()});
 rear.addEventListener("click",()=>{
  const next=state()?.getFloor100Diagnostics?.()?.serviceSide==="rear"?"front":"rear";
  state()?.setFloor100Side?.(next);render();
 });
 map.addEventListener("keydown",event=>{
  const directions={ArrowLeft:-1,ArrowRight:1,ArrowUp:-10,ArrowDown:10};
  if(directions[event.key]===undefined)return;
  const current=[...map.children].indexOf(document.activeElement);
  if(current<0)return;
  event.preventDefault();
  const next=(current+directions[event.key]+100)%100;
  map.children[next].click();map.children[next].focus();
 });
 document.addEventListener("spark:floor100-select",()=>render());
 document.addEventListener("spark:model-mode-change",e=>{
  panel.hidden=e.detail.mode!=="floor100";
  if(!panel.hidden){populate();render()}
 });
 window.SPARK_FLOOR100_UI={render,getState:()=>({visible:!panel.hidden,rackCount:racks.length,selected:rackSelector.value,filter:filter.value,rear:rear.getAttribute("aria-pressed")==="true"})};
})();
