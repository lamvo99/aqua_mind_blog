# SPEC 13B — Live Preflight + Dry-Run (STOP Before Production Mutation)

## Mission

Validate the SPEC 13A relationship plan against the current live Sanity dataset and produce a reproducible, evidence-gated dry-run report. This stage is **READ-ONLY**. It must stop before any production mutation and request separate explicit approval before a later write-only execution stage.

## Target

- Sanity project: `zeohjejw`
- Dataset: `production`
- API version: `2026-05-25`
- Expected Studio: `https://aqua-mind-blog.sanity.studio/`
- SPEC 13A report: `reports/SPEC_13A/SPEC_13A_EXECUTION_REPORT.md`
- Plan: `reports/SPEC_13A/SPEC_13B_DRY_RUN_PLAN.json`
- Evidence: `reports/SPEC_13A/EVIDENCE.csv`
- Candidate register: `reports/SPEC_13A/CANDIDATES.csv`
- Held register: `reports/SPEC_13A/HELD_REGISTER.csv`
- Conflicts register: `reports/SPEC_13A/CONFLICTS.csv`
- Baseline/integrity: `reports/SPEC_13A/BASELINE.json`, `reports/SPEC_13A/INTEGRITY.json`
- Checksums: `reports/SPEC_13A/CHECKSUMS.txt`

## Absolute safety boundary

**DO NOT WRITE TO PRODUCTION IN THIS SPEC.**

Forbidden:
- `create`, `createOrReplace`, `createIfNotExists`, `patch`, `delete`, transaction commits, mutation API calls, or any equivalent write path against Sanity.
- Schema edits, Studio deployment, content migrations, or generated scripts that execute mutations.
- Editing or regenerating the SPEC 13A candidate/evidence/held artifacts in place.
- Running `SPEC_11_one_shot_execute.js`.
- Promoting any `HOLD_EVIDENCE`, `REJECT_SEMANTIC_MAPPING`, conflict, or not-applicable row into the candidate plan.
- Treating the simulated `3173 → 3194` edge count as an actual production change.

Use read-only GET/query operations only. If you cannot prove the client is read-only, stop and report the blocker.

## Phase 0 — Repository and artifact preflight

1. Confirm the repository root, current branch, git HEAD, Node version, and working-tree status.
2. Read the SPEC 13A report and all relevant plan/evidence/validation artifacts.
3. Verify SPEC 13A checksums against the exact files listed in its checksum manifest. Do not overwrite that manifest or any SPEC 12A/12B artifacts.
4. Record any checksum drift as an explicit discrepancy; do not silently “fix” it.
5. Confirm the existing known baseline test failure is still the compare-domain assertion in `tests/compare.test.ts` (four expected vs five defined), unless current evidence shows otherwise. Do not change unrelated tests or production code to make this spec pass.

## Phase 1 — Re-read live baseline (read-only)

Query the live dataset and record:
- project/dataset/API identity;
- counts by type and total count;
- draft count;
- duplicate `_id` and slug counts;
- canonical identity hash using the same SPEC 13A method;
- current relationship-edge count;
- whether all candidate source and target IDs still exist and have the expected types;
- whether each planned edge is still absent or already present;
- any relevant source document revision IDs for conflict detection in a later, separately approved write phase.

Expected SPEC 13A handoff baseline was:
- 473 records: species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43;
- 0 drafts and 0 duplicate IDs/slugs;
- identity hash `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`;
- 3,173 relationship edges;
- project `zeohjejw`, dataset `production`.

These are expectations, not permission to proceed when live data differs. If identity hash, counts, schema shape, project/dataset, or baseline relationship count differs unexpectedly, **STOP** and explain the discrepancy. Do not overwrite the new live state with old assumptions.

## Phase 2 — Revalidate the bounded 21-operation plan

Only these two relationship families are in scope:
- `predatorPrey`: 15 proposed operations, directional source predator → target prey.
- `incompatibleSpecies`: 6 proposed operations, non-prey incompatibility only.

