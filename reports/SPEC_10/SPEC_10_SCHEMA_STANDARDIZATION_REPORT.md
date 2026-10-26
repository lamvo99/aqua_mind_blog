# SPEC 10 — AquaMind Knowledge Schema Standardization Report

| | |
|---|---|
| **Mode** | READ-ONLY / DESIGN + SCHEMA STANDARDIZATION AUDIT |
| **Target** | Sanity `zeohjejw` / `production` (GET only) |
| **Baseline** | 473 canonical Wiki records — identity hash `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda` (MATCH) |
| **Source of truth** | SPEC 09 audit artifacts (230 requirements), current Sanity schemas, SPEC 01 field inventory (140 fields), repair history through SPEC 09 |
| **Sanity writes** | **0** (machine-verified in INTEGRITY.json) |
| **Acceptance** | `SPEC 10 — COMPLETE` |

> SPEC 10 is the architecture phase. It does **not** make the database knowledge-complete — SPEC 09 states 0 GOOD/EXCELLENT records. It defines *how* knowledge must be represented before enrichment begins.

---

## 0. Executive decision (from SPEC 09)

SPEC 09: 473 records · 230 requirements · 16,070 gaps (7,252 schema · 7,761 body · 218 relationship) · 15,852 research flags · 18 CRITICAL / 447 THIN / 8 USABLE / 0 GOOD. Therefore SPEC 10 defines the knowledge architecture — not content writing — to prevent shallow field-filling (§30).

---

## 1. Gate A — Baseline (PASS)

| Gate | Item | Result | Detail |
|---|---|---|---|
| A-00 | deterministic double-read identical (6 domains) | PASS | mismatchedTypes=0 |
| A-01 | 473 records confirmed / 6 domains reconciled | PASS | total=473/473 {"species":218,"plant":62,"invertebrate":56,"coral":48,"equipment":46,"problem":43} |
| A-02 | drafts = 0 | PASS | wikiDrafts=0 datasetDrafts=0 |
| A-03 | duplicate slugs = 0 / no missing slug | PASS | duplicates=0 noSlug=0 |
| A-04 | SPEC 09 identity hash verified | PASS | hash=MATCH |

Post-architecture re-verification (counts/hash/full-document diff) is executed by `SPEC_10_validate.js` and recorded in `INTEGRITY.json` (Gate F).

---

## 2. Gate B — Architecture defined (PASS)

All six Wiki branches have a complete requirement→representation decision for **every** SPEC 09 requirement (set-equality verified: 230/230 mapped, 0 unmappable):

| Domain | Requirements | Existing fields | New fields | Body-primary | Relationship-primary |
|---|---:|---:|---:|---:|---:|
| species | 66 | 14 | 27 | 22 | 3 |
| plant | 38 | 12 | 9 | 17 | 0 |
| invertebrate | 36 | 8 | 11 | 15 | 2 |
| coral | 45 | 11 | 16 | 15 | 3 |
| equipment | 28 | 6 | 3 | 18 | 1 |
| problem | 17 | 9 | 0 | 8 | 0 |
| **Total** | **230** | **60** | **66** | **95** | **9** |

Design spotlights:

- **§6 Large-fish rule** — footprint (= `minTankLengthCm` × `minTankWidthCm`, same block, no duplicate object per §29), `swimmingSpace`, `jumpRisk`, `lidRequired`, `oxygenSensitivity`, `maturityRequirement` are REQUIRED at L2; no record can pass L2 on tank volume alone.
- **§11 Coral interaction** — tiered `reefInteraction` enum (REEF_SAFE / CAUTION / SPECIES_DEPENDENT / NOT_REEF_SAFE) replaces boolean semantics; predation detail in body; fish↔coral view is bidirectional (no duplicate slot).
- **§16 Problem pipeline** — symptoms→causes→first-check (existing) + proposed blocks `howToDistinguish`, `immediateAction`, `treatment`, `recovery`, `prevention`, `monitoring`, `escalation` (7 blocks, escalation pinned P0: 0/43 today).
- **Behavior vocabulary** — non-exclusive concepts (§7) go to multi-select `behaviorFlags` (species), `aggressionTraits` (coral), `riskFlags` (invertebrate); single-state decisions use exclusive enums (`jumpRisk`, `maturityRequirement`, `stabilityRequirement`).

## 3. Gate C — Representation rules (PASS)

