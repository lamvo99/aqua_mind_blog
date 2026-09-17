# DATABASE_COMPREHENSIVE_EXPANSION_AND_DATA_ACCURACY_PHASE_7

## Phase 7 — Comprehensive Expansion & Data Accuracy

**Project:** AquaMind Website / Database  
**Phase:** 7  
**Depends on:** DATABASE_COMPREHENSIVE_COVERAGE_AUDIT_PHASE_6 — PASS  
**Objective:** Resolve identified data-integrity issues, expand the database across the audited gaps, backfill critical existing data, and verify every addition without sacrificing factual accuracy.

---

# 0. Phase Goal

Phase 6 established the Master Aquarium Taxonomy and identified the remaining coverage gaps.

Current Phase 6 baseline:

- **357 entities**
- Audit-only; no entities added
- 50+ taxonomy groups audited
- 7 styles Covered
- 13 styles Partial
- 7 styles Missing
- 13 duplicate-pair findings requiring resolution
- 55–70 planned new entities
- 5 domains requiring expansion
- 0 numeric-integrity issues
- 0 broken relationships
- 224/225 tests, with 1 documented pre-existing failure

The Phase 7 objective is to turn the Phase 6 gap register into a verified, high-quality database expansion.

The target is NOT simply a larger database.

The target is:

> **A significantly broader and deeper database in which every new entity has verified identity, taxonomy, core aquarium parameters, semantic metadata, and valid relationships.**

---

# 1. Source of Truth

Phase 7 MUST use these Phase 6 artifacts as the primary implementation specification:

- `DATABASE_MASTER_AQUARIUM_TAXONOMY_PHASE_6.md`
- `DATABASE_PHASE_6_DUPLICATE_REVIEW.md`
- `DATABASE_PHASE_6_STYLE_COVERAGE_MATRIX.md`
- `DATABASE_PHASE_6_RELATIONSHIP_COVERAGE_AUDIT.md`
- `DATABASE_PHASE_6_DATA_QUALITY_AUDIT.md`
- `DATABASE_PHASE_6_DISCOVERY_JOURNEY_AUDIT.md`
- `DATABASE_PHASE_6_MASTER_GAP_REGISTER.md`
- `DATABASE_COMPREHENSIVE_EXPANSION_PHASE_7_PLAN.md`

Do NOT replace the Phase 6 findings with assumptions from generic aquarium knowledge.

If a Phase 6 artifact is ambiguous or internally inconsistent:

1. inspect the actual current source/database;
2. document the discrepancy;
3. use verified current data;
4. do not silently overwrite the historical finding.

---

# 2. Mandatory Execution Protocol

Execute specifications strictly in sequence:

```text
SPEC 1 PASS
    ↓
SPEC 2 PASS
    ↓
...
```

If any SPEC fails:

1. STOP.
2. Fix the failure.
3. Re-run the failed SPEC.
4. Continue only after PASS.

Do not skip a failed gate.

Do not batch all entity creation first and validate later.

---

# 3. Hard Quality Rules

## Rule A — Accuracy over quantity

55–70 is a planning range, NOT a requirement to manufacture records.

If fewer entities satisfy the quality gate, add fewer.

If additional entities are demonstrably necessary to close a major audited gap, document the reason before adding them.

## Rule B — No guessing

If a parameter cannot be verified with sufficient confidence:

- leave it null where schema permits;
- mark it unknown if supported;
- document the missing field.

Never invent a value.

## Rule C — Scientific identity first

Every biological entity must have a defensible scientific identity.

Do not create separate species for:

- color morphs;
- trade names;
- locality variants;
- common-name variants;

unless taxonomic treatment explicitly justifies a separate entity.

## Rule D — No speculative compatibility

Do not create unsupported compatibility relationships.

Especially:

- fish → fish
- fish → invertebrate
- coral → coral
- plant → plant

Use only evidence-backed or existing deterministic relationship rules.

## Rule E — Existing schema first

Do not add new schema fields merely because a new entity lacks information.

Only introduce schema changes if the current model genuinely cannot represent a required domain concept.

Any schema change requires a separate explicit justification and regression test.

## Rule F — Preserve existing functionality

Phase 1–6 functionality must remain intact.

## Rule G — Images are out of scope

Do not block entity creation on images.

Image work remains owner-managed.

## Rule H — Content production is out of scope

Do not create articles, briefs, editorial content, or content-production workflows.

---

