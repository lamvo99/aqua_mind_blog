# DATABASE SEMANTIC DISCOVERY PHASE 2

## Scope

This phase belongs to **AquaMind Website / Database**, not Content Production.

Do NOT write blog articles. Do NOT modify the existing content workflow.

Focus only on:
1. Database semantic taxonomy
2. Aquarium-style coverage
3. Regional/distribution classification
4. Freshwater predator coverage
5. Marine-fish coverage
6. Coral-group coverage
7. Data quality
8. Search/filter discovery UX

---

## Objective

Transform the AquaMind Database from a searchable/filterable collection into a semantically classified aquarium knowledge database.

The database should support accurate discovery such as:
- Freshwater fish
- Marine fish
- Amazon / South American fish
- Predator fish
- Beginner fish
- Nano fish
- SPS / LPS / Soft / NPS coral
- Easy coral
- Floating plants
- No-CO2 plants
- Shrimp / Caridina / Neocaridina

The goal is **not** to maximize entity count.

---

## Required source material

Read before implementation:

1. `DATABASE_COVERAGE_AND_DISCOVERY_PHASE_1_CHECKPOINT.md`
2. `DATABASE_EXPANSION_PHASE_4_CHECKPOINT.md`
3. `DATABASE_EXPANSION_PHASE_3_CHECKPOINT.md`
4. `DATABASE_FOUNDATION_CHECKPOINT.md`
5. `DATABASE_EXPANSION_ROADMAP.md`
6. `aquarium_content_plan.xlsx`
7. Current Sanity schemas
8. Current database queries
9. Current DatabaseGrid/filter components
10. Current detail pages
11. Current navigation/routing
12. `AQUA_BLOG_CURRENT_STATE.md`

Use actual current source/CMS as authoritative. Do not blindly trust historical counts.

---

## Execution rule

Execute strictly:

`SPEC 1 → PASS → SPEC 2 → PASS → ...`

If any SPEC fails: **STOP**.

Do not silently bypass a failed prerequisite.

---

## Core principles

### Accuracy > coverage > quantity

Never invent taxonomy, habitat, distribution, aquarium suitability, difficulty, compatibility, tank size, or environmental requirements.

### Natural habitat ≠ aquarium style

Keep biological distribution, natural habitat, and aquarium-use classification conceptually separate.

### Species ≠ morph

Do not turn Taiwan Bee, Blue Bolt, King Kong, color morphs, or trade grades into biological species.

### Trade name ≠ scientific species

Do not assign a scientific name merely because a trade name exists.

### No forced fields

If an attribute is unknown, leave it empty where possible or document it. Do not guess.

---

# SPEC 1 — CURRENT DATABASE RECOUNT

Verify the current CMS/database.

Report:
- total entities;
- counts by type;
- freshwater/marine/brackish/other species;
- predator candidates;
- large-fish candidates;
- shrimp/invertebrate groups;
- coral Soft/LPS/SPS/NPS/unknown;
- plant growth forms including floating;
- equipment categories;
- problems;
- duplicates/drafts.

### PASS
Current inventory is verified and documented.

**STOP if FAIL.**

---

# SPEC 2 — SEMANTIC TAXONOMY GAP AUDIT

Audit whether the existing schema supports:

### Species
- water type
- region
- natural habitat
- aquarium style
- difficulty
- diet
- temperament
- adult size
- tank-size range
- predator/community role
- reef compatibility where applicable

### Plants
- region
- aquarium style
- growth form
- placement
- floating
- CO2
- light
- difficulty
- growth rate

### Corals
- coral type
- aquarium style
- difficulty
- lighting
- flow
- placement
- photosynthetic/NPS
- reef compatibility
- aggression

### Invertebrates
- water type
- group
- region where applicable
- aquarium style
- difficulty
- reef compatibility
- tank size

### Equipment
- category
- aquarium style/use case
- tank range
- flow
- power
- purpose

### Problems
- category
- affected livestock
- water type
- symptoms if supported

