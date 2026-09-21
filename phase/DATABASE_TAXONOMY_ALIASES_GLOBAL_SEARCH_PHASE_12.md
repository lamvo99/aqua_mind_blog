# AquaMind Website — Database Taxonomy, Aliases & Global Search Foundation
## Phase 12 Implementation Specification

**Project:** AquaMind Website  
**Scope:** Website / Database / Search Infrastructure  
**Phase:** 12  
**Status:** READY FOR IMPLEMENTATION  
**Execution:** Strict sequential SPEC gates  
**Direction:** Database-first, accurate, scalable, no speculative data

---

## 0. Purpose

Phase 12 upgrades the frozen AquaMind database into a more discoverable knowledge system.

Focus:

1. Canonical database inventory.
2. Taxonomy metadata needed for discovery.
3. Verified local/common/trade names.
4. Verified aliases and scientific synonyms where appropriate.
5. Parent/variant relationships without misclassifying variants as species.
6. Alias-aware global search and ranking.
7. Vietnamese/local-name discovery.
8. Regression testing against the Phase 10 search benchmark.
9. Preservation of Finder, filters, routes, SEO and database integrity.

**This is not a content-production phase.**

Do not modify article content, content clusters, editorial workflows, images, or Sanity content-production processes unless required for a technical regression fix.

---

# 1. Non-Negotiable Rules

## 1.1 Accuracy over quantity

Never invent:

- aliases
- Vietnamese names
- scientific synonyms
- taxonomy
- parent/variant relationships
- species identity
- numeric parameters

If identity is uncertain:

> leave the field empty / unknown and document it.

Do not guess.

## 1.2 Canonical species identity

A morph, trade name, color form, locality form, or common aquarium variant must not automatically become a separate species.

Do not create duplicate species merely because hobbyists use different names.

## 1.3 Backward compatibility

Existing entity URLs, slugs, filters, Finder behavior, relationship references, SEO metadata, and Sanity documents must continue working unless a change is explicitly required by this phase.

## 1.4 Schema changes must be justified

First inspect whether a proposed concept already exists under another field.

Only implement fields with a clear Phase 12 use case.

## 1.5 No destructive migration without verification

Before deleting, merging, or changing identity:

- record the source document
- verify references
- verify slug
- verify scientific identity
- preserve useful data
- run relationship/reference checks

---

# 2. Phase Gate Model

Execute exactly in this order:

SPEC-00 → SPEC-01 → SPEC-02 → SPEC-03 → SPEC-04 → SPEC-05 → SPEC-06 → SPEC-07 → SPEC-08 → SPEC-09 → SPEC-10 → SPEC-11

If any SPEC fails:

> STOP. Do not continue.

At the end:

- create checkpoint
- update `AQUA_BLOG_CURRENT_STATE.md`
- record exact final inventory
- record deferred work

---

# SPEC-00 — Baseline & Canonical Inventory Integrity

## Objective

Establish a reliable baseline before changing taxonomy/search infrastructure.

## Tasks

Inspect:

- current Sanity schemas
- `lib/database.ts`
- search implementation
- database filters
- Finder implementation
- existing GROQ queries
- entity detail pages
- current relationship fields

Generate a canonical inventory containing:

```text
domain
documentId
slug
name
scientificName
waterType
family
group
aquariumStyle
region
existing semantic fields
existing relationship fields
```

Count:

- total documents
- published documents
- drafts
- per-domain totals
- duplicate slugs
- duplicate scientific names
- duplicate normalized names

Reconcile the historical Phase 10/11 count inconsistency.

Do not infer the canonical total from historical checkpoint numbers.

### PASS

- machine-generated canonical inventory exists
- counts are internally consistent
- published/draft counts are explicit
- no database mutation
- no duplicate slug introduced

### Hard Stop

If inventory cannot be generated reliably, STOP.

---

# SPEC-01 — Taxonomy Metadata Contract

## Objective

Design the smallest useful taxonomy/search metadata model.

Inspect whether each concept already exists under another field.

Evaluate:

### A. `localNames`

For:

- Vietnamese common names
- regional names
- established aquarium trade names
- verified local-language names

### B. `aliases`

For:

- alternate common names
- accepted search synonyms
- verified former/common scientific synonyms
- appropriate common spelling variants

### C. `parentSpecies`

Use only when an entity is genuinely a variant/morph/form that should resolve to a canonical species.

Do not use it for genus/family hierarchy, unrelated species, arbitrary “similar species”, or commercial product variants.

### D. `group`

Audit current null/empty values and determine whether they can be populated without guessing.

For every approved field define:

- type
- optional/required
- controlled/free text
- validation rules
- search behavior
- SEO impact
- Finder impact
- migration strategy

### PASS

A written field contract exists before schema modification.

No unnecessary full biological taxonomy is introduced.

---

# SPEC-02 — Schema Implementation

## Objective

Implement only the approved Phase 12 metadata model.

Tasks:

1. Add approved fields to appropriate schemas.
2. Keep new fields optional.
3. Add clear Studio descriptions.
4. Add validation only where safe and unambiguous.
5. Register schemas correctly.
6. Verify Studio recognizes fields.
7. Verify existing documents remain valid.

Do not build a complete biological taxonomy system.

### PASS

- TypeScript PASS
- schema compilation PASS
- Studio registration PASS
- existing documents remain valid
- no unexpected Sanity documents created/deleted

---

# SPEC-03 — Verified Alias / Local Name Migration

## Objective

Populate search metadata using only verified names.

Potential Phase 10 terms to audit include:

```text
Huyết Long
Kim Long
Ngân Long
Thanh Long
Cửu Sừng
Hải Tượng Long
nẻ nhật
nẻ điện
nẻ bút
nẻ sọc
```

Do not automatically treat every Vietnamese trade term as a species.

Classify each term:

- species → canonical species
- morph/variant → `parentSpecies` if appropriate
- broad group → do not attach to one species
- uncertain trade term → leave unresolved and document

Migration requirements:

- dry-run before mutation
- batch writes
- report changed documents
- no duplicate entity creation
- no slug changes unless explicitly required

### PASS

- no unverified alias inserted
- no identity collision
- no alias returns an obviously wrong entity
- migration report generated

---

# SPEC-04 — Variant / Parent Relationship Integrity

## Objective

Model variants without polluting species identity.

Priority audit:

- Arowana naming variants
- shrimp variants/morphs
- aquarium trade names
- records that may be variants rather than distinct species

Do not create a new species for a color/morph/trade variant unless taxonomically verified.

Where appropriate:

```text
variant
  ↓
parentSpecies
  ↓
canonical species
```

Requirements:

- parent reference points to valid canonical entity
- no self-reference
- no circular relationship
- no broken reference
- no unrelated parent

### PASS

- 0 broken parent references
- 0 circular parent references
- no duplicate species introduced
- variant handling documented

---

# SPEC-05 — Search Architecture Upgrade

## Objective

Make global search understand aliases and taxonomy metadata.

Preserve current search behavior for:

- name
- scientificName
- excerpt

Add, where technically appropriate:

### Layer 1 — Exact canonical name
Highest relevance.

### Layer 2 — Scientific name
High relevance.

### Layer 3 — Alias / local name
High relevance.

### Layer 4 — Group / semantic metadata
Lower relevance.

### Layer 5 — Excerpt/content discovery
Lower relevance.

Expected examples:

```text
Arowana
Huyết Long
Ngân Long
Sailfin Tang
Naso Tang
```

must resolve to appropriate canonical records when corresponding metadata is verified.

Preferred ranking:

```text
exact name
> exact scientific name
> exact alias/local name
> partial canonical name
> semantic metadata
> excerpt
```

Do not allow weak semantic matches to outrank exact identity.

## Fuzzy matching

Implement only if:

- exact ranking is preserved
- false positives do not materially increase
- no unnecessary heavy dependency is introduced
- benchmark tests show improvement

Otherwise document fuzzy matching as Phase 13 backlog.

### PASS

- existing queries continue working
- alias/local-name search works
- exact identity outranks weak matches
- unrelated entities are not exposed

---

# SPEC-06 — Vietnamese / Regional Discovery

## Objective

Improve discovery for Vietnamese aquarium terminology without changing canonical identity.

Canonical fields remain:

```text
name
scientificName
slug
```

Local terms are discovery metadata.

Do not:

- translate scientific names
- replace English canonical names
- create duplicate entities solely for Vietnamese names

### PASS

Verified Vietnamese/local terms from the Phase 10 audit resolve correctly.

Ambiguous or unverified terms remain unresolved rather than guessed.

---

# SPEC-07 — Search Benchmark & Discovery QA

## Objective

Measure whether Phase 12 improves search.

Re-run the Phase 10 50-query benchmark.

Record:

- query
- expected entity
- actual top result
- exact/partial/alias/no-result
- false positive
- ranking issue

Add tests for:

### Canonical

```text
Arowana
Scleropages formosus
Sailfin Tang
Naso Tang
```

### Local/alias

```text
Huyết Long
Ngân Long
Cửu Sừng
```

### Synonym

Use only verified synonyms.

### Typo

Test a small set of realistic typos.

### Ambiguous

Test terms that should not resolve to a single species.

### PASS

- baseline queries do not regress
- major Phase 10 no-result gaps are addressed where verified metadata exists
- no major false-positive increase
- benchmark report generated

Do not fabricate an improvement percentage.

---

# SPEC-08 — Database / Finder / Filter Regression

Verify:

### Database

- all 5 entity listings
- filters
- range filters
- semantic filters
- reset
- mobile filters

### Finder

- hard constraints
- soft constraints
- unknown handling
- URL state
- multi-domain results
- explainability

### Relationships

- relationship cards
- reverse lookups
- no broken references

### PASS

All existing Phase 9/11 functionality remains operational.

