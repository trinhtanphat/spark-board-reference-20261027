/**
 * Illustrative CDU -> COMPUTE rack liquid supply/return route visualization.
 * Numerical lengths are scene coordinates, NOT installation dimensions.
 * NVIDIA documents rack coolant manifolds but DOES NOT certify these
 * fictional floor-level CDU pipe connections, flows or redundancy.
 */
export const FLOOR100_COOLING_TRACE_MODES=Object.freeze(["off","both","supply","return"]);
export const FLOOR100_COOLING_HARDWARE_GUIDE="https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html";
const round=n=>Math.round(n*1000)/1000;
const at=(x,y,z)=>Object.freeze([round(x),round(y),round(z)]);
const link=(name,from,to)=>{
 if(from.every((v,i)=>v===to[i]))throw new RangeError("Degenerate cooling path segment");
 return Object.freeze({name,from,to});
};
export function buildFloor100CoolingRoute(rack,channel){
 if(!rack||!/^R[0-9]{3}$/.test(rack.id)||!Number.isFinite(rack.x)||
 !Number.isFinite(rack.z)||!Number.isInteger(rack.row)||rack.row<0||rack.row>9||
 !Number.isInteger(rack.column)||rack.column<0||rack.column>9)
  throw new RangeError("Invalid visual rack");
 if(rack.kind!=="compute")throw new RangeError("Only illustrated NVL72 compute racks have liquid route detail");
 if(!["supply","return"].includes(channel))throw new RangeError("Unknown cooling line");
 const i=Array.from({length:8},(_,k)=>({k,z:(k-3.5)*7}))
  .reduce((best,p)=>Math.abs(p.z-rack.z)<Math.abs(best.z-rack.z)?p:best,{k:0,z:-24.5});
 const supply=channel==="supply";
 const y=supply?8.08:8.38;
 const outletX=rack.x+(supply?-1.60:1.60),rearZ=rack.z-1.49;
 const cduZ=i.z;
 const nodes=[
  at(25.0,4.5,cduZ),
  at(23.0,y,cduZ),
  at(outletX,y,cduZ),
  at(outletX,y,rearZ),
  at(outletX,3.25,rearZ)
 ];
 const names=["CDU GALLERY SCHEMATIC RISER","OVERHEAD ROW CORRIDOR",
  "RACK REAR MANIFOLD SPUR","CABINET VERTICAL MANIFOLD DROP"];
 const raw=names.map((name,k)=>link(name,nodes[k],nodes[k+1]));
 const segments=supply?raw:raw.map(s=>link(s.name,s.to,s.from)).reverse();
 return Object.freeze({rackId:rack.id,channel,cduReference:i.k+1,
  segments,visualOnly:true,
  disclaimer:"VISUAL COOLING PATH ONLY: no live water flow, hydraulic balancing, coolant pressure, leak detection, temperature, CDU pipe sizing or verified OEM CAD."});
}
export function buildFloor100CoolingRoutes(rack,mode="both"){
 if(!FLOOR100_COOLING_TRACE_MODES.includes(mode))throw new RangeError("Unknown cooling route mode");
 if(!rack||!/^R[0-9]{3}$/.test(rack.id))throw new RangeError("Invalid rack");
 if(mode==="off")return Object.freeze([]);
 if(rack.kind!=="compute")return Object.freeze([]);
 return Object.freeze((mode==="both"?["supply","return"]:[mode])
  .map(channel=>buildFloor100CoolingRoute(rack,channel)));
}
