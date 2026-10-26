# SPEC 12A — Relationship Graph Research & Candidate Plan (EXECUTION REPORT)

- **Spec:** `phase/SPEC_12A_EXECUTION_PROMPT.md`
- **Mode:** READ-ONLY / RESEARCH-ONLY — no production writes, no schema edits, no Studio deploy, no SPEC 12B content writes.
- **Dataset:** `production` (project `zeohjejw`), API `2026-05-25`
- **Executed:** 2026-10-18 · **git HEAD:** `b014e5c` (main) · **node:** v22.17.0
- **Verdict:** **PARTIAL (evidence-limited)** — 22 evidence-backed candidates proposed; 962 high-value gap slots held; 0 conflicts; 0 mutations.

---

## 1. Scope and method

SPEC 12A maps every relationship field in the knowledge graph, measures the current
relationship baseline, researches a **bounded** set of missing high-value edges using
authoritative (class ≤3) sources, and emits a machine-readable, idempotent, offline
dry-run plan for SPEC 12B. Nothing is written to production by this spec.

The workload was deliberately bounded: instead of attempting to fill all 962 empty
high-value slots (which would require unverifiable bulk assertion), we built a
defensible evidence spine around two class-3 specialist references and extracted only
the companions those sources explicitly endorse.

## 2. Phase A — baseline (read-only)

`scripts/SPEC_12A_baseline.js` (GET queries only) wrote `RELATIONSHIP_BASELINE.json`:

| Metric | Value |
|---|---|
| Total records | 473 (species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43) |
| Drafts | 0 (wiki + dataset) |
| Duplicate ids / slugs | 0 / 0 |
| Identity hash | `c6e358d5…67aeda` (MATCH) |
| Existing relationship edges | **3151** |
| Deployed schema | `_.schemas.default` @ `https://aqua-mind-blog.sanity.studio/` |

The baseline also flagged 174 "unresolved" reference targets; these are **false
positives** — they resolve to `post`/`tool` documents that are outside the six wiki
types scanned for the rel map, not broken references.

## 3. Phase B — field map & inventory (`RELATIONSHIP_FIELD_MAP.csv`, 28 fields)

The authoritative map is duplicated in `lib/relationship-plan.ts` (pure module) and
asserted equal to the CSV by the test suite. Coverage (records-with-data | edges):

- **species (10 fields):** `compatibleSpecies` 0|0 · `compatiblePlants` 107|535 ·
  `compatibleInvertebrates` 100|388 · `suitableEquipment` 131|654 · `relatedProblems` 131|655 ·
  `relatedPosts` 38|49 · `incompatibleSpecies` 0|0 · `predatorPrey` 0|0 ·
  `reefInteractionDetail` 0|0 · `parentSpecies` 3|3
- **plant (3):** `suitableEquipment` 52|208 · `relatedProblems` 52|156 · `relatedPosts` 26|35
- **invertebrate (6):** `compatibleSpecies` 0|0 · `suitableEquipment` 0|0 · `relatedProblems` 42|126 ·
  `relatedPosts` 3|5 · `predatorPrey` 0|0 · `parentSpecies` 0|0
- **coral (4):** `suitableEquipment` 36|144 · `relatedProblems` 36|108 · `relatedPosts` 0|0 · `coralNeighbors` 0|0
- **equipment (3):** `compatibleEquipment` 0|0 · `relatedProblems` 0|0 · `relatedPosts` 21|36
- **problem (2):** `relatedTools` 16|16 · `relatedPosts` 20|33

Established families (`compatiblePlants`, `suitableEquipment`, `relatedProblems`) are
well populated. The under-populated families are the **entry-object** fields
(`compatibleSpecies`, `incompatibleSpecies`, `predatorPrey`, `reefInteractionDetail`,
`coralNeighbors`, `compatibleEquipment`) — these are the SPEC 10M additions and are
entirely empty in production. SPEC 12A targets only `compatibleSpecies` in this pass.

Species water split: 162 freshwater / 54 saltwater / 2 brackish; all 218 carry `scientificName`.

## 4. Phase C — evidence & adjudication

Only class ≤3 sources used. Compatibility is P1 (safety-relevant), so yielded claims
are proposed with an explicit caveat rather than asserted as fact.

