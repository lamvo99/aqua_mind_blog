# DATABASE EXPANSION PHASE 4 — DOMAIN COMPLETENESS & DATA QUALITY

## Objective

Continue the AquaMind Database from the Phase 3 baseline of 309 entities.

Primary goals:
1. Strengthen weak domain coverage.
2. Increase marine-fish coverage.
3. Expand important shrimp/Caridina coverage.
4. Expand useful aquarium disease/problem coverage.
5. Improve floating-plant coverage.
6. Expand coral variety where justified.
7. Improve Equipment data quality without inventing manufacturer information.
8. Preserve or improve overall data depth.

Indicative target: approximately 350–380 entities.

**The target is not a quota.** If suitable candidates do not meet the factual-quality threshold, stop below the target.

This remains a DATABASE-FIRST phase.

### OUT OF SCOPE
- Images
- SEO
- Blog/article production
- Bulk `relatedPosts`
- Bulk `compatibleSpecies`
- UI redesign
- Unrelated application features

---

# BASELINE

Phase 3 reported:
- 309 entities
- 118 Species
- 50 Plants
- 34 Corals
- 34 Equipment
- 37 Invertebrates
- 26 Problems
- 10 Inspiration
- Species: 95% depth
- Plants: 93%
- Corals: 92%
- Invertebrates: 93%
- Equipment: 60%
- Problems: 50%
- Overall: 81%

Re-check the actual CMS/source before changes. The current CMS is authoritative if it differs from the checkpoint.

---

# REQUIRED SOURCE MATERIAL

Read before implementation:

1. `DATABASE_EXPANSION_ROADMAP.md`
2. `DATABASE_FOUNDATION_CHECKPOINT.md`
3. `DATABASE_EXPANSION_PHASE_1_CHECKPOINT.md`
4. `DATABASE_EXPANSION_PHASE_2_CHECKPOINT.md`
5. `DATABASE_EXPANSION_PHASE_3_CHECKPOINT.md`
6. Current Sanity schemas
7. Current GROQ/database queries
8. Current CMS records
9. `aquarium_content_plan.xlsx`

Do not assume an entity is missing until the current CMS has been checked.

---

# CORE PRINCIPLES

## Accuracy > quantity
A smaller set of highly accurate entities is preferable to a larger set of shallow or uncertain records.

## No fabricated facts
Never invent:
- scientific names
- taxonomy
- distribution
- natural habitat
- water type
- temperature
- pH
- GH/KH
- salinity
- adult size
- tank size
- lifespan
- diet
- behavior
- temperament
- social requirements
- breeding information
- lighting
- flow
- coral requirements
- plant requirements
- equipment specifications

If reliable evidence cannot be established, leave the field empty if allowed, mark for manual verification, or reject the candidate.

## Scientific identity
For Species, Plants, Corals and Invertebrates:
- verify scientific name;
- verify common-name correspondence;
- avoid outdated/misapplied common names;
- do not merge distinct species because trade names overlap.

For trade variants, distinguish species, locality, color morph, cultivated variety, and trade grade. Do not create a separate biological species entity for a morph unless the current data model explicitly supports it.

## Natural habitat vs aquarium husbandry
Do not represent captive-care recommendations as wild ecological measurements.

## Conflicting sources
If reliable sources disagree, document the conflict and prefer the most authoritative/relevant source. Do not manufacture a compromise value.

## Source traceability
Record factual sources for every newly created or materially corrected entity. Prefer scientific/taxonomic references, reputable public aquariums/institutions, established aquarium references, and manufacturer documentation for equipment.

## Images
**OUT OF SCOPE.** Do not search for, download, replace, or add images.

## Relationships
**DEFERRED.** Do not bulk-populate `relatedPosts`, `compatibleSpecies`, problem/entity relationships, or tool/entity relationships. Preserve existing relationships.

## Sequential execution
Execute `SPEC 1 → PASS → SPEC 2 → PASS...`. If a SPEC fails, **STOP immediately**.

---

# DOMAIN PRIORITY