For every candidate, verify:
1. Candidate ID is unique and maps to exactly one evidence row.
2. Source and target resolve to current live documents of expected types.
3. Relationship field and object shape match the currently deployed schema.
4. No self-link, dangling reference, duplicate, or reverse edge is introduced.
5. `_key` remains deterministic and unique within the destination array.
6. The exact source-target pair is absent from live data; if already present, classify it as `ALREADY_PRESENT` and do not count it as a new operation.
7. No held/rejected candidate has leaked into the plan.
8. Evidence excerpt actually supports the candidate claim; preserve the distinction between an explicit source statement and a size/temperament inference.

### Mandatory evidence-quality review

SPEC 13A used five Seriously Fish pages, categorized as `C3_SPECIALIST_REFERENCE`. This is useful specialist evidence but is not primary literature or independent corroboration. Keep the evidence class exactly as documented; do not upgrade it.

Pay particular attention to the six `incompatibleSpecies` proposals:
- Bala Shark → Honey Gourami (medium inference)
- Bala Shark → Betta Imbellis (medium inference)
- Yo-Yo Loach → Guppy (explicitly named in source)
- Yo-Yo Loach → Marble Angelfish (general “many cichlids” statement)
- Pea Puffer → Marble Angelfish (general slow-moving/long-finned fish statement)
- Oscar → Pygmy Corydoras (relative-size inference)

Do not silently promote generic temperament statements into certainty. Preserve the recorded confidence, risk tier, caveats, and rationale. If the source does not support a pair strongly enough, flag it for manual review and exclude it from the eligible dry-run subset; do not edit the original SPEC 13A plan.

For `predatorPrey`, preserve directionality and size/diet caveats. These are conditional biological relationships, not universal guarantees for every individual fish or aquarium.

## Phase 3 — Simulate only

Produce a fresh dry-run result derived from the current live baseline. Do not run mutation helpers, even in “dry-run” mode, if they initialize a write client or can accidentally commit.

Report separately:
- proposed operations from the original plan: 21;
- still eligible after live revalidation;
- already-present operations;
- held for evidence/manual review;
- conflicts or missing references;
- projected edge count only if all eligible operations were later approved;
- expected idempotency behavior.

The old `3173 → 3194` figure is a simulation from SPEC 13A, not a live count. Recompute the projection from the current live baseline and eligible operation count.

## Phase 4 — Tests and gates

Run, where practical:
- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run tests/spec13a-plan.test.ts --pool=vmThreads`
- the relevant SPEC 13B preflight/dry-run tests if they already exist.

Do not add or change tests merely to hide unrelated baseline failures. Record exact commands and results. If full-suite execution is useful, run it and report the known `tests/compare.test.ts` baseline failure separately from any new failure.

## Required output artifacts

Create a new folder `reports/SPEC_13B/` without overwriting SPEC 13A artifacts. Include at minimum:

1. `SPEC_13B_PREFLIGHT_REPORT.md`
2. `LIVE_BASELINE.json`
3. `CANDIDATE_REVALIDATION.csv`
4. `EVIDENCE_REVIEW.csv`
5. `DRY_RUN.json`
6. `INTEGRITY.json`
7. `TEST_RESULTS.md`
8. `CHECKSUMS.txt`

The report must state:
- live project/dataset and timestamp;
- before/after live edge count (must be unchanged because this spec is read-only);
- number of candidates eligible, already present, held, rejected, or conflicting;
- any discrepancy from SPEC 13A baseline;
- proof that `content_mutations = 0`, `schema_changes = 0`, and `deploys = 0`;
- exact checksum status and test results.

## Hard stop and handoff

At the end of SPEC 13B:
- Do not write to production.
- Do not claim that the proposed edges were applied.
- Do not automatically start an execution script.
- Do not interpret running this prompt as approval to mutate production.

Finish with a clear decision:
- `READY_FOR_EXPLICIT_WRITE_APPROVAL` only if all critical gates pass and eligible candidates are evidence-reviewed; or
- `BLOCKED` with exact reasons.

If ready, prepare a concise summary of the exact operation count and list any candidates requiring manual review. Wait for a separate, explicit user instruction authorizing production writes before creating/running a mutation stage. That later stage must re-read the live baseline again, use optimistic concurrency (`ifRevisionID` or equivalent), apply add-if-absent, batch small writes, read back each change, and stop on any conflict or integrity mismatch.
