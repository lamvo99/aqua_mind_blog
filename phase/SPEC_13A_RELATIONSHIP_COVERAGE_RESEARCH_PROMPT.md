# SPEC 13A — Relationship Coverage Expansion: Evidence Research & Candidate Plan

**Project:** AquaMind Wiki Database  
**Mode:** READ-ONLY / RESEARCH-ONLY. No production writes, no schema edits, no Studio deploy.  
**Handoff:** SPEC 12B completed; 22 evidence-backed `compatibleSpecies` edges were applied and read-back verified.  
**Primary goal:** Determine the safest, highest-value next relationship coverage batch using live data and traceable evidence, then produce a deterministic offline candidate plan for a future separately approved SPEC 13B.

## 0. Hard safety constraints

1. This spec is strictly read-only against Sanity production. Use GET/query operations only. Tests may mock mutation behavior, but no production mutation endpoint may be called.
2. Do not create, update, delete, publish, unpublish, or patch documents. Do not change schemas or deploy Studio.
3. **Never rerun `SPEC_11_one_shot_execute.js` or any prior production executor.**
4. Do not treat empty relationship slots as proof that a relationship exists. Do not fill by taxonomy, name similarity, popularity, intuition, or LLM plausibility alone.
5. Preserve all existing records and fields. Do not overwrite, reset, clean, stash, or discard user changes. Inspect `git status --short`, branch, and HEAD first.
6. Do not print tokens, credentials, environment values, or secret-bearing config. Verify project/dataset identifiers without exposing secrets.
7. No candidate from this spec is authorized for production write. A separate SPEC 13B must revalidate the live baseline and require explicit review/approval before any writes.
8. Keep SPEC 12A and SPEC 12B reports/artifacts unchanged.

## 1. Verified handoff context — re-check, do not blindly trust

SPEC 12A reported:
- 473 wiki records: 218 species, 62 plants, 56 invertebrates, 48 corals, 46 equipment, 43 problems.
- 0 drafts, no duplicate IDs/slugs.
- Canonical identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- Relationship edge count before SPEC 12B: 3,151.
- Six entry-object relationship families introduced in SPEC 10M were empty at the SPEC 12A baseline: `compatibleSpecies`, `incompatibleSpecies`, `predatorPrey`, `reefInteractionDetail`, `coralNeighbors`, `compatibleEquipment`.
- SPEC 12A proposed 22 `compatibleSpecies` edges, all `PROPOSE_WITH_CAVEAT`, `MEDIUM`, `P1`.

SPEC 12B report says:
- 22/22 planned edges were applied and read-back verified.
- Current expected edge count after SPEC 12B: 3,173.
- Current expected identity hash remains the same because only relationship arrays changed.
- 473 records, 0 drafts, 0 duplicate IDs/slugs; only `compatibleSpecies` changed.
- Target configuration reported project `zeohjejw`, dataset `production`, API version `2026-05-25`, Studio `https://aqua-mind-blog.sanity.studio/`.

These are historical handoff values, not permission to proceed if live state differs. Re-query and calculate fresh baselines before research. If live configuration, identity hash, inventory, schema, or relationship count differs unexpectedly, stop and document the discrepancy. Never expose secrets.

## 2. Phase A — repository and artifact reconnaissance

1. Record `git status --short`, current branch, HEAD, Node version, and relevant package scripts without changing unrelated files.
2. Read and verify:
   - `reports/SPEC_12A/SPEC_12A_EXECUTION_REPORT.md`
   - `reports/SPEC_12A/RELATIONSHIP_FIELD_MAP.csv`
   - `reports/SPEC_12A/RELATIONSHIP_BASELINE.json`
   - `reports/SPEC_12A/RELATIONSHIP_EVIDENCE.csv`
   - `reports/SPEC_12A/RELATIONSHIP_CANDIDATES.csv`
   - `reports/SPEC_12A/RELATIONSHIP_CONFLICTS.csv`
   - `reports/SPEC_12A/SPEC_12B_HELD_REGISTER.csv`
   - `reports/SPEC_12B/SPEC_12B_EXECUTION_REPORT.md`
   - `reports/SPEC_12B/POST_APPLY_VERIFICATION.json`
   - `reports/SPEC_12B/INTEGRITY.json`
   - the relevant `CHECKSUMS.txt` files.
