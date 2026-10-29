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
 const pumpSpeed=$("floor100PumpSpeed"),pumpHead=$("floor100PumpHead");
 const networkValve=$("floor100NetworkValve"),networkHX=$("floor100NetworkHX");
 const networkHeader=$("floor100NetworkHeader");
 const cduCards=$("floor100CduBanks");
 const transientIncident=$("floor100TransientIncident"),transientRecovery=$("floor100TransientRecovery");
 const transientMass=$("floor100TransientMass");
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
  const transient=state()?.getFloor100ThermalTransient?.();
  if(transient){
   const t=transient,a=t.assumptions;
   transientIncident.value=String(a.incidentMinutes);
   transientRecovery.value=String(a.recoveryMinutes);
   transientMass.value=String(a.equivalentCapacityKJPerK);
   $("floor100TransientPeak").textContent=kw.format(t.maxProxyC)+" °C PROXY";
   $("floor100TransientRise").textContent="+"+kw.format(t.peakRiseC)+" K";
   $("floor100TransientEnd").textContent=kw.format(t.recoveryEndMaxProxyC)+" °C PROXY";
   $("floor100TransientAffected").textContent=t.affectedRows.length?
    ("ROWS "+t.affectedRows.join(", ")):("NONE / BASELINE");
   $("floor100TransientStatus").textContent=t.noInputChange?
    "NO CHANGED PUMP OR VALVE SCENARIO · FLAT 30°C PROXY THROUGH THE TIMELINE":
    ("DEMO EVENT "+t.incidentStartMinute+"–"+t.incidentEndMinute+" MIN · RECOVER UNTIL "+
     t.totalMinutes+" MIN · NO MEASURED TEMPERATURE");
   const svg=$("floor100TransientChart");
   const ns="http://www.w3.org/2000/svg";
   svg.replaceChildren();
   const make=(tag,attr={},text=null)=>{
    const el=document.createElementNS(ns,tag);
    for(const [k,v] of Object.entries(attr))el.setAttribute(k,String(v));
    if(text!==null)el.textContent=text;
    svg.appendChild(el);return el;
   };
   const all=t.timeline.flatMap(p=>p.rowProxyC),minC=Math.floor(Math.min(29.5,...all)-.6),
    maxC=Math.ceil(Math.max(30.5,...all)+.6);
   const xp=m=>56+(m/t.totalMinutes)*860;
   const yp=c=>186-((c-minC)/(maxC-minC))*151;
   for(let j=0;j<=4;j++){
    const c=minC+(maxC-minC)*j/4,y=yp(c);
    make("line",{x1:54,y1:y,x2:920,y2:y,stroke:"#547b82","stroke-width":.6});
    make("text",{x:9,y:y+4,fill:"#c8e5df","font-size":12},kw.format(c)+"°");
   }
   const from=xp(t.incidentStartMinute),to=xp(t.incidentEndMinute);
   make("rect",{x:from,y:16,width:to-from,height:171,fill:"#794b50","fill-opacity":.24});
   for(const [min,label] of [[0,"0"],[t.incidentStartMinute,"INCIDENT"],[t.incidentEndMinute,"RECOVERY"],[t.totalMinutes,t.totalMinutes+" min"]]){
    make("line",{x1:xp(min),y1:15,x2:xp(min),y2:189,stroke:"#b9e2ce","stroke-width":.8,"stroke-dasharray":"4 5"});
    make("text",{x:xp(min),y:207,fill:"#cae6dc","font-size":10,"text-anchor":min===0?"start":min===t.totalMinutes?"end":"middle"},label);
   }
   const lines=(data)=>data.map((p)=>xp(p.minute).toFixed(2)+","+yp(p.value).toFixed(2)).join(" ");
   for(let row=0;row<10;row++){
    const pts=lines(t.timeline.map(p=>({minute:p.minute,value:p.rowProxyC[row]})));
    make("polyline",{points:pts,fill:"none",stroke:"#8dcbca","stroke-opacity":.38,
     "stroke-width":1.1,class:"floor100-transient-curve","data-row":row+1});
   }
   const selectedEntry=modeledPower?.entries.find(p=>p.id===focus);
   const selectedRow=selectedEntry?.row??(t.affectedRows.length?t.affectedRows[0]-1:0);
   make("polyline",{points:lines(t.timeline.map(p=>({minute:p.minute,value:p.rowProxyC[selectedRow]}))),
    fill:"none",stroke:"#f5e398","stroke-width":2.5,class:"floor100-transient-selected"});
   make("polyline",{points:lines(t.timeline.map(p=>({minute:p.minute,value:p.maxProxyC}))),
    fill:"none",stroke:"#ff998b","stroke-width":2.6,class:"floor100-transient-peak"});
   $("floor100TransientSelected").textContent="ROW "+(selectedRow+1)+" · CDU "+
    t.rows[selectedRow].cdu+" · END "+kw.format(t.timeline.at(-1).rowProxyC[selectedRow])+
    "°C PROXY · PEAK "+kw.format(Math.max(...t.timeline.map(p=>p.rowProxyC[selectedRow])))+
    "°C PROXY · YELLOW SELECTED / RED MAX / GREY OTHER ROWS";
  }
  const cduPlan=state()?.getFloor100CduBankPlan?.();
  if(cduPlan){
   $("floor100CduSumFlow").textContent=kw.format(cduPlan.modeledFlowLpm)+" L/min";
   $("floor100CduDemand").textContent=kw.format(cduPlan.designTargetLpm)+" L/min";
   $("floor100CduBlocked").textContent=kw.format(cduPlan.blockedDemandLpm)+" L/min";
   $("floor100CduResidual").textContent=kw.format(cduPlan.maxPressureResidualKPa)+" kPa";
   if(cduCards.children.length!==8){
    cduCards.replaceChildren();
    for(let i=0;i<8;i++){
     const card=document.createElement("article");
     card.className="floor100-cdu-bank";card.dataset.cdu=String(i+1);
     const title=document.createElement("strong");title.textContent="CDU "+String(i+1);
     const select=document.createElement("select");
     select.setAttribute("aria-label","Hypothetical pump speed CDU "+(i+1));
     select.className="floor100-cdu-bank-speed";
     for(const val of [0,60,80,100]){
      const opt=document.createElement("option");opt.value=String(val);
      opt.textContent=val===0?"PUMP OFF":val+"% PUMP";
      select.appendChild(opt);
     }
     select.addEventListener("change",()=>{
      state()?.setFloor100CduPumpSpeed?.(i+1,Number(select.value));render();
     });
     const info=document.createElement("output");info.className="floor100-cdu-bank-flow";
     const loss=document.createElement("small");loss.className="floor100-cdu-bank-loss";
     card.append(title,select,info,loss);cduCards.appendChild(card);
    }
   }
   for(const bank of cduPlan.banks){
    const card=cduCards.children[bank.cdu-1];
    card.dataset.status=bank.status;
    card.querySelector("select").value=String(bank.pumpSpeedPercent);
    card.querySelector(".floor100-cdu-bank-flow").textContent=
     kw.format(bank.modeledLpm)+" L/min · "+kw.format(bank.pumpHeadKPa)+" kPa";
    card.querySelector(".floor100-cdu-bank-loss").textContent=
     "ROWS "+bank.rowNumbers.join(", ")+" · "+bank.status.replaceAll("_"," ")+
     " · ΔP balance "+kw.format(bank.headResidualKPa)+" kPa";
   }
   const selectedEntry=state()?.getFloor100PowerModel?.()?.entries.find(r=>r.id===focus);
   const rr=selectedEntry?cduPlan.rows[selectedEntry.row]:null;
   $("floor100CduSelected").textContent=rr?
    ("ROW "+rr.row+" · CDU "+rr.cduReference+" · "+
     kw.format(rr.modeledLpm)+" L/min / "+kw.format(rr.targetLpm)+
     " L/min target · "+(rr.blocked?"BLOCKED / DEMO":"INDEPENDENT SIMULATED PUMP")):
    "8 independent fictional CDU circuits; select a compute rack or change one CDU speed.";
  }
  const hydronic=state()?.getFloor100HydronicNetwork?.();
  if(hydronic){
   const n=hydronic,assumed=n.assumptions;
   pumpSpeed.value=String(assumed.pumpSpeedPercent);
   pumpHead.value=String(assumed.shutoffHeadKPa);
   networkValve.value=String(assumed.valveDropAtDesignKPa);
   networkHX.value=String(assumed.heatExchangerDropAtDesignKPa);
   networkHeader.value=String(assumed.headerDiameterMM);
   $("floor100NetworkFlow").textContent=kw.format(n.modeledFlowLpm)+" L/min";
   $("floor100NetworkPumpKPa").textContent=kw.format(n.pumpHeadKPa)+" kPa";
   $("floor100NetworkHeaderKPa").textContent=kw.format(n.mainHeadKPa)+" kPa";
   $("floor100NetworkResidual").textContent=kw.format(n.balanceResidualKPa)+" kPa";
   const selected=modeledPower?.entries.find(x=>x.id===focus);
   const selectedRow=selected?n.rows[selected.row]:null;
   $("floor100NetworkSelected").textContent=selectedRow?
    ("ROW "+selectedRow.row+" · "+kw.format(selectedRow.modeledLpm)+" MODELED L/min vs "+
     kw.format(selectedRow.requestedLpm)+" TARGET · "+
     kw.format(selectedRow.branchDropKPa)+" kPa branch · "+
     (selectedRow.blocked?"ISOLATED DEMO ROW":"NOT REAL SUPPLIED FLOW")):
    ("TEN PARALLEL DEMO BRANCHES · OPEN TARGET "+kw.format(n.openDemandLpm)+
     " L/min · ISOLATED TARGET "+kw.format(n.isolatedDemandLpm)+" L/min · NOT LIVE DATA");
   const bar=$("floor100NetworkRows");
   if(bar.children.length!==10){
    for(let i=0;i<10;i++){
     const b=document.createElement("button");
     b.type="button";b.className="floor100-network-row";
     b.addEventListener("click",()=>selectRack("R"+String(i*10+1).padStart(3,"0")));
     bar.appendChild(b);
    }
   }
   for(const row of n.rows){
    const b=bar.children[row.row-1];
    b.textContent="R"+row.row+" · "+kw.format(row.modeledLpm)+" L/min";
    b.dataset.blocked=String(row.blocked);
    b.setAttribute("aria-pressed",String(selectedRow?.row===row.row));
   }
  }
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
 for(const el of [transientIncident,transientRecovery,transientMass])el.addEventListener("change",()=>{
  state()?.setFloor100ThermalTransientOptions?.({
   incidentMinutes:Number(transientIncident.value),
   recoveryMinutes:Number(transientRecovery.value),
   equivalentCapacityKJPerK:Number(transientMass.value)
  });render();
 });
 for(const el of [pumpSpeed,pumpHead,networkValve,networkHX,networkHeader]){
  el.addEventListener("change",()=>{
   state()?.setFloor100HydronicAssumptions?.({
    pumpSpeedPercent:Number(pumpSpeed.value),
    shutoffHeadKPa:Number(pumpHead.value),
    valveDropAtDesignKPa:Number(networkValve.value),
    heatExchangerDropAtDesignKPa:Number(networkHX.value),
    headerDiameterMM:Number(networkHeader.value)
   });render();
  });
 }
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
   hypotheticalParallelPumpOperatingPoint:state()?.getFloor100HydronicNetwork?.()||null,
   hypotheticalEightIndependentCduBanks:state()?.getFloor100CduBankPlan?.()||null,
   hypotheticalThermalTransient:state()?.getFloor100ThermalTransient?.()||null,
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
