# AquaMind — Phase 5
# WEB-05 Tools / Utility SEO & UX Audit — Audit First, Then Implement

## 0. OBJECTIVE

Implement **WEB-05 only**.

Authoritative specification:

`docs/AQUAMIND_WEB_05_TOOLS_SEO_UX.md`

Read the complete specification before making any code changes. If the actual filename differs, locate the canonical WEB-05 specification under `docs/` and use that document as the source of truth.

Current baseline:

- WEB-01 — Technical SEO & Indexation: PASS
- WEB-02 — Information Architecture: PASS WITH BACKLOG
- WEB-03 — Internal Linking Architecture: PASS WITH BACKLOG
- WEB-04 — Database / Entity SEO: PASS WITH BACKLOG
- WEB-05 — Tools / Utility SEO & UX: NEXT

Primary objective:

Audit and improve AquaMind's **Tools / Calculator / Finder / utility surfaces** so they are useful to users, discoverable through the site's architecture, technically sound for search, and ready to become meaningful organic-traffic entry points.

Do not optimize for page count alone.

The goal is:

```text
Useful tool
    ↓
Clear search intent
    ↓
Strong landing experience
    ↓
Useful result
    ↓
Relevant educational resources
    ↓
Next action
```

---

# 1. NON-NEGOTIABLE SCOPE

Work on **WEB-05 only**.

Do NOT implement:

- WEB-06 Problems / Diagnosis
- WEB-07 Analytics / Growth
- WEB-08 broad UX / Performance / Animation
- new blog content
- topic selection
- content calendar
- Search Console content prioritization

If WEB-05 exposes a dependency belonging to a later phase:

1. document it;
2. implement only the minimum dependency if WEB-05 cannot function correctly without it;
3. otherwise defer it.

When WEB-05 is complete:

**STOP.**

Do not automatically start WEB-06.

---

# 2. READ FIRST

Before touching source code, read:

1. `docs/AQUAMIND_WEB_05_TOOLS_SEO_UX.md`
2. `AQUA_BLOG_CURRENT_STATE.md`
3. `WEB-04_CHECKPOINT.md`
4. `WEB-04_GAP_REPORT.md` if available
5. relevant routes under `app/`
6. relevant components under `components/`
7. tool/calculator utilities under `lib/`
8. existing SEO/JSON-LD utilities
9. relevant tests

Also inspect WEB-03 changes because tools already have internal-link relationships.

Do not assume the current-state document is perfectly accurate. Verify important claims against source.

Do not silently replace the WEB-05 specification with general SEO best practices.

---

# 3. REQUIRED EXECUTION ORDER

Follow this exact order:

```text
Read WEB-05 specification
        ↓
Inventory every current tool/utility surface
        ↓
Audit routes + rendering
        ↓
Audit tool functionality
        ↓
Audit UX and result quality
        ↓
Audit SEO / metadata / indexability
        ↓
Audit internal linking
        ↓
Audit structured data
        ↓
Audit mobile/accessibility
        ↓
Audit performance risks
        ↓
Map requirements → evidence
        ↓
Create WEB-05_GAP_REPORT.md
        ↓
Define implementation scope
        ↓
Implement WEB-05
        ↓
Run tests
        ↓
Run lint
        ↓
Run production build
        ↓
Verify representative production tools
        ↓
Update CURRENT_STATE
        ↓
Create WEB-05_CHECKPOINT.md
        ↓
STOP
```

Do not skip the audit.

Do not redesign everything before understanding the existing implementation.

---

# 4. STEP 1 — TOOL / UTILITY INVENTORY

Search the entire source tree and identify all tool-like functionality.

At minimum inspect:

```text
/tools
/finder
```

and every calculator/utility route discovered from source.

Look for functionality such as:

```text
Aquarium volume calculator
Water change calculator
Dosing calculator
Salt calculator
Parameter calculator
Stocking-related tools
Finder tools
Equipment-related utilities
Any other public aquarium calculator
```

Do not assume these exact tools exist.

