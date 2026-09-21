# AquaMind Database — Phase 14
# CONTROLLED COVERAGE EXPANSION + TAXONOMY NORMALIZATION

**Phase:** DATABASE_PHASE_14_CONTROLLED_COVERAGE_EXPANSION  
**Date:** 2026-09-21  
**Status:** READY TO EXECUTE  
**Predecessor:** Phase 13 — Master Aquarium Coverage + Popular Line Audit  
**Next:** Phase 15 — Database V1 Final QA & Freeze

---

## 0. PURPOSE

Phase 14 is the execution phase following the read-only Master Coverage Audit.

The goal is **not** to maximize entity count.

The goal is to make the AquaMind database broad and deep enough for long-term use by covering major aquarium styles, major freshwater community groups, freshwater predator/large-fish groups, major marine fish groups, popular marine invertebrates, Soft/LPS/SPS/NPS corals, important plants, equipment, and aquarium problems.

At the same time, normalize:
- species vs variant/morph/cultivar/trade line
- duplicate scientific identities
- `parentSpecies`
- aliases/local names
- group classification
- aquarium-style coverage

### Core principle

> **Accuracy > quantity. Coverage quality > raw entity count.**

A Phase 13 manifest candidate MUST NOT be created merely because it appears in the manifest.

Every candidate must pass identity, taxonomy, duplicate, and data-quality gates.

If a candidate is actually a variant/morph/cultivar/trade line, do not create a fake species.

If a candidate cannot be verified confidently, HOLD/DEFER it.

---

# 1. SOURCE OF TRUTH

Use these project inputs:

1. `DATABASE_PHASE_13_MASTER_COVERAGE_AUDIT_CHECKPOINT.md`
2. `DATABASE_PHASE_13_MASTER_COVERAGE_MATRIX.md`
3. `DATABASE_PHASE_13_APPROVED_EXPANSION_MANIFEST.md`
4. `DATABASE_PHASE_13_EXPANSION_READINESS.md`
5. `DATABASE_PHASE_13_TAXONOMY_IDENTITY_AUDIT.md`
6. Phase 12.1 taxonomy integrity checkpoint
7. Current project database/schema/code
8. Existing relationship/search/Finder implementation

Do NOT silently replace Phase 13 findings with generic assumptions.

If Phase 13 contains an inconsistency, resolve it with authoritative taxonomy evidence before migration.

---

# 2. NON-NEGOTIABLE RULES

## 2.1 No blind expansion

Every candidate receives one final action:

- `ADD`
- `VARIANT / PARENT`
- `ALIAS ONLY`
- `DUPLICATE / MERGE`
- `DEFER`
- `HOLD`

## 2.2 No guessed data

Never invent scientific names, taxonomy, habitat, distribution, size, temperature, pH, GH, tank size, diet, temperament, difficulty, reef compatibility, lighting, CO₂, flow, or equipment specifications.

If reliable data cannot be established:

> use `null` / unknown or HOLD the candidate.

## 2.3 No entity inflation

Do not create separate species documents for color morphs, ornamental strains, common trade variants, or cultivars.

When a legitimate variant is represented as a separate discoverable record, use `parentSpecies`.

## 2.4 No schema redesign

Do not redesign the database schema.

Existing Phase 12 fields are available:

### Species
`localNames`, `aliases`, `group`, `parentSpecies`

### Plants
`localNames`, `aliases`, `group`

### Corals
`localNames`, `aliases`, `group`

### Invertebrates
`localNames`, `aliases`, `parentSpecies`

If a blocking schema limitation is discovered:

**STOP. Do not silently modify the schema.**

Report the blocker and proposed minimal change.

## 2.5 No content production

Out of scope:
- blog articles
- article briefs
- article writing
- article strategy
- images
- image generation/research
- social content

## 2.6 Strict sequential execution

Execute:

```text
SPEC-00 PASS
  ↓
SPEC-01 PASS
  ↓
...
  ↓
SPEC-19 PASS
```

