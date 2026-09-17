# DATABASE EXPANSION PHASE 2 — DATA DEPTH & ACCURACY

## Objective

Continue expanding the AquaMind Database with two simultaneous goals:

1. Increase useful entity coverage.
2. Increase factual depth and quality of entity data.

Baseline from Phase 1:
- 217 total entities
- 83 Species
- 35 Plants
- 25 Corals
- 23 Equipment
- 22 Invertebrates
- 19 Problems
- 10 Inspiration

This is primarily a DATABASE DATA BUILDING phase.

Do NOT prioritize images, SEO, article writing, or relationship enrichment.

---

## SOURCE OF TRUTH

Before implementation, read:
1. `DATABASE_EXPANSION_ROADMAP.md`
2. `DATABASE_FOUNDATION_CHECKPOINT.md`
3. `DATABASE_EXPANSION_PHASE_1_CHECKPOINT.md`
4. Current Sanity schemas
5. Current database queries/models/components
6. `aquarium_content_plan.xlsx`
7. Existing database records

The actual current schema/source is authoritative.

---

## PRIORITY ORDER

1. DATA ACCURACY
2. DATA DEPTH
3. DATABASE COVERAGE
4. RELATIONSHIPS — DEFERRED
5. IMAGES — OUT OF SCOPE

---

## GLOBAL RULES

### Sequential execution
SPEC 1 → verify PASS → SPEC 2 → verify PASS → ...

If any spec FAILS, STOP and report the blocker.

### No invented facts
Never fabricate:
- scientific names
- taxonomy
- distribution
- natural habitat
- temperature
- pH
- GH/KH
- salinity
- tank size
- adult size
- lifespan
- diet
- behavior
- breeding
- lighting
- flow
- coral requirements
- plant requirements
- equipment specifications

If reliable evidence is unavailable, leave the field empty when allowed, mark it for verification, or exclude the entity.

### Source traceability
For factual enrichment, record the sources used during the audit/creation process.

Prefer reputable aquarium references, scientific/taxonomic databases, public aquariums/institutions, and manufacturer documentation for equipment.

If sources conflict materially, document the discrepancy rather than arbitrarily selecting a value.

### Schema discipline
Use the existing schema. Do not add duplicate fields or casually redesign the schema. Propose schema changes only when genuinely necessary and document why.

### Images
OUT OF SCOPE. Do not search for, replace, or add images.

### Relationships
OUT OF SCOPE. Do not bulk-populate `relatedPosts`, `compatibleSpecies`, problem links, or tool links. Preserve existing relationships.

### No arbitrary quota
Quality is more important than reaching a number. A high-quality batch smaller than the maximum is acceptable.

---

# SPEC 1 — AUDIT CURRENT DATA CONTRACTS

Document the actual fields supported by the current schema for:
- Species
- Plants
- Corals
- Equipment
- Invertebrates

For each type, identify fields covering identity, scientific name/taxonomy, habitat/distribution, environmental requirements, husbandry/care, and type-specific information.

Do not assume every field applies to every entity type.

### PASS
A data contract based on the actual project schema exists.

STOP if FAIL.

---

# SPEC 2 — AUDIT CURRENT 217 ENTITIES

Audit existing records for:
- missing required fields
- scientific-name/taxonomy errors
- suspicious/impossible values
- unit inconsistencies
- contradictory ranges
- wrong water type
- wrong tank-size values
- duplicate slugs
- malformed slugs
- inconsistent difficulty values
- inconsistent terminology

Classify:
- CRITICAL
- HIGH
- MEDIUM
- LOW

Every factual issue must have evidence before correction.

### PASS
A verified issue list exists and critical/high issues are fixed or explicitly deferred for manual verification.

STOP if FAIL.

---

# SPEC 3 — FIX VERIFIED HIGH-VALUE DATA ERRORS

Re-check and safely address known candidates from Phase 1:
- Bumblebee Goby water-type ambiguity
- Vampire Shrimp size
- Glossostigma slug typo
- Bird's Nest Coral duplicate

For slug changes, inspect existing references/URLs first and do not break existing links.

For duplicates, identify both records and preserve the correct data. Do not delete blindly. If safe consolidation cannot be established, document it for manual CMS work.

### PASS
Verified corrections are safely applied, or unsafe corrections are explicitly deferred with reasons.

STOP if FAIL.

---

# SPEC 4 — DEFINE TYPE-SPECIFIC DATA DEPTH TARGETS

Create a completeness matrix from the actual schema.

Example concepts:

Species:
- identity
- scientific name
- distribution/habitat
- water type
- adult size
- temperature
- pH
- GH/KH where applicable
- tank size
- diet
- behavior/temperament
- social needs
- difficulty
- breeding
- special requirements

Plants:
- scientific name
- origin/habitat
- growth form
- placement
- light
- CO2
- nutrients
- temperature
- pH/GH where applicable
- growth rate
- propagation
- difficulty

Corals:
- scientific name
- coral type
- habitat/distribution
- lighting
- flow
- placement
- temperature
- salinity
- alkalinity where supported
- feeding
- aggression
- growth
- difficulty

Equipment:
- type
- purpose
- brand/model when applicable
- relevant specifications
- flow/power/tank range only where applicable