Use actual source evidence.

Create an inventory:

```text
Tool name
Route
Purpose
Inputs
Outputs
Calculation source
Client/server
Indexability
Metadata
JSON-LD
Internal links
Tests
Status
```

---

# 5. STEP 2 — TOOL ROUTE AUDIT

For every public tool route inspect:

```text
URL
Rendering mode
Static / ISR / SSR / dynamic
Canonical
Robots
Title
Meta description
H1
Open Graph
Twitter
Breadcrumb
JSON-LD
Sitemap
Internal links
```

Determine whether each tool is:

```text
Indexable
Noindex
Conditionally indexable
Not intended for search
```

Do not change indexability until the WEB-05 specification has been checked.

Preserve WEB-01 decisions.

---

# 6. STEP 3 — TOOL FUNCTIONALITY AUDIT

Audit each tool for functional correctness.

For each tool determine:

```text
Input validation
Required fields
Optional fields
Default values
Unit handling
Boundary values
Invalid values
Zero values
Negative values
Decimal values
Large values
Empty state
Error state
Result state
Reset behavior
```

Check calculations against the actual implementation and tests.

Do not rewrite formulas from general knowledge if the project specification/source defines the expected behavior.

If a formula is ambiguous:

```text
Document ambiguity.
Do not silently invent a new formula.
```

---

# 7. STEP 4 — CALCULATION SAFETY

For numeric calculators inspect:

```text
Unit conversion
Rounding
Precision
Floating-point behavior
Minimum/maximum values
Division by zero
Overflow/very large inputs
NaN / Infinity
Invalid input handling
```

A calculator must never silently produce a misleading result.

Where applicable, display:

```text
Input assumptions
Units
Result units
Important caveats
```

Do not add unnecessary educational copy.

---

# 8. STEP 5 — RESULT UX AUDIT

The result is the primary value of a tool.

Audit:

```text
Is the result immediately visible?
Is the result understandable?
Are units clear?
Are inputs summarized?
Can the user adjust inputs easily?
Can the user recalculate?
Is there a useful next action?
```

Where appropriate:

```text
Tool result
    ↓
Relevant article
    ↓
Relevant database entity
    ↓
Relevant problem/solution
```

Do not add unrelated links.

---

# 9. STEP 6 — TOOL LANDING PAGE QUALITY

For each indexable tool determine whether the route itself can satisfy search intent.

A useful tool landing page should clearly communicate:

```text
What this tool does
Who it is for
What input is needed
What result it provides
How to use it
Relevant limitations
```

Do not add long generic SEO paragraphs solely for word count.

Do not create thin "calculator SEO pages" with little actual utility.

---

# 10. STEP 7 — SEO METADATA

Audit each tool:

```text
Title
Meta description
H1
Canonical
Robots
OG title
OG description
OG image
Twitter metadata
```

Look for:

- duplicated titles;
- generic titles;
- keyword stuffing;
- inaccurate descriptions;
- missing metadata;
- mismatch between title and actual tool.

Use natural search intent.

Do not make unsupported claims such as:

```text
best
most accurate
professional
scientific
```

unless the project source explicitly supports them.

---

# 11. STEP 8 — STRUCTURED DATA

Inspect existing JSON-LD.

Determine whether WEB-05 requires structured data for tool pages.

Do not use inappropriate schema types simply because they may look useful for SEO.

For each tool:

```text
Current schema
Required schema
Available properties
Missing properties
Validity risk
Action
```

Never fabricate:

- ratings;
- reviews;
- prices;
- authors;
- dates;
- organizations;
- measurements.

Structured data must reflect the actual page.

---

# 12. STEP 9 — INTERNAL LINKING

WEB-03 already introduced tool relationships.

Audit current:

```text
Tool → Article
Tool → Learn
Tool → Entity
Tool → Problem
```

Determine:

```text
Existing
Missing
Duplicate
Incorrect
Too generic
```

Prefer contextual links that help users continue their task.

Avoid:

```text
Tool
→ 20 unrelated articles
```

A small number of highly relevant links is preferable.

---

# 13. STEP 10 — TOOL DISCOVERY

Audit whether users can discover tools from:

```text
Home
Learn
Database
Wiki
Problems
Articles
Footer
Navigation
Finder
```

Do not recreate WEB-02 information architecture.

Identify missing high-value discovery paths and implement only those required by WEB-05.

---

# 14. STEP 11 — FINDER AUDIT

Explicitly audit:

```text
/finder
```

Determine:

```text
Purpose
Inputs
Filtering logic
Results
URL behavior
Indexability
Metadata
Internal links
Empty state
No-results state
Mobile UX
```

Pay special attention to:

```text
filter combinations
query parameters
URL explosion
crawlability
```

Do not make arbitrary finder combinations indexable unless explicitly required by WEB-05 and supported by genuine unique value.

---

# 15. STEP 12 — ACCESSIBILITY AUDIT

For representative tools inspect:

```text
Labels
Input associations
Keyboard navigation
Focus order
Focus visibility
Button semantics
Error messaging
ARIA only where necessary
Color-independent feedback
Mobile input usability
```

Do not introduce unnecessary ARIA.

Prefer semantic HTML.

Do not perform a full accessibility redesign; fix WEB-05-relevant issues.

---

# 16. STEP 13 — MOBILE UX AUDIT

Verify tools on mobile-sized layouts.

Check:

```text
Input fields
Numeric keyboards
Select controls
Buttons
Result cards
Tables
Long labels
Error messages
Spacing
Horizontal overflow
Sticky/fixed elements
```

A calculator must remain usable without desktop-only interaction patterns.

Do not perform broad visual redesign.

---

# 17. STEP 14 — ERROR / EMPTY STATES

Every public tool should have clear behavior for:

```text
Empty input
Invalid input
Out-of-range input
No result
Unexpected data
```

Errors should explain what the user needs to change.

Avoid exposing stack traces or implementation details.

Do not silently fall back to incorrect values.

---

# 18. STEP 15 — TOOL PERFORMANCE AUDIT

Inspect whether tools:

- load unnecessary data;
- fetch CMS data repeatedly;
- perform expensive calculations on every render;
- use unnecessary client components;
- create hydration problems;
- perform N+1 queries;
- serialize large datasets.

Implement only WEB-05-specific fixes.

Do not perform the broad performance optimization reserved for WEB-08.

---

# 19. STEP 16 — TEST COVERAGE AUDIT

For each calculator/tool determine whether tests cover:

```text
Normal case
Boundary case
Invalid input
Zero
Negative
Decimals
Unit conversion
Expected result
Error behavior
```

Do not write tests that simply mirror implementation details.

Tests should protect user-visible behavior and important calculation correctness.

If a test is missing for a critical calculation:

```text
Add a focused regression test.
```

---

# 20. STEP 17 — GAP REPORT

Before implementation create:

`WEB-05_GAP_REPORT.md`

For each finding:

```text
ID:
Tool:
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

Priorities:

```text
P0 = critical
P1 = high
P2 = medium
P3 = low
```

Include:

```text
## Tool Inventory

## Route / Rendering Audit

## Functional Audit

## Calculation Safety

## Result UX

## SEO Metadata

## Indexability

## Structured Data

## Internal Linking

## Finder Audit

## Accessibility

## Mobile UX

## Performance Risks

## Test Coverage

## WEB-04 Dependencies

