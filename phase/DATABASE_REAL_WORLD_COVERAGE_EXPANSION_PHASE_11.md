# DATABASE REAL-WORLD COVERAGE EXPANSION — PHASE 11

**Project:** AquaMind Website  
**Phase:** Database Phase 11  
**Scope:** Database quality, real-world coverage, verified entity expansion  
**Status:** READY FOR EXECUTION  
**Date:** 2026-09-21

---

## 0. Phase Objective

Phase 11 converts the Phase 10 real-world coverage audit into a **verified database expansion pass**.

The goal is not to maximize entity count. The goal is to improve real-world coverage while preserving:

- correct species identity
- correct scientific names
- accurate aquarium-relevant parameters
- clean taxonomy
- zero duplicate entities
- zero broken relationships
- consistent controlled vocabularies
- reliable Search / Filter / Finder behavior
- no speculative data

### Strategic rule

> **Quality and correctness take priority over quantity. If a fact cannot be verified confidently, use null/unknown rather than guessing.**

Images are **out of scope**. The owner will add images manually.

Content production, article creation, Sanity editorial workflows, and publishing are **out of scope**.

---

# 1. Phase 10 Baseline

Use the Phase 10 audit as the source of truth.

Expected baseline:

| Domain | Total |
|---|---:|
| Species | 148 |
| Plants | 57 |
| Corals | 45 |
| Invertebrates | 45 |
| Equipment | 42 |
| Problems | 33 |
| Inspiration | 10 |
| **Total** | **403** |

Phase 10 reported:

- 401 published
- 2 drafts
- 28 duplicate candidate pairs
- 56% exact-match search coverage in the simulation
- major missing-data gaps around Arowana, Piranha, Arapaima and selected marine/predator groups
- Vietnamese/local trade-name discovery failures
- no immediate schema expansion required for the P0/P1 entity additions

Do not assume that 403 means 403 unique entities. Duplicate resolution must happen first.

---

# 2. Mandatory Execution Rules

1. **Do not add new entities before duplicate resolution.**
2. **Do not create morphs/variants as separate species unless they are taxonomically distinct species.**
3. **Do not invent scientific names, parameters, habitat, compatibility, or relationships.**
4. **Do not create a generic problem entity merely because a synonym is missing from Search.**
5. **Do not introduce `localNames`, `aliases`, or `parentSpecies` in this phase unless a later SPEC explicitly proves they are required for the immediate implementation.**
6. **Do not modify images.**
7. **Do not modify article/content data.**
8. Every relationship added to a new entity must be justified by existing database rules or verified domain knowledge.
9. Existing valid data must not be rewritten merely for stylistic consistency.
10. Any uncertain candidate must be marked HOLD and excluded from creation.

---

# 3. SPEC-00 — Manifest Integrity Gate

## Objective

Validate the Phase 10 expansion manifest before any Sanity mutation.

### Required corrections

The Phase 10 manifest contains identity issues that must be corrected before execution:

### Red-tailed Catfish

Canonical species:

`Phractocephalus hemioliopterus`

Do **not** use:

`Baryonyx walkeri`

The latter is unrelated to Red-tailed Catfish.

### Figure 8 Puffer

Canonical species:

`Dichotomyctere ocellatus`

Former synonym:

`Tetraodon biocellatus`

Do **not** use:

`Carinotetraodon travancoricus`

That identity corresponds to Pea Puffer, not Figure 8 Puffer.

### Arowana variants

Treat the following as names/variants rather than automatically creating separate species:

- Huyết Long
- Kim Long
- Thanh Long

The actual species records to create must be taxonomically distinct and verified.

### Fish Fungus

Do not create a new generic `Fish Fungus` problem merely to solve search.

Phase 10 already contains:

`Saprolegnia`

and the audit explicitly notes that generic fungus coverage may be a synonym/search problem rather than a missing knowledge entity.

Therefore:

**HOLD unless a distinct, non-duplicate problem definition is demonstrated.**

### Gate

PASS only if:

- all manifest scientific identities are verified
- no known identity conflict remains
- duplicate candidates are explicitly listed
- HOLD candidates are separated from approved additions
- no schema mutation has occurred yet

FAIL → stop Phase 11.

---

# 4. SPEC-01 — Duplicate Resolution

Resolve the **28 duplicate candidate pairs** identified in Phase 10.

## Required process

For each candidate:

