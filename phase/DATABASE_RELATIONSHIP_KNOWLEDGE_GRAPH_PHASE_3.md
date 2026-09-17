# DATABASE RELATIONSHIP & KNOWLEDGE GRAPH PHASE 3

## Status

PLANNED

## Phase Objective

Transform the AquaMind database from a semantically classified discovery database into a **relationship-aware aquarium knowledge system**.

Phase 2 established controlled semantic classification such as:

- `aquariumStyle`
- `region`
- `isPredator`
- `reefCompatibility`
- `photosynthetic`
- `growthForm`
- `redPlant`
- `waterType`

Phase 3 builds the next layer:

> **Entity → Compatibility → Related Entities → Problems → Tools → Articles → Learning Journeys**

The goal is not to create a generic graph database. The goal is to create a **small, reliable, curated relationship layer** that improves discovery, internal linking, entity pages, filters, and future recommendation/finder features.

---

# 0. Scope Rules

This phase is strictly:

**WEBSITE / DATABASE / DISCOVERY**

Do NOT:

- write or publish blog articles
- modify the content production workflow
- create content-production phases
- generate article bodies
- perform image sourcing or image replacement
- redesign the entire website
- introduce a graph database product/service
- create relationships merely to increase relationship counts

Images remain **OUT OF SCOPE**.

Content Production remains **OUT OF SCOPE**.

Search Console remains **OUT OF SCOPE**.

The relationship data must be useful, explainable, and technically maintainable.

---

# 1. Required Source Materials

Before implementation, OpenCode MUST inspect:

1. `DATABASE_SEMANTIC_DISCOVERY_PHASE_2_CHECKPOINT.md`
2. Previous database checkpoints:
   - Database Foundation
   - Database Expansion Phase 1
   - Database Expansion Phase 2
   - Database Expansion Phase 3
   - Database Expansion Phase 4
3. Current `AQUA_BLOG_CURRENT_STATE.md`
4. Current Sanity schemas
5. Current database queries in `lib/database.ts` and related modules
6. Current entity detail pages:
   - Species
   - Plants
   - Corals
   - Equipment
   - Invertebrates
   - Problems
7. Current DatabaseGrid/filter components
8. Existing article/resource relationship implementation
9. Existing Tools/Finder/Diagnostic routes
10. Current navigation and routing
11. `aquarium_content_plan.xlsx` only where article/entity mapping is technically relevant

Do not assume an existing field, relationship, or query exists without checking the current code.

---

# 2. Sequential Execution Rule

This phase uses strict sequential execution.

**SPEC 1 PASS → SPEC 2 → PASS → SPEC 3 → PASS → ...**

If a SPEC fails:

1. STOP.
2. Fix the failure.
3. Re-run the SPEC.
4. Continue only after PASS.

Do not implement later SPECs while an earlier SPEC is failing.

At the end of each major implementation group, create a checkpoint before moving to the next group where practical.

---

# SPEC 1 — Current Relationship Baseline Audit

## Objective

Establish exactly what relationships already exist.

Audit:

### Entity ↔ Article

Check:

- relatedPosts
- explicit article references
- entity mentions
- article metadata references
- any existing reverse lookup

### Entity ↔ Problem

Check existing problem/entity references.

### Entity ↔ Tool

Check existing explicit or inferred links.

### Entity ↔ Learning

Check existing Learn Path / learning resources.

### Entity ↔ Entity

Audit whether any direct references already exist between:

- Species
- Plants
- Corals
- Equipment
- Invertebrates
- Problems

### Requirements

Produce a relationship inventory:

| Relationship | Existing? | Source | Coverage | Direction |
|---|---|---|---:|---|
| Species → Plants | | | | |
| Species → Species | | | | |
| Species → Equipment | | | | |
| Species → Problems | | | | |
| Plant → Equipment | | | | |
| Coral → Equipment | | | | |
| Coral → Problems | | | | |
| Invertebrate → Problems | | | | |
| Entity → Articles | | | | |
| Entity → Tools | | | | |
| Entity → Learn | | | | |

Do not change data in SPEC 1.

### PASS Criteria

- All current relationship mechanisms identified.
- No relationship implementation is guessed.
- Existing relationship fields are documented.
- Baseline counts are recorded.

---

# SPEC 2 — Relationship Model Design

## Objective

Design the smallest relationship model that supports AquaMind's discovery goals.

Do NOT create a generic many-to-many graph abstraction unless the existing architecture genuinely requires it.

The preferred approach is to use Sanity references/arrays or the existing compatible mechanism.

