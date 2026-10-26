# SPEC 13B — Production Write Execution Prompt

## Authorization
The project owner explicitly approves the SPEC 13B write stage, limited to the exact **17 operations marked eligible** in the validated SPEC 13B artifacts.

Target: Sanity project `zeohjejw`, dataset `production`, API version `2026-05-25`.

The following four candidates are explicitly excluded and must not be written:
- `REL13A-0016`
- `REL13A-0017`
- `REL13A-0019`
- `REL13A-0020`

Do not ask for another approval if all hard gates pass. Do not expand scope.

## Mission
Apply only the exact 17 eligible operations from the SPEC 13B artifacts. The expected projection is 3173 → 3190 edges, but recompute from the fresh live baseline and exact operation set; never force the result to match the projection.

## Hard safety gates
1. Read the project workflow, SPEC 13A/13B reports, candidate/evidence CSVs, eligible-operation artifacts, and checksums first.
2. Verify all SPEC 13B artifact checksums and the exact target: project `zeohjejw`, dataset `production`, API `2026-05-25`.
3. Immediately before mutation, query live production read-only and verify: record count, drafts, duplicate `_id`/slug count, canonical identity hash, relationship edge count, and all source/target IDs and types.
4. Require this live baseline: 473 records, 0 drafts, 0 duplicate IDs/slugs, identity hash `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`, 3173 relationship edges. If anything differs, stop without writes and report `BLOCKED_BASELINE_DRIFT`.
5. Recompute the eligible set from the validated SPEC 13B artifacts. Require exactly 17 unique, evidence-linked operations, all eligible, valid directionality/shape, no self-links, dangling refs, duplicates, or conflicts. If not exactly 17, stop without writes.
6. Explicitly exclude the four manual-review IDs above and all held, rejected, conflicting, already-present, or otherwise ineligible rows. Never infer or promote them.
7. Never rerun `SPEC_11_one_shot_execute.js`. Do not overwrite or mutate SPEC 12A, SPEC 12B, or SPEC 13A plan/evidence artifacts. No schema changes and no deploy.
8. Use the established mutation pattern: optimistic concurrency via `ifRevisionID`, re-read before each patch, add-if-absent semantics, deterministic array-item `_key`, batches of no more than 5, and immediate readback. Do not initialize/use a write client until every preflight gate passes.
9. Resolve timeouts/ambiguous write responses by reading the document and checking the exact relation before considering a retry. Never blindly retry.
10. On any conflict, revision mismatch, unexpected shape, failed readback, or integrity failure, stop further writes immediately. Preserve evidence and report partial execution accurately. Do not improvise rollback.
11. Do not claim success based only on API acknowledgements. Verify every operation against live production.
12. Never log credentials or tokens.

## Execution sequence

### A. Repository and artifact validation (read-only)
- Record git HEAD, working-tree status, Node version, and timestamp.
- Verify checksums and inspect SPEC 13B reports/artifacts.
- Confirm the four excluded IDs are absent from the eligible list.
- Create an immutable execution manifest from the validated artifacts containing exactly 17 candidate IDs, source/target IDs, relationship field, direction, evidence IDs, confidence, risk, and caveats. Do not reconstruct candidate details from memory.

### B. Fresh live preflight (read-only)
- Recompute live baseline integrity metrics.
- Validate relationship fields and source/target types.
- For each of the 17 candidates, inspect live state: exact relation already present, conflict, or applicable.
- If any operation is already present, conflicting, unresolved, or no longer eligible, stop before the first write and report `BLOCKED_CANDIDATE_DRIFT`. Do not silently shrink or replace the approved set.
- Recalculate the expected edge projection.

### C. Execute
- Only after A and B pass, apply the exact 17 operations.
- Use `ifRevisionID` and re-read the current document/revision immediately before each patch.
- Add only if absent; preserve all existing fields and array items.
- Use deterministic `_key` and the established relationship-object shape.
- Batch at most 5 operations and verify each batch immediately before continuing.
- Never write the four excluded IDs or any other operation.

### D. Post-write verification (read-only)
Verify live production:
- All 17 approved operations are present exactly once with correct shape and direction.
- No excluded/manual-review/held/rejected operation was applied.
- Record count remains 473; drafts remain 0; duplicate IDs/slugs remain 0.
- Identity hash remains exactly `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- Relationship edges increase by exactly 17 from the fresh baseline, expected 3173 → 3190.
- No prior edge was lost; no unrelated field/document changed.
- Second dry-run/idempotency check reports zero additional operations.
- Check SPEC 12A, SPEC 12B, and SPEC 13A artifacts for unintended changes.

### E. Tests and reporting
- Run lint, `tsc --noEmit`, focused SPEC 13A/SPEC 13B tests, and full tests using the known stable pool configuration if needed.
- Report the known baseline failure in `tests/compare.test.ts` separately; do not fix unrelated code. Report any new failures accurately.
- Create `reports/SPEC_13B_WRITE/` containing:
  - `SPEC_13B_WRITE_EXECUTION_REPORT.md`
  - `EXECUTION_MANIFEST.json`
  - `PREFLIGHT.json`
  - `OPERATION_RESULTS.csv`
  - `POST_WRITE_VERIFICATION.json`
  - `INTEGRITY.json`
  - `TEST_RESULTS.md`
  - `CHECKSUMS.txt`
- Include per-operation status, concurrency/revision outcomes, readback evidence, timestamps, before/after edge counts, and any partial failure. Never include credentials.
- Do not overwrite prior phase reports. Do not deploy.

## Final status must be exactly one of
- `COMPLETE`: all 17 operations applied and independently verified; integrity and idempotency gates pass; no unrelated mutation.
- `PARTIAL_STOPPED`: some writes occurred before a safety gate failed; list applied, unapplied, and uncertain operations exactly.
- `BLOCKED_BASELINE_DRIFT`: fresh baseline differs; zero writes.
- `BLOCKED_CANDIDATE_DRIFT`: one or more candidate statuses changed/conflict; zero writes.
- `BLOCKED_ARTIFACT_OR_TEST_GATE`: artifact validation or required pre-write gate failed; zero writes.

Never report `COMPLETE` without live post-write evidence. Return a concise summary with report path and integrity/test outcomes.
