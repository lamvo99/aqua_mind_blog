# DATABASE DISCOVERY EXPERIENCE & FINDER ENGINE PHASE 5

## Status
PLANNED

## Objective
Validate and strengthen AquaMind's user-facing discovery system after Database Phases 1–4.

The current foundation includes semantic taxonomy, aquarium styles, regions, predator classification, reef compatibility, numeric constraints, entity relationships, database filters, and relationship-driven entity pages.

Phase 5 answers:

> Can a real user describe an aquarium goal and reliably move from constraints → filtered candidates → explainable results → relevant entities/resources?

Priority: **Correctness → explainability → UX → reuse of existing data → performance**

This is a discovery architecture phase, not a blind database expansion phase.

## Scope Rules

Strictly WEBSITE / DATABASE DISCOVERY / FINDER / UX.

Do NOT:
- write blog articles
- modify Content Production workflow
- create content-production phases
- generate article bodies
- source or replace images
- introduce a separate recommendation/ML service
- introduce a graph database
- rebuild unrelated website sections
- use Search Console as a dependency

Images: OUT OF SCOPE
Content Production: OUT OF SCOPE
Search Console: OUT OF SCOPE

## Required Source Materials

OpenCode MUST inspect:
1. DATABASE_QUALITY_ADVANCED_DISCOVERY_PHASE_4_CHECKPOINT.md
2. DATABASE_RELATIONSHIP_KNOWLEDGE_GRAPH_PHASE_3_CHECKPOINT.md
3. DATABASE_SEMANTIC_DISCOVERY_PHASE_2_CHECKPOINT.md
4. previous Database Expansion checkpoints
5. AQUA_BLOG_CURRENT_STATE.md
6. current Finder implementation
7. current Setup Planner implementation
8. current Diagnostic implementation
9. lib/database.ts
10. current Sanity schemas
11. DatabaseGrid/filter components
12. relationship query components
13. entity detail pages
14. style pages
15. /finder, /setup-planner, /problems/diagnose, /tools routes
16. existing Finder/Database tests
17. aquarium_content_plan.xlsx only if an existing topic reveals a concrete discovery requirement

Do not assume Finder behavior from old documentation. Audit actual code.

## Sequential Execution Rule

**SPEC 1 PASS → SPEC 2 PASS → ...**

If any SPEC fails: STOP, fix it, rerun it, then continue.

---

# SPEC 1 — Finder / Discovery Current-State Audit

Audit `/finder`, `/setup-planner`, `/problems/diagnose`, and `/tools`.

For Finder document:
- questions and inputs
- input types
- constraints
- scoring/ranking logic
- database queries
- hardcoded data
- semantic fields used
- relationships used
- numeric fields used
- result ordering
- user-facing explanations
- empty-result behavior
- URL state
- shareability
- mobile behavior

Audit Setup Planner and Diagnostic at a high level as well.

PASS: precise current-state map exists; no implementation assumptions remain.

---

# SPEC 2 — Discovery Intent Model

Define the minimum structured representation of an aquarium discovery request.

Potential dimensions:

### Tank
- tank volume
- water type
- temperature
- pH
- lighting
- CO₂
- available equipment

### User
- experience/difficulty tolerance
- maintenance tolerance only if already supported

### Goal
Use the existing controlled aquariumStyle vocabulary where relevant:
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
- Fish Only
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
- Pond/Outdoor

Do not create a huge preference model.

PASS: every intent field maps to an actual database field or is explicitly documented as future work.

---

# SPEC 3 — Finder Data Source Audit

Create a matrix:

| Finder Input | Database Field | Coverage | Reliable? | Action |
|---|---|---:|---|---|
| Tank size | tankSizeMinL | | | |
| Water type | waterType | | | |
| Style | aquariumStyle | | | |
| Difficulty | difficulty | | | |
| Predator | isPredator | | | |
| Reef safe | reefCompatibility | | | |
| Light | light | | | |
| CO₂ | co2 | | | |
| Temperature | tempMinC/tempMaxC | | | |
| pH | phMin/phMax | | | |

