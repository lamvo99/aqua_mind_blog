# SPEC 08.1 — Production Recheck

**Date:** 2026-10-06
**Status:** pre-deploy evidence recorded. **Production is NOT claimed fixed** (§13) — SPEC 08 + SPEC 08.1 changes are implemented, tested and locally verified but not yet committed/deployed (§18).

## 1. Pre-deploy live production evidence (checked 2026-10-06T15:29:18Z)

Host `https://www.aquamind.life` serving current deployed build:

| URL | Status | Observed |
|---|---|---|
| `https://www.aquamind.life/` | 200 | `canonical = https://aquamind.life` (**apex**), `og:url = https://aquamind.life` |
| `https://www.aquamind.life/sitemap.xml` | 200 | **553 apex URLs, 0 www** |
| `https://www.aquamind.life/robots.txt` | 200 | `Sitemap: https://aquamind.life/sitemap.xml` (**apex**) |
| `https://www.aquamind.life/species/paracheirodon-simulans` | 200 | title = `Green Neon Tetra — Fish Profile \| AquaMind Blog` (SPEC 08 fix also not yet deployed); canonical (per SPEC 08 spot check) = apex |
| `https://aquamind.life/*` | 308 | → `https://www.aquamind.life/*` (hosting redirect already correct — unchanged) |

Conclusion: live production still emits apex SEO signals — exactly the state this SPEC fixes in code. Deployment required.

## 2. Deployment requirements (PM action)

1. **Commit + push** the working tree (54 changed files + 2 new test files, see `SPEC_08_1_URL_INVENTORY.md`) — STOPPED here per §18: **READY FOR PM DEPLOY APPROVAL**.
2. **Set the hosting environment variable** (deployment platform, not in this repository):
   ```text
   NEXT_PUBLIC_SITE_URL = https://www.aquamind.life
   ```
   If the platform currently defines it as `https://aquamind.life`, the env-driven surfaces (root metadata, sitemap, robots, feed, llms.txt, manifest, JSON-LD, posts/category pages) will keep emitting apex even with the new code. Code fallbacks and `.env.local` are already `https://www.aquamind.life`.
3. No hosting redirect change is needed: `aquamind.life → 308 → www.aquamind.life` remains the single host redirect (§8).

## 3. Post-deploy verification checklist (§13)

Verify on live production:

```text
https://www.aquamind.life/                → 200, canonical = https://www.aquamind.life, og:url = https://www.aquamind.life, robots = index, follow, 0 apex URLs in HTML/JSON-LD
https://www.aquamind.life/robots.txt       → Sitemap: https://www.aquamind.life/sitemap.xml
https://www.aquamind.life/sitemap.xml      → all 553+ URLs = https://www.aquamind.life/..., 0 apex, 0 localhost, 0 query, 0 duplicates, 218 species
```

The 6 SPEC 08 species URLs (all expected 200, canonical = `https://www.aquamind.life/species/<slug>`, robots = `index, follow`, and — being SEO-enabled — `<title>` = frozen SPEC 07G metaTitle with **no ` | AquaMind Blog` suffix**, description = frozen metaDescription):

```text
https://www.aquamind.life/species/paracheirodon-simulans
https://www.aquamind.life/species/celestichthys-erythromicron
https://www.aquamind.life/species/apistogramma-agassizii
https://www.aquamind.life/species/danio-rerio
https://www.aquamind.life/species/aphyosemion-australe
https://www.aquamind.life/species/corydoras-paleatus
```

Also spot-check: one species WITHOUT seo keeps `<Name> — Fish Profile | AquaMind Blog`; `/search` remains `noindex`; `https://aquamind.life/` still 308 → www (single redirect).

## 4. Expected post-deploy delta vs section 1

| Surface | Before (section 1) | After deploy |
|---|---|---|
| Homepage canonical / og:url | `https://aquamind.life` | `https://www.aquamind.life` |
| Sitemap | 553 apex | all www |
| Robots sitemap directive | apex | www |
| Species canonical/og:url | apex | www |
| Species titles (6 SEO pages) | fallback + suffix | frozen metaTitle exact (SPEC 08) |
| JSON-LD Organization/WebSite/breadcrumbs/@id | apex | www |
