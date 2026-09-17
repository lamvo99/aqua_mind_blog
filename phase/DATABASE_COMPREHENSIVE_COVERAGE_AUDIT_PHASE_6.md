# DATABASE_COMPREHENSIVE_COVERAGE_AUDIT_PHASE_6

**Project:** AquaMind Website / Database  
**Phase:** 6  
**Objective:** Establish a comprehensive, evidence-based master taxonomy and perform a complete coverage-gap audit before large-scale entity expansion.

## 0. Phase Goal

Phase 6 is an **AUDIT + MASTER TAXONOMY** phase. Do not perform large-scale entity creation here.

Strategic requirements:
- broad coverage of major aquarium keeping styles and user journeys;
- sufficient depth to avoid another major expansion shortly afterward;
- quantity must never reduce quality;
- scientific identity and aquarium parameters must be accurate;
- unsupported assumptions must not be inserted;
- unknown data remains unknown/null rather than guessed.

## 1. Scope

### In scope
- complete database inventory
- master aquarium taxonomy
- freshwater, predator, marine fish, coral, plant, invertebrate, brackish, pond/outdoor and equipment audits
- aquarium-style coverage
- missing/partial/duplicate/overlap analysis
- coverage scoring using explicit rules
- future data-quality requirements
- gap register and Phase 7 expansion plan
- automated/static audit tooling where useful
- tests and final checkpoint

### Explicitly out of scope
- large-scale new entities
- images/image sourcing
- content production/articles
- Search Console/analytics
- SEO content strategy
- separate graph database
- major visual redesign
- AI/ML recommendation engine
- replacing Finder
- unverified scraping or bulk import

## 2. Mandatory Execution Protocol

Execute sequentially: `SPEC 1 PASS -> SPEC 2 -> ...`. If any SPEC fails, stop, fix, rerun, then continue.

At completion create `DATABASE_COMPREHENSIVE_COVERAGE_AUDIT_PHASE_6_CHECKPOINT.md` and update `AQUA_BLOG_CURRENT_STATE.md`. Preserve all Phase 1–5 functionality.

## SPEC 1 — Current Database Inventory

Generate a reproducible inventory from the actual current source/database. Record counts for Species, Plants, Corals, Equipment, Invertebrates, Problems, Inspiration and total. For each domain report water-type, aquarium-style, region, difficulty/classification distributions, missing critical fields and duplicate candidates. Do not fabricate counts.

## SPEC 2 — Master Aquarium Taxonomy

Create `DATABASE_MASTER_AQUARIUM_TAXONOMY_PHASE_6.md`.

Audit at minimum:

**Freshwater styles:** Community, Planted, Low-Tech, High-Tech/CO2, Aquascaping, Nano, Betta, Shrimp, Blackwater, Biotope, Amazon/South America, Southeast Asia, African Cichlid, Goldfish, Large Fish, Predator, Native/Regional, Pond/Outdoor; Brackish boundary.

**Freshwater fish groups:** Tetra, Rasbora, Danio, Barb, Livebearer, Gourami, Betta, Rainbowfish, Killifish, Corydoras, Loach, Pleco/Loricariid, Otocinclus, Cichlid, Angelfish, Discus, African Rift Lake Cichlid, Dwarf Cichlid, Goldfish, Koi/Pond where in scope, Large Fish, Catfish, Predator and other major groups discovered.

**Predator groups:** Channidae, Polypteridae, Osteoglossidae/Arowana, Serrasalmus/Piranha, Crenicichla/Pike Cichlid, Peacock Bass, Predatory Cichlids, Predatory Catfish, other major aquarium predator groups.

## SPEC 3 — Marine Fish Taxonomy Audit

Audit at minimum: Clownfish, Gobies, Blennies, Tangs/Surgeonfish, Wrasses, Damselfish, Chromis, Cardinalfish, Basslets, Angelfish, Hawkfish, Foxface/Rabbitfish, Butterflyfish, Triggerfish, Pufferfish, Filefish, Boxfish, Lionfish, Eels, Groupers, Dottybacks, Assessors, Jawfish, Firefish, Dragonets, marine predators, large marine fish and other significant reef/community groups.

For each group classify Covered / Partial / Missing / Unknown, current representatives, recommended future target and implementation priority. Do not add entities in this phase.

