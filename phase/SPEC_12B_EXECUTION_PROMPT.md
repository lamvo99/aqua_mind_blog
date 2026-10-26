# SPEC 12B — Evidence-Gated Relationship Apply
**Project:** AquaMind Wiki Database  
**Mode:** Controlled production write; allowlisted plan only  
**Input:** `reports/SPEC_12A/SPEC_12B_DRY_RUN_PLAN.json` and associated SPEC 12A reports  
**Allowed writes:** At most the 22 approved `compatibleSpecies` operations in the verified plan  
**Forbidden:** Any other content edits, schema changes, Studio deployment, or held-row promotion

## 0. Mission

Execute the verified SPEC 12A relationship plan against the Sanity `production` dataset using strict preflight checks, idempotent add-if-absent writes, and post-write verification. Do not broaden scope. If any safety gate fails, stop before writing and report `BLOCKED`. Do not improvise replacement operations.

Known SPEC 12A report (must be re-verified against files and live data):
- 473 records, 0 drafts.
- Canonical identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- 3,151 existing relationship edges.
- 22 proposed operations, all additive `compatibleSpecies` entry-object additions.
- Each proposed edge is `PROPOSE_WITH_CAVEAT`, confidence `MEDIUM`, risk `P1`.
- Simulation: 3,151 → 3,173 edges; zero duplicate edges on reapply.
- 962 `HOLD_EVIDENCE` and 216 `NOT_APPLICABLE` rows must remain untouched.
- SPEC 12A reported lint and TypeScript passing, 16/16 focused tests passing, and one known full-suite failure in `tests/compare.test.ts`.

The report contains a project-ID spelling that must be checked against current configuration. Verify the configured project/dataset and deployed Studio configuration without printing secrets. If configuration conflicts with the SPEC 12A report or intended production dataset, stop.

## 1. Mandatory preflight — no writes until all checks pass

1. Inspect `git status --short`, current branch, HEAD, and SPEC 12A report. Preserve unrelated and uncommitted changes; do not reset, clean, stash, or overwrite user work.
2. Read the exact dry-run plan, baseline, integrity report, field map, candidate list, evidence, held register, validation results, and checksums from `reports/SPEC_12A/`.
3. Verify plan checksum and schema. Confirm exactly 22 operations, all target `compatibleSpecies`, all use the expected entry shape (`ref`, `conditions`, `confidence`, `evidenceNote`), and all are `PROPOSE_WITH_CAVEAT` / `MEDIUM` / `P1`.
4. Confirm all operation target IDs and reference IDs resolve to existing records of allowed types, and each entry complies with the currently deployed schema.
5. Confirm evidence for every planned edge is traceable in `RELATIONSHIP_EVIDENCE.csv`. Do not add edges merely plausible from taxonomy.
6. Query live production read-only. Recalculate total records and type counts, draft count, duplicate IDs/slugs, canonical identity hash, relationship edge count, and exact current state of the 22 target entries.
7. Compare live state to SPEC 12A. If identity hash differs, inventory changed, relationship baseline differs unexpectedly, deployed schema no longer matches, or plan/checksums are invalid, stop before writing.
8. Inspect the mutation path. Use the established Sanity write helper only if its behavior is understood and constrained to this allowlist. Never print credentials.

Do not use a broad “fill relationships” script. Do not rerun `SPEC_11_one_shot_execute.js`.

## 2. Allowlist and mutation contract

The only permitted mutations are the exact 22 operations from `SPEC_12B_DRY_RUN_PLAN.json`, after preflight passes.

For each operation:
- Target the exact document `_id` from the plan.
- Modify only the exact `compatibleSpecies` array.
- Add only the exact planned entry object.
- Use add-if-absent semantics.
- Preserve existing entries; do not replace the entire array.
- Do not edit title, slug, scientific name, category, body, SEO, image, other relationship fields, or unrelated fields.
- Do not change confidence, conditions, caveat, evidence note, or target based on an unreviewed guess.
- Do not promote any `HOLD_EVIDENCE`, `HOLD_CONFLICT`, `REJECT_SEMANTIC_MAPPING`, or `NOT_APPLICABLE` row.
- Do not create, delete, publish, unpublish, or otherwise modify documents outside these allowed additions.
- Do not deploy or edit schema.

### Duplicate/conflict handling