First document existing, derivable, missing, and inappropriate fields.

Do NOT change schema yet.

### PASS
Clear taxonomy gap report exists.

**STOP if FAIL.**

---

# SPEC 3 — TAXONOMY DESIGN CONTRACT

Design the minimum controlled semantic model.

Avoid uncontrolled tag proliferation.

## Aquarium Style

Possible controlled values, only where applicable:

Freshwater:
- Community
- Planted
- Low-Tech
- High-Tech / CO2
- Aquascaping
- Blackwater
- Biotope
- Amazon / South American
- Southeast Asian
- African Cichlid
- Shrimp
- Betta / Nano
- Predator
- Large Fish
- Native / Regional

Marine:
- Fish Only
- FOWLR
- Nano Reef
- Mixed Reef
- Soft Coral Reef
- LPS Reef
- SPS Reef
- NPS
- Anemone / Clownfish
- Marine Predator
- Invertebrate-focused

Other:
- Pond / Outdoor where supported.

Entities may have multiple applicable styles.

## Region

Use controlled geographic levels where practical:
- South America
- Amazon Basin
- Central America
- North America
- Southeast Asia
- South Asia
- East Asia
- Africa
- Australia / Oceania
- Europe
- Marine Indo-Pacific
- Red Sea
- Caribbean / Western Atlantic
- other justified regions

Do not treat a broad region as an exact natural range.

### PASS
Taxonomy contract is documented before implementation.

**STOP if FAIL.**

---

# SPEC 4 — SCHEMA IMPLEMENTATION DECISION

Determine the smallest safe implementation.

Consider:
- controlled arrays;
- existing enums;
- derived classifications;
- references only if genuinely justified.

Do NOT create a new taxonomy system if existing fields can safely support the requirement.

For every proposed field document:

| Field | Entity | Type | Controlled values | Required? | Reason |
|---|---|---|---|---|---|

Maintain backward compatibility.

### PASS
Schema design is technically justified.

**STOP if FAIL.**

---

# SPEC 5 — DATA MIGRATION PLAN

Before modifying existing records, classify:

1. Confidently classifiable automatically.
2. Rule-based/manual review required.
3. Cannot be classified reliably.

Examples:
- Coral type may already exist.
- Water type may already exist.
- Region may require factual verification.
- Aquarium style may require domain judgment.

Define explicit rules.

Do not assign:
- Amazon merely from a common name.
- Predator merely because a fish is carnivorous.
- Reef-safe without evidence.

### PASS
Migration rules are documented and safe/reversible.

**STOP if FAIL.**

---

# SPEC 6 — FRESHWATER PREDATOR COVERAGE

Audit at minimum:
- Channa / Snakeheads
- Polypterus / Bichirs
- Arowana / Osteoglossidae
- Cichla / Peacock Bass
- Serrasalmus / Piranha
- Crenicichla / Pike Cichlids
- large predatory catfish
- large predatory cichlids
- other important aquarium predator groups

For each:
- entities present;
- gaps;
- representative coverage;
- tank implications;
- data quality;
- priority.

If new entities are genuinely needed, select only high-value, well-documented representatives.

Do not attempt exhaustive species coverage.

### PASS
Predator coverage is measured and priority gaps identified.

**STOP if FAIL.**

---

# SPEC 7 — MARINE FISH COVERAGE

Audit:
- Clownfish
- Gobies
- Blennies
- Tangs/Surgeonfish
- Wrasses
- Damselfish
- Chromis
- Cardinalfish
- Basslets/Dottybacks
- Angelfish
- Butterflyfish
- Hawkfish
- Lionfish/Scorpionfish
- Triggerfish
- Puffers
- Rabbitfish/Foxface
- marine predators
- other important aquarium groups

Classify coverage by:
- beginner;
- nano;
- reef-compatible;
- advanced;
- large;
- predator.

### PASS
Marine coverage matrix exists.

**STOP if FAIL.**

---

# SPEC 8 — CORAL COVERAGE

