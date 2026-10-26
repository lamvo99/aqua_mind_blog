# SPEC 11 Stage A Revision 1 — Safe Mutation Plan Reconciliation Report

Spec: `phase/SPEC_11_STAGE_A_REVISION_1_PROMPT.md` · Date: 2026-10-09 · Mode: READ-ONLY against Sanity production.

**SPEC 11 STAGE A REVISION 1 - COMPLETE**

This revision reconciles the original Stage A research and proposed mutation plan after PM review identified low-confidence mutations and potential semantic-mapping risks. **No production mutation occurred: sanityWrites=0 mutationCalls=0.** Original Stage A artifacts are unchanged (verified against their frozen SHA-256 set in `report/SPEC_11/INTEGRITY.json`).

## 1. Files created (exact paths)

- `reports/SPEC_11/revision_1/REVISED_MUTATION_PLAN.csv`
- `reports/SPEC_11/revision_1/REVISED_CONFLICT_REGISTER.csv`
- `reports/SPEC_11/revision_1/SEMANTIC_MAPPING_AUDIT.csv`
- `reports/SPEC_11/revision_1/HELD_FOR_EVIDENCE.csv`
- `reports/SPEC_11/revision_1/SPEC_11_STAGE_A_REVISION_1_REPORT.md`
- `reports/SPEC_11/revision_1/REVISION_1_CHECKSUMS.txt`

Originals inspected (read-only): `report/SPEC_11/PROPOSED_MUTATIONS.csv`, `CONFLICTS.csv`, `RESEARCH_REGISTER.csv`, `EVIDENCE_MAP.csv`, `WAVE_1_QUEUE.csv`, `SPEC_11_HUSBANDRY_ENRICHMENT_REPORT.md`, `EXECUTION_LOG.md`, `INTEGRITY.json`, plus `scripts/SPEC_11_*.js` and Sanity `species.ts` / SPEC 10 mapping CSVs. Repository copies verified byte-identical to the frozen Stage A hashes: YES (11/11 artifacts).

## 2. Original versus revised counts by disposition

| Original stageBAction | n | Revised disposition | n |
| --- | ---: | --- | ---: |
| APPLY | 387 | ELIGIBLE_FOR_PM_REVIEW | 342 |
| FLAG_FOR_PM | 36 | HOLD_FOR_EVIDENCE | 45 |
| SKIP_NOOP | 1 | CONFLICT_CANDIDATE_APPROVE | 22 |
| | | CONFLICT_DEFERRED | 11 |
| | | CONFLICT_REJECTED | 3 |
| | | SKIP_NOOP | 1 |
| **total** | **424** | **total** | **424** |

Eligible split: 206 structured-field fills + 136 body-section fills = 342. Eligibility does not authorize a production write.

Machine-checkable totals (validator reconciles these against the CSVs):

- PLAN_TOTAL | 424
- ELIGIBLE_FOR_PM_REVIEW | 342
- HOLD_FOR_EVIDENCE | 45
- CONFLICT_CANDIDATE_APPROVE | 22
- CONFLICT_DEFERRED | 11
- CONFLICT_REJECTED | 3
- SKIP_NOOP | 1
- CONFLICT_TOTAL | 50
- CONFLICT_FINAL CANDIDATE_APPROVE | 22
- CONFLICT_FINAL DEFERRED | 11
- CONFLICT_FINAL REJECTED | 3
- CONFLICT_FINAL KEEP_HOLD | 14
- LOW_HELD | 26
- P0_HELD | 21
- P0_DEFERRED_FLAGGED | 3
- HELD_TYPE MUTATION_HOLD | 45
- HELD_TYPE CONFLICT_DEFERRED | 11
- HELD_TYPE UNRESOLVED_CLAIM | 14
- HELD_TOTAL | 70
- SEMANTIC_AUDIT_ROWS | 39

## 3. LOW-confidence rows held