Invertebrates:
- scientific name
- type
- habitat/distribution
- water type
- size
- temperature
- pH/GH/KH or salinity where applicable
- tank size
- diet
- behavior
- difficulty
- special requirements

Do not require irrelevant fields.

### PASS
A type-specific data-quality contract exists.

STOP if FAIL.

---

# SPEC 5 — SELECT NEXT ENTITY CANDIDATES

Cross-reference:
- remaining content-plan gaps
- current database inventory
- entity type
- existing topic/article opportunities
- data availability

Prioritize entities that:
1. fill an actual database gap;
2. have reliable factual data available;
3. support multiple future content topics;
4. strengthen useful aquarium categories;
5. can be maintained accurately.

Search Console remains NOT AVAILABLE. Do not invent search-volume/demand metrics.

Select up to 20 candidates for Batch 1. Fewer is acceptable if the quality threshold is not met.

### PASS
Every candidate has a clear reason, type, content-plan reference, and sufficient data availability.

STOP if FAIL.

---

# SPEC 6 — BATCH 1 DATA BUILD

Implement up to 20 new entities.

For each:
1. Use the existing schema.
2. Use accurate factual data.
3. Record factual sources in working notes.
4. Complete applicable core fields.
5. Complete important care fields where reliable data exists.
6. Leave non-applicable fields empty.
7. Do not fabricate missing information.
8. Do not add images.
9. Do not add speculative relationships.
10. Use correct slug conventions.
11. Check for duplicates before creation.

### PASS
Every new entity has correct identity, meaningful care data, no known fabricated values, correct rendering, and no duplicate.

STOP if FAIL.

---

# SPEC 7 — BATCH 1 FACTUAL QA

Separately verify every Batch 1 entity:

Identity:
- common name
- scientific name
- taxonomy/type

Environment:
- distribution
- habitat
- water type
- temperature
- pH
- GH/KH/salinity where applicable

Husbandry:
- tank size
- diet
- behavior
- difficulty
- special requirements

Type-specific fields:
- according to SPEC 4

Flag conflicting evidence.

### PASS
No unresolved critical factual issue exists.

STOP if FAIL.

---

# SPEC 8 — BATCH 2

Only after Batch 1 PASS.

Select and implement up to 20 additional entities using the same quality standard.

Before implementation:
- refresh candidate inventory
- remove duplicates
- remove candidates with insufficient reliable data

Run creation verification, factual QA, lint, and relevant tests.

STOP if FAIL.

---

# SPEC 9 — BATCH 3

Only after Batch 2 PASS.

Select and implement up to 20 additional entities.

Do not force the batch if remaining candidates are weak.

Run the same QA.

STOP if FAIL.

---

# SPEC 10 — DATABASE DATA DEPTH AUDIT

Measure:
- total entity count
- count by type
- percentage with core fields
- percentage with important care fields
- unresolved factual issues
- manual-review items

Compare against Phase 1 baseline.

Report:
COVERAGE + DATA DEPTH + DATA ACCURACY

Do not optimize only for entity count.

---

# SPEC 11 — FINAL VERIFICATION

Run:
- lint
- relevant tests
- TypeScript checks
- production build when code/schema changes require it
- representative route verification

Verify representative pages for:
- Species
- Plant
- Coral
- Equipment
- Invertebrate

Check:
- no broken pages
- no malformed slugs
- no duplicate new entities
- no data loss
- no unexpected schema regression

---

# REQUIRED CHECKPOINT

Create:

`DATABASE_EXPANSION_PHASE_2_CHECKPOINT.md`

Include:

## Executive Summary
- baseline entity count
- final entity count
- total entities added
- overall status

## Data Contract
Actual type-specific fields.

## Existing Data Quality
- critical/high/medium/low issues
- corrected
- deferred

## New Entities
For every added entity:
- name
- type
- content-plan sheet
- relevant topic
- key fields completed
- factual sources used
- unresolved fields

## Data Depth
Completeness by type.

## Accuracy
- verified corrections
- disputed facts
- manual-review items

## Images
`OUT OF SCOPE — owner will add images separately.`

## Relationships
`DEFERRED — existing relationships preserved; no speculative relationships added.`

## Verification
- lint
- tests
- TypeScript
- build
- route verification

## Remaining Backlog
Separate:
- data-quality backlog
- entity expansion backlog
- manual CMS verification
- Search Console data requirement

---

# FINAL RESPONSE

Return:

DATABASE EXPANSION PHASE 2

Status:
[PASS / PASS WITH BACKLOG / BLOCKED / FAIL]

Baseline entities:
[...]

Final entities:
[...]

Entities added:
[...]

Data quality:
[...]

Data depth:
[...]

Critical issues:
[...]

Tests:
[...]

Lint:
[...]

Build:
[...]

Checkpoint:
DATABASE_EXPANSION_PHASE_2_CHECKPOINT.md

Images:
OUT OF SCOPE

Relationships:
DEFERRED

Search Console:
NOT AVAILABLE

Next:
[exact next action]

## CORE PRINCIPLE

Build a database that is accurate and useful, not merely large.

A smaller entity set with reliable scientific identity, habitat, environmental parameters, tank requirements, diet, behavior, and other applicable care information is preferable to a larger set containing shallow or invented data.
