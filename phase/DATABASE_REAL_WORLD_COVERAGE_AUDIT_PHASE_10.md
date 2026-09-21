# DATABASE REAL-WORLD COVERAGE AUDIT — PHASE 10

**Project:** AquaMind Website  
**Phase:** DATABASE REAL-WORLD COVERAGE AUDIT — PHASE 10  
**Status:** PLANNED  
**Purpose:** Audit database coverage from the perspective of real aquarium-user discovery, not entity count.

---

## 1. Why Phase 10 Exists

AquaMind has a strong database foundation with 400+ entities, but recent real-user checking revealed that entity count does not equal real-world coverage. Examples include missing or sparse representation of Tang/Surgeonfish, Arowana varieties, multiple Bichir types, Piranha, Arapaima, and other advanced, premium, regional, or commonly searched aquarium groups.

Phase 10 is therefore **an audit phase, not an expansion phase**.

The objective is to determine:

1. What aquarium users actually search for.
2. Which major hobby groups are represented.
3. Which important groups/species are missing.
4. Which gaps require a new entity.
5. Which gaps should instead use aliases/common/trade/regional names.
6. Which records must remain unresolved because taxonomy/data cannot be verified.
7. Which gaps exist across Species, Plants, Corals, Invertebrates, Equipment, and Problems.

## 2. Core Principle

> **Coverage must be measured by user discovery needs, not by entity count.**

Do not use `400 entities = comprehensive` or `500 entities = better`.

Use:

```text
User query
  ↓
Aquarium group
  ↓
Expected species/type
  ↓
AquaMind representation
  ↓
Can the user discover it?
  ↓
Is the information accurate?
```

## 3. Non-Negotiable Rules

- Accuracy over quantity.
- Never guess taxonomy or scientific identity.
- Common/trade names are not automatically species.
- `null / unknown` is preferable to fabricated precision.
- Images are OUT OF SCOPE; the user manages database images.
- Content production is OUT OF SCOPE.
- Do not introduce schema changes without evidence.
- Do not modify Sanity data during the audit unless a critical defect prevents the audit itself from working.

---

# SPEC-01 — Establish Current Baseline

Record before any modification:

- total entity count
- count by domain
- published/draft records
- duplicate candidates
- incomplete identity records
- controlled vocabularies
- current search behavior
- filters
- Finder domains
- existing alias/common-name capabilities

Create:

`DATABASE_REAL_WORLD_COVERAGE_BASELINE.json`

**PASS:** reproducible baseline exists.

# SPEC-02 — Build Real-World Coverage Matrix

Create:

`DATABASE_REAL_WORLD_COVERAGE_MATRIX.md`

Use:

| Domain | Group | User Importance | Current Coverage | Representation | Action |
|---|---|---|---|---|---|
| Species | Tang | High | Partial | Species/alias | Audit |
| Species | Arowana | High | Partial | Species/variant | Audit |
| Species | Bichir | High | Partial | Species | Audit |
| Species | Piranha | High | Missing | Species | Audit |
| Species | Arapaima | High | Missing/Partial | Species | Audit |

Coverage states: `Covered`, `Partial`, `Missing`, `Not applicable`, `Unresolved`.

# SPEC-03 — Freshwater Community Audit

Audit major groups such as:

- Guppy, Molly, Platy, Swordtail
- Betta
- Tetra, Rasbora, Danio
- Corydoras, Pleco
- Angelfish, Discus
- Gourami, Rainbowfish
- Apistogramma and major cichlid groups
- African Rift Lake cichlids
- Central/South American cichlids
- Goldfish and major fancy Goldfish groups
- Koi and aquarium/pond use

Do not automatically create every commercial variety as a separate species.

**PASS:** every major hobby group has an explicit coverage decision.

# SPEC-04 — Freshwater Predator Audit

Priority groups:

```text
Arowana
Bichir / Polypterus
Snakehead / Channa
Piranha / Serrasalmus
Peacock Bass / Cichla
Arapaima
Pike Cichlid / Crenicichla
Large Predatory Cichlids
Predatory Catfish
Freshwater Eels
Knifefish
Gar
Other major aquarium predators
```

Explicitly investigate user terms such as:

- Huyết Long
- Kim Long
- Ngân Long
- Thanh Long
- Cửu Sừng
- Hải Tượng Long
- Piranha
- Snakehead

For each term classify it as species, subspecies, morph/variant, trade name, regional/common name, group, or unresolved.

**PASS:** every priority predator group has a documented coverage decision.

# SPEC-05 — Marine Fish Audit

Audit at minimum:

```text
Tang / Surgeonfish
Clownfish
Damselfish
Chromis
Gobies
Blennies
Wrasses
Cardinalfish
Basslets
Dottybacks
Dwarf Angelfish
Large Angelfish
Butterflyfish
Foxface / Rabbitfish
Hawkfish
Triggerfish
Lionfish
Eels / Morays
Frogfish
Groupers
Marine Predators
Anthias
Filefish
Pufferfish
Boxfish
Mandarinfish
Jawfish
Firefish
Other major reef fish groups
```

For Tang/Surgeonfish specifically, determine whether the database has meaningful species diversity rather than only a few examples.

Verify Vietnamese trade/common terms before mapping them.

**PASS:** marine coverage is classified by major group and missing high-value groups are identified.

# SPEC-06 — Marine Premium / Advanced Audit

Audit specialty species advanced aquarists may search for, including premium Tangs, specialty Wrasses, large Angelfish, Butterflyfish, advanced Gobies, specialty Eels, Triggerfish, and marine predators.

Do not define premium by price alone; consider hobby prevalence, search relevance, specialist interest, aquarium suitability, availability, and regional relevance.

# SPEC-07 — Plant Coverage Audit

Audit by real planted-aquarium use:

```text
Stem
Rosette
Carpet
Moss
Epiphyte
Floating
Bulb/Rhizome
Foreground
Midground
Background
Red plants
Low-tech
High-tech/CO2
Beginner
Advanced
```

Check major aquascaping staples and important genera.

# SPEC-08 — Coral Coverage Audit

Audit Soft, LPS, SPS and NPS.

Soft examples: Zoanthids, Mushrooms, Leather, Xenia, Gorgonians, Clove polyps.

LPS examples: Euphyllia, Acan/Micromussa, Chalice, Favia/Favites, Scolymia, Lobophyllia, Trachyphyllia, Caulastrea, Blastomussa, Goniopora/Alveopora.

SPS examples: Acropora, Montipora, Pocillopora, Stylophora, Seriatopora/Bird's Nest, Pavona.

NPS examples: Sun Coral, Dendronephthya, and other meaningful NPS groups.

# SPEC-09 — Invertebrate Coverage Audit

Freshwater: Neocaridina, Caridina, Sulawesi shrimp, Amano, Ghost shrimp, Crayfish, Snails, Crabs.

Marine: Cleaner/Peppermint/Sexy shrimp, Hermit crabs, Snails, Urchins, Starfish, Brittle stars, Sea cucumbers, Anemones, other reef invertebrates.

# SPEC-10 — Equipment Coverage Audit

Audit actual user categories:

```text
Filters: HOB, Canister, Sponge, Internal, Sump
Lighting: Planted, Reef, Specialty
Temperature: Heater, Chiller, Controller
Flow: Wavemaker, Return pump, Circulation
CO2: Cylinder, Regulator, Solenoid, Diffuser, Reactor, Drop checker
Marine: Protein skimmer, ATO, Dosing, Media reactor, UV
Maintenance: Gravel vacuum, Algae scraper, Test equipment, Water-change tools
Substrate: Aquasoil, Sand, Gravel, Specialty
```

Also identify vocabulary gaps such as Skimmer, ATO, Dosing, Chiller when these exist as data but not in the controlled vocabulary.

# SPEC-11 — Problems Coverage Audit

Audit freshwater and marine problems across:

- Water quality
- Disease
- Parasites
- Bacterial/fungal
- Algae
- Pests
- Behavior
- Equipment failure
- Environmental stress
- Plant problems
- Coral problems
- Marine-specific problems

Distinguish disease, symptom, environmental problem, husbandry problem, and equipment problem.

# SPEC-12 — Common / Scientific / Regional / Trade Name Audit

For every high-priority user-facing term determine:

```text
User term
→ canonical entity
→ scientific identity
→ entity type
→ alias type
→ confidence
```

Example structure:

```text
Huyết Long
→ canonical Arowana taxon
→ scientific identity
→ common/trade/local term
→ verified/unresolved
```

Do not create fake species entities from ambiguous trade names.

# SPEC-13 — Duplicate vs Variant Audit

Classify every proposed candidate:

- Exact duplicate → do not add.
- Same species, different morph/variant → consider alias/variant representation.
- Different species → candidate new entity.
- Trade name spanning multiple species → do not create a species entity from it.
- Unresolved → research required.

# SPEC-14 — Real User Search Simulation

Create a reproducible query set including examples such as:

```text
blue tang
yellow tang
kole tang
powder blue tang
nẻ nhật
nẻ điện
nẻ bút
nẻ sọc
huyết long
ngân long
kim long
cửu sừng
hải tượng long
piranha
peacock bass
snakehead
arowana
red plant
java moss
monte carlo
acropora
acan
chalice
protein skimmer
reef light
CO2 regulator
ATO
```

Do not assume the Vietnamese terms are scientifically correct; verify intended mapping.

Record:

- query
- expected result
- actual result
- match quality
- canonical entity
- action

# SPEC-15 — Coverage Scoring

Do not use one simplistic percentage.

Score each group on:

- Discovery relevance
- Taxonomic completeness
- Common-name coverage
- Advanced-user coverage
- Data quality
- Search discoverability

Use 0–4 only as an internal audit scale:

`0 Missing | 1 Minimal | 2 Partial | 3 Strong | 4 Comprehensive for current scope`

The score must not justify adding low-quality records.

# SPEC-16 — Priority Classification

- **P0:** critical discovery gap
- **P1:** high-value hobby gap
- **P2:** specialist gap
- **P3:** long-tail gap
- **HOLD:** do not add until taxonomy/data can be verified

# SPEC-17 — Expansion Manifest

Only after the audit, create:

`DATABASE_REAL_WORLD_EXPANSION_MANIFEST.md`

Required columns:

| Domain | Candidate | Reason | Representation | Priority | Verification | Action |
|---|---|---|---|---|---|---|

This manifest becomes the ONLY approved source for the next expansion phase.

Do not modify Sanity before this manifest exists.

# SPEC-18 — Schema Gap Assessment

Create:

`DATABASE_TAXONOMY_SCHEMA_GAP_REPORT.md`

Evaluate whether findings require:

- aliases
- common names
- trade names
- regional names
- morph/variant relationships
- taxonomic parent
- genus/family grouping
- search synonyms

Classify each as existing field sufficient, derivable, search-only, schema change required, or unnecessary.

# SPEC-19 — Relationship Impact Audit

For every approved candidate determine whether it needs:

- compatibleSpecies
- compatiblePlants
- compatibleInvertebrates
- suitableEquipment
- relatedProblems
- relatedPosts
- relatedTools
- aquariumStyle
- region
- waterType
- reefCompatibility

Do not guess relationships. Mark expert curation requirements explicitly.

# SPEC-20 — Finder Impact Audit

Check whether newly identified groups are discoverable through:

- water type
- tank size
- difficulty
- aquarium style
- predator
- reef compatibility
- lighting
- CO2
- region
- equipment

Do not change Finder ranking unless an actual defect is found.

# SPEC-21 — Search Architecture Impact Audit

Do not implement Global Search yet.

Determine whether each missing query is caused by:

- missing data
- missing aliases
- search ranking
- filters
- taxonomy structure

