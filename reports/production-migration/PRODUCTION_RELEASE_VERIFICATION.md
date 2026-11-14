# AquaMind — Production Release Verification

**Release commit:** `dc54e2eb37eccd6ff4448017478a3b6a364c3917`  
**Parent:** `b6ca8c8603fd6fe4988b1dfc4a20977681ceccc3`  
**Production domain:** `https://www.aquamind.life`  
**Studio:** `https://www.aquamind.life/studio`  
**Vercel deployment ID:** `3Y2Z5CwMsGCYryuJiGFb1RGGVt3F`  
**GitHub deployment ID:** `7790823964`  
**Deployment URL:** `https://aqua-mind-blog-rdwzkeclh-xing-zhuang-s-projects.vercel.app`

**Vercel state:** `success` — Deployment has completed  
**Production route smoke:** **12/12 HTTP 200**, 0 browser errors

---

## 1. Release contents

The release adds the complete Core Database schema and the small compatibility changes required to read it:

- `sanity/schemaTypes/careEvidence.ts` (new)
- `sanity/schemaTypes/coral.ts`
- `sanity/schemaTypes/problem.ts`
- `sanity/schemaTypes/species.ts`
- `sanity/schemaTypes/index.ts`
- `lib/database.ts` — coral `temperatureTolerance` type/projection
- `app/corals/[slug]/page.tsx` — renders the temperature-tolerance note when present
- `tests/spec10m-schema.test.ts` — approved-schema fixture update

No unrelated feature, route, SEO or data-access behavior was changed.

## 2. Schema verification

| Check | Result |
|---|---|
| `npx sanity schema validate` | **0 errors, 0 warnings** |
| Schema graph test (`spec10m-schema.test.ts`) | **108/108 passed** |
| `/studio` HTTP | **200** |
| Studio bundle fields | `reefSafetyMeaning`, `careBasis`, `careConfidence`, `difficultyContext`, `severity`, `timeSensitivity`, `claimConfidence`, `affectedTypes`, `reviewStatus`, `evidenceSources`, `temperatureTolerance`, `notRecommendedFor` — all present |
| Existing documents remain accessible | **473/473** |

## 3. Production route smoke test

| Route | HTTP | Console errors | Notes |
|---|---:|---:|---|
| `/` | 200 | 0 | Home renders |
| `/search` | 200 | 0 | Search UI |
| `/posts/why-does-aquarium-tds-keep-increasing` | 200 | 0 | Article renders |
| `/species/amatitlania-nigrofasciata` | 200 | 0 | Knowledge Body + difficulty context visible |
| `/plants/anubias-barteri` | 200 | 0 | Knowledge Body visible |
| `/corals/xenia-spp` | 200 | 0 | Knowledge Body visible |
| `/invertebrates/neocaridina-davidi` | 200 | 0 | Knowledge Body visible |
| `/equipment/par-meter` | 200 | 0 | Equipment display unchanged |
| `/problems/black-beard-algae` | 200 | 0 | Problem content unchanged |
| `/hubs` | 200 | 0 | Hubs render |
| `/collections` | 200 | 0 | Collections render |
| `/studio` | 200 | 0 | Embedded Studio loads |

No horizontal overflow was detected. No `Loading...` state remained on the checked pages.

## 4. Search and metadata verification

| Check | Result |
|---|---|
| Alias `Duncanops` → Duncan Coral | PASS |
| Alias `Micromussa lordhowensis` → Acan Lord | PASS |
| Alias `Eunicella cavolini` → Gorgonian | PASS |
| Species SEO metadata present | 101 records |
| Existing SEO values preserved | PASS |
| Canonical URLs unchanged | PASS |
| Equipment placeholders hidden | PASS |
| Problem H1/title preserved | PASS |

## 5. Build and test

| Check | Result |
|---|---|
| TypeScript | **0 errors** |
| ESLint | **0 errors** |
| Production build | **success, 605/605 pages** |
| Local build ID | `XG7P1z7ANrbRVdy_1xB8U` |
| Full Vitest | **446 passed / 451 tests; 5 known baseline failures + 1 known baseline suite** |
| Schema validation | **0 errors, 0 warnings** |
| New schema test | **108/108 passed** |

Known baseline failures are pre-existing on `main` and were reproduced on a clean `b6ca8c8` worktree:

- `tests/compare.test.ts`
- `tests/compatibility.test.ts`
- `tests/phase9-ux.test.ts` (2)
- `tests/spec10n-integration.test.ts`
- `tests/search.test.ts` (suite)

They are not caused by the schema or data migration.

## 6. Deployment confirmation

GitHub received the release commit on `main`:

```text
b6ca8c8..dc54e2e  HEAD -> main
```

Vercel created a Production deployment from `dc54e2e` and reported `success`. The production domain served the release during the smoke test.

## 7. Remaining warnings

- 293 fields remain `NEEDS_SOURCE`.
- 108 fields remain `NEEDS_SPECIALIST`.
- 3 fields remain `DEFERRED`.
- 5 identity design decisions remain unresolved; H1 titles preserved.
- 1 koi tank-size value conflict remains unresolved.
- The 5 `waterType` decisions remain `RESOLVED_NO_WRITE`.
- Difficulty context is displayed with the existing “Draft context — not approved” qualification.