### Priority A — Marine fish
Current coverage is heavily freshwater-biased. Expand useful marine species such as appropriate reef-safe/community species, beginner marine fish, and common clownfish/tang/goby/blenny/wrasse/dottyback/cardinal groups that map to real content/database needs.

Do not add marine species merely to inflate the count.

### Priority B — Shrimp / Caridina
Evaluate missing high-value variants and species.

Phase 3 specifically identified:
- Taiwan Bee
- Blue Bolt
- King Kong

Before creation, determine whether each should be represented as species, variant/morph, or another structure supported by the current schema. Do not classify aquarium trade morphs as separate biological species.

### Priority C — Problems / diseases
Evaluate:
- Flukes
- Anchor Worm
- Fish Lice

Only create a Problem entity if the current schema can represent it meaningfully. Do not fabricate medical/treatment claims.

### Priority D — Floating plants
Evaluate:
- Dwarf Lettuce
- Salvinia
- other useful floating plants

Verify taxonomy and distinguish species from cultivars/trade names.

### Priority E — Coral variety
Evaluate:
- Goniopora
- Pavona
- other validated coral gaps

### Priority F — Equipment
Continue improving Equipment only where accurate technical information exists. Do not force brand/model data into generic equipment records.

---

# SPEC 1 — CURRENT STATE RECOUNT

Verify the current live/source database:
- total entities;
- counts by type;
- freshwater vs saltwater species;
- Equipment count;
- Problem count;
- current depth by type;
- duplicate candidates;
- records changed after Phase 3.

Compare against Phase 3.

### PASS
Actual current baseline is documented.

**STOP if FAIL.**

---

# SPEC 2 — DOMAIN GAP AUDIT

Audit:
1. Marine fish gaps.
2. Caridina/shrimp gaps.
3. Disease/problem gaps.
4. Floating-plant gaps.
5. Coral gaps.
6. Equipment data gaps.

Cross-reference current entities, content plan, article topics, and schema capabilities.

Do not assume every content topic requires an entity.

### PASS
A categorized, deduplicated candidate pool exists.

**STOP if FAIL.**

---

# SPEC 3 — TAXONOMIC & ENTITY-TYPE VALIDATION

For every candidate determine:
- correct entity type;
- common name;
- scientific name;
- taxonomy;
- species vs morph/cultivar/trade name/locality form;
- whether current schema can represent it correctly.

Special rules:
- Caridina trade morphs must not automatically become separate species.
- Coral trade names must not be treated as scientific species without evidence.
- Plant cultivars/trade names must not be treated as species without evidence.
- Generic equipment categories must not be represented as real manufacturer products.

### PASS
All selected candidates are correctly classified or explicitly deferred.

**STOP if FAIL.**

---

# SPEC 4 — DATA DEPTH CONTRACT

Define applicable fields before creation.

## Species / Invertebrates
Where applicable:
- common name
- scientific name
- taxonomy/type
- distribution
- natural habitat
- water type
- adult size
- temperature
- pH
- GH/KH
- salinity
- minimum tank size
- diet
- behavior
- temperament
- social requirements
- difficulty
- breeding
- special requirements

## Plants
Where applicable:
- common name
- scientific name
- origin/habitat
- growth form
- placement
- light
- CO2
- nutrients
- temperature
- pH/GH
- growth rate
- propagation
- difficulty

## Corals
Where applicable:
- common name
- scientific name
- coral type
- distribution/habitat
- lighting
- flow
- placement
- temperature
- salinity
- feeding
- aggression
- growth
- difficulty

## Problems
Use only fields supported by the current schema. If the schema is too shallow for meaningful disease data, document the limitation instead of inventing fields or adding shallow records solely for count.

## Equipment
Use only applicable:
- equipment type
- purpose
- brand/model when genuinely known
- power
- flow
- tank range
- dimensions
- relevant specifications

### PASS
Each candidate has an explicit data-depth checklist.

**STOP if FAIL.**

---

# SPEC 5 — CANDIDATE PRIORITIZATION

