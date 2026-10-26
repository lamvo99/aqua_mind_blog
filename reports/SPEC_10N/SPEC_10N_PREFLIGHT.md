# SPEC 10N — Preflight / Phase A Reconciliation

**Spec:** `phase/SPEC_10N_IMPLEMENTATION_PROMPT.md` — Deploy Wiki Schema and Integrate Site Queries/Rendering
**Mode:** Scoped implementation (not audit-only). No production content mutations.
**Generated:** 2026-10-18 · Node `v22` · Sanity CLI `@sanity/cli 3.99.0`

## 1. Environment (no secrets printed)
| Item | Value | Source |
| --- | --- | --- |
| Project ID | `zeohjejw` | `sanity/env.ts` ← `NEXT_PUBLIC_SANITY_PROJECT_ID` (`.env.local`) |
| Dataset | `production` | `NEXT_PUBLIC_SANITY_DATASET` (`.env.local`) |
| API version | `2026-05-25` | `NEXT_PUBLIC_SANITY_API_VERSION` (`.env.local`) |
| CLI auth | present | `npx sanity projects list` resolved `zeohjejw` (no token printed) |
| Git branch / HEAD | `main` / `b014e5c` | `git rev-parse` |
| Studio config | `sanity.config.ts` (basePath `/studio`), **no `sanity.cli.ts` at start** | repo |
| Client API version | `lib/sanity.ts` hardcodes `'2023-05-03'` (inconsistent with env; unchanged, documented) | `lib/sanity.ts` |

## 2. Read-only baseline (recomputed, not assumed)
| Metric | Value | Expected | Result |
| --- | --- | --- | --- |
| Records total | 473 | 473 | MATCH |
| species / plant / invertebrate / coral / equipment / problem | 218 / 62 / 56 / 48 / 46 / 43 | same | MATCH |
| Drafts | 0 | 0 | MATCH |
| Canonical identity hash | `c6e358d5…67aeda` | same | MATCH |

Method reused from `scripts/SPEC_11_baseline.js` (sha256 over sorted `{id,title,slug}` per record → sha256 of joined parts). No new hash method invented.

## 3. Prior-spec reconciliation
| Spec | Status | Relevance to 10N |
| --- | --- | --- |
| SPEC 10M | 90 fields / 10 types / 2 modified fields added **in code only**; `SCHEMA_DIFF.json` verdict `UNAPPROVED CHANGES DETECTED` | Verdict is **stale**: its `totals.addedFields = 0` came from a contaminated before-inventory; the `approvedAdditions` lists (24+13+16+24+6+7 = 90) are authoritative and match code. Reconciled. |
| SPEC 11 one-shot | COMPLETE — 364 ops / 17 species written; identity preserved | Content changed, identity hash still MATCH; `SPEC_11_one_shot_execute.js` never rerun. |
| SPEC 11A | COMPLETE — 0 writes, `PARTIAL_EVIDENCE_BLOCKED` | No production writes; gates in that report relate to un-deployed schema (now deployed). |

## 4. SPEC 10M → code map (Gate A)
- 7 schema files modified: `species, plant, invertebrate, coral, equipment, problem, index` (+472/−2 at SPEC 10M time).
- 1 new file: `sanity/schemaTypes/knowledgeStructures.ts` — 10 object types (`compatibleEntry, incompatibleEntry, predatorPreyEntry, reefInteractionEntry, coralNeighborEntry, speciesKnowledgeBody, coralKnowledgeBody, plantKnowledgeBody, invertebrateKnowledgeBody, equipmentKnowledgeBody`).
- 2 modified fields: `species.compatibleSpecies`, `invertebrate.compatibleSpecies` — changed from `array of reference` to `array of compatibleEntry` (`{ ref, conditions, confidence }`).
- Existing focused test `tests/spec10m-schema.test.ts` (108 assertions) asserts the 10 types, 90 fields, 2 modifications and `createSchema` validation = 0 errors.

### Gate A discrepancy found and classified
Pre-existing consumers assumed the **old** `compatibleSpecies` reference shape:
- `lib/database.ts:115` projection `compatibleSpecies[]->{…}` → returns `compatibleEntry` objects, so downstream `.name`/`.slug` render `undefined`.
- `app/species/[slug]/page.tsx` mapped `item.compatibleSpecies` directly.
- `app/invertebrates/[slug]/page.tsx` passed `item.compatibleSpecies` to `RelationshipSection`.
- `app/tools/compatibility-checker/page.tsx:34` GROQ `compatibleSpecies[]->slug.current`.

These are the SPEC 10M integration gap SPEC 10N exists to close. Gate A: **PASS** — uncommitted user changes preserved; no reset/clean/stash.

## 5. Environment gaps discovered (fixed, see Execution Report)
1. `sanity build` failed: `@sanity/types` missing from `node_modules` (declared dep of `sanity@3.99.0`, absent from lockfile) → resolved via `npm install`.
2. `sanity deploy` failed: no `sanity.cli.ts` (CLI requires `api.projectId`) and CLI config loader does not read `.env.local` → added minimal `sanity.cli.ts` with public `projectId`/`dataset` and explicit `studioHost`.

## 6. Gate A result
**PASS** — state reconciled; discrepancies classified as the known SPEC 10M integration gap; uncommitted work preserved.