Identify inputs backed by hardcoded rules, incomplete data, derived logic, or unavailable data.

PASS: every Finder input has a known source and reliability status.

---

# SPEC 4 — Finder Logic Audit

Determine whether the current system is filtering, scoring, ranking, or mixing these concepts.

Audit:
- hard constraints vs preferences
- incompatible candidate exclusion
- unknown vs false handling
- explainability
- semantic correctness

Recommended conceptual model:

### Hard Constraints
Examples: water type, minimum tank size, explicit reef requirement, explicit CO₂ requirement, strongly restrictive style.

### Soft Preferences
Examples: easier care, smaller adult size, preferred style, preferred light.

### Unknown
Missing data must not silently become compatible, incompatible, or a score bonus/penalty.

Do not call a candidate compatible merely because it has a high score.

PASS: current behavior documented and unsafe assumptions identified.

---

# SPEC 5 — Explainable Matching Contract

Define concise reasons based only on evaluated fields, for example:
- Fits your 60L tank
- Matches freshwater planted setup
- Suitable for low-tech conditions
- Within selected temperature range
- Reef-compatible
- Beginner-friendly

If a constraint was not evaluated, do not claim it matched.

PASS: explanations are derived from actual evaluated data with no fake certainty.

---

# SPEC 6 — Finder Result Model

Create or reuse a typed result model only if necessary.

Potential fields:
- entity id/reference
- entity type
- match status
- score only if actually used
- matched constraints
- unmatched constraints
- unknown constraints
- explanation
- relevant relationship data

Do not expose opaque numeric scores unless there is a clear UX reason. Prefer human-readable reasons.

PASS: result data is typed, deterministic, explainable.

---

# SPEC 7 — Candidate Retrieval

Candidates must come from canonical database data rather than duplicated hardcoded catalogs.

Potential domains:
- Species
- Plants
- Corals
- Invertebrates
- Equipment

Reuse semantic fields, numeric fields, and Phase 3 relationships where appropriate.

PASS: no unnecessary duplicate catalogs.

---

# SPEC 8 — Hard Constraint Filtering

Verify deterministic constraints:

- freshwater request excludes saltwater-only species
- tank volume below documented minimum does not produce a normal match
- explicit reef-compatible requirement excludes `reefCompatibility=false`
- CO₂ becomes hard only when explicitly required and plant data supports it
- predator mode uses `isPredator`

Do not infer predator at runtime from diet.

PASS: hard constraints are deterministic and testable.

---

# SPEC 9 — Unknown Data Handling

Use three states:
- Match
- No match
- Unknown

Unknown must not become true, false, or an arbitrary score.

If temperature is missing, do not claim temperature compatibility was verified.

PASS: unknown data is explicit and consistent.

---

# SPEC 10 — Multi-Domain Discovery

Support one request producing multiple relevant entity types without duplicating business logic.

Example Amazon Planted:
1. Species
2. Plants
3. Equipment
4. Problems
5. Tools/resources

Example Nano Reef:
1. Marine Species
2. Corals
3. Invertebrates
4. Equipment
5. Problems
6. Tools/resources

Do not force every group to have results.

PASS: multi-domain discovery works through shared logic.

---

# SPEC 11 — Relationship-Aware Results

Use Phase 3 relationships after initial candidate filtering.

Flow:
1. filter by user constraints
2. obtain candidates
3. retrieve related plants/invertebrates/equipment/problems
4. present contextual discovery

Relationships enrich discovery; they must not override hard compatibility constraints.

PASS: no false compatibility caused by relationships.

---

# SPEC 12 — Finder Result UX

Audit/improve result presentation.

Each result should clearly expose:
- entity type
- name
- why it matched
- important evaluated constraints
- link to detail page
- useful next discovery path