If any SPEC fails:

> STOP immediately.

---

# 3. MASTER ACTION CLASSIFICATION

For every Phase 13 candidate create:

| Candidate | Domain | Current Entity | Scientific Name | Classification | Action | Parent | Evidence | Priority |
|---|---|---|---|---|---|---|---|---|

Classification must distinguish:
- canonical species
- subspecies where genuinely supported
- morph
- ornamental strain
- cultivar
- trade name
- alias
- duplicate
- equipment subtype
- problem subtype

---

# 4. SPEC-00 — BASELINE LOCK

Record before mutation:

- total published entities
- drafts
- count by domain
- duplicate slugs
- duplicate scientific names
- missing names
- missing scientific names
- missing category/group
- current `parentSpecies` count
- relationship integrity
- current search benchmark
- tests/lint/TypeScript/build state

Phase 13 baseline was:

| Domain | Count |
|---|---:|
| Species | 166 |
| Plants | 55 |
| Corals | 43 |
| Invertebrates | 48 |
| Equipment | 43 |
| Problems | 32 |
| Inspiration | 10 |
| **Total** | **397** |

Recalculate against live data; do not assume it is unchanged.

### PASS
- baseline generated
- no unexpected mutation
- manifest loaded
- repository ready

---

# 5. SPEC-01 — MANIFEST + TAXONOMY INTEGRITY GATE

Audit every candidate before creation:

1. verify common name
2. verify scientific identity
3. determine canonical species status
4. determine variant/morph/cultivar status
5. compare against existing database
6. compare scientific names
7. identify parent if applicable
8. assign final action

### Mandatory review of known Phase 13 issues

Do not blindly copy these rows:

- Banggai Clownfish must be independently verified; do not use the incorrect `Amphiprion polymnus` identity from the audit.
- Panda Clownfish is an Ocellaris morph/variant.
- Stars-and-Stripes Puffer is associated with *Arothron hispidus*, not automatically a new species.
- RTG Arowana is a variant of Asian Arowana, not a separate species.
- Goldfish lines such as Black Moor, Ryukin and Telescope are domestic forms of *Carassius auratus*.
- San Francisco Piranha is a variant/line, not automatically a new species.
- Striped Snakehead must be checked against existing *Channa striata*.
- Boeseman's Rainbowfish must be checked against existing Boesemani Rainbowfish.
- Nerite listed as a marine proxy must not be treated as a marine species without explicit biological justification.
- Verify spelling/identity of `Polypterus weeksii`.

### PASS
Every candidate has a verified action. No candidate remains ambiguously classified.

---

# 6. SPEC-02 — EXISTING DUPLICATE / IDENTITY NORMALIZATION

Audit all duplicate scientific-name groups from Phase 13.

For each:
- identify canonical record
- identify variants
- identify accidental duplicates
- merge useful data
- repoint references
- delete only confirmed duplicates
- use `parentSpecies` for legitimate variants

At minimum inspect:
- `Carassius auratus`
- `Gasteropelecus sternicla`
- all other Phase 13 duplicate scientific-name groups
- Ich / White Spot Disease
- duplicate coral/plant/equipment/problem identities

### Safety

Never delete until:
- references are mapped
- useful data is merged
- canonical target confirmed
- no broken reference remains

### PASS
- duplicate identity groups resolved
- variants classified
- zero broken references
- no data loss

---

# 7. SPEC-03 — PARENTSPECIES / VARIANT NORMALIZATION

Populate `parentSpecies` where appropriate.

Evaluate:

### Goldfish
Canonical:
- Common Goldfish — *Carassius auratus*

Variants:
- Fantail
- Oranda
- Ranchu
- Fancy Goldfish
- Black Moor
- Ryukin
- Telescope

### Arowana
Evaluate RTG and other verified ornamental lines against *Scleropages formosus*.