# SPEC 1 — Baseline & Phase 6 Artifact Verification

Before modifying data:

1. Read all required Phase 6 artifacts.
2. Verify the current database count.
3. Verify current entity types.
4. Verify current duplicate candidates.
5. Verify the Phase 7 planned expansion scope.
6. Verify current tests/lint/type-check baseline.

Produce a short machine-readable baseline report.

### PASS

- Phase 6 artifacts located.
- Current source agrees with baseline or discrepancies documented.
- No unexplained baseline changes.
- Existing tests baseline recorded.

---

# SPEC 2 — Duplicate Resolution Gate

Resolve the duplicate candidates identified by Phase 6 BEFORE creating new entities.

Review every candidate individually.

For each candidate determine:

- same biological entity;
- synonym;
- morph/variant;
- duplicate slug;
- common-name collision;
- genuine distinct entity;
- uncertain.

### Required output

Create:

`DATABASE_PHASE_7_DUPLICATE_RESOLUTION.md`

For every candidate:

```text
Record A
Record B
Decision
Evidence
Action
Confidence
```

### Actions

Only one of:

- MERGE
- KEEP BOTH
- RENAME/DISAMBIGUATE
- DEFER

Do not delete records solely because names look similar.

### PASS

- Every Phase 6 duplicate candidate reviewed.
- No unresolved P0 duplicate remains without documented justification.
- No accidental data loss.
- References remain valid.

---

# SPEC 3 — Post-Duplicate Integrity

After duplicate resolution:

Verify:

- unique IDs
- unique slugs
- unique canonical identities
- no broken references
- no orphan references
- no accidental relationship loss

Run database integrity tooling.

### PASS

- 0 broken references.
- 0 invalid slugs.
- 0 accidental orphaned records.
- All retained records have a canonical identity.

---

# SPEC 4 — Expansion Manifest

Before adding any new entity, create a deterministic manifest:

`DATABASE_PHASE_7_EXPANSION_MANIFEST.md`

Every planned entity must have:

```text
Domain
Canonical Name
Scientific Name where applicable
Taxonomy Group
Reason for Inclusion
Phase 6 Gap
Priority
Required Core Fields
Relationship Requirements
Verification Status
```

Group the manifest by:

1. Species
2. Plants
3. Corals
4. Invertebrates
5. Equipment

The manifest must map directly to the Phase 6 Master Gap Register.

### PASS

- Every proposed entity maps to a documented Phase 6 gap.
- No arbitrary additions.
- Duplicate protection applied.
- Entity count target is explicitly treated as a range, not a quota.

---

# SPEC 5 — Evidence & Verification Protocol

Establish the verification standard before entity creation.

For biological entities verify, where applicable:

### Identity

- scientific name
- genus
- family
- common name

### Ecology

- native region
- habitat
- water type

### Care

- adult size
- minimum tank size
- temperature
- pH
- GH/KH where appropriate
- diet
- temperament
- difficulty

### Semantic

- aquarium styles
- predator
- reef compatibility
- growth form
- placement
- light
- CO2
- photosynthetic status

### Equipment

- category
- aquarium style
- water type
- tank-size range
- flow
- power
- functional role

Use authoritative or high-quality references appropriate to the field.

Record sources/evidence in the Phase 7 audit artifacts.

Do not copy unsupported values from a single weak source when authoritative evidence is available.

---

# SPEC 6 — Species Expansion

Expand species only according to the approved Phase 7 manifest.

Priority gaps from Phase 6 include, where still unresolved:

- Goldfish
- Freshwater predator groups
- Snakehead / Channa
- Pike Cichlid / Crenicichla
- Peacock Bass
- Marine Predator
- remaining major marine fish groups
- other species explicitly listed in the Phase 6 gap register

Do NOT automatically add every species in a family.

Select representative species based on:

- aquarium relevance
- distinct care requirements
- tank-size diversity
- difficulty diversity
- aquarium-style coverage
- ecological role
- gap closure

### Species Quality Gate

Every new species must pass:

- scientific identity
- water type
- region
- size
- tank requirement
- temperature
- pH
- diet
- temperament
- difficulty
- aquarium style
- predator status where applicable
- reef compatibility where applicable
- valid slug
- no duplicate identity

Fields genuinely unsupported may remain null.

### PASS

Every added species passes the quality gate.

---

# SPEC 7 — Plant Expansion

Expand plants according to the Phase 6 manifest.