- **Field vs body vs relationship (§18):** encoded per requirement in `KNOWLEDGE_ARCHITECTURE_MATRIX.csv` (primary + secondary representation + target + rationale). Rule: field = filterable/numeric/vocab; relationship = another record is the subject; body = nuance/exceptions/interactions. Worked examples in `BODY_ARCHITECTURE.md`.
- **Applicability model (§19):** `APPLICABILITY_MATRIX.csv` — REQUIRED 166 · CONDITIONAL 51 (each with an explicit machine-checkable rule) · OPTIONAL 13 · NOT_APPLICABLE 0 · UNKNOWN 0 (class reserved; no requirement currently has undeterminable applicability — documented finding). `NOT_APPLICABLE` is never a gap; `UNKNOWN` would be a research candidate.
- **Controlled vocabulary:** exclusive enums for single-state attributes; multi-select flags for non-exclusive behavior; **presence of a flag is a positive signal — absence is not a negative** (negative knowledge lives in body, never implied by empty arrays); vocabularies are fixed per field and listed in the architecture matrix target column.
- **Numeric semantics:** min/max pairs with unit in the field name (tempMinC/Max, dkhMin/Max, heightCm…); `null` = unknown, never 0; no default invention; research-gated numerics (PAR, chemistry, turnover) require an evidenceClass before acceptance (§23 — "high light" ≠ "PAR 250–350"); qualitative enums stay authoritative where quantitative ranges are unstable.
- **Relationship model (§10):** `RELATIONSHIP_MODEL.csv` — 22 slots: 15 existing (2 empty, 12 partial, 1 full) + 6 proposed (`incompatibleSpecies`, `predatorPrey`, `reefInteraction` detail object, `coralNeighbors`, `compatibleEquipment`, `relatedProblems` on equipment) + 1 derived back-reference (problem→species via query, avoiding duplicate source of truth per §29). Conditional compatibility is expressed as `conditions[]` on compatible entries (§10), not a separate slot.

## 4. Gate D — Decision readiness (PASS)

- **Beginner / Intermediate / Advanced requirements** defined in `COMPLETENESS_LEVELS.md` (audience table maps each §21 must-answer to a level).
- **Large-fish safety requirements:** §6 block is mandatory at L2; unresolved P0 items block L2 entirely (dangerous-gap rule, §24).
- **Coral interaction requirements:** §11 six-question evidence model drives `reefInteraction` + body.
- **Troubleshooting escalation:** `newBlock:escalation` REQUIRED at L2 for every problem record (0/43 today).
- **Completeness levels L0–L4** with measurable gates (field-present / section-nonempty / relation-count≥N / evidence-annotated) per domain.

## 5. Gate E — Research (PASS)

- **Research-item model:** `RESEARCH_MODEL.csv` — 14 fields (recordId, requirementId, exact claim, applicability, priority, sourceTypeNeeded, source, evidence, evidenceClass, confidence, dateChecked, uncertainty, editorDecision, researchId) — exactly §22's schema.
- **Evidence model:** 7 evidence classes (established fact, accepted husbandry range, practical recommendation, manufacturer claim, expert consensus, species-variable, research needed).
- **Uncertainty model:** `uncertainty` free text + `SPECIES_VARIABLE`/ `RESEARCH_NEEDED` classes + `LOW` confidence publish-with-caveat rule; `PENDING_RESEARCH` decision keeps records honest instead of forcing fills.
- **Source hierarchy:** 7 tiers (scientific literature → government/institutional → established aquarium organizations → manufacturer docs for product claims only → veterinary/aquatic-health → high-quality specialist references → community supplementary-only).
- **No unsupported claims introduced:** SPEC 10 authored zero husbandry facts — only structural decisions; 201/230 requirements carry `researchGated=y` from SPEC 09's 201-item register; enrichment must consume the register, never model memory.

## 6. Gate F — Mutation safety (verified in INTEGRITY.json)

- [x] Sanity writes = 0 (GET-only `q()` query builder in all scripts; static mutation-path scan passes)
- [x] Mutation API calls = 0 (only GET query paths in all SPEC 10 scripts; assembled-needle static scan passes)
- [x] `_updatedAt` unchanged (0 records)
- [x] Full-document diff vs SPEC 10 baseline = 0
- [x] No production content changed (titles/slugs/categories/relationships/SEO identical)

---

## 7. Field inventory mapping (SPEC 01 × knowledge)

140 existing fields mapped (`FIELD_TO_KNOWLEDGE_MAPPING.csv`): **ADEQUATE 57** · **EXTEND_SEMANTICS 34** · **INSUFFICIENT_FOR_DECISIONS 5** (`tankSizeMinL` volume-only, `reefCompatibility` boolean, empty `compatibleSpecies` ×2, equipment `flowRateLh` rating-only) · **STRUCTURAL 44** (slug/SEO/media/publishedAt — correctly serving no husbandry requirement). The 5 INSUFFICIENT fields are precisely SPEC 09's most dangerous schema gaps — architecture adds decision fields alongside, never duplicating semantics.