- **26 LOW-confidence FILL rows moved to HOLD_FOR_EVIDENCE** (prompt §3A). None was auto-authorized.
- Black Arowana `tankSizeMinL` (MUT11-146 / CF11-015, the 27th LOW row) remains a flagged conflict: disposition CONFLICT_DEFERRED - kept for PM review, never eligible.
- Includes the 13 named P0 footprint/dimension rows (Koi, Arapaima, Black Arowana, Clown Knifefish, Longnose Gar, Silver Arowana, Asian Arowana: minTankLengthCm/minTankWidthCm as applicable) - all derived from volume/length reasoning, none with a defensible species-specific published footprint.

## 4. P0 rows held

- **21 P0 rows on HOLD_FOR_EVIDENCE**: the 13 named LOW footprint rows + 8 additional dimension rows held under the §3A basis rule (MUT11-028, 029, 054, 055, 081, 082, 209, 354).
- Plus 3 P0 conflict rows held as CONFLICT_DEFERRED (CF11-004, CF11-015, CF11-020 - tank-volume conflicts, incl. the Black Arowana row kept flagged per §3A) -> **24 P0 rows are not eligible**.

## 5. Semantic mapping problems found and fixed in the plan

| Problem class | Rows | Disposition |
| --- | ---: | --- |
| flowPreference closest-enum forcing (slow/gentle/good-circulation -> STILL/MODERATE without schema support, §3C) | 7 | HOLD_FOR_EVIDENCE (MUT11-006, 086, 112, 160, 262, 311, 409) |
| oxygenSensitivity conflation (retailer-inference, single-source tension, family-level air-breathing source) | 3 | HOLD_FOR_EVIDENCE (MUT11-060, 087, 214) |
| groupSize CONDITIONAL applicability unresolved (single vs group-of-3) | 1 | HOLD_FOR_EVIDENCE (MUT11-166) |
| temperament replacements restated from demeanour (predator -> Peaceful) | 3 | CONFLICT_REJECTED (CF11-011, 032, 036) |
| temperament downgrade with single direct label | 1 | CONFLICT_DEFERRED (CF11-024) |
| diet label vs feeding behaviour nuance | 1 | CONFLICT_DEFERRED (CF11-022) |
| register topic mislink (flowPreference claims registered under oxygenation topic) | 2 | RECORDED_FOR_STAGE_B_FIX (RS11-060, RS11-087) |

Verified clean (no change needed): behaviorFlags values all inside the 9-item schema vocabulary; groupSize JSON parses with schema rules (null max allowed); salinity rows only on marine/brackish records; `LOW_SENSITIVITY`->NEUTRAL tautology mappings that rest on species-specific sources; oxygen NEUTRAL rows all carry explicit surface-access caveats for content (§5). Every mapping was re-checked against `sanity/schemaTypes/species.ts` options lists and SPEC 10 `FIELD_TO_KNOWLEDGE_MAPPING.csv` (temperament = EXTEND_SEMANTICS; flowPreference/oxygenSensitivity are schema-only SPEC 10M fields with no separate SPEC 10 mapping row). Full per-row detail: `SEMANTIC_MAPPING_AUDIT.csv` (39 rows).

## 6. Conflict dispositions (all 50 records)

Prompt proposal was 23 approve / 10 defer / 3 reject. After evidence re-verification (prompt §4: use PM review as proposal, not evidence):

- **CANDIDATE_APPROVE: 22** - CF11-001, CF11-002, CF11-003, CF11-006, CF11-009, CF11-012, CF11-013, CF11-016, CF11-017, CF11-018, CF11-019, CF11-021, CF11-023, CF11-025, CF11-026, CF11-027, CF11-028, CF11-030, CF11-031, CF11-033, CF11-034, CF11-035
- **DEFERRED: 11** - CF11-004, CF11-005, CF11-007, CF11-008, CF11-010, CF11-014, CF11-015, CF11-020, CF11-022, CF11-024, CF11-029 (includes CF11-020, downgraded from the proposed approval candidate: single community-edited source for the exact 3,000 L figure - §4 requires inadequately supported candidates to stay deferred)
- **REJECTED: 3** - CF11-011, CF11-032, CF11-036 (temperament replacements; rationale recorded, existing values retained, none reintroduced)
- **KEEP_HOLD: 14** - CF11-037 through CF11-050 (unresolved research; holds retained, no unresolved claim converted to an eligible value)

