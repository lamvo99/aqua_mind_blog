# DATABASE_PHASE_13_MASTER_AQUARIUM_COVERAGE_POPULAR_LINE_AUDIT

## Purpose

Phase 13 establishes the **Master Aquarium Coverage Model** for AquaMind's database.

The goal is NOT to create an exhaustive catalogue of every aquarium species in the world.

The goal is to make the database broad and deep enough that it can be used for a long time with only light future maintenance:

- major aquarium styles are represented;
- every important aquarium group has meaningful coverage;
- common/popular aquarium choices within each group are represented;
- canonical species are separated from morphs, variants, cultivars, trade lines, and regional names;
- taxonomy and identity remain accurate;
- future additions become targeted rather than structural.

**Images are OUT OF SCOPE. Content production is OUT OF SCOPE.**

---

# Operating Rules

1. **Accuracy > quantity.**
2. **Coverage > raw entity count.**
3. Never add an entity only to increase the number of records.
4. Never guess a scientific name, identity, parameter, habitat, or relationship.
5. If identity is uncertain, mark `HOLD` and do not create the record.
6. Do not create fake species records for morphs, cultivars, trade names, or color variants.
7. Use the existing `parentSpecies` / alias model where appropriate.
8. Do not redesign the schema unless a real coverage problem cannot be solved with the current model.
9. Do not modify Sanity data during audit SPECs unless the SPEC explicitly authorizes controlled expansion.
10. Do not silently reconcile contradictory source data. Record the contradiction and resolve it through verification.
11. Every proposed new record must have a clear reason for inclusion:
    - major group coverage,
    - popular aquarium line,
    - important style support,
    - discovery/search value,
    - or important ecosystem support.
12. Do not attempt to catalogue every species in a genus/family.
13. The target is **representative completeness**, not exhaustive taxonomy.

---

# Coverage Hierarchy

Every audited item must be classified using this hierarchy:

`Aquarium Style → Domain → Group/Family → Popular Aquarium Lines → Canonical Species → Morph/Variant/Trade Line`

Statuses:

- `COVERED` — sufficient representation for the intended aquarium audience.
- `PARTIAL` — group exists but important popular choices are missing.
- `MISSING` — no meaningful representation.
- `HOLD` — candidate exists but identity/taxonomy is not sufficiently verified.
- `N/A` — group does not apply.

Priority:

- `P0` — fundamental/high-impact gap.
- `P1` — important popular coverage gap.
- `P2` — useful enrichment.
- `P3` — low-priority/niche.
- `HOLD` — no addition until verified.

---

# Strict Sequential Execution

**HARD STOP RULE**

OpenCode must execute SPEC-00 → SPEC-01 → SPEC-02 ... sequentially.

For every SPEC:

1. Run the required checks.
2. Record the result.
3. Mark PASS / FAIL / HOLD.
4. If a required integrity condition fails, STOP immediately.
5. Do not continue to later SPECs after FAIL.
6. Do not silently bypass a failed gate.

At the end of each successful SPEC, write a checkpoint entry.

---

# SPEC-00 — Baseline Lock

## Objective

Freeze the starting state before the master coverage audit.

## Required

Record:

- current entity count by domain;
- published/draft counts;
- species count;
- plant count;
- coral count;
- invertebrate count;
- equipment count;
- problem count;
- inspiration count;
- duplicate status;
- broken reference status;
- current schema fields relevant to taxonomy;
- current search capabilities;
- current Finder/filter capabilities;
- current tests/lint/TypeScript/build status.

Create:

`report/DATABASE_PHASE_13_BASELINE.json`

`report/DATABASE_PHASE_13_BASELINE.md`

## Gate

PASS only if the baseline is reproducible.

No Sanity mutations.

---

# SPEC-01 — Coverage Model & Taxonomy Gate

Audit the existing data model for:

- `name`
- `scientificName`
- `group`
- `localNames`
- `aliases`
- `parentSpecies`
- `waterType`
- `aquariumStyle`
- `region`
- relevant domain-specific fields.

Verify the model can distinguish:

### Canonical species
A scientifically meaningful species/entity.

### Morph / color variant
A morph must not automatically become a new species.

### Cultivar / selected aquarium plant line
Cultivars must be treated separately from species where appropriate.

### Trade name
Represent through aliases/local names or another justified relationship, not invented taxonomy.

### Regional/local name
Use `localNames` where the term is verified and geographically meaningful.

## Gate

PASS only if the current schema supports the above without unsafe redesign.

If a structural schema gap is discovered, STOP and document it.

Do not modify schema in this SPEC.

---

# SPEC-02 — Master Aquarium Style Coverage Matrix

Audit all major styles currently supported by the project.

### Freshwater

- Freshwater Community
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

### Marine

- Marine Fish Only
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

### Other

- Pond / Outdoor
- Brackish

