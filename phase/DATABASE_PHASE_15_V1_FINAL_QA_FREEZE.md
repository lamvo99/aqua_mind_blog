# DATABASE PHASE 15 — V1 FINAL QA & FREEZE

**Project:** AquaMind Website  
**Phase:** 15  
**Name:** Database V1 Final QA & Freeze  
**Status:** READY TO EXECUTE  
**Baseline:** Phase 14 complete  
**Expected baseline inventory:** ~494 entities  
**Primary goal:** Finalize Database V1 for long-term maintenance mode

---

## 1. PURPOSE

Phase 15 is the **final QA, integrity validation, coverage validation, and freeze phase** for the AquaMind database.

This is **NOT a new expansion phase**.

The objective is to answer:

> **Is the current AquaMind database broad enough, deep enough, accurate enough, internally consistent, searchable, and technically stable enough to freeze as Database V1?**

If PASS:

```text
DATABASE V1
    ↓
  FREEZE
    ↓
MAINTENANCE MODE
```

---

## 2. CORE PRINCIPLES

### 2.1 Accuracy > Quantity

Do not add entities merely to increase the count.

If a value cannot be verified:

```text
UNKNOWN / NULL
```

Never guess.

### 2.2 No Expansion

Phase 15 must NOT become another expansion phase.

Do not create new species, plants, corals, invertebrates, equipment, or problems unless a critical integrity issue requires replacement/correction of an invalid existing record.

If a missing group is discovered:

```text
DOCUMENT → DEFER TO POST-V1 BACKLOG
```

### 2.3 V1 Does Not Mean Complete Worldwide

V1 does not need every aquarium species.

It is sufficient when major aquarium domains, popular groups, important predator lines, marine groups, coral categories, plant groups, invertebrates, equipment, and common problems are represented and discoverable.

The goal is:

> **Broad + deep + accurate + maintainable**

not:

> **Maximum entity count**

---

## 3. STRICT EXECUTION RULE

All SPECs are sequential:

```text
SPEC-00 PASS
    ↓
SPEC-01 PASS
    ↓
...
SPEC-21 PASS
    ↓
V1 FREEZE
```

### HARD STOP

If any SPEC fails:

1. STOP immediately.
2. Do not continue.
3. Record failure, affected records, root cause, severity, and proposed remediation.
4. Do not silently fix failures outside the current SPEC.
5. Re-run the failed SPEC only after remediation.

---

## 4. SCOPE

### IN SCOPE

- database inventory
- schema integrity
- taxonomy
- canonical species vs variants/morphs
- `parentSpecies`
- scientific names
- names/slugs
- aliases
- localNames
- groups
- aquariumStyle
- region
- waterType
- numeric parameters
- equipment vocabulary
- problem taxonomy
- relationships
- search
- filters
- Finder
- compare
- discovery journeys
- routes
- SEO dependencies
- TypeScript
- lint
- tests
- production build
- Sanity integrity
- final documentation

### OUT OF SCOPE

- article production
- article writing
- image production
- content clusters
- publishing
- analytics strategy
- Google Search Console strategy
- major UI redesign
- new database domains
- fuzzy-search redesign
- database expansion

---

# SPEC-00 — BASELINE LOCK

## Objective

Lock the exact Phase 14 starting state.

Create:

```text
report/DATABASE_PHASE_15_BASELINE.json
```

Record:

- total entities
- published entities
- drafts
- per-domain counts
- duplicate slugs
- duplicate scientific names
- null names
- null categories/groups
- parentSpecies count
- aliases count
- localNames count
- aquariumStyle coverage
- region coverage
- waterType coverage
- numeric-field coverage
- relationship coverage
- broken references
- circular references
- self references
- search benchmark baseline
- Finder baseline
- test baseline
- TypeScript baseline
- lint baseline
- build baseline

### PASS

- baseline generated
- inventory reproducible
- no unexplained mutation
- no unexpected drafts
- no duplicate slugs

