# SPEC 10N — Deploy Wiki Schema and Integrate Site Queries/Rendering

**Project:** AquaMind / Blog AQUA — Wiki Database  
**Priority:** P0 — prerequisite to SPEC 12A/12B  
**Mode:** Execute scoped implementation, not audit-only.

## Objective
Close the gap left by SPEC 10M: 90 fields, 10 types, and 2 modified fields were added in code, but schema deployment and website GROQ/query/rendering integration were not completed. Reconcile current state, implement the missing work, test it, deploy the Sanity Studio schema only after gates pass, and produce evidence. Do not start SPEC 12A research or SPEC 12B content writes in this run.

## Historical baseline — verify, do not assume
- Dataset: `production`; API version previously recorded as `2026-05-25`.
- Inventory previously recorded: 473 records; 218 species, 62 plants, 56 invertebrates, 48 corals, 46 equipment, 43 problems; 0 drafts.
- Previous canonical identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- SPEC 10M added 90 fields, 10 types, modified 2 fields; not deployed/integrated at the time of the report.
- Previous tests: lint 0; `tsc --noEmit` 0; focused schema tests 108/108; full suite 372 pass + 1 known baseline failure (`tests/compare.test.ts > compare config > covers all four database types`); build 0.
- SPEC 11 already performed 364 production operations across 17 species. SPEC 11A reported 0 production writes and `PARTIAL_EVIDENCE_BLOCKED`.
These are historical values. Recompute current state and never overwrite newer work.

## Hard safety constraints
- Never rerun `SPEC_11_one_shot_execute.js`.
- No production document mutations, bulk patches, imports, or editorial publishing in this spec.
- Do not alter `_id`, `_type`, slug, canonical identity, references, or content values.
- Do not create drafts. Do not expose tokens or print secrets.
- Never run `sanity deploy` until local schema validation, lint, type-check, and focused tests pass and the project/dataset target is verified.
- Preserve user changes. Never reset, clean, stash, or discard changes.
- Do not hide the known full-suite baseline failure; report it and distinguish regressions from pre-existing failures.
- If production content changes unexpectedly, stop immediately and report.

## Phase A — Reconcile
1. Inspect git status/branch, package scripts, Sanity config, schema definitions, type generation, GROQ queries, renderers, tests, and deployment instructions.
2. Read SPEC 10M, SPEC 11 one-shot, and SPEC 11A reports/artifacts.
3. Verify project ID, dataset, API version, CLI version, and auth state without revealing credentials.
4. Record preflight, baseline tests, and read-only inventory/identity if a read-only credential is available.
5. Map every SPEC 10M field/type to actual code before editing.
**Gate A:** Preserve uncommitted changes and reconcile any discrepancy before implementation.

## Phase B — Schema
1. Audit all 10 types, 90 fields, and 2 modified fields against SPEC 10M.
2. Validate types, optionality, arrays/objects, validation rules, descriptions, exports, registrations, and references.
3. Detect collisions, duplicate names, unsupported schema options, and missing imports.
4. Update generated types only through the established generator.
5. Add focused table-driven tests covering new types and fields.
6. Run formatting, lint, type-check, and focused tests.
**Gate B:** Do not deploy if any of these checks fail. Fix in-scope issues; document unrelated baseline failures.

## Phase C — GROQ and website rendering
1. Trace species list/detail queries and their consumers.
2. Select only fields useful to current information architecture; do not render every field indiscriminately.
3. Add the relevant fields to GROQ projections and update result types.
4. Render selected fields in existing design conventions; support absent legacy values without `undefined`, `null`, empty labels, invented defaults, or duplicate facts.
5. Preserve responsive layout, accessibility, and SEO.
6. Add tests for query projections, valid values/units, missing optional values, legacy records, and comparison/filter behavior if affected.
7. Document any field left schema-only and the reason.

## Phase D — Studio deployment
Only after Gates A and B pass:
1. Verify project/dataset from checked-in config and environment variable names; never print secrets.
2. Run the repository's schema validation/build command.
3. Confirm the intended branch contains the changes and no unrelated files are included in any commit/deploy.
4. Deploy the Studio schema using the repository's supported command.
5. Verify deployed schema metadata/endpoint using a read-only check; local build success alone is not deployment proof.
6. If authentication or interactive confirmation is unavailable, stop and mark deployment `BLOCKED`; state the exact user action needed.
Do not deploy the Next.js site unless the repo's documented workflow and explicit deployment target support it. Never claim production is live without verification.

## Phase E — Verify
Run formatter/linter, type-check, focused tests, full test suite, and production build. Record commands and exit codes.
If read-only Sanity access exists, verify document/type counts, current species inventory, no new drafts, unchanged canonical identity hash, and no unintended document mutations. Use the existing canonicalization/integrity script rather than inventing a new hash method.

## Acceptance criteria
- [ ] Current repository state reconciled with SPEC 10M/11/11A.
- [ ] All 10 new types and 90 fields plus 2 modified fields accounted for and valid.
- [ ] Focused schema tests cover the additions.
- [ ] Relevant GROQ projections, TypeScript types, and website rendering integrated.
- [ ] Legacy records safely handle missing optional fields.
- [ ] Lint, type-check, focused tests, and production build pass.
- [ ] Full-suite result includes the known comparison test failure if it remains.
- [ ] Studio schema deployment is verified, or explicitly marked blocked.
- [ ] No production document content was mutated; read-only integrity evidence recorded.

## Required artifacts
Follow repository conventions and create:
- `reports/SPEC_10N/SPEC_10N_PREFLIGHT.md`
- `reports/SPEC_10N/SCHEMA_FIELD_AUDIT.csv` (each type/field, schema status, query integration, rendering status, test status)
- `reports/SPEC_10N/SPEC_10N_EXECUTION_REPORT.md`
- `reports/SPEC_10N/INTEGRITY.json` (before/after checks and `content_mutations: 0`)
- `reports/SPEC_10N/CHECKSUMS.txt` if checksums are part of the repository's reporting convention.

The report must include changed files/rationale, commands and exit codes, test counts/failures, deployment verification, integrity evidence, blockers, and the exact next action. If deploy is blocked, use `PARTIAL — CODE READY / DEPLOYMENT BLOCKED`, not `COMPLETE`.

## OpenCode execution directive
Execute phases in order and make scoped code changes; do not stop after an audit or recommendations. Run verification and deploy Studio only after all gates pass. Do not begin SPEC 12A or SPEC 12B in this run. If a hard gate fails, make safe in-scope fixes where possible, then stop at that gate with a precise report.
