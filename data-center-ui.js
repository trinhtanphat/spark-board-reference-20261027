"use strict";
(() => {
 const $=id=>document.getElementById(id);
 const rack=$("dcRackSelect"),slot=$("dcSlotSelect"),replacement=$("dcReplacementType");
 const source=$("dcSourcePort"),target=$("dcTargetPort"),cable=$("dcCableSelect");
 const panel=$("dataCenterLab");
 if(!panel)return;
 const controls=$("dcControls"),toggle=$("dcControlsToggle");
 toggle.addEventListener("click",()=>{
  controls.hidden=!controls.hidden;
  toggle.setAttribute("aria-expanded",String(!controls.hidden));
  toggle.textContent=controls.hidden?"CONFIGURE DEVICES & NETWORK":"HIDE CONTROLS / SHOW RACKS";
 });

 const kinds=[["compute","Vera Rubin compute tray"],["nvlink","NVLink 6 switch tray"],["power","Power shelf"],["tor","TOR management switch"],["ib","InfiniBand fabric switch"],["eth","Ethernet storage switch"],["mgmt","Management Ethernet switch"]];
 const api=()=>window.SPARK3D?.getDataCenterAPI?.();
 const option=(value,label)=>{const o=document.createElement("option");o.value=value;o.textContent=label;return o};
 const optfill=(el,items,value)=>{const before=value??el.value;el.replaceChildren(...items.map(x=>option(x[0],x[1])));if([...el.options].some(o=>o.value===before))el.value=before};

 for(const [id,label] of kinds)replacement.append(option(id,label));
 function say(message,error=false){
  const line=$("dcStatus");line.textContent=message;line.dataset.error=String(error);
  if(error)window.sparkNotify?.(message);
 }
 function render(){
  const state=api();if(!state)return;
  const side=window.SPARK3D?.getDataCenterFocusState?.()?.side||"front";
  const sideButton=$("dcSideToggle");
  if(sideButton){sideButton.setAttribute("aria-pressed",String(side==="rear"));sideButton.textContent=side==="rear"?"FRONT / FACE VIEW":"REAR / SERVICE VIEW"}
  const filter=$("dcRearLayer");if(filter)filter.disabled=side!=="rear";
  if(!rack.options.length)rack.append(...state.racks.map(r=>option(r.id,r.label)));
  if(!rack.value)rack.value=state.racks[0].id;
  const floor=$("dcFloorMap");
  if(floor&&!floor.children.length)for(const info of state.racks){
   const b=document.createElement("button");
   b.type="button";b.dataset.rack=info.id;b.className="dc-floor-rack";
   b.title=info.label+" · visual-only rack selection";
   b.textContent=info.id+(info.kind==="fabric"?" / NET":" / GPU");
   b.addEventListener("click",()=>{
    window.SPARK3D?.focusDataCenterRack?.(info.id);
    rack.value=info.id;slot.value="";render();
    const s=state.slots.find(s=>s.rack===info.id);
    if(s)window.SPARK3D?.selectDataCenterSlot?.(s.id);
    render();
   });
   floor.append(b);
  }
  const summaries=state.rackSummaries();
  const byRack=new Map(summaries.map(info=>[info.id,info]));
  if(floor)for(const b of floor.children){
   const info=byRack.get(b.dataset.rack);
   b.setAttribute("aria-pressed",String(b.dataset.rack===rack.value));
   b.dataset.status=info.status;
   b.title=info.label+" | "+info.installed+"/"+info.slots+" installed | "+info.gpus+" simulated GPUs | "+info.cables+" virtual cables";
   b.setAttribute("aria-label",info.label+", "+info.status+", "+info.installed+" of "+info.slots+" modules installed");
  }
  const selectedRack=byRack.get(rack.value);
  const summary=$("dcRackSummary");
  if(summary&&selectedRack){
   summary.dataset.status=selectedRack.status;
   summary.textContent="RACK "+selectedRack.id+" / "+selectedRack.status.toUpperCase()+
    " · "+selectedRack.installed+"/"+selectedRack.slots+" modules"+
    (selectedRack.kind==="compute"?" · "+selectedRack.gpus+" GPU / "+selectedRack.cpus+" CPU":" · FABRIC")+
    " · "+selectedRack.extended+" drawers · "+selectedRack.cables+" cables";
  }
  const v=state.getSnapshot(),s=v.stats;
  $("dcStats").textContent=s.racks+" RACKS · "+s.gpuOnlineEquivalent+" GPU / "+s.cpuOnlineEquivalent+" CPU simulated · "+s.cablesConnected+" cables";
  optfill(slot,state.slots.filter(x=>x.rack===rack.value).map(x=>[x.id,(x.installed?"● ":"○ ")+x.id+" · "+x.kind+(x.drawer?" / EXTENDED":"")]));
  const selected=state.slots.find(x=>x.id===slot.value);
  if(selected)replacement.value=selected.kind;
  $("dcDrawerToggle").disabled=!selected?.installed;
  $("dcDrawerToggle").textContent=selected?.drawer?"PUSH DEVICE IN":"PULL DEVICE";
  $("dcRemove").disabled=!selected?.installed;
  $("dcInstall").disabled=!!selected?.installed;
  optfill(source,state.availableSources().map(x=>[x.id,x.label]));
  const sourcePort=state.ports.find(x=>x.id===source.value);
  optfill(target,state.availableTargets(sourcePort?.fabric).map(x=>[x.id,x.label]));
  optfill(cable,state.cables.map(x=>[x.id,x.id+" "+x.source+" → "+x.target]));
  $("dcDisconnect").disabled=!state.cables.length;
  $("dcUndo").disabled=!state.canUndo();
  $("dcHighlightCable").disabled=!state.cables.length;
  const fabric=$("dcCableFabric").value,scope=$("dcCableScope").value;
  window.SPARK3D?.setDataCenterCableView?.(fabric,scope,rack.value);
  const dcView=window.SPARK3D?.getDataCenterDiagnostics?.();
  $("dcCableVisible").textContent=(dcView?.visibleCables??0)+" / "+state.cables.length+
   " virtual cables visible"+(scope==="rack"?" · RACK "+rack.value:"");
  const log=$("dcEventLog");
  log.replaceChildren(...v.events.slice(0,5).map(e=>{
   const p=document.createElement("p");p.textContent=e.action.toUpperCase()+" · "+e.detail;return p;
  }));
 }
 function run(fn,ok){
  try{fn();say(ok);render()}catch(e){say(e.message||String(e),true);render()}
 }
 // Arrow keys navigate the 4x4 floor exactly as the visual grid does.
 const grid=$("dcFloorMap");
 const jumpTo=index=>{
  const buttons=[...grid.children];
  if(!buttons.length)return;
  const target=buttons[((index%buttons.length)+buttons.length)%buttons.length];
  target.click();target.focus();
 };
 $("dcRackPrev").addEventListener("click",()=>{
  const active=[...grid.children].findIndex(b=>b.dataset.rack===rack.value);
  jumpTo(active-1);
 });
 $("dcRackNext").addEventListener("click",()=>{
  const active=[...grid.children].findIndex(b=>b.dataset.rack===rack.value);
  jumpTo(active+1);
 });
 grid.addEventListener("keydown",e=>{
  const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4};
  const change=steps[e.key];if(change===undefined)return;
  const i=[...grid.children].indexOf(document.activeElement);
  if(i<0)return;
  e.preventDefault();jumpTo(i+change);
 });
 rack.addEventListener("change",()=>{
  window.SPARK3D?.focusDataCenterRack?.(rack.value);
  slot.value="";render();
 });
 slot.addEventListener("change",()=>{
  const s=api()?.slots.find(v=>v.id===slot.value);
  if(s){replacement.value=s.kind;window.SPARK3D?.selectDataCenterSlot?.(s.id);}
  render();
 });
 source.addEventListener("change",()=>{target.value="";render()});
 $("dcCableFabric").addEventListener("change",render);
 $("dcCableScope").addEventListener("change",render);
 const highlightSelectedCable=()=>{
  const selected=api()?.cables.find(c=>c.id===cable.value);
  if(!selected)return;
  $("dcCableFabric").value=selected.fabric;
  $("dcCableScope").value="all";
  render();
  if(window.SPARK3D?.highlightDataCenterCable?.(selected.id)){
   say("Highlighted virtual cable "+selected.id+" / "+selected.fabric+"; no live network changes");
  }
 };
 cable.addEventListener("change",highlightSelectedCable);
 $("dcHighlightCable").addEventListener("click",highlightSelectedCable);
 $("dcDrawerToggle").addEventListener("click",()=>run(()=>api().toggleDrawer(slot.value),"Device moved in virtual rack"));
 $("dcRemove").addEventListener("click",()=>run(()=>api().remove(slot.value),"Module removed from simulation; hardware untouched"));
 $("dcInstall").addEventListener("click",()=>run(()=>api().install(slot.value,replacement.value),"Compatible module installed in simulation"));
 $("dcConnect").addEventListener("click",()=>run(()=>api().connect(source.value,target.value),"Simulated compatible network cable connected"));
 $("dcDisconnect").addEventListener("click",()=>run(()=>api().disconnect(cable.value),"Simulated network cable unplugged"));
 $("dcExport").addEventListener("click",()=>{
  try{
   const payload={format:"SPARK-DATACENTER-SIM-1",kind:"BROWSER_ONLY_SIMULATION",disclaimer:"NOT REAL NVIDIA WIRING OR INSTALLATION DATA",...api().getSnapshot()};
   const blob=new Blob([JSON.stringify(payload,null,2)+"\n"],{type:"application/json"});
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download="spark-NVIDIA-DC-SIMULATED-TOPOLOGY.json";
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1200);
   say("Simulation topology JSON exported (not a live config)");
  }catch(e){say(e.message||String(e),true)}
 });
 $("dcRearLayer").addEventListener("change",()=>{
  const choice=$("dcRearLayer").value;
  if(window.SPARK3D?.setDataCenterRearLayer?.(choice)){
   say("Rear subsystem: "+$("dcRearLayer").selectedOptions[0]?.textContent+" · conceptual visualization");
  }
 });
 $("dcSideToggle").addEventListener("click",()=>{
  const button=$("dcSideToggle"),current=window.SPARK3D?.getDataCenterFocusState?.()?.side||"front";
  const next=current==="front"?"rear":"front";
  if(window.SPARK3D?.setDataCenterSide?.(next)){
   button.setAttribute("aria-pressed",String(next==="rear"));
   button.textContent=next==="rear"?"FRONT / FACE VIEW":"REAR / SERVICE VIEW";
   say(next==="rear"?"Viewing illustrative REAR: manifold / 54V busbar / NVLink cartridges":"Viewing FRONT: compute, NVLink and power tray faceplates");
   $("dcRearLayer").disabled=next!=="rear";
  }
 });
 $("dcOverview").addEventListener("click",()=>{
  window.SPARK3D?.resetDataCenterOverview?.();
  say("Viewing all 16 close-packed racks");render();
 });
 $("dcUndo").addEventListener("click",()=>run(()=>api().undoLastChange(),"Previous simulated configuration restored"));
 $("dcImportFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>2_000_000)throw new Error("Simulation JSON exceeds 2 MB limit");
   const text=await file.text(),payload=JSON.parse(text);
   api().importSnapshot(payload);
   say("Validated simulation restored from "+file.name+"; no real hardware affected");
   render();
  }catch(err){say("Import rejected: "+(err.message||String(err)),true);render()}
  finally{e.target.value=""}
 });
 $("dcReset").addEventListener("click",()=>run(()=>api().reset(),"Lab reset; no physical system affected"));
 document.addEventListener("spark:datacenter-update",render);
 document.addEventListener("spark:model-mode-change",e=>{
  panel.hidden=e.detail.mode!=="datacenter";
  if(e.detail.mode==="datacenter")render();
 });
 rack.value="A";
 render();
 // Test-only read view; all changes still pass the same validated simulator API.
 window.SPARK_DATA_CENTER_UI={refresh:render,focusSlot(id){
  const state=api(),s=state?.slots.find(x=>x.id===id);
  if(!s)return false;
  rack.value=s.rack;render();slot.value=id;render();return true;
 },getState:()=>({
  visible:!panel.hidden,controlsExpanded:!controls.hidden,rack:rack.value,selectedSlot:slot.value,
  source:source.value,target:target.value,sourceOptions:source.options.length,
  targetOptions:target.options.length,events:$("dcEventLog").children.length
 })};
})();