# WEB-07 Gap Report — Traffic Intelligence, Search Console & Growth Opportunity Foundation

## Status

PASS WITH BACKLOG

## Executive Summary

AquaMind has **no analytics, no Search Console integration, and no behavioral measurement** in production. The cookie consent system includes an "analytics" toggle, but no analytics provider is installed. This is expected for a project that has focused on construction (WEB-01 through WEB-06). WEB-07 establishes the measurement framework and data contracts so that when analytics/Search Console are connected, the infrastructure is ready.

---

## SPEC 01 — Analytics Inventory

**Status:** NOT IMPLEMENTED

| Integration | Present | Provider | Implementation | Environment Variables | Production Active |
|---|---|---|---|---|---|
| Google Analytics | NO | — | — | — | — |
| Google Tag Manager | NO | — | — | — | — |
| Vercel Analytics | NO | — | — | — | — |
| Plausible | NO | — | — | — | — |
| Umami | NO | — | — | — | — |
| Other analytics | NO | — | — | — | — |

**Cookie consent:** System exists with `analytics` boolean toggle (`lib/cookie-consent.ts`), but nothing reads this preference to load scripts.

**Privacy:** No PII collection, no tracking scripts, no exposed credentials. No analytics-related security concerns.

**Impact:** No user behavior data is collected. Cannot measure engagement, bounce rate, tool usage, or diagnostic completion.

---

## SPEC 02 — Search Console Readiness

**Status:** NOT VERIFIED

| Aspect | Status | Evidence |
|---|---|---|
| Domain/property setup | UNKNOWN | No `google-site-verification` meta tag found |
| Sitemap availability | READY | `/sitemap.xml` exists, comprehensive, ISR 3600s |
| robots.txt | READY | Allows all except `/studio`, points to sitemap |
| Canonical URLs | READY | All pages have `alternates.canonical` |
| Indexable pages | READY | 271+ pages, proper metadata |
| Structured data | READY | BreadcrumbList, Article, HowTo, CollectionPage, WebSite |
| Site ownership verification | NOT FOUND | No verification meta tag or HTML file |

**Search Console data contract (required fields for future analysis):**

```
date         — Query date
query        — Search query text
page         — Landing page URL
clicks       — Number of clicks from SERP
impressions  — Number of times shown in SERP
ctr          — Click-through rate (clicks/impressions)
position     — Average ranking position
country      — Country of searcher
device       — mobile / desktop / tablet
searchAppearance — Rich result type if applicable
```

**Normalization:**
- Date range: rolling 28 days (standard Search Console window)
- Aggregation: daily for trends, monthly for strategy
- Deduplication: merge www/non-www, http/https

---

## SPEC 03 — Sitemap / Indexation Observability

**Status:** READY

The sitemap (`app/sitemap.ts`) covers:
- 42 static/listing paths with appropriate priorities
- All 8 document types (post, species, invertebrate, plant, coral, equipment, problem, inspiration)
- Categories, learn paths, styles
- ISR revalidation: 3600s

**Indexation blind spots:** None detected. All important page families are in the sitemap.

**Noindex routes:** `/search` (via robots metadata). Correct.

**Diagnosis URLs:** Client-side state only, no indexable parameter URLs. Correct per WEB-06.

---

## SPEC 04 — Search Performance Data Contract

**Status:** DEFINED (no live data)

Since no Search Console data is available, the canonical schema is defined for when data becomes available:

**Required fields:** date, query, page, clicks, impressions, ctr, position
**Optional fields:** country, device, searchAppearance
**Date range:** Rolling 28 days, stored in analysis documents
**Aggregation:** Daily for time series, monthly for opportunity analysis

---

## SPEC 05 — Query → Page Mapping

**Status:** FRAMEWORK DEFINED (no live data)

Expected mapping structure:
```
Query → Intent (informational/transactional/navigational) → Target Page → Existing? → Page Type → Topic/Cluster → Performance → Opportunity → Action
```

Action categories: Keep, Improve, Expand, Create Supporting Article, Create New Page, Redirect/Canonical, Ignore

---

## SPEC 06 — Existing Content Opportunity

**Status:** NOT AVAILABLE (requires Search Console data)

When data is available, identify:
- Position opportunity: queries in positions 4-10 and 11-20
- CTR opportunity: high impressions + weak CTR
- Decay opportunity: previously performing pages with decline
- Content mismatch: query intent ≠ page intent

---

## SPEC 07 — New Content Opportunity

**Status:** NOT AVAILABLE (requires Search Console data)

When data is available, identify:
- Queries with impressions but no suitable AquaMind page
- Related query clusters
- Long-tail demand
- Supporting article opportunities
- Content gaps by topic/entity/problem/tool

---

## SPEC 08 — Wiki / Data Opportunity

**Status:** FRAMEWORK DEFINED

Expected signals:
- Entity-related search demand
- High-impression entity queries
- Queries requiring structured facts
- Repeated search patterns

Potential actions: Improve existing entity page, create missing entity page, add supporting article, improve entity ↔ article linking

---

## SPEC 09 — Problem Opportunity

**Status:** FRAMEWORK DEFINED

Expected intent classes:
- why, symptom, cause, fix, treatment, prevention

Map to: Problem page, Article, Diagnostic, Tool, Database entity

---

## SPEC 10 — Tool Opportunity

**Status:** FRAMEWORK DEFINED

Expected intent classes:
- calculator, finder, comparison, planning, diagnostic

Potential actions: Improve existing tool, improve tool landing page, create supporting article, improve article → tool relationship

---

## SPEC 11 — SERP Research Framework

