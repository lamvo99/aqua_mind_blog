# DATABASE_PHASE_12_1_TAXONOMY_DATA_INTEGRITY_HOTFIX.md

**Project:** AquaMind Blog / Website  
**Phase:** 12.1 — Taxonomy Data Integrity Hotfix  
**Purpose:** Correct taxonomy / alias / local-name semantic errors exposed by Phase 12 before Phase 13.  
**Scope:** Data integrity only. No new entities. No schema redesign.

---

## 0. ROLE

You are the implementation engineer for the AquaMind website database.

Execute this phase strictly and sequentially.

The goal is **not** to improve search coverage artificially.

The goal is:

> **Every alias/local name must resolve to the correct canonical entity.**

A benchmark score of 100% is NOT sufficient if the expected entity mapping itself is wrong.

**Accuracy > coverage > quantity.**

If a term cannot be mapped confidently, leave it unresolved/null rather than guessing.

---

## 1. AUTHORITATIVE CONTEXT

Phase 12 added:

### Species
- `localNames`
- `aliases`
- `group`
- `parentSpecies`

### Plants
- `localNames`
- `aliases`
- `group`

### Corals
- `localNames`
- `aliases`
- `group`

### Invertebrates
- `localNames`
- `aliases`
- `parentSpecies`

Phase 12 upgraded search to use:

```text
name
scientificName
aliases
localNames
```

with ranking:

```text
Exact canonical name
→ Exact scientific name
→ Exact alias
→ Exact local name
→ Name starts with
→ Name contains
→ Other
```

Phase 12 reported 50/50 search benchmark coverage, but the benchmark contains a semantic issue:

```text
Kim Long → Jardini Arowana
```

This must be independently verified.

The Phase 12 migration report also recorded:

```text
Jardini Arowana: Kim Long
```

This is the primary integrity issue for Phase 12.1.

---

## 2. HARD RULES

### Rule 1 — No new entities

Do NOT create new species, plants, corals, invertebrates, problems, or equipment.

### Rule 2 — No schema changes

Do NOT add, remove, rename, or redesign fields.

### Rule 3 — No guessing

If a local/trade name is ambiguous:

```text
DO NOT GUESS
→ leave unresolved
→ document it
```

### Rule 4 — Species ≠ morph ≠ trade name

Do not create separate species for color morphs, regional trade names, or aquarium trade variants.

Use canonical species + verified `localNames` / `aliases` and `parentSpecies` only when justified.

### Rule 5 — Search success is not proof of correctness

A query returning an entity does not prove that the entity is the correct semantic target.

---

# SPEC-00 — BASELINE

Before changing anything:

1. Read:
   - `AQUA_BLOG_CURRENT_STATE.md`
   - Phase 12 checkpoint
   - Phase 12 migration report
   - Phase 12 search benchmark
   - relevant schema definitions
   - current database/search implementation

2. Record:
   - species count
   - plant count
   - coral count
   - invertebrate count
   - total published entities
   - draft count

3. Record current values for:
   - Asian Arowana
   - Jardini Arowana
   - Silver Arowana
   - Arapaima

including:
```text
name
scientificName
localNames
aliases
group
parentSpecies
```

4. Record current search results for:
```text
Huyết Long
Kim Long
Ngân Long
Thanh Long
Hải Tượng Long
```

### Gate
Do not modify data until baseline is recorded.

---

# SPEC-01 — AROWANA TAXONOMY AUDIT

Audit all Arowana-related documents.

At minimum:
```text
Asian Arowana
Jardini Arowana
Silver Arowana
```

For every record inspect:
```text
name
scientificName
localNames
aliases
group
parentSpecies
```

Also inspect whether any Vietnamese term appears in more than one Arowana document.

Create an audit table:

| Term | Current Entity | Scientific Name | Intended Meaning | Correct? | Action |
|---|---|---|---|---|---|
| Huyết Long | ... | ... | ... | ... | ... |
| Kim Long | ... | ... | ... | ... | ... |
| Ngân Long | ... | ... | ... | ... | ... |
| Thanh Long | ... | ... | ... | ... | ... |

Do not assume the Phase 12 mapping is correct.

---

# SPEC-02 — VERIFY AROWANA NAMES

Verify the following before editing.

## Asian Arowana

Canonical species:
```text
Scleropages formosus
```

Evaluate individually:
```text
Huyết Long
Kim Long
Thanh Long
```

Determine whether each is:
- species-level
- morph/variant-level
- regional trade name
- ambiguous

If ambiguous, do not force a single mapping without sufficient evidence.

## Silver Arowana

