'use strict';
/* Static VISUAL-ONLY routing audit. No third-party dependencies, no manufacturing approval. */
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'scene3d.js'),'utf8');
const need=(v,s)=>{if(!v)throw Error('AUDIT_SOURCE_CHANGED: '+s)};
for(const s of ['function circuitTexture()','seeded(780522)','for(let i=0;i<12000;i++)','for(let i=0;i<310;i++)','for(let i=0;i<150;i++)','for(let n=0;n<8;n++)','for(let i=0;i<115;i++)'])need(src.includes(s),s);
const seeded=n=>()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296},rnd=seeded(780522),W=11.7,D=7.2,ww=2048,hh=1260;
const px=x=>(x/W+.5)*ww,pz=z=>(.5-z/D)*hh;
for(let i=0;i<12000;i++)for(let j=0;j<5;j++)rnd();
const hubs=[[-3.7,-1.6],[3.55,1.76],[3.77,-.8],[-3.65,1.65],[0,.1]],routes=[];
for(let i=0;i<310;i++){
 const hub=hubs[Math.floor(rnd()*hubs.length)],edge=rnd()>.68;
 const ax=edge?rnd()*ww:px(hub[0])+(rnd()-.5)*320;
 const ay=edge?rnd()*hh:pz(hub[1])+(rnd()-.5)*250;
 const bx=edge?rnd()*ww:px(hub[0])+(rnd()-.5)*520;
 const by=edge?rnd()*hh:pz(hub[1])+(rnd()-.5)*350;
 routes.push({ax,ay,bx,by});
}
const intersects=(a,b)=>b.bx>Math.min(a.ax,a.bx)+.00001&&b.bx<Math.max(a.ax,a.bx)-.00001&&a.ay>Math.min(b.ay,b.by)+.00001&&a.ay<Math.max(b.ay,b.by)-.00001;
let crossingPairs=0;const examples=[];
for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
 if(intersects(routes[i],routes[j])||intersects(routes[j],routes[i])){crossingPairs++;if(examples.length<8)examples.push([i,j])}
}
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 if(['.git','vendor','node_modules'].includes(e.name))return [];
 const f=path.join(dir,e.name);return e.isDirectory()?walk(f):[path.relative(root,f).replaceAll('\\','/')];
 });
}
const files=walk(root),find=e=>files.filter(f=>f.toLowerCase().endsWith(e));
const evidence={schematics:find('.kicad_sch'),boards:find('.kicad_pcb'),netlists:find('.net'),gerbers:find('.gbr'),drills:find('.drl')};
const verdict='NOT_ELECTRICALLY_VERIFIED';
const findings=[
 ['CRITICAL','No KiCad board and schematic were supplied; true ERC, DRC and net-to-pin checks cannot run'],
 ['CRITICAL','310 L-shaped decorative copper-texture paths have no net ID or layer assignment'],
 ['HIGH',String(crossingPairs)+' pairs of illustrated texture routes geometrically intersect; these are NOT proven electrical shorts'],
 ['HIGH','8 exploded view planes are procedural illustrations, not a fabrication stackup'],
 ['HIGH','Footprints and component names are visual references; real pin mapping and datasheets absent'],
 ['HIGH','No voltage, current, clearance, trace width, controlled impedance or fab constraints'],
 ['POSITIVE','Existing WebGL automated tests cover rendered geometry and controls, not circuitry']
];
const report={
 schemaVersion:1,project:'SPARK 3D',auditMode:'static-source + procedural-visual-geometry',verdict,
 approvedForManufacturing:false,electricallyVerified:false,
 routing:{visualTexturePaths:routes.length,visualTextureCrossingPairs:crossingPairs,crossingExamples:examples,visualOverlayPaths:150,conceptualPlanes:8,pathsPerConceptualPlane:115},
 evidence,findings:findings.map(([severity,message])=>({severity,message})),
 requiredNextSteps:['Real schematic and power/signal specification','Datasheet-accurate footprints and BOM','KiCad board with actual net-class tracks and vias','Manufacturer-specific stackup and design rules','ERC + schematic parity DRC + DFM','Human engineering signoff'],
 references:['https://docs.kicad.org/10.0/en/cli/cli.html','https://docs.kicad.org/10.0/en/pcbnew/pcbnew.html','https://github.com/oaslananka/kicad-mcp-pro/tree/main/skills']
};
const out=path.join(root,'docs');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'PCB_DESIGN_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
const md=[
 '# SPARK PCB engineering audit',
 '',
 '**VERDICT: NOT ELECTRICALLY VERIFIED. NOT READY FOR FABRICATION.**',
 '',
 'This project is a Three.js/Canvas VISUAL concept. The underlying copper art is procedurally drawn. KiCad/ERC/DRC checks have NOT been run because authoritative electrical design files are missing.',
 '',
 '## Evidence and geometry cross-check',
 '',
 '- Schematic files: '+evidence.schematics.length,
 '- KiCad PCB files: '+evidence.boards.length,
 '- Electrical netlists: '+evidence.netlists.length,
 '- Manufacturer Gerber files: '+evidence.gerbers.length,
 '- Artwork seed: 780522',
 '- Canvas texture routes: '+routes.length,
 '- Crossings between distinct illustration path pairs: '+crossingPairs,
 '- First eight route-pair indices: '+examples.map(x=>x.join(' x ')).join(', '),
 '- 3D line-overlay paths: 150',
 '- Decorative 8-layer views: 8 planes with 115 path iterations per plane',
 '',
 'Crossings are **warning candidates in visual artwork**, NOT an accurate electrical short count. Without net assignments and physical layer definitions, no electrical connectivity or separation can be concluded.',
 '',
 '## Findings',
 '',
 ...findings.map(([sev,msg])=>'- **'+sev+'**: '+msg),
 '',
 '## External skill cross-check',
 '',
 '- Official KiCad CLI documents schematic ERC and PCB DRC with real EDA input files.',
 '- KiCad MCP Pro pcb-design skill checks actual nets, copper tracks, vias, zone fill and stackup.',
 '- KiCad MCP Pro drc-check skill requires appropriate DRC/ERC input; no automatic waiving.',
 '- KiCad MCP Pro schematic-review skill checks symbol pins, net connectivity, power flags, and ERC.',
 '- KiCad MCP Pro kicad-design-review skill integrates schematic/board/DFM and human release gates.',
 '- Source skill revision reviewed on WIN11-181: oaslananka/kicad-mcp-pro at 4b09ab3. Only text read; no external code executed.',
 '',
 '## Required work for genuine circuit correctness',
 '',
 ...report.requiredNextSteps.map((x,i)=>(i+1)+'. '+x),
 '',
 'Do not generate production files by merely relabeling this visualization as a validated PCB. Preserve the demo separately until schematic, real parts, constraints, netlist and EDA board exist.',
 '',
 '## Reproduce',
 '',
 'Run: node scripts/pcb-routing-audit.js',
 'Fail-closed release gate: node scripts/pcb-routing-audit.js --require-manufacturing-ready (deliberately nonzero when unverified).',
 'Rendering tests are separate: node e2e-check.js.',
 '',
 '## References',
 '',
 ...report.references.map(x=>'- '+x),''
].join('\n');
fs.writeFileSync(path.join(out,'PCB_DESIGN_AUDIT.md'),md);
console.log(JSON.stringify({verdict,visualTexturePaths:routes.length,visualCrossingPairs:crossingPairs,missingSchematics:evidence.schematics.length===0,missingPCB:evidence.boards.length===0},null,2));
if(process.argv.includes('--require-manufacturing-ready'))process.exitCode=3;
