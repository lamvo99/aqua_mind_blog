# SPEC 13B — Live Preflight + Dry-Run (READ-ONLY)

**Decision:** `READY_FOR_EXPLICIT_WRITE_APPROVAL`
**Verdict:** `CLEAN` — zero content mutations, zero schema changes, zero deploys.
**Executed:** 2026-10-21T07:25:55Z → 2026-10-21T07:26:12Z
**Target:** `zeohjejw` / `production` / API `v2026-05-25` / `https://aqua-mind-blog.sanity.studio/`

> This spec did **not** write to production. Running this prompt is not approval to mutate. A later, separately authorized stage must re-read the live baseline before any write.

---

## 1. Repository and artifact preflight (Phase 0)

| Item | Value |
|---|---|
| Repo root | `F:\AquaMind\aqua_mind_blog` |
| Branch / HEAD | `main` / `b014e5c8477f61f0685cf07748aee74c7c18c1e9` |
| Node | `v22.17.0` |
| Working tree | dirty (pre-existing SPEC 10N/12A/12B changes, not modified by this spec) |
| SPEC 13A manifest | 14 tracked, 0 mismatches, 0 missing |
| SPEC 12A manifest | 14 tracked, 1 known drift: `tests/spec12a-plan.test.ts` (documented 30s timeout added in SPEC 12B; no assertion change) |
| SPEC 12B manifest | 10 tracked, 0 mismatches |
| Known baseline failure | `tests/compare.test.ts > compare config > covers all four database types` still present, unchanged |

No prior artifact was edited or regenerated. The `reports/SPEC_13B/` folder is new.

## 2. Live baseline (Phase 1)

| Check | Live value | Expected | Result |
|---|---|---|---|
| Project / dataset / API | `zeohjejw` / `production` / `v2026-05-25` | same | PASS |
| Total records | 473 | 473 | PASS |
| Species | 218 | 218 | PASS |
| Plant | 62 | 62 | PASS |
| Invertebrate | 56 | 56 | PASS |
| Coral | 48 | 48 | PASS |
| Equipment | 46 | 46 | PASS |
| Problem | 43 | 43 | PASS |
| Drafts | 0 | 0 | PASS |
| Duplicate `_id` / slug | 0 / 0 | 0 / 0 | PASS |
| Canonical identity hash | `c6e358d5…67aeda` | same | MATCH |
| Relationship edges (before) | 3173 | 3173 | PASS |
| Relationship edges (after) | 3173 | 3173 | PASS |

All 21 candidate source and target IDs still resolve with the expected types.

Source revisions captured for optimistic concurrency in a later write stage:

| Source | Revision |
|---|---|
| Oscar `7kdig6Bk6SZq4GZkXcVXjK` | `iIEha4Lf0bd08jwW6gbhsZ` |
| Marble Angelfish `5oQB2MZ7gmZXjdwFqSs3qH` | `S14zwcyM2Pfmg8COTwKwt7` |
| Bala Shark `species-bala-shark` | `nMj4Bthvy4g70bFzG8bsw1` |
| Pea Puffer `J1Tx0fWCuGNPno99A79QPg` | `BF7b7JzesWwz9GasstzzGz` |
| Yoyo Loach `J1Tx0fWCuGNPno99A79RMf` | `vIy4RM4AZsZ5V5B7s9fJ4f` |

## 3. Candidate revalidation (Phase 2)

21/21 candidates revalidated: unique IDs, 1:1 evidence rows, resolvable references, correct target types, schema-exact entry shapes, deterministic `_key` unique in an empty destination array, **0 already present**, **0 reverse edges**, **0 conflicts**, **0 leaks** from the held register.

Eligibility (evidence quality preserved, never upgraded):

| Bucket | Count | Candidates |
|---|---|---|
| Eligible — explicit category / named species / explicit size rule | 17 | all 15 `predatorPrey` + `REL13A-0018` (Yoyo Loach → Guppy) + `REL13A-0021` (Oscar → Pygmy Corydoras) |
| Manual review — generic temperament/trait inference | 4 | `REL13A-0016` Bala Shark → Honey Gourami; `REL13A-0017` Bala Shark → Betta Imbellis; `REL13A-0019` Yoyo Loach → Marble Angelfish; `REL13A-0020` Pea Puffer → Marble Angelfish |
| Held / rejected (excluded) | 10 | SPEC 13A held register, unchanged |

Manual-review rationale: the source gives a generic statement ("slow-moving or more timid", "many cichlids", "slow-moving or long-finned fish") and the specific catalog record is a human mapping decision. They are excluded from the eligible dry-run subset and remain unapplied.

## 4. Dry run (Phase 3)

| Metric | Value |
|---|---|
| Original plan operations | 21 |
| Eligible after live revalidation | 17 |
| Already present | 0 |
| Manual review (excluded) | 4 |
| Conflicts / missing references | 0 / 0 |
| Live edge count before | 3173 |
| **Projected** edge count if all eligible were later approved | **3190** |
| Projected duplicates on reapply | 0 (`add-if-absent`) |

The SPEC 13A figure `3173 → 3194` was a simulation covering all 21 candidates. Recomputed for this live baseline: **3190** with 17 eligible; 3194 only if the 4 manual-review pairs are separately approved.

## 5. Integrity proof

| Field | Value |
|---|---|
| `content_mutations` | 0 |
| `schema_changes` | 0 |
| `deploys` | 0 |
| Counts before / after | identical (473 total) |
| Drafts before / after | 0 / 0 |
| Identity hash before / after | identical, MATCH |
| Relationship edges before / after | 3173 / 3173 |
| Verdict | `CLEAN` |

## 6. Gates

- `npm run lint` — PASS (0 findings)
- `npx tsc --noEmit` — PASS (0 errors)
- `npx vitest run tests/spec13a-plan.test.ts tests/spec13b-preflight.test.ts --pool=vmThreads` — 2 files, 27 tests, 27 pass
- `npx vitest run --pool=vmThreads` — 33 files, 444 tests, 443 pass, 1 fail: known `tests/compare.test.ts` baseline only

## 7. Discrepancies

None affecting the plan. Only the pre-documented SPEC 12A test-file checksum drift (SPEC 12B 30s timeout, no assertion change) and the known `compare.test.ts` failure (four expected vs five defined compare domains). No unrelated test or production code was changed.

## 8. Handoff

Eligible write set ready for a separate, explicitly approved execution stage:

- 17 operations, 2 families (`predatorPrey` 15, `incompatibleSpecies` 2), 5 source species.
- Later stage must: re-read live baseline and revisions, re-verify absence, use `ifRevisionID` optimistic concurrency, apply add-if-absent in small batches, read back each change, and stop on any conflict or integrity mismatch.
- 4 manual-review pairs must not be applied without explicit human confirmation and, if approved, a new evidence note.

**This document does not authorize any write.**
