'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
async function main(){
 const {VISUAL_ROUTES,ILLUSTRATIVE_STITCHING,ROUTING_REVISION,ARTWORK_REQUIRED_GAP,FABRICATION_APPROVED,auditIllustrativeGeometry}=await import('../routing/visual-routing.mjs');
 const scene=fs.readFileSync(path.join(root,'scene3d.js'),'utf8');
 for(const check of ["import { VISUAL_ROUTES, ILLUSTRATIVE_STITCHING","for(const route of VISUAL_ROUTES.filter(route=>route.layer===0))","for(const route of VISUAL_ROUTES.filter(route=>route.layer===n))","getVisualRoutingAudit(){return auditIllustrativeGeometry()}","isIllustrativeRoutingCorridor(x,z,.14)"]){
  if(!scene.includes(check))throw Error('AUDIT_SOURCE_CHANGED: '+check);
 }
 const geometry=auditIllustrativeGeometry();
 if(!geometry.visualGeometryPass||geometry.illustrativeRoutes!==224||geometry.conceptualLayerCount!==8||FABRICATION_APPROVED!==false)
  throw Error('FAIL_CLOSED: bad manifest '+JSON.stringify(geometry));
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  if(['.git','vendor','node_modules'].includes(e.name))return [];
  const f=path.join(dir,e.name);return e.isDirectory()?walk(f):[path.relative(root,f).replaceAll('\\','/')];
 })}
 const files=walk(root),find=ext=>files.filter(s=>s.toLowerCase().endsWith(ext));
 const evidence={schematic:find('.kicad_sch'),board:find('.kicad_pcb'),netlist:find('.net'),gerber:find('.gbr'),drill:find('.drl')};
 const report={schemaVersion:2,project:'SPARK 3D',scope:'illustrative routing geometry only',verdict:'NOT_ELECTRICALLY_VERIFIED',
  manufacturingApproved:false,KiCadERC:'NOT_RUN_NO_SCHEMATIC',KiCadDRC:'NOT_RUN_NO_BOARD',
  visualRoutingRevision:ROUTING_REVISION,visualGeometry:{...geometry,stitchingMarkers:ILLUSTRATIVE_STITCHING.length,requiredGap:ARTWORK_REQUIRED_GAP,units:'normalized 3D units (not millimeters)'},
  originalArtBaseline:{proceduralRoutes:310,intersectionCandidatePairs:3063,status:'replaced and retained for historical comparison'},
  physicalFiles:evidence,
  blockers:['No schematic, netlist or device/power specification','Visual corridors do not terminate on verified footprint pins',
   '3D body keepouts cover only five conceptual IC packages, not vendor footprint courtyards or all SMD placements','Stitching markers are cosmetic not proven plated vias','Eight conceptual layers have no physical stackup or material thickness','No manufacturer constraints or electrical DRC/DFM'],
  requiredWork:['Specify real part numbers and voltage/current/interfaces','Build schematic and datasheet-accurate footprints','Assign nets and real copper widths/clearances/impedance as required','Run KiCad ERC and DRC on actual EDA files','Approve fabrication with human engineer'],
  references:['https://docs.kicad.org/10.0/en/cli/cli.html','https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html','https://github.com/oaslananka/kicad-mcp-pro/tree/main/skills']
 };
 const dir=path.join(root,'docs');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'PCB_DESIGN_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
 const md=[
 '# SPARK PCB routing — audit revision 2','','**NOT ELECTRICALLY VERIFIED — NOT READY FOR FABRICATION**.',
 'This audit tests illustrative geometric routes, not copper nets or KiCad ERC/DRC.',
 '','## Before and after',
 '| Check | Old illustration | New illustration |','| --- | --- | --- |',
 '| Routes | 310 pseudo-random texture paths | '+geometry.illustrativeRoutes+' shared, labelled visual corridors |',
 '| Crossings | 3,063 visual crossing candidates | '+geometry.sameLayerIntersections+' same-layer crossings |',
 '| Clearance warnings | Unconstrained | '+geometry.sameLayerClearanceWarnings+' |',
 '| Layers | 8 unrelated random drawings | 8 views of the shared route manifest |',
 '| Via markers | 280 randomly distributed | '+ILLUSTRATIVE_STITCHING.length+' patterned perimeter markers |',
 '',
 'Minimum edge gap = '+geometry.minimumVisibleEdgeGap+' normalized scene units. Illustrative required gap = '+ARTWORK_REQUIRED_GAP+' scene units. These are NOT manufacturable dimensions in mm.',
 'Route endpoints are NOT actual IC pads and no netlist governs them. Passing the geometry checks does not validate an electrical circuit.',
 '','## Missing real design inputs',
 ...Object.entries(evidence).map(([k,v])=>'- '+k+': '+(v.length?v.join(', '):'not supplied')),
 '','## Blockers',...report.blockers.map(x=>'- '+x),
 '','## Steps to real electrical correctness',...report.requiredWork.map((x,i)=>(i+1)+'. '+x),
 '','## Test commands',
 '- node scripts/test-visual-routing.mjs',
 '- node scripts/pcb-routing-audit.js',
 '- node scripts/pcb-routing-audit.js --require-manufacturing-ready (expected exit code 3 while unverified)',
 '- node e2e-check.js (WebGL functional tests only)',
 '','## External cross-check',
 'Official KiCad CLI and KiCad MCP Pro pcb-design, schematic-review, drc-check and kicad-design-review workflows require actual PCB/net/schematic files. The third-party skills were reviewed as text, not executed.',
 ...report.references.map(x=>'- '+x),''
 ];
 fs.writeFileSync(path.join(dir,'PCB_DESIGN_AUDIT.md'),md.join('\n'));
 console.log(JSON.stringify({verdict:report.verdict,geometry,markers:ILLUSTRATIVE_STITCHING.length,missingEDA:!evidence.schematic.length&&!evidence.board.length},null,2));
 if(process.argv.includes('--require-manufacturing-ready'))process.exitCode=3;
}
main().catch(e=>{console.error(e);process.exitCode=2});