Example:

**Entity**

Why it matches:
- 60L+
- Freshwater
- Planted
- Low-tech

Explore:
- detail
- suitable plants
- equipment
- common problems

Only show available information.

PASS: users can understand results without decoding a score.

---

# SPEC 13 — No-Result / Partial-Result UX

For zero results:
- explain restrictive constraints based on evaluated data
- offer optional relaxation controls such as broader difficulty/style or larger tank size
- never silently change filters

For partial results:
- make data limitations clear when useful

PASS: no dead-end UX and no silent relaxation.

---

# SPEC 14 — URL State & Shareability

Audit/implement URL representation where supported.

Potential parameters:
- waterType
- tankSize
- style
- region
- difficulty
- light
- co2
- predator
- reef
- temperature
- pH

Requirements:
- refresh preserves state
- browser back/forward behaves correctly
- shareable URL reproduces the request
- invalid parameters fail safely

PASS: supported Finder state is deterministic and shareable.

---

# SPEC 15 — Database Filter ↔ Finder Consistency

Finder must use the same semantics as Database pages.

Examples:
- Planted → `aquariumStyle`
- Predator → `isPredator`
- Reef-compatible → `reefCompatibility`
- tank size → canonical numeric field

Do not create conflicting Finder-specific meanings.

PASS: no semantic divergence.

---

# SPEC 16 — Setup Planner Integration Audit

Determine how Setup Planner can reuse tank size, water type, style, lighting, CO₂, equipment constraints and relationships.

Prefer shared domain/query functions over duplicate logic.

Do not rewrite Setup Planner unless a concrete defect exists.

PASS: integration opportunities documented and justified duplication removed.

---

# SPEC 17 — Diagnostic Integration Audit

Verify `/problems/diagnose` remains deterministic and uses the Problems database.

Where useful, connect outcomes to:
- related species
- equipment
- tools
- resources

Do not turn diagnosis into an opaque AI system.

PASS: diagnostic behavior remains deterministic and current.

---

# SPEC 18 — Performance Architecture

Audit:
- large client-side datasets
- repeated GROQ queries
- N+1 relationship queries
- unnecessary hydration
- duplicate filtering/scoring
- over-fetching
- expensive URL-state updates

Prefer server-side retrieval, bounded results, reusable queries, stable caching and minimal client state.

PASS: no obvious performance bottleneck introduced.

---

# SPEC 19 — Tests

Add/update deterministic tests for:

Hard constraints:
- water type
- tank size
- reef compatibility
- predator
- style

Soft preferences:
- difficulty
- size
- light
- CO₂ where applicable

Unknowns:
- missing values
- partial data

Relationships:
- candidate → related entities

UX:
- URL state
- no results
- reset
- invalid parameters

Do not remove or weaken pre-existing failures.

PASS: all new Finder logic has deterministic coverage.

---

# SPEC 20 — Full Verification

Run:
- TypeScript
- ESLint
- Vitest
- production build where appropriate
- route verification

Verify:
- /finder
- /setup-planner
- /problems/diagnose
- /species
- /plants
- /corals
- /equipment
- /invertebrates
- /problems
- /search
- /styles/[slug]

Check desktop and mobile.

PASS: no new critical regressions.

---

# SPEC 21 — Discovery Quality Scenarios

Run actual tests for:

### A — 30L Freshwater Low-Tech
freshwater + 30L + low-tech + beginner.
Verify large/incompatible fish are excluded, suitable plants/equipment can be discovered, explanations are accurate.

### B — Amazon Planted
freshwater + Amazon Basin + planted.
Verify region + style combine and relationships enrich results.

### C — Betta Nano
freshwater + Betta/Nano + small tank.
Verify tank constraint works and results do not rely only on style.

### D — Nano Reef
saltwater + Nano Reef + reef-compatible.
Verify marine species, corals, invertebrates and equipment can be discovered.

