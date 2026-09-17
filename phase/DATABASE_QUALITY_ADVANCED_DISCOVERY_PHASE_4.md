# DATABASE QUALITY & ADVANCED DISCOVERY PHASE 4

## Status
PLANNED

## Objective
Strengthen AquaMind's database after Semantic Discovery Phase 2 and Relationship & Knowledge Graph Phase 3.

Priority:
**Accuracy → structured data quality → discoverability → coverage → quantity**

This is NOT a blind entity-expansion phase.

## Scope
WEBSITE / DATABASE / DISCOVERY / DATA QUALITY

OUT OF SCOPE:
- Content Production
- article writing/editing
- images
- separate graph database
- Search Console
- whole-site redesign

## Required Sources
OpenCode MUST inspect:
1. DATABASE_SEMANTIC_DISCOVERY_PHASE_2_CHECKPOINT.md
2. DATABASE_RELATIONSHIP_KNOWLEDGE_GRAPH_PHASE_3_CHECKPOINT.md
3. previous database checkpoints
4. AQUA_BLOG_CURRENT_STATE.md
5. current Sanity schemas
6. lib/database.ts and database queries
7. DatabaseGrid/filter components
8. entity detail pages
9. Finder/Setup Planner/Diagnostic
10. current routes

Do not assume a field exists without checking the current code.

## Sequential Rule
**SPEC 1 PASS → SPEC 2 PASS → ...**
If a SPEC fails: STOP, fix, rerun, then continue.

---

# SPEC 1 — Current Baseline

Recount current entities:
- Species
- Plants
- Corals
- Equipment
- Invertebrates
- Problems
- Inspiration

Measure structured-data coverage.

Species:
waterType, tankSizeMinL, sizeCm, temperature, pH, hardness, difficulty, aquariumStyle, region, isPredator, reefCompatibility.

Plants:
placement, light, CO2, growthRate, growthForm, temperature, pH, aquariumStyle, region, redPlant.

Corals:
coralType, difficulty, light, flow, placement, photosynthetic, aquariumStyle.

Equipment:
flow, wattage, dimensions, tank capacity and other numeric specifications actually present.

Invertebrates:
waterType, adult size, tank size, temperature, pH, difficulty, reefCompatibility, aquariumStyle, region.

No data changes.

PASS: exact baseline recorded.

---

# SPEC 2 — Numeric Data Readiness

Audit candidate range fields:
- tank size
- adult size
- temperature min/max
- pH min/max
- hardness
- equipment flow
- wattage
- tank capacity

Classify each:
Reliable / Partial / Inconsistent / Missing / Not suitable.

Do not create filters for sparse or unreliable fields.

PASS: numeric readiness matrix exists.

---

# SPEC 3 — Numeric Schema Normalization

Where justified, implement the smallest normalized structure.

Possible fields:
- tankSizeMinL
- sizeCm
- temperatureMinC / temperatureMaxC
- pHMin / pHMax
- flowRateLph
- wattageW
- tankCapacityMinL / tankCapacityMaxL

Do NOT add all fields automatically.

Canonical units:
- volume: liters
- size: centimeters
- temperature: Celsius
- flow: L/h
- power: watts

Preserve nulls and backward compatibility.

PASS: schema and units are coherent.

---

# SPEC 4 — Existing Value Normalization

Audit existing numeric values for:
- gallons vs liters
- Fahrenheit vs Celsius
- inches vs centimeters
- inconsistent flow/power units

Do not silently convert values whose original unit cannot be established.

PASS: no unresolved critical unit inconsistencies.

---

# SPEC 5 — Range Filters

Implement only reliable range filters.

Potential:
Species: tank size, adult size, temperature, pH.
Plants: temperature, pH where sufficiently populated.
Equipment: flow, wattage, capacity.
Invertebrates: tank size, adult size, temperature.

Requirements:
- correct result counts
- reset
- URL state where supported
- null handling
- mobile usability
- no filters with unusably sparse data

PASS: filters work without regression.

---

# SPEC 6 — Aquarium Constraint Discovery

Audit whether users can discover by:
- tank volume
- water type
- aquarium style
- difficulty
- low/high light
- CO2
- predator
- reef compatibility
- equipment constraints

Prefer existing filters + URL state + semantic relationships over a new opaque ranking engine.

