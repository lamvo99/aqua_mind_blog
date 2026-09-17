# AQUAMIND DATABASE COVERAGE & DISCOVERY PHASE 1

## Objective

Upgrade AquaMind Database from a quantity-oriented knowledge base into a **complete, discoverable aquarium knowledge system**.

This phase addresses two urgent gaps:

1. **Coverage gap** — the current database must represent the major aquarium styles and livestock categories users actually keep.
2. **Discovery gap** — database listing pages must allow users to search, filter, and browse by meaningful aquarium attributes.

This is NOT another blind entity-count expansion.

The database must be evaluated by **aquarium use case / style coverage**, not only by total entity count.

---

# CURRENT BASELINE

Use the current CMS as the authoritative source.

Phase 4 reported:

- 342 entities
- Species: 123
- Plants: 55
- Corals: 39
- Equipment: 37
- Invertebrates: 43
- Problems: 35
- Inspiration: 10

Reported coverage:
- Freshwater species: 108
- Saltwater species: 22
- Floating plants: 6
- Shrimp: 21
- Corals: 39
- Problems: 35

Phase 4 also concluded that another generic expansion phase was not recommended.

This phase overrides that conclusion only because a **new structural requirement has been identified**:

> The database must be complete enough to support the major aquarium styles and usable enough for users to discover the right records.

Do not assume the Phase 4 counts are still exact. Recount first.

---

# REQUIRED SOURCE MATERIAL

Read before implementation:

1. `DATABASE_EXPANSION_PHASE_4_CHECKPOINT.md`
2. `DATABASE_EXPANSION_ROADMAP.md`
3. `DATABASE_FOUNDATION_CHECKPOINT.md`
4. `aquarium_content_plan.xlsx`
5. Current Sanity schemas
6. Current database queries
7. Current DatabaseGrid / listing components
8. Current entity detail pages
9. Current navigation and routing
10. `AQUA_BLOG_CURRENT_STATE.md`

---

# CORE PRINCIPLES

## 1. Coverage > raw count

Do not add entities simply to increase the database number.

The question is:

> Can AquaMind support the major ways aquarium hobbyists actually keep aquatic life?

## 2. Biological accuracy

Never create:
- false species;
- wrong scientific names;
- morphs as species;
- trade names as species;
- invented husbandry values;
- invented equipment specifications.

## 3. Style completeness

Evaluate the Database against actual aquarium styles:

- Community freshwater
- Planted aquarium
- Low-tech planted aquarium
- High-tech / CO₂ aquascaping
- Biotope aquarium
- Amazonian / South American
- African Rift Lake cichlid
- Betta / nano
- Shrimp / Caridina
- Shrimp / Neocaridina
- Goldfish
- Predator freshwater
- Large freshwater fish
- Native Vietnamese freshwater
- Blackwater
- Brackish
- FOWLR
- Reef
- Soft-coral reef
- LPS reef
- SPS reef
- NPS / low-light coral systems
- Fish-only marine
- Marine predator
- Nano reef
- Mixed reef
- Anemone / clownfish systems
- Marine invertebrate-focused systems
- Pond / outdoor aquatic systems where represented by the current product scope

The audit must determine which styles are:
- WELL COVERED
- PARTIALLY COVERED
- WEAK
- NOT COVERED

Do not force every style into a separate taxonomy if the current schema does not support it.

---

# SPEC 1 — CURRENT DATABASE RECOUNT

Recount the actual CMS.

Produce:

- total entities;
- count by type;
- freshwater species;
- marine species;
- brackish species if any;
- predator species;
- shrimp;
- snails;
- crabs;
- other invertebrates;
- floating plants;
- coral type;
- equipment categories;
- problems.

Identify duplicates and drafts.

### PASS

A verified current baseline exists.

STOP if FAIL.

---

# SPEC 2 — AQUARIUM STYLE COVERAGE MATRIX

Create a matrix:

| Aquarium Style | Required Entity Groups | Current Coverage | Status | Gaps |
|---|---|---|---|---|

Minimum styles:

### Freshwater
- Community
- Planted
- Low-tech
- High-tech / CO₂
- Biotope
- Amazonian
- Blackwater
- African cichlid
- Betta / nano
- Shrimp
- Predator
- Large fish
- Native Vietnamese

### Marine
- Fish-only
- FOWLR
- Mixed reef
- Soft coral reef
- LPS reef
- SPS reef
- NPS
- Nano reef
- Anemone/clownfish
- Marine predator

### Other
- Pond / outdoor where supported

### PASS

Every style has an evidence-based status.