Audit by major coral group.

## Soft
- Zoanthids
- Palythoa
- Mushroom
- Ricordea
- Leather
- Xenia
- Green Star Polyps
- Clove Polyps

## LPS
- Euphyllia group
- Duncan
- Caulastrea
- Micromussa/Acan
- Lobophyllia
- Trachyphyllia
- Goniopora/Alveopora
- Favia/Favites-type groups where appropriate
- Scolymia/Cynarina-type groups where appropriate

## SPS
- Acropora
- Montipora
- Pocillopora
- Stylophora
- Seriatopora/Bird's Nest
- Pavona

## NPS
- Tubastraea / Sun Coral
- Dendronephthya
- other appropriate non-photosynthetic groups

For each group report:
- current entities;
- missing major representatives;
- difficulty spread;
- lighting;
- flow;
- feeding;
- photosynthetic/NPS classification.

Do not treat trade morphs as separate biological species.

### PASS
Coral coverage matrix identifies meaningful gaps.

**STOP if FAIL.**

---

# SPEC 9 — PLANT COVERAGE

Audit:
- foreground;
- midground;
- background;
- stem;
- rosette;
- epiphyte;
- moss;
- floating;
- low-tech;
- high-light/CO2;
- red plants;
- blackwater/biotope plants.

Determine support for:
- easy no-CO2 setups;
- high-tech aquascaping;
- floating plants;
- biotope use.

### PASS
Plant coverage matrix exists.

**STOP if FAIL.**

---

# SPEC 10 — INVERTEBRATE COVERAGE

Audit freshwater:
- Neocaridina
- Caridina
- Amano
- Sulawesi shrimp
- freshwater snails
- freshwater crabs/crayfish where relevant

Audit marine:
- cleaner shrimp
- peppermint shrimp
- fire shrimp
- pistol shrimp
- hermit crabs
- emerald crab
- porcelain crab
- anemones
- urchins
- starfish
- clams
- other major reef invertebrates

### PASS
Invertebrate coverage matrix exists.

**STOP if FAIL.**

---

# SPEC 11 — IMPLEMENT SEMANTIC DATA

Only after SPEC 1–10 PASS.

Implement approved taxonomy.

For existing entities:
- migrate only where evidence supports it;
- preserve existing fields;
- do not overwrite factual data;
- log ambiguous records.

For new entities:
- only create for genuine coverage gaps;
- verify identity/data;
- record sources;
- no images;
- no speculative relationships.

No fixed entity quota.

### PASS
Semantic data is stored consistently.

**STOP if FAIL.**

---

# SPEC 12 — ADVANCED DATABASE FILTERS

Implement only sufficiently populated fields.

## Species
Target journeys:
- Marine
- Freshwater
- Amazon / South American
- Predator
- Beginner
- Nano
- Large Fish
- Reef-compatible where applicable
- Difficulty
- Region
- Tank size where supported

## Corals
- Soft
- LPS
- SPS
- NPS
- Difficulty
- Light
- Flow
- Placement
- Photosynthetic/NPS where supported

## Plants
- Floating
- Foreground
- Midground
- Background
- No CO2 / CO2
- Light
- Difficulty

## Invertebrates
- Freshwater
- Marine
- Shrimp
- Snail
- Crab
- Anemone
- Reef-compatible where supported
- Difficulty

Do not expose poorly populated filters.

### PASS
Representative filter queries return correct records.

**STOP if FAIL.**

---

# SPEC 13 — RANGE FILTERS

Where numeric data is sufficiently complete, evaluate:
- Species minimum tank size;
- Species adult size;
- Equipment tank size;
- Equipment flow;
- Equipment power where useful.

Do not convert free-text into fake numeric precision.

### PASS
Range filters are accurate or explicitly deferred.

**STOP if FAIL.**

---

# SPEC 14 — DATABASE UX

Verify desktop/mobile on:
- `/species`
- `/plants`
- `/corals`
- `/equipment`
- `/invertebrates`
- `/problems` where applicable

