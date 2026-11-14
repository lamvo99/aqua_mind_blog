# AquaMind — Production Migration Result

**Status:** `PRODUCTION_IMPLEMENTED_WITH_HELD_FIELDS`  
**Date:** 2026-11-15  
**Sanity:** `zeohjejw` / `production`  
**Production site:** `https://www.aquamind.life`  
**Release commit:** `dc54e2eb37eccd6ff4448017478a3b6a364c3917`  
**Vercel Production deployment:** `3Y2Z5CwMsGCYryuJiGFb1RGGVt3F`

---

## 1. Schema

| Measure | Result |
|---|---:|
| Registry schema candidates | **292** |
| Implemented schema fields | **289** |
| Mapped to existing numeric fields | **3** (`salinity`, `calcium`, `magnesium`) |
| New document types | **1** (`evidenceSource`) |
| New object types | **3** (`careBasisEntry`, `careConfidenceEntry`, `careDisagreement`) |
| New document-level fields | **28** |
| Reused existing fields | aliases, knowledgeBody, seo, and existing care fields |
| Schema validation | **0 errors, 0 warnings** |
| Studio deployment | Embedded `/studio` schema live via release commit |

The 3 mapped fields are not duplicated: `salinity` maps to `salinityMin`/`salinityMax`, `calcium` to `caMin`/`caMax`, and `magnesium` to `mgMin`/`mgMax`. The proposed qualified prose is preserved in the decision record and remains held.

The 28 new document fields:

- **Species (3):** `difficultyContext`, `difficultyConfidence`, `notRecommendedFor`
- **Coral (15):** `reefSafetyMeaning`, `careBasis`, `careConfidence`, `evidenceSources`, `suitabilityConditions`, `growthRisk`, `growthRiskNote`, `parBasis`, `lastReviewedAt`, `reviewStatus`, `reviewedBy`, `difficultyContext`, `notRecommendedFor`, `difficultyConfidence`, `temperatureTolerance`
- **Problem (10):** `affectedTypes`, `severity`, `timeSensitivity`, `claimConfidence`, `evidenceSources`, `lastReviewedAt`, `reviewStatus`, `reviewedBy`, `tags`, `whenToSeekHelp`

All fields are optional. No existing field was removed, renamed or made required.

## 2. Data migration

| Measure | Count |
|---|---:|
| Production documents inspected | **473** |
| Documents modified | **384** |
| Fields written | **1,171** |
| Fields verified | **1,171** |
| Failed operations | **0** |
| Skipped operations | **0** |
| Already-correct historical fields | **35** |
| Resolved no-write decisions | **5** |
| Remaining `NEEDS_SOURCE` | **293** |
| Remaining `NEEDS_SPECIALIST` | **108** |
| Remaining `DEFERRED` | **3** |
| Remaining unresolved conflicts | **6** |

The 1,171 written fields:

| Category | Fields |
|---|---:|
| Search aliases | 384 |
| Knowledge Bodies | 367 |
| Species SEO metadata (`metaTitle` + `metaDescription`) | 202 |
| Species difficulty context | 218 |
| **Total** | **1,171** |

All 1,171 values are traceable to the prepared SPEC28 core-completion / overlay content, derived from stored Production record fields. No new external measurement, dosage, treatment, reef-safety, compatibility or husbandry value was invented.

## 3. Write execution

| Measure | Result |
|---|---:|
| Manifest rows | 1,171 |
| Documents in manifest | 384 |
| Bounded transactions | **8** |
| Committed transactions | **8** |
| Failed transactions | **0** |
| Revision preflight | **384/384 passed** |
| Post-write verification | **1,171/1,171 matched** |
| Unexpected field changes | **0** |
| Publication-state changes | **0** |
| Document creation/deletion | **0** |

Transaction IDs:

1. `6qLw2pLgYP1DIYD0rhVYx3`
2. `6qLw2pLgYP1DIYD0rhVfhY`
3. `tAK23xfG5FC28baVYIEhfK`
4. `6qLw2pLgYP1DIYD0rhVlwY`
5. `6qLw2pLgYP1DIYD0rhVqRY`
6. `6qLw2pLgYP1DIYD0rhVvEY`
7. `6qLw2pLgYP1DIYD0rhW0JY`
8. `6qLw2pLgYP1DIYD0rhW4k3`

The migration was not globally atomic; each transaction is atomic and all eight committed successfully.

## 4. Classification of every registry candidate

| Classification | Rows |
|---|---:|
| `READY_TO_WRITE` — written and verified | **1,171** |
| `ALREADY_CORRECT` — historical applied fields | **35** |
| `NOT_APPLICABLE` — `waterType` resolved no-write | **5** |
| `NEEDS_SOURCE` | **293** |
| `NEEDS_SPECIALIST` | **108** |
| `DEFERRED` | **3** |
| `UNRESOLVED_CONFLICT` | **6** |
| **Total** | **1,621** |

The 6 unresolved conflicts are the 5 identity design decisions and the koi `tankSizeMinL` value conflict. The 5 identity H1 titles and the koi numeric value were not changed.

## 5. Application and release

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | **0 errors** |
| ESLint (`npm run lint`) | **0 errors** |
| Production build | **success, 605/605 pages** |
| Schema validation | **0 errors, 0 warnings** |
| Local build ID | `XG7P1z7ANrbRVdy_1xB8U` |
| Full Vitest | **446 passed, 5 known baseline failures, 1 known baseline suite failure** |
| Production route smoke | **12/12 HTTP 200, 0 console errors** |
| New Knowledge Bodies visible | species, plant, coral, invertebrate |
| Difficulty context visible | species |
| Search aliases working | `Duncanops`, `Micromussa lordhowensis`, `Eunicella cavolini` |
| Studio schema probe | all new fields present |
| Equipment/problem pages | unchanged and HTTP 200 |

Known baseline test failures on `main` (not introduced by this migration):

- `tests/compare.test.ts` — expects four compare domains; app has five including invertebrate.
- `tests/compatibility.test.ts` — known compatibility severity fixture mismatch.
- `tests/phase9-ux.test.ts` — known `databaseCategories` count/nav prefix fixtures.
- `tests/spec10n-integration.test.ts` — known compatibility-checker query fixture.
- `tests/search.test.ts` — suite expects the removed `@/lib/search` module.

`tests/spec10m-schema.test.ts` was updated to include the new approved schema fields and now passes **108/108**.

## 6. Remaining held work

| Item | Count | State |
|---|---:|---|
| `NEEDS_SOURCE` | 293 | Not written; source/approval still required |
| `NEEDS_SPECIALIST` | 108 | Not written; specialist approval still required |
| `DEFERRED` | 3 | Not written |
| Unresolved identity design | 5 | H1 titles preserved; future decision required |
| Koi tank-size value conflict | 1 | Current value preserved |
| Water-type resolved no-write | 5 | Enum preserved |

The five identity decisions remain open:

1. `problem:black-beard-algae:identity`
2. `problem:brown-diatom-algae:identity`
3. `problem:columnaris-cotton-mouth:identity`
4. `problem:staghorn-algae:identity`
5. `problem:velvet-disease-oodinium:identity`

## 7. Safety

- Pre-migration snapshot: `reports/production-migration/PRE_MIGRATION_SNAPSHOT.json`
- Write manifest: `reports/production-migration/PRODUCTION_WRITE_MANIFEST.csv`
- Write log: `reports/production-migration/PRODUCTION_WRITE_LOG.json`
- Post-write verification: `reports/production-migration/PRODUCTION_POST_WRITE_VERIFICATION.json`
- No document was deleted or replaced.
- No publication status changed.
- No historical approval or write report was altered.
- No token, secret or credential is printed.