## Required relationship families

### A. Compatibility

Potential relationships:

- Species ↔ Species
- Species ↔ Plants
- Species ↔ Invertebrates
- Species ↔ Corals
- Species ↔ Equipment

### B. Setup

- Style ↔ Species
- Style ↔ Plants
- Style ↔ Corals
- Style ↔ Equipment
- Style ↔ Invertebrates

Use existing `aquariumStyle` semantics where possible instead of duplicating style data.

### C. Problems

- Entity ↔ Problem

### D. Resources

- Entity ↔ Article
- Entity ↔ Tool
- Entity ↔ Learning Path

### E. Inspiration

- Entity ↔ Inspiration where technically useful

## Relationship principles

1. Prefer references over duplicated names.
2. Preserve stable Sanity document IDs.
3. Do not store scientific names as relationship keys.
4. Do not infer compatibility from name similarity.
5. Do not infer tank-mate compatibility from `aquariumStyle` alone.
6. Do not infer reef compatibility from saltwater status alone.
7. Do not infer biological compatibility from generic temperament alone.
8. A relationship must have a defensible reason.
9. Null/unknown must remain possible.
10. Avoid creating hundreds of low-confidence relationships automatically.

### PASS Criteria

A concise relationship contract exists covering:

- schema representation
- direction
- reverse lookup strategy
- confidence/curation strategy if needed
- deletion/reference behavior
- migration strategy

---

# SPEC 3 — Schema Implementation

## Objective

Implement only the relationship fields that are justified by SPEC 2.

Potential schema fields may include:

### Species

- compatibleSpecies
- compatiblePlants
- compatibleInvertebrates
- suitableEquipment
- relatedProblems
- relatedTools
- relatedArticles

### Plants

- suitableSpecies
- suitableEquipment
- relatedProblems
- relatedArticles

### Corals

- suitableEquipment
- relatedInvertebrates
- relatedProblems
- relatedArticles

### Equipment

- suitableForSpecies
- suitableForPlants
- suitableForCorals
- relatedProblems
- relatedArticles

### Invertebrates

- compatibleSpecies
- compatibleInvertebrates
- suitableEquipment
- relatedProblems
- relatedArticles

### Problems

- relatedSpecies
- relatedPlants
- relatedCorals
- relatedEquipment
- relatedInvertebrates
- relatedTools
- relatedArticles

IMPORTANT:

Do not automatically add every field above.

Only add fields supported by the actual implementation design.

If an existing relationship field already satisfies the requirement, reuse it.

### PASS Criteria

- Schema compiles.
- No unnecessary duplicate relationship fields.
- Existing documents remain backward compatible.
- References use stable document references.
- No broken references introduced.

---

# SPEC 4 — Relationship Data Strategy

## Objective

Define how relationships are populated safely.

Classify each relationship as:

### AUTO-DERIVED

Only when the relationship is deterministic and already supported by authoritative structured data.

Examples:

- existing explicit article reference
- existing Sanity reference
- deterministic reverse lookup

### RULE-BASED

Only when the rule is explicit, conservative, and technically defensible.

### MANUAL / CURATED

For relationships requiring aquarium expertise.

Examples:

- fish compatibility
- reef compatibility nuances
- suitable tank mates
- coral/equipment suitability
- biological relationships

### UNKNOWN

Do not force a relationship.

## Critical rule

**Do not use LLM-style guessing as a database migration mechanism.**

Do not populate relationships simply because two entities "seem related."

### PASS Criteria

Every populated relationship category has a documented population method.

---

# SPEC 5 — Existing Article/Resource Relationship Integration

## Objective

Connect the database with the website's existing resource system without changing content-production workflow.

Audit current:

- relatedPosts
- RelatedResources
- EntityResources
- tool links
- learning links
- category links

Then create a consistent relationship query layer where useful.

The website should be able to answer:

> What resources are relevant to this entity?

Potential resource types:

- Articles
- Tools
- Problems
- Learn Paths
- Styles

Do not generate new articles.

Do not edit article body content.

### PASS Criteria

- Existing article relationships remain functional.
- Entity pages can retrieve relevant resources.
- No duplicate resource query pipelines are unnecessarily created.
- No content workflow changes.

---

# SPEC 6 — Compatibility Relationship Audit

## Objective

Design a safe compatibility layer.

Compatibility must NOT be treated as a single binary concept.

Where appropriate distinguish:

### Tank Mate Compatibility

Species ↔ Species

Consider structured evidence such as:

- water type
- adult size
- temperament
- predator status
- known behavioral constraints
- tank-size requirements

### Plant Compatibility

Species ↔ Plants

Consider:

- herbivory
- habitat/setup suitability
- lighting/environment
- substrate/attachment requirements

### Invertebrate Compatibility

Species ↔ Invertebrates

Consider:

- predation risk
- adult size
- known behavior

### Reef Compatibility

Species ↔ Reef

Use existing `reefCompatibility` rather than recreating a separate generic boolean.

### Equipment Suitability

Entity ↔ Equipment

Consider:

- water type
- tank size
- equipment function
- flow requirements
- habitat/use case

IMPORTANT:

Do not claim "compatible" where the database lacks sufficient evidence.

If the current schema cannot safely represent nuanced compatibility, document the limitation instead of inventing precision.

### PASS Criteria

- Compatibility rules are documented.
- No unsafe blanket compatibility rules.
- Existing semantic fields are reused.
- Unknown compatibility remains possible.

---

# SPEC 7 — Relationship Population: High-Value First

## Objective

Populate a limited, high-value relationship set.

Prioritize:

1. Species ↔ Problems
2. Species ↔ Articles
3. Species ↔ Tools
4. Species ↔ Plants
5. Species ↔ Invertebrates
6. Species ↔ Equipment
7. Coral ↔ Equipment
8. Coral ↔ Problems
9. Invertebrate ↔ Problems
10. Plant ↔ Equipment

Do NOT enforce a fixed number of relationships per entity.

A well-supported entity may have many relationships; another may have few.

Avoid "fill to N" behavior.

### PASS Criteria

- Relationships are useful rather than artificially dense.
- High-value entities have meaningful discovery paths.
- No unsupported compatibility claims.
- Relationship coverage is measured by type.

---

# SPEC 8 — Reverse Lookup / Relationship Queries

## Objective

Ensure relationships work in both directions.

Example:

If:

`Neon Tetra → compatiblePlant → Java Fern`

then Java Fern should be able to expose:

`Suitable / compatible species → Neon Tetra`

Where the relationship is stored only in one direction, implement a safe reverse GROQ/query where appropriate instead of duplicating data.

Audit:

- forward lookup
- reverse lookup
- null handling
- unpublished/draft references
- deleted references
- pagination
- query performance

### PASS Criteria

- Forward and reverse discovery work.
- No duplicate data is required unnecessarily.
- Broken references are handled safely.

---

# SPEC 9 — Entity Detail Page Discovery Layer

## Objective

Expose relationship-driven discovery on entity detail pages.

Do not redesign the whole page.

Add a reusable presentation layer where appropriate.

Potential sections:

### Species

- Compatible / Related Species
- Suitable Plants
- Suitable Invertebrates
- Suitable Equipment
- Common Problems
- Related Articles
- Related Tools
- Relevant Aquarium Styles

### Plant

- Suitable Fish / Invertebrates
- Suitable Equipment
- Aquarium Styles
- Common Problems
- Related Articles

### Coral

- Suitable Equipment
- Related Invertebrates
- Common Problems
- Aquarium Styles
- Related Articles

### Equipment

- Suitable Species / Plants / Corals
- Aquarium Styles
- Related Problems
- Related Tools
- Related Articles

### Invertebrate

- Compatible Species
- Suitable Equipment
- Common Problems
- Aquarium Styles
- Related Articles

Only render sections when useful data exists.

Do not render empty relationship blocks.

### PASS Criteria

- Relationship sections are responsive.
- Empty relationships do not create dead UI.
- Existing SEO metadata remains intact.
- Existing page performance remains acceptable.
- Accessibility is preserved.

---

# SPEC 10 — Database Discovery Journey

## Objective

Use Phase 2 semantic classification + Phase 3 relationships to support multi-step discovery.

Examples:

### Journey A

Amazon + Planted

→ relevant Species  
→ relevant Plants  
→ Equipment  
→ Problems  
→ Articles/Tools

### Journey B

Betta + Nano

→ suitable Species context  
→ Plants  
→ Equipment  
→ Problems  
→ Guides

### Journey C

Nano Reef

→ Marine species  
→ Corals  
→ Invertebrates  
→ Equipment  
→ Problems  
→ Tools

### Journey D

Freshwater Predator

→ Predator species  
→ Tank requirements  
→ Equipment  
→ Problems  
→ Related resources

The implementation does not need to create a new "journey engine" if existing filters/routes can support this.

Prefer composable queries and URL state over a new abstraction.

### PASS Criteria