Select candidates based on:
1. Real database gap.
2. Correct classification.
3. Reliable factual evidence.
4. Aquarium usefulness.
5. Content-plan relevance.
6. Domain-balance value.
7. Maintainability.

Select up to 20 candidates for Batch 1. Fewer is acceptable.

Reject candidates with ambiguous taxonomy, shallow evidence, duplicates, unsuitable trade-name representation, materially conflicting reliable sources, or schema incompatibility.

Search Console remains **NOT AVAILABLE**. Do not invent search metrics.

### PASS
Every selected candidate has type, inclusion reason, content-plan reference where applicable, and data-readiness assessment.

**STOP if FAIL.**

---

# SPEC 6 — BATCH 1: MARINE + SHRIMP

Create up to 20 high-quality entities, prioritizing marine fish and shrimp/Caridina, plus other marine invertebrates where justified.

For each:
1. Check duplicate.
2. Verify scientific identity.
3. Verify classification.
4. Populate applicable core data.
5. Populate meaningful husbandry data.
6. Record sources.
7. Never fabricate values.
8. No images.
9. No speculative relationships.
10. Use existing slug conventions.

### PASS
Batch 1 records are valid and render correctly.

**STOP if FAIL.**

---

# SPEC 7 — BATCH 1 FACTUAL QA

Independently review every Batch 1 entity:
- scientific identity;
- taxonomy;
- distribution;
- habitat;
- water type;
- environmental parameters;
- adult size;
- tank size;
- diet;
- behavior;
- difficulty;
- special requirements;
- type-specific fields.

Pay particular attention to marine salinity and reef/aquarium suitability claims.

### PASS
No unresolved critical factual issue.

**STOP if FAIL.**

---

# SPEC 8 — BATCH 2: PROBLEMS + PLANTS + CORALS

Only after Batch 1 PASS.

Refresh candidates and prioritize:
- Flukes
- Anchor Worm
- Fish Lice
- floating plants
- other high-value plant gaps
- Goniopora
- Pavona
- other validated coral gaps

For Problems, do not create a record merely to increase count if the current schema cannot support useful information.

Create up to 20 entities and run full factual QA.

### PASS
Batch 2 passes data and technical verification.

**STOP if FAIL.**

---

# SPEC 9 — BATCH 3: BALANCED DOMAIN EXPANSION

Only after Batch 2 PASS.

Refresh inventory and select remaining high-value gaps across:
- marine fish;
- freshwater fish;
- shrimp/invertebrates;
- plants;
- corals;
- equipment;
- problems.

Avoid category over-concentration. Create up to 20 entities. Do not force the batch.

### PASS
Batch 3 passes.

**STOP if FAIL.**

---

# SPEC 10 — EQUIPMENT QUALITY REVIEW

Audit all Equipment after expansion.

Measure:
- correct type;
- useful purpose;
- technical specs where applicable;
- tank range where applicable;
- power/flow where applicable;
- brand/model quality;
- generic vs manufacturer-specific records.

Do not downgrade data quality merely because brand/model is absent when the entity is intentionally generic.

Report:
- true data completeness;
- genuinely non-applicable fields;
- missing but realistically obtainable fields.

### PASS
Equipment data quality is accurately characterized and no fabricated specs exist.

**STOP if FAIL.**

---

# SPEC 11 — DOMAIN COVERAGE AUDIT

Compare Phase 3 vs Phase 4:
- total entities;
- freshwater/saltwater species;
- plants;
- floating plants;
- corals;
- equipment;
- invertebrates;
- problems;
- inspiration.

Specifically report before → after for Marine, Caridina/shrimp, Problems, Floating plants, and Coral diversity.

Do not use total count alone as success metric.

### PASS
Coverage is measurably improved or remaining gaps are explicitly explained.

**STOP if FAIL.**

---

# SPEC 12 — DATA DEPTH AUDIT

Recalculate:
- Species
- Plants
- Corals
- Equipment
- Invertebrates
- Problems
- Overall

