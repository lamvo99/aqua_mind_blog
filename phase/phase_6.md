# AquaMind — Phase 6
# WEB-06 Problems / Troubleshooting / Diagnosis SEO & UX

## Objective

Implement **WEB-06 only**.

Authoritative specification:

`docs/AQUAMIND_WEB_06_PROBLEMS_DIAGNOSIS_SEO_UX.md`

Read the complete specification before making code changes. If the filename differs, locate the canonical WEB-06 specification under `docs/` and use that document as the source of truth.

Current baseline:

- WEB-01 Technical SEO & Indexation — PASS
- WEB-02 Information Architecture — PASS WITH BACKLOG
- WEB-03 Internal Linking — PASS WITH BACKLOG
- WEB-04 Database / Entity SEO — PASS WITH BACKLOG
- WEB-05 Tools / Utility SEO & UX — PASS WITH BACKLOG
- WEB-06 Problems / Troubleshooting / Diagnosis — NEXT

Primary goal:

Make AquaMind's Problems / Troubleshooting / Diagnosis surfaces useful, searchable, internally connected, technically SEO-ready, and safe from thin-page/index-bloat problems.

Preferred user flow:

```text
symptom
  ↓
possible cause
  ↓
checks / diagnosis
  ↓
safe corrective action
  ↓
relevant tool
  ↓
relevant database entity
  ↓
relevant educational article
```

This is a user-help system, not a collection of thin SEO pages.

---

# 1. NON-NEGOTIABLE SCOPE

Work on **WEB-06 only**.

Do NOT implement:

- WEB-07 Analytics / Search Console / Growth instrumentation
- WEB-08 broad UX / Performance / Animation
- new blog content
- topic-management work
- content-priority decisions
- ad/AdSense implementation
- broad Sanity redesign
- unrelated database restructuring

If WEB-06 exposes a later-phase dependency:

1. document it;
2. implement only the minimum dependency if required for WEB-06 correctness;
3. otherwise defer it.

When WEB-06 is complete:

**STOP.**

Do not automatically start WEB-07.

---

# 2. READ FIRST

Before touching source code, read:

1. `docs/AQUAMIND_WEB_06_PROBLEMS_DIAGNOSIS_SEO_UX.md`
2. `AQUA_BLOG_CURRENT_STATE.md`
3. `WEB-05_CHECKPOINT.md`
4. `WEB-05_GAP_REPORT.md` if available
5. `WEB-04_CHECKPOINT.md` if needed
6. relevant Problems/Diagnostic routes under `app/`
7. relevant components
8. relevant Sanity schemas and queries
9. existing SEO / JSON-LD utilities
10. relevant tests

Also inspect WEB-03 internal-linking implementation and WEB-05 Diagnostic implementation.

Verify important checkpoint claims against source.

Do not silently replace the WEB-06 specification with generic SEO advice.

---

# 3. REQUIRED EXECUTION ORDER

Follow exactly:

```text
Read WEB-06 specification
        ↓
Inventory Problems / Diagnosis surfaces
        ↓
Audit route architecture
        ↓
Audit Sanity schema / data model
        ↓
Audit problem-page quality
        ↓
Audit diagnostic behavior
        ↓
Audit SEO / metadata / indexability
        ↓
Audit structured data
        ↓
Audit internal linking
        ↓
Audit symptom → cause → action flow
        ↓
Audit safety / misleading-advice risk
        ↓
Audit mobile / accessibility
        ↓
Map requirements → evidence
        ↓
Create WEB-06_GAP_REPORT.md
        ↓
Define implementation scope
        ↓
Implement only approved WEB-06 changes
        ↓
Run tests
        ↓
Run lint
        ↓
Run production build
        ↓
Verify representative production routes
        ↓
Update CURRENT_STATE
        ↓
Create WEB-06_CHECKPOINT.md
        ↓
STOP
```

Do not skip the audit stage.

---

