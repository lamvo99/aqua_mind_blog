# AquaMind — Phase 8
# WEB-08 Performance, UX, Mobile & Final Website Polish
# FINAL VERSION — Reconciled with WEB-07

## 0. OBJECTIVE

Implement **WEB-08 only**.

WEB-01 through WEB-07 are now complete with documented backlogs.

WEB-07 established the traffic-intelligence foundation, but its checkpoint reports:

```text
Search Console Data: NOT AVAILABLE
Continuous Growth Readiness: NOT READY
Reason:
- analytics provider installation required;
- Search Console verification required;
- 2–4 weeks of data required.
```

Therefore WEB-08 must **NOT depend on Search Console traffic data** and must **NOT attempt to manufacture traffic insights**.

The objective of WEB-08 is to finish the technical/product-quality layer of the website:

```text
Performance
+
Mobile UX
+
Homepage UX
+
Animation audit
+
Accessibility
+
Interaction polish
+
Loading / Error / Empty states
+
Image / Font optimization
+
JS / Hydration optimization
+
SEO regression safety
```

After WEB-08, AquaMind should be treated as a stable growth platform.

Do not create WEB-09/10/11 simply to continue technical optimization.

---

# 1. STRATEGIC POSITION

Current roadmap:

```text
WEB-01  Technical SEO
WEB-02  Information Architecture
WEB-03  Internal Linking
WEB-04  Database / Entity SEO
WEB-05  Tools / Utility SEO
WEB-06  Problems / Diagnostic
WEB-07  Traffic Intelligence Foundation
WEB-08  Performance / UX / Mobile / Final Polish
        ↓
CONTINUOUS GROWTH
        ↓
Content
Traffic
Measurement
Optimization
```

WEB-08 is the **final planned website foundation phase**.

After this phase, improvements should be driven by actual user/traffic evidence rather than by an endless technical roadmap.

---

# 2. IMPORTANT DATA BOUNDARY

Do NOT expect live Search Console data during WEB-08.

Do NOT:

- invent impressions;
- invent clicks;
- invent CTR;
- invent rankings;
- invent traffic;
- invent Search Console verification;
- create a fake traffic dashboard;
- select blog topics;
- build a content calendar.

WEB-07 already defined the future measurement framework.

The user's required setup after WEB-08 will be:

```text
User / Owner
    ↓
Install / verify analytics
    ↓
Verify Google Search Console
    ↓
Submit / confirm sitemap
    ↓
Wait for meaningful data
    ↓
Quản lý chủ đề
    ↓
Content priority
```

OpenCode must report if any owner-side setup remains.

---

# 3. REQUIRED EXECUTION MODEL

WEB-08 must be implemented **spec-by-spec**.

Do NOT audit all specifications and then implement everything at once.

Required process:

```text
SPEC 01
  ↓
Audit
  ↓
Fix
  ↓
Verify
  ↓
PASS
  ↓
SPEC 02
  ↓
...
  ↓
Final Regression
  ↓
Checkpoint
```

For each specification record:

```text
Status:
Evidence:
Files inspected:
Changes:
Verification:
Remaining issue:
```

If a spec fails:

```text
Fix
↓
Verify again
↓
Only PASS allows progression
```

If a non-blocking item cannot be completed, explicitly mark:

```text
PASS WITH BACKLOG
```

Do not silently skip it.

---

# 4. READ FIRST

Before touching source code, read:

```text
AQUA_BLOG_CURRENT_STATE.md
WEB-07_CHECKPOINT.md
WEB-07_GAP_REPORT.md
WEB-06_CHECKPOINT.md
WEB-05_CHECKPOINT.md
WEB-04_CHECKPOINT.md
WEB-03_CHECKPOINT.md
WEB-02_CHECKPOINT.md
WEB-01_CHECKPOINT.md
```

Also inspect:

```text
app/
components/
lib/
styles/
public/
next.config.*
package.json
```

and all relevant:

```text
analytics
SEO
image
font
navigation
layout
homepage
CSS
performance
```

Do not assume the paths above exist exactly. Inspect the actual project.

---

# 5. SPEC 01 — PERFORMANCE BASELINE

Before changing code establish a baseline.

Record:

```text
Build:
Lint:
Tests:
Static page count:
Known warnings:
Known performance risks:
```

If measurable tooling is available, record:

```text
LCP
INP
CLS
FCP
TTFB
Total JS
Transferred bytes
```

