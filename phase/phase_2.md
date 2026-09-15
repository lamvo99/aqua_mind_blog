# AquaMind — Phase 2
# WEB-02 Information Architecture Audit & Implementation

## 0. Objective

Implement **WEB-02 only**.

Authoritative specification:

`docs/AQUAMIND_WEB_02_INFORMATION_ARCHITECTURE_AUDIT.md`

WEB-01 has already been verified as PASS.

Goal: audit and improve AquaMind's information architecture, surface roles, navigation mapping, hub model, breadcrumbs, category governance, and cross-surface discoverability without rebuilding the website or changing the content strategy.

---

## 1. NON-NEGOTIABLE EXECUTION RULE

Work on **WEB-02 only**.

Do NOT implement WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, or WEB-08.

If WEB-02 exposes a dependency belonging to a later specification:
1. document the dependency;
2. implement only the minimum dependency if WEB-02 cannot function correctly without it;
3. do not expand into the later specification.

When WEB-02 is complete, STOP. Do not automatically start WEB-03.

---

## 2. READ FIRST

Before changing source code, read:

1. `docs/AQUAMIND_WEB_02_INFORMATION_ARCHITECTURE_AUDIT.md`
2. `AQUA_BLOG_CURRENT_STATE.md` (or the project's canonical current-state file)
3. `WEB-01_CHECKPOINT.md` if available
4. existing routing/navigation documentation

Do not assume CURRENT_STATE is perfectly accurate. Verify important claims against source.

---

## 3. REQUIRED WORKFLOW

Follow exactly:

```text
Read WEB-02
    ↓
Audit current source
    ↓
Audit production behavior where relevant
    ↓
Map requirements → evidence
    ↓
Create WEB-02 gap report
    ↓
Define implementation scope
    ↓
Implement WEB-02
    ↓
Run tests / lint / build
    ↓
Verify affected production routes
    ↓
Update CURRENT_STATE
    ↓
Create WEB-02_CHECKPOINT
    ↓
STOP
```

Do not skip the audit and immediately code.

---

## 4. CURRENT IA INVENTORY

Build a verified inventory of current public routes and page types.

Inspect at minimum:

### Content
- `/posts`
- `/posts/[slug]`
- `/category/[slug]`

### Database / entities
- `/database`
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
- `/wiki`

### Learning
- `/learn`
- `/learn/[slug]`
- `/start-here`

### Problems
- `/problems`
- `/problems/[slug]`
- `/problems/diagnose`

### Tools
- all `/tools/*`
- `/setup-planner`
- `/finder`

### Inspiration
- `/inspiration`
- `/inspiration/[slug]`
- `/styles/[slug]`

### Search
- `/search`

Also discover any additional public routes in source.

For each major route/page type record:

```text
Route
Page type
Purpose
Primary user intent
Parent conceptual surface
Current navigation entry
Important outgoing links
Important incoming links if discoverable
Indexability
Status
Evidence
```

Do not invent routes.

---

## 5. GLOBAL NAVIGATION AUDIT

Inspect:

- desktop header
- mobile header
- navigation menus
- Database dropdown
- footer navigation
- major navigation/CTA components

Document the actual current navigation and map it to:

```text
Start Here
Learn
Explore
Solve
Tools
Database
Inspiration
Search
About / Community
```

Important: do NOT perform a large navigation redesign simply to match this model.

Preserve usable existing navigation. Make only changes that materially improve IA and discoverability.

---

## 6. SURFACE ROLE AUDIT

Verify the role of:

### Start Here
Beginner onboarding.

### Learn
Structured education.

### Articles
Broad editorial knowledge.

### Explore / Database
Entity discovery.

### Solve
Problem-first troubleshooting.

### Tools
Utility/calculation.

### Inspiration
Visual discovery connected to actionable knowledge.

For every surface answer:

```text
What is it for?
Who uses it?
What user intent does it satisfy?
What should it link to?
Is current implementation consistent?
What is confusing or overlapping?
```

Do not change behavior merely because another design is aesthetically preferable.

---

## 7. DATABASE VS WIKI

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

Target distinction:

```text
Database = structured entity collection
Wiki = unified knowledge browser / discovery layer
```

If unclear, prefer incremental improvements:

- labels
- explanatory copy
- navigation relationships
- CTAs
- hierarchy

Do not rebuild the database.

---

## 8. PROBLEMS VS TOOLS

Audit the IA relationship:

```text
Problem
→ Check
→ Tool
→ Guide
→ Entity
```

This phase does not implement the complete WEB-05/WEB-06 systems.

Do not redesign calculators or diagnosis algorithms.

Document broader missing relationships as future dependencies.

---

## 9. LEARNING PATHS

Audit:

```text
/learn
/learn/[slug]
```

Verify that Learning Paths aggregate existing resources rather than becoming an isolated content silo.

Check links to:

- articles
- entities
- tools
- problems
- next learning steps

Do not create new article content or decide which article should be written next.

---

## 10. INSPIRATION

Audit:

```text
/inspiration
/inspiration/[slug]
/styles/[slug]
```

Target relationship:

```text
Inspiration Scene
→ Style
→ Plants
→ Equipment
→ Fish / Livestock
→ Setup Guide
```

Implement only IA/discoverability improvements belonging to WEB-02.

Do not redesign visual experience; WEB-08 handles UX/performance/animation.

---

## 11. CATEGORY GOVERNANCE

Inspect existing category data/schema and actual categories.

Do NOT mass rename or delete categories.

Classify conceptually into:

### Topic
Aquascaping, aquarium care, water quality, equipment, etc.

### Ecosystem
Freshwater, saltwater/reef, terrarium/paludarium, etc.

### Entity
Fish, plants, corals, invertebrates, equipment.

### Intent
Beginner, how-to, troubleshooting, review, buying, reference.

### Format / distribution
Social media, photography, community, lifestyle.

Document overlaps.

If the CMS schema does not support clean separation, do not force a risky schema migration. Prefer documentation and hub/UI relationships.

---

## 12. HUB MODEL

Evaluate these conceptual hub families:

1. Beginner Aquarium Hub
2. Water Quality Hub
3. Fish Hub
4. Aquascaping & Plants Hub
5. Equipment Hub
6. Problems & Troubleshooting Hub
7. Marine & Reef Hub
8. Tools Hub
9. Aquarium Database Hub

Do NOT automatically create nine new pages.

First determine:

- which hubs already exist;
- which existing pages can serve as hubs;
- which hubs are necessary;
- whether a new hub would create thin/duplicate pages.

Goal: a small number of strong hubs.

---

## 13. BREADCRUMBS

Audit current breadcrumb implementation.

Breadcrumbs should represent conceptual hierarchy rather than simply URL hierarchy.

Examples:

```text
Home → Learn → Beginner Guides → Article
Home → Explore → Fish → Species
Home → Solve → Problems → Problem
Home → Tools → Water Change Calculator
Home → Inspiration → Iwagumi
```

Check:

- consistency
- labels
- route correctness
- mobile behavior
- accessibility
- structured data if already present

Do not change canonical URLs simply to make breadcrumbs match.

---

## 14. SEARCH / FILTER STATES

Audit:

```text
/search?q=...
/posts?...filters
database filters
inspiration filters
wiki filters
```

Search/filter states are utility mechanisms, not the primary IA.

Do not accidentally make filter combinations an indexable hierarchy.

WEB-01 already handled search noindex; do not undo it.

---

## 15. GAP REPORT

Before implementation create:

`WEB-02_GAP_REPORT.md`

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

Do not label subjective visual preferences P0/P1.

---

## 16. IMPLEMENTATION

Implement only justified WEB-02 improvements.

Potential categories:

- navigation mapping
- surface labels/descriptions
- hub entry points
- breadcrumb hierarchy
- Database/Wiki distinction
- Learning Path cross-surface navigation
- Inspiration → knowledge relationships
- category presentation/governance
- discovery CTAs

Avoid:

- large redesign
- route migration
- mass category renaming
- CMS migration
- large content creation
- full internal-link automation
- diagnosis algorithm changes
- calculator redesign
- animation work

---

## 17. INTERNAL-LINKING BOUNDARY

WEB-03 is a later specification.

Do not implement a complete automated internal-linking system in Phase 2.

WEB-02 may establish obvious structural relationships required for IA.

If a relationship requires a broader linking system:

```text
Document: WEB-03 dependency
```

and leave the full implementation for Phase 3.

---

## 18. CONTENT WORKFLOW BOUNDARY

This project has a separate Topic Management workflow.

Do not:

- choose the next article;
- create content priority;
- perform keyword-based article planning;
- create article briefs;
- write articles.

If IA reveals content gaps:

```text
Content opportunity → handoff to Topic Management
```

---

## 19. REGRESSION SAFETY

Record the WEB-01 baseline:

- build status
- lint status
- relevant tests
- known pre-existing warnings/failures

After implementation run:

- lint
- relevant tests
- full test suite if practical
- production build

Do not modify unrelated failing tests just to make the suite green.

Document unrelated pre-existing failures.

---

## 20. PRODUCTION VERIFICATION

Verify affected public routes after implementation.

At minimum inspect:

```text
/
/start-here
/posts
/learn
/database
/wiki
/problems
/tools
/inspiration
/search
```

Verify:

- navigation works
- breadcrumbs are correct
- important surfaces remain reachable
- mobile navigation remains usable
- no broken links were introduced
- no unexpected indexability changes occurred

---

## 21. CURRENT_STATE

Update the canonical:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-02 status
Implemented changes
Known limitations
Deferred WEB-03 dependencies
Tests
Lint
Build
Production verification
Remaining backlog
```

Do not mark work complete without verification.

---

## 22. WEB-02 CHECKPOINT

Create:

`WEB-02_CHECKPOINT.md`

Use:

```text
# WEB-02 CHECKPOINT

## Status
PASS / PASS WITH BACKLOG / BLOCKED

## Specification
WEB-02 Information Architecture

## Requirements
X/Y verified

## Audit
Summary of current IA findings.

## Implemented
List exact changes.

## Deferred
List intentionally deferred items and why.

## Dependencies
List WEB-03+ dependencies without implementing them.

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
WEB-03
```

---

## 23. CHECKPOINT RULE

### PASS
All important WEB-02 requirements are verified.

### PASS WITH BACKLOG
Core requirements are correct and remaining work is non-blocking.

### BLOCKED
A critical WEB-02 requirement cannot be completed or verified.

Do NOT proceed to WEB-03 if BLOCKED.

---

## 24. FINAL STOP RULE

When WEB-02 checkpoint is complete:

STOP.

Do not start WEB-03, create Phase 3, implement the full internal-linking system, optimize analytics, optimize performance, or add animation.

Final response must contain:

```text
WEB-02 completed.

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
WEB-02_CHECKPOINT.md

Next:
WEB-03
```

Then stop.