For each style record:

`Style | Domains | Current coverage | Important groups | Missing groups | Priority | Notes`

## Gate

PASS only if every style has an explicit status.

Do not add entities yet.

---

# SPEC-03 — Freshwater Community Group Audit

Audit common freshwater aquarium groups.

At minimum:

### Livebearers
Guppy, Endler, Molly, Platy, Swordtail.

### Tetras / Characins
Neon, Cardinal, Black Neon, Ember, Rummy Nose, Congo, plus other major common choices.

### Rasboras / Danios
Harlequin, Chili, Zebra Danio, plus other popular lines.

### Corydoras
Bronze, Panda, Sterbai, Albino, plus other major choices.

### Plecos / Loricariids
Bristlenose, Zebra, Clown, Common Pleco, plus other major choices.

### Cichlids
Angelfish, Discus, Ram, Apistogramma, African Rift Lake cichlids, plus other major aquarium choices.

### Gourami
Dwarf, Honey, Pearl, Blue / Three-spot, plus other common lines.

### Loaches
Kuhli, Clown, Yoyo, plus other major choices.

### Rainbowfish
Major popular aquarium lines.

### Goldfish
Common aquarium forms/lines where taxonomically appropriate.

### Puffer
Pea Puffer, Figure-eight / Eyespot Puffer, plus other important freshwater/brackish lines.

### Other groups
Killifish, Knifefish, freshwater sharks, freshwater catfish, and other major aquarium groups discovered during audit.

Do not attempt exhaustive species coverage.

## Output

`report/DATABASE_PHASE_13_FRESHWATER_COMMUNITY_AUDIT.md`

Columns:

`Group | Current entities | Popular lines represented | Missing popular lines | Status | Priority`

---

# SPEC-04 — Freshwater Plant & Aquascaping Coverage Audit

Audit plants by **aquarium use**, not only taxonomy.

Required groups:

- Stem plants
- Rosette plants
- Carpet plants
- Moss
- Epiphytes
- Floating plants
- Red plants
- Low-tech plants
- High-tech / CO2 plants
- beginner plants
- aquascaping focal/background plants

At minimum consider major popular choices such as:

- Anubias
- Bucephalandra
- Java Fern
- Java Moss
- Christmas Moss / other major moss lines
- Cryptocoryne
- Amazon Sword
- Vallisneria
- Hygrophila
- Rotala
- Ludwigia
- Limnophila
- Pogostemon
- Monte Carlo
- dwarf hairgrass
- dwarf sagittaria
- frogbit
- Salvinia
- red aquarium plants

Separate species from cultivars/selected aquarium forms where appropriate.

## Output

`report/DATABASE_PHASE_13_PLANT_COVERAGE_AUDIT.md`

---

# SPEC-05 — Freshwater Predator & Large Fish Audit

This is a high-priority coverage audit.

### Arowana
Audit:
- Asian Arowana
- Silver Arowana
- Jardini
- Leichardti / other major aquarium-relevant lines where justified

Do not treat Vietnamese trade/color names as separate species unless scientifically justified.

### Snakehead / Channa
Audit common aquarium lines such as:
- Asian Snakehead
- Emperor Snakehead
- Rainbow Snakehead
- other highly popular aquarium lines discovered during research

Do not catalogue all Channa.

### Bichir / Polypterus
Audit:
- Senegal
- Ornate
- Delhezi
- Endlicheri
- other major aquarium choices

### Other predator groups
Audit:
- Peacock Bass
- Piranha
- Gar
- large predatory catfish
- predatory cichlids
- freshwater rays
- Arapaima

Output:

`report/DATABASE_PHASE_13_FRESHWATER_PREDATOR_AUDIT.md`

Every candidate:

`Group | Candidate | Entity type | Current status | Scientific identity | Popularity rationale | Priority | Action`

No entities are created in this SPEC.

---

# SPEC-06 — Marine Fish Popular Group Audit

Audit marine fish by major aquarium group.

### Clownfish
Audit common species and major aquarium lines:
- Ocellaris
- Percula
- Maroon
- Tomato
- Clarkii
- Skunk
- Saddleback
- other widely kept lines where justified

Morphs must not become fake species.

### Tangs / Surgeonfish
Audit:
- Blue / Regal
- Yellow
- Kole
- Sailfin
- Naso
- Purple
- Powder Blue
- other highly popular aquarium lines where justified

### Angelfish
Audit:
- Dwarf Angelfish
- Flame
- Coral Beauty
- other common dwarf lines
- Emperor
- other major large-angelfish choices where justified

Also audit:
- Damselfish
- Gobies
- Blennies
- Wrasses
- Butterflyfish
- Triggerfish
- Lionfish
- Puffers
- Eels / Morays
- Groupers / Marine Basslets
- Anthias
- Hawkfish
- Foxface / Rabbitfish
- Cardinalfish
- Mandarinfish
- Frogfish / Scorpionfish and other specialist predators

