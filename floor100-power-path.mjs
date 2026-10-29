/**
 * A/B electrical path explorer for SPARK's illustrated single-floor 100-rack scene.
 * All positions are artistic Three.js units; every segment is a visual cue.
 * This is NOT an NVIDIA wiring diagram, busway specification, engineered
 * UPS/ATS topology, qualified transfer sequence, or live electrical monitor.
 */
export const FLOOR100_TRACE_MODES=Object.freeze(["off","both","A","B"]);
export const FLOOR100_POWER_REFERENCE="https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html";
// Shared source for all 3D graphic coordinates: no wiring specifications.
export const FLOOR100_VISUAL_POWER_GEOMETRY=Object.freeze({
 upsTopY:3.95,portY:2.75,entryOffsetZ:-1.64,rearPanelOffsetZ:-1.37,
 feeds:Object.freeze({
  A:Object.freeze({kind:"powerA",trunkX:-20.7,topY:8.87,upsX:-26.1,offsetX:-1.35,offsetZ:0}),
  B:Object.freeze({kind:"powerB",trunkX:-20.3,topY:9.02,upsX:-25.9,offsetX:1.35,offsetZ:.3})
 })
});
const galleryBankZ=Object.freeze([-18,-6,6,18]);
const point=(x,y,z)=>Object.freeze([Math.round(x*1000)/1000,Math.round(y*1000)/1000,Math.round(z*1000)/1000]);
function segment(name,a,b){
 if(a.every((v,i)=>v===b[i]))throw new RangeError("Degenerate visual segment");
 return Object.freeze({name,from:a,to:b});
}
export function buildFloor100FeedRoute(rack,feed,scenario="normal"){
 if(!rack||!/^R[0-9]{3}$/.test(rack.id)||!Number.isFinite(rack.x)||
  !Number.isFinite(rack.z)||!Number.isInteger(rack.row)||rack.row<0||
  rack.row>9||!Number.isInteger(rack.column)||rack.column<0||rack.column>9)
  throw new RangeError("Invalid visual rack");
 if(feed!=="A"&&feed!=="B")throw new RangeError("Feed must be A or B");
 if(!["normal","a-loss","b-loss","grid-loss"].includes(scenario))throw new RangeError("Invalid illustrative incident");
 const v=FLOOR100_VISUAL_POWER_GEOMETRY,d=v.feeds[feed];
 const trunkX=d.trunkX,trunkY=d.topY;
 const rowZ=rack.z+d.offsetZ,landingX=rack.x+d.offsetX;
 const entryZ=rack.z+v.entryOffsetZ;
 const bankZ=galleryBankZ.reduce((best,z)=>Math.abs(z-rack.z)<Math.abs(best-rack.z)?z:best,galleryBankZ[0]);
 const nodes=Object.freeze([
  point(d.upsX,v.upsTopY,bankZ),
  point(d.upsX,trunkY,bankZ),
  point(trunkX,trunkY,bankZ),
  point(trunkX,trunkY,rowZ),
  point(landingX,trunkY,rowZ),
  point(landingX,trunkY,entryZ),
  point(landingX,v.portY,entryZ),
  point(landingX,v.portY,rack.z+v.rearPanelOffsetZ)
 ]);
 const labels=["UPS GALLERY VERTICAL RISER","UPS TO A/B TRUNK","TRUNK ALONG SERVICE GALLERY",
  "ROW A/B DISTRIBUTION","REAR ELBOW TO CABINET","VERTICAL REAR FEED DROP",
  "CABINET REAR PORT COUPLER"];
 const segments=labels.map((name,i)=>segment(name,nodes[i],nodes[i+1]));
 const dimmed=scenario==="grid-loss"||(feed==="A"&&scenario==="a-loss")||
  (feed==="B"&&scenario==="b-loss");
 return Object.freeze({rackId:rack.id,row:rack.row+1,feed,scenario,
  visualState:dimmed?"dimmed":"shown",bankReference:galleryBankZ.indexOf(bankZ)+1,
  segments,disclaimer:"SCHEMATIC VISUAL TRACE ONLY - no live load reading, power availability, A/B redundancy, ATS transfer or equipment topology validation."});
}
export function buildFloor100FeedRoutes(rack,mode="both",scenario="normal"){
 if(!FLOOR100_TRACE_MODES.includes(mode))throw new RangeError("Invalid trace mode");
 return Object.freeze((mode==="off"?[]:mode==="both"?["A","B"]:[mode])
  .map(feed=>buildFloor100FeedRoute(rack,feed,scenario)));
}