## SPEC 4 — Coral Taxonomy Audit

Audit Soft, LPS, SPS and NPS.

**Soft:** Zoanthids, Palythoa, Mushrooms, Ricordea, Leather, Toadstool, Sinularia, Kenya Tree, Xenia, Gorgonians.

**LPS:** Euphyllia, Favia/Favites-type brain corals, Acan/Micromussa, Blastomussa, Chalice, Scolymia, Trachyphyllia, Lobophyllia, Duncan, Goniopora, Alveopora and other major LPS.

**SPS:** Acropora, Montipora, Pocillopora, Stylophora, Seriatopora/Bird's Nest, Pavona and other significant SPS.

**NPS:** Sun Coral/Tubastrea, Dendronephthya, applicable non-photosynthetic gorgonians and other major NPS.

Classify each group and define representative targets without adding records.

## SPEC 5 — Plant Taxonomy Audit

Audit growth forms: Stem, Rosette, Rhizome, Stolon, Moss, Floating, Carpet, Epiphyte, other relevant forms.

Audit hobby use: Low-tech, High-tech/CO2, Nano, Foreground, Midground, Background, Red plants, Fast-growing, Slow-growing, Biotope-specific.

Special attention to Red plants, Floating plants, Epiphytes, Carpet plants and Low-tech plants. Do not assign categories without evidence.

## SPEC 6 — Invertebrate Taxonomy Audit

**Freshwater:** Neocaridina, Caridina, Amano, Sulawesi shrimp, other aquarium shrimp, Nerite, Ramshorn, Malaysian Trumpet Snail, Mystery/Apple-type snails, Rabbit snails, other aquarium snails, freshwater crabs and other relevant invertebrates.

**Marine:** Cleaner shrimp, Peppermint shrimp, other reef shrimp, Hermit crabs, marine snails, Emerald crab, other reef crabs, Starfish, Brittle/serpent stars, Urchins, Anemones, Sea cucumbers where appropriate and other major reef invertebrates.

Classify coverage and future representative targets.

## SPEC 7 — Brackish / Transitional Audit

Audit fish, plants, invertebrates, equipment, compatible styles and parameters. Determine whether current data supports a meaningful brackish journey. Do not classify freshwater/marine entities as brackish without evidence.

## SPEC 8 — Pond / Outdoor Audit

Audit Goldfish, Koi, pond plants, pond filtration, pumps, UV, aeration, outdoor maintenance and relevant pond invertebrates. Determine Supported / Partial / Outside scope based on current product scope and schema.

## SPEC 9 — Equipment Taxonomy Audit

Audit at minimum:
- Filtration: Sponge, Internal, HOB, Canister, Sump, Undergravel, specialized filtration
- Flow: Return Pump, Circulation Pump, Wave Maker, Powerhead
- Lighting: Freshwater planted, Reef, General, Specialized
- Temperature: Heater, Chiller, Controller
- CO2: Cylinder, Regulator, Solenoid, Diffuser, Reactor, Drop checker
- Marine: Protein Skimmer, Media Reactor, ATO, Dosing Pump, UV, Salt Mixing
- Testing: Water Test Kits, Digital Meters, Refractometer/Salinity, Thermometer
- Substrate: Gravel, Sand, Aquasoil, Reef Sand, Specialized
- Maintenance: Siphon, Scraper, Net, Feeding tools, Water-change equipment

For each category report representation, missing categories, important numeric fields, data coverage and priority. Do not add brand-specific products unless product-level scope is established.

## SPEC 10 — Aquarium Style Coverage Matrix

Create a matrix for at least: Community, Planted, Low-Tech, High-Tech/CO2, Blackwater, Biotope, Shrimp, Betta/Nano, Freshwater Predator, Large Fish, Marine Fish Only, FOWLR, Nano Reef, Mixed Reef, Soft Coral Reef, LPS Reef, SPS Reef, NPS, Anemone/Clownfish, Marine Predator, Pond/Outdoor.

Columns: Species, Plants, Corals, Inverts, Equipment, Problems, Overall. Use objective coverage rules; one tagged entity does not automatically mean a style is covered.

## SPEC 11 — Coverage Quality Rules

**Covered:** meaningful representatives + required core data + real user discovery journey.