If entity count differs from Phase 14 unexpectedly:

```text
STOP
```

---

# SPEC-01 — SCHEMA INTEGRITY

Verify production data against deployed schemas:

- Species
- Plant
- Coral
- Invertebrate
- Equipment
- Problem
- Inspiration

Verify:

```text
aquariumStyle
region
isPredator
reefCompatibility
photosynthetic
growthForm
redPlant
localNames
aliases
group
parentSpecies
```

### PASS

- zero unknown fields
- zero schema/data type mismatches
- zero accidental schema changes
- Studio recognizes production fields

---

# SPEC-02 — IDENTITY & TAXONOMY INTEGRITY

Audit every species/plant/coral/invertebrate:

```text
name
scientificName
slug
domain
group
waterType
```

Classify anomalies:

```text
CANONICAL
VARIANT/MORPH
CULTIVAR
ALIAS
DUPLICATE
UNKNOWN
```

Morph/cultivar records must not be treated as separate biological species.

Where appropriate:

```text
variant → parentSpecies → canonical entity
```

Re-check high-risk groups:

- Goldfish
- Angelfish
- Arowana
- Piranha
- Snakehead
- Bichir
- Clownfish
- Pufferfish
- Shrimp
- Plecos
- common-name-overlap corals

### PASS

No critical identity error, unresolved duplicate identity, or incorrect parent relationship.

---

# SPEC-03 — DUPLICATE INTEGRITY

Audit remaining duplicates after Phase 14.

### Slugs

```text
duplicate slug count = 0
```

### Scientific names

Do not automatically classify every repeated scientific name as an error.

Classify as:

- legitimate variant
- cultivar
- common-name representation
- legitimate aquarium form
- actual duplicate

Produce:

```text
report/DATABASE_PHASE_15_DUPLICATE_AUDIT.md
```

### PASS

No unresolved duplicate identity.

---

# SPEC-04 — PARENTSPECIES / VARIANT INTEGRITY

For every non-null `parentSpecies`:

1. referenced document exists
2. target is valid
3. parent is canonical
4. child != parent
5. no circular chain
6. relationship is semantically appropriate
7. no unsupported parent chain

### PASS

```text
broken parent refs = 0
self refs = 0
circular chains = 0
invalid parent relationships = 0
```

---

# SPEC-05 — NAME / ALIAS / LOCALNAME INTEGRITY

Audit:

```text
name
scientificName
aliases
localNames
```

Check for:

- conflicting aliases
- alias collisions
- local-name collisions
- misleading aliases
- obsolete taxonomy represented incorrectly
- trade names incorrectly represented as species
- Vietnamese names mapped to the wrong entity

If a name is ambiguous:

```text
DO NOT FORCE A SINGLE MAPPING
```

### PASS

No high-confidence alias/localName collision that produces a wrong entity.

---

# SPEC-06 — CORE DATA COMPLETENESS

Do not require every optional field to be populated.

Evaluate critical discovery/safety fields.

### Species

- name
- scientificName
- slug
- waterType
- difficulty
- aquariumStyle
- group
- tank size
- size
- temperature
- pH
- diet
- temperament

### Plants

- name
- scientificName
- difficulty
- placement
- light
- CO2
- growth rate
- growthForm
- aquariumStyle

### Corals

- name
- scientificName
- coralType
- difficulty
- light
- flow
- placement
- photosynthetic
- aquariumStyle

### Invertebrates

- name
- scientificName where applicable
- waterType
- group
- difficulty
- tank requirements
- reefCompatibility where applicable
- aquariumStyle

### Equipment

- name
- category
- aquariumStyle
- relevant specifications

### Problems

- title
- category
- waterType where applicable
- diagnostic usefulness

### PASS

No critical missing data on fields required for correct discovery or interpretation.

---

# SPEC-07 — NUMERIC DATA INTEGRITY

Canonical units:

```text
volume → L
size → cm
temperature → °C
flow → L/h
power → W
pH → pH
```

Audit:

