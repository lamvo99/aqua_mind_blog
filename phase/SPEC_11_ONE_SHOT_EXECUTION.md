# SPEC 11 — ONE-SHOT SPECIES HUSBANDRY ENRICHMENT & PRODUCTION VERIFICATION

**Project:** AquaMind Wiki Database V1.1  
**Execution mode:** IMPLEMENTATION-FIRST, EVIDENCE-GATED, BATCHED PRODUCTION WRITE  
**Status:** Ready for OpenCode implementation  
**Baseline:** SPEC 10 / SPEC 10M architecture; canonical inventory 473 records  
**Target domain:** `species` — all 218 canonical species records  
**Priority:** Wave 1 first (17 P0 large-fish species), then Waves 2–3 in the same execution where evidence and scope permit  
**Critical rule:** Do not stop after another audit, review package, or proposed mutation plan. The run must apply every eligible mutation and verify it. Unsupported rows remain explicit exceptions, not fake completions.

---

## 0. Mission and definition of done

Execute SPEC 11 as one controlled run from current-state preflight through research reconciliation, plan generation, production writes, post-write verification, and completion reporting.

The objective is to make species records materially more useful for real husbandry decisions—not merely to fill fields. Use structured fields for filtering/comparison/validation and species-specific knowledge body sections for explanation, practical guidance, and risk context.

A successful run must:
1. Enrich eligible, evidence-supported structured fields and body sections in Sanity production.
2. Preserve all unrelated data and the canonical identity of the 473-record Wiki.
3. Leave unsupported or ambiguous values unchanged/null and record exact reasons.
4. Verify each successful write by re-reading the affected record.
5. Produce a reconciled report that says exactly what changed and what remains incomplete.
6. Avoid creating more internal phases. This spec is the master execution contract.

**Do not claim “SPEC 11 COMPLETE” merely because the scripts pass.** Completion means all 218 species have been evaluated against the agreed SPEC 10 requirements, all safe eligible work has been applied, and remaining gaps are explicitly dispositioned. A species with unresolved P0 safety gaps must not be labeled decision-ready.

## 1. Authorization and write boundary

The user has requested an implementation spec intended to end the read-only loop. When the user invokes/runs this spec as the production execution instruction, treat that invocation as authorization to write only the exact, validated husbandry paths allowed below. Do not require a separate human approval for every row.

This authorization does **not** authorize:
- title, slug, category, SEO, image, publication status, or other editorial metadata changes;
- relationship graph mutations or changes to `compatibleSpecies`, `incompatibleSpecies`, `predatorPrey`, `reefInteraction`, `coralNeighbors`, `compatibleEquipment`, or `relatedProblems`;
- edits to plant, invertebrate, coral, equipment, or problem documents;
- schema deployment unless the invocation explicitly includes schema deployment authorization;
- unsupported claims, guessed values, or blind overwrites.

If the execution environment has not received a clear production-execution invocation, remain in dry-run and say exactly which user action is required. Do not pretend writes occurred.

### Allowed mutation classes

A. `species` structured husbandry fields that exist in the deployed schema and are included in the SPEC 10 architecture, such as evidence-supported size, tank volume/footprint, swimming space, water parameters, flow/oxygen, diet/feeding, activity/group size, temperament/risk enums, jump/lid requirements, habitat, and maintenance burden.

B. Species knowledge body sections following SPEC 10's architecture, including Overview, Adult Size & Growth, Tank Requirements, Water Parameters, Behavior & Compatibility, Feeding, Habitat & Aquascape, Maintenance & Care, Breeding/Reproduction where applicable, Common Problems/Risks, Experience Guidance, and Practical Decision Notes.

C. Evidence/provenance metadata only where the schema already supports it and it does not alter identity or unrelated relationships.

Do not write a field that is absent from the live schema. If SPEC 10M fields are not available in the deployed Sanity schema, record a schema blocker and continue using existing supported body/field destinations. Do not deploy schema without explicit authorization.

## 2. Canonical baseline and invariants

