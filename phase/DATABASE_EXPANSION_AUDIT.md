# DATABASE EXPANSION AUDIT — AquaMind Continuous Growth

## Purpose

Audit the current AquaMind Database to determine whether its **coverage and content depth** are sufficient for a global aquarium knowledge platform, and create a data-driven roadmap for expansion.

This is an **AUDIT + ROADMAP task**.

It is NOT an implementation task.

The objective is to answer:

> What aquarium entities should AquaMind add next, and which existing entities need deeper data, based on the current source structure and the project's content strategy?

---

# IMPORTANT RULES

1. Do NOT modify application source code.
2. Do NOT modify Sanity CMS data.
3. Do NOT add entities.
4. Do NOT delete entities.
5. Do NOT change schemas.
6. Do NOT redesign UI.
7. Do NOT create WEB-09 or another technical SEO phase.
8. Do NOT invent traffic/search-volume numbers.
9. Do NOT claim search demand unless it is supported by available Search Console/export/research data.
10. If Search Console data is unavailable inside the project, explicitly mark demand analysis as `DATA REQUIRED`.
11. Use the existing AquaMind terminology and entity architecture.
12. Distinguish clearly between:
   - verified current data,
   - gaps found in source,
   - recommendations,
   - external research that may be needed later.

---

# CURRENT BASELINE

The previous Database Image Audit identified approximately:

- 158 Database entities
- Species
- Plants
- Corals
- Equipment
- Invertebrates

The exact current count MUST be re-read from the current source/CMS queries rather than blindly trusting this number.

The previous audit found no systemic image duplication problem.

Image remediation has already addressed the majority of the low-quality image backlog.

This task is about **DATABASE COVERAGE AND DEPTH**, not image quality.

---

# AUDIT SCOPE

Audit all current Database entity types:

1. Species
2. Plants
3. Corals
4. Equipment
5. Invertebrates

Also inspect related structures that affect database usefulness:

- Problems
- Tools
- Articles/posts
- Learning/guide surfaces
- Related resources
- Internal linking
- Compatibility data
- Water parameters
- Care fields
- Difficulty fields
- Tank size
- Taxonomy/scientific names
- Images
- Descriptions/body content
- Any existing relationship/reference fields

---

# PART 1 — CURRENT DATABASE INVENTORY

Determine the exact current inventory from source/CMS.

Produce:

| Entity Type | Current Count | Detail Page Exists | Listing Page Exists | Main Image Coverage | Rich Data Coverage |
|---|---:|---|---|---|---|
| Species | | | | | |
| Plants | | | | | |
| Corals | | | | | |
| Equipment | | | | | |
| Invertebrates | | | | | |

For each category, list all current entities.

Do not rely only on a seed file if CMS may contain additional documents.

Identify:

- source of truth
- seed data
- CMS data
- frontend query
- fallback/static data if any

---

# PART 2 — DATA DEPTH AUDIT

Determine which fields currently exist for each entity type.

Inspect the actual schemas and frontend queries.

For every entity type, report:

### Species

Check availability of:

- common name
- scientific name
- taxonomy
- description
- habitat
- adult size
- lifespan
- temperament
- behavior
- diet
- feeding
- difficulty
- tank size
- water type
- temperature
- pH
- GH
- KH
- compatibility
- breeding
- problems
- tools
- related articles
- related entities
- image

### Plants

Check:

- common name
- scientific name
- plant type
- growth rate
- placement
- light
- CO2
- substrate
- temperature
- pH
- water hardness
- difficulty
- propagation
- tank size/use
- problems
- tools
- related articles
- related plants
- image

### Corals

Check:

- common name
- scientific name
- coral type
- lighting
- flow
- placement
- feeding
- aggression
- difficulty
- water parameters
- reef suitability
- tank requirements
- compatibility
- problems
- tools
- related articles
- related corals
- image

### Equipment

Check:

- equipment type
- purpose
- tank size
- specifications
- capacity
- compatibility
- installation/use
- maintenance
- limitations
- common problems
- related tools
- related articles
- image

