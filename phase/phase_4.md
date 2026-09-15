# AquaMind — Phase 4
# WEB-04 Database / Entity SEO Audit & Implementation

## 0. OBJECTIVE

Implement **WEB-04 only**.

Authoritative specification:

`docs/AQUAMIND_WEB_04_DATABASE_ENTITY_SEO.md`

The WEB-04 specification is the source of truth. Read it completely before auditing or changing code.

Current baseline:

- WEB-01 — Technical SEO & Indexation: PASS
- WEB-02 — Information Architecture: PASS WITH BACKLOG
- WEB-03 — Internal Linking Architecture: PASS WITH BACKLOG
- WEB-04 — Database / Entity SEO: NEXT

Primary goal:

Make AquaMind's entity/database pages technically correct, useful, discoverable, and SEO-ready **without creating thin-page or index-bloat problems**.

---

# 1. NON-NEGOTIABLE SCOPE

Work on **WEB-04 only**.

Do NOT implement:

- WEB-05 Tools
- WEB-06 Problems / Diagnosis
- WEB-07 Analytics / Growth
- WEB-08 UX / Performance / Animation

If WEB-04 reveals a dependency belonging to a later phase:

1. document it;
2. implement only the minimum dependency if absolutely required for WEB-04;
3. do not expand scope.

When WEB-04 is complete:

**STOP.**

Do not automatically start WEB-05.

---

# 2. READ FIRST

Before touching source code, read:

1. `docs/AQUAMIND_WEB_04_DATABASE_ENTITY_SEO.md`
2. `AQUA_BLOG_CURRENT_STATE.md` or the canonical CURRENT_STATE file
3. `WEB-03_CHECKPOINT.md`
4. `WEB-03_GAP_REPORT.md` if available
5. relevant Sanity schemas
6. entity data/query utilities
7. all current entity route/page implementations
8. existing SEO / JSON-LD utilities

Do not assume CURRENT_STATE or previous checkpoints are perfectly accurate.

Verify important claims against source.

Do not silently replace the WEB-04 specification with general SEO best practices.

---

# 3. REQUIRED EXECUTION ORDER

Follow this exact order:

```text
1. Read WEB-04 specification
        ↓
2. Audit source architecture
        ↓
3. Audit Sanity/entity schema
        ↓
4. Audit entity routes/templates
        ↓
5. Audit metadata/indexability
        ↓
6. Audit structured data
        ↓
7. Audit thin-page/index-bloat risk
        ↓
8. Audit entity relationships
        ↓
9. Map requirements → evidence
        ↓
10. Create WEB-04_GAP_REPORT.md
        ↓
11. Define implementation scope
        ↓
12. Implement only approved WEB-04 fixes
        ↓
13. Run tests
        ↓
14. Run lint
        ↓
15. Run production build
        ↓
16. Verify representative production pages
        ↓
17. Update CURRENT_STATE
        ↓
18. Create WEB-04_CHECKPOINT.md
        ↓
19. STOP
```

Do not skip the audit stage.

Do not start coding simply because a gap looks obvious.

---

# 4. STEP 1 — ENTITY ROUTE INVENTORY

Audit all current public entity surfaces.

At minimum:

```text
/database

/species
/species/[slug]

/plants
/plants/[slug]

/corals
/corals/[slug]

/invertebrates
/invertebrates/[slug]

/equipment
/equipment/[slug]

/wiki
```

Also discover additional entity-like routes from source.

For each route/page type record:

```text
Route
Entity type
Purpose
Data source
Sanity schema/model
Slug source
Rendering mode
Indexability
Canonical
Title
Meta description
H1
Breadcrumb
Open Graph
Twitter
JSON-LD
Images
Internal links
Related resources
Unique content
Potential thin-page risk
Status
Evidence
```

Use actual source evidence.

---

# 5. STEP 2 — SANITY / ENTITY SCHEMA AUDIT

Inspect actual Sanity schemas and data access code.

For every entity type determine:

```text
Required fields
Optional fields
Slug
Published state
Draft state
Images
Descriptions
Taxonomy
References
Relationships
SEO fields
```

Explicitly investigate whether the schema supports:

```text
Entity → Articles
Entity → Problems
Entity → Tools
Entity → Related Entities
Entity → Learning
Entity → Styles / Inspiration
```

Do not fabricate relationships.