# 4. STEP 1 — PROBLEM / DIAGNOSIS INVENTORY

Search the complete source tree for all problem-related surfaces.

At minimum inspect:

```text
/problems
/problems/[slug]
/diagnostic
```

Also discover:

- troubleshooting pages;
- symptom pages;
- diagnosis components;
- problem categories;
- condition selectors;
- diagnostic result components;
- problem-related APIs/queries;
- problem-related CMS schemas.

Do not assume these are the only routes.

Create an inventory:

```text
Route
Problem/diagnostic type
Purpose
Data source
Sanity schema/model
Slug
Rendering mode
Indexability
Metadata
JSON-LD
Internal links
Tests
Status
```

---

# 5. STEP 2 — SANITY / PROBLEM SCHEMA AUDIT

Inspect actual CMS schemas and data queries.

Determine whether the Problem model supports:

```text
Name/title
Slug
Description
Symptoms
Causes
Severity
Solutions / corrective actions
Prevention
Related entities
Related articles
Related tools
Related problems
Images
Categories
Published state
SEO fields
Rich text
```

Do not assume these fields exist.

For important relationships determine:

```text
Supported
Partially supported
Not supported
```

If a missing relationship requires CMS schema work:

```text
Document it.
```

Do not perform a broad schema migration unless WEB-06 explicitly requires it.

---

# 6. STEP 3 — PROBLEM PAGE QUALITY

Select representative real problem pages.

Evaluate whether a user can understand:

```text
What is happening?
What symptoms should I look for?
What are likely causes?
What should I check first?
What action is appropriate?
What should I avoid?
What should I monitor?
Where can I learn more?
```

Do not pad pages with generic SEO text.

A problem page should solve a problem.

Avoid:

```text
symptom keyword
+
generic paragraph
+
keyword list
```

---

# 7. STEP 4 — SYMPTOM → CAUSE → ACTION MODEL

Audit the conceptual flow:

```text
Problem
  ↓
Symptoms
  ↓
Possible causes
  ↓
Checks
  ↓
Corrective actions
  ↓
Monitoring / follow-up
  ↓
Related resources
```

Do not imply certainty when multiple causes are possible.

Prefer careful wording such as:

```text
possible cause
common cause
check whether
may indicate
```

where appropriate.

Do not convert uncertain aquarium diagnosis into false certainty.

---

# 8. STEP 5 — DIAGNOSTIC TOOL AUDIT

Audit the existing `/diagnostic` implementation.

Determine:

```text
Inputs
Decision logic
Possible results
Result explanations
Problem mappings
Entity mappings
Tool mappings
Article mappings
Validation
Empty state
No-result state
Reset behavior
```

Inspect whether diagnostic logic is:

```text
deterministic
transparent
maintainable
testable
```

If existing logic is rule-based, preserve it unless evidence shows it is incorrect.

Do not introduce a complex diagnostic engine unless WEB-06 explicitly requires it.

---

# 9. STEP 6 — DIAGNOSTIC SAFETY

A diagnostic result must not pretend to be definitive when multiple causes are possible.

Audit:

```text
false certainty
missing alternatives
unsafe recommendations
missing escalation
overly broad treatment
```

Do not automatically recommend aggressive interventions, medication, or extreme parameter changes unless authoritative project content/data explicitly supports them.

If evidence is insufficient:

```text
Recommend a check.
```

rather than claiming certainty.

---

# 10. STEP 7 — SEO INTENT AUDIT

For each problem page determine:

```text
Primary search intent
User question
Useful answer
Unique value
Search-demand potential
Indexability
```

Do not create pages simply because a keyword exists.

Classify pages:

```text
INDEXABLE / STRONG
INDEXABLE / NEEDS IMPROVEMENT
LOW-VALUE / SHOULD NOT BE INDEXED
DATA-INCOMPLETE
UNKNOWN
```

Follow the WEB-06 specification when it defines explicit criteria.

---

# 11. STEP 8 — THIN-PAGE / INDEX-BLOAT AUDIT

