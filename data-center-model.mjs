/**
 * Self-contained NVL72 data-center LAB simulator; NO hardware/network actions.
 * Rack inventory quantities are derived from NVIDIA public hardware guide.
 * Logical ports describe training/topology classes, not a certified cable plan.
 */
export const DATA_CENTER_DISCLAIMER="BROWSER-ONLY SIMULATION - NOT NVIDIA CAD, LIVE CABLING OR HOT-SWAP PROCEDURES";
// Conceptual dense lab spacing, not an installation/service clearance plan.
export const DATA_CENTER_LAYOUT=Object.freeze({rows:4,columns:4,pitchX:4.16,pitchZ:5.25,rackWidth:4.10,rackDepth:2.50});
const gridIds=["A","B","C","D","E","G","H","I","J","K","L","M","N","O","P","F"];
export const DATA_CENTER_RACKS=Object.freeze(gridIds.map((id,i)=>Object.freeze({
 id,label:id==="F"?"NETWORK / FABRIC RACK":"NVL72 GPU RACK "+id,
 kind:id==="F"?"fabric":"compute",row:Math.floor(i/DATA_CENTER_LAYOUT.columns),
 column:i%DATA_CENTER_LAYOUT.columns
})));
export const DATA_CENTER_GPU_RACKS=Object.freeze(DATA_CENTER_RACKS.filter(r=>r.kind==="compute").map(r=>r.id));
export const FABRICS=Object.freeze({
 compute:{label:"InfiniBand / computenet",media:"OSFP",color:"#a0e478"},
 storage:{label:"Ethernet / storagenet",media:"QSFP",color:"#6ec7d9"},
 management:{label:"Ethernet / ipminet",media:"RJ45",color:"#f2c27f"}
});
const DEVICE_TYPES=Object.freeze({
 compute:"NVL72 compute tray (4 GPU + 2 Vera CPU)",
 nvlink:"NVLink 6 switch tray",
 power:"54V power shelf / 6 PSU",
 tor:"NVL72 TOR management switch",
 ib:"InfiniBand fabric switch (concept)",
 eth:"Ethernet storage fabric switch (concept)",
 mgmt:"Ethernet management switch (concept)"
});
export const DEVICE_TYPE_LABELS=DEVICE_TYPES;
function buildSlots(){
 const all=[];
 for(const rack of DATA_CENTER_GPU_RACKS){
  for(const [kind,short,count] of [["compute","C",18],["nvlink","N",9],["power","P",4],["tor","T",2]]){
   for(let i=1;i<=count;i++){
    const id=rack+"-"+short+String(i).padStart(2,"0");
    all.push({id,rack,kind,label:DEVICE_TYPES[kind]+" "+String(i).padStart(2,"0"),installed:true,drawer:false});
   }
  }
 }
 for(const [kind,short] of [["ib","I"],["eth","E"],["mgmt","M"]]){
  all.push({id:"F-"+short+"01",rack:"F",kind,label:DEVICE_TYPES[kind],installed:true,drawer:false});
 }
 return all;
}
function buildPorts(slots){
 const ports=[];
 for(const slot of slots){
  if(slot.kind!=="compute")continue;
  for(const [suffix,fabric] of [["CX9","compute"],["BF4","storage"],["BMC","management"]]){
   ports.push({id:slot.id+":"+suffix,slotId:slot.id,role:"source",fabric,media:FABRICS[fabric].media,label:slot.id+" "+suffix+" ("+fabric+")"});
  }
 }
 for(const [kind,prefix,fabric] of [["ib","I","compute"],["eth","E","storage"],["mgmt","M","management"]]){
  const slot=slots.find(s=>s.rack==="F"&&s.kind===kind);
  // Conceptual fabric capacity is matched to all 15 x 18 compute trays,
  // not an assertion that the real switch has 270 physical front-panel ports.
  for(let i=1;i<=DATA_CENTER_GPU_RACKS.length*18;i++){
   const portNo=i<=36?String(i).padStart(2,"0"):String(i).padStart(3,"0");
   ports.push({id:"F:"+prefix+portNo,slotId:slot.id,role:"target",fabric,media:FABRICS[fabric].media,label:"FABRIC "+prefix+portNo+" ("+fabric+")"});
  }
 }
 return ports;
}
const clone=x=>JSON.parse(JSON.stringify(x));
export function createDataCenterState(){
 const slots=buildSlots(),ports=buildPorts(slots);
 const cables=[],events=[];
 let nextId=1,listener=()=>{};
 const bySlot=id=>slots.find(s=>s.id===id),byPort=id=>ports.find(p=>p.id===id);
 const log=(action,detail)=>{
  events.unshift({action,detail});if(events.length>24)events.length=24;
  listener();return true;
 };
 const requireSlot=id=>{const s=bySlot(id);if(!s)throw new RangeError("Unknown rack slot");return s};
 const ensurePort=p=>{const port=byPort(p);if(!port)throw new RangeError("Unknown port");const s=requireSlot(port.slotId);if(!s.installed)throw new Error("Port unavailable: module removed");return port};
 return {
  onChange(fn){listener=typeof fn==="function"?fn:()=>{}},
  slots,ports,cables,racks:DATA_CENTER_RACKS,
  getSnapshot(){return clone({slots,ports,cables,events,stats:this.stats(),disclaimer:DATA_CENTER_DISCLAIMER})},
  rackSummaries(){
   // Computed from current simulation slots and virtual cables, never from
   // independently maintained/stale UI counters.
   return DATA_CENTER_RACKS.map(rack=>{
    const own=slots.filter(s=>s.rack===rack.id);
    const installed=own.filter(s=>s.installed);
    const connected=cables.filter(c=>
     bySlot(byPort(c.source).slotId)?.rack===rack.id||
     bySlot(byPort(c.target).slotId)?.rack===rack.id).length;
    const compute=installed.filter(s=>s.kind==="compute").length;
    const drawn=installed.filter(s=>s.drawer).length;
    return {id:rack.id,label:rack.label,kind:rack.kind,row:rack.row,column:rack.column,
     slots:own.length,installed:installed.length,removed:own.length-installed.length,
     extended:drawn,gpus:compute*4,cpus:compute*2,cables:connected,
     status:own.length!==installed.length?"missing":drawn?"service":"ready"};
   });
  },
  rackSummary(id){
   const summary=this.rackSummaries().find(r=>r.id===id);
   if(!summary)throw new RangeError("Unknown rack");
   return summary;
  },
  stats(){
   const computeInstalled=slots.filter(s=>s.kind==="compute"&&s.installed).length;
   return {racks:DATA_CENTER_RACKS.length,computeRacks:DATA_CENTER_GPU_RACKS.length,computeTraysInstalled:computeInstalled,
    gpuOnlineEquivalent:computeInstalled*4,cpuOnlineEquivalent:computeInstalled*2,
    modulesInstalled:slots.filter(s=>s.installed).length,
    modulesRemoved:slots.filter(s=>!s.installed).length,
    cablesConnected:cables.length,connectionsByFabric:Object.fromEntries(Object.keys(FABRICS).map(k=>[k,cables.filter(c=>c.fabric===k).length])),
    purelySimulated:true};
  },
  toggleDrawer(slotId){
   const s=requireSlot(slotId);
   if(!s.installed)throw new Error("Install a compatible module first");
   const was=s.drawer;
   for(const other of slots)if(other.rack===s.rack)other.drawer=false;
   s.drawer=!was;
   return log("drawer",s.id+" "+(s.drawer?"extended":"closed"));
  },
  remove(slotId){
   const s=requireSlot(slotId);
   if(!s.installed)throw new Error("Slot already empty");
   if(cables.some(c=>byPort(c.source).slotId===s.id||byPort(c.target).slotId===s.id))
    throw new Error("Disconnect associated simulated cables before removing this module");
   s.installed=false;s.drawer=false;
   return log("remove",s.id+" removed in simulation");
  },
  install(slotId,kind){
   const s=requireSlot(slotId);
   if(s.installed)throw new Error("Slot already occupied");
   if(kind!==s.kind)throw new Error("Incompatible module: expected "+s.kind);
   s.installed=true;s.drawer=false;
   return log("install",s.id+" "+kind+" installed in simulation");
  },
  connect(sourceId,targetId){
   const a=ensurePort(sourceId),b=ensurePort(targetId);
   if(a.role!=="source"||b.role!=="target")throw new Error("Choose a rack output and a fabric-rack input");
   if(a.fabric!==b.fabric)throw new Error("Incompatible network: "+a.fabric+" cannot attach to "+b.fabric);
   if(a.media!==b.media)throw new Error("Connector mismatch: "+a.media+" / "+b.media);
   if(cables.some(c=>c.source===a.id||c.target===b.id))throw new Error("Port already occupied; unplug first");
   const id="C"+String(nextId++).padStart(3,"0");
   cables.push({id,source:a.id,target:b.id,fabric:a.fabric,media:a.media});
   log("connect",id+" "+a.id+" -> "+b.id);
   return id;
  },
  disconnect(id){
   const i=cables.findIndex(c=>c.id===id);
   if(i<0)throw new RangeError("Cable not found");
   const [c]=cables.splice(i,1);
   return log("disconnect",c.id+" "+c.source+" -> "+c.target);
  },
  reset(){
   const clean=buildSlots();slots.splice(0,slots.length,...clean);
   cables.splice(0);nextId=1;events.splice(0);
   return log("reset","Reset simulated equipment and cables (no physical systems affected)");
  },
  availableSources(){return ports.filter(p=>p.role==="source"&&bySlot(p.slotId).installed)},
  availableTargets(fabric){return ports.filter(p=>p.role==="target"&&(!fabric||p.fabric===fabric)&&bySlot(p.slotId).installed)}
 };
}