**Status:** DEFINED

Repeatable method per query/topic:
1. Search intent
2. Current top results
3. Content type
4. SERP features
5. Common subtopics
6. Questions
7. Depth / Freshness
8. Visual requirements
9. Internal linking patterns
10. Potential differentiation

---

## SPEC 12 — Opportunity Scoring

**Status:** DEFINED

Dimensions:
- Search Demand (impressions, volume signal)
- Current Performance (position, CTR)
- Business/Strategic Value
- Topical Authority Fit
- Competition/Difficulty
- Effort

Formula: `Opportunity Score = Demand × Performance Opportunity × Strategic Fit ÷ Effort`

Scale: 1-10 per dimension, composite score for ranking

---

## SPEC 13 — Final Content Priority Contract

**Status:** DEFINED

Output types: NEW_ARTICLE, UPDATE_ARTICLE, SUPPORTING_ARTICLE, WIKI_IMPROVEMENT, PROBLEM_IMPROVEMENT, TOOL_IMPROVEMENT, INTERNAL_LINKING, MONITOR, IGNORE

Each opportunity: Priority, Type, Query/Topic, Intent, Target URL, Evidence, Why Now, Recommended Action, Related Cluster, Estimated Effort, Expected Value, Confidence

---

## SPEC 14 — Master Traffic Roadmap Contract

**Status:** DEFINED

Structure: Priority, Opportunity, Type, Target, Evidence, Action, Dependencies, Status, Owner, Date Identified, Review Date, Outcome

Separates: Opportunity → Decision → Implementation

---

## SPEC 15 — Measurement Loop

**Status:** DEFINED

Cycle: Collect → Normalize → Analyze → Prioritize → Implement → Publish → Wait → Measure → Compare → Learn

Minimum measurement window: 4 weeks after publish/update

---

## SPEC 16 — Baseline Metrics

**Status:** NOT AVAILABLE

```
Organic clicks:          NOT AVAILABLE
Organic impressions:     NOT AVAILABLE
Average CTR:             NOT AVAILABLE
Average position:        NOT AVAILABLE
Indexed pages:           271+ (from sitemap, estimate)
Top landing pages:       NOT AVAILABLE
Top queries:             NOT AVAILABLE
Branded vs non-branded:  NOT AVAILABLE
Device split:            NOT AVAILABLE
Country split:           NOT AVAILABLE
```

---

## SPEC 17 — Tracking Requirements

**Status:** FRAMEWORK DEFINED (not implemented — requires analytics provider)

Proposed events (when analytics is installed):
- `article_view` — page view on /posts/[slug]
- `tool_usage` — calculator form submission
- `finder_completion` — finder quiz completed
- `diagnostic_completion` — diagnosis wizard completed
- `database_entity_view` — page view on /species/[slug] etc.
- `internal_link_click` — navigation between content types
- `search_usage` — search modal opened + query

Priority: Install analytics provider first, then add events incrementally.

---

## SPEC 18 — Privacy / Data Minimization

**Status:** COMPLIANT

- No PII collected
- No tracking scripts loaded
- Cookie consent system exists with analytics toggle
- No exposed credentials
- No client-side secrets
- GDPR-ready cookie banner with granular consent

---

## SPEC 19 — SEO Regression Check

**Status:** NO REGRESSION

Verified:
- Sitemap: ✓ (271 pages, all routes)
- Robots: ✓ (allows all except /studio)
- Canonical: ✓ (all pages)
- Metadata: ✓ (all pages, OG + Twitter)
- JSON-LD: ✓ (all types present)
- Breadcrumbs: ✓ (Home in all breadcrumb chains)
- Internal linking: ✓ (WEB-03 links intact)
- Tools: ✓ (all 12 functional)
- Problems: ✓ (hub + detail + diagnose)
- Database: ✓ (5 entity types)
- Articles: ✓ (15 posts)
- Finder: ✓ (functional)
- Diagnostic: ✓ (functional)

No WEB-07 changes were made to production code, so no regression risk.

---

## Findings by Priority

### P0 — Critical
None.

### P1 — High
1. No analytics provider installed — cannot measure any user behavior
2. No Search Console verification — cannot measure search performance
3. No baseline metrics available

### P2 — Medium
4. Cookie consent "analytics" toggle exists but nothing reads it
5. No event tracking for tool usage, diagnostic completion, or finder usage

### P3 — Low
6. README mentions Plausible/Umami as future options but not implemented
7. No A/B testing framework

---

## Deferred Items

| Item | Reason | Dependency |
|---|---|---|
| Install analytics provider | Requires decision on provider (Plausible recommended in README) | User/admin approval |
| Search Console verification | Requires DNS/HTML verification access | Hosting access |
| Event tracking implementation | Requires analytics provider first | Analytics provider |
| Baseline metrics collection | Requires Search Console + analytics data | 2-4 weeks of data |
| Opportunity analysis | Requires Search Console data | Baseline |
| Content priority scoring | Requires opportunity analysis | Search Console data |

---

## Data Limitations

1. **No analytics data** — Zero behavioral data available
2. **No Search Console data** — Zero search performance data available
3. **No baseline** — Cannot establish pre-optimization benchmarks
4. **No A/B testing** — Cannot measure impact of changes
5. **Content gaps unknown** — Cannot identify which topics have search demand without data

The measurement framework is defined. Actual data collection requires:
1. Analytics provider installation (Plausible recommended — privacy-first, no cookie banner needed)
2. Search Console property verification (requires hosting DNS access)
3. 2-4 weeks of data collection before meaningful analysis
