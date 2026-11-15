# AquaMind — Public Database Runtime Audit

**Status:** `PUBLIC_RUNTIME_VERIFIED_WITH_HELD_ITEMS`  
**Date:** 2026-11-15  
**Production:** `https://www.aquamind.life`  
**Audit commit:** `ffe68b854042383fa2c9ed78cf97382cd37f780a`  
**Vercel deployment:** `CNGg85vJvjGBcMJe259sWAWgheCh` — success  
**Deployment URL:** `https://aqua-mind-blog-m9bqdbgft-xing-zhuang-s-projects.vercel.app`

---

## 1. Executive summary

The public database now agrees with the Production dataset.

| Check | Result |
|---|---|
| Live `/database` headline | **473** |
| Live category badges | Fish **218**, Invertebrates **56**, Plants **62**, Corals **48**, Equipment **46**, Problems **43** |
| Sum of category badges | **473** |
| Sanity Production total | **473** |
| Drafts | **0** |
| Records missing name/title or slug | **0** |
| Live pages returning 200 | **9/9 checked** |
| Browser console errors | **0** |
| Compatibility Checker | Passed with real data |

The previously reported **444 entries / 394 badge sum** is not present in the current live HTML and is not reproducible. It was a stale/mixed cached rendering from an earlier deployment: the 444 headline and 394 badge sum are internally inconsistent, which cannot come from one render of the current page. The current page, its metadata description and the six badges all resolve from the same Sanity query and agree at 473.

## 2. Count reconciliation

Sanity Production, exact predicates used by `lib/database-counts.ts`:

| Domain | Sanity total | Named + slug | Missing |
|---|---:|---:|---:|
| Species | 218 | 218 | 0 |
| Invertebrates | 56 | 56 | 0 |
| Plants | 62 | 62 | 0 |
| Corals | 48 | 48 | 0 |
| Equipment | 46 | 46 | 0 |
| Problems | 43 | 43 | 0 |
| **Total** | **473** | **473** | **0** |

The count predicate is `defined(name/title) && defined(slug.current)`. Every current Production document passes. There are no drafts.

### Cache fix

`app/database/page.tsx` and `app/layout.tsx` now declare `revalidate = 300`. The database counts already use a 300-second read-through cache. This prevents a new data state from being hidden behind an old build/cache for an extended period.

### Why the old audit saw 444/394

- The current live HTML contains no `444` or `394`.
- The 444 headline and 394 badge sum are mutually inconsistent; they cannot be produced by the current `totalDatabaseCount()` helper from one count object.
- The likely cause is a cached page/metadata pair from an earlier deployment or a search-index snapshot, not the current Sanity data.
- After the deployment, the headline, meta description and badges all read 473 / 218 / 56 / 62 / 48 / 46 / 43.

## 3. Identity audit

### Neocaridina davidi

Two records share the scientific name `Neocaridina davidi`:

- `neocaridina-davidi` — canonical **Red Cherry Shrimp**.
- `neocaridina-davidi-cherry` — trade-form record.

They are now explicitly distinguished:

- Renamed the trade-form record to **Cherry Shrimp (Red Trade Form)**.
- Excerpt now states: “Trade-name form of Neocaridina davidi, the same species as Red Cherry Shrimp. Kept for trade-name search continuity; species-level care applies. Not a separate species.”
- Aligned its structured values to the canonical species baseline: **3 cm, 20–28 °C, pH 6.5–8**.
- Updated its Knowledge Body water note to record the earlier trade-form source values as history, not a separate care requirement.

The record was **not deleted**, so the public count remains 56 invertebrates and the trade-name URL continues to resolve. The page now reads as a trade form, not a second species.

### Crystal Red Shrimp

- The GH 4–6 dGH and reverse-osmosis description is retained; it is a soft-water bee-shrimp description and no confirmed contradiction was found.
- The structured `ghMin`/`ghMax` fields are empty; no value was invented.
- The “Sponge Filter Filter” label was a relationship-card badge duplication. `RelationshipSection` now suppresses a category badge when the item name already contains that category. The live page renders **Sponge Filter** once.