Canonical species:
```text
Osteoglossum bicirrhosum
```

Verify:
```text
Ngân Long
```

## Jardini Arowana

Canonical species:
```text
Scleropages jardinii
```

Verify its legitimate common/trade names.

Do NOT use generic `Kim Long` for Jardini unless authoritative evidence specifically supports that mapping.

## Arapaima

Canonical species:
```text
Arapaima gigas
```

Verify:
```text
Hải Tượng Long
```

Do not alter a correct mapping.

---

# SPEC-03 — EXTERNAL VERIFICATION

For ambiguous biological/local-name mappings, use authoritative sources.

Preferred order:
1. FishBase
2. authoritative Vietnamese government/institutional sources
3. reputable scientific/taxonomic references

Do not use random aquarium-shop pages as the sole evidence for disputed scientific identity.

For every disputed term record:
```text
Term
Canonical entity
Scientific name
Source
Reason
Confidence
```

Clearly distinguish:
```text
Verified fact
Trade-name ambiguity
Unresolved
```

---

# SPEC-04 — CORRECT AROWANA DATA

Only after SPEC-01 to SPEC-03 pass:

Correct, where necessary:
```text
localNames
aliases
group
parentSpecies
```

Expected canonical identities:

### Asian Arowana
```text
scientificName = Scleropages formosus
group = Arowana
```

### Silver Arowana
```text
scientificName = Osteoglossum bicirrhosum
group = Arowana
```

### Jardini Arowana
```text
scientificName = Scleropages jardinii
group = Arowana
```

Do not invent missing aliases.

Do not move a term merely to make the benchmark pass.

---

# SPEC-05 — AUDIT ALL PHASE 12 VIETNAMESE TERMS

Audit every term introduced by Phase 12.

Minimum set:
```text
Huyết Long
Kim Long
Ngân Long
Thanh Long
Hải Tượng Long
Nẻ Nhật
Nẻ Điện
Nẻ Bút
Nẻ Sọc
Tôm Cherry
```

For every term verify:
1. Does it exist?
2. Is it attached to the correct entity?
3. Is it stored in the correct field?
4. Is the scientific identity correct?
5. Is it ambiguous?
6. Does search return the intended entity?

Do not automatically classify every Vietnamese term as `localNames`; preserve the model only when semantically justified.

---

# SPEC-06 — GROUP FIELD INTEGRITY

Phase 12 reported 42 species updated with aliases + group.

Audit those records.

Check:
```text
group is non-empty where explicitly assigned
group is semantically appropriate
no inconsistent free-form values
```

At minimum inspect:
```text
Arowana
Characin
Catfish
Pleco
Goby
Puffer
Tang
Angelfish
Cichlid
Other
```

Do not redesign the group vocabulary.

If a record cannot safely receive a group:
```text
leave null
document
```

---

# SPEC-07 — ALIAS / LOCAL NAME DUPLICATE AUDIT

Detect cases where the same term appears on multiple entities.

Especially inspect:
```text
Kim Long
Huyết Long
Thanh Long
Ngân Long
Arowana
Dragon Fish
Piranha
Bichir
Snakehead
```

For each collision:
```text
Term
Entity A
Entity B
Ambiguous?
Action
```

A term may legitimately be ambiguous.

Do not force a single entity merely to improve search.

---

# SPEC-08 — PARENT SPECIES INTEGRITY

Inspect `parentSpecies` references created or modified by Phase 12.

Rules:
- canonical species must not reference itself
- reference must point to an existing published entity
- no broken references
- no circular references
- do not use `parentSpecies` merely because two species share a trade name
- morph/variant relationship must be biologically justified

If no legitimate parent exists:
```text
null
```

---

# SPEC-09 — SEARCH SEMANTIC VALIDATION

After corrections, rerun:

```text
Arowana
Scleropages formosus
Huyết Long
Kim Long
Ngân Long
Thanh Long
Hải Tượng Long
Jardini Arowana
Scleropages jardinii
Silver Arowana
Osteoglossum bicirrhosum
```

Check:
```text
correct canonical entity
correct scientific identity
correct ranking
no misleading duplicate
```

---

# SPEC-10 — FULL 50-QUERY BENCHMARK

Rerun the complete Phase 12 benchmark.

Compare:
```text
Phase 12 expected entity
Phase 12 actual result
Phase 12.1 expected entity
Phase 12.1 actual result
```

Do not preserve an incorrect expected entity merely because it existed in the old benchmark.

If an expected mapping was wrong:
```text
correct the benchmark
document why
rerun it
```

