# SPEC 14 — Relationship Quality Audit & Coverage Review

## Mission
Execute SPEC 14 end-to-end now as a bounded, evidence-backed **read-only audit** of AquaMind Wiki Database relationships. Produce completed findings and a prioritized remediation backlog, not another proposal.

Handoff values from previous phases: 473 Wiki records, 3,190 relationship edges after SPEC 13B WRITE. These are not assumed current; query production and report actual values.

## Target / safety boundary
- Sanity project: `zeohjejw`
- Dataset: `production`
- API version: `2026-05-25`
- Mode: read-only. Mandatory: `content_mutations=0`, `schema_changes=0`, `deploys=0`.
- Do not create, patch, delete, publish, unpublish, migrate or otherwise mutate Sanity documents. Do not deploy or commit. Never run historical production-write scripts.
- Do not overwrite or modify prior SPEC 12A, 12B, 13A, or 13B WRITE artifacts.
- If live read access is unavailable, report `BLOCKED_READ_ACCESS`; do not guess.

## Before running
1. Inspect current repo instructions, schemas, relationship fields, types, helpers, tests, and existing SPEC 10M/12A/12B/13A/13B WRITE artifacts.
2. Verify prior artifact checksums and document known drift without repairing old artifacts.
3. Discover relationship fields from current schema/code rather than assuming a fixed list. Earlier inventory had 28 fields; report any difference.
4. Identify the repo's existing Sanity read/query pattern. Use only read-only queries. Do not initialize or invoke mutation APIs.
5. Record git HEAD, working tree status, Node version, timestamp, project/dataset/API.

## Audit every relationship field defined in current schema/code
For each field, identify owner types, target types, object/reference shape, direction, array/reference semantics, applicability, and legitimate empty/N/A cases. Measure populated source docs, edge counts, unique source-target pairs, and field coverage.

Check for:
- Dangling/unresolvable references and wrong target types.
- Self-links, duplicate target references per field, duplicate `_key`s, malformed entries and invalid enum values.
- Directionality errors and contradictions across fields (e.g. a pair marked both compatible and incompatible).
- Symmetry only where the domain model explicitly expects it. `predatorPrey` is directional; do not treat it as symmetric.
- Evidence provenance, caveats, confidence/risk, and traceability to recorded candidate/evidence artifacts.
- Coverage by all current Wiki types (previously species, plant, invertebrate, coral, equipment, problem, plus any new types).
- All seven source/field arrays touched by SPEC 13B WRITE, including the 17 applied operations and the four excluded candidates `REL13A-0016`, `REL13A-0017`, `REL13A-0019`, `REL13A-0020`.

Treat semantic concerns as review candidates unless direct evidence proves a defect. Do not label biological compatibility/predation based on intuition alone. For additional research, use reliable specialist sources and record URL, source type, exact supported claim, caveat and access date. Avoid broad research just to inflate findings.

## Finding classifications
Use exactly one per finding:
- `CONFIRMED_DEFECT`
- `HIGH_CONFIDENCE_REVIEW`
- `LOW_CONFIDENCE_REVIEW`
- `COVERAGE_GAP`
- `EXPECTED_EMPTY_OR_NA`
- `PASS`
- `NOT_CHECKED`

Absence alone is not an error. Clearly distinguish confirmed integrity defects, evidence-backed semantic concerns, lower-confidence concerns, expected N/A and coverage gaps.

## Coverage review
Prioritize:
1. Confirmed integrity defects.
2. High-confidence semantic contradictions or questionable high-risk edges.
3. Important thin/empty fields, separating expected N/A from real coverage gaps.
4. Next evidence-research candidates with reader/data benefit, evidence needed and priority.
5. Fields where adding more edges could reduce data quality.

Do not write any proposed relationship to production. Candidate suggestions are research-only, not an apply plan.

## Implementation
- Prefer `scripts/SPEC_14_audit.js` (or repo's established TS convention) and `tests/spec14-audit.test.ts`.
- Read-only by construction: no `.create`, `.createOrReplace`, `.delete`, `.patch`, `.transaction`, publish/unpublish, or schema-write calls. Add tests/static guards against mutation methods.
- Paginate safely; prove query completeness and avoid silent API/query limits.
- Keep secrets out of output. Do not print environment variables or tokens.
- Use existing dependencies; don't add dependencies unless necessary.
- Keep output deterministic and reconcile field totals, per-type totals, total edges and unique-pair counts.

## Required artifacts
Create `reports/SPEC_14/` without overwriting earlier reports:
1. `SPEC_14_RELATIONSHIP_QUALITY_AUDIT.md` — summary, methods, baseline, findings, limitations, prioritized actions.
2. `LIVE_BASELINE.json` — target, counts by type, drafts, duplicate IDs/slugs, identity hash, total edges, timestamp, pagination/completeness.
3. `RELATIONSHIP_FIELD_INVENTORY.csv` — discovered fields, owners, targets, shape, applicability, counts and coverage.
4. `INTEGRITY_FINDINGS.csv` — classification/severity, source ID/type, field, target ID/type, evidence and action.
5. `COVERAGE_MATRIX.csv` — field × source/target domain, populated docs, edges, coverage interpretation and N/A reason.
6. `PROVENANCE_AUDIT.csv` — edge/candidate provenance, source artifact, evidence IDs/URLs, confidence/risk/caveat.
7. `SPEC13B_WRITE_ARRAY_CHECK.json` — reconcile seven modified arrays and all 17 applied operations.
8. `REMEDIATION_BACKLOG.csv` — priority, impact, evidence needed, next action/owner and acceptance criteria.
9. `TEST_RESULTS.md` — lint, typecheck, focused and full test outcomes.
10. `CHECKSUMS.txt` — SHA-256 for new scripts, tests and report artifacts.

## Required validation and tests
- Prove all Wiki records were enumerated and pagination completed.
- Validate field inventory against schemas and live data.
- Reconcile counts and make each finding reproducible with IDs and supporting data.
- Confirm 17 SPEC 13B operations are present exactly once, correct shape/direction; confirm four excluded IDs were not applied.
- Reconcile seven modified arrays against the prior post-write artifact. If production has drifted, report it; do not change it.
- Unit tests: field inventory, counts, reference/type validation, directionality, duplicates, pagination completeness, classification and read-only enforcement.
- Run `npm run lint`, `npx tsc --noEmit`, focused SPEC 14 tests and full suite (`--pool=vmThreads` if needed).
- Record the known baseline failure `tests/compare.test.ts > covers all four database types` separately. Do not fix unrelated code. Report any new failures accurately.
- If access, completeness, artifact integrity or required gates fail, use `PARTIAL`/`BLOCKED`; do not claim clean.

## Execution sequence
Inspect repo/artifacts → implement audit and tests → run offline tests → perform live read-only audit → independently reconcile counts/findings → run lint/typecheck/focused/full tests → generate artifacts/checksums → final check proving zero mutations/schema changes/deploys and no prior artifact changes.

## Final status (choose exactly one)
- `COMPLETE`: live reads complete, pagination proven, counts reconcile, artifacts/tests generated, zero mutations/schema changes/deploys.
- `PARTIAL`: audit ran but some checks remain unresolved; list exact gaps.
- `BLOCKED_READ_ACCESS`: live production could not be read safely.
- `BLOCKED_ARTIFACT_OR_TEST_GATE`: prior artifact integrity or required test gate blocked the audit.

Do not stop at a proposal or ask what to do next. Execute SPEC 14 now within the read-only boundary and return status, actual baseline, top findings, test results, report directory and blockers. Do not deploy or commit.