---

# SPEC-09 — Route / SEO / URL Regression

Verify:

- entity detail routes
- listing routes
- `/search`
- `/finder`
- `/database`
- sitemap generation
- metadata
- canonical URLs
- JSON-LD
- search URLs remain appropriately non-indexable

Aliases must not create duplicate indexable pages.

Search terms should resolve to canonical entity pages.

### PASS

- no broken canonical URLs
- no duplicate entity routes
- no accidental alias pages
- SEO behavior unchanged or improved

---

# SPEC-10 — Engineering Verification

Run:

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

If project-specific scripts differ, use existing documented equivalents.

Compare against Phase 11 baseline:

- Tests: 238/239, 1 pre-existing failure
- TypeScript: PASS
- Lint: PASS
- Build: PASS

A new failure is a hard stop.

Do not classify a new failure as pre-existing without proving it existed before Phase 12.

Do not ignore build errors.

---

# SPEC-11 — Final Audit, Checkpoint & Current State

Create:

### 1. Checkpoint

`DATABASE_TAXONOMY_ALIASES_GLOBAL_SEARCH_PHASE_12_CHECKPOINT.md`

### 2. Search benchmark

`DATABASE_PHASE_12_SEARCH_BENCHMARK.md`

### 3. Alias/local-name inventory

`DATABASE_PHASE_12_ALIAS_INVENTORY.json`

### 4. Taxonomy migration report

`DATABASE_PHASE_12_TAXONOMY_MIGRATION_REPORT.md`

Checkpoint must contain:

## Inventory

Exact:

- total
- published
- drafts
- species
- plants
- corals
- equipment
- invertebrates
- problems
- inspirations

## Schema

Every new field.

## Data

- aliases added
- local names added
- parent relationships added
- group values populated
- unresolved terms
- intentionally deferred terms

## Search

- benchmark result
- ranking behavior
- alias behavior
- local-name behavior
- fuzzy status

## Regression

- tests
- lint
- TypeScript
- build
- routes
- Finder
- filters
- relationships
- SEO

## Deferred

Explicitly preserve:

- exhaustive species catalogue
- images
- content production
- broad biological taxonomy
- speculative aliases
- unresolved trade names
- brand-specific equipment
- advanced fuzzy search if not safely implemented

---

# 3. Definition of Done

Phase 12 is PASS only if:

- [ ] canonical inventory is reliable
- [ ] taxonomy model is documented
- [ ] schema changes are minimal and justified
- [ ] aliases are verified
- [ ] local names are verified
- [ ] parent/variant relationships are valid
- [ ] no duplicate species introduced
- [ ] global search understands aliases/local names
- [ ] exact identity ranking is preserved
- [ ] Phase 10 benchmark is rerun
- [ ] no major regression exists
- [ ] Finder works
- [ ] filters work
- [ ] relationships work
- [ ] routes work
- [ ] SEO works
- [ ] tests pass except documented pre-existing failure
- [ ] lint passes
- [ ] TypeScript passes
- [ ] build passes
- [ ] checkpoint created
- [ ] `AQUA_BLOG_CURRENT_STATE.md` updated

---

# 4. Explicitly Out of Scope

Do NOT use Phase 12 to:

- produce articles
- modify the content plan
- write article bodies
- create article images
- expand the database indiscriminately
- build a full Linnaean taxonomy
- add unverified local names
- add speculative synonyms
- create duplicate species for morphs
- introduce a dedicated external search service
- build a graph database
- add prices or product availability
- change the content-production workflow

---

# 5. Expected Architecture

```text
                   AquaMind Database
                          │
              ┌───────────┴───────────┐
              │                       │
        Canonical Identity       Discovery Metadata
              │                       │
       Name / Scientific        Local Names
       Slug / Identity          Aliases
              │                  Synonyms
              │                  Group
              │                  Variants
              └───────────┬───────────┘
                          │
                    Global Search
                          │
              ┌───────────┼───────────┐
              │           │           │
          Database      Finder      Entity Page
              │           │           │
          Filters     Constraints   Relationships
```

The database remains the source of truth.

Search should help users discover the correct canonical entity rather than creating competing identities.

---

# 6. Stop Conditions

Immediately stop if:

1. A species identity cannot be verified.
2. An alias maps ambiguously to incompatible entities.
3. A migration would destroy useful data.
4. A duplicate is discovered but canonical identity is unclear.
5. Search ranking produces significant false positives.
6. A new field breaks Studio or production documents.
7. A relationship becomes broken or circular.
8. Finder/filter behavior regresses.
9. SEO/indexation behavior regresses.
10. A new test/lint/TypeScript/build failure appears.
11. Sanity shows unexpected document mutations.

Document the blocker and stop.

---

# 7. Final Principle

> **AquaMind should become easier to discover without becoming less accurate.**

The goal is not to make every possible aquarium term searchable.

The goal is:

**one canonical identity → many verified ways to discover it → one authoritative entity page.**