Priority areas include:

- red plants
- moss
- carpet
- epiphytes
- other underrepresented growth forms
- low-tech/high-tech representatives
- biotope-specific representatives where justified

Every plant must be classified only when evidence supports the classification.

### Plant Quality Gate

Verify:

- scientific identity
- growth form
- placement
- light
- CO2
- difficulty
- growth rate
- water type
- region where supported
- temperature
- pH
- aquarium styles

Do not infer "low-tech" merely because a plant can survive without CO2 under some conditions.

---

# SPEC 8 — Coral Expansion

Expand coral coverage according to the manifest.

Priority gaps include, where still unresolved:

- Acan/Micromussa
- Chalice
- Pocillopora
- Stylophora
- other missing major coral groups
- any remaining Soft/LPS/SPS/NPS gaps in Phase 6

Verify:

- scientific identity
- coral type
- photosynthetic status
- temperature
- light
- flow
- placement
- difficulty
- reef compatibility
- aquarium styles
- valid slug

Do not duplicate species under hobby trade names.

---

# SPEC 9 — Invertebrate Expansion

Expand according to the manifest.

Priority gaps may include:

- Sulawesi shrimp
- Rabbit snails
- Brittle stars
- Sea cucumbers
- reef cleanup organisms
- other missing major freshwater/marine groups

Verify:

- scientific identity where applicable
- group
- water type
- region
- size
- temperature
- pH
- difficulty
- aquarium styles
- reef compatibility where marine

Do not add a marine invertebrate as reef-safe solely because it is commonly sold for reef aquariums.

Verify the actual compatibility status.

---

# SPEC 10 — Equipment Expansion

Expand according to the manifest.

Priority areas include:

- Lighting
- Heater/Chiller
- Marine equipment
- other missing categories from Phase 6

Equipment is category-level unless the existing schema explicitly supports product-level records.

Verify:

- category
- water compatibility
- aquarium styles
- tank-size range where applicable
- flow rate where applicable
- power where applicable
- functional role
- relationships

Do not invent technical specifications.

If a numeric specification varies by model, do not create a false universal number.

---

# SPEC 11 — Existing Data Backfill

Phase 6 identified:

- 92 P1 missing fields
- 169 P2 missing fields
- 70 P3 missing fields

Audit these fields.

Priority:

### P1

Backfill only fields that are:

- required for discovery;
- important to user safety/care;
- required for semantic correctness;
- supported by reliable evidence.

### P2

Backfill meaningful discovery fields.

### P3

Backfill only when low-risk and evidence is readily available.

Do NOT blindly fill every null.

A null field with insufficient evidence is correct behavior.

### PASS

- P1 missing fields reviewed.
- Every backfill has evidence.
- No guessed values.
- Existing correct values are preserved.

---

# SPEC 12 — Taxonomy & Semantic Consistency

After expansion/backfill verify:

- waterType
- aquariumStyle
- region
- difficulty
- predator
- reefCompatibility
- coralType
- photosynthetic
- growthForm
- redPlant
- equipment category
- problem category

Ensure values use the existing controlled vocabulary.

Do not introduce spelling variants such as:

```text
Low Tech
Low-Tech
lowtech
LowTech
```

when a canonical value already exists.

Normalize only when the canonical meaning is clear.

---

# SPEC 13 — Numeric Data Integrity

Audit all changed/new numeric fields.

Rules:

- minimum <= maximum
- units canonical
- no impossible values
- no accidental zero values
- no string values in numeric fields
- no fabricated precision

Check:

- temperature
- pH
- GH/KH
- tank volume
- adult size
- equipment flow
- equipment power
- other numeric fields touched by Phase 7

### PASS

- 0 new numeric integrity errors.
- Existing known issues documented separately.
- No silent questionable-value replacement.

---

# SPEC 14 — Relationship Expansion

For every new/modified entity, establish only valid relationships supported by existing relationship architecture.

Check:

### Species

- plants
- invertebrates
- equipment
- problems

### Plants

- equipment
- problems

### Corals

- equipment
- problems

### Invertebrates

- problems
- species only where compatibility is defensible
- equipment

### Existing article/tool relationships

Preserve existing relationships.

Do not create speculative compatibility simply to increase relationship counts.

---

# SPEC 15 — Relationship Integrity

Run:

- reference validation
- reverse-query validation
- duplicate relationship detection
- self-reference detection
- stale-reference detection

Expected:

```text
Broken references: 0
Stale references: 0
Invalid IDs: 0
Self references: 0
Duplicate relationship refs: 0
```

Empty relationships are not automatically errors.

For example, a marine species may legitimately lack freshwater-specific relationships.

---

# SPEC 16 — Discovery Journey Re-Test

Re-run all 23 Phase 6 journeys after expansion:

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

For each:

- PASS
- PARTIAL
- FAIL

Explain any remaining partial/fail state.

The goal is not to force every journey to PASS if the product intentionally excludes a domain. Such exclusion must be documented.

---

# SPEC 17 — Coverage Recalculation

Re-run the Phase 6 taxonomy audit.

Produce:

`DATABASE_PHASE_7_COVERAGE_DELTA.md`

For every audited group show:

```text
Phase 6 status
Phase 7 status
Before count
After count
New entities
Backfilled entities
Remaining gap
Reason
```

Do not report improvement using raw entity count alone.

Coverage must be evaluated against the Master Taxonomy.

---

# SPEC 18 — Quality Regression Audit

Compare pre-Phase-7 and post-Phase-7:

- duplicate count
- broken references
- numeric integrity
- missing P1 fields
- semantic invalid values
- relationship integrity
- slug uniqueness
- taxonomy consistency

Expected:

- no new P0/P1 data-quality regression;
- duplicate candidates resolved or explicitly deferred;
- no broken references;
- no numeric integrity regression.

---

# SPEC 19 — Search / Filter / Finder Compatibility

Verify all newly added entities are discoverable through existing systems.

Check:

- Database listing
- Database filters
- range filters
- URL state
- Finder
- entity detail routes
- relationship sections
- search where applicable

New entities must not require special-case code unless technically justified.

---

# SPEC 20 — Performance / Build Regression

Check:

- database query performance
- listing page rendering
- Finder load
- entity detail load
- build size if practical
- static generation impact if applicable

Do not optimize prematurely.

Only address regressions introduced by Phase 7.

---

# SPEC 21 — Tests

Add/update tests for:

- duplicate resolution
- new taxonomy values if any
- new entity records
- numeric integrity
- semantic consistency
- relationship integrity
- Finder compatibility
- coverage calculations

Run the complete test suite.

Document the known pre-existing failure:

`compare.test.ts` — expected 4 types while project has 5.

If that test has changed since Phase 6, re-evaluate rather than assuming it remains pre-existing.

---

# SPEC 22 — Full Verification

Run the project's canonical checks, including:

```bash
npx tsc --noEmit
npm run lint
npm test -- --run
```

If the TypeScript command has the same known project timeout, document it exactly.

Do not report a timeout as PASS.

Use:

```text
PASS
FAIL
TIMEOUT
```

separately.

Record:

- TypeScript
- ESLint
- Tests
- New failures
- Pre-existing failures
- Regression count

---

# SPEC 23 — Final Database Quality Gate

Before completion verify:

### Identity

- [ ] no unresolved critical duplicate
- [ ] no unsupported scientific identity
- [ ] no accidental morph/species duplication

### Data

- [ ] no fabricated values
- [ ] no numeric integrity errors introduced
- [ ] core fields reviewed
- [ ] semantic vocabulary consistent

### Relationships

- [ ] no broken references
- [ ] no stale references
- [ ] no speculative compatibility

### Coverage

- [ ] all Phase 6 P1 gaps addressed or explicitly deferred
- [ ] major P2 gaps addressed where evidence supports expansion
- [ ] remaining gaps documented

### Discovery

- [ ] all 23 journeys re-tested
- [ ] no regression in previously passing journeys

### Technical

- [ ] TypeScript status recorded
- [ ] ESLint status recorded
- [ ] test status recorded
- [ ] build status recorded if run

---

# SPEC 24 — Phase 7 Checkpoint

Create:

`DATABASE_COMPREHENSIVE_EXPANSION_AND_DATA_ACCURACY_PHASE_7_CHECKPOINT.md`

Include:

## Summary

- Status
- Date
- Branch
- Phase 6 baseline
- Final entity count
- Net additions
- Duplicate resolutions
- Backfilled entities/fields

## Entity Inventory

| Domain | Phase 6 | Phase 7 | Delta |
|---|---:|---:|---:|
| Species | | | |
| Plants | | | |
| Corals | | | |
| Equipment | | | |
| Invertebrates | | | |
| Problems | | | |
| Inspiration | | | |
| Total | | | |

