# SPEC 08.1 — CANONICAL HOST ALIGNMENT

## Role

You are OpenCode, implementation engineer for AquaMind Blog.

SPEC 08 passed with:

> PASS WITH FIXES — SEO INTEGRATION VERIFIED AFTER CODE FIXES

The remaining site-wide SEO issue is canonical host alignment.

This SPEC fixes ONLY the canonical host inconsistency.

---

# 1. Objective

Make the AquaMind website use ONE canonical production host consistently.

Current state:

```text
Code / SEO signals:
https://aquamind.life

Hosting:
https://aquamind.life
        ↓ HTTP 308
https://www.aquamind.life
```

Decision:

> `https://www.aquamind.life` is the canonical production host.

After this SPEC, all generated absolute SEO URLs must consistently use:

```text
https://www.aquamind.life
```

The following must agree:

- metadataBase
- canonical
- sitemap
- robots sitemap URL
- og:url
- JSON-LD absolute URLs
- other SEO-related absolute URLs

---

# 2. Hard Safety Rules

DO NOT:

- modify Sanity production data
- modify Sanity documents
- modify species metadata
- modify post metadata
- modify slugs
- modify article content
- modify SEO values written by SPEC 07G
- perform database migrations
- upgrade dependencies unless strictly necessary
- perform unrelated refactoring

This is a website configuration / URL consistency change only.

---

# 3. First — Inspect Hosting Behavior

Before changing code, verify the current production redirect.

Check:

```text
https://aquamind.life/
https://aquamind.life/robots.txt
https://aquamind.life/sitemap.xml
https://aquamind.life/species/paracheirodon-simulans
```

Expected current behavior:

```text
HTTP 308
Location: https://www.aquamind.life/...
```

Also verify:

```text
https://www.aquamind.life/
```

returns the actual application rather than another redirect.

Do not change hosting configuration unless the repository contains the hosting configuration and the change is explicitly required.

The canonical decision is:

```text
www.aquamind.life
```

---

# 4. Discover All Absolute Site URL Sources

Search the repository for:

```text
aquamind.life
NEXT_PUBLIC_SITE_URL
metadataBase
canonical
alternates
og:url
url:
sitemap
robots
JSON-LD
siteUrl
SITE_URL
```

Also search for:

```text
https://aquamind.life
http://aquamind.life
www.aquamind.life
```

Produce a list of all relevant occurrences.

Classify each:

```text
SEO / canonical
Internal application URL
External reference
Documentation/example
Test fixture
Unrelated string
```

Do NOT mechanically replace every occurrence.

---

# 5. Environment / Site URL

Identify the canonical source of truth for production site URL.

Preferred:

```text
NEXT_PUBLIC_SITE_URL
```

If current architecture already uses a centralized site URL helper, reuse it.

Production value should become:

```text
https://www.aquamind.life
```

Do not hard-code `www` in many independent locations if the project already has a centralized URL helper.

If `.env.local` is development-only and deployment configuration is external, document exactly where production must be updated.

Do not expose secrets.

---

# 6. Required SEO Surfaces

Verify and align all of the following.

## 6.1 Root metadata

`app/layout.tsx`

Expected:

```text
metadataBase = https://www.aquamind.life
```

---

## 6.2 Species canonical

Species pages:

```text
/species/<slug>
```

Expected:

```text
https://www.aquamind.life/species/<slug>
```

---

## 6.3 Species OG URL

Expected:

```text
og:url = https://www.aquamind.life/species/<slug>
```

---

## 6.4 Sitemap

Expected sitemap URLs:

```text
https://www.aquamind.life/...
```

No:

```text
https://aquamind.life/...
```

No localhost.

No query strings.

No duplicate URLs caused by host differences.

---

## 6.5 Robots

Expected:

```text
Sitemap: https://www.aquamind.life/sitemap.xml
```

---

## 6.6 JSON-LD

Inspect:

```text
lib/seo/jsonld.tsx
```

and any other structured-data helpers.

Absolute site URLs must use:

```text
https://www.aquamind.life
```

where they represent AquaMind's canonical website.

Do not modify schema semantics unnecessarily.

---

# 7. Other SEO URL Surfaces

Search for and verify:

- `alternates.canonical`
- `openGraph.url`
- `twitter`
- JSON-LD `@id`
- JSON-LD `url`
- BreadcrumbList
- WebSite
- Article
- CollectionPage
- ItemList
- RSS/feed absolute URLs
- LLM/feed URLs

Only change URLs that represent AquaMind's own canonical production host.

Do not change:

- Sanity CDN URLs
- external source URLs
- social network URLs
- third-party URLs

---

# 8. Redirect Strategy

Do NOT introduce a second redirect layer unless necessary.

The current hosting behavior:

```text
apex → www
```

is acceptable and should remain the single host redirect.

Goal:

```text
User/search crawler
       ↓
www.aquamind.life
       ↓
200
```

while:

```text
aquamind.life
       ↓
308
       ↓
www.aquamind.life
       ↓
200
```

Canonical should point directly to:

```text
www.aquamind.life
```

Never:

```text
canonical → apex → 308 → www
```

---

# 9. Test Requirements

Add/update focused tests for canonical host behavior.

Minimum:

### Test 1 — Site URL

```text
site URL = https://www.aquamind.life
```

### Test 2 — Species canonical

Expected:

```text
https://www.aquamind.life/species/<slug>
```

### Test 3 — OG URL

Expected:

```text
https://www.aquamind.life/species/<slug>
```

### Test 4 — Sitemap

All generated URLs use:

```text
https://www.aquamind.life
```

### Test 5 — Robots

Sitemap directive uses:

```text
https://www.aquamind.life/sitemap.xml
```

### Test 6 — JSON-LD

Canonical site URLs use:

```text
https://www.aquamind.life
```

---

# 10. Regression Requirements

Existing SPEC 08 behavior MUST remain unchanged.

Verify:

## Species SEO

For species WITH SEO:

```text
seo.metaTitle
→ exact title
```

```text
seo.metaDescription
→ exact description
```

No:

```text
| AquaMind Blog
```

suffix added to frozen SEO titles.

## Species WITHOUT SEO

Fallback behavior remains:

```text
<Name> — Fish Profile | AquaMind Blog
```

and excerpt fallback remains intact.

## Robots

Species:

```text
index, follow
```

## Search

`/search` remains:

```text
noindex
```

## Sitemap

Species count remains:

```text
218
```

No duplicate URLs.

No localhost.

No apex URLs.

---

# 11. Validation Commands

Run:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Also run the focused SEO tests.

Known unrelated baseline:

```text
tests/compare.test.ts
```

may still fail because of the existing database-type expectation mismatch.

Do not modify that test as part of SPEC 08.1.

Report it separately if still present.

---

# 12. Local Production Verification

Run the production build.

Start the local production server.

Verify at minimum:

```text
/
robots.txt
sitemap.xml

/species/paracheirodon-simulans
/species/celestichthys-erythromicron
/species/apistogramma-agassizii
/species/danio-rerio
```

For each species page inspect raw HTML.

Verify:

```text
<title>
description
canonical
og:url
og:title
og:description
twitter:title
twitter:description
robots
```

Expected canonical host:

```text
www.aquamind.life
```

---

# 13. Production Verification

Before deployment, do NOT claim production is fixed.

After deployment, verify:

```text
https://www.aquamind.life/
https://www.aquamind.life/robots.txt
https://www.aquamind.life/sitemap.xml
```

and the 6 SPEC 08 species URLs:

```text
/species/paracheirodon-simulans
/species/celestichthys-erythromicron
/species/apistogramma-agassizii
/species/danio-rerio
/species/aphyosemion-australe
/species/corydoras-paleatus
```

Expected:

```text
HTTP 200
canonical = https://www.aquamind.life/...
robots = index, follow
```

and for the 6 SEO-enabled species:

```text
<title> = frozen SPEC 07G metaTitle
description = frozen SPEC 07G metaDescription
```

No template suffix on the frozen SEO title.

---

# 14. Scope Gate

Before completion, verify:

```text
Sanity writes = 0
Content changes = 0
SEO metadata changes = 0
Slug changes = 0
Dependency upgrades = 0
Unrelated refactors = 0
```

If any occur, STOP and report.

---

# 15. Required Deliverables

Create:

```text
report/SPEC_08_1/
```

with:

```text
SPEC_08_1_CANONICAL_HOST_AUDIT.md
SPEC_08_1_URL_INVENTORY.md
SPEC_08_1_TEST_RESULTS.md
SPEC_08_1_PRODUCTION_RECHECK.md
```

Mirror to:

```text
reports/SPEC_08_1/
```

The two report directories must be byte-identical.

---

# 16. Final Report

Include:

## Canonical Decision

```text
Canonical host:
https://www.aquamind.life

Apex behavior:
308 → www
```

## URL Inventory

Before/after counts:

```text
apex occurrences
www occurrences
localhost occurrences
external URLs
```

Explain only relevant AquaMind-owned URLs.

## Files Changed

Exact list.

## Tests

```text
lint:
typescript:
focused SEO tests:
full tests:
build:
```

## Production

```text
homepage:
robots:
sitemap:
species pages:
canonical:
metadata:
indexability:
```

## Scope Safety

```text
Sanity writes: 0
content mutations: 0
SEO data mutations: 0
```

---

# 17. Final Verdict

Use exactly one:

```text
PASS — CANONICAL HOST ALIGNED
```

or

```text
PASS WITH FIXES — CANONICAL HOST ALIGNED AFTER CODE FIXES
```

or

```text
BLOCKED — CANONICAL HOST ALIGNMENT REQUIRES HOSTING CHANGE
```

Do not claim PASS until the code, tests and production behavior are consistent.

---

# 18. IMPORTANT — Deployment Boundary

Do NOT commit or push automatically.

Complete the implementation, tests and local verification.

If production deployment requires:

```text
git commit
git push
```

STOP before those commands and report:

```text
READY FOR PM DEPLOY APPROVAL
```

The PM will explicitly authorize deployment.

# END SPEC 08.1