## Output

`report/DATABASE_PHASE_13_MARINE_FISH_AUDIT.md`

Use:

`Group | Popular lines | Current representation | Missing | Status | Priority | Taxonomy note`

No additions in this SPEC.

---

# SPEC-07 — Marine Invertebrate Support Audit

Audit by actual aquarium role.

Required:

### Shrimp
Cleaner shrimp, Peppermint shrimp, Fire shrimp, Sexy shrimp, common freshwater shrimp.

### Snails
Nerite, Trochus, Turbo, Nassarius, Cerith, freshwater algae-eating snails.

### Crabs
Hermit crabs, Emerald crab, other common reef-safe lines.

### Starfish / Sea Stars
Common aquarium-relevant choices.

### Urchins
Common reef cleanup choices.

### Sea Cucumbers
Only verified aquarium-relevant lines.

### Anemones
Major clownfish-compatible anemones.

### Other Clean-up Crew
Major common aquarium choices.

## Output

`report/DATABASE_PHASE_13_INVERTEBRATE_AUDIT.md`

Focus on practical aquarium discovery, not exhaustive taxonomy.

---

# SPEC-08 — Coral Coverage Audit

Audit:

1. Soft
2. LPS
3. SPS
4. NPS

Within each category audit popular aquarium genera/lines.

### Soft
Zoanthids, mushrooms, leather corals, Sinularia, Sarcophyton, Xenia, GSP, other common soft corals.

### LPS
Euphyllia / Frogspawn / Hammer / Torch, Acan / Micromussa, Chalice, Favia/Favites-type common aquarium corals, Duncan, Candy Cane / Caulastrea, Trachyphyllia, Fungia, other popular LPS.

### SPS
Acropora, Montipora, Bird's Nest / Seriatopora, Pocillopora, Stylophora, other common SPS.

### NPS
Sun Coral, Dendronephthya, Tubing / similar verified NPS, other major NPS where justified.

Do not create duplicate entities for trade names or morphs.

## Output

`report/DATABASE_PHASE_13_CORAL_COVERAGE_AUDIT.md`

---

# SPEC-09 — Equipment & Problem Coverage by Play Style

Audit equipment against actual aquarium styles:

- filtration
- lighting
- heating
- cooling
- circulation
- CO2
- ATO
- dosing
- skimming
- reactors
- testing
- substrate
- maintenance
- water preparation
- marine-specific equipment

For each style determine whether essential equipment categories are discoverable.

Audit problems for:

- fish disease
- coral problems
- plant problems
- algae
- water quality
- equipment problems
- behavior/compatibility
- marine-specific problems
- freshwater-specific problems

Do not create generic duplicate problems when an existing problem already represents the concept.

## Output

`report/DATABASE_PHASE_13_EQUIPMENT_PROBLEM_AUDIT.md`

---

# SPEC-10 — Species vs Morph / Variant / Trade Line Audit

Mandatory taxonomy-quality gate.

For every high-value group audited in SPEC-03 through SPEC-08, identify records that may represent:

- species;
- subspecies;
- morph;
- color variant;
- cultivar;
- trade name;
- regional name;
- hybrid;
- uncertain identity.

Create:

`report/DATABASE_PHASE_13_TAXONOMY_IDENTITY_AUDIT.md`

Columns:

`Current name | Current scientificName | Classification | Canonical entity | parentSpecies candidate | Alias/localName candidate | Confidence | Action`

Rules:

- Do not delete or mutate records automatically.
- Do not create `parentSpecies` references unless identity is verified.
- Do not treat a trade name as a species.
- Do not collapse legitimately distinct species.
- If uncertain: HOLD.

---

# SPEC-11 — Data Accuracy & Evidence Gate

For every approved missing candidate, verify:

### Identity
- scientific name
- common name
- group
- water type

### Aquarium relevance
Commonly kept OR strategically important to a major aquarium group.

### Parameters
Only record supported numeric values:
- tank size
- adult size
- temperature
- pH
- GH where applicable
- lighting/CO2 for plants
- coral light/flow where applicable
- equipment range where applicable.

### Habitat / region
Use only verified information.

### Semantic fields
Check:
- aquariumStyle
- region
- group
- isPredator
- reefCompatibility
- photosynthetic
- growthForm
- redPlant
- localNames
- aliases
- parentSpecies

If a value cannot be verified:

`NULL / unknown`

Never invent a value.

Any unverified high-impact identity causes HOLD for that candidate.

---

# SPEC-12 — Master Coverage Matrix & Approved Expansion Manifest

After SPEC-00 through SPEC-11 pass, create:

`report/DATABASE_PHASE_13_MASTER_COVERAGE_MATRIX.md`

