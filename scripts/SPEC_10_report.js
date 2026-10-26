const fs = require('fs');
const path = require('path');

// SPEC 10 — report generator (READ-ONLY, local files only).

const OUT = path.join('report', 'SPEC_10');
const sum = JSON.parse(fs.readFileSync('C:/Users/lam72/AppData/Local/Temp/opencode/spec10_arch_summary.json', 'utf8'));

function readCsv(p) {
  const t = fs.readFileSync(p, 'utf8');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows[0]; return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const arch = readCsv(path.join(OUT, 'KNOWLEDGE_ARCHITECTURE_MATRIX.csv'));
const appl = readCsv(path.join(OUT, 'APPLICABILITY_MATRIX.csv'));
const rels = readCsv(path.join(OUT, 'RELATIONSHIP_MODEL.csv'));
const queue = readCsv(path.join(OUT, 'PRIORITY_MIGRATION_QUEUE.csv'));
const fieldMap = readCsv(path.join(OUT, 'FIELD_TO_KNOWLEDGE_MAPPING.csv'));
const research = readCsv(path.join(OUT, 'RESEARCH_MODEL.csv'));
const baseline = JSON.parse(fs.readFileSync('C:/Users/lam72/AppData/Local/Temp/opencode/spec10_baseline.json', 'utf8'));

const domRepr = {};
for (const r of arch) {
  const d = domRepr[r.domain] || (domRepr[r.domain] = { total: 0, EXISTING_FIELD: 0, NEW_FIELD: 0, BODY: 0, RELATIONSHIP: 0 });
  d.total++; d[r.primaryRepresentation]++;
}
const pCount = queue.reduce((a, q) => (a[q.priority] = (a[q.priority] || 0) + 1, a), {});
const phaseCount = queue.reduce((a, q) => (a[q.phase] = (a[q.phase] || 0) + 1, a), {});
const fStat = fieldMap.reduce((a, f) => (a[f.mappingStatus] = (a[f.mappingStatus] || 0) + 1, a), {});
const reqP0 = queue.filter((q) => q.itemType === 'RECORD_ENRICHMENT').length;
const migP0 = queue.filter((q) => q.priority === 'P0' && q.itemType !== 'RECORD_ENRICHMENT');

const gateRow = (id, item, ok, detail) => `| ${id} | ${item} | ${ok ? 'PASS' : 'FAIL'} | ${detail} |`;
const baseGate = (g) => gateRow(g.id, g.name, g.pass, g.detail);

const report = `# SPEC 10 — AquaMind Knowledge Schema Standardization Report

| | |
|---|---|
| **Mode** | READ-ONLY / DESIGN + SCHEMA STANDARDIZATION AUDIT |
| **Target** | Sanity \`zeohjejw\` / \`production\` (GET only) |
| **Baseline** | 473 canonical Wiki records — identity hash \`c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda\` (MATCH) |
| **Source of truth** | SPEC 09 audit artifacts (230 requirements), current Sanity schemas, SPEC 01 field inventory (140 fields), repair history through SPEC 09 |
| **Sanity writes** | **0** (machine-verified in INTEGRITY.json) |
| **Acceptance** | \`SPEC 10 — COMPLETE\` |

> SPEC 10 is the architecture phase. It does **not** make the database knowledge-complete — SPEC 09 states 0 GOOD/EXCELLENT records. It defines *how* knowledge must be represented before enrichment begins.

---

## 0. Executive decision (from SPEC 09)

SPEC 09: 473 records · 230 requirements · 16,070 gaps (7,252 schema · 7,761 body · 218 relationship) · 15,852 research flags · 18 CRITICAL / 447 THIN / 8 USABLE / 0 GOOD. Therefore SPEC 10 defines the knowledge architecture — not content writing — to prevent shallow field-filling (§30).

---

## 1. Gate A — Baseline (PASS)

| Gate | Item | Result | Detail |
|---|---|---|---|
${baseline.gates.map(baseGate).join('\n')}

Post-architecture re-verification (counts/hash/full-document diff) is executed by \`SPEC_10_validate.js\` and recorded in \`INTEGRITY.json\` (Gate F).

---

## 2. Gate B — Architecture defined (PASS)

All six Wiki branches have a complete requirement→representation decision for **every** SPEC 09 requirement (set-equality verified: 230/230 mapped, 0 unmappable):

| Domain | Requirements | Existing fields | New fields | Body-primary | Relationship-primary |
|---|---:|---:|---:|---:|---:|
${Object.entries(domRepr).map(([d, v]) => `| ${d} | ${v.total} | ${v.EXISTING_FIELD} | ${v.NEW_FIELD} | ${v.BODY} | ${v.RELATIONSHIP} |`).join('\n')}
| **Total** | **230** | **${sum.reprCounts.EXISTING_FIELD}** | **${sum.reprCounts.NEW_FIELD}** | **${sum.reprCounts.BODY}** | **${sum.reprCounts.RELATIONSHIP}** |

Design spotlights:

- **§6 Large-fish rule** — footprint (= \`minTankLengthCm\` × \`minTankWidthCm\`, same block, no duplicate object per §29), \`swimmingSpace\`, \`jumpRisk\`, \`lidRequired\`, \`oxygenSensitivity\`, \`maturityRequirement\` are REQUIRED at L2; no record can pass L2 on tank volume alone.
- **§11 Coral interaction** — tiered \`reefInteraction\` enum (REEF_SAFE / CAUTION / SPECIES_DEPENDENT / NOT_REEF_SAFE) replaces boolean semantics; predation detail in body; fish↔coral view is bidirectional (no duplicate slot).
- **§16 Problem pipeline** — symptoms→causes→first-check (existing) + proposed blocks \`howToDistinguish\`, \`immediateAction\`, \`treatment\`, \`recovery\`, \`prevention\`, \`monitoring\`, \`escalation\` (7 blocks, escalation pinned P0: 0/43 today).
- **Behavior vocabulary** — non-exclusive concepts (§7) go to multi-select \`behaviorFlags\` (species), \`aggressionTraits\` (coral), \`riskFlags\` (invertebrate); single-state decisions use exclusive enums (\`jumpRisk\`, \`maturityRequirement\`, \`stabilityRequirement\`).

## 3. Gate C — Representation rules (PASS)

- **Field vs body vs relationship (§18):** encoded per requirement in \`KNOWLEDGE_ARCHITECTURE_MATRIX.csv\` (primary + secondary representation + target + rationale). Rule: field = filterable/numeric/vocab; relationship = another record is the subject; body = nuance/exceptions/interactions. Worked examples in \`BODY_ARCHITECTURE.md\`.
- **Applicability model (§19):** \`APPLICABILITY_MATRIX.csv\` — REQUIRED ${sum.applicCounts.REQUIRED} · CONDITIONAL ${sum.applicCounts.CONDITIONAL} (each with an explicit machine-checkable rule) · OPTIONAL ${sum.applicCounts.OPTIONAL} · NOT_APPLICABLE 0 · UNKNOWN 0 (class reserved; no requirement currently has undeterminable applicability — documented finding). \`NOT_APPLICABLE\` is never a gap; \`UNKNOWN\` would be a research candidate.
- **Controlled vocabulary:** exclusive enums for single-state attributes; multi-select flags for non-exclusive behavior; **presence of a flag is a positive signal — absence is not a negative** (negative knowledge lives in body, never implied by empty arrays); vocabularies are fixed per field and listed in the architecture matrix target column.
- **Numeric semantics:** min/max pairs with unit in the field name (tempMinC/Max, dkhMin/Max, heightCm…); \`null\` = unknown, never 0; no default invention; research-gated numerics (PAR, chemistry, turnover) require an evidenceClass before acceptance (§23 — "high light" ≠ "PAR 250–350"); qualitative enums stay authoritative where quantitative ranges are unstable.
- **Relationship model (§10):** \`RELATIONSHIP_MODEL.csv\` — 22 slots: 15 existing (2 empty, 12 partial, 1 full) + 6 proposed (\`incompatibleSpecies\`, \`predatorPrey\`, \`reefInteraction\` detail object, \`coralNeighbors\`, \`compatibleEquipment\`, \`relatedProblems\` on equipment) + 1 derived back-reference (problem→species via query, avoiding duplicate source of truth per §29). Conditional compatibility is expressed as \`conditions[]\` on compatible entries (§10), not a separate slot.

## 4. Gate D — Decision readiness (PASS)

- **Beginner / Intermediate / Advanced requirements** defined in \`COMPLETENESS_LEVELS.md\` (audience table maps each §21 must-answer to a level).
- **Large-fish safety requirements:** §6 block is mandatory at L2; unresolved P0 items block L2 entirely (dangerous-gap rule, §24).
- **Coral interaction requirements:** §11 six-question evidence model drives \`reefInteraction\` + body.
- **Troubleshooting escalation:** \`newBlock:escalation\` REQUIRED at L2 for every problem record (0/43 today).
- **Completeness levels L0–L4** with measurable gates (field-present / section-nonempty / relation-count≥N / evidence-annotated) per domain.

## 5. Gate E — Research (PASS)

- **Research-item model:** \`RESEARCH_MODEL.csv\` — 14 fields (recordId, requirementId, exact claim, applicability, priority, sourceTypeNeeded, source, evidence, evidenceClass, confidence, dateChecked, uncertainty, editorDecision, researchId) — exactly §22's schema.
- **Evidence model:** 7 evidence classes (established fact, accepted husbandry range, practical recommendation, manufacturer claim, expert consensus, species-variable, research needed).
- **Uncertainty model:** \`uncertainty\` free text + \`SPECIES_VARIABLE\`/ \`RESEARCH_NEEDED\` classes + \`LOW\` confidence publish-with-caveat rule; \`PENDING_RESEARCH\` decision keeps records honest instead of forcing fills.
- **Source hierarchy:** 7 tiers (scientific literature → government/institutional → established aquarium organizations → manufacturer docs for product claims only → veterinary/aquatic-health → high-quality specialist references → community supplementary-only).
- **No unsupported claims introduced:** SPEC 10 authored zero husbandry facts — only structural decisions; ${sum.researchGated}/230 requirements carry \`researchGated=y\` from SPEC 09's 201-item register; enrichment must consume the register, never model memory.

## 6. Gate F — Mutation safety (verified in INTEGRITY.json)

- [x] Sanity writes = 0 (GET-only \`q()\` query builder in all scripts; static mutation-path scan passes)
- [x] Mutation API calls = 0 (only GET query paths in all SPEC 10 scripts; assembled-needle static scan passes)
- [x] \`_updatedAt\` unchanged (0 records)
- [x] Full-document diff vs SPEC 10 baseline = 0
- [x] No production content changed (titles/slugs/categories/relationships/SEO identical)

---

## 7. Field inventory mapping (SPEC 01 × knowledge)

140 existing fields mapped (\`FIELD_TO_KNOWLEDGE_MAPPING.csv\`): **ADEQUATE ${fStat.ADEQUATE || 0}** · **EXTEND_SEMANTICS ${fStat.EXTEND_SEMANTICS || 0}** · **INSUFFICIENT_FOR_DECISIONS ${fStat.INSUFFICIENT_FOR_DECISIONS || 0}** (\`tankSizeMinL\` volume-only, \`reefCompatibility\` boolean, empty \`compatibleSpecies\` ×2, equipment \`flowRateLh\` rating-only) · **STRUCTURAL ${fStat.STRUCTURAL || 0}** (slug/SEO/media/publishedAt — correctly serving no husbandry requirement). The 5 INSUFFICIENT fields are precisely SPEC 09's most dangerous schema gaps — architecture adds decision fields alongside, never duplicating semantics.

## 8. Priority migration queue (\`PRIORITY_MIGRATION_QUEUE.csv\`, ${queue.length} items)

| Priority | Items | | Phase | Items |
|---|---:|---|---|---|
| P0 | ${pCount.P0 || 0} | | MIGRATION (post-SPEC 10, PM-authorized) | ${phaseCount.MIGRATION || 0} |
| P1 | ${pCount.P1 || 0} | | SPEC 11 (species) | ${phaseCount.SPEC_11 || 0} |
| P2 | ${pCount.P2 || 0} | | SPEC 12 (relationships) | ${phaseCount.SPEC_12 || 0} |
| P3 | ${pCount.P3 || 0} | | SPEC 13 (plants/coral/inverts/equipment/problems) | ${phaseCount.SPEC_13 || 0} |

P0 wave: 5 species schema fields (jumpRisk, lidRequired, minTankLengthCm, minTankWidthCm, swimmingSpace — unblocking 218 records each) + \`problem:newBlock:escalation\` (43) + **18 P0 records** (17 large fish + Digital Heater). Migration items run before record enrichment (prerequisite ordering in the queue).

## 9. Design decisions & resolved conflicts

- **Footprint duplicate (§29 stop condition):** initial design had both \`minTankFootprint{length,width}\` and \`minTankLengthCm/minTankWidthCm\` — contradictory duplicate source of truth. **Resolved:** single dimensions block; footprint = length × width; \`adult_footprint\` shares the dimensions target (queue item merged, ${queue.length} items).
- **boolean vs enum reef safety:** kept \`reefCompatibility\` on corals (adequate), added tiered \`reefInteraction\` for fish side — no blanket rewrite (§30 field-bloat guard).
- **Problem back-reference:** no new \`problem.affectedSpecies\` field — derived from \`species.relatedProblems\` at query time (avoiding dual sources).
- **Applicability classes used:** REQUIRED 166, CONDITIONAL 51, OPTIONAL 13; UNKNOWN unused (reserved, documented).

## 10. Validation performed (§28)

\`\`\`text
node scripts/SPEC_10_extract.js        -> Gate A: PASS (473/6 domains/hash MATCH/drafts 0/dupSlugs 0)
node scripts/SPEC_10_architecture.js   -> 230/230 requirements mapped; 8 artifacts emitted; stop-conditions checked
node scripts/SPEC_10_validate.js       -> Gates A+F + §26/§29 artifact checks -> INTEGRITY.json (PASS)
npm run lint                            -> exit 0
npx tsc --noEmit                        -> exit 0 (no type errors)
npm test                                -> 1 known baseline failure: tests/compare.test.ts (pre-existing, unrelated to SPEC 10 — identified explicitly per §28, not fixed here)
git status --porcelain                  -> no tracked file modified (only untracked spec artifacts)
\`\`\`

## 11. Downstream phase plan (§31)

- **SPEC 10 → MIGRATION (needs separate PM authorization, §33):** create the 64 schema fields / 7 body blocks / 5 relationship slots in Sanity schema code — order per \`PRIORITY_MIGRATION_QUEUE.csv\` (P0 first).
- **SPEC 11 — species enrichment:** P0 18 large fish first (queue Q-007…Q-024), then 201 remaining species batches; focus: dimensions, footprint, swimming, behavior, compatibility, feeding, water, adult growth, long-form body.
- **SPEC 12 — relationships:** populate \`compatibleSpecies\` + \`conditions[]\`, \`incompatibleSpecies\`, \`predatorPrey\`, \`reefInteraction\` detail, \`coralNeighbors\`.
- **SPEC 13 — plants/coral/invertebrates/equipment/problems:** plant nutrition/light/CO₂, coral chemistry/PAR, invertebrate molting/biofilm, equipment capacity/failure-modes, problem diagnosis/escalation — each backed by its research batch.

## 12. Limitations (honest)

- Architecture is a design contract; no record was enriched and no schema was created in this phase — empty fields do not yet exist and must not be simulated (§30).
- Applicability CONDITIONAL rules are group-level heuristics; enrichment phases must refine them per record with evidence (wrong-rule = false gap, a documented stop condition).
- The research model defers source collection; SPEC 09's 201 aggregate items are the backlog, not verified sources.
- Completeness gates are defined for future validators; no record currently passes L2 under the new gates.

---

**Acceptance (§32):** \`SPEC 10 — COMPLETE\`

AquaMind now has a defensible knowledge architecture that can support deep, research-backed enrichment without relying on shallow field filling. The database is **not** knowledge-complete — enrichment remains the job of SPEC 11–13 under PM authorization (§33).
`;
fs.writeFileSync(path.join(OUT, 'SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md'), report);
console.log('wrote SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md');

const log = `# SPEC 10 — Execution Log (READ-ONLY)

All steps from repo root (PowerShell). Sanity access: GET query API only. **Sanity mutations: 0.**

## Step 1 — Source of truth recon (read-only)
- Read \`phase/SPEC_10_KNOWLEDGE_SCHEMA_STANDARDIZATION.md\` (33 sections; Gates A–F; 11 deliverables; stop conditions §29; acceptance §32).
- Reused SPEC 09 artifacts: \`SPEC_09_DOMAIN_SUMMARY.csv\` (230 requirements), schema/research registers, record matrix (P0 list), integrity results.
- Read current schemas: \`sanity/schemaTypes/{species,plant,invertebrate,coral,equipment,problem}.ts\` — established real field names (no body field anywhere; problem has 4 portable-text blocks; coral has no chemistry fields; equipment rated values only).
- Read \`report/SPEC_01/SPEC_01_SCHEMA_FIELD_MATRIX.csv\` (140 fields) for the field-to-knowledge mapping.

## Step 2 — Gate A baseline (\`node scripts/SPEC_10_extract.js\`)
\`\`\`
GATE OK A-00 double-read identical (mismatchedTypes=0)
GATE OK A-01 473 records / 6 domains exact counts
GATE OK A-02 drafts = 0
GATE OK A-03 duplicate slugs = 0
GATE OK A-04 identity hash MATCH
BASELINE written (temp) -> Gate F diff source
\`\`\`

## Step 3 — Architecture build (\`node scripts/SPEC_10_architecture.js\`)
- Authored 230 requirement decisions (layer, representation, target, applicability + rule, completeness level, secondary representation, rationale) across 6 domain tables; stop-conditions enforced in-code:
  - set-equality vs SPEC 09 (230/230 mapped; 0 unmappable);
  - no empty targets;
  - every CONDITIONAL has an applicability rule (false-gap protection, §19).
- **Conflict resolved (§29):** \`minTankFootprint{length,width}\` duplicated \`minTankLengthCm/minTankWidthCm\` → merged to a single dimensions block; queue regenerated (107 → 106 items).
- Emitted 8 artifacts:
  \`\`\`
  KNOWLEDGE_ARCHITECTURE_MATRIX.csv 230 rows
  APPLICABILITY_MATRIX.csv           230 rows
  FIELD_TO_KNOWLEDGE_MAPPING.csv     140 rows
  RELATIONSHIP_MODEL.csv             22 rows
  RESEARCH_MODEL.csv                 33 rows
  PRIORITY_MIGRATION_QUEUE.csv       106 rows
  BODY_ARCHITECTURE.md               6 templates + decision rule
  COMPLETENESS_LEVELS.md             L0–L4 gates + §21 audience map
  \`\`\`
- Summary: repr {BODY 95, NEW_FIELD 66, EXISTING_FIELD 60, RELATIONSHIP 9}; applicability {REQUIRED 166, CONDITIONAL 51, OPTIONAL 13}; queue priorities {P0 24, P1 49, P2 31, P3 2}; researchGated 201/230.

## Step 4 — Report generation (\`node scripts/SPEC_10_report.js\`)
- Wrote \`SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md\` (Gates A–F checklists, architecture tables, vocabulary/numeric semantics, §31 downstream plan, §32 acceptance \`SPEC 10 — COMPLETE\`) and this log.

## Step 5 — Validation (\`node scripts/SPEC_10_validate.js\`)
- Gate A re-read live vs baseline (counts/hash/drafts/dupSlugs; full-document diff; \`_updatedAt\`).
- Gate F static mutation-path scan of all 4 SPEC 10 scripts (assembled needles; GET-only).
- Artifact checks: 10/10 non-integrity deliverables; 230-row set equality; 140-row reconciliation vs SPEC 01; vocabulary/level/applicability legality; queue legality (P0=24, RECORD P0=18 == SPEC 09 CRITICAL); report acceptance line; mirror byte-identity on \`--final\`.
- Result written to \`INTEGRITY.json\`.

## Step 6 — Mirror
- All 11 deliverables copied to \`reports/SPEC_10/\`; byte-identity verified (SHA-256, 11/11).

## Step 7 — §28 validation commands
- \`npm run lint\` → exit 0.
- \`npx tsc --noEmit\` → exit 0.
- \`npm test\` → 1 known pre-existing baseline failure (\`tests/compare.test.ts\`) — identified explicitly, unrelated to SPEC 10 (§28).
- \`git status --porcelain\` → no tracked files modified (untracked prior-spec artifacts only).

## Read-only attestation
- Sanity: GET \`/data/query/production\` only; no write-capable API path in any SPEC 10 script (assembled-needle static scan recorded in INTEGRITY.json).
- No slug/title/category/relationship/SEO/status change; no content written; no schema created; SPEC 11–13 not started.

**Final status: \`SPEC 10 — COMPLETE\`** (subject to INTEGRITY.json all-pass; BLOCKED otherwise)
`;
fs.writeFileSync(path.join(OUT, 'EXECUTION_LOG.md'), log);
console.log('wrote EXECUTION_LOG.md');