### Clownfish
Evaluate Panda, Snowflake and other Ocellaris/Percula morphs as variants.

### Piranha
Evaluate color/strain/trade variants against canonical species.

### Plants
Evaluate Java Fern Windelov and Narrow Leaf as cultivars/variants of Java Fern where appropriate.

### PASS
- no variant falsely presented as a biological species
- valid parent references
- no circular/self references
- no broken references

---

# 8. SPEC-04 — AQUARIUM STYLE / GROUP ENRICHMENT

Improve `aquariumStyle` and `group` only where evidence supports it.

Prioritize weak/empty styles reported by Phase 13:
- Blackwater
- Biotope
- Amazon / South American
- Southeast Asian
- African Cichlid
- Native / Regional
- Anemone / Clownfish
- Brackish

A style may become represented through accurate tagging of existing records.

Do not create entities merely to make a style non-empty.

### PASS
- style tags accurate
- group values consistent
- no artificial coverage
- Finder/filter compatibility preserved

---

# 9. SPEC-05 — FRESHWATER COMMUNITY EXPANSION

Fill high-value popular community gaps identified by Phase 13, only after SPEC-01.

Evaluate candidates such as:
- Halfbeak
- Bleeding Heart Tetra
- Bucktooth Tetra
- Pearl Danio
- Giant Danio
- Sailfin Pleco
- Rubber Lip Pleco
- Kissing Gourami
- missing verified rainbowfish lines
- Figure-8 Puffer
- Denison Barb
- Tinfoil Barb
- Red-Tail Shark
- Black Ghost Knifefish
- Freshwater Stingray

Do not automatically add every candidate.

Do not create separate species for ornamental morphs such as Albino Corydoras where it is only a color morph.

### PASS
- identities verified
- no duplicates
- minimum data populated
- group/style valid
- relationships only when defensible

---

# 10. SPEC-06 — FRESHWATER PREDATOR / LARGE FISH EXPANSION

Strengthen:

### Arowana
Evaluate Leichardti, Black Arowana and other verified gaps. RTG remains a variant.

### Snakehead
Evaluate Spotted and Copperhead Snakehead and other approved distinct species.

### Bichir
Evaluate Lapradei, Weeksii and other approved high-value lines.

### Piranha
Add distinct verified species only.

### Gar
Evaluate Spotted, Longnose and Florida Gar.

### Peacock Bass
Add distinct verified species only.

### Large predatory catfish
Evaluate Tiger Shovelnose, Pictus, Walking Catfish, Goonch and other approved lines.

### Predatory cichlids
Evaluate Jaguar, Wolf/Dovii, Midas, Red Devil.

### Freshwater rays
Evaluate *Potamotrygon motoro*.

### Other large fish
Evaluate Clown Knifefish, Bala Shark, Iridescent Shark, Red-Bellied Pacu.

### PASS
Predator coverage improves without taxonomy inflation.

---

# 11. SPEC-07 — MARINE FISH EXPANSION

Strengthen common marine groups.

### Clownfish
Evaluate:
- Maroon
- Tomato
- Clarkii
- Skunk
- Saddleback

Do not add morphs as species.

### Tangs
Evaluate:
- Purple
- Powder Blue

### Angelfish
Evaluate:
- Queen
- Koran
- Rock Beauty

Do not duplicate Emperor Angelfish under another name.

### Damselfish
Evaluate:
- Yellowtail
- Three-stripe
- Springer's
- Garibaldi

### Gobies
Evaluate:
- Diamond Watchman
- Randall's
- Midas

### Blennies / Wrasses / Butterflyfish / Triggerfish
Add only high-value, verified lines from the Phase 13 manifest.

### Puffers
Add distinct marine species only.

### Eels / Morays
Verify identity carefully before adding.

### Anthias
Evaluate Bartlett's and Dispar.

### Cardinalfish
Evaluate Pajama Cardinalfish.