## Deferred Items
```

---

# 21. IMPLEMENTATION RULES

Implement only changes justified by:

```text
WEB-05 requirement
+
verified source evidence
+
clear user/SEO value
```

Prefer:

- reusable components;
- existing calculation utilities;
- deterministic calculations;
- semantic HTML;
- accessible labels;
- stable URLs;
- existing data relationships;
- server rendering where appropriate;
- focused tests.

Avoid:

- rebuilding working calculators without evidence;
- changing formulas without specification;
- fake SEO content;
- keyword stuffing;
- arbitrary indexation;
- huge related-link lists;
- broad design-system changes;
- unrelated performance work.

---

# 22. SEO SAFETY

WEB-05 must not:

- make `/search` indexable;
- create crawl traps;
- create infinite filter/query URLs;
- create duplicate tool URLs;
- remove valid canonicals;
- expose draft CMS content;
- remove valid sitemap entries;
- introduce misleading structured data;
- break WEB-01/WEB-02/WEB-03 behavior.

---

# 23. TESTING

Record baseline before implementation.

Known baseline:

```text
WEB-04:
Build: PASS
Lint: PASS
Tests: 193/194 passing
Known pre-existing failure:
compare.test.ts
```

After implementation run:

```text
relevant tool tests
calculator tests
finder tests
SEO/metadata tests if present
JSON-LD tests if present
sitemap tests
full test suite if practical
lint
production build
```

Do not modify unrelated tests merely to remove the known pre-existing failure.

If test counts change, explain why.

---

# 24. PRODUCTION VERIFICATION

Verify every major tool family discovered during the audit.

At minimum verify:

```text
/tools
/finder
```

plus all major calculator routes actually present in source.

For each representative tool verify:

```text
HTTP success
Page title
Meta description
H1
Canonical
Robots
OG
Twitter
Breadcrumb
JSON-LD
Inputs
Validation
Calculation/result
Reset/recalculate
Internal links
Mobile behavior
No console/runtime errors
```

Use real existing routes.

Do not invent routes.

---

# 25. PRODUCTION CALCULATION SMOKE TEST

For each calculator, execute at least:

```text
1 valid normal case
1 boundary case
1 invalid case
```

Record:

```text
Input
Expected behavior
Actual behavior
PASS/FAIL
```

Use expected values from project specifications/tests where available.

Do not invent mathematical expectations when the source specification is ambiguous.

---

# 26. CURRENT_STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-05 status
Tools audited
Tools improved
Finder status
Indexability policy
SEO metadata status
Structured-data status
Internal-linking status
Accessibility status
Test coverage
Known limitations
Deferred work
Tests
Lint
Build
Production verification
Remaining backlog
```

---

# 27. WEB-05 CHECKPOINT

Create:

`WEB-05_CHECKPOINT.md`

Use:

```text
# WEB-05 CHECKPOINT

## Status

PASS / PASS WITH BACKLOG / BLOCKED

## Specification

WEB-05 Tools / Utility SEO & UX

## Requirements

X/Y verified

## Tools Audited

List all tools.

## Finder

Summary.

## Functional Quality

Summary.

## Calculation Safety

Summary.

## Result UX

Summary.

## SEO / Indexability

Summary.

## Structured Data

Summary.

## Internal Linking

Summary.

## Accessibility

Summary.

## Mobile UX

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

WEB-06+ or CMS/schema dependencies.

## Current State

Updated: YES/NO

## Known Issues

List.

## Next Phase

WEB-06
```

---

# 28. CHECKPOINT DECISION

### PASS

Core WEB-05 requirements are implemented and verified.

### PASS WITH BACKLOG

Core requirements are correct and remaining items are non-blocking and documented.

### BLOCKED

A critical WEB-05 requirement cannot be completed or verified.

If BLOCKED:

```text
STOP.
Do not proceed to WEB-06.
```

---

# 29. FINAL STOP RULE

After:

```text
WEB-05_GAP_REPORT.md
WEB-05_CHECKPOINT.md
```

are created and:

```text
AQUA_BLOG_CURRENT_STATE.md
```

is updated:

**STOP.**

Do not:

- start WEB-06;
- redesign Problems / Diagnosis;
- implement analytics;
- create blog content;
- select the next topic;
- change the content roadmap;
- add Home animation as a separate initiative;
- perform broad performance optimization.

Final response must contain:

```text
WEB-05 completed.

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
WEB-05_CHECKPOINT.md

Next:
WEB-06
```

Then stop.