If a required relationship is unavailable because of the CMS schema:

```text
Document:
CMS/schema dependency
```

Do not perform a broad schema migration unless WEB-04 explicitly requires it.

---

# 6. STEP 3 — ENTITY PAGE QUALITY

Select representative pages from:

```text
Species
Plants
Corals
Invertebrates
Equipment
```

Inspect the actual rendered pages.

Evaluate whether each page contains meaningful information beyond:

```text
Name
Image
Short description
```

Determine whether users can understand:

- what the entity is;
- why it is relevant;
- aquarium context;
- useful requirements/details where available;
- related resources;
- next useful action.

Do not invent missing facts.

Do not generate filler text merely to increase word count.

---

# 7. STEP 4 — THIN-PAGE / INDEX-BLOAT AUDIT

This is a critical requirement.

Do not assume:

```text
More entity URLs indexed = more traffic.
```

Evaluate whether each entity page has enough unique value to justify indexing.

Classify representative/current pages as:

```text
INDEXABLE / STRONG
INDEXABLE / NEEDS IMPROVEMENT
LOW-VALUE / SHOULD NOT BE INDEXED
DATA-INCOMPLETE
UNKNOWN
```

If WEB-04 specification defines a specific threshold, follow it.

If the specification does not define a threshold, document the uncertainty rather than inventing one.

The objective is:

```text
Useful entity page
→ real search intent
→ unique value
→ strong relationships
→ technically correct indexability
```

not:

```text
Every CMS record
→ automatic SEO page
→ index everything
```

---

# 8. STEP 5 — INDEXABILITY / CANONICAL AUDIT

Inspect entity detail pages for:

- robots metadata
- canonical
- sitemap inclusion
- title
- meta description
- H1
- Open Graph
- Twitter
- JSON-LD
- duplicate URL patterns
- query/filter URLs
- unpublished/draft exposure

Verify that valid entity pages are not accidentally:

- `noindex`;
- canonicalized incorrectly;
- missing from sitemap when they should be included;
- exposed through duplicate canonical URLs.

Preserve WEB-01 behavior.

Especially:

```text
/search
```

must not accidentally become indexable.

Do not undo existing technical SEO fixes.

---

# 9. STEP 6 — METADATA CONSISTENCY

For each entity family compare:

```text
Page title
Meta title
H1
Breadcrumb label
OG title
Twitter title
JSON-LD name
```

They should represent the same entity naturally.

Avoid:

- keyword stuffing;
- repetitive boilerplate;
- artificial SEO suffixes;
- inconsistent naming;
- duplicate titles.

Do not change public URLs/slugs simply to improve title wording.

---

# 10. STEP 7 — STRUCTURED DATA AUDIT

Inspect the existing JSON-LD implementation before adding anything.

For each entity family determine:

```text
Current JSON-LD
Schema type
Available properties
Missing properties
Visible-page consistency
Validity risk
WEB-04 requirement
Action
```

Important rules:

- Do not blindly use `Product`.
- Do not invent ratings.
- Do not invent reviews.
- Do not invent prices.
- Do not invent offers.
- Do not invent authors.
- Do not invent measurements.
- Do not invent dates.
- Do not add properties that are unsupported by actual page data.

Structured data must accurately describe the visible page/entity.

If structured data is not appropriate:

```text
N/A
```

is acceptable when supported by the specification.

---

# 11. STEP 8 — ENTITY CONTENT MODEL

Determine whether current entity schemas contain enough useful structured information.

Inspect fields that could support meaningful entity pages.

Do not add large numbers of new CMS fields simply because they might help SEO.

If additional fields are required:

```text
Document:
Schema enhancement opportunity
```

Only modify the schema when the WEB-04 specification explicitly requires it and the change is safe.

Do not perform a broad CMS redesign.

---

# 12. STEP 9 — DATABASE / WIKI RELATIONSHIP

Audit:

```text
/database
/wiki
/species
/plants
/corals
/invertebrates
/equipment
```

Verify the conceptual relationship:

```text
Database
   ↓
Entity Type
   ↓
Entity Detail
   ↓
Related Knowledge
```

Database should function as a meaningful discovery system rather than a collection of isolated records.

WEB-02 already established the Database/Wiki relationship.

Do not duplicate WEB-02 work unnecessarily.

---