Each major hub should provide:
- search;
- relevant filters;
- active-filter state;
- result count;
- reset;
- empty state;
- responsive controls;
- URL state;
- no dead filters.

Do not create an overwhelming filter panel.

### PASS
UX is verified.

**STOP if FAIL.**

---

# SPEC 15 — DATA INTEGRITY

Check:
- duplicate names;
- duplicate scientific names;
- duplicate slugs;
- invalid taxonomy;
- invalid semantic classifications;
- morph/species mistakes;
- coral trade-name mistakes;
- broken references;
- migration errors.

Do not delete automatically. Document corrections/deletions.

### PASS
No unresolved critical integrity issue.

**STOP if FAIL.**

---

# SPEC 16 — TECHNICAL VERIFICATION

Run:
- lint;
- tests;
- TypeScript;
- production build when schema/query/code changes require it;
- representative route verification.

Verify representative searches/filters and all major database hubs.

Check:
- hydration issues;
- broken routes;
- stale query state;
- duplicate results;
- missing records;
- data loss.

### PASS
Technical verification complete.

---

# SPEC 17 — FINAL COVERAGE & QUALITY AUDIT

Compare before/after:

### Inventory
Total and counts by type.

### Aquarium styles
- Well Covered
- Partially Covered
- Weak
- Not Covered

### Freshwater predator
Before → After.

### Marine fish
Before → After.

### Corals
Soft/LPS/SPS/NPS before → after.

### Plants
Before → After.

### Invertebrates
Before → After.

### Semantic fields
Coverage for:
- aquariumStyle;
- region;
- other implemented filter dimensions.

### Data depth
Compare against previous baseline. Do not hide decreases.

### PASS
Final coverage and quality are measurable.

---

# REQUIRED CHECKPOINT

Create:

`DATABASE_SEMANTIC_DISCOVERY_PHASE_2_CHECKPOINT.md`

Include:

1. Executive Summary
2. Baseline
3. Schema Changes
4. Taxonomy Contract
5. Migration Rules
6. Aquarium Style Coverage Matrix
7. Freshwater Predator Audit
8. Marine Fish Audit
9. Coral Audit
10. Plant Audit
11. Invertebrate Audit
12. New Entities
13. Data Quality
14. Filter Implementation
15. Range Filters
16. UX Verification
17. Data Integrity
18. Technical Verification
19. Remaining Gaps
20. Recommendation

Explicitly state:

`Images: OUT OF SCOPE`

`Relationships: DEFERRED`

`Content Production: OUT OF SCOPE`

`Search Console: NOT AVAILABLE`

---

# FINAL RESPONSE FORMAT

Return:

```text
DATABASE SEMANTIC DISCOVERY PHASE 2

Status:
[PASS / PASS WITH BACKLOG / BLOCKED / FAIL]

Baseline:
[...]

Final:
[...]

Schema:
[...]

Aquarium style coverage:
[...]

Freshwater predator:
[...]

Marine:
[...]

Corals:
[...]

Plants:
[...]

Invertebrates:
[...]

Semantic fields:
[...]

Search:
[...]

Filters:
[...]

Range filters:
[...]

New entities:
[...]

Data quality:
[...]

Integrity:
[...]

Tests:
[...]

Lint:
[...]

TypeScript:
[...]

Build:
[...]

Checkpoint:
DATABASE_SEMANTIC_DISCOVERY_PHASE_2_CHECKPOINT.md

Images:
OUT OF SCOPE

Relationships:
DEFERRED

Content Production:
OUT OF SCOPE

Search Console:
NOT AVAILABLE

Next:
[exact evidence-based next action]
```

# CORE PRINCIPLE

> AquaMind Database should answer “what fits my aquarium?” rather than merely “what exists in the database?”

A user should be able to move from:

**Aquarium type → livestock group → region/style → difficulty → practical constraints → useful entities**

without needing to know the scientific name first.

Accuracy remains the highest priority.