This is mandatory.

Do not assume:

```text
More problem URLs = more traffic.
```

Check for:

- duplicate symptoms;
- duplicate causes;
- near-identical pages;
- empty CMS records;
- taxonomy-only pages;
- automatically generated combinations.

Do not mass-index low-value pages.

If indexability is uncertain, document the evidence and decision.

---

# 12. STEP 9 — METADATA / CANONICAL / ROBOTS

For every indexable problem page inspect:

```text
Title
Meta description
H1
Canonical
Robots
Open Graph
Twitter
Breadcrumb
Sitemap
```

Ensure metadata matches the actual problem.

Avoid:

- keyword stuffing;
- repetitive titles;
- generic descriptions;
- duplicate canonicals;
- accidental noindex;
- draft exposure.

Preserve WEB-01 fixes.

---

# 13. STEP 10 — STRUCTURED DATA

Inspect existing JSON-LD utilities.

Determine what structured data WEB-06 actually requires.

Potentially relevant types may include:

```text
BreadcrumbList
Article
HowTo
FAQPage
WebPage
```

Do not add a schema merely for SEO.

Important:

- Do not invent FAQ questions/answers.
- Do not mark hidden content as visible structured data.
- Do not invent authors/dates.
- Ensure structured data matches visible content.

If no suitable schema is justified:

```text
Document N/A.
```

---

# 14. STEP 11 — BREADCRUMBS

Verify problem pages have a coherent path such as:

```text
Home
  →
Problems
  →
Problem
```

Use the project's shared Breadcrumb component.

Do not duplicate custom breadcrumb implementations.

Verify BreadcrumbList JSON-LD matches the visible breadcrumb.

---

# 15. STEP 12 — INTERNAL LINKING

Audit:

```text
Problem → Article
Problem → Tool
Problem → Entity
Problem → Related Problem
Problem → Diagnostic
```

WEB-03 already established some internal-linking behavior.

Do not rebuild it.

Use contextual links rather than a generic link wall.

If a relationship cannot be derived reliably from actual data:

```text
Document CMS/schema dependency.
```

Do not use unsafe keyword-only inference for biological/husbandry relationships.

---

# 16. STEP 13 — DATABASE RELATIONSHIPS

Inspect whether Problems can reliably connect to:

```text
Species
Plants
Corals
Invertebrates
Equipment
Parameters
```

Only expose relationships supported by actual data.

Do not infer causality from name similarity.

If WEB-04 deferred references are needed, record the dependency rather than inventing links.

---

# 17. STEP 14 — DIAGNOSTIC → RESOURCE FLOW

Audit whether a result can lead to useful next actions:

```text
Diagnostic result
    ↓
Problem explanation
    ↓
What to check
    ↓
Tool
    ↓
Entity / Database
    ↓
Article / Learn
```

Do not force the flow where relevant resources do not exist.

Do not fabricate mappings.

---

# 18. STEP 15 — PROBLEM LISTING / HUB

Audit `/problems` if it exists.

Check:

- purpose;
- category organization;
- cards;
- descriptions;
- crawlable links;
- pagination;
- filters;
- search;
- empty states;
- duplicate entries;
- indexability.

Do not perform a broad UI redesign.

---

# 19. STEP 16 — FILTER / QUERY SAFETY

If Problems supports search/filter/sort/category/query parameters, audit URL behavior.

Prevent:

```text
infinite combinations
duplicate URLs
indexable parameter explosions
crawl traps
```

Do not make arbitrary filter combinations indexable.

---

# 20. STEP 17 — IMAGE / MEDIA AUDIT

For problem pages inspect:

```text
Image availability
Alt text
OG image
Image relevance
Missing-image handling
```

Alt text must describe the actual image.

Do not keyword-stuff or fabricate image content.

---

# 21. STEP 18 — ACCESSIBILITY / MOBILE UX

Audit representative Problem and Diagnostic pages.

Check:

```text
Semantic headings
Labels
Keyboard navigation
Focus states
Buttons
Radio/select controls
Error messages
Result readability
Mobile layout
Horizontal overflow
Tap-target usability
```

Do not perform a full accessibility redesign.

Fix only WEB-06-relevant issues.

---

# 22. STEP 19 — PERFORMANCE

Inspect whether Problems/Diagnostic pages cause:

- unnecessary CMS requests;
- N+1 queries;
- large client-side datasets;
- excessive hydration;
- expensive calculations;
- repeated rendering.

Implement only critical WEB-06 fixes.

Broad performance optimization belongs to WEB-08.

---

# 23. STEP 20 — TEST COVERAGE

Audit tests for:

```text
Problem rendering
Problem queries
Diagnostic decision rules
Input validation
Expected diagnostic results
Invalid input
Empty result
Reset
SEO metadata
JSON-LD
Breadcrumb
```

For diagnostic logic, cover:

```text
Normal path
Boundary path
Conflicting symptoms
Missing input
No matching result
Multiple plausible causes
```

Add focused regression tests for critical bugs discovered during WEB-06.

---

# 24. STEP 21 — GAP REPORT

Before implementation create:

`WEB-06_GAP_REPORT.md`

For every meaningful finding:

```text
ID:
Route:
Problem/Diagnostic:
Requirement:
Current State:
Evidence:
Gap:
Impact:
Priority:
Recommendation:
Implementation Scope:
```

Statuses:

```text
IMPLEMENTED
PARTIAL
MISSING
BROKEN
N/A
UNKNOWN
```

Priorities:

```text
P0 = critical
P1 = high
P2 = medium
P3 = low
```

Required sections:

```text
## Problem / Diagnostic Inventory
## Sanity / CMS Schema
## Problem Page Quality
## Symptom → Cause → Action Flow
## Diagnostic Logic
## Diagnostic Safety
## SEO Intent
## Thin-Page / Index-Bloat
## Metadata / Canonical / Robots
## Structured Data
## Breadcrumbs
## Internal Linking
## Entity Relationships
## Diagnostic → Resource Flow
## Problems Hub
## Filter / Query Safety
## Accessibility
## Mobile UX
## Performance
## Test Coverage
## WEB-04 Dependencies
## Deferred Items
```

---

# 25. IMPLEMENTATION RULES

Implement only changes justified by:

```text
WEB-06 requirement
+
verified source evidence
+
clear user value
+
clear SEO value
```

Prefer:

- existing data;
- existing schemas;
- reusable components;
- deterministic diagnostic logic;
- transparent rules;
- semantic HTML;
- accessible controls;
- contextual internal links;
- focused tests.

Avoid:

- fake diagnosis;
- fake causes;
- fake relationships;
- generic SEO filler;
- keyword stuffing;
- mass CMS migration;
- arbitrary indexation;
- broad visual redesign;
- unrelated analytics work.

---

# 26. CONTENT SAFETY / ACCURACY

AquaMind is an aquarium information website.

Problem/diagnostic guidance must be careful with:

```text
Water chemistry
Livestock health
Disease-like symptoms
Chemical dosing
Medication
Environmental stress
Equipment failure
```

Do not create new factual recommendations from guesswork.

If authoritative source data is insufficient:

```text
Document the gap.
```

Do not silently manufacture authoritative advice.

---

# 27. SEO SAFETY

WEB-06 must not:

- make `/search` indexable;
- expose drafts;
- create duplicate problem URLs;
- create filter crawl traps;
- remove valid canonicals;
- remove valid sitemap entries;
- add misleading JSON-LD;
- index empty/near-empty problem pages;
- break WEB-01 through WEB-05 behavior.

---

# 28. TESTING

Record the baseline before implementation.

Known baseline from WEB-05:

```text
Build: PASS
Lint: PASS
Tests: 210 pass / 1 pre-existing failure
Known pre-existing failure:
compare.test.ts
```