Report separately:
```text
Search coverage
Semantic correctness
Ranking correctness
Ambiguous queries
Unresolved queries
```

Do not report only a single percentage.

---

# SPEC-11 — REGRESSION

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Also verify:
```text
/global search
/database
/species
/plants
/corals
/invertebrates
/finder
/entity detail pages
```

Verify:
- canonical URLs still work
- no duplicate pages
- no alias-only indexable pages
- Finder unchanged
- filters unchanged
- SEO unchanged
- no broken references

Expected Phase 12 baseline:
```text
Tests: 238/239
1 failure: pre-existing compare.test.ts
Lint: PASS
TypeScript: PASS
Build: PASS, 465 pages
```

If the existing failure changes or a new failure appears: STOP.

---

# SPEC-12 — SANITY DATA INTEGRITY

Verify:
```text
No unexpected entity creation
No unexpected deletion
No duplicate slugs
No broken references
No draft creation
No schema mutation
```

Expected:
```text
entity count unchanged
```

Record exact number of modified documents.

---

# SPEC-13 — HARD STOP CONDITIONS

STOP immediately if:
- scientific identity cannot be verified
- ambiguous trade name is forced into one entity
- duplicate entity would be created
- schema change becomes necessary
- broken reference appears
- benchmark is manipulated instead of corrected
- numeric data must be guessed
- new test failure
- new TypeScript error
- new lint error
- build regression
- unexpected Sanity mutation

Do not continue after a hard stop.

---

# SPEC-14 — FINAL REPORT

Create:

```text
report/DATABASE_PHASE_12_1_TAXONOMY_DATA_INTEGRITY_HOTFIX_CHECKPOINT.md
```

Include:

## Status
```text
PASS / PASS WITH DEFERRED ITEMS / FAIL
```

## Baseline
```text
entity counts
drafts
```

## Data Corrections

| Entity | Field | Before | After | Reason |
|---|---|---|---|---|

## Verified Vietnamese Terms

| Term | Canonical Entity | Scientific Name | Status |
|---|---|---|---|

## Ambiguous / Deferred Terms

| Term | Reason | Action |
|---|---|---|

## Search Benchmark
```text
Total queries
Correct semantic mappings
Ranking correct
Ambiguous
Unresolved
```

## Regression
```text
Tests
Lint
TypeScript
Build
Finder
Filters
Routes
SEO
```

## Sanity Integrity
```text
Created
Deleted
Modified
Broken refs
Duplicate slugs
Schema changes
```

---

# SPEC-15 — UPDATE CURRENT STATE

Update:
```text
AQUA_BLOG_CURRENT_STATE.md
```

Add a concise Phase 12.1 section containing:
```text
date
status
why phase was needed
data corrections
search benchmark result
tests
lint
TypeScript
build
deferred items
next phase readiness
```

Do not rewrite historical phase reports.

Do not silently alter previous checkpoint claims.

If Phase 12 had a semantic error, explicitly record that Phase 12.1 corrected it.

---

# FINAL GATE

Phase 12.1 is PASS only if:

- [ ] No new entities
- [ ] No schema changes
- [ ] Arowana taxonomy verified
- [ ] Kim Long mapping verified/corrected
- [ ] Huyết Long verified
- [ ] Ngân Long verified
- [ ] Thanh Long verified
- [ ] Hải Tượng Long verified
- [ ] Phase 12 Vietnamese terms audited
- [ ] `group` integrity audited
- [ ] alias/local-name collisions audited
- [ ] parentSpecies integrity verified
- [ ] search semantics verified
- [ ] full 50-query benchmark rerun
- [ ] benchmark expected mappings corrected where necessary
- [ ] no false positives introduced
- [ ] no broken references
- [ ] no unexpected Sanity mutations
- [ ] Finder regression PASS
- [ ] filters regression PASS
- [ ] routes regression PASS
- [ ] SEO regression PASS
- [ ] tests baseline maintained
- [ ] lint PASS
- [ ] TypeScript PASS
- [ ] build PASS
- [ ] checkpoint created
- [ ] `AQUA_BLOG_CURRENT_STATE.md` updated

Only after all gates pass:

```text
PHASE 12.1 = PASS
```

Then Phase 13 may be planned.

---

## IMPORTANT — OUT OF SCOPE

Do NOT implement:
- fuzzy search
- typo tolerance
- search analytics
- species catalogue expansion
- additional Vietnamese names solely for search coverage
- generic duplicate disease/species records
- content production
- images

This phase exists solely to ensure that the taxonomy/search foundation created in Phase 12 is **semantically correct before further search expansion begins**.
