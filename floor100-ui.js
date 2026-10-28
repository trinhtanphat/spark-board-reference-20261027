/* Interactive controls for single-floor 100 rack conceptual AI factory. */
(()=>{
 const $=id=>document.getElementById(id),panel=$("floor100Lab"),map=$("floor100Map");
 if(!panel||!map)return;
 const state=()=>window.SPARK3D;
 const rackSelector=$("floor100Rack"),filter=$("floor100Layer"),rear=$("floor100Rear"),description=$("floor100Selected");
 const power=$("floor100PowerScenario"),cooling=$("floor100CoolingCircuit"),scenarioStatus=$("floor100ScenarioStatus");
 const hardwareSelect=$("floor100HardwarePart"),hardwareResult=$("floor100HardwareResult");
 const loadSelect=$("floor100LoadPercent"),heatButton=$("floor100Heatmap");
 const watts=new Intl.NumberFormat("en-US",{maximumFractionDigits:0});
 const kw=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
 const showW=x=>watts.format(x)+" W",showKW=x=>kw.format(x)+" kW";
 let racks=[];
 function selectRack(id){
  if(!state()?.focusFloor100Rack?.(id||null))return;
  render();
 }
 function render(){
  const d=state()?.getFloor100Diagnostics?.();
  if(!d)return;
  const focus=d.selected||"";
  const modeledPower=state()?.getFloor100PowerModel?.();
  const powerByRack=new Map((modeledPower?.entries||[]).map(r=>[r.id,r]));
  if(modeledPower){
   $("floor100TotalKW").textContent=showKW(modeledPower.totalKW);
   $("floor100TotalW").textContent=showW(modeledPower.totalW);
   $("floor100PeakKW").textContent=showKW(modeledPower.peakKW);
   $("floor100PeakW").textContent=showW(modeledPower.peakW);
   $("floor100FacilityKW").textContent=showKW(modeledPower.facilityKW);
   $("floor100FacilityW").textContent=showW(modeledPower.facilityW);
   $("floor100AvgKW").textContent=showKW(modeledPower.averageKW);
   $("floor100LoadNotice").textContent=modeledPower.loadPercent+"% SCENARIO · NOT TELEMETRY";
   loadSelect.value=String(modeledPower.loadPercent);
  }
  heatButton.setAttribute("aria-pressed",String(d.powerHeatmap));
  heatButton.textContent="WATT HEATMAP / "+(d.powerHeatmap?"ON":"OFF");
  map.dataset.heatmap=String(d.powerHeatmap);
  hardwareSelect.value=d.hardwarePart;
  const hardwareInfo=state()?.getFloor100HardwareInfo?.();
  hardwareResult.dataset.active=String(d.hardwareHighlightVisible);
  hardwareResult.textContent=hardwareInfo&&(hardwareInfo.count>0)?
   (d.hardwareSelectedRackKind!=="compute"?"This part is referenced for compute racks only. Select a green compute cabinet (R001–R008 in each row).":
    (d.hardwareHighlightCount+" conceptual 3D positions highlighted / "+hardwareInfo.side.toUpperCase()+" VIEW · "+hardwareInfo.detail)):
   "Select a compute rack and hardware group to highlight its schematic location in 3D.";
  const impact=state()?.getFloor100RouteImpact?.();
  const routeById=new Map((impact?.entries||[]).map(r=>[r.id,r]));
  rackSelector.value=focus;
  for(const b of map.children){
   const route=routeById.get(b.dataset.id);
   b.setAttribute("aria-pressed",String(b.dataset.id===focus));
   if(route){
    const powerEntry=powerByRack.get(b.dataset.id);
    if(powerEntry){
     b.dataset.heatBand=powerEntry.heatBand;
     b.setAttribute("data-power-w",String(powerEntry.estimatedW));
    }
    b.dataset.route=route.status;
    b.title=b.dataset.id+" · "+(powerEntry?showKW(powerEntry.estimatedKW)+" / "+showW(powerEntry.estimatedW)+" · ":"")+(route.feed==="unmapped"?"feed not modeled":route.feed+" route "+route.status)+
     " · SCHEMATIC ONLY / NO ACTUAL RACK TELEMETRY";
    b.setAttribute("aria-label",b.dataset.id+" "+(powerEntry?showW(powerEntry.estimatedW)+" estimated · ":"")+(route.feed==="unmapped"?"feed path not modeled":route.feed+" feed path "+route.status)+", conceptual only");
   }
  }
  const stats=$("floor100RouteCounts");
  const rowMap=$("floor100RowSummary");
  if(impact){
   const {visible,dimmed,unmapped}=impact.counts;
   stats.textContent=visible+" SHOWN PATH / "+dimmed+" DIMMED PATH / "+unmapped+
    " UNMAPPED · no operational state measured";
   if(!rowMap.children.length){
    for(let i=0;i<10;i++){
     const cell=document.createElement("span");
     cell.className="floor100-row-chip";cell.dataset.row=String(i+1);
     rowMap.appendChild(cell);
    }
   }
   for(const row of impact.rows){
    const chip=rowMap.children[row.row-1];
    chip.dataset.route=row.dimmed?"dimmed":"visible";
    const rowPower=modeledPower?.rows[row.row-1];
    chip.textContent="ROW "+row.row+" · "+row.visible+"/"+row.dimmed+"/"+row.unmapped+
     (rowPower?" · "+showKW(rowPower.estimatedKW):"");
    chip.title="Row "+row.row+": "+row.visible+" routes shown, "+row.dimmed+
     " dimmed, "+row.unmapped+" unmodeled — not measured rack uptime";
   }
  }
  const currentPower=powerByRack.get(focus);
  $("floor100RackPower").textContent=currentPower?
   (focus+" · "+showKW(currentPower.estimatedKW)+" / "+showW(currentPower.estimatedW)+
    " EST. IT · PEAK "+showKW(currentPower.peakKW)+" · A+B PATHS DRAWN, NOT VALIDATED"):
   "Select a rack to view individual W and kW estimate.";
  const rowEstimate=currentPower?modeledPower.rows[currentPower.row]:null;
  $("floor100RowPower").textContent=rowEstimate?
   ("ROW "+rowEstimate.row+" · "+showKW(rowEstimate.estimatedKW)+" / "+showW(rowEstimate.estimatedW)+" IT"):
   "ROW TOTAL: select a rack";
  if(focus){
   const r=racks.find(r=>r.id===focus);
   if(r){
    const route=routeById.get(r.id);
    const feedText=route?.feed==="unmapped"?"FEED NOT MODELED":
     "INDICATIVE "+route?.feed+" PATH "+(route?.status==="dimmed"?"DIMMED":"SHOWN");
    description.textContent=r.id+" · ROW "+(r.row+1)+" / BAY "+(r.column+1)+" · "+r.kind.toUpperCase()+
     (r.kind==="compute"?" · 72 GPU / 36 CPU equivalents":" · Conceptual service rack")+
     " · "+feedText+" · BROWSER-ONLY ROUTE ART / NOT ACTUAL RACK STATUS";
   }
  }else description.textContent="100 racks / 10 × 10 · Select a cabinet to focus the 3D camera. Zone groups represent illustration only.";
  rear.textContent=d.serviceSide==="rear"?"REAR SERVICE / ON":"REAR SERVICE / OFF";
  rear.setAttribute("aria-pressed",String(d.serviceSide==="rear"));
  filter.value=d.filter;
  power.value=d.powerScenario;cooling.value=d.coolingCircuit;
  const powerMessage=d.powerScenario==="normal"?"A+B PATHS DISPLAYED":
   d.powerScenario==="a-loss"?"A PATH DIMMED · B DISPLAYED":
   d.powerScenario==="b-loss"?"B PATH DIMMED · A DISPLAYED":
   "GRID PATHS DIMMED · GENERATOR CONCEPT HIGHLIGHTED";
  scenarioStatus.dataset.scenario=d.powerScenario;
  scenarioStatus.textContent=powerMessage+" | COOLING "+
   (d.coolingCircuit==="both"?"SUPPLY + RETURN":d.coolingCircuit==="supply"?"SUPPLY":"RETURN")+
   " · ILLUSTRATIVE ONLY / NOT REAL ELECTRICAL OR THERMAL FAILOVER";
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
 loadSelect.addEventListener("change",()=>{
  state()?.setFloor100LoadPercent?.(Number(loadSelect.value));render();
 });
 heatButton.addEventListener("click",()=>{
  state()?.setFloor100PowerHeatmap?.(!state()?.getFloor100Diagnostics?.()?.powerHeatmap);render();
 });
 $("floor100ExportPower").addEventListener("click",()=>{
  const profile=state()?.getFloor100PowerModel?.();if(!profile)return;
  const data=JSON.stringify({format:"SPARK-FLOOR100-POWER-ESTIMATE-1",
   source:"BROWSER_ONLY_DEMO_ASSUMPTIONS",createdAt:new Date().toISOString(),...profile},null,2);
  const blob=new Blob([data],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="spark-floor100-power-estimate-NOT-TELEMETRY.json";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 power.addEventListener("change",()=>{
  state()?.setFloor100PowerScenario?.(power.value);render();
 });
 cooling.addEventListener("change",()=>{
  state()?.setFloor100CoolingCircuit?.(cooling.value);render();
 });
 $("floor100ScenarioReset").addEventListener("click",()=>{
  state()?.setFloor100PowerScenario?.("normal");
  state()?.setFloor100CoolingCircuit?.("both");render();
 });
 hardwareSelect.addEventListener("change",()=>{
  const part=hardwareSelect.value;
  if(part!=="none"&&!state()?.getFloor100Diagnostics?.()?.selected)selectRack("R001");
  if(!state()?.setFloor100HardwarePart?.(part)){hardwareSelect.value="none";return}
  const info=state()?.getFloor100HardwareInfo?.();
  const diagnostics=state()?.getFloor100Diagnostics?.();
  if(part!=="none"&&diagnostics?.hardwareSelectedRackKind==="compute"&&info?.side)
   state()?.setFloor100Side?.(info.side);
  render();
 });
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
 window.SPARK_FLOOR100_UI={render,getState:()=>({visible:!panel.hidden,rackCount:racks.length,selected:rackSelector.value,filter:filter.value,rear:rear.getAttribute("aria-pressed")==="true",power:power.value,cooling:cooling.value})};
})();