All 50 rows carry disposition, rationale, evidence sufficiency, remaining uncertainty and required next action in `REVISED_CONFLICT_REGISTER.csv`. These are review dispositions, not production-write authorization.

## 7. Safety-critical gaps remaining

- Unresolved safety-critical research (unchanged, all retained): 7 rows - CF11-039 /oxygenSensitivity; CF11-042 /oxygenSensitivity; CF11-043 /tankSizeMinL; CF11-047 /flowPreference; CF11-048 /oxygenSensitivity; CF11-049 /oxygenSensitivity; CF11-050 /bioload.
- Tolerance-vs-recommendation presentations are mandatory for approved candidates (e.g. koi 4 C survival floor vs 15-18 C comfort band; clown knifefish pH 8 ceiling vs 6.5-7.5 working range; arapaima 29 C ceiling vs 26-28 C culture range) - carried in each conflict nextAction.
- Oxygen NEUTRAL candidates must be published with explicit surface-access/aeration wording; no species is declared complete while safety-critical research remains unresolved (completeness output from Stage A is unchanged by this read-only revision).

## 8. Test and integrity results

| Check | Result |
| --- | --- |
| Lint (eslint) | exit 0 |
| TypeScript (tsc --noEmit) | exit 0 |
| Focused SPEC 10M schema tests | 108 passed (108) (exit 0) |
| Full test suite (npm test) | 1 failed | 372 passed (373) (exit 1); failing file: tests/compare.test.ts - known baseline failure, reported separately, NOT counted as a pass |
| Production build | exit 0 |
| Original Stage A artifacts unchanged | PASS (SHA-256 matches frozen set) |
| Inventory baseline | total=473 {"species":218,"plant":62,"invertebrate":56,"coral":48,"equipment":46,"problem":43} |
| Canonical identity hash | MATCH against SPEC 10M baseline (c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda) |
| Independent revision validator | run `node scripts/SPEC_11_revision1_validate.js` (scope, counts, enums, conflicts, determinism, needle/token scan) |
| Determinism | see REVISION_1_CHECKSUMS.txt (two in-process generations + validator cross-process regeneration must be byte-identical) |

## 9. Known limitations

- Stage A remains Wave 1 only (17 P0 species); eligibility decisions say nothing about the remaining 201 species.
- Evidence sufficiency judgments for conflicts are review-time assessments against the existing register (no new fetching was performed in this revision); deferred candidates may need new sources, not only PM time.
- The dimension-hold decisions are deliberately conservative: several held rows may release quickly if a source states the footprint directly.
- Register topic mislinks (RS11-060, RS11-087) are recorded but the original register was not edited (originals unchanged).

## 10. Decisions requiring PM approval before any production mutation

1. 342 ELIGIBLE_FOR_PM_REVIEW fills (206 structured fields + 136 body sections) - batch row-level sign-off requested.
2. 22 replacement candidates (CF11-001, CF11-002, CF11-003, CF11-006, CF11-009, CF11-012, CF11-013, CF11-016, CF11-017, CF11-018, CF11-019, CF11-021, CF11-023, CF11-025, CF11-026, CF11-027, CF11-028, CF11-030, CF11-031, CF11-033, CF11-034, CF11-035) - exact-value sign-off with presentation caveats.
3. 11 deferred conflicts (CF11-004, CF11-005, CF11-007, CF11-008, CF11-010, CF11-014, CF11-015, CF11-020, CF11-022, CF11-024, CF11-029) - decide promote vs keep-deferred per nextAction.
4. 3 rejected replacements (CF11-011, CF11-032, CF11-036) - confirm rejection (existing values retained).
5. 45 held fills + 14 unresolved claims - research roadmap only; not writable.

## Stop condition

Stage B was not executed. Nothing was created, updated, deleted, published or unpublished in Sanity; schemas and website code were not deployed. Stopping at the revised-plan review gate.

sanityWrites=0 mutationCalls=0
