# SPEC 08.1 — URL Inventory

**Date:** 2026-10-06
**Scan scope:** all `.ts`/`.tsx` under `app/`, `lib/`, `tests/` + `.env.local`. Machine-readable artifacts: `spec081_inventory_before.json` / `spec081_inventory_after.json` (session temp).

## §16 — Before / after counts

| Metric | Before | After |
|---|---:|---:|
| Apex URLs `https://aquamind.life` (code) | **81** (54 files) | **0** |
| WWW URLs `https://www.aquamind.life` (code) | 0 | **81** |
| `.env.local` `NEXT_PUBLIC_SITE_URL` | `https://aquamind.life` | `https://www.aquamind.life` |
| Scheme-less `aquamind.life` (prose/display) | 4 | 4 (unchanged, classified documentation) |
| `localhost` occurrences | 22 (dev fallback + test fixtures) | 22 (unchanged, classified unrelated) |
| External URLs | 7 | 7 (unchanged) |

Diff totals: `54 files changed, 99 insertions(+), 85 deletions(-)` = 77 URL lines (±) + the pre-existing SPEC 08 changes (+22/−8 in `app/species/[slug]/page.tsx` + `lib/database.ts`).

## §4 — Classification of every `aquamind.life` occurrence

### SEO / canonical — CHANGED (81 occurrences, 54 files)

| Pattern | Count | Files |
|---|---:|---:|
| `alternates: { canonical: "https://aquamind.life/..." }` | ~45 | all static pages (`about`, `contact`, `cookie-policy`, `privacy-policy`, `terms-of-service`, `corals`, `database`, `equipment`, `finder`, `inspiration`, `invertebrates`, `learn`, `plants`, `privacy-policy`, `problems`(+`/diagnose`), `search`, `setup-planner`, `species`, `start-here`, `styles/[slug]`, `tools`(+11 subtools), `wiki`, `page.tsx`, all `[slug]` detail pages) |
| `openGraph.url` / canonical template literals on `[slug]` pages | 12 | `corals`, `equipment`, `inspiration`, `invertebrates`, `plants`, `problems`, `species` `[slug]` pages |
| `const siteUrl = process.env.NEXT_PUBLIC_SITE_URL \|\| "https://aquamind.life"` (fallback default) | 11 | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/feed.xml/route.ts`, `app/llms.txt/route.ts`, `app/posts/page.tsx`, `app/posts/[slug]/page.tsx`, `app/category/[slug]/page.tsx`, `lib/seo/jsonld.tsx` (+ `.env.local` value) |
| JSON-LD absolute URLs (`CollectionPage` url + `ItemList` item urls) | 14 | `corals`, `equipment`, `invertebrates`, `plants`, `species`, `wiki` collection pages |
| Test expectations (host contract) | 11 | `tests/sitemap.test.ts` (8), `tests/species-seo-metadata.test.ts` (3) |

### Internal application URL — 0

All internal links in markup are root-relative (`/contact`, `/species/...`). No absolute internal URLs outside the SEO surfaces above.

### External reference — 7 (unchanged)

`pinterest.com` share button, `w3.org/2005/Atom` namespace, `api.resend.com`, `dicebear.com` avatars, `example.com` fixtures (incl. test CDN fixture).

### Documentation / display text — 4 (unchanged, scheme-less)

| Location | Text | Why unchanged |
|---|---|---|
| `app/cookie-policy/page.tsx:108` | anchor text `aquamind.life/contact` (href is relative `/contact`) | legal-page display text, not a generated SEO URL |
| `app/privacy-policy/page.tsx:39` | prose "the website aquamind.life" | legal prose — changing it is a content change (out of scope) |
| `app/privacy-policy/page.tsx:110` | anchor text `aquamind.life/contact` (href relative) | legal-page display text |
| `app/terms-of-service/page.tsx:37` | prose "(aquamind.life)" | legal prose |

Apex still resolves (308 → www), so these display references remain functional.

### Test fixture / unrelated — 22 localhost (unchanged)

| File | Count | Nature |
|---|---:|---|
| `lib/newsletter.ts:33` | 1 | dev-only fallback base URL `http://localhost:3000` (never SEO output) |
| `tests/api-comments.test.ts` | 11 | API test fixtures |
| `tests/api-newsletter-confirm.test.ts` | 8 | API test fixtures |
| `tests/api-newsletter.test.ts` | 1 | API test fixture |
| `tests/api-revalidate.test.ts` | 1 | API test fixture |

None appear in sitemap, canonicals, JSON-LD or any rendered SEO surface (verified: local production HTML/sitemap 0 localhost).

### Sanity CDN / third-party (unchanged)

`cdn.sanity.io` image URLs — explicitly protected per §7.

## Exact files changed (this SPEC)

```text
app/about/page.tsx
app/category/[slug]/page.tsx
app/contact/page.tsx
app/cookie-policy/page.tsx
app/corals/[slug]/page.tsx
app/corals/page.tsx
app/database/page.tsx
app/equipment/[slug]/page.tsx
app/equipment/page.tsx
app/feed.xml/route.ts
app/finder/page.tsx
app/inspiration/[slug]/page.tsx
app/inspiration/page.tsx
app/invertebrates/[slug]/page.tsx
app/invertebrates/page.tsx
app/layout.tsx
app/learn/[slug]/page.tsx
app/learn/page.tsx
app/llms.txt/route.ts
app/manifest.ts
app/page.tsx
app/plants/[slug]/page.tsx
app/plants/page.tsx
app/posts/[slug]/page.tsx
app/posts/page.tsx
app/privacy-policy/page.tsx
app/problems/[slug]/page.tsx
app/problems/diagnose/page.tsx
app/problems/page.tsx
app/robots.ts
app/search/page.tsx
app/setup-planner/page.tsx
app/sitemap.ts
app/species/[slug]/page.tsx
app/species/page.tsx
app/start-here/page.tsx
app/styles/[slug]/page.tsx
app/terms-of-service/page.tsx
app/tools/aquarium-calculator/page.tsx
app/tools/aquarium-volume/page.tsx
app/tools/co2/page.tsx
app/tools/compatibility-checker/page.tsx
app/tools/diagnostic/page.tsx
app/tools/dosing/page.tsx
app/tools/lighting/page.tsx
app/tools/page.tsx
app/tools/pump-flow/page.tsx
app/tools/salt-mixing/page.tsx
app/tools/stocking/page.tsx
app/tools/water-change/page.tsx
app/wiki/page.tsx
lib/seo/jsonld.tsx
tests/sitemap.test.ts
tests/species-seo-metadata.test.ts
.env.local                                  (NEXT_PUBLIC_SITE_URL value only)
tests/canonical-host.test.ts                (NEW — 6 focused tests)
```

Sanity CDN URLs, external URLs, prose display text, localhost fixtures and documentation files (`docs/`, `report/`, `reports/`) were not modified.