PASS: major aquarium constraints are representable.

---

# SPEC 7 — Freshwater Predator Coverage

Audit:
- Channa
- Polypterus
- Arowana/Osteoglossidae
- Peacock Bass/Cichla
- Piranha/Serrasalmus
- Pike Cichlids/Crenicichla
- large catfish
- predatory cichlids

For each: existing / missing / high-value / not needed / needs verification.

Only add confidently identified high-value entities.

PASS: coverage matrix and justified additions.

---

# SPEC 8 — Marine Fish Coverage

Audit:
Clownfish, Tangs, Gobies, Blennies, Wrasses, Damselfish, Chromis, Cardinalfish, Basslets/Dottybacks, Angelfish, Butterflyfish, Hawkfish, Lionfish/Scorpionfish, Triggerfish, Puffers, Rabbitfish/Foxface, marine predators.

Classify practical coverage:
- beginner
- nano
- reef-compatible
- advanced
- large
- predator

Do not chase exhaustive taxonomy.

PASS: high-value gaps identified.

---

# SPEC 9 — Coral Coverage

Audit Soft / LPS / SPS / NPS.

Required groups include:
Soft: Zoanthids, Palythoa, Mushroom, Ricordea, Leather, Xenia, GSP, Clove.
LPS: Euphyllia, Duncan, Caulastrea, Acan/Micromussa, Lobophyllia, Trachyphyllia, Goniopora/Alveopora, Favia/Favites, Scolymia/Cynarina.
SPS: Acropora, Montipora, Pocillopora, Stylophora, Seriatopora/Bird's Nest, Pavona.
NPS: Tubastraea, Dendronephthya and other confidently identified NPS groups.

Verify coralType, photosynthetic, difficulty, light, flow and placement.

PASS: coverage documented; no taxonomy invented from trade names.

---

# SPEC 10 — Plant Coverage

Audit:
foreground, midground, background, stem, rosette, epiphyte, moss, floating, low-tech, high-light, CO2, red, blackwater/biotope.

Check whether current growthForm/redPlant/style/region/light/CO2 fields support discovery.

Add plants only for meaningful gaps.

PASS: coverage matrix completed.

---

# SPEC 11 — Invertebrate Coverage

Freshwater:
Neocaridina, Caridina, Amano, Nerite, Mystery, Malaysian trumpet snails, freshwater crabs/crayfish where appropriate.

Marine:
Cleaner shrimp, Peppermint shrimp, hermit crabs, snails, urchins, starfish, anemones, clams where appropriate.

Audit waterType, reefCompatibility, tank size, adult size, difficulty, style, region.

PASS: high-value gaps documented without unsafe compatibility claims.

---

# SPEC 12 — Biological Identity & Data Quality

Audit:
scientific name, common name, family, genus, species, morph/variant, trade name, water type, origin, size, tank size, difficulty.

Rules:
1. Morph ≠ species.
2. Trade name ≠ scientific species.
3. Genus-level records must not be presented as species-level certainty.
4. Do not infer region from common name alone.
5. Do not infer habitat from aquarium style.
6. Do not infer predator status from carnivorous diet alone.
7. Do not infer reef compatibility from saltwater status alone.

Flag uncertainty instead of silently inventing corrections.

PASS: no unresolved critical identity errors.

---

# SPEC 13 — Phase 3 Relationship Recheck

Revalidate:
Species → Plants / Invertebrates / Equipment / Problems
Plant → Equipment / Problems
Coral → Equipment / Problems
Invertebrate → Problems

Check broken refs, duplicates, stale refs and invalid relationships after any data changes.

Do not auto-populate fish-to-fish compatibility.

PASS: no critical invalid relationships.

---

# SPEC 14 — Database UX

Audit:
- /species
- /plants
- /corals
- /equipment
- /invertebrates
- /problems

Check filter order, counts, reset, URL state, mobile controls, range controls, active filters and empty states.

Do not expose every field merely because it exists.

PASS: discovery remains understandable.

---

# SPEC 15 — Finder / Setup Planner / Diagnostic Audit

Determine where improved database fields can be reused:
- tank size
- water type
- experience
- aquarium style
- light
- CO2
- reef compatibility
- predator
- equipment constraints

Do not rewrite these tools unless required. Document larger architectural opportunities for a future phase.