1. compare slug
2. compare common name
3. compare scientific name
4. compare water type
5. compare domain
6. compare key semantic fields
7. compare relationships
8. determine canonical record
9. merge useful information into canonical record
10. remove duplicate only after preservation is verified

### Rules

- Prefer the record with the cleanest canonical slug and strongest verified data.
- Do not silently delete a record containing unique verified information.
- Do not merge genuinely different species.
- Do not merge species variants into species records without taxonomic justification.
- Do not merge equipment that represents materially different products/functions.

### Gate

PASS only if:

- all 28 candidates have an explicit disposition
- no critical duplicate remains
- no unique verified data was lost
- no broken references remain
- entity count after cleanup is documented

FAIL → stop Phase 11.

---

# 5. SPEC-02 — P0 Freshwater Predator Expansion

Add only verified, taxonomically distinct entities from the Phase 10 P0 list.

## Arowana

Target coverage:

1. Asian / Red Arowana
2. Silver Arowana
3. Jardini Arowana

Scientific identities must be independently verified before creation.

Do not create:

- Huyết Long as a separate species
- Kim Long as a separate species
- Thanh Long as a separate species

unless the source establishes a distinct species identity.

Local/trade names are deferred to the future alias/local-name phase.

## Piranha

Target:

- verified representative Piranha species
- no duplicate species
- no morph records

The manifest's selected species must be verified before insertion.

## Arapaima

Target:

- `Arapaima gigas`

Only create if the existing database does not already contain the species under another canonical name.

## Required fields

Populate only fields supported by verified evidence:

- name
- slug
- scientificName
- excerpt
- waterType
- difficulty
- diet
- temperament
- tankSizeMinL
- sizeCm
- tempMinC / tempMaxC
- pH range
- GH range where verified
- aquariumStyle
- region
- isPredator
- suitableEquipment
- relatedProblems
- compatiblePlants where applicable
- compatibleInvertebrates only when predation/compatibility can be justified

Unknown values must remain null.

### Gate

PASS only if every P0 entity has:

- verified identity
- no duplicate
- valid slug
- valid water type
- valid numeric ranges
- appropriate predator classification
- no invented relationship data

FAIL → stop before P1.

---

# 6. SPEC-03 — P1 Freshwater Predator Expansion

Evaluate and add verified candidates from:

### Bichir

Potential additions:

- Ornate Bichir
- Delhezi Bichir
- Endlicheri Bichir

Do not create duplicates of existing Senegal Bichir data.

### Snakehead

Add selected verified species from the Phase 10 manifest.

The final species list must be taxonomically distinct and verified before mutation.

### Predatory Catfish

Add:

`Red-tailed Catfish — Phractocephalus hemioliopterus`

Do not use the incorrect Phase 10 manifest scientific name.

### Gate

Same data-integrity rules as SPEC-02.

---

# 7. SPEC-04 — P1 Marine Fish Expansion

Evaluate and add only the approved, non-duplicate marine fish.

Priority candidates from Phase 10:

- Sailfin Tang
- Naso Tang
- Emperor Angelfish
- Marine Puffer

Potential additional candidates must not be added merely to increase count.

### Special rule

Do not expand Tang/Surgonfish coverage into a large species catalogue in this phase.

The purpose is representative real-world coverage, not exhaustive commercial inventory.

### Required verification

For every marine species:

- scientific identity
- saltwater classification
- approximate adult size
- appropriate aquarium style
- reef compatibility where supported
- difficulty
- temperature range
- tank-size requirement
- appropriate equipment
- problem relationships

Unknown values remain null.

---

# 8. SPEC-05 — P2 Controlled Expansion

Only proceed after P0 and P1 pass.

Candidates:

- Frogfish
- Fungia
- Alveopora
- Alligator Gar
- additional African Rift species where justified

### HOLD

Do not add:

- freshwater eel
- broad Grouper expansion
- questionable puffer identities

until taxonomic identity and aquarium suitability are verified.

### Coral rule

Do not duplicate an existing coral under a trade/common-name variant.

Check:

- scientific name
- coralType
- photosynthetic
- aquariumStyle
- reefCompatibility
- temperature
- light/flow requirements where verified
- relationships

---

# 9. SPEC-06 — P3 / Deferred Candidates

Do not automatically add P3 candidates.

Candidates for later review:

- Fish TB
- Green Spotted Puffer
- Trachyphyllia
- Gar expansion
- additional minor coverage gaps

P3 is explicitly lower priority and may remain deferred if adding them would introduce uncertainty or duplicates.

