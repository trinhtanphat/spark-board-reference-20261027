import {strict as assert} from 'node:assert';
import {VISUAL_ROUTES,ROUTING_REVISION,LAYER_LABELS,FABRICATION_APPROVED,auditIllustrativeGeometry,ARTWORK_REQUIRED_GAP} from '../routing/visual-routing.mjs';
const ok=auditIllustrativeGeometry();
assert.equal(ok.visualGeometryPass,true);
assert.equal(ok.illustrativeRoutes,224);
assert.equal(ok.conceptualLayerCount,8);
assert.equal(ok.sameLayerIntersections,0);
assert.equal(ok.sameLayerClearanceWarnings,0);
assert.ok(ok.minimumVisibleEdgeGap>=ARTWORK_REQUIRED_GAP);
assert.equal(ok.fabricationApproved,false);
assert.equal(FABRICATION_APPROVED,false);
const baseline=VISUAL_ROUTES[0];
const duplicate={...baseline,id:'INJECTED_DUPLICATE'};
const badDup=auditIllustrativeGeometry([...VISUAL_ROUTES,duplicate]);
assert.equal(badDup.visualGeometryPass,false);assert.ok(badDup.sameLayerClearanceWarnings>0);
const far={...baseline,id:'INJECTED_OOB',points:[[10,9],[11,9]]};
const badOutside=auditIllustrativeGeometry([...VISUAL_ROUTES,far]);
assert.equal(badOutside.visualGeometryPass,false);assert.ok(badOutside.outOfBounds>0);
const crossing=[
 {...baseline,id:'INJECTED_A',points:[[-4.4,-.32],[-4.0,.14]]},
 {...baseline,id:'INJECTED_B',points:[[-4.4,.14],[-4.0,-.32]]}
];
const badCross=auditIllustrativeGeometry([...VISUAL_ROUTES,...crossing]);
assert.ok(badCross.sameLayerIntersections>0);assert.equal(badCross.visualGeometryPass,false);
const nan={...baseline,id:'INJECTED_NAN',points:[[NaN,.8],[1,.8]]};
const badNan=auditIllustrativeGeometry([...VISUAL_ROUTES,nan]);
const keepout={...baseline,id:'INJECTED_CORE_OVERLAP',points:[[0,0],[.2,.1]]};
const badBody=auditIllustrativeGeometry([...VISUAL_ROUTES,keepout]);
assert.equal(badBody.visualGeometryPass,false);
assert.ok(badBody.packageKeepoutWarnings>0);
assert.equal(badNan.visualGeometryPass,false);assert.ok(badNan.nonFiniteCoordinates>0);
console.log(JSON.stringify({revision:ROUTING_REVISION,validRoutes:ok.illustrativeRoutes,layers:LAYER_LABELS.length,minimumGap:ok.minimumVisibleEdgeGap,checks:['valid','duplicate rejected','outside rejected','intersection rejected','NaN rejected','body keepout rejected'],result:'PASS',electricalValidation:false},null,2));