3. If exact paths differ, locate the matching artifacts and record the actual paths. Do not fabricate missing inputs. If a critical report is absent or checksums fail, stop with `BLOCKED` for artifact integrity and report the issue.
4. Inspect the source-of-truth relationship model (`lib/relationship-plan.ts` or current equivalent), schemas for all six wiki types, the currently deployed schema if the project has a read-only inspection path, and relevant tests. Confirm each field's direction, entry-object shape, allowed source/target types, conditions, confidence, evidence-note semantics, and risk level.

## 3. Phase B — fresh live baseline (read-only)

Use only read-only Sanity queries. Recalculate and save:
- project ID and dataset (must be the intended production target; do not print credentials);
- per-type record counts, total record count, draft count, duplicate `_id` and slug counts;
- canonical identity hash using the repository's existing algorithm;
- deployed schema/version evidence where available;
- total relationship edge count and per-field/per-type coverage;
- all current entries for the six entry-object relationship families;
- references that do not resolve, distinguishing genuinely broken references from valid `post`/`tool` references outside the six wiki types.

Expected handoff values are 473 records, 0 drafts, identity hash above, and 3,173 edges after SPEC 12B. Do not force results to match these values. If identity hash or inventory differs, or if the edge count changed unexpectedly, stop before making candidate claims and produce a discrepancy report. If only relationship counts changed but identity is stable, explain which fields changed and whether the delta is legitimate.

## 4. Phase C — coverage analysis and prioritization

Build a field-by-field coverage matrix for every relationship field in the current model, not just the six entry-object fields. Include:
- source type and relationship field;
- allowed target type(s);
- records with non-empty values;
- current edge count;
- empty-slot count where it can be meaningfully estimated;
- applicability by freshwater/saltwater/brackish context;
- safety/impact tier and risk;
- whether the relationship is directional or symmetric;
- schema support and current evidence availability;
- reason to prioritize or defer.

Do not equate “empty field” with a data defect. Distinguish:
- high-value actionable coverage gaps;
- not applicable by design;
- fields requiring tank-specific context;
- fields with insufficient source evidence;
- conflicts or ambiguous identity mappings.

Prioritize the next research batch by user value, source quality, safety, and realistic evidence yield. Consider the under-populated entry-object families `incompatibleSpecies`, `predatorPrey`, `reefInteractionDetail`, `coralNeighbors`, and `compatibleEquipment`, plus any other materially under-covered family revealed by live inspection. Do not assume every family is suitable for this batch. Avoid re-proposing the 22 SPEC 12B edges or any already-present equivalent edge.

## 5. Phase D — bounded evidence research

Select a small, explicit batch that can be researched and reviewed carefully (target 20–40 candidate edges maximum across no more than two relationship families; fewer is acceptable). State why these families were selected and why others were deferred.

Evidence requirements:
- Prefer primary/specialist sources and authoritative husbandry references. Use sources of the same or better quality than SPEC 12A's class-3 specialist references where feasible.
- Capture source title, publisher/author, URL, access date, source class, relevant short quotation or faithful evidence excerpt, the exact claim supported, and the candidate edge(s) it supports.
- Do not copy large source passages. Preserve enough excerpt to audit the claim.
- Cross-check scientific names against canonical catalog records. Never map a generic/common-name group to a specific species unless the source and catalog identity make the mapping defensible.
- Check contradictory evidence. Log conflicts explicitly; conflicting or unclear candidates must be held, not resolved by guess.
- For compatibility/interactions, account for relevant caveats such as adult size, temperament, salinity, reef sensitivity, predation, tank size, and water conditions whenever sources make them relevant.
- Use decisions such as `PROPOSE_WITH_CAVEAT`, `HOLD_EVIDENCE`, `HOLD_CONFLICT`, `REJECT_SEMANTIC_MAPPING`, `NOT_APPLICABLE`, and `SKIP_ALREADY_PRESENT` consistently with the existing project conventions.
- Do not upgrade confidence beyond what evidence supports. Treat P1/safety-relevant assertions conservatively.
- If web research is unavailable or evidence is inadequate, preserve the candidate as held and explain the blocker.