# 13. STEP 10 — ENTITY INTERNAL LINKS

WEB-03 already added entity resource relationships.

Audit current behavior:

```text
Entity
→ Articles
→ Problems
→ Tools
→ Related resources
```

Do not rebuild WEB-03.

Do not create duplicate resource sections.

If WEB-04 requires an additional entity-specific relationship, implement only that relationship.

If it requires new CMS relationships:

```text
Document dependency.
```

---

# 14. STEP 11 — CROSS-ENTITY RELATIONSHIPS

Investigate whether current data can reliably support relationships such as:

```text
Fish → Plants
Fish → Equipment
Fish → Problems
Fish → Articles

Plant → Fish
Plant → Equipment
Plant → Articles

Coral → Equipment
Coral → Problems
Coral → Articles

Equipment → Articles
Equipment → Problems
```

Only use relationships supported by actual data.

Do NOT infer biological compatibility, husbandry requirements, or suitability from keyword matching.

If reliable relationships are unavailable:

```text
Document:
Data/schema dependency
```

Do not create fake links.

---

# 15. STEP 12 — PAGINATION / FILTER / QUERY SAFETY

Inspect entity listing pages for:

- pagination;
- filtering;
- sorting;
- search;
- query strings;
- faceted navigation.

Ensure WEB-04 does not create an uncontrolled indexable URL space.

Do not make arbitrary filter combinations indexable unless WEB-04 explicitly requires it and they provide genuine unique value.

Preserve WEB-01 search/filter indexation decisions.

---

# 16. STEP 13 — IMAGE / MEDIA SEO

Audit entity images for:

```text
Alt text
Image availability
Image purpose
Open Graph usage
JSON-LD image usage where appropriate
```

Alt text must describe the actual image meaningfully.

Do not use keyword-stuffed alt text.

Do not generate missing imagery.

Handle missing images gracefully.

---

# 17. STEP 14 — ENTITY LISTING QUALITY

Audit:

```text
/species
/plants
/corals
/invertebrates
/equipment
```

Check:

- heading hierarchy;
- entity cards;
- descriptions;
- links;
- pagination;
- filters;
- crawlable detail links;
- empty states;
- duplicate records;
- sorting/filter behavior.

The listing page should help users discover useful entity pages.

Do not redesign the visual system.

---

# 18. STEP 15 — SEO VALUE DECISION

For each entity family determine:

```text
Why should this page exist?
What search/user intent does it satisfy?
What unique information does it contain?
What makes it different from another entity page?
What related resources does it expose?
Should it be indexable?
```

If a page does not have enough evidence for indexability:

```text
Document it.
```

Do not force indexation.

---

# 19. STEP 16 — GAP REPORT

Before implementation create:

`WEB-04_GAP_REPORT.md`

For every meaningful finding use:

```text
ID:
Entity Type:
Route:
Requirement:
Current State:
Evidence:
Gap:
Impact:
Priority:
Recommendation:
Implementation Scope:
```

Allowed statuses:

```text
IMPLEMENTED
PARTIAL
MISSING
BROKEN
N/A
UNKNOWN
```

Priority:

```text
P0 = critical
P1 = high
P2 = medium
P3 = low
```

Also include:

```text
## Entity Route Inventory

## Sanity Schema Findings

## Entity Page Quality

## Thin-Page / Index-Bloat Assessment

## Indexability / Canonical Findings

## Metadata Findings

## Structured Data Findings

## Image / Media Findings

## Cross-Entity Relationship Findings

## WEB-03 Dependencies

## Deferred CMS / Schema Work
```

---

# 20. IMPLEMENTATION RULES

Implement only changes justified by:

```text
WEB-04 requirement
+
verified source evidence
+
clear SEO/user value
```

Prefer:

- reusable components;
- existing schemas;
- existing data;
- stable slugs;
- server-side generation;
- accurate metadata;
- accurate structured data;
- graceful missing-data handling.

Avoid:

- mass AI-generated content;
- fake facts;
- fake specifications;
- fake relationships;
- broad CMS migration;
- URL migration;
- duplicate resource sections;
- index-bloat;
- unrelated UI redesign.

---

# 21. STRUCTURED DATA REGRESSION SAFETY

For every JSON-LD change:

1. verify schema type;
2. verify source data;
3. verify visible-page consistency;
4. serialize/render safely;
5. test affected route(s);
6. document intentional omissions.