Before any write:
1. Read all 473 canonical Wiki records from Sanity production, with two deterministic reads.
2. Verify counts: species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43; drafts 0; duplicate slugs 0.
3. Verify canonical identity hash equals `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
4. Capture `_id`, `_rev`, `_updatedAt`, slug, title, category/type, SEO fields, relationship fields, and every allowed target field for concurrency and regression checks.
5. Record the currently deployed schema field inventory and compare it with SPEC 10M.
6. Verify source artifact checksums before consuming them. Never silently substitute a file or regenerate a frozen input.

If baseline count or identity hash fails, stop all writes and report the exact mismatch.

## 3. Inputs to reuse—do not recreate prior work unnecessarily

Use existing artifacts as inputs, not as a reason to stop:
- `SPEC_09_BASELINE_SNAPSHOT.json`, `SPEC_09_RECORD_GAP_MATRIX.csv`, `SPEC_09_PRIORITY_QUEUE.csv`, `SPEC_09_RESEARCH_REQUIRED.csv`
- `KNOWLEDGE_ARCHITECTURE_MATRIX.csv`, `APPLICABILITY_MATRIX.csv`, `COMPLETENESS_LEVELS.md`
- `SPEC_10M_SCHEMA_MIGRATION_REPORT.md`, schema diff/inventory and tests
- `SPEC_11_HUSBANDRY_ENRICHMENT_REPORT.md`, `BASELINE.json`, `WAVE_1_QUEUE.csv`, `RESEARCH_REGISTER.csv`, `EVIDENCE_MAP.csv`, `PROPOSED_MUTATIONS.csv`, `CONFLICTS.csv`
- `REVISED_MUTATION_PLAN.csv`, `REVISED_CONFLICT_REGISTER.csv`, `SEMANTIC_MAPPING_AUDIT.csv`, `HELD_FOR_EVIDENCE.csv`, `REVISION_VALIDATION.json`
- Phase 01 `FILL_DECISION_RECOMMENDATIONS.csv`, `REPLACEMENT_DECISION_RECOMMENDATIONS.csv`, `UNRESOLVED_RESEARCH_PLAN.csv`
- Phase 02 `SOURCE_VERIFICATION.csv`, `EVIDENCE_GAPS.csv`, `SOURCE_CONFLICTS.md`
- Phase 03 `PM_DECISION_QUEUE.csv`, `P0_SAFETY_REVIEW.md`, `UNRESOLVED_DECISION_REGISTER.csv`
- `SPEC_11_PHASE_04_P0_PM_RECOMMENDATIONS.csv` may be consulted as a preliminary recommendation only. It is not an approval file and must never override source evidence or the rules in this spec.

Re-use and verify the evidence already collected. Re-fetch a source only when necessary to resolve a material question or when its cached evidence is stale/unavailable. Do not spend the entire run repeating audits that already passed.

## 4. Scope reconciliation: 17 researched vs 218 canonical species

The current detailed research package covers only 17 Wave 1 species. The canonical domain contains 218 species. The executor must not confuse “337 queue rows” with “all 218 species.”

In the same execution:
1. Process the existing Wave 1 queue first, preserving all Revision 1 safety fixes.
2. Build a deterministic scope ledger for all 218 species against SPEC 09 gaps and SPEC 10 applicability.
3. For Waves 2–3, apply the same bounded evidence rules using existing verified data first. Research only the high-impact claims needed to make practical progress; do not fabricate field values or write generic copy.
4. If a full-depth profile cannot be supported for a record in this run, do not pad it. Record the exact missing requirement and reason in `SPEC_11_REMAINDER_REGISTER.csv`.
5. Do not claim the whole SPEC 11 scope complete if unresolved requirements remain. Report `PARTIAL_COMPLETE` with exact remainder, and recommend at most one or two narrowly scoped follow-up specs only if necessary.

Wave priority:
- **Wave 1:** the 17 P0 large-fish species in the frozen SPEC 09 priority order.
- **Wave 2:** P1 high-impact species (common beginner fish with major husbandry consequences, active swimmers, territorial/predatory species, jumpers, schooling/group species, marine fish with significant reef interaction).
- **Wave 3:** remaining species, prioritized by safety, user impact, severity of missing knowledge, evidence availability, and practical utility.

Do not include the Digital Heater equipment record in SPEC 11.

## 5. Decision policy: replace row-by-row PM review with explicit deterministic rules

For every proposed field/body change, assign one final action:

- `APPLY`: exact claim is supported by suitable evidence, maps correctly to the schema, and does not conflict with a stronger source.
- `APPLY_WITH_CAVEAT`: evidence supports a bounded/qualified statement; use neutral wording and include the caveat in body/provenance.
- `HOLD_EVIDENCE`: claim not located, source unavailable, species identity mismatch, or evidence is insufficient for a material field.
- `HOLD_CONFLICT`: sources materially disagree, or current value may be correct and replacement is not established.
- `SKIP_ALREADY_CORRECT`: destination already contains the same meaning/value.
- `SKIP_NOT_APPLICABLE`: requirement is genuinely not applicable and the reason is recorded.
- `REJECT_SEMANTIC_MAPPING`: proposed enum/value changes the meaning or forces an unsupported nearest enum.

No blank field is an approval. The executor must generate these final actions from the rules, not from the preliminary `RECOMMEND_APPROVE` label alone.

### Evidence bar

- Prefer primary scientific/institutional, species-specific specialist, or reputable specialist sources appropriate to the claim.
- General content, community-edited sources, retailer pages, and unsourced snippets cannot alone justify high-risk tank dimensions, oxygen/flow enum, jump/lid risk, compatibility/predation, or other safety-critical values.
- For P0 safety claims, require direct species-specific support or two independent credible corroborating sources. If unavailable, hold the exact field and write a useful conservative caveat only when it is itself defensible.
- Never convert “large/active” automatically to a precise enum; never infer tank footprint solely from volume/adult length; never confuse tolerance boundaries with recommended operating ranges; never equate predator/prey risk with temperament; never force uncertain flow/oxygen semantics into an enum.
- LOW-confidence claims remain held unless stronger evidence is found.
- Conflicts with current values are replaced only when evidence establishes that the current value is materially wrong and the new value is defensible. Otherwise preserve current value and log the conflict.
- Existing Phase 01 holds, deferred conflicts, rejected conflicts, and unresolved claims are not automatically promoted. They can be reconsidered only when new evidence is actually obtained and documented.

## 6. Body enrichment requirements

For each species, write only applicable sections with real informational value. Do not copy a generic template unchanged across species.

At minimum, where supported:
- identity and typical adult size (distinguish typical size from exceptional wild maximum);
- growth/lifespan and adult behavior;
- tank volume **and footprint/swimming space** where the species needs them;
- water parameter ranges with clear distinction between tolerance and recommended operating range;
- flow/oxygen/habitat needs when evidence supports them;
- diet, feeding strategy, adult prey risk and feeding frequency context;
- temperament, conspecific/group requirements, tankmate risk and predation context;
- jump/escape/lid risk;
- maintenance burden and practical monitoring;
- experience level and decision guidance;
- limitations/uncertainty when the evidence is incomplete.

No fake first-hand experience, invented tests, invented citations, or filler. Preserve the reader's ability to distinguish measured facts, published guidance, and conservative interpretation.

## 7. Write execution: one controlled production pass

After baseline and plan validation, do not stop for another PM review package. Generate the final allowlist and execute the eligible operations in the same run.

### Before each document write
- Re-read the current `_rev` and target values.
- Compare against the frozen pre-write snapshot.
- If revision/value drift is detected, re-evaluate that document; do not overwrite blindly.
- Build a minimal patch that changes only allowlisted paths.
- Use conditional revision writes / optimistic concurrency.
- Keep a journal before and after each operation for recovery.

### Batch behavior
- Apply bounded batches; record every operation ID and outcome.
- Idempotent retry is allowed only after re-reading the target and confirming whether the previous write succeeded.
- Never use whole-document replacement.
- A partial failure must not trigger blind replay of the entire batch.
- Continue independent documents after an isolated failure, while recording the failed document and reason.
- Stop the entire run if identity, title/slug/category, SEO, or unrelated relationships drift unexpectedly.

### Scope lock
Only target `species` records and only the allowed husbandry field/body paths. No off-domain records. No changes to SEO/title/slug/category, images, publication metadata, or relationships.

## 8. Post-write verification and rollback safety

Immediately re-read every changed document and verify:
- every `APPLY` operation equals the intended value;
- every `APPLY_WITH_CAVEAT` body claim includes the planned qualification;
- no unapproved path changed;
- `_rev`/`_updatedAt` changed only on records actually patched;
- title, slug, category, SEO and relationship snapshots remain unchanged;
- record counts and canonical identity hash still match;
- no malformed enum, unit, number, range, reference, or body structure exists;
- no duplicate or contradictory sources of truth were introduced.

If a write outcome is uncertain, re-read before retrying. If a critical unintended change occurs, stop writes, capture state, and execute only a verified compensating patch for the affected allowlisted path; never replace the whole document with an old snapshot.

## 9. Tests and technical validation

- Run focused schema/species enrichment tests and the relevant project tests.
- Run lint, TypeScript, and build if applicable.
- Known baseline: the full suite previously had 372 passing / 1 failing in `tests/compare.test.ts > compare config > covers all four database types`. Re-run it and classify as pre-existing only if the same failure persists unchanged. Do not hide it or claim 100% pass.
- If new failures appear, fix them within SPEC 11 only when caused by this work; otherwise document a concrete blocker and proceed with independent safe writes.

## 10. Required deliverables

Create one execution directory, e.g. `reports/SPEC_11/one_shot/`, with:

1. `SPEC_11_ONE_SHOT_EXECUTION_REPORT.md` — actual final outcome, not a plan-only report.
2. `PRE_WRITE_BASELINE.json` — counts, identity hash, revisions, protected-field seals.
3. `FINAL_OPERATION_PLAN.csv` — every candidate with exact action, target, old/new value, source, confidence, rationale, and reason if not applied.
4. `MUTATION_LOG.csv` — each attempted write, operation ID, timestamp, outcome, error, and recovery state.
5. `POST_WRITE_VERIFICATION.csv` — per-operation expected vs actual result.
6. `SPEC_11_REMAINDER_REGISTER.csv` — every unresolved requirement by species, priority, safety impact, evidence needed, and reason.
7. `COMPLETENESS_BEFORE.csv` and `COMPLETENESS_AFTER.csv` — measured by SPEC 10 L0–L4 gates, not a subjective score.
8. `INTEGRITY.json` — counts/hash/seals/test results and exact write totals.
9. `CHECKSUMS.txt` — hashes for all final artifacts.

Mirror final report and machine-readable artifacts under `reports/SPEC_11/` only if the repository's established artifact convention requires it; do not create multiple competing copies.

## 11. Final report must answer these questions

- How many of the 218 species were evaluated?
- How many species had one or more actual successful writes?
- How many structured-field operations and body-section operations succeeded?
- How many candidates were skipped as already correct?
- How many were held for evidence, conflict, schema absence, or semantic mismatch?
- How many P0 safety gaps remain, by species and field?
- Did the 473-record count and canonical identity hash remain unchanged?
- Did any protected field or off-scope document change?
- What is the exact test result, including the known baseline failure?
- Is the verdict `COMPLETE`, `PARTIAL_COMPLETE`, or `BLOCKED`, and why?

Do not report a proposed mutation as a successful write. Count only operations verified by post-write reads.

## 12. Acceptance gates

The run passes only if:
- canonical inventory remains 473 with expected per-type counts;
- canonical identity hash matches the baseline;
- zero off-scope documents were written;
- zero protected fields changed;
- every successful write is present in `MUTATION_LOG.csv` and verified in `POST_WRITE_VERIFICATION.csv`;
- every non-applied candidate has an explicit disposition;
- all P0 safety gaps are either resolved with evidence or explicitly remain open and prevent false completeness claims;
- report counts reconcile exactly with CSVs and logs;
- there is no plan-only outcome presented as implementation.

### Verdicts
- `COMPLETE`: all 218 species meet the SPEC 11 completion gates, including no unresolved P0 safety gaps.
- `PARTIAL_COMPLETE`: all safe eligible work has been applied and verified, but one or more species/requirements remain held with exact reasons. This is an acceptable honest result; it is not a claim of full completion.
- `BLOCKED`: baseline/integrity/write authorization/schema blocker prevents safe implementation.

## 13. Stop conditions

Stop all writes if:
- baseline identity/count checks fail;
- authorization is absent;
- write scope cannot be constrained to allowed paths;
- a patch would touch title/slug/category/SEO/relationships or another document type;
- source evidence is fabricated, unverifiable, or mismatched;
- a semantic enum mapping cannot preserve meaning;
- identity or protected-field seals drift unexpectedly.

Do **not** stop merely because some individual values lack evidence. Hold those values and continue safe, independent work.

## 14. No-phase-creep rule

This master spec replaces the previous “prepare → PM review package → another review → another audit” loop for SPEC 11. Do not create Phase 05, 06, 07, or 08 just to repeat these steps.

If this execution leaves material work, propose at most:
- **SPEC 11A — Evidence Blocker Resolution**, only for a bounded list of high-impact unresolved claims that cannot be resolved with the available sources/tools; and/or
- **SPEC 11B — Final Remainder Closure**, only for an explicit, finite list of remaining species/requirements not covered in this run.

Each follow-up must state exact record/field counts, acceptance criteria, and a stop condition. No open-ended “audit again” spec is allowed.

## 15. Final instruction to OpenCode

Read this spec and the existing frozen artifacts, validate the baseline once, reuse all valid prior research, and then **implement and write the safe eligible enrichment in this run**. Do not stop after writing a report, plan, queue, or allowlist. Use conditional writes, keep all unrelated data untouched, re-read every changed record, and deliver the actual final report with exact verified write counts. If production authorization is not present in the invocation, do a dry-run only and explicitly say that the only remaining blocker is authorization—not another audit.
