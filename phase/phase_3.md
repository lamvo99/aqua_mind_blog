# AquaMind — Phase 3
# WEB-03 Internal Linking Architecture Audit & Implementation

## 0. Objective

Implement **WEB-03 only**.

Authoritative specification:

`docs/AQUAMIND_WEB_03_INTERNAL_LINKING_ARCHITECTURE.md`

WEB-01 is PASS.
WEB-02 is PASS WITH BACKLOG.

The purpose of this phase is to build a deliberate internal-linking architecture that improves:

- user discovery
- topical relationships
- crawlability
- contextual relevance
- navigation between AquaMind surfaces
- organic-search discoverability

Do not turn this into indiscriminate link insertion.

---

## 1. NON-NEGOTIABLE EXECUTION RULE

Work on **WEB-03 only**.

Do NOT implement WEB-04, WEB-05, WEB-06, WEB-07, or WEB-08.

If WEB-03 exposes a dependency belonging to a later specification:

1. document the dependency;
2. implement only the minimum dependency if WEB-03 cannot function correctly without it;
3. do not expand into the later specification.

When WEB-03 is complete, STOP.

Do not automatically start WEB-04.

---

## 2. READ FIRST

Before changing source code, read:

1. `docs/AQUAMIND_WEB_03_INTERNAL_LINKING_ARCHITECTURE.md`
2. `AQUA_BLOG_CURRENT_STATE.md` (or the canonical current-state file)
3. `WEB-02_CHECKPOINT.md`
4. `WEB-02_GAP_REPORT.md` if available
5. relevant routing/navigation documentation
6. relevant CMS schemas/data models

Important: WEB-02 left these deferred items:

- Problems → Database cross-links (needs CMS schema)
- Learn → Database cross-links (needs CMS schema)
- Styles → direct plant/equipment links
- Category overlap documentation

Audit these explicitly because WEB-03 is the next phase.

---

## 3. REQUIRED WORKFLOW

Follow exactly:

```text
Read WEB-03
    ↓
Audit current internal-link graph
    ↓
Audit WEB-02 deferred linking items
    ↓
Map requirements → evidence
    ↓
Create WEB-03 gap report
    ↓
Define implementation scope
    ↓
Implement WEB-03
    ↓
Run tests / lint / build
    ↓
Verify affected production routes
    ↓
Update CURRENT_STATE
    ↓
Create WEB-03_CHECKPOINT
    ↓
STOP
```

Do not skip the graph audit.

---

## 4. STEP 1 — BUILD THE CURRENT LINK GRAPH

Inspect source and identify actual internal links among these major surfaces:

```text
Home
Start Here
Learn
Articles / Posts
Categories
Database
Wiki
Species
Plants
Corals
Invertebrates
Equipment
Problems
Diagnosis
Tools
Finder
Inspiration
Styles
```

Create a current graph using actual implementation evidence.

At minimum identify:

```text
Source surface
Destination surface
Link type
Location/component
Static or data-driven
Conditional?
Evidence
```

Do not infer a relationship merely because two pages are conceptually related.

---

## 5. STEP 2 — CLASSIFY LINK TYPES

Classify important links as:

### Navigation links
Global/header/footer/navigation.

### Contextual links
Links inside content or explanatory UI.

### Related-content links
Related posts, related entities, related problems, related tools.

### CTA links
Purposeful next-action links.

### Structural hub links
Hub → subtopic/resource.

### Breadcrumb links
Hierarchy navigation.

The goal is not to maximize link count.

The goal is to maximize **useful connectedness**.

---

## 6. STEP 3 — TARGET ARCHITECTURE

Audit whether the site can support this graph:

```text
                         HOME
                          │
        ┌─────────────────┼──────────────────┐
        ↓                 ↓                  ↓
      LEARN            EXPLORE              SOLVE
        │                 │                  │
        ↓                 ↓                  ↓
    ARTICLES           DATABASE          PROBLEMS
        │                 │                  │
        └────────────┬────┴───────┬─────────┘
                     ↓            ↓
                   TOOLS       INSPIRATION
```

Supporting relationships to evaluate:

```text
Article → Entity
Article → Problem
Article → Tool
Article → Learning Path

Entity → Article
Entity → Problem
Entity → Tool

Problem → Article
Problem → Tool
Problem → Entity

Tool → Article
Tool → Entity
Tool → Problem

Inspiration → Style
Style → Plant
Style → Equipment
Style → Article

Learning Path → Article
Learning Path → Entity
Learning Path → Tool
Learning Path → Problem
```

These are target relationships, not permission to create fake links.

Only implement relationships where actual relevant destinations/data exist.

