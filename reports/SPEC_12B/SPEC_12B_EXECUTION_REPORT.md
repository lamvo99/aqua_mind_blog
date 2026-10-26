# SPEC 12B — Evidence-Gated Relationship Apply (EXECUTION REPORT)

- **Spec:** `phase/SPEC_12B_EXECUTION_PROMPT.md`
- **Mode:** Controlled production write — allowlisted plan only (22 `compatibleSpecies` add-if-absent ops)
- **Verdict:** **COMPLETE**
- **Verified target:** project `zeohjejw` · dataset `production` · API `v2026-05-25` (matches `sanity.cli.ts`; studio `aqua-mind-blog`)
- **Executed:** 2026-10-19 · git HEAD `b014e5c` (main) · node v22.17.0

## 1. Mission & inputs

Executed the verified SPEC 12A plan (`reports/SPEC_12A/SPEC_12B_DRY_RUN_PLAN.json`): 22 additive
`compatibleSpecies` entry-object edges, each `PROPOSE_WITH_CAVEAT` / confidence `MEDIUM` / risk `P1`.
No other content edits, schema changes, or deployments. Held rows were not promoted.

## 2. Preflight — all gates PASS before any write (`PREFLIGHT.json`)

| ID | Check | Result |
|---|---|---|
| P-01 | project/dataset match intended production | PASS `zeohjejw/production` |
| P-02 | SPEC 12A artifacts unmodified (checksums) | PASS 14/14 files, 0 mismatches |
| P-03 | plan has exactly 22 well-formed `compatibleSpecies` ops | PASS |
| P-04 | all ops `PROPOSE_WITH_CAVEAT` / `MEDIUM` / `P1` | PASS |
| P-05 | every op has traceable evidence row | PASS (22) |
| P-06 | no duplicate (doc,path,target) operations | PASS |
| P-07 | record counts match SPEC 12A baseline | PASS 473 |
| P-08 | drafts = 0 | PASS |
| P-09 | duplicate `_id`/slug = 0 | PASS |
| P-10 | canonical identity hash unchanged | PASS MATCH |
| P-11 | relationship edge count matches baseline | PASS 3151 |
| P-12 | all source/target IDs resolve to allowed types | PASS |

Preflight comparison vs SPEC 12A was exact (identity `c6e358d5…67aeda`, 473 records, 3151 edges,
22 targets empty). `DRY_RUN_BEFORE.json` captured exact document/field/ref/entries before mutation.

## 3. Mutation contract & execution

- Mutation path: `POST https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production` via the
  established helper, `patch` with `ifRevisionID` (optimistic concurrency).
- Per op: re-read live document; `SKIP_ALREADY_PRESENT` if the exact entry exists;
  `HOLD_EXISTING_ENTRY_CONFLICT` if the same ref exists with a different shape; else append the exact
  planned entry only. Existing entries preserved (empty-array → `set`, non-empty → `insert after last`).
- Entry objects carry a deterministic `_key` (`rel` + sha256(candidateId)[:10]) — required for
  object-array items; the four planned fields (`ref`, `conditions`, `confidence`, `evidenceNote`) are exact.
- Applied in deterministic batches of ≤5 with immediate read-back per operation.

`OPERATION_RESULTS.csv` — one row per op:

| Status | Count |
|---|---|
| `APPLIED_AND_VERIFIED` | **22** |
| `SKIP_ALREADY_PRESENT` | 0 |
| `HOLD_EXISTING_ENTRY_CONFLICT` | 0 |
| `UNCERTAIN` | 0 |

Modified documents: 2 — Firehead Tetra `I9bI8W8ZWcEwyIzM9Cj9MC` (+12 entries), Sterba's Cory
`I9bI8W8ZWcEwyIzM9Ci1Vw` (+10 entries).

## 4. Post-apply verification (`POST_APPLY_VERIFICATION.json`)

| Metric | Value |
|---|---|
| Record count / counts | 473 (unchanged) |
| Drafts | 0 |
| Duplicate `_id` / slug | 0 / 0 |
| Canonical identity hash | `c6e358d5…67aeda` — **MATCH** |
| Relationship edges | 3151 → **3173** (+22, 0 lost) |
| Entries verified exactly once | 22 / 22 |
| Only `compatibleSpecies` changed | **true** (title/slug + all other relationship fields equal to SPEC 12A snapshot) |
| Second dry-run remaining ops | **0** (idempotent) |
| Held / rejected rows promoted | 0 |
| Verdict | **CLEAN** |

`INTEGRITY.json` confirms scope: `field=compatibleSpecies`, `noDeploy=true`, `noSchemaChange=true`,
`noHeldRowsPromoted=true`, identity MATCH, duplicate checks 0.

## 5. Tests & repository checks

- `tests/spec12b-execute.test.ts` — **13/13 pass** (allowlist enforcement, refusal to write other
  fields, add-if-absent, exact-skip idempotency, existing-entry conflict hold, artifact checks;
  no production credentials required).
- `npm run lint` — 0 · `npx tsc --noEmit` — 0.
- Full suite (`--pool=vmThreads`): **417 tests — 415 pass, 2 fail** across 31 files.
  - **Known baseline failure (deterministic):** `tests/compare.test.ts > covers all four database
    types` — asserts 4 compare domains while `lib/compare.ts` defines 5. Pre-existing; not a
    regression, not caused by SPEC 12B.
  - **Load-induced timeout (flaky, environment):** a heavy static/schema test exceeds the 5s default
    timeout under full-suite load. The failing file varies run-to-run (`tests/security-audit.test.ts`,
    then `tests/spec10m-schema.test.ts`) and each passes in isolation. No SPEC 12B code is involved.
  - Note: default `forks`/`threads` pool intermittently hits a 60s worker-startup timeout on jsdom
    `.tsx` files in this environment; `--pool=vmThreads` runs all 31 files deterministically.

## 6. Artifacts (`reports/SPEC_12B/`)

`SPEC_12B_EXECUTION_REPORT.md`, `PREFLIGHT.json`, `DRY_RUN_BEFORE.json`, `OPERATION_RESULTS.csv`,
`POST_APPLY_VERIFICATION.json`, `INTEGRITY.json`, `CHECKSUMS.txt`.

## 7. Caveats

- The 22 edges are documented as **conditional** community compatibility (conditions preserved:
  "peaceful community tank; avoid large, boisterous or aggressive tankmates"). They are not a
  universal safety guarantee for every tank.
- `_key` values are deterministic implementation metadata for object-array items, not part of the
  evidence claim.
- SPEC 12A artifacts were not overwritten; SPEC 12B writes live only in `reports/SPEC_12B/`.

## 8. Next step

Ready for the next phase. Remaining SPEC 12A held work (962 `HOLD_EVIDENCE`, 216 `NOT_APPLICABLE`)
stays out of scope until additional authoritative evidence is gathered. No further production
mutation is required for this spec.
