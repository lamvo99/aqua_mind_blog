# AquaMind — Phase 7
# WEB-07 Traffic Intelligence, Search Console & Growth Opportunity Foundation

## 0. OBJECTIVE

Implement **WEB-07 only**.

The purpose of WEB-07 is to establish the data-driven foundation for AquaMind's long-term traffic growth.

This phase must answer:

> What is Google currently showing AquaMind for, which pages have opportunity, where are the gaps, and what evidence should guide future content decisions?

WEB-07 is **not** the content-writing phase.

It is also **not** the Topic Management phase.

The output of WEB-07 should provide reliable evidence that the separate **Quản lý chủ đề** workflow can later use to produce:

```text
Search Console + SERP data
        ↓
Traffic / SEO opportunity analysis
        ↓
Final Content Priority
        ↓
Master Traffic Roadmap
```

Do not invent Search Console data.

Do not fabricate rankings, clicks, impressions, CTR, queries, or traffic.

If live Search Console data cannot be accessed, document exactly what is unavailable and build the analysis framework without pretending that data exists.

---

# 1. STRATEGIC ROLE

AquaMind is moving from:

```text
Website construction
```

toward:

```text
Continuous Growth
```

The intended operating model is:

```text
Google / Search
      ↓
Actual performance data
      ↓
Opportunity analysis
      ↓
Topic Management
      ↓
Content Production
      ↓
Publish / Update
      ↓
Google indexing
      ↓
Traffic
      ↓
Measurement
      ↺
```

WEB-07 creates the **measurement and opportunity layer**.

It must not become a general website redesign.

---

# 2. NON-NEGOTIABLE SCOPE

Allowed:

- audit current analytics/search measurement;
- audit Google Search Console readiness;
- audit sitemap/indexation observability;
- inspect existing analytics integration;
- identify measurable SEO KPIs;
- establish data extraction/analysis conventions;
- inspect current search visibility if actual data is available;
- identify content opportunity from real data;
- identify existing-content update opportunities;
- identify Wiki/Data/Problem/Tool opportunities from evidence;
- document SERP research workflow;
- document query/page mapping;
- document opportunity scoring;
- create a repeatable growth-analysis framework;
- make minimal implementation changes needed to expose or preserve useful measurement data.

Do NOT:

- write new blog articles;
- select the next article topic for the user;
- redesign Topic Management;
- redesign the CMS;
- redesign Wiki;
- redesign Problems;
- redesign Tools;
- add AdSense;
- add advertising;
- create fake analytics data;
- create fake Search Console data;
- create a massive dashboard without evidence it is useful;
- perform unrelated SEO changes already handled by WEB-01 through WEB-06;
- start WEB-08 work.

If a requirement depends on unavailable Google credentials/API access:

1. document it;
2. verify what can be verified without credentials;
3. provide the exact future data contract/workflow;
4. do not fabricate results.

---

# 3. READ FIRST

Before making any changes, read:

1. `AQUA_BLOG_CURRENT_STATE.md`
2. `WEB-06_CHECKPOINT.md`
3. `WEB-06_GAP_REPORT.md` if present
4. `WEB-05_CHECKPOINT.md`
5. `WEB-04_CHECKPOINT.md`
6. `WEB-03_CHECKPOINT.md`
7. `WEB-02_CHECKPOINT.md`
8. `WEB-01_CHECKPOINT.md`
9. the source under `app/`
10. analytics configuration
11. metadata / sitemap configuration
12. package configuration
13. environment variable documentation
14. any existing SEO or analytics utilities
15. the project content-management workflow documentation if present

Also inspect the current:

```text
docs/
phases/
```

to understand existing terminology.

Do not replace existing project terminology without evidence.

---

# 4. REQUIRED EXECUTION MODEL

WEB-07 must be executed **spec-by-spec**.

Do not audit everything and then implement everything at once.

Use:

```text
SPEC 01
  ↓
Audit
  ↓
Finding
  ↓
Fix if needed
  ↓
Verify
  ↓
PASS?
  ├─ NO → fix → verify again
  └─ YES
        ↓
SPEC 02
        ↓
...
        ↓
SPEC N
        ↓
WEB-07 checkpoint
```

