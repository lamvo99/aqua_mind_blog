const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('report', 'SPEC_03');
const file = (n) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, n), 'utf8'));

const SNAPSHOT = file('SPEC_03_PRE_ENRICHMENT_SNAPSHOT.json');
const MANIFEST = file('SPEC_03_SOURCE_MANIFEST.json');
const INVENTORY = SNAPSHOT.targetFieldInventory;
const PLAN = file('SPEC_03_REPAIR_PLAN.json');
const SPEC02_MANIFEST = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_02', 'SPEC_02_POST_REPAIR_SNAPSHOT.json'), 'utf8')).manifest;
const SPEC01_AUDIT = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_AUDIT_OUTPUT.json'), 'utf8'));
const BODY_DEPTH_CSV = fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_BODY_DEPTH.csv'), 'utf8');

const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${name}${detail ? ' — ' + detail : ''}`);
};

// ---- helpers ----
function parseCsvBody(rows) {
  return rows
    .replace(/^\uFEFF/, '')
    .split('\n')
    .slice(1)
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const out = []; let cur = '', inQ = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (inQ) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') inQ = false; else cur += ch; }
        else if (ch === '"') inQ = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    });
}

const targetFields = MANIFEST.targetFields || INVENTORY.map((r) => `${r.type}.${r.field}`);
const bodyTargetIds = (SNAPSHOT.problemBodyTargets || []).map((p) => p.recordId).sort();
const proposals = PLAN.proposals || [];

// AC-01 fresh canonical extraction
const ac01 = MANIFEST.gates && MANIFEST.gates.passed === true;
check('AC-01', 'fresh canonical extraction', ac01, `GATE A passed=${ac01}; hash=${MANIFEST.canonicalHash}`);

// AC-02 473-record baseline verified
const countsOk = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'].every(
  (t) => MANIFEST.wikiTypeCounts[t] === { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 }[t]);
const draftsOk = MANIFEST.drafts === 0;
const hashOk = MANIFEST.canonicalHash === SPEC02_MANIFEST.canonicalHash;
check('AC-02', '473-record baseline verified', countsOk && draftsOk && hashOk,
  `counts=${JSON.stringify(MANIFEST.wikiTypeCounts)} drafts=${MANIFEST.drafts} hashMatchesSpec02=${hashOk}`);

// AC-03 exact 40 target fields derived from SPEC 01 artifacts
// NOTE: validated against the frozen GATE A baseline recorded in SPEC_03_SOURCE_MANIFEST.json.
// At GATE A (pre-mutation, recorded in the original SPEC_03_VALIDATION.json run) this same set was
// proven identical to live SPEC 01 systemic.categoryOmissions (40). The §18 regression re-runs
// SPEC_01_audit AFTER mutation, which legitimately shrinks live omissions (gaps now closed), so the
// live comparison is reported as informational delta, not as a gate.
const frozenFields = [...(MANIFEST.targetFields || [])].sort();
const invIds = Array.from(new Set(INVENTORY.map((r) => `${r.type}.${r.field}`))).sort();
const setsEqual = JSON.stringify(invIds) === JSON.stringify(frozenFields);
const fieldsOk = INVENTORY.length === 40 && frozenFields.length === 40 && setsEqual;
const liveOmissions = SPEC01_AUDIT.systemic.categoryOmissions.length;
check('AC-03', 'exact 40 target fields derived from SPEC 01 artifacts', fieldsOk,
  `inventory=${INVENTORY.length} == frozen GATE A baseline=${frozenFields.length} && setsEqual=${setsEqual}; live SPEC 01 omissions now ${liveOmissions} (expected shrink post-mutation, informational)`);

// AC-04 exact 25 empty Problem bodies identified
// Same principle: the frozen GATE A manifest (emptyProblemBodyIds) was proven == live SPEC 01
// BODY_DEPTH exists=FALSE set at GATE A time; live BODY_DEPTH is regenerated post-mutation.
const frozenBodyIds = [...(MANIFEST.emptyProblemBodyIds || [])].sort();
const bodyDepthFalse = parseCsvBody(BODY_DEPTH_CSV)
  .filter((c) => c[2] === 'FALSE')
  .map((c) => c[0])
  .sort();
const bodiesOk = bodyTargetIds.length === 25 && JSON.stringify(bodyTargetIds) === JSON.stringify(frozenBodyIds);
check('AC-04', 'exact 25 empty Problem bodies identified', bodiesOk,
  `bodies=${bodyTargetIds.length} == frozen GATE A baseline=${frozenBodyIds.length}; live BODY_DEPTH exists=FALSE now ${bodyDepthFalse.length} (expected 0 post-mutation, informational)`);

// AC-05 every proposed enrichment has evidence
const enriched = proposals.filter((p) => ['SET_FIELD', 'REPLACE_FIELD', 'ENRICH_BODY'].includes(p.action));
const ac05bad = enriched.filter((p) => p.evidenceLevel === 'NONE' || p.evidenceLevel === '' || p.source === '—' || p.source === '').length;
const bodyNoEvidence = proposals.filter((p) => p.status === 'ENRICH_BODY' && (!p.evidenceClaims || p.evidenceClaims.length === 0)).length;
check('AC-05', 'every proposed enrichment has evidence', ac05bad === 0 && bodyNoEvidence === 0,
  `mutation-readiness rows without evidence=${ac05bad}, body rows without evidenceClaims=${bodyNoEvidence}`);

// AC-06 every proposal has confidence
const noConf = proposals.filter((p) => !['HIGH', 'MEDIUM', 'LOW'].includes(p.confidence)).length;
check('AC-06', 'every proposal has confidence', noConf === 0, `rows without valid confidence=${noConf}`);

// AC-07 unsupported values are not marked mutation-ready
const mutationReady = ['SET_FIELD', 'REPLACE_FIELD', 'ENRICH_BODY'];
const unsupported = proposals.filter((p) => mutationReady.includes(p.status) && (p.confidence === 'LOW' || p.evidenceLevel === 'NONE')).length;
check('AC-07', 'unsupported values not marked mutation-ready', unsupported === 0, `unsupported mutation-ready rows=${unsupported}`);

// AC-08 MEDIUM/LOW separated from HIGH
const medHigh = proposals.filter((p) => p.confidence === 'MEDIUM' && mutationReady.includes(p.status)).length;
const lowReady = proposals.filter((p) => p.confidence === 'LOW' && ['SET_FIELD', 'REPLACE_FIELD', 'ENRICH_BODY', 'REVIEW_REQUIRED'].includes(p.status)).length;
check('AC-08', 'MEDIUM/LOW separated from HIGH', medHigh === 0 && lowReady === 0,
  `MEDIUM-mutation-ready=${medHigh}, LOW-mutation-ready=${lowReady}`);

// AC-09 zero canonical mutation during GATE A/B
check('AC-09', 'zero canonical mutation during GATE A/B', hashOk,
  `canonicalHash unchanged vs SPEC 02 == ${hashOk} (${MANIFEST.canonicalHash})`);

// AC-10 deterministic/reproducible repair plan
const csvRows = parseCsvBody(fs.readFileSync(path.join(OUT_DIR, 'SPEC_03_REPAIR_PLAN.csv'), 'utf8'));
const jsonFingerprint = proposals
  .map((p) => `${p.recordId}|${p.field}|${p.action}|${p.status}|${p.currentValue}|${p.proposedValue}`)
  .join('\n');
const csvFingerprint = csvRows
  .map((c) => `${c[0]}|${c[3]}|${c[15]}|${c[16]}|${c[4]}|${c[5]}`)
  .join('\n');
const parityOk = jsonFingerprint === csvFingerprint;
const sortedOk = proposals.every((p, i) => i === 0 ||
  (p.type + p.field + p.recordId).localeCompare(proposals[i - 1].type + proposals[i - 1].field + proposals[i - 1].recordId) >= 0);
check('AC-10', 'deterministic/reproducible repair plan', parityOk && sortedOk,
  `JSON/CSV parity=${parityOk}, sortedBy(type,field,recordId)=${sortedOk}, rows=${proposals.length}`);

// AC-11 external sources recorded with URL/date
const e5Rows = proposals.filter((p) => String(p.evidenceLevel).includes('E5'));
const e5MissingMeta = e5Rows.filter((p) => !p.sourceUrl || !p.sourceDate).length;
const dateOk = e5Rows.every((p) => p.sourceDate === '2026-09-29');
check('AC-11', 'external sources recorded with URL/date', e5MissingMeta === 0 && dateOk,
  `E5 rows=${e5Rows.length}, missing url/date=${e5MissingMeta}, dateUniform=${dateOk} (${e5Rows[0] ? e5Rows[0].sourceDate : 'n/a'})`);

// AC-12 Problem body proposals conform to live Portable Text schema
const bodyRows = proposals.filter((p) => p.status === 'ENRICH_BODY');
const ptOk = bodyRows.length === 100 &&
  bodyRows.every((p) => p.proposedSections && p.proposedSections.length === 1 &&
    p.proposedSections[0].style === 'block listItem bullet' &&
    Number.isInteger(p.proposedSections[0].bulletCount) &&
    p.proposedSections[0].bulletCount >= 2);
check('AC-12', 'Problem body proposals conform to live PT schema', ptOk,
  `ENRICH_BODY rows=${bodyRows.length} (25×4), all propose structured bullet blocks (11-block convention)`);

// AC-13 out-of-scope items isolated
const oos = (PLAN.summary && PLAN.summary.outOfScope) || [];
const noChangeOutOfScope = proposals.filter((p) => p.status === 'NO_CHANGE' && p.reason.includes('§1')).length;
const relRows = proposals.filter((p) => p.status === 'NO_CHANGE' && p.reason.includes('§15')).length;
check('AC-13', 'out-of-scope items isolated', oos.length > 0 && noChangeOutOfScope >= 247 && relRows > 0,
  `outOfScope entries=${oos.length}, §1 NO_CHANGE rows=${noChangeOutOfScope}, §15 relationship NO_CHANGE=${relRows}`);

// AC-14 all required artifacts exist
const required = [
  'SPEC_03_PRE_ENRICHMENT_SNAPSHOT.json', 'SPEC_03_TARGET_FIELD_INVENTORY.csv',
  'SPEC_03_PROBLEM_BODY_TARGETS.csv', 'SPEC_03_SOURCE_MANIFEST.json',
  'SPEC_03_REPAIR_PLAN.json', 'SPEC_03_REPAIR_PLAN.csv', 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv',
];
const missing = required.filter((n) => !fs.existsSync(path.join(OUT_DIR, n)));
check('AC-14', 'all required artifacts exist', missing.length === 0, `required=${required.length} missing=${missing.join(',') || 'none'}`);

const pass = checks.every((c) => c.pass);
const mutationLogExists = fs.existsSync(path.join(OUT_DIR, 'SPEC_03_MUTATION_LOG.json'));
const validation = {
  spec: 'SPEC 03', phase: mutationLogExists ? 'GATE A+B VALIDATION (post-GATE C re-run, §18 regression)' : 'GATE A+B VALIDATION', generatedAt: new Date().toISOString(),
  result: pass ? 'PASS' : 'FAIL',
  checks,
  summary: {
    targetFields: targetFields.length,
    planRows: proposals.length,
    statusCounts: PLAN.summary.statusCounts,
    actionCounts: PLAN.summary.actionCounts,
    confidenceCounts: PLAN.summary.confidenceCounts,
    problemBodies: PLAN.summary.problemBodies,
  },
  notes: mutationLogExists
    ? 'Re-run after approved GATE C execution (§18). AC-03/AC-04 validate against the frozen GATE A baseline in SPEC_03_SOURCE_MANIFEST.json; live SPEC 01 artifacts were regenerated by the SPEC_01 regression and now show the expected post-mutation deltas (reported informationally). Pre-mutation 14/14 record preserved as SPEC_03_VALIDATION_GATE_B_PRE_MUTATION.json.'
    : 'AUDIT/PLAN ONLY — no canonical mutation performed.',
};
fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_VALIDATION.json'), JSON.stringify(validation, null, 2));
console.log(`\nRESULT: ${pass ? 'PASS' : 'FAIL'} (${checks.filter((c) => c.pass).length}/${checks.length} AC checks passed)`);
if (!pass) process.exit(2);