IMPORTANT:

If actual browser/CWV measurement is unavailable, state:

```text
Not measured
```

Do not invent scores.

Source-level performance analysis is acceptable when real browser measurement is unavailable.

### PASS

Baseline documented.

---

# 6. SPEC 02 — ROUTE / LAYOUT PERFORMANCE INVENTORY

Inspect major surfaces:

```text
/
 /posts
 /posts/[slug]
 /learn
 /database
 /wiki
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
 /problems
 /problems/[slug]
 /tools
 /finder
 /diagnostic
 /styles
```

Use only routes actually present.

For each major family identify:

```text
Rendering mode
Server/client
Main layout
Large components
CMS calls
Images
Fonts
Third-party scripts
Hydration risk
```

Prioritize:

```text
Homepage
Articles
Database/entity pages
Problems
Tools
Finder
Diagnostic
```

### PASS

Major performance architecture is understood.

---

# 7. SPEC 03 — HOMEPAGE UX

Audit the homepage in detail.

Inspect:

```text
Header
Hero
Primary CTA
Featured content
Discover
Database
Problems
Tools
Articles
Footer
```

Ask:

```text
Can a new visitor understand AquaMind immediately?
Can they find useful content quickly?
Is the first viewport overloaded?
Are the main actions obvious?
Is the hierarchy clear?
Does the page feel polished?
Does it work on mobile?
```

Do not rewrite copy unless required to solve a concrete UX issue.

### PASS

Homepage has no major UX blocker.

---

# 8. SPEC 04 — HOMEPAGE ANIMATION AUDIT

Explicitly determine:

```text
Does homepage animation currently exist?
Where?
How is it implemented?
CSS?
JS?
Library?
What purpose does it serve?
Does it affect initial load?
Does it work on mobile?
Does it support prefers-reduced-motion?
```

If useful animation already exists:

```text
KEEP
```

If animation does not exist:

Do NOT automatically add animation.

Only add subtle animation if:

```text
UX benefit is clear
+
performance cost is negligible
+
design system supports it
+
mobile behavior is safe
+
reduced-motion is supported
```

Preferred:

```text
opacity
transform
CSS transitions
CSS keyframes
```

Avoid:

```text
large autoplay video
WebGL
particle systems
heavy animation packages
scroll hijacking
continuous expensive animation
```

### PASS

Animation is either:

```text
appropriate and implemented
```

or:

```text
intentionally unchanged because no meaningful benefit was identified
```

---

# 9. SPEC 05 — MOBILE UX

Audit representative pages at mobile widths:

```text
Home
Article
Database listing
Entity detail
Problem detail
Tool
Finder
Diagnostic
```

Check:

```text
Navbar
Mobile menu
Typography
Cards
Images
Tables
Forms
Buttons
Breadcrumbs
Long titles
Filters
Result cards
Footer
Sticky elements
Horizontal overflow
```

Fix real issues.

Do not redesign the entire mobile UI.

### PASS

No major mobile usability defect remains.

---

# 10. SPEC 06 — CORE WEB VITAL RISK AUDIT

Inspect:

## LCP

Potential causes:

```text
hero image
large image
font blocking
client-only hero
late CMS content
render-blocking resource
```

## INP

Potential causes:

```text
large client component
expensive filters
synchronous computation
large event handlers
excessive state updates
```

## CLS

Potential causes:

```text
missing image dimensions
late fonts
dynamic content
layout-changing UI
```

Do not claim actual CWV pass/fail without measurement.

### PASS

Major source-level risks addressed or documented.

---

# 11. SPEC 07 — IMAGE OPTIMIZATION

Audit:

```text
next/image usage
image dimensions
sizes
priority
loading
formats
responsive images
hero images
article images
entity images
card images
OG images
alt text
```

Prioritize above-the-fold images.

Do not unnecessarily reduce visual quality.

### PASS

Images are appropriately optimized.

---

# 12. SPEC 08 — FONT OPTIMIZATION

Audit:

```text
font files
weights
subsets
loading
preload
fallbacks
layout shift
unused fonts
```

Do not change brand typography without evidence.

### PASS

Font loading does not introduce obvious unnecessary performance cost.

---

# 13. SPEC 09 — JAVASCRIPT / HYDRATION

Find:

```text
'use client'
```

and inspect client-heavy components.

Identify:

```text
unnecessary client components
large hydration trees
browser-only dependencies
unnecessary state
large serialized props
expensive client-side filtering
```

Preferred:

```text
Server Component
    ↓
Server-rendered content
    ↓
Small Client Component
    ↓
Only required interaction
```

Do not break functionality.

Do not perform theoretical optimization without clear benefit.

### PASS

Major unnecessary hydration/performance risks are addressed.

---

# 14. SPEC 10 — THIRD-PARTY RESOURCES

Audit:

```text
Analytics
Fonts
Embeds
Tracking
External scripts
CMS requests
```

Classify:

```text
Necessary
Optional
Unused
Expensive
Blocking
```

Remember:

```text
Search Console data is NOT AVAILABLE yet.
```

Do not add analytics provider unless the canonical project requirement explicitly calls for it.

If owner-side setup is required, document it instead.

Do not add advertising.

Do not add AdSense.

### PASS

Third-party resources are understood and no unnecessary blocking dependency remains.

---

# 15. SPEC 11 — NAVIGATION / DISCOVERY UX

Audit:

```text
Navbar
Mobile navbar
Footer
Breadcrumbs
Back navigation
Search
Finder
Tools
Database
Problems
```

Verify the major discovery paths:

```text
Article → Tool
Article → Database
Article → Problem
Entity → Article
Problem → Tool
Tool → Article
```

WEB-03 already created relationships.

Do not rebuild the linking architecture.

Only improve UX where needed.

### PASS

Navigation is coherent on desktop and mobile.

---

# 16. SPEC 12 — ACCESSIBILITY

Audit representative surfaces for:

```text
Heading hierarchy
Keyboard navigation
Focus states
Button semantics
Link semantics
Form labels
Contrast
Alt text
ARIA usage
Screen-reader naming
Reduced motion
```

Special attention:

```text
Mobile menu
Finder filters
Calculator controls
Diagnostic controls
Interactive cards
```

Prefer semantic HTML.

Do not add unnecessary ARIA.

### PASS

No major accessibility blocker remains.

---

# 17. SPEC 13 — LOADING / EMPTY / ERROR STATES

Audit:

```text
CMS loading
Search
Finder
Tools
Diagnostic
Database
Posts
Images
```

Check for:

```text
blank screen
unexplained loading
broken image
empty result
unclear error
```

Use existing UI patterns where possible.

### PASS

Important states are understandable.

---

# 18. SPEC 14 — RESPONSIVE DATA / TABLES

Audit:

```text
Database tables
Comparison UI
Parameter tables
Tool outputs
Entity data
Long text
```

Prevent:

```text
page-level horizontal overflow
unreadable tables
broken cards
overflowing labels
```

Do not remove useful data simply to make mobile easier.

### PASS

Representative data-heavy pages remain usable on mobile.

---

# 19. SPEC 15 — VISUAL CONSISTENCY

Audit:

```text
Spacing
Typography
Buttons
Cards
Borders
Radius
Icons
Colors
Section hierarchy
Empty states
```

Use existing design tokens/components.

Do not create a second design system.

Fix obvious inconsistencies only.

### PASS

Visual language is coherent.

---

# 20. SPEC 16 — DATA-SURFACE PERFORMANCE

Inspect:

```text
Database
Wiki
Problems
Tools
Finder
```

Look for:

```text
large payloads
unnecessary client data
repeated CMS requests
N+1 patterns
large serialized props
unnecessary client filtering
```

Do NOT redesign CMS/data architecture in WEB-08.

If a major architectural problem exists:

```text
Document
Prioritize
Defer
```

unless the minimal fix is clearly within WEB-08.

### PASS

No critical data-surface performance issue remains.

---

# 21. SPEC 17 — SEO REGRESSION SAFETY

Verify WEB-01 through WEB-07 behavior remains intact:

```text
Sitemap
Robots
Canonical
Metadata
OpenGraph
Twitter
BreadcrumbList
CollectionPage
Article JSON-LD
Tool JSON-LD
Problem JSON-LD
Internal linking
```

Do not:

```text
remove indexable pages
change canonical strategy unnecessarily
remove structured data
turn critical content into client-only content
break sitemap generation
```

### PASS

No SEO regression.

---

# 22. SPEC 18 — PRODUCTION ERROR CHECK

Inspect the production build and representative production behavior.

Look for:

```text
runtime errors
hydration errors
missing images
broken links
console errors
layout failures
CMS failures
```