At least the existing database discovery flow can combine semantic filters with relationship-driven results without hardcoded entity-specific pages.

---

# SPEC 11 — Style Hub / Database Integration

## Objective

Audit whether aquarium styles can act as discovery hubs.

Examples:

- `/styles/[slug]`
- Database
- Species
- Plants
- Corals
- Equipment
- Invertebrates

The style taxonomy from Phase 2 must remain the source of truth.

Do not create a second style taxonomy.

Where appropriate, style pages should be able to surface database entities based on:

`aquariumStyle`

and optionally related relationships.

### PASS Criteria

- Style taxonomy is not duplicated.
- Style pages and database use the same controlled vocabulary.
- No hardcoded entity lists where semantic queries can be used.

---

# SPEC 12 — Relationship-Aware Search

## Objective

Audit whether global search can expose useful relationship context.

Do NOT turn search into a graph search engine.

Instead, ensure search result pages can lead users naturally to:

- entity detail
- related problems
- related articles
- related tools
- relevant styles

Search behavior must remain understandable.

### PASS Criteria

- Existing search remains functional.
- No significant performance regression.
- Search result labels remain accurate.

---

# SPEC 13 — Data Integrity Audit

## Objective

Perform a full relationship integrity audit.

Check:

- broken Sanity references
- references to deleted documents
- references to drafts where published content expects stable references
- duplicate relationship targets
- self-references
- circular references where problematic
- invalid entity types
- incompatible water types
- invalid coral relationships
- duplicate species/morph relationships
- stale references after duplicate cleanup

Special attention:

**Species identity ≠ morph/variant identity.**

Do not create separate species relationships for aquarium trade morphs when they represent the same biological species.

### PASS Criteria

Zero unresolved critical relationship integrity issues.

Non-critical issues must be documented.

---

# SPEC 14 — Performance Audit

## Objective

Ensure relationship queries do not make entity pages or database pages unnecessarily expensive.

Check:

- GROQ query complexity
- number of queries per page
- duplicate queries
- over-fetching
- large reference arrays
- N+1 patterns
- ISR/cache behavior
- server/client boundary

Prefer:

- server-side querying
- projection minimization
- reusable query fragments
- reverse lookup only when needed
- bounded relationship result counts for UI

Do not introduce client-side fetching merely for convenience.

### PASS Criteria

- No obvious N+1 relationship queries.
- No unnecessary client-side data fetching.
- Relationship-heavy pages remain performant.
- Existing caching strategy remains valid.

---

# SPEC 15 — Relationship UX / Mobile Audit

## Objective

Verify relationship discovery on:

- desktop
- tablet
- mobile

Check:

- section hierarchy
- card density
- filter interaction
- horizontal overflow
- keyboard navigation
- focus states
- touch targets
- empty states
- loading states if applicable

Do not redesign unrelated UI.

### PASS Criteria

- No horizontal overflow.
- Relationship sections are readable on mobile.
- Interactive elements meet existing accessibility standards.
- Empty states are intentional.

---

# SPEC 16 — Tests

## Objective

Add or update tests for the relationship layer.

Required coverage where applicable:

### Schema/query tests

- relationship fields
- forward lookup
- reverse lookup
- null handling

### Component tests

- relationship sections render
- empty sections hidden
- invalid/missing refs handled

### Database tests

- compatibility query behavior
- resource lookup
- style/entity integration

### Integrity tests

- no duplicate relationship IDs
- no invalid references in curated fixtures
- no self-reference where prohibited

Do not remove the existing pre-existing test failure merely to make the count look clean.

Record baseline and final test results.

### PASS Criteria

- New relationship tests pass.
- Existing baseline behavior remains intact.
- Any pre-existing failure is explicitly documented.

---

# SPEC 17 — Full Verification

Run as appropriate:

- TypeScript
- ESLint
- Vitest
- production build
- route verification
- database query verification

Verify at minimum:

- `/species`
- `/species/[slug]`
- `/plants`
- `/plants/[slug]`
- `/corals`
- `/corals/[slug]`
- `/equipment`
- `/equipment/[slug]`
- `/invertebrates`
- `/invertebrates/[slug]`
- `/problems`
- `/problems/[slug]`
- `/finder`
- `/tools`
- `/styles/[slug]`
- `/search`
- `/wiki`
- `/database`

### PASS Criteria

No new critical errors.

---

# SPEC 18 — Coverage & Quality Report

Create a final relationship coverage report.

Minimum metrics:

