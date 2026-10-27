import {strict as assert} from "node:assert";
import {VISUAL_ROUTES,LAYER_LABELS} from "../routing/visual-routing.mjs";
import {selectedVisualRoutes,exportVisualManifest,exportVisualSvg,EXPORT_DISCLAIMER} from "../routing/visual-export.mjs";
let checked=0;
for(let layer=0;layer<LAYER_LABELS.length;layer++){
 for(const corridor of ["ALL","RF","FLASH","IO","NPU"]){
  const routes=selectedVisualRoutes(layer,corridor),json=JSON.parse(exportVisualManifest(layer,corridor)),svg=exportVisualSvg(layer,corridor);
  assert.equal(routes.length,corridor==="ALL"?28:7);
  assert.equal(json.visualRouteCount,routes.length);
  assert.equal(json.selectedLayer,layer);assert.equal(json.selectedCorridor,corridor);
  assert.equal(json.manufacturingApproved,false);
  assert.equal(json.electricalVerification,false);
  assert.equal(json.kiCadDRC,false);
  assert.equal(json.kiCadERC,false);
  assert.ok(json.disclaimer.includes("NOT FOR FABRICATION"));
  assert.ok(json.sceneCoordinateUnits.includes("not millimeters"));
  assert.equal(json.visualRoutes.length,routes.length);
  for(let i=0;i<routes.length;i++){
   assert.equal(json.visualRoutes[i].visualId,routes[i].id);
   assert.deepEqual(json.visualRoutes[i].illustrativePoints,routes[i].points);
  }
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes("NOT FOR FABRICATION"));
  assert.ok(svg.includes("NOT A GERBER")===false);
  assert.ok(svg.includes("No Gerber layers"));
  assert.equal((svg.match(/<polyline\b/g)||[]).length,routes.length);
  assert.ok(svg.includes('role="img"'));
  checked++;
 }
}
for(const bad of [-2,-1,8,9,1.5,NaN,"1"]){
 assert.throws(()=>exportVisualSvg(bad),RangeError);
 assert.throws(()=>exportVisualManifest(bad),RangeError);
}
assert.throws(()=>exportVisualSvg(0,"POWER"),RangeError);
assert.throws(()=>exportVisualManifest(0,"GROUND"),RangeError);
assert.equal(VISUAL_ROUTES.length,224);
console.log(JSON.stringify({tests:checked,layers:LAYER_LABELS.length,routeCount:VISUAL_ROUTES.length,negativeValidation:"PASS",disclaimer:EXPORT_DISCLAIMER,manufacturingApproved:false,result:"PASS"},null,2));