Use real routes discovered from the project.

### PASS

No critical production runtime issue remains.

---

# 23. SPEC 19 — PERFORMANCE / UX FIX IMPLEMENTATION

Only after Specs 01–18 have been audited should implementation be consolidated.

Prioritize:

```text
P0 Critical
P1 High
P2 Medium
P3 Polish
```

Implement:

```text
P0
↓
P1
↓
P2
↓
P3 only if low-risk
```

Do not implement findings that are:

```text
speculative
unrelated
already solved
outside WEB-08
```

---

# 24. GAP REPORT

Create:

`WEB-08_GAP_REPORT.md`

Required structure:

```text
# WEB-08 GAP REPORT

## Executive Summary

## Baseline

## Route / Layout Performance Inventory

## Homepage UX

## Homepage Animation

## Mobile UX

## Core Web Vitals

## Images

## Fonts

## JavaScript / Hydration

## Third-Party Resources

## Navigation / Discovery

## Accessibility

## Loading / Empty / Error States

## Responsive Data / Tables

## Visual Consistency

## Database / Wiki / Problems / Tools Performance

## SEO Regression

## Production Runtime

## Prioritized Fixes

## Deferred Items

## Owner-Side Setup Required

## Data Limitations
```

Every finding:

```text
ID:
Spec:
Area:
Route:
Requirement:
Current State:
Evidence:
Impact:
Priority:
Recommendation:
Implementation:
Verification:
```

---

# 25. OWNER-SIDE TASKS

At the end of the audit clearly separate:

```text
OpenCode tasks
```

from:

```text
User tasks
```

Potential user tasks may include:

```text
Google Search Console verification
Analytics provider setup
Sitemap submission/confirmation
```

Only list tasks actually required by the audit.

Do not ask the user to perform unnecessary work.

---

# 26. TESTING

After implementation run:

```text
Unit tests
Component tests
SEO tests
JSON-LD tests
Sitemap tests
Tool tests
Problem tests
Finder tests
Relevant integration tests
Lint
Production build
```

Known pre-existing issues:

```text
compare.test.ts
```

must remain documented if still present.

Known infrastructure worker timeouts must be distinguished from code failures.

Do not modify unrelated tests merely to force PASS.

---

# 27. PRODUCTION VERIFICATION

Verify representative real routes:

```text
/
/posts
/posts/<real-slug>
/database
/species/<real-slug>
/plants/<real-slug>
/corals/<real-slug>
/invertebrates/<real-slug>
/equipment/<real-slug>
/problems/<real-slug>
/tools/<real-tool>
/finder
/diagnostic
```

Only use real routes found in source.

Verify:

```text
HTTP success
server-rendered critical content
title
H1
images
navigation
mobile behavior
no obvious horizontal overflow
no runtime errors
```

If browser performance measurement is available, record actual results.

If not:

```text
Performance measurement unavailable
```

Do not invent Lighthouse/CWV scores.

---

# 28. FINAL REGRESSION AUDIT

After implementation verify:

```text
WEB-01
Technical SEO
        ↓
WEB-02
Information Architecture
        ↓
WEB-03
Internal Linking
        ↓
WEB-04
Database / Entity
        ↓
WEB-05
Tools
        ↓
WEB-06
Problems / Diagnostic
        ↓
WEB-07
Traffic Intelligence
```

Check:

```text
Sitemap
Robots
Canonical
Metadata
JSON-LD
Breadcrumbs
Internal links
Articles
Database
Problems
Tools
Finder
Diagnostic
```

Any regression caused by WEB-08 must be fixed before PASS.

---

# 29. CURRENT STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-08 status
Performance baseline
Performance fixes
Homepage status
Animation status
Mobile status
Accessibility status
Image status
Font status
JS/hydration status
SEO regression status
Production verification
Build
Lint
Tests
Known issues
Deferred items
Owner-side tasks
Continuous Growth readiness
```

---

# 30. WEB-08 CHECKPOINT

Create:

`WEB-08_CHECKPOINT.md`

Use:

```text
# WEB-08 CHECKPOINT

## Status

PASS / PASS WITH BACKLOG / BLOCKED

## Objective

Performance, UX, Mobile & Final Website Polish

## WEB-07 Context

Search Console data remains:
NOT AVAILABLE

Analytics / Search Console owner-side setup:
Document actual status.

## Specification Results