## 4. Problems audit and corrections

Five documents / twelve fields were corrected in transaction `6qLw2pLgYP1DIYD0rlNgTY`:

| Document | Field | Correction |
|---|---|---|
| Black Beard Algae | `excerpt` | Removed the hydrogen-peroxide spot-treatment recommendation; retained cautious husbandry-first wording and a livestock-safety review requirement. |
| Temperature Shock | `whatNotToDo` | Removed the unsupported “1–2 °C per day” treatment protocol; replaced with a warning against abrupt temperature changes and a recommendation for species-specific guidance. |
| Dropsy | `excerpt` | Removed “usually a bacterial infection”; now presents dropsy as a sign of fluid imbalance, not a single disease. |
| Staghorn Algae | `causes` | Changed wording to “Associated factors, not confirmed causes.” |
| Cherry Shrimp (Red Trade Form) | 8 fields | Name, excerpt, size, temperature, pH and Knowledge Body water note aligned to the canonical species baseline. |

Read-back verification: **12/12 fields matched**. The live pages confirm:

- Black Beard Algae: no peroxide/spot-treatment text.
- Temperature Shock: no “1–2 °C per day.”
- Dropsy: no “usually a bacterial infection.”
- Staghorn Algae: “not confirmed causes” present.

## 5. Compatibility Checker

Tested with the real Production species data through `checkCompatibility` and live page loads.

| Test | Result |
|---|---|
| Ocellaris Clownfish + Percula Clownfish, 200 L | `info` — no obvious conflicts; unverified warning |
| Oscar + Neon Tetra, 40 L | `warning` — “Oscar (35 cm, carnivorous) may try to eat Neon Tetra (3.5 cm).” |
| Tool page HTTP | 200 |
| Browser console errors | 0 |

The duplicate Neocaridina records are invertebrates and are not inputs to the species-only Compatibility Checker. The species data used by the checker remains internally consistent enough to return the expected conflict/clean results.

## 6. Live route verification

| Route | HTTP | Console errors |
|---|---:|---:|
| `/database` | 200 | 0 |
| `/problems/black-beard-algae` | 200 | 0 |
| `/problems/temperature-shock` | 200 | 0 |
| `/problems/dropsy` | 200 | 0 |
| `/problems/staghorn-algae` | 200 | 0 |
| `/invertebrates/neocaridina-davidi-cherry` | 200 | 0 |
| `/invertebrates/caridina-cantonensis` | 200 | 0 |
| `/tools/compatibility-checker` (both test URLs) | 200 | 0 |

## 7. Remaining held items

The public audit does not claim that every field in all 473 documents is semantically complete. The following remain explicitly held:

- **5 identity design decisions** — H1 titles preserved.
- **1 koi tank-size value conflict** — current value preserved.
- **293 `NEEDS_SOURCE`** fields.
- **108 `NEEDS_SPECIALIST`** fields.
- **3 deferred** fields.
- **5 `waterType` decisions** — `RESOLVED_NO_WRITE`.

The website publicly retrieves all 473 published documents; private or unpublished content is not part of this audit.

## 8. Artifacts

- `reports/production-migration/PUBLIC_AUDIT_FIX_SNAPSHOT.json`
- `reports/production-migration/PUBLIC_AUDIT_FIX_MANIFEST.csv`
- `reports/production-migration/PUBLIC_AUDIT_FIX_LOG.json`
- `reports/production-migration/PUBLIC_AUDIT_FIX_VERIFICATION.json`
- `reports/PUBLIC_DATABASE_RUNTIME_AUDIT.md`

## 9. Deployment

| Item | Value |
|---|---|
| Audit fix commit | `ffe68b854042383fa2c9ed78cf97382cd37f780a` |
| Vercel deployment ID | `CNGg85vJvjGBcMJe259sWAWgheCh` |
| Deployment state | success |
| Production domain | `https://www.aquamind.life` |
| Live headline | 473 |
| Live category sum | 473 |