Never make structured data richer than the actual page.

---

# 22. SEO REGRESSION SAFETY

WEB-04 must not:

- remove valid canonical tags;
- make `/search` indexable;
- expose drafts;
- create duplicate entity URLs;
- create filter crawl traps;
- remove required sitemap entries;
- introduce misleading metadata;
- introduce invalid JSON-LD;
- break WEB-01 changes.

---

# 23. PERFORMANCE SAFETY

Entity pages may scale significantly.

Do not introduce:

- N+1 Sanity queries;
- fetching the entire database per page;
- large client-side entity datasets;
- unnecessary client components;
- repeated identical CMS queries;
- huge serialized relationship payloads.

Use efficient existing query patterns.

Do not perform broad performance optimization; WEB-08 owns that scope.

---

# 24. TESTING

Record the baseline before implementation.

Current known baseline:

```text
Build: PASS
Lint: PASS
Tests: 210/211 passing
Known pre-existing failure:
compare.test.ts
```

After implementation run:

```text
lint
relevant entity tests
JSON-LD tests if available
metadata tests if available
sitemap tests
full test suite if practical
production build
```

Do not modify unrelated tests merely to eliminate the known pre-existing failure.

If test counts change, explain why.

---

# 25. PRODUCTION VERIFICATION

Verify representative real pages from every entity family.

At minimum:

```text
/database

/species
/species/<real-existing-slug>

/plants
/plants/<real-existing-slug>

/corals
/corals/<real-existing-slug>

/invertebrates
/invertebrates/<real-existing-slug>

/equipment
/equipment/<real-existing-slug>

/wiki
```

Discover real slugs from the application. Do not invent slugs.

For each representative page verify:

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
Visible entity content
Internal links
Images
No broken links
```

---

# 26. MOBILE VERIFICATION

For representative entity detail pages verify:

- header;
- breadcrumbs;
- entity information;
- images;
- resource links;
- cards/tables;
- navigation;
- no horizontal overflow.

Do not perform visual redesign.

---

# 27. CURRENT_STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-04 status
Entity families audited
Implemented changes
Indexability decisions
Structured-data status
Thin-page assessment
Schema dependencies
Known limitations
Deferred work
Tests
Lint
Build
Production verification
Remaining backlog
```

---

# 28. WEB-04 CHECKPOINT

Create:

`WEB-04_CHECKPOINT.md`

Use this structure:

```text
# WEB-04 CHECKPOINT

## Status

PASS / PASS WITH BACKLOG / BLOCKED

## Specification

WEB-04 Database / Entity SEO

## Requirements

X/Y verified

## Entity Families Audited

- Species
- Plants
- Corals
- Invertebrates
- Equipment

## Entity Route Inventory

Summary.

## Sanity / CMS Schema

Summary.

## Entity Page Quality

Summary.

## Thin-Page / Index-Bloat Assessment

Summary.

## Indexability

Summary.

## Structured Data

Summary.

## Implemented

Exact files and changes.

## Deferred

Exact items and reasons.

## Dependencies

WEB-05+ or CMS/schema dependencies.

## Tests

Results.

## Lint

Result.

## Build

Result.

## Production Verification

Routes and results.

## Current State

Updated: YES/NO

## Known Issues

List.

## Next Phase

WEB-05
```

---

# 29. CHECKPOINT DECISION

### PASS

Core WEB-04 requirements are implemented and verified.

### PASS WITH BACKLOG

Core WEB-04 architecture is correct and remaining work is non-blocking and documented.

### BLOCKED

A critical WEB-04 requirement cannot be completed or verified.

If BLOCKED:

```text
STOP.
Do not proceed to WEB-05.
```

---

# 30. FINAL STOP RULE

After creating:

```text
WEB-04_GAP_REPORT.md
WEB-04_CHECKPOINT.md
```

and updating:

```text
AQUA_BLOG_CURRENT_STATE.md
```

STOP.

Do not:

- start WEB-05;
- redesign Tools;
- redesign Problems;
- implement analytics;
- add animation;
- perform broad performance work;
- create blog content;
- select the next article;
- modify Topic Management.

Final response must contain exactly this summary format:

```text
WEB-04 completed.

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
WEB-04_CHECKPOINT.md

Next:
WEB-05
```

Then stop.