- tankSizeMinL
- tankSizeMaxL
- sizeCm
- tempMinC
- tempMaxC
- phMin
- phMax
- ghMin
- ghMax
- flowRateLh
- powerW

Check:

```text
min <= max
no impossible negative values
no obvious outliers
no mixed units
no accidental strings
```

Unknown values remain:

```text
NULL
```

### PASS

Zero critical numeric errors.

---

# SPEC-08 — SEMANTIC / STYLE COVERAGE

Audit the major aquarium styles.

### Freshwater

- Community
- Planted
- Low-Tech
- High-Tech/CO2
- Aquascaping
- Blackwater
- Biotope
- Amazon/South American
- Southeast Asian
- African Cichlid
- Shrimp
- Betta/Nano
- Predator
- Large Fish
- Native/Regional

### Marine

- Marine Fish Only
- FOWLR
- Nano Reef
- Mixed Reef
- Soft Coral Reef
- LPS Reef
- SPS Reef
- NPS
- Anemone/Clownfish
- Marine Predator
- Invertebrate-focused

### Other

- Pond/Outdoor
- Brackish

A low-coverage style is not automatically a failure.

Classify:

```text
COVERED
PARTIAL
DEFERRED
```

Do not create entities solely to eliminate a partial label.

### PASS

No major V1 style is unintentionally absent because of missing tags.

---

# SPEC-09 — DOMAIN COVERAGE GATE

Evaluate coverage by:

```text
group + popular aquarium line
```

not raw entity count.

Audit:

- freshwater community
- freshwater predators
- large freshwater fish
- marine fish
- clownfish
- tangs
- angelfish
- gobies
- wrasses
- blennies
- butterflyfish
- triggerfish
- puffers
- eels
- coral
- soft coral
- LPS
- SPS
- NPS
- planted plants
- carpet plants
- moss
- epiphytes
- floating plants
- red plants
- freshwater shrimp
- marine cleanup crew
- anemones
- starfish
- urchins
- crabs
- snails
- equipment
- aquarium problems

### PASS

No major V1 domain is unintentionally absent.

Known deferred groups may remain documented in backlog.

---

# SPEC-10 — RELATIONSHIP INTEGRITY

Validate:

- species → plants
- species → invertebrates
- species → equipment
- species → problems
- plants → equipment
- plants → problems
- corals → equipment
- corals → problems
- invertebrates → problems
- relatedPosts
- relatedTools
- parentSpecies

Every reference must point to a valid target.

Do not create speculative compatibility relationships.

### PASS

```text
broken refs = 0
self refs = 0
invalid refs = 0
circular parent chains = 0
```

---

# SPEC-11 — SEARCH FINAL QA

Benchmark:

### Exact names
### Scientific names
### Aliases
### Vietnamese/local names
### Common group queries
### Negative queries

Examples:

```text
Arowana
Snakehead
Bichir
Piranha
Clownfish
Tang
Wrasse
Goby
Puffer
Pleco
Corydoras
Goldfish
Shrimp
Coral
Acropora
Anubias
CO2
Drop Checker
```

Negative examples where intentionally absent:

```text
Seahorse
Platypus
```

Classify every failure:

```text
DATA MISSING
ALIAS MISSING
SEARCH RANKING
INTENT AMBIGUITY
EXPECTED NEGATIVE
BUG
```

Do not optimize for an arbitrary 100% score.

Produce:

```text
report/DATABASE_PHASE_15_SEARCH_BENCHMARK.md
```

### PASS

- no critical search bug
- scientific names resolve correctly
- known aliases resolve correctly
- no dangerous false-positive mapping
- negative queries remain safe

---

# SPEC-12 — FILTER / FINDER / COMPARE QA

Test database filters:

- water type
- difficulty
- style
- region
- group
- predator
- reef compatibility
- numeric ranges

Test Finder:

- freshwater
- saltwater
- planted
- nano
- predator
- reef
- multi-domain
- unknown-data handling
- URL state