A failed specification blocks progression to the next specification unless the specification itself is explicitly marked non-blocking by the canonical WEB-07 specification.

For every specification record:

```text
Status:
Evidence:
Files inspected:
Changes:
Verification:
Remaining issue:
```

---

# 5. SPEC 01 — ANALYTICS INVENTORY

Audit all existing analytics/measurement integrations.

Determine whether AquaMind currently has:

```text
Google Analytics
Google Search Console
Google Tag Manager
Vercel Analytics
other analytics
```

Do not assume any of these are installed.

For each integration record:

```text
Present?
Provider:
Implementation:
Client/server:
Environment variables:
Production active?
Privacy considerations:
Potential issue:
```

Verify that analytics does not unnecessarily block page rendering.

### PASS criteria

We know exactly:

- what analytics exists;
- where it is implemented;
- whether production uses it;
- whether there are missing measurement capabilities.

---

# 6. SPEC 02 — GOOGLE SEARCH CONSOLE READINESS

Audit Search Console readiness.

Verify:

```text
Domain/property setup assumptions
Sitemap availability
robots.txt
canonical URLs
indexable pages
metadata
structured data
site ownership verification mechanism if present
```

Do not claim the property is verified unless actual evidence exists.

Determine what Search Console data will be required later:

```text
Query
Page
Clicks
Impressions
CTR
Average position
Date
Country
Device
Search appearance
```

### PASS criteria

There is a documented and technically sound path for collecting Search Console performance data.

---

# 7. SPEC 03 — SITEMAP / INDEXATION OBSERVABILITY

Audit:

```text
/sitemap.xml
robots.txt
canonical URLs
indexable route families
noindex routes
dynamic route generation
```

WEB-01 already handled core fixes.

Do not duplicate or randomly modify WEB-01 work.

Instead determine:

```text
Can Search Console crawl the intended surfaces?
Are there obvious indexation blind spots?
Are important page families measurable?
```

Record any remaining issues.

### PASS criteria

Indexation observability is understood and no new regression is introduced.

---

# 8. SPEC 04 — SEARCH PERFORMANCE DATA CONTRACT

Define the canonical data structure for future Search Console analysis.

At minimum:

```text
date
query
page
clicks
impressions
ctr
position
country
device
searchAppearance
```

If actual API/export data exists, inspect its structure.

If not, define the expected schema without pretending it is live.

Document:

```text
required fields
optional fields
normalization
date range
aggregation rules
```

Do not create fake rows.

---

# 9. SPEC 05 — QUERY → PAGE MAPPING

Define how search queries should be mapped to AquaMind pages.

Required categories:

```text
Query
Intent
Target page
Existing page?
Page type
Topic/cluster
Performance
Opportunity
Action
```

Possible actions:

```text
Keep
Improve
Expand
Create supporting article
Create new page
Redirect/canonical consideration
Ignore
```

Do not automatically create content based on a single query.

---

# 10. SPEC 06 — EXISTING CONTENT OPPORTUNITY

If actual Search Console data is available, identify:

### Position opportunity

Queries/pages approximately in:

```text
positions 4–10
positions 11–20
```

These can represent opportunities for improvement, but do not treat position alone as proof.

### CTR opportunity

Identify pages with:

```text
meaningful impressions
+
comparatively weak CTR
```

Do not use arbitrary universal CTR thresholds without context.

### Decay opportunity

Identify:

```text
previously performing pages
with meaningful decline
```

Compare appropriate time windows.

### Content mismatch

Identify:

```text
query intent
      ≠
current page intent
```

All findings must be evidence-based.

---

# 11. SPEC 07 — NEW CONTENT OPPORTUNITY

If actual query data exists, identify:

```text
queries with impressions
but no suitable AquaMind page
```

Also identify:

```text
related query clusters
long-tail demand
supporting article opportunities
content gaps
```

Do not simply export hundreds of keywords.

Group by:

```text
search intent
topic
entity
problem
tool
content cluster
```

The purpose is to produce useful signals for Topic Management.

---

# 12. SPEC 08 — WIKI / DATA OPPORTUNITY