## 8. Priority migration queue (`PRIORITY_MIGRATION_QUEUE.csv`, 106 items)

| Priority | Items | | Phase | Items |
|---|---:|---|---|---|
| P0 | 24 | | MIGRATION (post-SPEC 10, PM-authorized) | 71 |
| P1 | 49 | | SPEC 11 (species) | 19 |
| P2 | 31 | | SPEC 12 (relationships) | 5 |
| P3 | 2 | | SPEC 13 (plants/coral/inverts/equipment/problems) | 11 |

P0 wave: 5 species schema fields (jumpRisk, lidRequired, minTankLengthCm, minTankWidthCm, swimmingSpace — unblocking 218 records each) + `problem:newBlock:escalation` (43) + **18 P0 records** (17 large fish + Digital Heater). Migration items run before record enrichment (prerequisite ordering in the queue).

## 9. Design decisions & resolved conflicts

- **Footprint duplicate (§29 stop condition):** initial design had both `minTankFootprint{length,width}` and `minTankLengthCm/minTankWidthCm` — contradictory duplicate source of truth. **Resolved:** single dimensions block; footprint = length × width; `adult_footprint` shares the dimensions target (queue item merged, 106 items).
- **boolean vs enum reef safety:** kept `reefCompatibility` on corals (adequate), added tiered `reefInteraction` for fish side — no blanket rewrite (§30 field-bloat guard).
- **Problem back-reference:** no new `problem.affectedSpecies` field — derived from `species.relatedProblems` at query time (avoiding dual sources).
- **Applicability classes used:** REQUIRED 166, CONDITIONAL 51, OPTIONAL 13; UNKNOWN unused (reserved, documented).

## 10. Validation performed (§28)

```text
node scripts/SPEC_10_extract.js        -> Gate A: PASS (473/6 domains/hash MATCH/drafts 0/dupSlugs 0)
node scripts/SPEC_10_architecture.js   -> 230/230 requirements mapped; 8 artifacts emitted; stop-conditions checked
node scripts/SPEC_10_validate.js       -> Gates A+F + §26/§29 artifact checks -> INTEGRITY.json (PASS)
npm run lint                            -> exit 0
npx tsc --noEmit                        -> exit 0 (no type errors)
npm test                                -> 1 known baseline failure: tests/compare.test.ts (pre-existing, unrelated to SPEC 10 — identified explicitly per §28, not fixed here)
git status --porcelain                  -> no tracked file modified (only untracked spec artifacts)
```

## 11. Downstream phase plan (§31)

- **SPEC 10 → MIGRATION (needs separate PM authorization, §33):** create the 64 schema fields / 7 body blocks / 5 relationship slots in Sanity schema code — order per `PRIORITY_MIGRATION_QUEUE.csv` (P0 first).
- **SPEC 11 — species enrichment:** P0 18 large fish first (queue Q-007…Q-024), then 201 remaining species batches; focus: dimensions, footprint, swimming, behavior, compatibility, feeding, water, adult growth, long-form body.
- **SPEC 12 — relationships:** populate `compatibleSpecies` + `conditions[]`, `incompatibleSpecies`, `predatorPrey`, `reefInteraction` detail, `coralNeighbors`.
- **SPEC 13 — plants/coral/invertebrates/equipment/problems:** plant nutrition/light/CO₂, coral chemistry/PAR, invertebrate molting/biofilm, equipment capacity/failure-modes, problem diagnosis/escalation — each backed by its research batch.

## 12. Limitations (honest)

- Architecture is a design contract; no record was enriched and no schema was created in this phase — empty fields do not yet exist and must not be simulated (§30).
- Applicability CONDITIONAL rules are group-level heuristics; enrichment phases must refine them per record with evidence (wrong-rule = false gap, a documented stop condition).
- The research model defers source collection; SPEC 09's 201 aggregate items are the backlog, not verified sources.
- Completeness gates are defined for future validators; no record currently passes L2 under the new gates.

---

**Acceptance (§32):** `SPEC 10 — COMPLETE`

AquaMind now has a defensible knowledge architecture that can support deep, research-backed enrichment without relying on shallow field filling. The database is **not** knowledge-complete — enrichment remains the job of SPEC 11–13 under PM authorization (§33).