| Relationship | Eligible Entities | Populated | Coverage |
|---|---:|---:|---:|
| Species → Problems | | | |
| Species → Articles | | | |
| Species → Plants | | | |
| Species → Invertebrates | | | |
| Species → Equipment | | | |
| Coral → Equipment | | | |
| Coral → Problems | | | |
| Plant → Equipment | | | |
| Invertebrate → Problems | | | |
| Entity → Tools | | | |
| Entity → Learn | | | |

Do not interpret 100% coverage as automatically better.

The quality of the relationship is more important than relationship count.

Also report:

- relationships added
- relationships skipped
- relationships rejected as uncertain
- broken references found/fixed
- duplicate relationships removed
- entities with no relationships
- entities intentionally left unlinked

---

# SPEC 19 — Final Database Quality Audit

Perform a final review against the following principles:

## Identity

- Scientific identity is correct.
- Morphs are not incorrectly treated as separate species.
- Trade names are not treated as scientific identities.

## Semantics

- `aquariumStyle` remains controlled.
- `region` remains controlled.
- `isPredator` remains conservative.
- `reefCompatibility` remains meaningful.
- `photosynthetic` remains accurate.
- `growthForm` remains controlled.

## Relationships

- References are real.
- Compatibility is defensible.
- Unknown remains possible.
- No relationship exists only to increase coverage.
- Reverse discovery works.

## Website

- Entity pages expose useful related content.
- Database discovery remains intuitive.
- Existing filters continue working.
- Search continues working.
- Mobile remains usable.

---

# SPEC 20 — Final Checkpoint

Create:

`DATABASE_RELATIONSHIP_KNOWLEDGE_GRAPH_PHASE_3_CHECKPOINT.md`

The checkpoint MUST contain:

## 1. Status

PASS / PASS WITH BACKLOG / FAIL

## 2. Baseline

Record exact entity counts and relationship coverage before Phase 3.

## 3. Final

Record exact entity counts and relationship coverage after Phase 3.

## 4. Schema Changes

List every relationship field added or changed.

## 5. Relationship Contract

Document:

- relationship types
- direction
- reverse lookup
- population strategy

## 6. Coverage

Include relationship coverage table.

## 7. Data Quality

Include:

- broken refs
- duplicates
- rejected uncertain relationships
- intentionally unlinked entities

## 8. UX

Record entity detail page and discovery journey changes.

## 9. Technical Verification

Record:

- TypeScript
- Lint
- Tests
- Build
- Route verification

## 10. Remaining Gaps

Document future database expansion opportunities.

## 11. Explicit Scope Status

Images: **OUT OF SCOPE**

Content Production: **OUT OF SCOPE**

Search Console: **OUT OF SCOPE**

Graph database infrastructure: **OUT OF SCOPE**

---

# Definition of Done

Phase 3 is complete only when:

- [ ] Existing relationships audited
- [ ] Relationship model documented
- [ ] Schema implemented safely
- [ ] Population strategy documented
- [ ] High-value relationships curated
- [ ] Reverse lookup works
- [ ] Entity detail pages expose useful relationships
- [ ] Style/database discovery integration works
- [ ] Search remains functional
- [ ] Relationship integrity audit passes
- [ ] Performance audit passes
- [ ] Mobile UX audit passes
- [ ] Tests pass with baseline exceptions documented
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Build/routes verified where applicable
- [ ] Final relationship coverage measured
- [ ] Final quality audit completed
- [ ] `DATABASE_RELATIONSHIP_KNOWLEDGE_GRAPH_PHASE_3_CHECKPOINT.md` created

---

# Final OpenCode Response Format

When the phase is complete, respond exactly with:

```text
DATABASE RELATIONSHIP & KNOWLEDGE GRAPH PHASE 3

Status:
PASS / PASS WITH BACKLOG / FAIL

Baseline:
[entity counts + relationship baseline]

Final:
[entity counts + relationship coverage]

Schema:
[list relationship fields added/changed]

Relationships:
[list major relationship types implemented]

Coverage:
[relationship coverage summary]

Discovery:
[entity page / style / database discovery changes]

Data quality:
[broken refs / duplicates / uncertain relationships]

Tests:
[x/y]

Lint:
PASS / FAIL

TypeScript:
PASS / FAIL

Build:
PASS / FAIL / N/A

Checkpoint:
DATABASE_RELATIONSHIP_KNOWLEDGE_GRAPH_PHASE_3_CHECKPOINT.md

Images:
OUT OF SCOPE

Content Production:
OUT OF SCOPE

Search Console:
OUT OF SCOPE

Next:
[recommended next technical action]
```