PASS: current tools remain functional and reuse opportunities are documented.

---

# SPEC 16 — Performance

Audit:
- GROQ complexity
- projection size
- repeated queries
- N+1 patterns
- client/server boundaries
- URL-state parsing
- ISR/cache behavior
- sorting/range queries

Prefer server-side querying and bounded projections.

PASS: no obvious new performance regression.

---

# SPEC 17 — Accessibility & Responsive QA

Desktop/tablet/mobile:
- keyboard navigation
- focus states
- labels
- range controls
- touch targets
- no horizontal overflow
- empty states

PASS: no critical accessibility or responsive regressions.

---

# SPEC 18 — Tests & Verification

Run:
- TypeScript
- ESLint
- Vitest
- production build where appropriate
- route verification
- database query tests

Add tests for numeric filters, null values, URL state, semantic filters and relationship integrity.

Do not remove or weaken the pre-existing failing test.

PASS: no new unexplained failures.

---

# SPEC 19 — Final Coverage Report

Report:

Entity counts:
| Type | Before | Added | Removed | After |
| Species | | | | |
| Plants | | | | |
| Corals | | | | |
| Equipment | | | | |
| Invertebrates | | | | |
| Problems | | | | |
| Inspiration | | | | |
| Total | | | | |

Numeric coverage:
| Field | Eligible | Populated | Coverage |
| | | | |

Also report:
- usable constraints
- predator/marine/coral/plant/invertebrate coverage
- identity issues
- unit issues
- duplicate entities
- broken references
- uncertain records
- relationships fixed/invalidated

Do not interpret higher coverage as automatically better.

---

# SPEC 20 — Final Checkpoint

Create:
`DATABASE_QUALITY_ADVANCED_DISCOVERY_PHASE_4_CHECKPOINT.md`

Must contain:
1. Status
2. Baseline
3. Final
4. Schema changes
5. Numeric model and canonical units
6. New filters
7. Coverage audits
8. Data-quality audit
9. Phase 3 relationship recheck
10. UX changes
11. TypeScript/Lint/Tests/Build/Routes
12. Remaining gaps
13. Explicit scope status

Images: OUT OF SCOPE
Content Production: OUT OF SCOPE
Search Console: OUT OF SCOPE
Graph database infrastructure: OUT OF SCOPE

---

# Definition of Done

- [ ] Baseline measured
- [ ] Numeric readiness audited
- [ ] Schema normalized only where justified
- [ ] Units normalized
- [ ] Reliable range filters implemented
- [ ] Aquarium constraint discovery verified
- [ ] Predator coverage audited
- [ ] Marine coverage audited
- [ ] Coral coverage audited
- [ ] Plant coverage audited
- [ ] Invertebrate coverage audited
- [ ] Identity/data-quality audit passed
- [ ] Phase 3 relationships revalidated
- [ ] Database UX audited
- [ ] Finder/Diagnostic integration audited
- [ ] Performance audited
- [ ] Accessibility/responsive QA passed
- [ ] Tests completed
- [ ] TypeScript PASS
- [ ] Lint PASS
- [ ] Build/routes verified where applicable
- [ ] Final report completed
- [ ] Checkpoint created

# Final OpenCode Response

DATABASE QUALITY & ADVANCED DISCOVERY PHASE 4

Status:
PASS / PASS WITH BACKLOG / FAIL

Baseline:
[entity counts + numeric/data coverage]

Final:
[entity counts + numeric/data coverage]

Schema:
[list fields added/changed]

Numeric Discovery:
[list range filters implemented]

Semantic Discovery:
[list improved constraints]

Coverage:
[predator / marine / coral / plant / invertebrate summary]

Data quality:
[identity / unit / duplicate / reference results]

Relationships:
[Phase 3 relationship recheck]

UX:
[database/filter/finder changes]

Tests:
[x/y]

Lint:
PASS / FAIL

TypeScript:
PASS / FAIL

Build:
PASS / FAIL / N/A

Checkpoint:
DATABASE_QUALITY_ADVANCED_DISCOVERY_PHASE_4_CHECKPOINT.md

Images:
OUT OF SCOPE

Content Production:
OUT OF SCOPE

Search Console:
OUT OF SCOPE

Next:
[recommended next technical action]