---

# 10. SPEC-07 — Equipment & Problem Integrity

Phase 10 identified equipment vocabulary inconsistencies.

Current data contains categories such as:

- Skimmer
- ATO
- Dosing
- Chiller

These are already represented in the database but were not consistently reflected in the original controlled vocabulary audit.

## Requirement

Do not redesign the equipment schema in this phase.

Instead:

1. audit all equipment category values
2. identify canonical category values
3. document inconsistencies
4. normalize only if normalization is demonstrably non-breaking
5. verify existing filters and Finder behavior

### Missing Sump

Evaluate whether a Sump record is genuinely useful and distinct from existing equipment.

Add only if:

- no duplicate exists
- category is valid
- sufficient verified data exists

## Problems

Do not create `Fish Fungus` solely as a synonym for Saprolegnia.

Do not duplicate:

- Flukes / Gill Flukes
- BBA / Black Beard Algae
- other synonym-level concepts

### Gate

PASS only if no duplicate concept is introduced.

---

# 11. SPEC-08 — Data Quality Audit

After expansion, audit the entire database.

## Identity

- duplicate scientific names
- duplicate slugs
- duplicate common names
- domain mismatch
- incorrect scientific identity

## Numeric

Check:

- tankSizeMinL
- tankSizeMaxL where present
- sizeCm
- tempMinC / tempMaxC
- pH ranges
- GH ranges
- equipment flowRateLh
- powerW

Reject impossible or obviously malformed values.

Do not manufacture ranges where only one reliable value exists.

## Semantic

Check:

- waterType
- aquariumStyle
- region
- difficulty
- isPredator
- reefCompatibility
- photosynthetic
- growthForm
- redPlant
- coralType
- equipment category
- problem category

All controlled values must match the actual project vocabulary.

---

# 12. SPEC-09 — Relationship Integrity

Every newly created entity must be integrated into the existing relationship system where appropriate.

Verify:

### Species

- compatiblePlants
- compatibleInvertebrates
- suitableEquipment
- relatedProblems

### Plants

- suitableEquipment
- relatedProblems

### Corals

- suitableEquipment
- relatedProblems

### Invertebrates

- compatibleSpecies
- suitableEquipment
- relatedProblems

## Critical rule

Do not infer fish-to-fish compatibility automatically.

If compatibility requires domain-specific judgment that cannot be established safely:

`null / empty`

is preferable to an invented relationship.

---

# 13. SPEC-10 — Search Integrity

Re-run the Phase 10 search simulation after expansion.

At minimum test:

### Freshwater

- Arowana
- Silver Arowana
- Piranha
- Arapaima
- Bichir
- Snakehead

### Marine

- Sailfin Tang
- Naso Tang
- Emperor Angelfish
- marine puffer

### Corals

- Fungia
- Alveopora

### Equipment

- Sump
- Protein Skimmer
- ATO
- CO2 Regulator

### Problems

- Ich
- Fin Rot
- Dropsy
- Saprolegnia
- Flukes

The goal is to verify that expansion improves discovery without breaking existing search behavior.

Do not implement fuzzy/alias search in this phase.

That belongs to the future taxonomy/search phase.

---

# 14. SPEC-11 — Filter & Finder Regression

Verify:

- database listing pages
- domain filters
- semantic filters
- numeric range filters
- Finder hard constraints
- Finder soft constraints
- unknown handling
- URL state persistence
- multi-domain discovery

New predator entities must appear correctly under:

- Freshwater
- Predator
- Large Fish where applicable

New marine entities must appear under:

- Marine Fish Only
- Reef/FOWLR/Nano Reef where applicable

Do not change Finder logic unless a regression is found.

---

# 15. SPEC-12 — Frontend / Route Regression

Verify:

- `/database`
- `/species`
- `/plants`
- `/corals`
- `/equipment`
- `/invertebrates`
- `/problems`
- `/search`
- `/finder`
- all new entity detail routes

Check:

- 404 behavior
- slug generation
- static generation
- metadata
- breadcrumb
- JSON-LD
- relationship sections
- responsive layout

Images are intentionally not part of this verification.

---

# 16. SPEC-13 — Build & Automated Verification

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected baseline:

- tests: 238/239, with the known pre-existing `compare.test.ts` failure unless it has already been resolved
- lint: PASS
- TypeScript: PASS
- build: PASS

The previous TypeScript issue in `FinderQuiz.tsx` was already fixed by replacing `JSX.Element` with the React-compatible type.

