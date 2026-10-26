# SPEC 11A — Evidence-Gated Remainder Execution

**Project:** AquaMind / Blog AQUA Wiki Database  
**Purpose:** Continue SPEC 11 after the reported successful Wave 1 production write, without replaying Wave 1 or creating another audit-only loop.

## 1. Starting state and guardrails

Verify these operator-reported facts from the existing artifacts before any action:
- Canonical inventory: 473 records; species inventory: 218.
- Wave 1: 17 species reported COMPLETE; 364/364 writes succeeded and read-back matched.
- Identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- Artifacts: `reports/SPEC_11/one_shot/`.
- **Do not rerun `SPEC_11_one_shot_execute.js`.** It is not the remainder executor and has a drift guard.
- Known baseline test failure: `tests/compare.test.ts > compare config > covers all four database types` (previous full suite: 372 passed, 1 failed). Compare before/after and do not misattribute this existing failure.
- SPEC 10M schema additions are not yet deployed to Sanity Studio/site. Keep `sanity deploy` and GROQ/site rendering as a separate integration task.

If artifacts contradict the baseline, stop before production writes and report the exact contradiction. Do not silently reconcile or overwrite it.

## 2. Objective

Reconcile the 60-row Wave 1 remainder register, then assess the other 201 species in the 218-species inventory and execute eligible, evidence-backed updates in one bounded run. Do not assume the 60 rows represent 60 additional species; establish what they refer to from the CSVs. Do not claim all 201 species can be safely completed if evidence is missing.

## 3. Phase A — One-pass read-only reconciliation

Read:
- `SPEC_11_REMAINDER_REGISTER.csv`
- `COMPLETENESS_BEFORE.csv` and `COMPLETENESS_AFTER.csv`
- `MUTATION_LOG.csv`
- `POST_WRITE_VERIFICATION.csv`
- `FINAL_OPERATION_PLAN.csv`
- `INTEGRITY.json`
- `SPEC_11_ONE_SHOT_EXECUTION_REPORT.md`
- `CHECKSUMS.txt`

Create `reports/SPEC_11/spec_11a_remainder/SPEC_11A_RECONCILIATION.md` and `SCOPE_218_SPECIES.csv`.

For every remainder row, classify the actual blocker/status: insufficient evidence, conflicting value/semantic mapping, unavailable source, already correct/no-op, schema/field not writable, or verification/integrity issue. Create a coverage row for each of the 218 species with ID, slug, Wave 1 membership, current completeness, candidate gaps, priority/reason, and evidence status. Recompute inventory and identity/integrity using the project's canonical method, not a substitute. Quantify Wave 2/Wave 3 candidates, evidence-ready operations, blocked operations, and species with no actionable gaps.

No production writes in Phase A. Finish this phase in one bounded run; do not create another audit/review phase.

## 4. Phase B — Evidence-backed operation plan

Use the existing research register and source-verification records. Recommendations, search snippets, or model-generated statements alone are not evidence.

Each proposed operation must include document ID/slug, field path, current and proposed values, operation (`FILL`, `REPLACE`, `NOOP`, `HOLD`, `REJECT`), source URL/title, evidence excerpt or locator, confidence/caveat, rationale, safety-critical flag, and expected verification value.

Preserve distinctions between species-specific facts, genus-level inference, typical ranges, and universal claims. Preserve qualifications such as “may,” “often,” and “typically.” Do not convert ranges or qualified statements into absolutes.

A row is writable only if:
1. An available source directly supports the claim.
2. Species and field mapping are unambiguous.
3. The claim is qualified appropriately and not materially contradicted by stronger evidence.
4. The field exists in the deployed Sanity schema.
5. No protected identity, SEO, or relationship field is changed.
6. The current value/revision was freshly read and matches the planned precondition.
7. The operation is idempotent and has a read-back verification check.

For safety-critical husbandry claims (compatibility, adult size, temperature, pH, hardness, aggression, diet, minimum group size, tank size, etc.), require stronger evidence and explicit caveat review. If evidence is incomplete, conflicting, unavailable, or only generic, mark `HOLD_EVIDENCE` and do not write.

## 5. Phase C — One bounded production run

Once the scope and evidence plan are complete, execute all eligible remainder operations in one bounded run. Do not ask for approval at each ordinary `FILL` if it meets the established policy. Do not auto-approve uncertain replacements or safety-critical claims.

Before writing:
- Save a machine-readable baseline snapshot and operation plan.
- Verify inventory count and identity hash.
- Re-read each target document and check expected current value/revision.
- Exclude all Wave 1 operations and already-correct values.
- Use revision-conditional mutations (`ifRevisionID` or the project's established equivalent).
- Apply only allowlisted field paths and values.
- Use bounded transactions/batches and per-operation logging.
- Never write `title`, `slug`, `category`, SEO fields, references/relationships, or protected seals under this spec.

If a precondition fails, mark `HOLD_DRIFT`; never force the write. One record's failure must not silently broaden transaction scope.

## 6. Phase D — Read-back verification and report

Fetch affected records and verify every operation against its intended value. Recompute integrity using the canonical method and compare protected fields.

Create under `reports/SPEC_11/spec_11a_remainder/`:
- `PRE_WRITE_BASELINE.json`
- `SCOPE_218_SPECIES.csv`
- `EVIDENCE_OPERATION_PLAN.csv`
- `MUTATION_LOG.csv`
- `POST_WRITE_VERIFICATION.csv`
- `COMPLETENESS_BEFORE.csv`
- `COMPLETENESS_AFTER.csv`
- `REMAINDER_REGISTER.csv`
- `INTEGRITY.json`
- `CHECKSUMS.txt`
- `SPEC_11A_EXECUTION_REPORT.md`

The report must quantify all 218 species accounted for, Wave 1 species, remainder species assessed, eligible operations planned/attempted/successful/failed, verified updates, holds by reason, species with no actionable gaps, integrity checks, lint/type-check/focused tests/full tests/build, known baseline versus new failures, and remaining SPEC 11 work.

Use verdicts:
- `COMPLETE`: this bounded run completed all eligible writes and verification and accounted for all 218 species. If evidence-blocked items remain, explicitly state SPEC 11 overall is not globally complete.
- `PARTIAL_EVIDENCE_BLOCKED`: safe writes completed, but material evidence gaps remain.
- `BLOCKED_INTEGRITY`: inventory, identity, protected fields, or read-back integrity failed; stop writes.
- `BLOCKED_EXECUTION`: technical failure prevented safe completion.

Never label all of SPEC 11 complete merely because SPEC 11A finished.

## 7. Test policy

Run the actual project scripts for focused tests, lint, TypeScript, full test suite, and production build. Record commands and exit codes. Compare full-suite failures with the known baseline; disclose the `compare.test.ts` failure and do not attribute it to these writes without evidence.

## 8. Out of scope

- Do not rerun the Wave 1 one-shot executor or recreate its 364 operations.
- Do not create another general audit, PM queue, approval queue, or open-ended research phase.
- Do not fabricate evidence or fill fields just to improve completeness scores.
- Do not deploy SPEC 10M schema or change GROQ/site rendering in this mutation run; track that separately.
- Do not claim all 218 species are complete if evidence-blocked claims remain.

## 9. Execution instruction

Proceed autonomously through Phases A–D when repository, credentials, and source artifacts are available. If credentials or evidence are unavailable, do not pretend production writes occurred: finish the read-only reconciliation, state the exact blocker, and provide the artifacts produced. Stop only for integrity breach, protected-field ambiguity, missing credentials, or a proposed operation that violates the write gates.