| Spec | Status | Evidence |
|---|---|---|

## Performance Baseline

Summary.

## Performance Fixes

Summary.

## Homepage

Summary.

## Homepage Animation

Existing / Improved / Intentionally Unchanged.

## Mobile UX

Summary.

## Accessibility

Summary.

## Images / Fonts

Summary.

## JavaScript / Hydration

Summary.

## Navigation / Discovery

Summary.

## Loading / Empty / Error States

Summary.

## Database / Wiki / Problems / Tools

Summary.

## SEO Regression

Summary.

## Production Runtime

Summary.

## Tests

Result.

## Lint

Result.

## Build

Result.

## Production Verification

Routes and result.

## Implemented

Exact files and changes.

## Deferred

Exact items and reasons.

## Owner-Side Tasks

Exact tasks, if any.

## Known Issues

List.

## Continuous Growth Readiness

READY / NOT READY

Reason.

## Current State

Updated: YES/NO

## Next Stage

CONTINUOUS GROWTH
```

---

# 31. PASS CRITERIA

Use:

```text
PASS
```

when:

- required WEB-08 specifications pass;
- no critical performance issue remains;
- no major mobile UX blocker remains;
- homepage UX is stable;
- animation is appropriate or intentionally unnecessary;
- no major accessibility blocker remains;
- SEO has not regressed;
- production build passes;
- lint passes;
- tests pass except documented pre-existing/infrastructure issues;
- representative production routes work.

Use:

```text
PASS WITH BACKLOG
```

when:

- remaining issues are non-blocking;
- each is documented;
- they do not prevent Continuous Growth.

Use:

```text
BLOCKED
```

when:

- a critical WEB-08 requirement cannot be completed or verified.

If BLOCKED:

```text
STOP.
Do not declare Continuous Growth readiness.
```

---

# 32. CONTINUOUS GROWTH GATE

WEB-08 is the final website-foundation phase.

If WEB-08 passes, the website should move toward:

```text
CONTINUOUS GROWTH
```

However, distinguish:

### Website readiness

Can be:

```text
READY
```

after WEB-08.

### Data readiness

May remain:

```text
NOT READY
```

until:

```text
Analytics installed
+
Google Search Console verified
+
Sitemap submitted/confirmed
+
2–4 weeks meaningful data
```

Therefore the checkpoint must report these independently.

Do NOT block technical WEB-08 merely because Search Console has no historical data.

---

# 33. WHAT HAPPENS AFTER WEB-08

Do NOT create another website phase simply because there are minor improvements left.

The default model becomes:

```text
CONTENT GROWTH
        ↓
Existing-content improvement
        ↓
Wiki / Problem / Tool improvements driven by evidence
        ↓
Performance maintenance when needed
        ↓
New feature only when justified
```

The primary growth engine becomes content.

The separate workflows remain:

## Quản lý chủ đề

Responsible for:

```text
Search Console analysis
SERP research
Content opportunities
Final Content Priority
Master Traffic Roadmap
Which topic comes next
New vs Update
```

## Viết Content

Responsible for:

```text
One concrete topic
Research
Outline
Writing
SEO
Images
Internal links
Metadata
Publish-ready content
```

## Xây dựng website

Responsible for:

```text
Technical improvements
UX
Performance
SEO infrastructure
Wiki
Problems
Tools
Feature development
```

Do not merge these workflows.

---

# 34. FINAL STOP RULE

After:

```text
WEB-08_GAP_REPORT.md
WEB-08_CHECKPOINT.md
```

are created and:

```text
AQUA_BLOG_CURRENT_STATE.md
```

is updated:

**STOP.**

Do not:

- create WEB-09;
- create WEB-10;
- create WEB-11;
- write blog content;
- select article topics;
- create a content calendar;
- implement AdSense;
- add advertising;
- redesign CMS;
- redesign Wiki;
- redesign Problems;
- redesign Tools;
- build a custom rank tracker;
- build a keyword SaaS;
- perform speculative optimization.

Final response must be:

```text
WEB-08 completed.

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

Search Console:
NOT AVAILABLE / AVAILABLE

Analytics:
...

Website Readiness:
READY / NOT READY

Continuous Growth:
READY / NOT READY

Owner-Side Tasks:
...

Current State:
Updated

Checkpoint:
WEB-08_CHECKPOINT.md

Next:
CONTINUOUS GROWTH
```

Then stop.