After implementation run:

```text
problem tests
diagnostic tests
SEO tests
JSON-LD tests
breadcrumb tests
sitemap tests
full test suite if practical
lint
production build
```

Do not modify unrelated tests just to remove the known pre-existing failure.

If test count changes, explain why.

---

# 29. PRODUCTION VERIFICATION

Verify representative real routes.

At minimum:

```text
/problems
/diagnostic
```

plus representative real:

```text
/problems/<existing-real-slug>
```

and every other problem/diagnosis route discovered during audit.

Do not invent slugs.

For each representative route verify:

```text
HTTP success
Title
Meta description
H1
Canonical
Robots
OG
Twitter
Breadcrumb
JSON-LD
Visible content
Internal links
Input/diagnostic behavior
Error state
No runtime errors
Mobile usability
```

---

# 30. DIAGNOSTIC SMOKE TEST

Execute at least:

```text
1 normal valid path
1 incomplete/invalid path
1 ambiguous/no-result path
1 reset/retry path
```

Record:

```text
Scenario
Input
Expected behavior
Actual behavior
PASS/FAIL
```

Do not claim correctness beyond the project's actual diagnostic rules.

---

# 31. CURRENT_STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-06 status
Problem routes audited
Diagnostic routes audited
Problem schema status
Diagnostic logic status
SEO status
Indexability decisions
Structured data
Internal linking
Safety findings
Accessibility
Mobile UX
Tests
Lint
Build
Production verification
Known limitations
Deferred CMS work
Remaining backlog
```

---

# 32. WEB-06 CHECKPOINT

Create:

`WEB-06_CHECKPOINT.md`

Use:

```text
# WEB-06 CHECKPOINT

## Status

PASS / PASS WITH BACKLOG / BLOCKED

## Specification

WEB-06 Problems / Troubleshooting / Diagnosis SEO & UX

## Requirements

X/Y verified

## Problem / Diagnostic Inventory

Summary.

## CMS / Sanity Schema

Summary.

## Problem Page Quality

Summary.

## Symptom → Cause → Action

Summary.

## Diagnostic Logic

Summary.

## Diagnostic Safety

Summary.

## SEO / Indexability

Summary.

## Structured Data

Summary.

## Internal Linking

Summary.

## Entity Relationships

Summary.

## Problems Hub

Summary.

## Accessibility / Mobile

Summary.

## Tests

Results.

## Lint

Result.

## Build

Result.

## Production Verification

Routes and results.

## Implemented

Exact files and changes.

## Deferred

Exact items and reasons.

## Dependencies

WEB-07+ or CMS/schema dependencies.

## Current State

Updated: YES/NO

## Known Issues

List.

## Next Phase

WEB-07
```

---

# 33. CHECKPOINT DECISION

### PASS

Core WEB-06 requirements are implemented and verified.

### PASS WITH BACKLOG

Core WEB-06 requirements are correct and remaining items are non-blocking and documented.

### BLOCKED

A critical WEB-06 requirement cannot be completed or verified.

If BLOCKED:

```text
STOP.
Do not proceed to WEB-07.
```

---

# 34. FINAL STOP RULE

After:

```text
WEB-06_GAP_REPORT.md
WEB-06_CHECKPOINT.md
```

are created and:

```text
AQUA_BLOG_CURRENT_STATE.md
```

is updated:

**STOP.**

Do not:

- start WEB-07;
- implement Search Console integration;
- choose future article topics;
- modify Topic Management;
- create blog content;
- implement AdSense;
- add advertising;
- add Home animation;
- perform broad performance optimization;
- redesign the website globally.

Final response must contain exactly:

```text
WEB-06 completed.

Status:
PASS / PASS WITH BACKLOG / BLOCKED

Build:
...

Tests:
...

Lint:
...

Production:
...

Current State:
Updated

Checkpoint:
WEB-06_CHECKPOINT.md

Next:
WEB-07
```

Then stop.