STOP if FAIL.

---

# SPEC 3 — FRESHWATER PREDATOR AUDIT

Explicitly audit predator and large-predator freshwater coverage.

At minimum evaluate categories such as:

- Snakehead / Channa
- Bichir / Polypterus
- Arowana / Osteoglossidae
- Peacock bass / Cichla
- Piranha / Serrasalmus or relevant genera
- Large predatory catfish
- Pike cichlids / Crenicichla
- large predatory cichlids
- other major aquarium predator groups

Do not assume the Vietnamese common name maps to one species.

For each candidate determine:
- taxonomic identity;
- aquarium relevance;
- freshwater/brackish status where relevant;
- adult size;
- minimum tank requirements;
- diet;
- aggression/predation;
- suitable aquarium style.

Do not create all possible species. Select representative, high-value species/groups.

### PASS

Predator coverage is explicitly measured and priority gaps are identified.

STOP if FAIL.

---

# SPEC 4 — MARINE FISH COVERAGE AUDIT

Audit major marine aquarium families and use cases:

- Clownfish
- Tangs / Surgeonfish
- Gobies
- Blennies
- Wrasses
- Damselfish
- Chromis
- Cardinalfish
- Basslets / dottybacks
- Angelfish
- Butterflyfish
- Hawkfish
- Lionfish / scorpionfish
- Triggerfish
- Puffers
- Rabbitfish / foxface
- Marine predators
- Other major reef-compatible groups

Measure:
- common beginner species;
- reef-safe options;
- nano-appropriate species;
- larger fish;
- difficult/advanced species.

### PASS

Marine database coverage is quantified by family/use case and priority gaps identified.

STOP if FAIL.

---

# SPEC 5 — CORAL COVERAGE AUDIT

The coral database must be evaluated by reef husbandry group, not only total count.

Required groups:

## Soft Coral
Examples/categories:
- Zoanthids
- Palythoa
- Mushroom corals
- Ricordea
- Leather corals
- Xenia
- GSP
- Clove polyps
- other major soft-coral groups

## LPS
Examples/categories:
- Euphyllia group
- Duncan
- Caulastrea
- Acan / Micromussa
- Favia/Favites-type brain corals where appropriate
- Lobophyllia
- Trachyphyllia
- Scolymia/Cynarina-type groups where appropriate
- Goniopora/Alveopora
- other major LPS

## SPS
Examples/categories:
- Acropora
- Montipora
- Pocillopora
- Stylophora
- Seriatopora
- Bird's Nest
- Pavona
- other significant SPS groups

## NPS
Evaluate representative:
- Tubastraea / Sun Coral
- Dendronephthya
- other appropriate non-photosynthetic groups

Do not treat every trade morph as a separate coral species.

### PASS

Coverage is classified:
- beginner soft coral;
- beginner LPS;
- advanced LPS;
- SPS;
- NPS;
- unusual/specialized corals.

Priority gaps are documented.

STOP if FAIL.

---

# SPEC 6 — PLANT / AQUASCAPING COVERAGE AUDIT

Audit by aquarium role:

- carpeting;
- foreground;
- midground;
- background;
- stem plants;
- rosette plants;
- epiphytes;
- mosses;
- floating plants;
- low-tech plants;
- high-light/CO₂ plants;
- red plants;
- blackwater/biotope plants.

Also audit:
- beginner plants;
- difficult plants;
- low-light plants;
- CO₂-dependent plants.

### PASS

Plant coverage is evaluated by actual aquascaping use case.

STOP if FAIL.

---

# SPEC 7 — SHRIMP / INVERTEBRATE COVERAGE AUDIT

Evaluate:

### Freshwater shrimp
- Neocaridina;
- Caridina;
- Taiwan Bee;
- wild-type Caridina;
- Amano;
- Sulawesi where relevant.

### Marine shrimp
- Cleaner;
- Peppermint;
- Fire;
- pistol;
- other major reef shrimp.

### Snails
- freshwater algae-control;
- planted-tank cleanup;
- pest-control;
- marine reef cleanup.

### Crabs / other marine invertebrates
- hermits;
- emerald crab;
- porcelain crab;
- starfish;
- urchins;
- clams;
- anemones;
- worms.

### PASS

Coverage is mapped to aquarium use cases and missing high-value groups are documented.

STOP if FAIL.

---

# SPEC 8 — EQUIPMENT COVERAGE AUDIT

Audit equipment by aquarium style:

### Freshwater
- filters;
- lights;
- CO₂;
- regulators;
- diffusers;
- substrate;
- heaters;
- pumps;
- dosing;
- testing.