## 6. Phase E — deterministic offline plan and validations

Produce a machine-readable plan for a future SPEC 13B, but **do not execute it**. Plan entries must be additive and exact, with stable candidate IDs and explicit target field/path. Preserve existing array entries. Include only evidence-backed candidates meeting the defined threshold; all others remain held.

Validate at minimum:
1. Every field/path is an allowed relationship path in the current model.
2. Source and target IDs exist and have allowed types.
3. No self-links unless the schema explicitly permits them (default: reject).
4. No dangling references.
5. No duplicate edge against current data or within the plan, including semantic duplicates where the same relation is encoded differently.
6. No duplicate reapplication in the simulated dry run (idempotency).
7. Directionality and symmetry are handled correctly; do not automatically add reverse edges unless the model and evidence explicitly justify them.
8. Entry-object shape matches the current schema exactly.
9. Evidence rows trace to every proposed edge.
10. No non-relationship field or production mutation client is included in execution paths.
11. No SPEC 12B candidate is reintroduced.
12. Held/conflict/rejected/not-applicable rows cannot leak into the plan.

Add focused tests for pure plan validation only if needed. Tests must not require production credentials and must mock any write capability. Do not fix unrelated failures. Record the existing known baseline test failure in `tests/compare.test.ts` (assertion expects four database types while the model has five) and any environment/load-related flaky timeout separately; verify current status instead of assuming.

## 7. Required artifacts

Create a new directory `reports/SPEC_13A/` without overwriting earlier artifacts. At minimum include:
1. `SPEC_13A_EXECUTION_REPORT.md` — verdict `COMPLETE`, `PARTIAL`, or `BLOCKED`; scope, method, live baseline, discrepancy checks, chosen families and rationale, counts, evidence quality, limitations, test results, and recommended next step.
2. `BASELINE.json` — fresh read-only inventory, hash, edge counts, and configuration identifiers (no secrets).
3. `COVERAGE_MATRIX.csv` — field-level coverage and applicability analysis.
4. `PRIORITY_DECISIONS.csv` — included/deferred relationship families and rationale.
5. `CANDIDATES.csv` — one row per reviewed candidate, including source/target IDs and names, field, proposed entry, decision, confidence, risk, caveat, evidence IDs, and rationale.
6. `EVIDENCE.csv` — source registry and traceable evidence excerpts.
7. `CONFLICTS.csv` — conflicting or ambiguous claims; header-only if none.
8. `HELD_REGISTER.csv` — all candidates withheld and reasons; do not discard unresolved items.
9. `SPEC_13B_DRY_RUN_PLAN.json` — only candidates passing every validation gate; zero operations is valid if evidence is insufficient.
10. `VALIDATION_RESULTS.json` — explicit pass/fail for each validation.
11. `INTEGRITY.json` — post-run read-only check proving production content was not mutated and baseline identity remains consistent.
12. `CHECKSUMS.txt` — deterministic hashes of the SPEC 13A artifacts.
13. Focused test file(s) if code/tests were added; list their exact results.

Sort output deterministically. Do not overwrite the SPEC 12A or SPEC 12B reports. Avoid committing unrelated changes; do not create a commit unless repository workflow explicitly requires it.

## 8. Verdict rules

- `COMPLETE`: live baseline was verified; bounded coverage research and validation completed; artifacts and checksums created; zero production mutations confirmed. A candidate plan may contain zero operations.
- `PARTIAL`: useful research completed but a specific evidence, baseline, or validation blocker prevented full coverage. Clearly identify complete and incomplete parts.
- `BLOCKED`: project/dataset identity, artifact integrity, or baseline safety gates failed before research could safely continue.

## 9. Final response requirements

Return a concise but substantive handoff with:
- verdict and confirmation `production writes = 0`, schema edits = 0, deploys = 0;
- fresh baseline counts/hash and whether they match SPEC 12B;
- coverage gaps and selected families;
- candidate/evidence/held counts and the quality bar applied;
- focused/full test results and known failures;
- exact artifact paths and checksum status;
- whether SPEC 13B is ready for review, needs more research, or is blocked.

Do not describe proposed edges as guaranteed safe for every aquarium. Do not run SPEC 13B or any production write as part of SPEC 13A.
