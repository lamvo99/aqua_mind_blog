# DATABASE FOUNDATION PHASE

## Purpose
Repair and strengthen the existing AquaMind Database foundation before expanding entity coverage.

Execution MUST be sequential:

SPEC 1 → verify PASS → SPEC 2 → verify PASS → ... → SPEC 6 → final verification.

If any spec FAILS, STOP and report the blocker. Do not continue.

## Source of Truth
Use `DATABASE_EXPANSION_ROADMAP.md` as the planning baseline.

Known findings:
- 177 current database entities
- 19 problems
- 10 inspiration objects
- `relatedPosts` = 0 populated
- `compatibleSpecies` = 0 populated
- equipment specifications = 0% populated
- Plant/Coral `difficulty` is not fetched in GROQ
- Coral `coralType` is fetched but not displayed

Re-inspect the current source before making changes. Do not blindly trust these counts.

## Global Rules
- Do NOT add the planned 30 entities.
- Do NOT add Tier-2 entities.
- Do NOT redesign Database UI.
- Do NOT change unrelated SEO/content/image systems.
- Do NOT create WEB-09.
- Do NOT refactor unrelated code.
- Do NOT invent data or relationships.
- Preserve existing CMS data.
- Before CMS writes, identify exact document type, field, and convention.
- If a relationship cannot be supported by existing project evidence, leave it unpopulated and document why.

---

# SPEC 1 — FIX PLANT `difficulty` FETCH

### Objective
Fix the GROQ/query issue where Plant `difficulty` exists in the source but is not returned to the frontend.

### Steps
1. Locate Plant schema/data definition.
2. Locate Plant GROQ query.
3. Confirm `difficulty` exists in source.
4. Add/fix the projection.
5. Update type/interface only if required.
6. Run relevant tests/lint.
7. Build.
8. Verify a Plant detail page.

### PASS
- `difficulty` is fetched correctly.
- No unrelated fields removed.
- Tests/lint/build pass.
- Plant page no longer has `undefined` caused by this issue.

STOP if FAIL.

---

# SPEC 2 — FIX CORAL `difficulty` FETCH

### Objective
Fix the equivalent Coral GROQ/query issue.

### Steps
1. Locate Coral schema/data definition.
2. Locate Coral GROQ query.
3. Confirm `difficulty` exists.
4. Add/fix projection.
5. Update types only if required.
6. Run tests/lint.
7. Build.
8. Verify a Coral detail page.

### PASS
- Coral `difficulty` is returned correctly.
- No unrelated regression.
- Tests/lint/build pass.

STOP if FAIL.

---

# SPEC 3 — DISPLAY CORAL `coralType`

### Objective
`coralType` is already fetched but is not displayed.

### Steps
1. Locate Coral detail page/component.
2. Confirm `coralType` is in the query result.
3. Follow the existing structured-attribute UI pattern.
4. Display `coralType`.
5. Do not redesign the page.
6. Add/update a focused test if appropriate.
7. Run tests/lint.
8. Build.
9. Verify Coral detail page.

### PASS
- Existing `coralType` is visibly rendered.
- No duplicate/conflicting field.
- Layout remains consistent.
- Tests/lint/build pass.

STOP if FAIL.

---

# SPEC 4 — EQUIPMENT SPECIFICATIONS FOUNDATION

### Objective
Determine why equipment specifications are reported as 0% populated.

Classify the cause as one or more:
- missing CMS/source data;
- missing query mapping;
- missing frontend display;
- schema limitation;
- combination.

### Rules
DO NOT invent equipment specifications.
DO NOT populate generic assumptions.

### Steps
1. Inspect Equipment schema.
2. Inspect seed/source data.
3. Inspect Sanity documents if accessible.
4. Inspect Equipment GROQ query.
5. Inspect Equipment detail UI.
6. Map: Schema → Data → Query → Model → UI.
7. Identify exact blocker.
8. If only data entry is missing, document it as a data-population backlog.
9. If an existing-field code bug is proven, implement only the minimal fix.
10. Run tests/lint/build.

### PASS
The current 0% state has a documented, verified explanation and any necessary safe code fix is complete.

Do not fabricate missing data.

STOP if FAIL.

---

# SPEC 5 — `relatedPosts` FOUNDATION

### Objective
Determine why `relatedPosts` is populated on zero entities and establish/repair the relationship pipeline where justified.

### Steps
1. Inspect entity schemas.
2. Inspect `relatedPosts` definitions.
3. Inspect GROQ projections.
4. Inspect frontend rendering.
5. Inspect current CMS/source data.
6. Determine whether the problem is schema, query, UI, missing data, or generation/mapping.

### Relationship rules
Only use:
- explicit CMS references;
- existing deterministic project mappings;
- clearly documented existing relationships.

Never:
- guess from names;
- use undocumented keyword matching;
- invent relevance;
- mass-link every article.

Do not attempt to populate all 177 entities.

Start with a small verified sample only where evidence exists.

### PASS
- Relationship pipeline is understood.
- A small verified sample works if supported by evidence.
- No fabricated relationships.
- Tests/lint/build pass.

STOP if FAIL.

---

# SPEC 6 — `compatibleSpecies` FOUNDATION

### Objective
Determine whether `compatibleSpecies` is schema-only, query-only, UI-only, missing, or simply unpopulated.

### STRICT RULE
Compatibility is domain data. Do NOT invent compatibility relationships.

Use only:
- explicit existing project data;
- existing documented compatibility mappings;
- data already present in the project.

If evidence is insufficient, do NOT populate compatibility. Document the required future data source/workflow instead.

### Steps
1. Inspect schemas.
2. Inspect queries.
3. Inspect models/types.
4. Inspect frontend.
5. Inspect current data.
6. Establish the pipeline.
7. Implement only missing infrastructure where necessary.
8. Do not bulk-populate speculative relationships.
9. Test with verified existing data if available.

### PASS
- Compatibility pipeline is understood.
- No unsupported compatibility claims introduced.
- Minimal implementation, if needed, is verified.
- Tests/lint/build pass.

STOP if FAIL.

---

# FINAL VERIFICATION

Only after SPEC 1–6 all PASS:

- lint
- full relevant test suite
- production build
- representative Database routes

Verify at minimum:
- one Plant detail page
- one Coral detail page
- one Equipment detail page
- one Species detail page
- one Invertebrate detail page

Also verify:
- no Database regression;
- no image regression;
- no unrelated data loss;
- no new TypeScript errors.

---

# REQUIRED CHECKPOINT

Create:

`DATABASE_FOUNDATION_CHECKPOINT.md`

Include:

## Executive Summary
- overall status
- completed specs
- blocked specs
- exact blocker

## Spec-by-Spec
For SPEC 1–6:
- Status
- Files
- Changes
- Verification

## Equipment Findings
Separate:
- code issue
- schema issue
- missing data
- CMS/manual work

## Relationship Findings
For `relatedPosts` and `compatibleSpecies`, state:
- implemented;
- data-population required;
- blocked;
- not safe to populate yet.

## Verification
- lint
- tests
- build
- route verification

## Remaining Backlog
Only foundation work. Do NOT include Tier-1 entity expansion.

## Final Response
Return:
- DATABASE FOUNDATION STATUS
- SPEC 1–6 status
- Tests
- Build
- Checkpoint
- Next exact action

# STRICT EXECUTION RULE

PASS one spec → only then move to the next.

Never skip a failed spec.