Compare with Phase 3:
- Species 95%
- Plants 93%
- Corals 92%
- Invertebrates 93%
- Equipment 60%
- Problems 50%
- Overall 81%

Do not manipulate metrics to make them look better. If depth decreases because valid new entities have incomplete applicable fields, explain why. If metric definition needs improvement, document it instead of silently changing it.

### PASS
Depth results are transparent and reproducible.

**STOP if FAIL.**

---

# SPEC 13 — DUPLICATE & DATA-INTEGRITY AUDIT

Check:
- duplicate names;
- duplicate scientific names;
- duplicate slugs;
- malformed slugs;
- accidental species/morph duplication;
- coral trade-name duplication;
- equipment duplication;
- broken references caused by slug changes.

Do not delete existing records blindly. Any deletion must be evidence-based and documented.

### PASS
No unresolved critical duplication or integrity issue.

**STOP if FAIL.**

---

# SPEC 14 — FINAL TECHNICAL VERIFICATION

Run:
- lint;
- relevant tests;
- TypeScript checks;
- production build if code/schema/query changes require it;
- representative route verification.

Verify representative pages for Species, Plants, Corals, Equipment, Invertebrates, and Problems.

Check:
- no broken pages;
- no missing required rendering;
- no malformed slugs;
- no duplicate new records;
- no data loss;
- no unexpected schema/query regression.

### PASS
Technical verification complete.

---

# REQUIRED CHECKPOINT

Create:

`DATABASE_EXPANSION_PHASE_4_CHECKPOINT.md`

Include:

## 1. Executive Summary
- Phase 3 baseline
- Phase 4 final count
- entities added
- entities skipped
- entities corrected/deleted
- status

## 2. Domain Coverage
Before/after for:
- freshwater species
- marine species
- shrimp/Caridina
- plants
- floating plants
- corals
- equipment
- problems
- invertebrates

## 3. Taxonomy & Classification
- corrections
- variants/morphs
- trade names
- deferred ambiguous candidates

## 4. Batch Results
For each batch:
- attempted
- created
- skipped
- duplicates
- domains covered

## 5. Data Quality
- factual corrections
- unresolved issues
- manual-review items
- source quality

## 6. Equipment
- total
- data completeness
- technical-spec coverage
- generic vs manufacturer-specific

## 7. Data Depth
Before/after:
- Species
- Plants
- Corals
- Equipment
- Invertebrates
- Problems
- Overall

## 8. Images
`OUT OF SCOPE — owner will add images separately.`

## 9. Relationships
`DEFERRED — no speculative relationships added.`

## 10. Verification
- lint
- tests
- TypeScript
- build
- route verification
- duplicate/integrity audit

## 11. Remaining Backlog
Separate:
- Marine gaps
- Freshwater gaps
- Shrimp/invertebrate gaps
- Plant gaps
- Coral gaps
- Equipment gaps
- Problem gaps
- schema limitations
- manual verification

## 12. Recommendation
State the exact next database action based on evidence from this phase.

Do not automatically recommend another expansion phase merely because entity count is below an arbitrary number.

---

# FINAL RESPONSE FORMAT

Return exactly:

DATABASE EXPANSION PHASE 4

Status:
[PASS / PASS WITH BACKLOG / BLOCKED / FAIL]

Baseline:
[...]

Final:
[...]

Entities added:
[...]

Domain coverage:
[...]

Marine:
[...]

Shrimp / Caridina:
[...]

Plants:
[...]

Corals:
[...]

Problems:
[...]

Equipment:
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
DATABASE_EXPANSION_PHASE_4_CHECKPOINT.md

Images:
OUT OF SCOPE

Relationships:
DEFERRED

Search Console:
NOT AVAILABLE

Next:
[exact evidence-based next action]

# CORE PRINCIPLE

> AquaMind Database should become a reliable aquarium knowledge base, not a collection of increasingly large numbers.

Accuracy, scientific identity, useful husbandry information, domain balance, and maintainability take priority over entity count.