Do not classify a timeout as a PASS.

If a command times out:

- record it explicitly as TIMEOUT
- determine whether the timeout is environmental/project-known
- do not claim the command passed

---

# 17. SPEC-14 — Final Inventory & Coverage Audit

Produce a final inventory:

| Domain | Before | Added | Removed/Merged | Final |
|---|---:|---:|---:|---:|
| Species | — | — | — | — |
| Plants | — | — | — | — |
| Corals | — | — | — | — |
| Equipment | — | — | — | — |
| Invertebrates | — | — | — | — |
| Problems | — | — | — | — |
| Inspiration | — | — | — | — |

Also report:

- unique entity count
- duplicate candidates resolved
- unresolved duplicate candidates
- new P0 entities
- new P1 entities
- new P2 entities
- deferred P3 entities
- HOLD entities
- broken references
- invalid relationships
- numeric anomalies
- missing required fields
- Search simulation results
- Finder regression
- test result
- lint result
- TypeScript result
- build result

---

# 18. SPEC-15 — Checkpoint

Create:

```text
DATABASE_REAL_WORLD_COVERAGE_EXPANSION_PHASE_11_CHECKPOINT.md
```

The checkpoint must contain:

1. Status
2. Date
3. Branch
4. Baseline inventory
5. Duplicate resolution
6. Expansion inventory
7. Data-quality results
8. Relationship results
9. Search results
10. Finder results
11. Filter results
12. Build/test/lint/TypeScript results
13. Deferred items
14. HOLD items
15. Known limitations
16. Phase 12 recommendation

Also update:

```text
AQUA_BLOG_CURRENT_STATE.md
```

with the Phase 11 completion status.

---

# 19. Hard Stop Conditions

Stop immediately if any of the following occurs:

- scientific identity cannot be verified
- duplicate status is ambiguous
- new record would duplicate an existing species
- numeric data is guessed
- relationship data is speculative
- controlled vocabulary is broken
- existing Finder behavior regresses
- existing Search behavior regresses
- existing routes break
- TypeScript introduces new errors
- tests introduce unexplained failures
- build fails for a new reason
- Sanity mutation produces unexpected records

Do not continue to the next SPEC after a failed gate.

---

# 20. Phase 11 Definition of Done

Phase 11 is **PASS** only when:

- [ ] SPEC-00 Manifest Integrity PASS
- [ ] SPEC-01 Duplicate Resolution PASS
- [ ] SPEC-02 P0 Predator Expansion PASS
- [ ] SPEC-03 P1 Freshwater Expansion PASS
- [ ] SPEC-04 P1 Marine Expansion PASS
- [ ] SPEC-05 P2 Controlled Expansion PASS or explicitly deferred with justification
- [ ] SPEC-06 P3 deferred candidates documented
- [ ] SPEC-07 Equipment/Problem integrity PASS
- [ ] SPEC-08 Data Quality PASS
- [ ] SPEC-09 Relationship Integrity PASS
- [ ] SPEC-10 Search Integrity PASS
- [ ] SPEC-11 Finder/Filter Regression PASS
- [ ] SPEC-12 Route Regression PASS
- [ ] SPEC-13 Automated Verification PASS
- [ ] SPEC-14 Final Inventory complete
- [ ] SPEC-15 Checkpoint created
- [ ] `AQUA_BLOG_CURRENT_STATE.md` updated

---

# 21. Explicitly Deferred to Phase 12+

The following are **not Phase 11 requirements**:

### Taxonomy / alias schema

Potential future fields:

- `localNames`
- `aliases`
- `parentSpecies`

### Global Search

Potential future work:

- alias search
- synonym expansion
- fuzzy matching
- typo tolerance
- weighted search ranking
- Vietnamese/local-name discovery
- search suggestions

### Exhaustive species catalog

Do not attempt to catalogue every commercially available species.

The objective is a high-quality knowledge database with strong representative coverage.

### Images

Owner-managed manually.

### Content

Article production remains in the separate content workflow.

---

# 22. Recommended Next Phase

If Phase 11 passes, the next database-focused phase should be:

**Phase 12 — Taxonomy, Aliases & Global Search Foundation**

Focus:

1. canonical names
2. local/trade names
3. aliases/synonyms
4. morph/variant relationships
5. Vietnamese search terms
6. search ranking
7. fuzzy matching
8. global discovery quality

Do not begin Phase 12 until Phase 11 is fully verified.
