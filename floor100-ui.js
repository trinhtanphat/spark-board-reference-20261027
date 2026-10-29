/* Interactive controls for single-floor 100 rack conceptual AI factory. */
(()=>{
 const $=id=>document.getElementById(id),panel=$("floor100Lab"),map=$("floor100Map");
 if(!panel||!map)return;
 const state=()=>window.SPARK3D;
 const rackSelector=$("floor100Rack"),filter=$("floor100Layer"),rear=$("floor100Rear"),description=$("floor100Selected");
 const power=$("floor100PowerScenario"),cooling=$("floor100CoolingCircuit"),scenarioStatus=$("floor100ScenarioStatus");
 const hardwareSelect=$("floor100HardwarePart"),hardwareResult=$("floor100HardwareResult");
 const loadSelect=$("floor100LoadPercent"),heatButton=$("floor100Heatmap");
 const traceSelect=$("floor100TraceFeed"),traceStatus=$("floor100TraceStatus"),traceSteps=$("floor100TraceSteps");
 const wattInput=$("floor100RackBaselineW"),wattStatus=$("floor100RackWattStatus");
 const wattFile=$("floor100WattPresetFile");
 const wattStoreKey="SPARK_FLOOR100_DEMO_RACK_WATTS_V1";
 let wattStoreRestored=false,wattMessage="";
 function saveWattPresets(){
  try{localStorage.setItem(wattStoreKey,JSON.stringify(state()?.getFloor100RackBaselineOverrides?.()||{}));return true}
  catch{return false}
 }
 function restoreWattPresetsOnce(){
  if(wattStoreRestored)return;
  wattStoreRestored=true;
  try{
   const stored=localStorage.getItem(wattStoreKey);
   if(stored!==null&&!state()?.replaceFloor100RackBaselineOverrides?.(JSON.parse(stored))){
    localStorage.removeItem(wattStoreKey);wattMessage="Invalid saved preset ignored.";
   }
  }catch{wattMessage="Browser storage unavailable or stored preset invalid."}
 }
 const capSelect=$("floor100FeedCapacity"),feedRowGrid=$("floor100FeedRowAllocation");
 const liquidSelect=$("floor100LiquidCapture"),cduCapSelect=$("floor100CduKW");
 const availableSelect=$("floor100CduAvailable"),thermalRows=$("floor100ThermalRows");
 const coolTraceSelect=$("floor100CoolTrace"),coolTraceStatus=$("floor100CoolTraceStatus");
 const coolTraceSteps=$("floor100CoolTraceSteps");
 const isolationRow=$("floor100IsolatedRow"),failedCdu=$("floor100FailedCdu");
 const waterDeltaSelect=$("floor100WaterDeltaT");
 const pipeDiameter=$("floor100PipeDiameter"),pipeLength=$("floor100PipeLength");
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
  restoreWattPresetsOnce();
  const focus=d.selected||"";
  const modeledPower=state()?.getFloor100PowerModel?.();
  const thermal=state()?.getFloor100ThermalPlan?.();
  const water=state()?.getFloor100WaterBalance?.();
  const hydraulic=state()?.getFloor100HydraulicPlan?.();
  const liquidPaths=state()?.getFloor100CoolingPaths?.()||[];
  const coolantFault=state()?.getFloor100CoolantFault?.();
  if(coolantFault){
   isolationRow.value=String(coolantFault.isolatedRow);
   failedCdu.value=String(coolantFault.failedCdu);
   const status=$("floor100CoolantFaultStatus");
   status.dataset.status=coolantFault.blockedRows.length?"blocked":"normal";
   status.textContent=coolantFault.blockedRows.length?
    ("SCHEMATIC DISCONNECTED DEMAND: ROWS "+coolantFault.blockedRows.join(", ")+
     " · "+showKW(coolantFault.blockedComputeKW)+" HEAT / "+
     kw.format(coolantFault.blockedFlowLpm)+" L/min target potentially affected · NOT MEASURED FLOW"):
    "ALL ILLUSTRATIVE ROW VALVES OPEN / ALL CDU PUMP SYMBOLS AVAILABLE · NO LIVE TELEMETRY";
   $("floor100CoolantTopologyStatus").textContent="AUDITED CONNECTED 3D PIPES · "+
    d.coolantVisualAudit.paths+" SUPPLY / RETURN ROUTES · "+d.coolantVisualAudit.segments+
    " CONTINUITY SEGMENTS · "+d.coolantPipeInstances+" VISIBLE SECTIONS · "+
    d.coolantRenderedAudit.missing+" RENDERED ENDPOINT GAPS · NOT SITE CAD";
  }
  coolTraceSelect.value=d.coolingTraceMode||"off";
  const liquidRack=liquidPaths[0]?.rackId??null;
  const notCompute=d.selected&&d.hardwareSelectedRackKind!=="compute";
  coolTraceStatus.dataset.status=notCompute&&d.coolingTraceMode!=="off"?"unsupported":liquidPaths.length?"active":"idle";
  coolTraceStatus.textContent=liquidPaths.length?
   ("SCHEMATIC "+liquidRack+" · "+liquidPaths.map(p=>p.channel.toUpperCase()+
    " CDU "+p.cduReference+" / "+p.segments.length+" STEPS").join(" | ")+
    " · NOT FLOW TELEMETRY"):
   notCompute&&d.coolingTraceMode!=="off"?
    ("NO LIQUID ROUTE MAPPED FOR "+d.selected+" · FABRIC/STORAGE IS NOT NVL72 COMPUTE HARDWARE"):
    "Choose a compute rack, then trace conceptual supply/return pipes.";
  for(const channel of ["supply","return"]){
   const route=liquidPaths.find(x=>x.channel===channel);
   const el=$("floor100Cool"+(channel==="supply"?"Supply":"Return"));
   el.dataset.active=String(Boolean(route));
   el.textContent=route?
    (channel.toUpperCase()+" · CDU GALLERY #"+route.cduReference+" · "+route.segments.length+" PIPE SECTIONS"):
    (channel.toUpperCase()+" · NOT SELECTED");
  }
  coolTraceSteps.replaceChildren();
  if(liquidPaths.length){
   for(const segment of liquidPaths[0].segments){
    const li=document.createElement("li");li.textContent=segment.name;
    coolTraceSteps.appendChild(li);
   }
  }
  if(thermal){
   liquidSelect.value=String(thermal.liquidCapturePercent);
   cduCapSelect.value=String(thermal.cduCapacityKW);
   availableSelect.value=String(thermal.availableCDUs);
   $("floor100HeatKW").textContent=showKW(thermal.heatKW);
   $("floor100LiquidKW").textContent=showKW(thermal.liquidKW);
   $("floor100AirKW").textContent=showKW(thermal.airKW);
   $("floor100CduBudgetKW").textContent=showKW(thermal.capacityKW);
   $("floor100CoolingBudgetBar").style.width=(thermal.utilizationPercent===null?100:Math.min(100,thermal.utilizationPercent))+"%";
   const s=$("floor100CoolingPlanStatus");
   s.dataset.status=thermal.status==="OVER_DEMO_CAPACITY"?"over":"within";
   s.textContent=thermal.status==="OVER_DEMO_CAPACITY"?
    ("WHAT-IF COOLING GAP "+showKW(thermal.excessKW)+" / LIQUID "+showKW(thermal.liquidKW)+
     " / CDU BUDGET "+showKW(thermal.capacityKW)+" · NO REAL TEMPERATURE PREDICTION"):
    ("WITHIN FICTIONAL CDU BUDGET · LIQUID "+showKW(thermal.liquidKW)+
     " / "+showKW(thermal.capacityKW)+" · NO LIVE COOLANT CAPACITY MEASURED");
   if(thermalRows.children.length!==10){
    for(let i=0;i<10;i++){
     const b=document.createElement("button");b.type="button";
     b.className="floor100-thermal-row";b.dataset.row=String(i+1);
     b.addEventListener("click",()=>selectRack("R"+String(i*10+1).padStart(3,"0")));
     thermalRows.appendChild(b);
    }
   }
   for(const row of thermal.rows){
    const b=thermalRows.children[row.row-1];
    b.textContent="ROW "+row.row+" · "+showKW(row.liquidKW)+" LIQ / "+showKW(row.airKW)+" AIR";
    b.dataset.status=row.nominalExcessKW>0?"over":"within";
    b.title="Illustrative row heat budget; select row "+row.row;
   }
   const selected=modeledPower?.entries.find(e=>e.id===focus);
   $("floor100SelectedHeat").textContent=selected?
    (selected.id+" · HEAT "+showKW(selected.estimatedKW)+" / "+showW(selected.estimatedW)+
     " · ASSUMED LIQUID "+showKW(Math.round(selected.estimatedKW*thermal.liquidCapturePercent)/100)+
     " · NOT MEASURED"):
    "Choose a rack to view its assumed heat-equivalent load";
  }
  if(water){
   waterDeltaSelect.value=String(water.deltaTK);
   $("floor100WaterComputeKW").textContent=showKW(water.computeLiquidKW);
   $("floor100WaterLpm").textContent=kw.format(water.designFlowLpm)+" L/min";
   $("floor100WaterM3h").textContent=kw.format(water.designFlowM3h)+" m³/h";
   $("floor100WaterExcludedKW").textContent=showKW(water.excludedLiquidKW);
   const chosen=water.racks.find(r=>r.id===focus);
   $("floor100WaterSelected").textContent=chosen?
    (chosen.id+" · "+showKW(chosen.liquidKW)+" COMPUTE LIQUID HEAT → "+
     kw.format(chosen.targetLpm)+" L/min TARGET @ ΔT "+water.deltaTK+" K · NOT MEASURED"):
    focus?focus+" · NO NVL72 MANIFOLD LOOP MAPPED FOR FABRIC/STORAGE RACK":
    "Select a compute rack to view its theoretical water-flow target.";
  }
  if(hydraulic){
   pipeDiameter.value=String(hydraulic.diameterMM);
   pipeLength.value=String(hydraulic.oneWayLengthM);
   $("floor100HydraulicDrop").textContent=kw.format(hydraulic.maxRowBranchLossKPa)+" kPa";
   $("floor100HydraulicVelocity").textContent=kw.format(hydraulic.maxRowVelocityMps)+" m/s";
   $("floor100HydraulicLength").textContent=String(hydraulic.oneWayLengthM*2)+" m / pair";
   const chosen=modeledPower?.entries.find(e=>e.id===focus);
   const chosenRow=chosen?hydraulic.rows[chosen.row]:null;
   $("floor100HydraulicSelected").textContent=chosenRow?
    ("ROW "+chosenRow.row+" · "+kw.format(chosenRow.flowLpm)+" L/min · "+
     kw.format(chosenRow.lossKPa)+" kPa (SUPPLY + RETURN) · RE="+
     watts.format(chosenRow.reynolds)+" · "+chosenRow.flowRegime+" · NOT PUMP HEAD"):
    "Select a rack to compare the schematic pressure drop of its row branch.";
   const rows=$("floor100HydraulicRows");
   if(rows.children.length!==10){for(let i=0;i<10;i++){
    const button=document.createElement("button");button.type="button";
    button.className="floor100-hydraulic-row";
    button.addEventListener("click",()=>selectRack("R"+String(i*10+1).padStart(3,"0")));
    rows.appendChild(button);
   }}
   for(const row of hydraulic.rows){
    const button=rows.children[row.row-1];
    button.textContent="ROW "+row.row+" · "+kw.format(row.lossKPa)+" kPa";
    button.dataset.warn=String(row.velocityFlag!=="NO_DEMO_VELOCITY_FLAG");
    button.setAttribute("aria-pressed",String(chosenRow?.row===row.row));
    button.title="Illustrative row supply+return pressure-loss sensitivity only";
   }
  }
  const plan=state()?.getFloor100FeedAllocation?.();
  if(plan){
   capSelect.value=String(plan.capacityKW);
   for(const feed of ["A","B"]){
    const value=feed==="A"?plan.aKW:plan.bKW;
    const percent=feed==="A"?plan.aPct:plan.bPct;
    const status=value>plan.capacityKW?"over":value===0?"idle":percent>=85?"watch":"within";
    $("floor100Feed"+feed).dataset.status=status;
    $("floor100Feed"+feed+"KW").textContent=showKW(value)+" / "+showKW(plan.capacityKW);
    $("floor100Feed"+feed+"Pct").textContent=percent+"% TARGET · "+showW(value*1000);
    $("floor100Feed"+feed+"Bar").style.width=Math.min(100,percent)+"%";
   }
   const summary=$("floor100FeedPlanStatus");
   summary.dataset.status=plan.status==="OVER_CAPACITY"?"over":
    plan.status==="UNASSIGNED_DEMAND"?"unassigned":"within";
   summary.textContent=plan.status==="OVER_CAPACITY"?
    ("DEMO CAPACITY WARNING · "+showKW(Math.max(0,plan.aKW-plan.capacityKW)+Math.max(0,plan.bKW-plan.capacityKW))+
     " OVER ASSUMED FEED CAPACITY · NO ACTUAL TRANSFER VERIFIED"):
    plan.status==="UNASSIGNED_DEMAND"?
     ("GRID LOSS WHAT-IF · "+showKW(plan.unassignedKW)+" DEMAND UNASSIGNED · GENERATOR/UPS TRANSFER NOT MODELED"):
     ("WHAT-IF WITHIN ASSUMED "+showKW(plan.capacityKW)+"/FEED · NOT REAL POWER STATUS");
   if(feedRowGrid.children.length!==10){
    for(let i=0;i<10;i++){
     const button=document.createElement("button");button.type="button";
     button.dataset.row=String(i+1);button.className="floor100-feed-row";
     button.addEventListener("click",()=>selectRack("R"+String(i*10+1).padStart(3,"0")));
     feedRowGrid.appendChild(button);
    }
   }
   for(const item of plan.rows){
    const b=feedRowGrid.children[item.row-1];
    b.dataset.status=item.aOver||item.bOver?"over":
     item.unassignedKW>0?"unassigned":"within";
    b.textContent="ROW "+item.row+" · A "+showKW(item.aKW)+" / B "+showKW(item.bKW)+
     (item.unassignedKW?" / UNASSIGNED "+showKW(item.unassignedKW):"");
    b.title="Select row "+item.row+" · schematic A/B load target, not measured";
   }
  }
  const paths=state()?.getFloor100PowerPaths?.()||[];
  traceSelect.value=d.powerPathMode;
  const traceRack=paths[0]?.rackId??null;
  traceStatus.dataset.active=String(paths.length>0);
  traceStatus.textContent=paths.length?
   ("TRACE "+traceRack+" · "+paths.map(p=>"FEED "+p.feed+" "+p.visualState.toUpperCase()+
     " · "+p.segments.length+" LINE SEGMENTS / UPS BANK "+p.bankReference).join(" | ")+
    " · SCHEMATIC ONLY; NO ELECTRICAL AVAILABILITY MEASURED"):
   "Choose a rack, then trace its simulated A/B power route.";
  for(const feed of ["A","B"]){
   const path=paths.find(p=>p.feed===feed),el=$("floor100Trace"+feed);
   el.dataset.visual=path?.visualState||"off";
   el.textContent=path?("FEED "+feed+" · "+path.visualState.toUpperCase()+
    " · UPS GALLERY BANK "+path.bankReference):("FEED "+feed+" · NOT SELECTED");
  }
  traceSteps.replaceChildren();
  if(paths.length){
   for(const step of paths[0].segments){
    const li=document.createElement("li");li.textContent=step.name;
    traceSteps.appendChild(li);
   }
  }
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
  wattInput.disabled=!currentPower;
  $("floor100ApplyRackWatts").disabled=!currentPower;
  $("floor100ResetRackWatts").disabled=!currentPower;
  $("floor100ResetAllRackWatts").disabled=!modeledPower?.customizedRacks;
  wattInput.value=currentPower?String(currentPower.baselineW):"";
  wattStatus.textContent=(modeledPower?.customizedRacks||0)+" CUSTOM RACK LOADS / BROWSER-ONLY"+(wattMessage?" · "+wattMessage:"");
  wattStatus.dataset.status=wattMessage.startsWith("REJECTED")?"error":"normal";
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
 $("floor100ApplyRackWatts").addEventListener("click",()=>{
  const rackId=state()?.getFloor100Diagnostics?.()?.selected;
  const raw=wattInput.value.trim(),w=Number(raw);
  if(!rackId||raw===""||!/^[0-9]+$/.test(raw)||!state()?.setFloor100RackBaselineWatts?.(rackId,w)){
   wattMessage="REJECTED: use an integer from 0 to 250,000 W in 100 W steps.";render();return;
  }
  const saved=saveWattPresets();
  wattMessage="Saved "+rackId+" baseline "+showW(w)+(saved?"":"; browser storage unavailable");
  render();
 });
 $("floor100ResetRackWatts").addEventListener("click",()=>{
  const rackId=state()?.getFloor100Diagnostics?.()?.selected;
  if(!rackId||!state()?.resetFloor100RackBaselineWatts?.(rackId))return;
  wattMessage="Reset "+rackId+" to default DEMO baseline";saveWattPresets();render();
 });
 $("floor100ResetAllRackWatts").addEventListener("click",()=>{
  if(!state()?.resetFloor100RackBaselineWatts?.(null))return;
  wattMessage="All 100 rack baseline overrides cleared";saveWattPresets();render();
 });
 wattFile.addEventListener("change",async()=>{
  const file=wattFile.files?.[0];
  if(!file)return;
  try{
   if(file.size>65536)throw Error("JSON file exceeds 64 KB");
   const data=JSON.parse(await file.text());
   if(!data||data.format!=="SPARK-FLOOR100-POWER-ESTIMATE-1"||
      data.source!=="BROWSER_ONLY_DEMO_ASSUMPTIONS"||
      !data.customOverrides||typeof data.customOverrides!=="object")
    throw Error("Not a SPARK demo power-estimate JSON");
   if(!state()?.replaceFloor100RackBaselineOverrides?.(data.customOverrides))
    throw Error("Invalid rack identifier or baseline watts");
   wattMessage="Imported validated "+Object.keys(data.customOverrides).length+" rack baselines";
   saveWattPresets();
  }catch(e){wattMessage="REJECTED: "+String(e?.message||e).slice(0,140)}
  wattFile.value="";render();
 });
 coolTraceSelect.addEventListener("change",()=>{
  const mode=coolTraceSelect.value;
  if(mode!=="off"){
   if(!state()?.getFloor100Diagnostics?.()?.selected)selectRack("R001");
   state()?.setFloor100Filter?.("cooling");
   state()?.setFloor100Side?.("rear");
  }
  state()?.setFloor100CoolingTraceMode?.(mode);render();
 });
 for(const el of [isolationRow,failedCdu])el.addEventListener("change",()=>{
  state()?.setFloor100CoolantIsolation?.({
   isolatedRow:Number(isolationRow.value),failedCdu:Number(failedCdu.value)
  });
  state()?.setFloor100Filter?.("cooling");render();
 });
 $("floor100CoolantFaultReset").addEventListener("click",()=>{
  state()?.setFloor100CoolantIsolation?.({isolatedRow:0,failedCdu:0});render();
 });
 $("floor100CoolTraceReset").addEventListener("click",()=>{
  state()?.setFloor100CoolingTraceMode?.("off");render();
 });
 for(const el of [liquidSelect,cduCapSelect,availableSelect]){
  el.addEventListener("change",()=>{
   state()?.setFloor100ThermalAssumptions?.({
    liquidCapturePercent:Number(liquidSelect.value),cduCapacityKW:Number(cduCapSelect.value),
    availableCDUs:Number(availableSelect.value)
   });render();
  });
 }
 waterDeltaSelect.addEventListener("change",()=>{
  state()?.setFloor100WaterDeltaTK?.(Number(waterDeltaSelect.value));render();
 });
 for(const el of [pipeDiameter,pipeLength])el.addEventListener("change",()=>{
  state()?.setFloor100HydraulicAssumptions?.({
   diameterMM:Number(pipeDiameter.value),oneWayLengthM:Number(pipeLength.value)
  });render();
 });
 capSelect.addEventListener("change",()=>{
  state()?.setFloor100FeedCapacityKW?.(Number(capSelect.value));render();
 });
 loadSelect.addEventListener("change",()=>{
  state()?.setFloor100LoadPercent?.(Number(loadSelect.value));render();
 });
 heatButton.addEventListener("click",()=>{
  state()?.setFloor100PowerHeatmap?.(!state()?.getFloor100Diagnostics?.()?.powerHeatmap);render();
 });
 $("floor100ExportPower").addEventListener("click",()=>{
  const profile=state()?.getFloor100PowerModel?.();if(!profile)return;
  const data=JSON.stringify({format:"SPARK-FLOOR100-POWER-ESTIMATE-1",
   source:"BROWSER_ONLY_DEMO_ASSUMPTIONS",createdAt:new Date().toISOString(),...profile,
   selectedSchematicPaths:state()?.getFloor100PowerPaths?.()||[],
   hypotheticalFeedPlan:state()?.getFloor100FeedAllocation?.()||null,
   hypotheticalThermalPlan:state()?.getFloor100ThermalPlan?.()||null,
   hypotheticalComputeWaterBalance:state()?.getFloor100WaterBalance?.()||null,
   hypotheticalRowHydraulicSensitivity:state()?.getFloor100HydraulicPlan?.()||null,
   hypotheticalCoolantIsolation:state()?.getFloor100CoolantFault?.()||null,
   visualCoolantPipeAudit:state()?.getFloor100CoolantTopology?.()?.audit||null,
   selectedSchematicCoolingPaths:state()?.getFloor100CoolingPaths?.()||[]},null,2);
  const blob=new Blob([data],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="spark-floor100-power-estimate-NOT-TELEMETRY.json";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 traceSelect.addEventListener("change",()=>{
  const mode=traceSelect.value;
  if(mode!=="off"){
   if(!state()?.getFloor100Diagnostics?.()?.selected)selectRack("R001");
   state()?.setFloor100Filter?.("power");
   state()?.setFloor100Side?.("rear");
  }
  state()?.setFloor100PowerPathMode?.(mode);
  render();
 });
 $("floor100TraceReset").addEventListener("click",()=>{
  state()?.setFloor100PowerPathMode?.("off");render();
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