Treat Wiki/Data as a supporting growth surface.

Look for evidence such as:

```text
entity-related search demand
high-impression entity queries
queries requiring structured facts
repeated search patterns
```

Potential action:

```text
Improve existing entity page
Create missing entity page
Add supporting article
Improve entity ↔ article linking
```

Do not mass-create database pages merely because keywords exist.

---

# 13. SPEC 09 — PROBLEM OPPORTUNITY

Analyze problem/troubleshooting intent.

Examples of intent classes:

```text
why
symptom
cause
fix
treatment
prevention
```

Map opportunities to:

```text
Problem page
Article
Diagnostic
Tool
Database entity
```

Prioritize based on evidence, not intuition alone.

---

# 14. SPEC 10 — TOOL OPPORTUNITY

Analyze tool/calculator/finder intent.

Identify whether search demand suggests:

```text
calculator
finder
comparison
planning
diagnostic
```

Potential action:

```text
Improve existing tool
Improve tool landing page
Create supporting article
Improve article → tool relationship
```

Do not build a new tool in WEB-07.

---

# 15. SPEC 11 — SERP RESEARCH FRAMEWORK

Define a repeatable SERP research method.

For an important query/topic inspect:

```text
Search intent
Current top results
Content type
SERP features
Common subtopics
Questions
Depth
Freshness
Visual requirements
Internal linking patterns
Potential differentiation
```

Do not copy competitors.

The goal is to understand:

```text
What does Google appear to satisfy?
What is missing?
What can AquaMind do better?
```

If web access is available and the project workflow explicitly requires current SERP research, use current public SERP evidence and record the date of observation.

Do not represent SERP observations as permanent facts.

---

# 16. SPEC 12 — OPPORTUNITY SCORING

Create a transparent scoring framework.

Recommended dimensions:

```text
Search Demand
Current Performance
Business / Strategic Value
Topical Authority Fit
Competition / Difficulty
Effort
```

Do not pretend these are precise Google ranking formulas.

The score is an internal prioritization heuristic.

Example conceptual model:

```text
Opportunity Score =
Demand
× Performance Opportunity
× Strategic Fit
÷ Effort
```

The exact formula must be documented and consistently applied.

Do not use fabricated numeric inputs.

---

# 17. SPEC 13 — FINAL CONTENT PRIORITY CONTRACT

WEB-07 must define the output format that Topic Management can consume.

Required output types:

```text
NEW_ARTICLE
UPDATE_ARTICLE
SUPPORTING_ARTICLE
WIKI_IMPROVEMENT
PROBLEM_IMPROVEMENT
TOOL_IMPROVEMENT
INTERNAL_LINKING
MONITOR
IGNORE
```

Each opportunity should support:

```text
Priority
Opportunity Type
Query / Topic
Intent
Target URL or Proposed URL
Evidence
Why Now
Recommended Action
Related Cluster
Estimated Effort
Expected Value
Confidence
```

Do not decide the user's entire editorial calendar here.

This is the **data contract**, not the editorial decision itself.

---

# 18. SPEC 14 — MASTER TRAFFIC ROADMAP CONTRACT

Define the structure of a future Master Traffic Roadmap.

Suggested structure:

```text
Priority
Opportunity
Type
Target
Evidence
Action
Dependencies
Status
Owner
Date Identified
Review Date
Outcome
```

Separate:

```text
Opportunity
```

from:

```text
Decision
```

and from:

```text
Implementation
```

This prevents search data from automatically becoming development work.

---

# 19. SPEC 15 — MEASUREMENT LOOP

Define the recurring growth loop.

Recommended:

```text
Collect
    ↓
Normalize
    ↓
Analyze
    ↓
Prioritize
    ↓
Implement
    ↓
Publish / Update
    ↓
Wait for sufficient data
    ↓
Measure
    ↓
Compare
    ↓
Learn
```

Do not make decisions from extremely short or noisy periods without documenting the limitation.

---

# 20. SPEC 16 — BASELINE METRICS

If actual data is available, record a baseline.

Possible metrics:

```text
Organic clicks
Organic impressions
Average CTR
Average position
Indexed pages
Top landing pages
Top queries
Branded vs non-branded
Device split
Country split
```