### Marine
- protein skimmer;
- return pump;
- wavemaker;
- reef light;
- UV;
- media reactor;
- auto water change;
- dosing;
- calcium reactor;
- ATO;
- RODI-related equipment where supported.

### Predator / large fish
- oversized filtration;
- high-flow systems;
- robust mechanical filtration;
- heating/cooling where supported.

### PASS

Equipment categories needed by major styles are identified.

STOP if FAIL.

---

# SPEC 9 — DATA MODEL / FILTER CONTRACT

Before implementing UI filters, inspect the current schema.

Determine which fields can safely power filters.

Potential filter dimensions:

## Species
- water type;
- habitat/region;
- aquarium style;
- difficulty;
- adult size;
- minimum tank size;
- temperature;
- pH;
- GH/KH;
- salinity;
- diet;
- temperament;
- compatibility traits.

## Plants
- growth form;
- placement;
- difficulty;
- light;
- CO₂;
- growth rate;
- temperature;
- pH/GH;
- floating;
- foreground/midground/background.

## Corals
- coral type;
- difficulty;
- light;
- flow;
- placement;
- feeding;
- aggression;
- photosynthetic/NPS;
- reef suitability.

## Equipment
- category;
- purpose;
- tank size;
- flow;
- power;
- equipment type.

## Invertebrates
- water type;
- category;
- difficulty;
- tank size;
- reef compatibility;
- freshwater/marine.

## Problems
- symptom;
- category;
- affected livestock;
- freshwater/marine where supported.

Only expose filters whose data is sufficiently populated.

Do not create a filter that returns misleading results because most records have missing values.

### PASS

A filter contract exists and every proposed filter has a data-coverage assessment.

STOP if FAIL.

---

# SPEC 10 — DATABASE LISTING UX: SEARCH

Implement search on all major database hubs:

- `/species`
- `/plants`
- `/corals`
- `/equipment`
- `/invertebrates`
- `/problems` where appropriate

Search should support:
- common name;
- scientific name;
- slug;
- relevant aliases where available.

Requirements:
- clear search input;
- debounced/client-friendly behavior where appropriate;
- empty state;
- clear/reset;
- URL state where architecture supports it;
- mobile usability.

Do not make search depend on a server-side service unless already justified by the project architecture.

### PASS

Search works consistently across major database hubs.

STOP if FAIL.

---

# SPEC 11 — SPECIES FILTERS

Implement meaningful filters for `/species`.

Minimum expected filters, where data coverage permits:

- Freshwater / Marine / Brackish
- Difficulty
- Aquarium style
- Region / natural distribution
- Minimum tank size
- Adult size
- Diet / feeding type
- Temperament / behavior
- Predator / community suitability

Examples of user journeys that must work:

> Show marine fish.

> Show freshwater fish.

> Show Amazonian species.

> Show beginner fish.

> Show predator fish.

> Show large fish.

> Show fish suitable for a 60L tank.

> Show easy fish.

Do not implement a filter if the underlying data cannot support it reliably.

### PASS

Representative queries return logically correct results.

STOP if FAIL.

---

# SPEC 12 — CORAL FILTERS

Implement meaningful filters for `/corals`.

Minimum where supported:

- Soft / LPS / SPS / NPS
- Difficulty
- Lighting
- Flow
- Placement
- Feeding
- Photosynthetic / non-photosynthetic
- Reef suitability

Required user journeys:

> Show SPS.

> Show LPS.

> Show soft coral.

> Show NPS.

> Show beginner corals.

> Show low-light corals.

> Show high-flow corals.

### PASS

Representative coral queries return correct subsets.

STOP if FAIL.

---

# SPEC 13 — PLANT FILTERS

Implement:

- foreground / midground / background;
- floating;
- low-tech;
- CO₂;
- light level;
- difficulty;
- growth rate;
- temperature range where supported.

Required journeys:

> Easy plants.

> No-CO₂ plants.

> Floating plants.

> Foreground plants.

> Red plants.

> High-light / CO₂ plants.

### PASS

Representative plant filters return correct results.

STOP if FAIL.

---

# SPEC 14 — INVERTEBRATE / EQUIPMENT / PROBLEM FILTERS

Implement only meaningful filters supported by data.

Examples:

### Invertebrates
- freshwater / marine;
- shrimp / snail / crab / anemone / etc.;
- reef compatibility;
- difficulty;
- tank size.

### Equipment
- category;
- tank range;
- flow;
- purpose;
- power.

### Problems
- category;
- symptoms;
- affected livestock;
- freshwater/marine.