### PASS
- no duplicate marine fish
- no freshwater/marine misclassification
- reef compatibility populated when supported
- styles accurate

---

# 12. SPEC-08 — MARINE INVERTEBRATE EXPANSION

Evaluate:

### Snails
- Trochus
- Astraea

Do not count freshwater Nerite as marine coverage.

### Crabs
- Pom-Pom
- Spider / Decorator

### Starfish
- Chocolate Chip
- Fromia
- Linckia

### Urchins
- Pencil
- Collector

### Anemones
- Sebae
- Magnificent
- Long Tentacle

Add only aquarium-relevant, verified candidates.

### PASS
- correct water type
- reef compatibility where supported
- no proxy confusion
- no duplicates

---

# 13. SPEC-09 — CORAL EXPANSION

Strengthen Soft → LPS → SPS → NPS.

### Soft
Evaluate:
- Lobophytum
- Colt Coral

### LPS
Add only genuinely useful missing groups.

### SPS
Evaluate:
- Table Acropora
- Porites
- other approved high-value gaps

### NPS
Evaluate:
- Gorgonian

### HOLD
Do not automatically add disputed taxonomy such as Wellsophyllia.

### PASS
- coralType correct
- photosynthetic state correct
- waterType correct
- reefCompatibility correct
- no duplicate/disputed identity

---

# 14. SPEC-10 — PLANT EXPANSION

Improve important freshwater plant groups.

Evaluate:
- Bolbitis heudelotii
- Dwarf Baby Tears
- other verified Phase 13 gaps

Treat Java Fern Windelov/Narrow Leaf as cultivars/variants where appropriate.

Do not guess light/CO₂ or other parameters.

### PASS
- identity verified
- growth form valid
- group/style valid
- no guessed parameters

---

# 15. SPEC-11 — EQUIPMENT EXPANSION

Complete important categories without brand/model proliferation.

### Filtration
- Undergravel Filter
- Wet/Dry Filter
- Fluidized Bed Filter

### CO₂
- CO₂ Diffuser
- Drop Checker
- Bubble Counter where useful

### Substrate
- Aquarium Sand
- Coral Sand / Aragonite

### Lighting
- T5 and other durable category gaps where useful

### Maintenance
- Aquascaping Scissors

### Dosing
- Kalkwasser Reactor where appropriate

Do not add brand-specific products.

If controlled-vocabulary conflict blocks migration:

**STOP and report it.**

### PASS
- no duplicates
- valid categories
- generic/durable naming
- no product-catalog behavior

---

# 16. SPEC-12 — PROBLEM DATABASE CLEANUP / EXPANSION

Resolve duplicates and categories:

- Ich / White Spot Disease
- BGA / Cyanobacteria
- Temperature Shock
- Planaria / Hydra
- null categories where known

Do NOT create generic `Fish Fungus` merely because Saprolegnia exists.

Evaluate:
- Brown Jelly Disease
- RTN
- other distinct coral problems

### PASS
- no duplicate concepts
- categories valid
- no unsupported claims
- diagnosis routes preserved

---

# 17. SPEC-13 — DATA ACCURACY / DATA DEPTH GATE

Every new or modified entity must pass:

### Identity
- name
- scientific name
- aliases/local names
- group
- parentSpecies where applicable

### Biological
- water type
- difficulty
- size
- habitat/region where supported
- diet
- temperament

### Parameters
Where relevant:
- temperature min/max
- pH min/max
- GH min/max
- tank size
- light
- CO₂
- flow

### Coral
- coralType
- photosynthetic
- reefCompatibility
- placement
- flow

### Equipment
- category
- tank range
- flow
- power
- verified specifications

If a value is uncertain:

`null`

is preferable to an invented value.

### PASS
- zero guessed values
- zero impossible numeric values
- zero unit inconsistencies
- zero identity conflicts

---

# 18. SPEC-14 — RELATIONSHIP INTEGRITY

