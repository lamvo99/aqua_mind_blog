# AquaMind WEB-01 — Technical SEO & Indexation Specification

**Purpose:** Establish a technically sound, crawlable, indexable and search-engine-friendly foundation for AquaMind before higher-level content and growth work.

## Scope

Audit and, where necessary, implement/fix:

- robots.txt
- XML sitemap(s)
- canonical URLs
- metadata architecture
- index/noindex behavior
- HTTP/HTTPS and hostname consistency
- trailing-slash and URL normalization
- redirects and duplicate URL patterns
- 404/410 behavior
- status codes
- crawlable navigation
- internal URL generation
- pagination/query-state handling
- structured data baseline
- Open Graph/Twitter metadata where appropriate
- language/locale metadata where applicable
- image SEO basics
- RSS/feed if present or justified
- Search Console readiness
- technical SEO regression protection

## Required Audit Process

Do not assume implementation from file existence. Trace source code and verify production behavior where applicable.

For each requirement record:

```text
Requirement
Current state
Source location
Production evidence
Status: IMPLEMENTED / PARTIAL / MISSING / BROKEN / N/A / UNKNOWN
Impact
Recommendation
```

## URL Canonicalization

Confirm one canonical URL for every indexable page. Check:

- protocol
- hostname
- path normalization
- trailing slash policy
- query parameters
- duplicate routes
- canonical generation from CMS slugs

Canonical must not point to an unrelated page.

## Robots

Verify that robots rules do not accidentally block:

- public article pages
- entity pages
- tool landing pages
- problem pages
- important assets required for rendering

Do not index private/admin/CMS routes.

## Sitemap

Verify sitemap coverage for intended indexable URLs and exclusion of:

- admin routes
- internal application states
- duplicate URLs
- query-state URLs
- non-indexable diagnosis states

Sitemap URLs must return valid canonical pages.

## Metadata

Verify dynamic metadata for each major page type:

- title
- description
- canonical
- robots
- Open Graph
- Twitter/X metadata where applicable

Metadata should be generated from actual content/data and not duplicated blindly across pages.

## Structured Data

Audit existing JSON-LD/schema implementation. Where justified, use appropriate schema types such as:

- Article
- BreadcrumbList
- WebSite
- Organization
- relevant entity types

Do not add schema merely for keyword manipulation. Structured data must accurately describe visible page content.

## Indexation Rules

Define clear rules for:

```text
Indexable:
public articles
public entities
public tools/landing pages
public problem pages
useful hubs

Normally non-indexable:
admin/CMS
private routes
internal UI states
query/filter states without unique search value
diagnosis question states
```

## Error / Redirect Handling

Audit:

- 404
- 410 where appropriate
- redirect chains
- soft 404 risks
- broken internal URLs
- CMS deleted/changed slugs

Avoid redirect chains and mass redirects to irrelevant destinations.

## Crawlability

Ensure important content is discoverable through normal HTML links. Do not make essential navigation depend exclusively on client-side interactions that crawlers cannot reliably follow.

## Search Console Readiness

The site should be ready for monitoring in Google Search Console, including:

- sitemap submission
- canonical inspection
- indexing coverage review
- performance reporting
- URL inspection

Search Console data itself is used by the Content/Topic workflow to determine content priorities; WEB-01 only establishes the technical foundation.

## Acceptance Criteria

```text
[ ] Canonical policy verified
[ ] Robots verified
[ ] Sitemap verified
[ ] Metadata verified for major page types
[ ] Index/noindex policy documented
[ ] Duplicate URL behavior verified
[ ] 404/redirect behavior verified
[ ] Structured data audited
[ ] Crawlable navigation verified
[ ] Query-state/indexation risks checked
[ ] Production URLs verified
[ ] Build/tests pass
[ ] CURRENT_STATE updated
```

## Relationship to Later Specs

WEB-01 is the technical foundation.

```text
WEB-01 Technical SEO
        ↓
WEB-02 Information Architecture
        ↓
WEB-03 Internal Linking
        ↓
WEB-04 Entity SEO
        ↓
WEB-05 Tools SEO
        ↓
WEB-06 Problems / Diagnosis
        ↓
WEB-07 Analytics / Growth
        ↓
WEB-08 UX / Performance / Animation
```

Do not silently implement requirements belonging to later specifications unless they are a necessary dependency for WEB-01.
