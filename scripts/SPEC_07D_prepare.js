const fs = require('fs');
const path = require('path');
const D = require('./SPEC_07D_lib.js');

const OUT_DIR = D.OUT_DIR;
fs.mkdirSync(OUT_DIR, { recursive: true });

const writeJson = (name, obj) => fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(obj, null, 2));
const writeText = (name, text) => fs.writeFileSync(path.join(OUT_DIR, name), text);

(async () => {
  const b = await D.build();

  for (const g of b.gates) {
    console.log((g.pass ? 'GATE OK   ' : 'GATE FAIL ') + g.id + ' ' + g.name + ' - ' + g.detail);
  }

  writeJson('SPEC_07D_PRE_AUDIT_SNAPSHOT.json', b.snapshot);
  writeText('SPEC_07D_TARGET_RECONCILIATION.csv', D.csvTargetText(b.targetRows));
  writeText('SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv', D.csvPlanText(b.planRows));
  writeJson('SPEC_07D_GATE_A_RESULTS.json', b.gateA);
  writeJson('SPEC_07D_GATE_B_RESULTS.json', b.gateB);

  const aPass = b.gateA.gates.filter((x) => x.pass).length;
  const bPass = b.gateB.gates.filter((x) => x.pass).length;
  console.log('');
  console.log('GATE A: ' + b.gateA.gateStatus + ' (' + aPass + '/' + b.gateA.gates.length + ')');
  console.log('GATE B: ' + b.gateB.gateStatus + ' (' + bPass + '/' + b.gateB.gates.length + ')');
  console.log('frozenTargets=' + b.targetRows.length + ' resolved=' + b.counts.resolved + ' eligible=' + b.counts.eligibleTargets + ' fieldOperations=' + b.planRows.length + ' eligibleOps=' + b.counts.eligibleOps);
  console.log('revisionDrift=' + b.counts.revisionDrift + ' validationHold=' + b.counts.validationHold + ' reconFail=' + b.counts.reconFail);
  console.log('canonicalMutations=0 seoMutations=0 mutationEndpointCalls=0 mutationAuthorized=false state=PENDING_PM_REVIEW');
  console.log('artifacts -> report/SPEC_07D/');
  const failed = b.gates.filter((x) => !x.pass);
  if (failed.length) {
    console.log('STOP - gate failures: ' + failed.map((x) => x.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('PREPARE ERROR:', e.stack || e.message); process.exit(1); });