| Source | Class | Used for |
|---|---|---|
| Seriously Fish — *Hemigrammus bleheri* (Firehead Tetra) | C3 specialist reference | 12 companion edges |
| Seriously Fish — *Hoplisoma sterbai* (Sterba's Cory) | C3 specialist reference | 10 companion edges |

The Behaviour-and-Compatibility sections explicitly enumerate suitable tankmates by
group (pencil fish, *Apistogramma* dwarf cichlids, *Corydoras*, small Loricariids,
smaller rasboras, anabantoids, small characins, cyprinids). Each endorsed group was
matched to the specific catalog record whose `scientificName` binds it to that group.
Full quotes and URLs are in `RELATIONSHIP_EVIDENCE.csv`.

**Adjudication:** every candidate carries `confidence=MEDIUM`, `riskTier=P1`,
`decision=PROPOSE_WITH_CAVEAT`, `conditions=[peaceful community tank; avoid large,
boisterous or aggressive tankmates]`, and the caveat *"General community guidance;
verify tank size, water parameters and temperament for the specific setup."*
The Royal Pleco record was **excluded** — it is not a "small Loricariid". No
contradictory evidence was found: `RELATIONSHIP_CONFLICTS.csv` is header-only.

## 5. Phase D — offline dry-run plan (`SPEC_12B_DRY_RUN_PLAN.json`)

- **22** operations, all `add-if-absent` on `compatibleSpecies` (entry object:
  `ref` + `conditions` + `confidence` + `evidenceNote`).
- Simulated edges: **3151 → 3173**; duplicateEdgesOnReapply **0** → idempotent, safe to reapply.
- No non-relationship fields present; no replace of existing arrays; no mutation client.
- Every operation validated against the record-type model (`lib/relationship-plan.validateOperation`).

**Held** (`SPEC_12B_HELD_REGISTER.csv`): 962 `HOLD_EVIDENCE` rows (empty high-value slots
with no authoritative evidence obtained in scope) + 216 `NOT_APPLICABLE` rows
(freshwater `reefInteractionDetail`; saltwater `compatiblePlants`).

## 6. Phase E — validations

`VALIDATION_RESULTS.json` — all pass:

| ID | Check | Result |
|---|---|---|
| V-01 | ops target allowed relationship paths | PASS (22) |
| V-02 | op targets exist and have allowed type | PASS (0 violations) |
| V-03 | no self-links | PASS |
| V-04 | no dangling targets | PASS |
| V-05 | idempotent (0 duplicate edges) | PASS |
| V-06 | only `compatibleSpecies` field used | PASS |
| V-07 | no non-relationship fields in entries | PASS |
| V-08 | directionality spans ≥2 source records | PASS |

`INTEGRITY.json` — post-run re-query: 473 records, 0 drafts, identity hash MATCH,
**content_mutations = 0**. Tests: `tests/spec12a-plan.test.ts` **16/16 pass**
(including "scripts never call a mutation endpoint / never deploy").

## 7. Artifacts (`reports/SPEC_12A/`)

`RELATIONSHIP_FIELD_MAP.csv`, `RELATIONSHIP_BASELINE.json`, `RELATIONSHIP_CANDIDATES.csv` (3173),
`RELATIONSHIP_EVIDENCE.csv` (22), `RELATIONSHIP_CONFLICTS.csv` (0), `SPEC_12B_DRY_RUN_PLAN.json`,
`SPEC_12B_HELD_REGISTER.csv` (1178), `VALIDATION_RESULTS.json`, `INTEGRITY.json`, `CHECKSUMS.txt`.

## 8. Handoff to SPEC 12B

1. Execute only the 22 `SPEC_12B_DRY_RUN_PLAN.json` operations as additive array adds (idempotent).
2. Do not promote `HOLD_EVIDENCE` rows — they require additional authoritative research.
3. Re-verify identity hash and edge count after apply; expected edges 3151 → 3173.
4. Preserve all existing `SKIP_ALREADY_PRESENT` edges unchanged.

## 9. Caveats / limits

- Verdict is **PARTIAL**: only 22 of a much larger gap were evidenced; the remainder are
  recorded as held rather than fabricated.
- `compatibleSpecies` entries are proposed MEDIUM/P1 with caveats, not asserted as certain.
- 174 baseline "unresolved" refs are `post`/`tool` targets outside the scanned type set — not broken.
- Prior specs' uncommitted changes were left untouched; this spec made no production writes.