### E — Freshwater Predator
freshwater + Predator.
Verify `isPredator` drives classification and community fish are not presented as predator matches.

### F — Impossible Constraint
Use a deliberately restrictive tank/style combination.
Verify zero-result handling, no silent relaxation, and useful explanation.

Record actual results and any known data limitations.

---

# SPEC 22 — Final Discovery Architecture Report

Report:

| Area | Before | After |
|---|---|---|
| Finder data source | | |
| Hard constraints | | |
| Soft preferences | | |
| Unknown handling | | |
| Relationship usage | | |
| URL state | | |
| Explainability | | |
| Multi-domain discovery | | |
| Performance | | |

Finder coverage:

| Input | Supported | Database-backed | Reliable |
|---|---|---|---|
| Tank size | | | |
| Water type | | | |
| Aquarium style | | | |
| Region | | | |
| Difficulty | | | |
| Light | | | |
| CO₂ | | | |
| Predator | | | |
| Reef compatibility | | | |
| Temperature | | | |
| pH | | | |

Include actual results from all SPEC 21 scenarios.

---

# SPEC 23 — Final Checkpoint

Create:
`DATABASE_DISCOVERY_EXPERIENCE_FINDER_ENGINE_PHASE_5_CHECKPOINT.md`

Must contain:
1. Status
2. Baseline
3. Final
4. Intent Model
5. Matching Model: hard constraints / soft preferences / unknown
6. Data Sources
7. Relationships
8. UX: results, empty states, URL state, mobile
9. Scenario Tests
10. TypeScript/Lint/Tests/Build/Routes
11. Remaining Gaps
12. Explicit Scope

Images: OUT OF SCOPE
Content Production: OUT OF SCOPE
Search Console: OUT OF SCOPE
Graph database infrastructure: OUT OF SCOPE

---

# Definition of Done

- [ ] Finder current state audited
- [ ] Discovery intent model defined
- [ ] Finder data sources audited
- [ ] Existing matching logic audited
- [ ] Explainable matching contract defined
- [ ] Typed result model implemented/reused where necessary
- [ ] Candidates sourced from canonical database
- [ ] Hard constraints verified
- [ ] Unknown values handled explicitly
- [ ] Multi-domain discovery supported
- [ ] Phase 3 relationships integrated safely
- [ ] Result UX verified
- [ ] No-result behavior verified
- [ ] URL state/shareability verified where supported
- [ ] Finder/Database semantics aligned
- [ ] Setup Planner integration audited
- [ ] Diagnostic integration audited
- [ ] Performance audited
- [ ] Tests completed
- [ ] Scenario tests completed
- [ ] TypeScript PASS
- [ ] Lint PASS
- [ ] Build/routes verified where applicable
- [ ] Final checkpoint created

# Final OpenCode Response

DATABASE DISCOVERY EXPERIENCE & FINDER ENGINE PHASE 5

Status:
PASS / PASS WITH BACKLOG / FAIL

Baseline:
[current Finder + database state]

Final:
[final discovery architecture]

Intent Model:
[fields and mappings]

Matching:
[hard constraints / soft preferences / unknown handling]

Data Sources:
[database fields used]

Relationships:
[relationship integration]

Discovery:
[multi-domain discovery capabilities]

UX:
[result / empty state / URL / mobile]

Scenario Tests:
[actual scenario results]

Tests:
[x/y]

Lint:
PASS / FAIL

TypeScript:
PASS / FAIL

Build:
PASS / FAIL / N/A

Checkpoint:
DATABASE_DISCOVERY_EXPERIENCE_FINDER_ENGINE_PHASE_5_CHECKPOINT.md

Images:
OUT OF SCOPE

Content Production:
OUT OF SCOPE

Search Console:
OUT OF SCOPE

Graph database infrastructure:
OUT OF SCOPE

Next:
[recommended next technical action]
