# DATABASE EXPANSION PHASE 3 — COVERAGE + DATA QUALITY

## Objective
Continue building AquaMind Database from the Phase 2 baseline of 256 entities.

Primary goals:
1. Increase useful coverage toward 300+ entities.
2. Improve data depth, especially Equipment.
3. Preserve factual accuracy.
4. Keep every new entity useful and maintainable.

This remains a DATABASE-FIRST phase.

**OUT OF SCOPE:** images, SEO, blog/article production, bulk `relatedPosts`, bulk `compatibleSpecies`, UI redesign, unrelated features.

## Baseline
Phase 2 verified:
- 256 total entities
- Species: 102
- Plants: 43
- Corals: 32
- Equipment: 29
- Invertebrates: 31
- Problems: 19
- Overall data depth: 84%
- Species 95%, Plants 93%, Corals 92%, Equipment 78%, Invertebrates 93%, Problems 50%

Re-check the actual CMS/source before changes.

## Required sources
Read:
1. `DATABASE_EXPANSION_ROADMAP.md`
2. `DATABASE_FOUNDATION_CHECKPOINT.md`
3. `DATABASE_EXPANSION_PHASE_1_CHECKPOINT.md`
4. `DATABASE_EXPANSION_PHASE_2_CHECKPOINT.md`
5. Current Sanity schemas
6. Current GROQ/database queries
7. Current CMS records
8. `aquarium_content_plan.xlsx`

## Core rules
- Accuracy before quantity.
- Never fabricate scientific names, taxonomy, habitat, distribution, temperature, pH, GH/KH, salinity, tank size, adult size, lifespan, diet, behavior, breeding, lighting, flow, plant/coral requirements, or equipment specifications.
- Record factual sources for new/corrected data.
- Use reputable scientific/taxonomic references, aquarium institutions/references, and manufacturer documentation for equipment.
- If sources conflict materially, document the conflict.
- Use the existing schema; do not casually redesign it.
- Images are OUT OF SCOPE; owner will add them separately.
- Relationships are DEFERRED; preserve existing relationships and do not invent new ones.
- Execute sequentially: each SPEC must PASS before the next begins. STOP on failure.
- 300+ is a direction, not a quota.

# SPEC 1 — CURRENT DATABASE RECOUNT
Verify current CMS/source:
- total entities
- count by type
- current depth by type
- records created after Phase 2
- duplicate candidates

PASS: baseline verified from actual project data.

# SPEC 2 — EQUIPMENT DATA DEPTH AUDIT
Audit all equipment for applicable:
- type
- purpose
- brand/model
- flow
- power
- tank-size min/max
- dimensions
- relevant specifications

Do not force irrelevant fields. Do not invent specifications.

PASS: documented Equipment quality-gap list.

# SPEC 3 — EQUIPMENT DATA REMEDIATION
Fix verified Equipment gaps where reliable data exists.
Prioritize:
1. identity/type
2. purpose
3. relevant technical specifications
4. tank applicability
5. manufacturer/model when known

If data is unavailable, leave it empty/unknown where schema permits. If schema limits useful representation, document the limitation rather than casually changing schema.

PASS: Equipment quality improves without fabricated data.

# SPEC 4 — REMAINING CONTENT-PLAN GAP AUDIT
Cross-reference the current Database with `aquarium_content_plan.xlsx`.
Find missing entities supporting specific species, plant, coral, marine fish/invertebrate, equipment, and other topics where an entity is genuinely required.
Group candidates by entity type and retain sheet/topic references.

PASS: refreshed candidate pool.

# SPEC 5 — CANDIDATE QUALITY FILTER
Filter by:
- real Database gap
- reliable data readiness
- user utility
- ecosystem value
- category balance
- maintainability

Search Console remains NOT AVAILABLE. Do not invent search metrics.

Select up to 20 candidates for Batch 1. Fewer is acceptable.

PASS: each candidate has an evidence-based reason.

# SPEC 6 — BATCH 1 ENTITY BUILD
Create up to 20 new entities.
For each:
- verify no duplicate
- verify identity/scientific name
- use existing schema
- complete applicable core and care/spec fields
- record factual sources
- leave unavailable fields empty
- no images
- no speculative relationships
- use existing slug convention

PASS: valid, useful, correctly rendered records with no known fabricated values.

# SPEC 7 — BATCH 1 FACTUAL QA
Separately verify each new entity's identity, taxonomy, distribution/habitat, environment, husbandry, and type-specific fields.
Flag conflicting evidence.

PASS: no unresolved critical factual issue.

# SPEC 8 — BATCH 2
Only after Batch 1 PASS.
Refresh candidates, remove duplicates/weak candidates, then create up to 20 more.
Run data validation, factual QA, and relevant tests.

STOP if FAIL.

# SPEC 9 — BATCH 3
Only after Batch 2 PASS.
Create up to 20 more if candidates meet the quality threshold. Do not force the batch.
Run full QA.

# SPEC 10 — COVERAGE BALANCE AUDIT
Compare baseline and final counts, additions by type, and remaining gaps.
Check for over-concentration in one category.
Report category coverage.
300+ is NOT mandatory if quality threshold is not met.

# SPEC 11 — DATA DEPTH AUDIT
Recalculate depth for Species, Plants, Corals, Equipment, Invertebrates, Problems, and overall.
Compare against Phase 2 baseline and explain changes.

# SPEC 12 — FINAL TECHNICAL VERIFICATION
Run lint, relevant tests, TypeScript checks, production build when required by code/schema changes, and representative route checks for Species, Plants, Corals, Equipment, and Invertebrates.
Verify no broken routes, malformed slugs, duplicate new entities, data loss, or schema/query regressions.

# REQUIRED CHECKPOINT
Create `DATABASE_EXPANSION_PHASE_3_CHECKPOINT.md` containing:
1. Executive Summary
2. Current Inventory
3. Equipment Audit
4. Candidate Analysis
5. Batch Results
6. Data Quality
7. Data Depth
8. Images: `OUT OF SCOPE — owner will add images separately.`
9. Relationships: `DEFERRED — no speculative relationships added.`
10. Verification
11. Remaining Backlog

## FINAL RESPONSE
Return:
```text
DATABASE EXPANSION PHASE 3

Status:
[PASS / PASS WITH BACKLOG / BLOCKED / FAIL]

Baseline:
[...]

Final:
[...]

Entities added:
[...]

Equipment:
[...]

Data depth:
[...]

Remaining gaps:
[...]

Tests:
[...]

Lint:
[...]

Build:
[...]

Checkpoint:
DATABASE_EXPANSION_PHASE_3_CHECKPOINT.md

Images:
OUT OF SCOPE

Relationships:
DEFERRED

Search Console:
NOT AVAILABLE

Next:
[exact next action]
```

## CORE PRINCIPLE
> Build a database that is accurate, deep, balanced, and useful — not merely large.

The 300+ milestone is a direction, not a quota.