**Partial:** representatives exist but important subgroups or data are missing.

**Missing:** no meaningful representative or current data cannot support the use case.

**Unknown:** evidence insufficient.

Never convert Unknown into Covered by inference.

## SPEC 12 — Representative Entity Standard

Define non-universal representative targets based on popularity, diversity, distinct care requirements, tank sizes, difficulty, aquarium styles and ecological roles. Objective is representative breadth, not arbitrary quantity.

## SPEC 13 — Data Accuracy Gate

Define mandatory future fields.

**Species:** scientific/common identity, family, genus, water type, region, habitat, adult size, minimum tank, temperature, pH, GH/KH where supported, diet, temperament, difficulty, styles, predator flag, reef compatibility where marine, relationships.

**Plants:** scientific/common identity, water type, region, growth form, placement, light, CO2, difficulty, growth rate, styles, temperature, pH, relationships.

**Corals:** scientific identity, common name, coral type, water type, region where supported, temperature, light, flow, placement, difficulty, photosynthetic status, reef compatibility, styles, relationships.

**Invertebrates:** identity, water type, group, region, size, temperature, pH, difficulty, styles, reef compatibility where marine, relationships.

**Equipment:** category, water compatibility, styles, tank range where applicable, flow where applicable, power where applicable, role and relationships.

## SPEC 14 — Scientific Identity Verification Rules

Verify scientific names; genus/family consistency; morph/variant must not become a separate species without taxonomic justification; common trade names cannot override scientific identity; ambiguous identities are flagged; synonyms handled consistently where supported. If identity cannot be verified sufficiently, do not create the entity.

## SPEC 15 — Numeric Data Integrity Rules

Audit temperature, pH, GH/KH, tank size, size, flow, power and other numeric fields. Check units, min<=max, domain bounds, impossible values, text contamination, missing values and suspicious outliers. Do not silently replace unusual values; questionable values must be flagged unless verified.

## SPEC 16 — Existing Data Quality Audit

Run the accuracy gate against current data. Classify:
- P0: critical identity/factual integrity
- P1: important parameter/data integrity
- P2: coverage metadata issue
- P3: optional enrichment

Distinguish actual errors, missing data, uncertainty and stylistic differences. Missing data is not automatically an error.

## SPEC 17 — Duplicate / Overlap Audit

Detect duplicate species, species/morph duplication, coral/plant synonym duplication, equipment category duplication, taxonomy overlap, duplicate slugs and near-duplicate names.

Create `DATABASE_PHASE_6_DUPLICATE_REVIEW.md` with record A, record B, reason, confidence and recommended action. Do not delete automatically; destructive actions require evidence.

## SPEC 18 — Relationship Coverage Audit

Verify Phase 3/4/5 relationships: species→plants, species→invertebrates, species→equipment, species→problems, plant→equipment, plant→problems, coral→equipment, coral→problems, invertebrate→problems, entity→articles, problem→tools. Report coverage, broken/stale/impossible/empty relationships. Do not generate speculative fish-to-fish compatibility.

## SPEC 19 — Discovery Journey Audit

Audit these 23 journeys:
1. 20–30L beginner freshwater
2. Betta nano
3. 30L low-tech planted
4. High-tech CO2 aquascape
5. Amazon biotope
6. Blackwater
7. African cichlid
8. Freshwater shrimp
9. Freshwater predator
10. Large freshwater
11. Marine fish-only
12. FOWLR
13. Nano reef
14. Mixed reef
15. Soft coral reef
16. LPS reef
17. SPS reef
18. NPS reef
19. Anemone/clownfish
20. Marine predator
21. Marine invertebrate-focused
22. Brackish
23. Pond/outdoor

For each report required groups, available entities, missing groups/entities, missing parameters, Finder discoverability and severity. Audit only.

## SPEC 20 — Gap Register

Create `DATABASE_PHASE_6_MASTER_GAP_REGISTER.md` with:
`Domain | Taxonomy Group | Current Status | Current Count | Required Representative Count | Missing Count | Data Quality Risk | User Impact | Priority | Reason | Phase 7 Action`

Priority levels: P0 correctness/integrity, P1 major domain coverage, P2 meaningful breadth, P3 optional enrichment. These are implementation priorities, not ratings of aquarium subjects.