Create:

`DATABASE_SEARCH_DISCOVERY_GAP_REPORT.md`

This feeds the future Global Search phase.

# SPEC-22 — Data Quality Gate

Before any expansion recommendation verify:

- scientific identity
- common name
- water type
- taxonomy
- numeric parameters where applicable
- slug uniqueness
- duplicate status
- relationship safety
- no fabricated values

No candidate enters the expansion manifest unless evidence is sufficient or it is explicitly marked HOLD.

# SPEC-23 — Final Audit Checkpoint

Create:

`DATABASE_REAL_WORLD_COVERAGE_AUDIT_PHASE_10_CHECKPOINT.md`

Required sections:

1. Executive Summary
2. Baseline
3. Coverage Matrix
4. Freshwater Findings
5. Predator Findings
6. Marine Findings
7. Plant Findings
8. Coral Findings
9. Invertebrate Findings
10. Equipment Findings
11. Problem Findings
12. Common/Trade Name Findings
13. Duplicate/Variant Findings
14. Search Simulation
15. Priority Gaps
16. Schema Gap Assessment
17. Expansion Manifest
18. Data Quality
19. Relationship Impact
20. Finder Impact
21. Search Impact
22. Verification
23. Deferred Items
24. Next Phase Recommendation

# SPEC-24 — No Premature Expansion

This phase must NOT:

- bulk-create entities
- modify Sanity records
- delete existing entities
- rewrite relationships
- redesign the database
- implement Global Search
- create articles
- add images
- create content briefs

If a defect prevents the audit from running, document it, classify it, stop, fix the minimum required, then rerun affected specs.

# SPEC-25 — Regression Verification

Run:

```text
TypeScript
ESLint
Tests
Database audit scripts
Search tests
Finder tests
Relationship integrity tests
```

Expected:

- no new TypeScript errors
- no new lint errors
- no new test failures
- no broken relationships
- no unintended database mutations
- Database V1 behavior preserved

The known pre-existing compare test failure must remain separately identified.

---

# Definition of Done

```text
[ ] Baseline captured
[ ] Coverage matrix completed
[ ] Freshwater community audited
[ ] Freshwater predators audited
[ ] Marine fish audited
[ ] Marine premium/specialty audited
[ ] Plants audited
[ ] Corals audited
[ ] Invertebrates audited
[ ] Equipment audited
[ ] Problems audited
[ ] Common names audited
[ ] Scientific names audited
[ ] Regional/trade names audited
[ ] Duplicate vs variant decisions documented
[ ] Real-world search simulation completed
[ ] Priority gaps classified
[ ] Expansion manifest created
[ ] Schema gap report created
[ ] Search gap report created
[ ] Finder impact reviewed
[ ] Relationship impact reviewed
[ ] Data quality gate passed
[ ] No unsafe entities proposed
[ ] No premature Sanity expansion performed
[ ] Tests/lint/type checks verified
[ ] Checkpoint created
[ ] AQUA_BLOG_CURRENT_STATE.md updated
```

# Phase Gate

Only two valid outcomes:

## PASS — Audit Complete

A verified real-world coverage map and approved expansion manifest exist.

Next:

`PHASE 11 — DATABASE REAL-WORLD COVERAGE EXPANSION`

## PASS — Coverage Already Sufficient

Do not add entities simply to increase count. Proceed to taxonomy/search discovery only where justified.

---

# Strategic Direction

The goal is NOT:

> Make AquaMind's database as large as possible.

The goal is:

> **Make AquaMind a database that aquarium hobbyists can actually use to find the animals, plants, corals, equipment, and problems they care about — with accurate taxonomy and trustworthy data.**

Correct sequence:

```text
Real-world demand
    ↓
Coverage audit
    ↓
Taxonomy decision
    ↓
Verified data
    ↓
Expansion only where justified
    ↓
Search/discovery
    ↓
User feedback + Search Console
    ↓
Future refinement
```

**Audit first. Expand second. Search optimization third.**