Validate:
- species ↔ plants
- species ↔ invertebrates
- species ↔ equipment
- species ↔ problems
- plant ↔ equipment
- plant ↔ problems
- coral ↔ equipment
- coral ↔ problems
- invertebrate ↔ problems
- parentSpecies

Do not create speculative fish-to-fish compatibility.

### PASS
- 0 broken refs
- 0 self refs
- 0 circular parent refs
- no speculative relationships

---

# 19. SPEC-15 — SEARCH / ALIAS / FINDER / FILTER REGRESSION

Verify global search for:
- canonical names
- scientific names
- aliases
- local names

Verify:
- ranking
- deduplication
- database filters
- Finder
- URL state
- aquariumStyle
- region
- predator
- reef compatibility
- water type
- difficulty
- group

Create a Phase 14 benchmark containing new records, common terms, Vietnamese terms, aliases, scientific names, variant names, equipment and problem terms.

### PASS
- new records searchable
- variants resolve correctly
- no duplicate search results
- Finder works
- filters work

---

# 20. SPEC-16 — ROUTE / SEO REGRESSION

Verify:
- new entity slugs
- existing slugs
- detail pages
- listing pages
- breadcrumbs
- JSON-LD
- metadata
- sitemap
- internal links

Do not create indexable duplicate URLs for aliases/morphs unless intentionally represented as canonical discoverable records.

### PASS
- no broken routes
- no duplicate canonical URLs
- sitemap builds
- metadata builds

---

# 21. SPEC-17 — CODE / TEST / BUILD GATE

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Known baseline:
- Tests: 238/239 with existing `compare.test.ts` failure
- Lint: PASS
- TypeScript: PASS
- Build: PASS

A new test failure, TypeScript error, lint error, or build failure is a hard stop.

Do not modify unrelated code just to make the phase appear green.

---

# 22. SPEC-18 — FINAL COVERAGE RECALCULATION

Rebuild the Master Coverage Matrix.

Measure:

## Freshwater community
- livebearers
- tetras
- rasboras/danios
- corydoras
- plecos
- cichlids
- gouramis
- loaches
- rainbowfish
- goldfish
- puffers
- other popular lines

## Freshwater predator / large fish
- Arowana
- Snakehead
- Bichir
- Piranha
- Gar
- Peacock Bass
- predatory cichlids
- predatory catfish
- rays
- other large lines

## Marine
- clownfish
- tangs
- angelfish
- damselfish
- gobies
- blennies
- wrasses
- butterflyfish
- triggers
- puffers
- eels
- lionfish
- anthias
- cardinalfish
- mandarinfish
- other major groups

## Corals
- Soft
- LPS
- SPS
- NPS

## Plants
- stem
- rosette
- carpet
- moss
- epiphyte
- floating
- red plants

## Invertebrates
- freshwater shrimp
- freshwater snails
- marine shrimp
- marine snails
- crabs
- starfish
- urchins
- anemones
- other reef invertebrates

## Equipment
- filtration
- lighting
- heating/cooling
- circulation
- CO₂
- ATO
- dosing
- skimming
- reactors
- testing
- substrate
- maintenance

## Problems
- fish disease
- parasites
- bacterial/fungal
- algae
- plant
- water quality
- equipment
- coral/reef

Do not report success based only on total entity count.

Report:
- group coverage
- popular line coverage
- variant coverage
- style coverage
- data quality
- search discoverability

---

# 23. SPEC-19 — FINAL CHECKPOINT + CURRENT STATE

Create:

`DATABASE_PHASE_14_CONTROLLED_COVERAGE_EXPANSION_CHECKPOINT.md`

Include:

## 1. Phase status
`PASS` or `FAILED`

## 2. Baseline
Full domain counts.

## 3. Final inventory
Full domain counts.

## 4. Migration summary

| Action | Count |
|---|---:|
| ADD | |
| VARIANT/PARENT | |
| ALIAS ONLY | |
| DUPLICATE/MERGE | |
| DEFER | |
| HOLD | |