## SPEC 21 — Phase 7 Expansion Plan

Create `DATABASE_COMPREHENSIVE_EXPANSION_PHASE_7_PLAN.md` based strictly on the audit. Include exact groups, representative counts, required fields, verification, relationships, duplicate protection, migration/import strategy, batching, QA gates and rollback. Do not create Phase 7 entities.

## SPEC 22 — Automated Audit / Tests

Where practical create reusable audit tooling, e.g. `scripts/database-audit/`, producing inventory, taxonomy coverage, missing-field, numeric integrity, duplicate candidate, relationship integrity and discovery journey reports. Add deterministic tests. Existing tests must continue passing.

## SPEC 23 — Full Verification

Run the project's canonical checks, normally:
```bash
npx tsc --noEmit
npm run lint
npm test -- --run
```
Record results, test counts, pre-existing failures and new failures. Do not classify old failures as regressions.

## SPEC 24 — Final Coverage Review

Manually review freshwater, freshwater predators, marine fish, corals, plants, invertebrates, brackish, pond/outdoor, equipment, aquarium styles, discovery journeys and data accuracy risks. No major aquarium domain may be omitted. If uncertain, mark UNKNOWN.

## SPEC 25 — Final Checkpoint

Create `DATABASE_COMPREHENSIVE_COVERAGE_AUDIT_PHASE_6_CHECKPOINT.md` containing:
- status/date/branch
- baseline and final entity counts
- whether any entities were intentionally added
- overall coverage assessment
- master taxonomy location
- domains/groups audited
- coverage table (Covered/Partial/Missing/Unknown)
- P0/P1/P2/P3 gaps
- identity/numeric/duplicate/missing-field issues
- relationship coverage/integrity
- 23 discovery journey results
- exact Phase 7 scope
- TypeScript/ESLint/tests/regressions

Only use `PASS` if every mandatory specification passed.

## 4. Critical Rules

1. **Quality over quantity:** never add an entity merely to increase counts.
2. **No guessing:** unknown/null is better than fabricated precision.
3. **Taxonomy before expansion:** no bulk creation before master taxonomy and gap register.
4. **Scientific identity first.**
5. **Representative breadth:** broad user coverage, not infinite taxonomy.
6. **Preserve Phase 1–5 functionality.**
7. **No speculative compatibility**, especially fish-to-fish, coral or plant compatibility.
8. **No content scope leakage.**
9. **No image scope leakage.**
10. **Do not silently reconcile historical checkpoints:** current source is baseline; report discrepancies explicitly.

## 5. Definition of Done

- Current inventory exists
- Master taxonomy exists
- Freshwater/predator/marine/coral/plant/invertebrate/brackish/pond/equipment audits complete
- Aquarium-style matrix exists
- Accuracy and scientific identity gates defined
- Numeric integrity audited
- Existing data quality audited
- Duplicate review exists
- Relationship integrity audited
- 23 discovery journeys audited
- Master gap register exists
- Phase 7 expansion plan exists
- Audit tooling/tests created where practical
- TypeScript PASS
- ESLint PASS
- Tests PASS or only documented pre-existing failures
- Final checkpoint created
- `AQUA_BLOG_CURRENT_STATE.md` updated

## 6. Expected OpenCode Final Response

```text
PHASE 6 COMPLETE

Status: PASS / FAIL
Baseline: X
Final: X

Taxonomy:
- Domains audited: X
- Groups audited: X

Coverage:
- Covered: X
- Partial: X
- Missing: X
- Unknown: X

Critical gaps:
- P0: X
- P1: X
- P2: X
- P3: X

Data quality:
- Critical identity issues: X
- Numeric integrity issues: X
- Duplicate candidates: X
- Broken relationships: X

Discovery journeys:
- Passed: X/23
- Partial: X/23
- Failed: X/23

Phase 7 scope:
- New entities planned: X
- Domains requiring expansion: X

Verification:
- TypeScript: PASS/FAIL
- ESLint: PASS/FAIL
- Tests: X/X
- Regressions: X

Checkpoint:
DATABASE_COMPREHENSIVE_COVERAGE_AUDIT_PHASE_6_CHECKPOINT.md
```

Do not claim PASS unless all mandatory specifications passed.