If actual data is unavailable:

```text
Status = NOT AVAILABLE
```

Do not invent baseline values.

---

# 21. SPEC 17 — TRACKING REQUIREMENTS

Identify any missing events or signals that would help future decisions.

Potential signals:

```text
article view
scroll depth
tool usage
finder usage
diagnostic completion
database entity view
internal-link click
search usage
quiz start
quiz completion
```

Do not automatically add every event.

For each proposed event:

```text
Event:
Why needed:
Decision it supports:
Implementation cost:
Priority:
```

Only implement events that are explicitly within WEB-07 scope and clearly useful.

---

# 22. SPEC 18 — PRIVACY / DATA MINIMIZATION

Audit analytics implementation for:

```text
unnecessary personal data
PII
unsafe identifiers
excessive tracking
exposed credentials
client-side secrets
```

Do not collect information that is not necessary for the growth decisions.

Do not expose API keys/tokens.

---

# 23. SPEC 19 — SEO / WEBSITE REGRESSION

Confirm WEB-01 through WEB-06 are not regressed.

At minimum verify:

```text
sitemap
robots
canonical
metadata
JSON-LD
breadcrumbs
internal linking
tools
problems
database
articles
finder
diagnostic
```

Do not turn WEB-07 into another SEO implementation phase.

Fix only regressions caused by WEB-07 work.

---

# 24. GAP REPORT

After completing the specification audit, create:

`WEB-07_GAP_REPORT.md`

Required sections:

```text
# WEB-07 GAP REPORT

## Executive Summary

## Current Measurement Stack

## Search Console Readiness

## Indexation Observability

## Search Performance Data Contract

## Query → Page Mapping

## Existing Content Opportunities

## New Content Opportunities

## Wiki / Data Opportunities

## Problem Opportunities

## Tool Opportunities

## SERP Research Framework

## Opportunity Scoring

## Final Content Priority Contract

## Master Traffic Roadmap Contract

## Measurement Loop

## Baseline Metrics

## Tracking Requirements

## Privacy / Data Minimization

## SEO Regression Check

## Findings by Priority

## Deferred Items

## Data Limitations
```

Every important finding:

```text
ID:
Spec:
Area:
Evidence:
Current State:
Impact:
Priority:
Recommendation:
Implementation:
Verification:
```

---

# 25. IMPLEMENTATION PRIORITY

Use:

```text
P0
Critical measurement/security problem

P1
Important growth-data or observability issue

P2
Useful improvement

P3
Nice-to-have
```

Prioritize:

```text
Measurement correctness
        ↓
Data integrity
        ↓
Search Console readiness
        ↓
Opportunity framework
        ↓
Useful tracking
        ↓
Convenience
```

---

# 26. DO NOT OVERBUILD

AquaMind's current goal is traffic growth.

Do not build:

```text
massive analytics dashboard
custom BI platform
keyword database
keyword crawler
rank tracker
competitor crawler
complex admin panel
```

unless the canonical WEB-07 specification explicitly requires it and the existing architecture supports it.

A documented workflow is often preferable to a new application.

---

# 27. TESTING

Run after implementation:

```text
existing unit tests
analytics-related tests
SEO tests
sitemap tests
JSON-LD tests
relevant route tests
lint
production build
```

Known pre-existing failures remain documented.

Do not alter unrelated tests merely to make them pass.

---

# 28. PRODUCTION VERIFICATION

Verify representative production routes:

```text
/
/posts
/posts/<real-slug>
/database
/problems
/tools
/finder
/diagnostic
```

Confirm:

```text
HTTP success
critical HTML exists
metadata exists
analytics behaves as expected if installed
no runtime errors
no obvious SEO regression
```

If actual Search Console access is unavailable, explicitly report:

```text
Search Console live data:
NOT VERIFIED / NOT AVAILABLE
```

Do not claim otherwise.

---

# 29. CURRENT STATE

Update:

`AQUA_BLOG_CURRENT_STATE.md`

Record:

```text
WEB-07 status
Measurement stack
Search Console readiness
Data availability
Baseline availability
Opportunity framework
Tracking changes
Privacy status
SEO regression status
Build
Lint
Tests
Production verification
Known limitations
Deferred items
```

