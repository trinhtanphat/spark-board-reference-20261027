/**
 * SCHEMATIC 3D coolant route. Coordinates are artistic units, not measured metres.
 * Each rack route follows the same shared trunks and drops rendered in 3D.
 */
export const FLOOR100_COOLING_TRACE_MODES=Object.freeze(["off","both","supply","return"]);
export const FLOOR100_COOLING_HARDWARE_GUIDE="https://docs.nvidia.com/dgx/dgxvr-user-guide/hardware.html";
export const FLOOR100_COOLANT_CHANNELS=Object.freeze(["supply","return"]);
const round=n=>Math.round(n*1000)/1000;
const point=(x,y,z)=>Object.freeze([round(x),round(y),round(z)]);
const segment=(name,from,to)=>{
 if(from.every((v,i)=>v===to[i]))throw new RangeError("Degenerate liquid pipe");
 const varying=from.filter((x,i)=>x!==to[i]).length;
 if(varying!==1)throw new RangeError("Pipe must be axis-aligned for physical visual audit");
 return Object.freeze({name,from,to});
};
export function floor100CduForRow(row){
 if(!Number.isInteger(row)||row<0||row>9)throw new RangeError("Invalid row");
 const rackZ=(row-4.5)*5.7;
 let closest=0,delta=Infinity;
 for(let i=0;i<8;i++){const d=Math.abs(rackZ-(i-3.5)*7);if(d<delta){closest=i;delta=d;}}
 return closest+1;
}
export function buildFloor100CoolingRoute(rack,channel){
 if(!rack||!/^R[0-9]{3}$/.test(rack.id)||!Number.isFinite(rack.x)||
  !Number.isFinite(rack.z)||!Number.isInteger(rack.row)||rack.row<0||rack.row>9||
  !Number.isInteger(rack.column)||rack.column<0||rack.column>9)
  throw new RangeError("Invalid visual rack");
 if(rack.kind!=="compute")throw new RangeError("Only compute racks have mapped NVL72 coolant manifolds");
 if(!FLOOR100_COOLANT_CHANNELS.includes(channel))throw new RangeError("Unknown cooling channel");
 const supply=channel==="supply",y=supply?8.08:8.38;
 const cdu=floor100CduForRow(rack.row),cduZ=(cdu-4.5)*7;
 const rearZ=rack.z-1.49,headerZ=rack.z+(supply?-1.90:-2.18);
 const x=rack.x+(supply?-1.60:1.60);
 const nodes=[
  point(25,4.5,cduZ),point(23,4.5,cduZ),
  point(23,y,cduZ),point(23,y,headerZ),
  point(x,y,headerZ),point(x,y,rearZ),point(x,3.25,rearZ)
 ];
 const names=["CDU CABINET PORT TO RISER","CDU RISER TO SUPPLY RETURN SPINE",
  "SHARED GALLERY PIPE TO ROW","ROW HEADER TO MANIFOLD BRANCH",
  "REAR MANIFOLD OFFSET","RACK REAR VERTICAL DROP"];
 const forward=names.map((n,i)=>segment(n,nodes[i],nodes[i+1]));
 const segments=supply?forward:forward.map(s=>segment(s.name,s.to,s.from)).reverse();
 return Object.freeze({rackId:rack.id,row:rack.row+1,channel,cduReference:cdu,
  segments,visualOnly:true,
  disclaimer:"Fictitious visual supply+return topology with shared gallery and row headers; NO real pump-head, pressure, control, manifold sizing, redundant CDU routing or measured flow."});
}
export function buildFloor100CoolingRoutes(rack,mode="both"){
 if(!FLOOR100_COOLING_TRACE_MODES.includes(mode))throw new RangeError("Unknown cooling route mode");
 if(!rack||!/^R[0-9]{3}$/.test(rack.id))throw new RangeError("Invalid rack");
 if(mode==="off"||rack.kind!=="compute")return Object.freeze([]);
 return Object.freeze((mode==="both"?FLOOR100_COOLANT_CHANNELS:[mode])
  .map(channel=>buildFloor100CoolingRoute(rack,channel)));
}