## 5. Taxonomy normalization
- duplicate scientific-name groups resolved
- parentSpecies count
- variants normalized
- aliases/localNames added
- unresolved identities

## 6. Coverage delta
Before → After for every major group.

## 7. Style coverage delta

## 8. Data quality
- broken refs
- duplicate slugs
- duplicate scientific names
- invalid numeric values
- missing critical fields
- invalid relationships

## 9. Search benchmark

## 10. Regression
- Tests
- Lint
- TypeScript
- Build
- Finder
- Filters
- Routes
- SEO

## 11. Deferred items

## 12. Sanity mutation summary
- created
- updated
- deleted
- references repointed

## 13. Final recommendation
State whether Phase 15 is ready.

---

# 24. CURRENT STATE UPDATE

After SPEC-19 PASS, update:

`AQUA_BLOG_CURRENT_STATE.md`

Add a Phase 14 section containing:
- date
- status
- baseline
- final inventory
- taxonomy changes
- coverage delta
- search/Finder status
- test/lint/TS/build status
- checkpoint path
- deferred work
- Phase 15 readiness

Do not overwrite historical phase records.

---

# 25. EXPECTED OUTPUTS

At minimum:

```text
report/
├── DATABASE_PHASE_14_CONTROLLED_COVERAGE_EXPANSION_CHECKPOINT.md
├── DATABASE_PHASE_14_MIGRATION_SUMMARY.md
├── DATABASE_PHASE_14_TAXONOMY_NORMALIZATION.md
├── DATABASE_PHASE_14_COVERAGE_DELTA.md
├── DATABASE_PHASE_14_SEARCH_BENCHMARK.md
└── DATABASE_PHASE_14_DATA_QUALITY_REPORT.md
```

Additional audit files may be created where useful.

---

# 26. DEFERRED TO PHASE 15+

Do not expand into unrelated work.

Deferred:
- exhaustive world species catalogue
- fuzzy/typo search beyond current safe architecture
- analytics/search telemetry
- brand-specific equipment catalogue
- content production
- article relationships
- images
- full biological taxonomy hierarchy
- price/availability data
- speculative aliases
- uncertain freshwater eel taxonomy
- disputed coral taxonomy
- candidates failing identity verification

---

# 27. DEFINITION OF DONE

Phase 14 is complete only when:

- taxonomy is cleaner than baseline
- duplicate identities are resolved
- variants are correctly modeled
- popular aquarium groups have materially better coverage
- freshwater predator lines are appropriately represented
- marine fish coverage is materially stronger
- marine invertebrate coverage is materially stronger
- coral coverage is balanced
- plant coverage is balanced
- equipment coverage is practical
- problem coverage has no obvious duplicate concepts
- data is accurate
- no guessed parameters were inserted
- relationships remain valid
- search works
- Finder works
- filters work
- routes work
- SEO works
- tests/lint/TypeScript/build pass
- checkpoint is created
- current state is updated

> **Do not stop because the database reached a target number. Stop because it reached a stable, accurate, useful coverage level suitable for long-term maintenance.**

---

# 28. PHASE 15 HANDOFF CONDITION

Only recommend Phase 15 when all are PASS:

```text
Taxonomy Integrity        PASS
Duplicate Integrity       PASS
Popular Line Coverage     PASS
Predator Coverage         PASS
Marine Coverage           PASS
Coral Coverage            PASS
Plant Coverage            PASS
Invertebrate Coverage     PASS
Equipment Coverage        PASS
Problem Coverage          PASS
Data Quality              PASS
Relationships             PASS
Search                    PASS
Finder                    PASS
Filters                   PASS
Routes                    PASS
SEO                       PASS
Tests                     PASS
Lint                      PASS
TypeScript                PASS
Build                     PASS
Checkpoint                PASS
Current State             UPDATED
```

If any item is not PASS, Phase 14 is not complete.
