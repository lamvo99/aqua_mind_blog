# SPEC 08 — Metadata Flow (Sanity → Website → Search Engine)

**Date:** 2026-10-05

## End-to-end chain (after fix)

```
Sanity CMS (read-only for SPEC 08)
  species document
    seo.metaTitle      (38–65 chars, frozen by SPEC 07F/07G)
    seo.metaDescription(142–160 chars, frozen by SPEC 07F/07G)
        │
        ▼
lib/database.ts  getDatabaseItem()                     ← FIX 1 (projection)
  *[_type == $type && slug.current == $slug][0] {
    ...,
    seo { metaTitle, metaDescription }                  ← was missing entirely
  }
        │
        ▼
app/species/[slug]/page.tsx  generateMetadata()        ← FIX 2 (consumption)
  seoTitle   = non-empty(seo.metaTitle)   ? seo.metaTitle   : null
  seoDescription = non-empty(seo.metaDescription) ? seo.metaDescription : null
  title      = seoTitle ? { absolute: seoTitle } : `${name} — Fish Profile`
  description= seoDescription || excerpt || `Care guide for ${name}`
  openGraph  = { title, description, url: canonical }
  twitter    = { title, description }
  alternates = { canonical: https://aquamind.life/species/<slug> }
        │
        ▼
Next.js Metadata API (root layout in app/layout.tsx)
  metadataBase  = siteUrl (NEXT_PUBLIC_SITE_URL || https://aquamind.life)
  title.template  = "%s | AquaMind Blog"   ← applies ONLY to fallback titles
  robots        = { index: true, follow: true }
        │
        ▼
Rendered HTML (verified byte-for-byte, local production build)
  <title>Frozen metaTitle</title>                       ← no template suffix
  <meta name="description" content="Frozen metaDescription">
  <meta property="og:title" / "og:description" / "og:url">
  <meta name="twitter:title" / "twitter:description">
  <link rel="canonical" href="https://aquamind.life/species/<slug>">
  <meta name="robots" content="index, follow">          ← inherited from root layout
```

## Before vs after

| Stage | Before fix | After fix |
|---|---|---|
| GROQ projection | `seo` not queried (silent drop at the data layer) | `seo { metaTitle, metaDescription }` queried |
| Title source | `name + " — Fish Profile"` | `seo.metaTitle` (absolute) → fallback |
| Description source | `excerpt` | `seo.metaDescription` → `excerpt` → `Care guide for ${name}` |
| OG / Twitter | duplicated fallback values | same values as title/description |
| Canonical / robots / sitemap | correct, unchanged | correct, unchanged |
| Species without `seo` (101 of 218) | fallback title + excerpt | **identical fallback** (behavior preserved, tested) |

## Fallback rules (explicit and safe)

1. `seo.metaTitle` present and non-blank after trim → rendered as `title: { absolute }` (exact value, layout template does not append).
2. `seo.metaTitle` missing / empty / whitespace-only → `title: "${name} — Fish Profile"` with layout template → `<title>${name} — Fish Profile | AquaMind Blog` (pre-existing behavior).
3. `seo.metaDescription` present and non-blank → rendered as meta/OG/Twitter description (exact value).
4. `seo.metaDescription` missing / empty / blank → `item.excerpt`, then `"Care guide for ${name}"` (pre-existing behavior).
5. Missing document → `{ title: "Not found" }` (pre-existing behavior).

## Why absolute title (not template-suffixed)

- Frozen metaTitles are complete SERP titles constrained to 38–65 chars by SPEC 07D.
- The root template would append ` | AquaMind Blog` (17 chars) → up to 82 chars → search engines truncate the crafted tail (e.g. `Peppered Corydoras (Corydoras paleatus): behavior and temperament | AquaMind Blog`).
- `{ absolute }` keeps the HTML `<title>` byte-identical to the SPEC 07G frozen value; fallback pages keep the branded template exactly as before.

## Query/read clients involved

| Client | Used by | SPEC 08 usage |
|---|---|---|
| `lib/sanity.ts` (public CDN, no token, `useCdn: true`) | `lib/database.ts`, `app/sitemap.ts`, feed/llms routes | read-only verification of 117 seo records; runtime metadata |
| `lib/sanity-server.ts` (token, `useCdn: false`) | server-side APIs | untouched |

No Sanity write was performed in SPEC 08. `SANITY_API_TOKEN` never printed.

## Related SEO surfaces (audited, unchanged)

- `app/sitemap.ts` — 553 URLs after build revalidation (218 species, 0 dupes, 0 localhost, 0 query, single host `aquamind.life`); species URLs come from `slug.current`, independent of `seo`.
- `app/robots.ts` — `Allow: /`, `Disallow: /studio`, sitemap link.
- `app/layout.tsx` — `metadataBase`, index/follow default.
- `lib/seo/jsonld.tsx` — species breadcrumb JSON-LD (name-based, unchanged).
- noindex: `/search` only (+ empty categories); both excluded/consistent with sitemap.