`report/DATABASE_PHASE_13_APPROVED_EXPANSION_MANIFEST.md`

Matrix:

`Style | Domain | Group | Current count | Popular choices represented | Missing popular choices | Coverage | Priority | Notes`

Manifest statuses:

- `ADD_NOW`
- `DEFER`
- `HOLD`
- `NOT_NEEDED`
- `DUPLICATE / MERGE`
- `ALIAS_ONLY`
- `PARENT_SPECIES / VARIANT`

Each `ADD_NOW` candidate must contain:

- name
- scientificName
- domain
- group
- waterType
- aquariumStyle
- reason
- priority
- evidence/verification note
- taxonomy classification.

## Gate

No expansion may proceed until the project owner approves the manifest.

This SPEC must NOT automatically mutate Sanity.

---

# SPEC-13 — Expansion Readiness Review

Review the manifest for:

- duplicates;
- taxonomy conflicts;
- schema compatibility;
- missing required fields;
- missing aliases/local names;
- questionable numeric data;
- unsupported relationships;
- overlap with existing entities.

Verify expansion can be performed as a controlled migration.

No bulk auto-generation.

No Sanity mutation unless explicitly authorized by the phase execution command.

## Gate

PASS = manifest is safe for a future controlled expansion phase.

FAIL = return to the specific audit SPEC.

---

# SPEC-14 — Regression & Discovery Validation

Run:

- unit/integration tests;
- lint;
- TypeScript;
- production build;
- database search;
- alias/local-name search;
- Finder;
- filters;
- compare;
- relationship cards;
- entity detail routes;
- sitemap/static generation.

Benchmark representative queries:

### Freshwater
- snakehead
- bichir
- arowana
- piranha
- pleco
- corydoras
- shrimp
- red plant

### Marine
- clownfish
- tang
- angelfish
- goby
- wrasse
- puffer
- cleaner shrimp
- reef snail

### Coral
- soft coral
- zoanthid
- hammer
- torch
- acan
- montipora
- acropora
- NPS

No new regression may be introduced.

---

# SPEC-15 — Final Checkpoint & Current State

Create:

`report/DATABASE_PHASE_13_MASTER_AQUARIUM_COVERAGE_AUDIT_CHECKPOINT.md`

Include:

- baseline inventory;
- final audited inventory;
- coverage by style;
- coverage by group;
- coverage by popular line;
- approved expansion count;
- HOLD count;
- deferred count;
- taxonomy issues;
- data-quality issues;
- unresolved gaps;
- regression results;
- exact files created;
- Sanity mutations (must be zero unless explicitly authorized);
- next phase recommendation.

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Clearly distinguish:

- audited coverage;
- actual entity count;
- proposed additions;
- approved additions;
- deferred additions.

Do not report proposed candidates as existing database entities.

---

# Definition of Done

- [ ] All major aquarium styles have an explicit coverage status.
- [ ] Major freshwater community groups have been audited.
- [ ] Freshwater predator groups have been audited.
- [ ] Major marine fish groups have been audited.
- [ ] Marine invertebrate support groups have been audited.
- [ ] Soft/LPS/SPS/NPS coral coverage has been audited.
- [ ] Plant coverage is audited by aquarium use/growth form.
- [ ] Equipment and problems are audited by play style.
- [ ] Species vs morph/variant/trade-line distinctions are documented.
- [ ] High-value taxonomy identities are verified.
- [ ] No guessed scientific names or numeric parameters exist in the proposed manifest.
- [ ] Master Coverage Matrix exists.
- [ ] Approved Expansion Manifest exists.
- [ ] No unauthorized Sanity mutation occurred.
- [ ] Search/Finder/filter regression passes.
- [ ] Tests pass except only the known pre-existing failure, if still present.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Production build passes.
- [ ] Checkpoint exists.
- [ ] `AQUA_BLOG_CURRENT_STATE.md` is updated.

---

# Explicit Non-Goals

Do NOT:

- create an exhaustive worldwide species catalogue;
- add every species in a genus;
- create fake species for morphs;
- add images;
- write article content;
- build a graph database;
- add pricing/marketplace data;
- add external search infrastructure;
- redesign the entire schema without evidence;
- introduce fuzzy search merely because it is technically possible;
- bulk-generate unverified aquarium data.

---

# Expected Strategic Outcome

At the end of this phase, AquaMind should know precisely:

1. Which aquarium styles are genuinely covered.
2. Which major aquarium groups are covered.
3. Which popular choices users can actually discover.
4. Which groups are only represented by one or two examples.
5. Which missing choices are worth adding.
6. Which candidates are morphs/variants/trade names rather than new species.
7. Which additions are safe to implement later.
8. Which gaps should remain intentionally deferred.

The target is a **stable, high-quality, representative aquarium database** that can serve the website for a long period with only lightweight maintenance afterward.