Before applying each operation, re-read the target's current `compatibleSpecies`:
- If the exact entry is already present, record `SKIP_ALREADY_PRESENT` and do not write.
- If the same reference exists but conditions, confidence, or evidence note differ, record `HOLD_EXISTING_ENTRY_CONFLICT`; do not append a duplicate.
- If the target/reference no longer exists or has an invalid type, stop the batch; do not substitute a different record.
- Otherwise, add the exact planned entry.
- Never blindly retry an ambiguous write response. Read the target again first.

## 3. Controlled execution

1. Produce `DRY_RUN_BEFORE.json` with exact document IDs, relationship paths, reference targets, and planned entries. Do not include secrets.
2. Recheck all operations against live data immediately before mutation.
3. Apply in deterministic batches of at most five operations. After each batch, read back affected documents and verify each requested entry exists exactly once, no unrelated fields changed, existing entries remain, and no duplicate edge was introduced.
4. If verification fails, stop immediately. Do not continue or attempt speculative automatic rollback. Report exactly which operations were attempted, confirmed, skipped, or uncertain, and provide a safe recovery recommendation.
5. If a write response is ambiguous, read back before retrying.
6. Do not claim success until read-back verifies the write.

## 4. Post-apply verification

Run fresh read-only queries and compare with the preflight baseline:
- Total record count, draft count, and canonical identity hash remain unchanged.
- Duplicate IDs/slugs remain zero.
- All pre-existing relationship edges remain present.
- Every eligible operation is `APPLIED_AND_VERIFIED` or `SKIP_ALREADY_PRESENT`.
- No held/rejected/not-applicable operation was written.
- Only `compatibleSpecies` entries changed.
- Edge count equals baseline plus newly added unique entries. Expected 3,173 applies only if all 22 were new and verified; calculate actual counts.
- A second dry-run against the resulting dataset proposes zero additional operations for the same plan.
- No unintended production mutation occurred.

Use the repository's established identity-hash algorithm. Do not invent a different hash and call it comparable.

## 5. Tests and repository checks

Run relationship-plan/executor tests, lint, TypeScript typecheck, and full test suite. Run build only if appropriate; do not deploy.
- Do not fix unrelated failures unless proven caused by SPEC 12B and a narrow fix is required.
- Record the known `tests/compare.test.ts` failure accurately; do not call it a regression without evidence.
- Add tests for allowlist enforcement, add-if-absent, existing-entry conflicts, and refusal to write fields other than `compatibleSpecies`.
- Tests should not require production credentials; mock mutation behavior where possible.
- Never log tokens or secrets.

## 6. Required artifacts

Create `reports/SPEC_12B/` without overwriting SPEC 12A:
1. `SPEC_12B_EXECUTION_REPORT.md` — verdict (`COMPLETE`, `PARTIAL`, `BLOCKED`), verified project/dataset, preflight comparison, planned/applied/read-back-verified/skipped/held/uncertain counts, actual edge counts before/after, hashes, modified fields, test results, known failures, blockers, next step.
2. `PREFLIGHT.json`
3. `DRY_RUN_BEFORE.json`
4. `OPERATION_RESULTS.csv` — one row per plan operation, status and read-back result.
5. `POST_APPLY_VERIFICATION.json`
6. `INTEGRITY.json` — counts, drafts, identity hash, duplicate checks, relationship counts, exact mutation scope.
7. `CHECKSUMS.txt`
8. A concise recovery note if execution is partial or blocked.

Reports must be reproducible, deterministically sorted, and secret-free.

## 7. Verdict rules

- `COMPLETE`: preflight passed; every operation was applied and read-back verified or already present exactly; integrity is preserved; only allowlisted relationship entries changed; tests/reports completed.
- `PARTIAL`: some operations were safely applied and verified, but a later blocker stopped execution. State the exact committed subset.
- `BLOCKED`: a preflight gate failed before the first write, so no production mutation occurred.
- If a write may have committed but cannot be confirmed, report `PARTIAL` and mark it `UNCERTAIN`; never blindly retry.

## 8. Final response

Report verdict; applied/verified/skipped counts; edge count before/after; identity/integrity result; confirmation held records and unrelated fields were untouched; tests and known failures; artifact paths; readiness for the next phase. Do not claim the 22 edges are universally safe for every tank; preserve conditions and caveats.