## Coverage Delta

Include all major taxonomy groups and styles.

## Data Quality

- Critical identity issues
- Duplicate candidates
- Numeric integrity
- Missing P1/P2/P3 fields
- Uncertain records

## Relationships

- total
- added
- broken
- stale
- invalid

## Discovery Journeys

- PASS
- PARTIAL
- FAIL

## Verification

- TypeScript
- ESLint
- Tests
- Build
- Regressions

## Remaining Gaps

Explicitly list what remains and why.

## Phase 8 Readiness

State whether the database is ready for:

`DATABASE_FINAL_QA_INTEGRITY_FREEZE_PHASE_8`

Do not declare the database permanently complete merely because the planned 55–70 additions were reached.

---

# SPEC 25 — Update Current State

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

- Phase 7 completion
- current entity counts
- coverage status
- remaining gaps
- data-quality status
- relationship status
- test status
- Phase 8 recommendation

Do not remove historical Phase 1–6 information.

---

# 4. Definition of Done

Phase 7 is PASS only when:

- [ ] Phase 6 artifacts verified
- [ ] duplicate candidates reviewed
- [ ] P0 duplicate issues resolved/deferred with evidence
- [ ] expansion manifest created
- [ ] evidence protocol established
- [ ] species expansion completed
- [ ] plant expansion completed
- [ ] coral expansion completed
- [ ] invertebrate expansion completed
- [ ] equipment expansion completed
- [ ] critical existing data backfill completed/reviewed
- [ ] semantic consistency verified
- [ ] numeric integrity verified
- [ ] relationships verified
- [ ] all 23 discovery journeys re-tested
- [ ] coverage delta generated
- [ ] regression audit passed
- [ ] search/filter/Finder compatibility verified
- [ ] tests updated
- [ ] TypeScript status recorded
- [ ] ESLint verified
- [ ] test suite verified
- [ ] checkpoint created
- [ ] `AQUA_BLOG_CURRENT_STATE.md` updated

---

# 5. Important Strategic Constraint

The target **55–70 new entities is not a quota**.

The correct result may be:

```text
55
58
63
67
70
```

or another documented number.

The only valid reason for adding an entity is:

> **It closes a documented taxonomy/discovery gap and passes the full data-quality gate.**

Likewise, an entity must NOT be added simply because:

- a category looks numerically small;
- another website has it;
- a common name exists;
- it would make the database look larger.

---

# 6. Phase 7 Expected Outcome

At the end of Phase 7, AquaMind should have:

```text
Phase 6
Taxonomy + Gap Audit
        ↓
Phase 7
Verified Expansion + Accuracy
        ↓
Coverage substantially improved
Data quality preserved
Relationships preserved
Finder preserved
        ↓
Phase 8
Final QA + Integrity + Freeze
        ↓
DATABASE V1
COMPREHENSIVE BASELINE
```

Phase 8 will be the final independent quality gate before the database is treated as the long-term baseline.

---

# 7. Expected OpenCode Final Response

Return exactly this structure:

```text
PHASE 7 COMPLETE

Status: PASS / FAIL

Baseline:
- Phase 6 entities: X
- Final entities: X
- Net additions: X

Duplicate resolution:
- Candidates: X
- Resolved: X
- Deferred: X
- Remaining critical: X

Expansion:
- Species: +X
- Plants: +X
- Corals: +X
- Invertebrates: +X
- Equipment: +X

Backfill:
- P1 fields reviewed: X
- P1 fields fixed: X
- P2 fields fixed: X
- P3 fields fixed: X

Coverage:
- Styles Covered: X
- Styles Partial: X
- Styles Missing: X
- Major groups covered: X
- Remaining major gaps: X

Data Quality:
- Identity errors: X
- Duplicate candidates: X
- Numeric errors: X
- Broken references: X
- Invalid relationships: X

Discovery:
- PASS: X/23
- PARTIAL: X/23
- FAIL: X/23

Verification:
- TypeScript: PASS / FAIL / TIMEOUT
- ESLint: PASS / FAIL
- Tests: X/X
- Build: PASS / FAIL / NOT RUN
- New regressions: X

Phase 8 readiness:
- READY / NOT READY

Checkpoint:
DATABASE_COMPREHENSIVE_EXPANSION_AND_DATA_ACCURACY_PHASE_7_CHECKPOINT.md
```

Never claim PASS unless every mandatory specification passed.