Test Compare:

- same domain
- multiple entities
- newly added entities
- variants

### PASS

No regression in filtering, ranking, Finder, URL persistence, compare, or rendering.

---

# SPEC-13 — ROUTE / SEO REGRESSION

Verify:

- entity slug
- detail page
- listing page
- metadata
- canonical URL
- JSON-LD
- sitemap inclusion where appropriate
- no entity 404
- no duplicate canonical URL

### PASS

No broken production entity routes.

---

# SPEC-14 — SANITY / PRODUCTION INTEGRITY

Check:

- published documents
- drafts
- deleted documents
- orphan references
- unknown fields
- schema recognition
- duplicate IDs/slugs
- unexpected mutations

Compare against Phase 14 final inventory.

### PASS

- no unexpected drafts
- no unknown fields
- no orphaned references
- no unexplained mutations
- Studio recognizes schema

---

# SPEC-15 — TYPESCRIPT / LINT / TEST / BUILD

Run:

```text
TypeScript
ESLint
Vitest
Production build
```

Expected known baseline:

```text
Tests: 238/239
```

The known `compare.test.ts` failure may be accepted only if it is unchanged and documented.

Any NEW failure is a:

```text
HARD STOP
```

Same rule for new TypeScript errors, lint errors, or build failures.

Pre-existing non-blocking warnings may remain only when explicitly documented.

---

# SPEC-16 — DISCOVERY JOURNEY FINAL QA

Run:

1. Freshwater Community
2. Planted Aquarium
3. Low-Tech
4. High-Tech/CO2
5. Blackwater
6. African Cichlid
7. Betta/Nano
8. Shrimp
9. Freshwater Predator
10. Large Fish
11. Marine Fish Only
12. FOWLR
13. Nano Reef
14. Mixed Reef
15. Soft Coral Reef
16. LPS Reef
17. SPS Reef
18. NPS
19. Anemone/Clownfish
20. Marine Predator
21. Invertebrate-focused
22. Brackish

Journey:

```text
START
→ FILTER / FINDER
→ RESULTS
→ ENTITY DETAIL
→ RELATED RESOURCES
→ NEXT DISCOVERY STEP
```

Record:

```text
PASS
PARTIAL
DEFERRED
FAIL
```

### PASS

No critical journey failure.

---

# SPEC-17 — FINAL DATA QUALITY SCORECARD

Create:

```text
report/DATABASE_PHASE_15_FINAL_SCORECARD.md
```

Use objective metrics, not an arbitrary overall score.

### Identity

- invalid scientific identities
- unresolved duplicates
- duplicate slugs

### Taxonomy

- valid parentSpecies
- invalid parentSpecies
- variant records

### Discovery

- search benchmark
- alias resolution
- localName resolution
- filter success
- Finder success

### Data

- numeric integrity
- missing critical fields
- relationship integrity

### Technical

- TypeScript
- lint
- tests
- build
- routes

### Coverage

- covered domains
- partial domains
- deferred domains

---

# SPEC-18 — V1 FREEZE DECISION

Only reach this SPEC after SPEC-00 through SPEC-17 PASS.

Decision:

```text
V1 READY TO FREEZE
```

or:

```text
V1 NOT READY
```

## V1 READY requires

### Identity

- no critical taxonomy errors
- no unresolved duplicate identity
- valid variant model

### Data

- no critical numeric errors
- no critical missing fields
- accurate core parameters

### Relationships

- 0 broken references
- 0 self references
- 0 circular parent chains

### Discovery

- Search works
- Filters work
- Finder works
- Compare works

### Technical

- TypeScript PASS
- Lint PASS
- Tests PASS or documented existing baseline only
- Build PASS
- Routes PASS

### Coverage

Major V1 aquarium domains represented.

If READY, create:

```text
report/DATABASE_V1_FREEZE.md
```

Include:

- freeze date
- final entity count
- per-domain counts
- schema version
- taxonomy model
- search architecture
- relationship model
- coverage summary
- known deferred areas
- known non-blocking technical baseline
- maintenance rules