### Invertebrates

Check:

- common name
- scientific name
- type
- adult size
- temperament
- diet
- reef compatibility
- freshwater/marine
- tank size
- temperature
- pH
- difficulty
- compatibility
- problems
- tools
- related articles
- image

Do not assume every field should apply to every entity.

---

# PART 3 — DATA DEPTH SCORE

Do NOT create an overall quality ranking of political subjects; this restriction is irrelevant to this task.

For database analysis, calculate field coverage objectively.

For each entity type calculate:

- number of fields available
- number of populated fields
- percentage populated
- number of entities with thin data
- number of entities with rich data

Use transparent thresholds:

### Thin

Less than 40% of applicable fields populated.

### Moderate

40–69%.

### Rich

70%+.

Explain which fields were considered applicable for each entity type.

Do not treat missing optional fields as errors.

---

# PART 4 — COVERAGE GAP

Identify important aquarium knowledge areas that are missing from the current entity inventory.

Do NOT simply say:

> "Need more fish."

Break the gap down.

Examples of useful groupings:

### Freshwater Fish

- community fish
- nano fish
- schooling fish
- centerpiece fish
- bottom dwellers
- livebearers
- cichlids
- gouramis
- rasboras
- tetras
- catfish
- loaches
- bettas
- rainbowfish
- killifish
- species-specific care pages

### Marine Fish

- clownfish
- tangs
- gobies
- blennies
- wrasses
- cardinalfish
- damsels
- dwarf angelfish
- reef-safe species

### Corals

- soft corals
- LPS
- SPS
- NPS
- zoanthids/palythoa
- mushrooms
- leathers
- euphyllia
- acans
- montipora
- beginner reef corals

### Plants

- beginner plants
- foreground
- midground
- background
- epiphytes
- stem plants
- carpeting plants
- floating plants
- mosses
- low-tech plants
- high-tech plants

### Invertebrates

- shrimp
- snails
- crabs
- starfish
- cleanup crew
- reef invertebrates

### Equipment

- filters
- HOB filters
- canister filters
- sponge filters
- internal filters
- lights
- heaters
- pumps
- wavemakers
- skimmers
- reactors
- CO2 systems
- regulators
- dosing equipment
- testing equipment
- substrate equipment

These are examples only.

Use the actual current data and project structure to determine meaningful gaps.

---

# PART 5 — SEARCH DEMAND INTEGRATION

The long-term goal is traffic growth.

If Search Console data is accessible, inspect:

- queries
- impressions
- clicks
- CTR
- average position
- pages
- query-to-page relationships

Use it to identify:

1. Existing entities already receiving impressions.
2. Existing entities receiving impressions but weak clicks.
3. Topics/entities appearing in queries but missing from Database.
4. Queries suggesting missing entity pages.
5. High-impression database-related opportunities.

If Search Console data is NOT accessible:

Write:

`SEARCH DEMAND DATA REQUIRED`

Do NOT invent keyword volumes.

Do NOT claim that an entity has high demand without evidence.

---

# PART 6 — CONTENT PLAN CROSS-REFERENCE

The project has a large aquarium content-plan workbook with category sheets.

Use the available content plan as a **cross-reference**, not as proof of search demand.

Relevant content areas include:

- freshwater fish
- marine fish
- corals & reef
- aquatic plants
- equipment
- beginner guides
- disease/problem solving
- water management
- science/research
- species-specific guides
- maintenance
- chemistry
- special organisms

Identify:

- topics already represented in the content plan but missing from Database;
- Database entities that have no supporting article/topic;
- opportunities where one Database entity can support multiple articles;
- opportunities where one article can link to multiple Database entities.

Do NOT rewrite the content plan.

---

# PART 7 — DATABASE ↔ CONTENT ECOSYSTEM

Analyze whether the current architecture supports this model:

Article
↓
Database Entity
↓
Related Entity
↓
Problem
↓
Tool
↓
Additional Article

For representative entities, inspect whether this ecosystem exists.

Report gaps such as:

- entity has no related articles
- article has no entity references
- entity has no related problem
- entity has no relevant tool
- compatibility relationship missing
- learning path relationship missing

Separate:

`DATA GAP`

from:

`FRONTEND/SCHEMA GAP`

---

# PART 8 — EXPANSION PRIORITY FRAMEWORK

Do NOT produce a generic "add everything" list.

Create a roadmap using four dimensions:

### A. Search Opportunity

Supported by GSC/research data where available.

### B. User Utility

How useful the entity is for aquarium keepers.

### C. Ecosystem Value

How many articles/problems/tools/related entities can connect to it.

### D. Data Readiness

Whether reliable data can reasonably be maintained.

Use these as descriptive criteria, not as a simplistic numerical score unless the source data supports it.

Classify recommended additions as:

## Tier 1 — Immediate

Strong evidence + high ecosystem usefulness + feasible data.

## Tier 2 — Near Term

Useful coverage gaps with reasonable data readiness.

## Tier 3 — Later

Broad expansion that should wait until traffic/data justifies it.

---

# PART 9 — RECOMMENDED TARGET SIZE

Do NOT arbitrarily declare that AquaMind needs 1,000 or 5,000 entities.

Instead produce scenarios:

### Current

Exact current count.

### Near-term

A realistic next expansion batch.

### Medium-term

A broader coverage target.

### Long-term

A mature knowledge-platform target.

Explain what determines progression between each stage.

The roadmap should be **demand-driven**, not vanity-driven.

---

# PART 10 — CONTENT-FIRST DATABASE EXPANSION

Identify the best workflow for adding new entities:

Search demand
↓
Topic opportunity
↓
Check Database
↓
If missing → add entity
↓
Create/deepen entity data
↓
Create supporting article
↓
Connect problems/tools
↓
Internal linking
↓
Publish
↓
Measure GSC
↓
Update priority

This should become the recommended operating model.

---

# REQUIRED OUTPUT

Create:

`DATABASE_EXPANSION_ROADMAP.md`

The report must contain:

# 1. Executive Summary

Include:

- exact current entity count
- counts by type
- current data-depth condition
- major coverage gaps
- current relationship/ecosystem condition
- whether expansion is currently justified

# 2. Current Inventory

Full counts and entity lists.

# 3. Data Depth Audit

Field coverage by entity type.

# 4. Coverage Gap Analysis

Missing categories and important entity groups.

# 5. Search Demand Findings

Only if real data is available.

Otherwise explicitly state:

`SEARCH DEMAND DATA REQUIRED`

# 6. Content Plan Cross-Reference

Relevant overlaps/gaps.

# 7. Database ↔ Content Ecosystem

Current state and gaps.

# 8. Expansion Roadmap

Tier 1 / Tier 2 / Tier 3.

# 9. Recommended Operating Workflow

The demand-driven workflow described above.

# 10. Near-Term Action Plan

Limit this to the next practical steps.

# 11. Implementation Requirements

Identify whether future work requires:

- CMS data entry only
- new schema fields
- new frontend components
- new relationship structures
- new queries
- new SEO work

Do NOT implement them.

# 12. Final Assessment

Use:

`DATABASE COVERAGE:`

- `EARLY MVP`
- `GROWING`
- `STRONG`
- `COMPREHENSIVE`

Then explain the evidence.

---

# TRACEABILITY

For every important finding, identify the source:

- exact file path
- schema
- query
- data file
- CMS document type
- content-plan sheet

Where possible include line numbers.

Do not claim something is missing without showing where you checked.

---

# FINAL RULE

The purpose of this audit is NOT to maximize the number of Database entries.

The purpose is to determine:

> Which database entities and data fields will most effectively strengthen AquaMind's usefulness, topical coverage, internal-link ecosystem, and future organic traffic growth?

Traffic growth remains the primary business objective.

Database expansion is a supporting system for that objective.

DO NOT modify production.
DO NOT modify Sanity.
DO NOT add data.
DO NOT commit changes.

Only produce:

`DATABASE_EXPANSION_ROADMAP.md`