### PASS

Filters are useful, accurate, and do not expose mostly-empty dimensions.

STOP if FAIL.

---

# SPEC 15 — FILTER UX QUALITY

The database must remain easy to use on desktop and mobile.

Requirements:

- search and filter are visible;
- active filters are obvious;
- reset-all;
- result count;
- no confusing filter state;
- no dead filters;
- URL/shareable state where appropriate;
- responsive controls;
- empty result state;
- loading state where applicable.

Avoid creating a complicated "enterprise search" UI.

The user should be able to answer:

> "What can I keep in my aquarium?"

in a few interactions.

### PASS

UX review complete on all major database hubs.

STOP if FAIL.

---

# SPEC 16 — DATA GAP IMPLEMENTATION

Only after coverage audit.

Create a prioritized database expansion list.

Priority:

### P0
Major aquarium style has no meaningful coverage.

### P1
Major group is represented but has obvious high-value gaps.

### P2
Specialized hobby niche.

### P3
Rare species / collector interest.

For every new entity:
- verify taxonomy;
- verify data;
- verify aquarium relevance;
- populate applicable fields;
- record sources;
- no images;
- no speculative relationships.

Do not set an arbitrary total-count target.

### PASS

Every new entity has a documented reason connected to a style or user discovery need.

STOP if FAIL.

---

# SPEC 17 — DATA QUALITY AUDIT

Recalculate:

- data depth by entity type;
- filter-field completeness;
- style coverage;
- missing critical fields;
- duplicate rate.

Important distinction:

A field can be:
- applicable and populated;
- applicable but missing;
- not applicable.

Do not penalize records for fields that genuinely do not apply.

### PASS

Data quality metrics are transparent.

STOP if FAIL.

---

# SPEC 18 — TECHNICAL VERIFICATION

Run:

- lint;
- tests;
- TypeScript;
- production build when required;
- representative route tests.

Verify:

- `/species`
- `/plants`
- `/corals`
- `/equipment`
- `/invertebrates`
- `/problems`

Verify search and filter state.

Check:
- no broken URLs;
- no duplicate results;
- no stale filter state;
- no hydration errors;
- no regression in existing detail pages.

### PASS

Technical verification complete.

---

# REQUIRED CHECKPOINT

Create:

`DATABASE_COVERAGE_AND_DISCOVERY_PHASE_1_CHECKPOINT.md`

Include:

## 1. Baseline
Actual counts by entity type.

## 2. Aquarium Style Coverage Matrix
Every style:
- coverage;
- supporting entities;
- gap;
- priority.

## 3. Freshwater Predator Audit
- snakehead;
- bichir;
- arowana;
- piranha;
- peacock bass;
- large catfish;
- predatory cichlids;
- other relevant groups.

## 4. Marine Coverage
By major family/use case.

## 5. Coral Coverage
- Soft;
- LPS;
- SPS;
- NPS.

## 6. Plant Coverage
By aquascaping role and difficulty.

## 7. Invertebrate Coverage

## 8. Equipment Coverage

## 9. Filter Contract
Every filter and data coverage.

## 10. UX Changes
Search/filter capabilities by route.

## 11. New Entities
Only evidence-based additions.

## 12. Data Quality

## 13. Technical Verification

## 14. Remaining Backlog

## 15. Recommendation
Choose:
- continue targeted data expansion;
- continue UX;
- or move back to content production.

Do not recommend expansion merely because the entity count is below a round number.

---

# FINAL RESPONSE FORMAT

Return exactly:

```text
DATABASE COVERAGE & DISCOVERY PHASE 1

Status:
[...]

Baseline:
[...]

Final:
[...]

Aquarium style coverage:
[...]

Freshwater predator coverage:
[...]

Marine coverage:
[...]

Coral coverage:
[...]

Plant coverage:
[...]

Invertebrate coverage:
[...]

Equipment coverage:
[...]

Search:
[...]

Filters:
[...]

New entities:
[...]

Data quality:
[...]

Tests:
[...]

Lint:
[...]

Build:
[...]

Checkpoint:
DATABASE_COVERAGE_AND_DISCOVERY_PHASE_1_CHECKPOINT.md

Images:
OUT OF SCOPE

Relationships:
DEFERRED

Search Console:
NOT AVAILABLE

Next:
[exact evidence-based next action]
```

---

# CORE PRINCIPLE

> AquaMind Database should help a hobbyist discover what fits their aquarium, not merely display a large list of species.

Coverage must represent real aquarium styles.

Search and filters must expose that knowledge.

Accuracy remains more important than entity count.