---

# 30. WEB-07 CHECKPOINT

Create:

`WEB-07_CHECKPOINT.md`

Use:

```text
# WEB-07 CHECKPOINT

## Status

PASS / PASS WITH BACKLOG / BLOCKED

## Objective

Traffic Intelligence, Search Console & Growth Opportunity Foundation

## Specification Results

| Spec | Status | Evidence |
|---|---|---|

## Measurement Stack

Summary.

## Search Console

Actual status. Never assume verification.

## Data Availability

What data was actually available?

## Baseline

Actual metrics or explicitly unavailable.

## Opportunity Framework

Summary.

## Content Priority Contract

Summary.

## Master Traffic Roadmap Contract

Summary.

## Wiki / Data

Summary.

## Problems

Summary.

## Tools

Summary.

## SERP Framework

Summary.

## Tracking

Summary.

## Privacy

Summary.

## SEO Regression

Summary.

## Implemented

Exact files and changes.

## Deferred

Exact items and reasons.

## Known Limitations

List.

## Tests

Result.

## Lint

Result.

## Build

Result.

## Production Verification

Routes and result.

## Continuous Growth Readiness

READY / NOT READY

Reason.

## Current State

Updated: YES/NO

## Next Stage

WEB-08
```

---

# 31. PASS CRITERIA

WEB-07 is:

```text
PASS
```

when:

- all required specifications pass;
- measurement stack is understood;
- Search Console readiness is documented;
- actual data is clearly distinguished from unavailable data;
- no fake metrics exist;
- opportunity framework is defined;
- Topic Management has a usable input/output contract;
- Master Traffic Roadmap structure is defined;
- required tests pass except documented pre-existing/infrastructure issues;
- lint passes;
- production build passes;
- representative production routes work;
- no SEO regression is introduced.

Use:

```text
PASS WITH BACKLOG
```

when remaining work is non-blocking and clearly documented.

Use:

```text
BLOCKED
```

when a critical requirement cannot be completed or verified.

If BLOCKED:

```text
STOP.
Do not proceed to WEB-08.
```

---

# 32. IMPORTANT ARCHITECTURAL BOUNDARY

Keep these three workflows separate:

## A. Xây dựng website

Responsible for:

```text
Website
Performance
UX
SEO infrastructure
Tools
Wiki
Problems
Technical improvements
```

## B. Quản lý chủ đề

Responsible for:

```text
Search Console interpretation
SERP interpretation
Content opportunities
Final Content Priority
Master Traffic Roadmap
Which topic to work on next
New vs update decisions
```

## C. Viết Content

Responsible for:

```text
One concrete topic
Research
Outline
Writing
SEO article production
Images
Internal links
Metadata
Publish-ready content
```

WEB-07 must not collapse these responsibilities into one workflow.

---

# 33. FINAL STRATEGIC STOP

WEB-07 does NOT mean:

```text
"Now automatically write content."
```

It means:

```text
We now know how to measure.
We know what data we need.
We know how to identify opportunities.
We know how to pass those opportunities to Topic Management.
```

After WEB-07:

```text
WEB-08
```

is still the next website phase.

Only after WEB-08 should the project enter:

```text
CONTINUOUS GROWTH
```

where content becomes the primary growth engine.

---

# 34. FINAL STOP RULE

After creating:

```text
WEB-07_GAP_REPORT.md
WEB-07_CHECKPOINT.md
```

and updating:

```text
AQUA_BLOG_CURRENT_STATE.md
```

STOP.

Do not:

- start WEB-08;
- write blog articles;
- select the next topic;
- build AdSense;
- add advertising;
- redesign the CMS;
- build a keyword SaaS;
- create a custom rank tracker;
- perform unrelated website optimization.

Final response must be:

```text
WEB-07 completed.

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

Search Console Data:
AVAILABLE / PARTIALLY AVAILABLE / NOT AVAILABLE

Current State:
Updated

Checkpoint:
WEB-07_CHECKPOINT.md

Continuous Growth Readiness:
READY / NOT READY

Next:
WEB-08
```

Then stop.