---

# SPEC-19 — MAINTENANCE MODE DEFINITION

After V1 freeze, every future entity request must answer:

1. Is it genuinely important to aquarium users?
2. Is identity verified?
3. Does it fill a real coverage gap?
4. Is it not a duplicate?
5. Is it canonical species / variant / cultivar?
6. Are core parameters verified?
7. Are relationships defensible?
8. Is it useful enough to justify permanent maintenance?

Otherwise:

```text
DEFER
```

Future update types:

- PATCH — factual correction
- ENRICHMENT — verified missing information
- ALIAS UPDATE — verified search terminology
- TAXONOMY UPDATE — identity/parent correction
- NEW ENTITY — justified coverage need
- STRUCTURAL CHANGE — requires a new database phase

---

# SPEC-20 — FINAL CHECKPOINT

Create:

```text
report/DATABASE_PHASE_15_FINAL_QA_CHECKPOINT.md
```

Must contain:

```text
Phase: 15
Status:
Freeze decision:

Baseline entities:
Final entities:
Delta:

Species:
Plants:
Corals:
Invertebrates:
Equipment:
Problems:
Inspiration:

Duplicate slugs:
Duplicate scientific names:
Broken references:
Self references:
Circular chains:

ParentSpecies:
Aliases:
LocalNames:

Search benchmark:
Finder:
Filters:
Compare:

TypeScript:
Lint:
Tests:
Build:

Route audit:
SEO audit:
Sanity audit:

Coverage:
Covered:
Partial:
Deferred:

Known non-blocking issues:

Post-V1 backlog:

Freeze date:
```

---

# SPEC-21 — CURRENT STATE UPDATE

Update:

```text
AQUA_BLOG_CURRENT_STATE.md
```

Add:

```text
## Phase 15 — Database V1 Final QA & Freeze
```

Include:

- final inventory
- freeze status
- final taxonomy model
- final search architecture
- final relationship architecture
- coverage status
- known limitations
- post-V1 backlog
- maintenance mode status

Do not delete previous phase history.

---

# POST-V1 RULE

If Phase 15 passes:

```text
DATABASE V1 = FROZEN
```

From that point:

```text
CONTENT PRODUCTION
        ↓
uses
        ↓
DATABASE V1
```

Database changes become controlled maintenance work.

No continuous uncontrolled expansion.

---

# DEFINITION OF DONE

```text
[ ] SPEC-00 PASS
[ ] SPEC-01 PASS
[ ] SPEC-02 PASS
[ ] SPEC-03 PASS
[ ] SPEC-04 PASS
[ ] SPEC-05 PASS
[ ] SPEC-06 PASS
[ ] SPEC-07 PASS
[ ] SPEC-08 PASS
[ ] SPEC-09 PASS
[ ] SPEC-10 PASS
[ ] SPEC-11 PASS
[ ] SPEC-12 PASS
[ ] SPEC-13 PASS
[ ] SPEC-14 PASS
[ ] SPEC-15 PASS
[ ] SPEC-16 PASS
[ ] SPEC-17 PASS
[ ] SPEC-18 PASS
[ ] SPEC-19 PASS
[ ] SPEC-20 PASS
[ ] SPEC-21 PASS

[ ] DATABASE_V1_FREEZE.md created
[ ] DATABASE_PHASE_15_FINAL_QA_CHECKPOINT.md created
[ ] AQUA_BLOG_CURRENT_STATE.md updated
```

---

# FINAL PRINCIPLE

> **Do not freeze because the entity count is large.**
>
> **Freeze because the database is trustworthy.**

AquaMind Database V1 should be:

```text
BROAD
+
DEEP
+
ACCURATE
+
SEARCHABLE
+
CONNECTED
+
MAINTAINABLE
```

The purpose of Phase 15 is to make the database stable enough that AquaMind can move forward without continuously rebuilding its foundation.