---

## 7. STEP 4 — AUDIT ORPHAN / WEAKLY CONNECTED PAGES

Find public indexable pages that appear weakly connected.

Prioritize:

- pages with no meaningful incoming internal links;
- important hubs with weak incoming links;
- important articles not reachable from relevant hubs;
- entities not connected to relevant content;
- problems without useful supporting resources;
- tools without relevant contextual entry points;
- styles without relevant resources.

Do not treat a page as orphan merely because it is reachable through global navigation.

Distinguish:

```text
True orphan
Weakly connected
Navigation-only
Well connected
```

If exact incoming-link analysis is not available from source, say so rather than inventing counts.

---

## 8. STEP 5 — LINK PRIORITY MODEL

Prioritize links based on:

```text
User usefulness
+
Topical relevance
+
Surface importance
+
Discoverability
+
Crawlability
```

High-priority examples:

```text
Article → highly relevant Tool
Article → relevant Problem
Article → relevant Entity
Problem → relevant Tool
Problem → relevant Article
Entity → relevant Article
Learning Path → relevant resources
Inspiration → relevant Style / knowledge
```

Avoid:

- unrelated links
- keyword-stuffed anchors
- repeated links with no added value
- link farms
- generic "click here" where a descriptive anchor is possible

---

## 9. STEP 6 — ANCHOR TEXT AUDIT

Inspect existing internal-link anchors.

Prefer descriptive, natural anchors.

Examples:

```text
water change calculator
nitrogen cycle
beginner aquarium setup
ammonia spike
neon tetra care
```

Avoid systematic keyword stuffing.

Do not rewrite article content merely to optimize anchor text unless that content is generated by a website component and the change clearly belongs to WEB-03.

For CMS-authored content, document recommendations rather than rewriting article bodies automatically.

---

## 10. STEP 7 — ARTICLE LINKING

Audit article templates and article-related components.

Check for useful paths:

```text
Article
→ Related articles
→ Relevant entity
→ Relevant problem
→ Relevant tool
→ Relevant learning path
```

Determine which are already implemented.

If the site already has a related-post mechanism, inspect how it selects content.

Do not blindly add multiple duplicate related sections.

The user should understand what to do next.

---

## 11. STEP 8 — ENTITY LINKING

Audit:

```text
Species
Plants
Corals
Invertebrates
Equipment
```

Check whether entity pages expose relevant:

```text
Articles
Problems
Tools
Related entities
Learning resources
```

Do not implement the full WEB-04 database/entity SEO architecture here.

WEB-03 only establishes useful internal-link relationships using the existing data model.

If missing data prevents a relationship:

```text
Document dependency.
```

---

## 12. STEP 9 — PROBLEMS / DIAGNOSIS LINKING

Explicitly audit the WEB-02 deferred requirement:

```text
Problems → Database
```

Also audit:

```text
Problem → Article
Problem → Tool
Problem → Entity
Diagnosis → relevant problem/resource
```

Do not modify diagnosis logic.

If CMS schema limitations prevent automatic linking, document exactly what schema/data is missing.

---

## 13. STEP 10 — LEARNING LINKING

Explicitly audit the WEB-02 deferred requirement:

```text
Learn → Database
```

Also inspect:

```text
Learn → Articles
Learn → Tools
Learn → Problems
Learn → Entities
```

Learning Paths should guide users to useful resources without becoming a dumping ground for links.

---

## 14. STEP 11 — INSPIRATION / STYLE LINKING

Explicitly audit:

```text
Styles → Plants
Styles → Equipment
```

Also:

```text
Inspiration → Styles
Inspiration → Articles
Inspiration → Setup resources
```

Only create links where the underlying entity/resource exists.

Do not fabricate relationships.

Do not redesign the visual UI; that belongs to WEB-08.

---

## 15. STEP 12 — TOOL LINKING

Audit:

```text
Tools → Articles
Tools → Problems
Tools → Entities
```

The tool should have useful contextual entry/exit points.

Do not redesign tool functionality; that belongs to WEB-05.

---

## 16. STEP 13 — HUB / SPOKE STRUCTURE

Evaluate whether important topical hubs connect to their supporting resources.

Example:

```text
Water Quality Hub
 ├─ pH
 ├─ GH
 ├─ KH
 ├─ TDS
 ├─ Ammonia
 ├─ Nitrite
 ├─ Nitrate
 ├─ Water Testing
 └─ Relevant Tools
```

Do not create thin hubs merely to satisfy a diagram.

Use existing strong pages where possible.

---

## 17. STEP 14 — INTERNAL LINKING IMPLEMENTATION BOUNDARY

