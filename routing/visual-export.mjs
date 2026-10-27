/**
 * Deterministic NON-FABRICATION exports for the SPARK visual concept.
 * NOT Gerber, KiCad, manufacturing artwork, or electrical nets.
 */
import {VISUAL_ROUTES,LAYER_LABELS,ILLUSTRATIVE_BODY_KEEPOUTS,ROUTING_REVISION,auditIllustrativeGeometry} from "./visual-routing.mjs";
export const EXPORT_DISCLAIMER="VISUAL REFERENCE ONLY - NOT FOR FABRICATION - NO NETLIST OR ELECTRICAL DRC";
const COLORS=Object.freeze({RF:"#efc693",FLASH:"#9cd6c5",IO:"#d4b7f0",NPU:"#c4cf8f"});
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const pixel=([x,z])=>[Number(((x+5.85)*100).toFixed(4)),Number(((3.6-z)*100).toFixed(4))];
export function selectedVisualRoutes(layer,corridor="ALL"){
 if(!Number.isInteger(layer)||layer<0||layer>=LAYER_LABELS.length)throw new RangeError("Invalid conceptual layer");
 if(!["ALL",...Object.keys(COLORS)].includes(corridor))throw new RangeError("Invalid visual corridor");
 return VISUAL_ROUTES.filter(r=>r.layer===layer&&(corridor==="ALL"||r.corridor===corridor));
}
export function exportVisualManifest(layer,corridor="ALL"){
 const routes=selectedVisualRoutes(layer,corridor),geometry=auditIllustrativeGeometry();
 return JSON.stringify({
  format:"spark-illustrative-route-export-v1",revision:ROUTING_REVISION,
  kind:"VISUAL_REFERENCE_ONLY",disclaimer:EXPORT_DISCLAIMER,
  manufacturingApproved:false,electricalVerification:false,kiCadERC:false,kiCadDRC:false,
  sceneCoordinateUnits:"normalized scene units, not millimeters",
  selectedLayer:layer,layerLabel:LAYER_LABELS[layer],selectedCorridor:corridor,
  visualRouteCount:routes.length,
  geometry:{illustrativePass:geometry.visualGeometryPass,manufacturingApproved:false},
  visualRoutes:routes.map(route=>({
   visualId:route.id,visualCorridor:route.corridor,conceptualLayer:route.layer,
   illustrationWidth:route.width,illustrativePoints:route.points.map(p=>[...p])
  }))
 },null,2)+"\n";
}
export function exportVisualSvg(layer,corridor="ALL"){
 const routes=selectedVisualRoutes(layer,corridor);
 const title="SPARK - L"+(layer+1)+" "+LAYER_LABELS[layer]+" - "+corridor+" - VISUAL ART ONLY";
 const keepouts=ILLUSTRATIVE_BODY_KEEPOUTS.map(box=>{
  const [x,y]=pixel([box.minX,box.maxZ]);
  return '<rect x="'+x+'" y="'+y+'" width="'+((box.maxX-box.minX)*100)+'" height="'+((box.maxZ-box.minZ)*100)+'" rx="7" fill="#45514a" fill-opacity=".53" stroke="#a3a991" stroke-dasharray="8 7" stroke-width="2"/><text x="'+(x+6)+'" y="'+(y+23)+'" font-size="17" fill="#e0e6dd">'+esc(box.name)+'</text>';
 }).join("\n");
 const paths=routes.map(r=>'<polyline data-visual-route="'+esc(r.id)+'" points="'+r.points.map(p=>pixel(p).join(",")).join(" ")+'" fill="none" stroke="'+COLORS[r.corridor]+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>').join("\n");
 return '<?xml version="1.0" encoding="UTF-8"?>\n'
 +'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 720" role="img" aria-label="'+esc(title)+'">\n'
 +'<title>'+esc(title)+'</title>\n'
 +'<desc>'+esc(EXPORT_DISCLAIMER)+'. Coordinates are normalized scene units and not physical millimeters. No Gerber layers or electrical net mapping.</desc>\n'
 +'<rect width="1170" height="720" fill="#102820"/>\n'
 +'<rect x="4" y="4" width="1162" height="712" rx="24" fill="none" stroke="#a4af9b" stroke-width="5"/>\n'
 +'<g font-family="monospace"><text x="38" y="47" fill="#e6e5d3" font-size="25" font-weight="bold">'+esc(title)+'</text></g>\n'
 +'<g font-family="monospace">'+keepouts+'</g>\n'
 +'<g>'+paths+'</g>\n'
 +'<rect x="12" y="654" width="1146" height="53" rx="6" fill="#322a25" fill-opacity=".96"/>\n'
 +'<text x="30" y="686" font-family="monospace" font-size="21" font-weight="bold" fill="#ffdcab">'+esc(EXPORT_DISCLAIMER)+'</text>\n'
 +'</svg>\n';
}
