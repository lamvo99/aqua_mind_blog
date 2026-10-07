# SPEC 08.1 — Canonical Host Audit

**Date:** 2026-10-06
**Spec:** `docs/SPEC_08_1_CANONICAL_HOST_ALIGNMENT.md`
**Scope:** website configuration / URL consistency only. No Sanity writes, no content/slug/SEO-value changes, no dependency upgrades.

## Verdict

**PASS WITH FIXES — CANONICAL HOST ALIGNED AFTER CODE FIXES**

All code, tests and the local production build are consistent on `https://www.aquamind.life`. Live production is NOT yet claimed fixed — it requires deployment (see `SPEC_08_1_PRODUCTION_RECHECK.md` and §18 deployment boundary).

## Canonical decision

```text
Canonical host: https://www.aquamind.life
Apex behavior:  https://aquamind.life → HTTP 308 → https://www.aquamind.life (unchanged, single redirect layer, no new redirects introduced)
```

## §3 — Hosting inspection (before any code change)

| URL | Result |
|---|---|
| `https://aquamind.life/` | **308** → `https://www.aquamind.life/` |
| `https://aquamind.life/robots.txt` | **308** → `https://www.aquamind.life/robots.txt` |
| `https://aquamind.life/sitemap.xml` | **308** → `https://www.aquamind.life/sitemap.xml` |
| `https://aquamind.life/species/paracheirodon-simulans` | **308** → `https://www.aquamind.life/species/...` |
| `https://www.aquamind.life/` | **200** — actual application, no further redirect |

Hosting already implements the required strategy (§8): `apex → 308 → www → 200`. **No hosting configuration change was needed or made** (hosting config is not in this repository). The defect was that generated SEO signals pointed at the apex instead of the canonical host.

## §5 — Source of truth for site URL

- Central expression used by the project (no pre-existing shared helper): `process.env.NEXT_PUBLIC_SITE_URL || "<default>"`.
- `.env.local` (local/dev): `NEXT_PUBLIC_SITE_URL` updated `"https://aquamind.life"` → `"https://www.aquamind.life"`.
- Code defaults (11 derivation sites): fallback literal updated to `https://www.aquamind.life` so the site is correct even without the env var.
- **Production (external, not in repo):** the deployment platform's environment variable `NEXT_PUBLIC_SITE_URL` must be set to `https://www.aquamind.life`. If it is currently set to `https://aquamind.life` on the hosting platform, the env-driven surfaces (root metadata, sitemap, robots, feed, llms.txt, manifest, JSON-LD, posts/category pages) would keep emitting apex after deploy. No deployment configuration file (`vercel.json`, `.github/workflows`, `.vercel`) exists in this repository — this is documented as a required PM deployment step in `SPEC_08_1_PRODUCTION_RECHECK.md`.

## §6 — Required SEO surfaces (local production build verified)

| Surface | File | Result (verified in rendered output) |
|---|---|---|
| 6.1 Root metadata (`metadataBase`, og:url, root canonical) | `app/layout.tsx` | `metadataBase = https://www.aquamind.life`; homepage `<link rel=canonical> = https://www.aquamind.life`, `og:url = https://www.aquamind.life`, 0 apex URLs in HTML (incl. JSON-LD) |
| 6.2 Species canonical | `app/species/[slug]/page.tsx` | `https://www.aquamind.life/species/<slug>` on all 6 sample pages + 2 fallback pages |
| 6.3 Species OG URL | `app/species/[slug]/page.tsx` | `og:url = https://www.aquamind.life/species/<slug>` |
| 6.4 Sitemap | `app/sitemap.ts` | 553 URLs, **553/553 www**, 0 apex, 0 localhost, 0 query, 0 duplicates, 218 species, single host `www.aquamind.life` |
| 6.5 Robots | `app/robots.ts` | `Sitemap: https://www.aquamind.life/sitemap.xml`; rules unchanged (`Allow: /`, `Disallow: /studio`) |
| 6.6 JSON-LD | `lib/seo/jsonld.tsx` | siteUrl-derived `Organization.url`, `WebSite.url`, `logo`, `SearchAction`, breadcrumb items, `mainEntityOfPage.@id`, `HowTo.url` all `https://www.aquamind.life`; `CollectionPage`/`ItemList` caller URLs aligned in 7 collection pages |

## §7 — Other surfaces aligned

- `alternates.canonical` on 40+ static pages (about, contact, legal, tools×12, wiki, database, finder, search, learn, categories, collections…).
- `openGraph.url` on all `[slug]` detail pages (corals, equipment, inspiration, invertebrates, plants, problems) and `app/page.tsx`.
- RSS (`app/feed.xml`): 42 www links, 0 apex (rendered output). `app/llms.txt`: 0 apex. `app/manifest.ts` (relative URLs) derivation updated.
- Not changed (per §7 rules): Sanity CDN URLs (`cdn.sanity.io`), external/social URLs (pinterest, w3.org, resend API, dicebear), test fixtures (`cdn.example`), localhost test/dev URLs.

## §8 — Redirect strategy

No new redirect layer introduced. The hosting `apex → 308 → www` remains the single host redirect. After this change:

```text
Crawler/user → www.aquamind.life → 200      (canonical points directly here)
aquamind.life → 308 → www.aquamind.life → 200
canonical → www.aquamind.life   (never canonical → apex → 308 → www)
```

## §14 — Scope gate

```text
Sanity writes = 0            (no Sanity operation performed)
Content changes = 0          (legal-prose display strings untouched — see URL inventory)
SEO metadata changes = 0     (SPEC 07G seo values untouched; only host of URLs changed)
Slug changes = 0
Dependency upgrades = 0
Unrelated refactors = 0      (git diff non-URL lines = only the pre-existing SPEC 08 generateMetadata/projection change)
```

## Files changed (exact)

- 52 page/route files under `app/` + `lib/seo/jsonld.tsx` — `https://aquamind.life` → `https://www.aquamind.life` (SEO URLs only).
- 2 test files — updated expectations: `tests/sitemap.test.ts`, `tests/species-seo-metadata.test.ts`.
- `.env.local` — `NEXT_PUBLIC_SITE_URL` → `https://www.aquamind.life`.
- New: `tests/canonical-host.test.ts` (6 focused tests).
- Unchanged: hosting config (external), Sanity, content, slugs, dependencies.
- (Working tree also contains the prior SPEC 08 changes to `lib/database.ts` / `app/species/[slug]/page.tsx` / `tests/species-seo-metadata.test.ts` — reported in `report/SPEC_08/`, not part of this SPEC's change set.)