Do not create an uncontrolled automated linker.

If implementing data-driven links:

- require a clear relationship;
- use stable IDs/slugs;
- avoid duplicate links;
- handle missing targets;
- preserve valid links after content changes;
- avoid rendering links to unpublished/deleted content;
- avoid circular UI patterns that add no user value.

If a relationship cannot be reliably derived from existing data, leave it documented for later schema/content work.

---

## 18. STEP 15 — GAP REPORT

Create:

`WEB-03_GAP_REPORT.md`

For each meaningful finding:

```text
ID:
Area:
Requirement:
Current State:
Evidence:
Gap:
Impact:
Priority:
Recommendation:
Implementation Scope:
```

Also include:

### Current Link Graph

### Target Link Graph

### Orphan / Weakly Connected Pages

### WEB-02 Deferred Items

### WEB-03 Implemented Relationships

### Deferred Relationships

### WEB-04+ Dependencies

---

## 19. IMPLEMENTATION RULES

Implement only justified WEB-03 changes.

Prefer:

- reusable link components;
- existing data relationships;
- server-side/static generation where appropriate;
- predictable rendering;
- descriptive anchors;
- graceful missing-data handling.

Avoid:

- hardcoding large link maps when data already exists;
- duplicating navigation systems;
- adding dozens of links to every page;
- changing URLs;
- changing canonical behavior;
- changing indexability;
- modifying article content in bulk;
- adding unrelated UI polish.

---

## 20. SEO SAFETY

Internal linking changes must not:

- create duplicate URLs;
- introduce unwanted query URLs;
- remove canonical tags;
- make noindex pages indexable;
- create crawl traps;
- create infinite pagination/filter link paths;
- link to invalid/unpublished content.

Preserve WEB-01 behavior, especially `/search` noindex.

---

## 21. PERFORMANCE SAFETY

Do not introduce:

- large client-side graph processing;
- unnecessary client components;
- expensive CMS queries;
- repeated database queries per card;
- N+1 fetching patterns;
- huge serialized link datasets.

If a reusable server-side relationship query is needed, implement it carefully and verify build/performance impact.

WEB-08 is the dedicated performance phase, so do not perform broad performance optimization here.

---

## 22. REGRESSION SAFETY

Before implementation record the current baseline where available.

After implementation run:

```text
lint
relevant tests
full tests if practical
production build
```

WEB-01 baseline:

```text
Build: PASS
Lint: PASS
Tests: 210/211 passing
Known pre-existing failure:
compare.test.ts
```

Do not modify unrelated tests just to remove the pre-existing failure.

---

## 23. PRODUCTION VERIFICATION

Verify affected routes after implementation.

At minimum:

```text
/
/start-here
/posts
/learn
/database
/wiki
/species
/plants
/corals
/invertebrates
/equipment
/problems
/tools
/finder
/inspiration
/styles/*
```

Verify:

- links resolve;
- anchors are correct;
- no broken internal links;
- navigation remains usable;
- no unwanted indexability changes;
- mobile remains functional;
- important destinations are actually discoverable.

---

## 24. CURRENT_STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-03 status
Implemented link architecture
Known limitations
Deferred relationships
WEB-04 dependencies
Tests
Lint
Build
Production verification
Remaining backlog
```

---

## 25. WEB-03 CHECKPOINT

Create:

`WEB-03_CHECKPOINT.md`

Use:

```text
# WEB-03 CHECKPOINT

## Status
PASS / PASS WITH BACKLOG / BLOCKED

## Specification
WEB-03 Internal Linking Architecture

## Requirements
X/Y verified

## Current Graph
Summary.

## Implemented
Exact changes.

## Deferred
Exact deferred items and reasons.

## WEB-02 Deferred Items
Status of each.

## Dependencies
WEB-04+ dependencies.

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
WEB-04
```

---

## 26. CHECKPOINT RULE

### PASS
Core WEB-03 requirements are verified and the internal-link architecture is functioning correctly.

### PASS WITH BACKLOG
Core architecture is correct; remaining items are non-blocking and documented.

### BLOCKED
A critical requirement cannot be completed or verified.

If BLOCKED:

> STOP.

Do not proceed to WEB-04.

---

## 27. FINAL STOP RULE

When WEB-03 checkpoint is complete:

STOP.

Do not:

- start WEB-04;
- implement database/entity SEO;
- redesign entity pages;
- redesign tools;
- redesign diagnosis;
- implement analytics;
- add animation;
- perform broad performance work.

Final response must contain:

```text
WEB-03 completed.

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
WEB-03_CHECKPOINT.md

Next:
WEB-04
```

Then stop.
