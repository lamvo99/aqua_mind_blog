# SPEC 11 Stage A — Species Husbandry Enrichment (Research & Mutation Plan)

**Spec:** SPEC 11 — Species Husbandry Enrichment
**Stage:** A (research + plan). Mode: READ-ONLY. `sanityWrites=0 mutationCalls=0`
**Scope:** Wave 1 = 17 P0 large-fish species in the frozen SPEC 09 priority order
**Status:** `SPEC 11 STAGE A - COMPLETE` — `READY FOR PM ENRICHMENT AUTHORIZATION`

## 1. Baseline freeze

- Canonical inventory: 473 records (species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43); drafts 0; duplicate slugs 0.
- Canonical identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda` — `canonical identity hash: MATCH`.
- Deterministic double-read across all 6 domains: identical.
- Protected seals captured (`_id`, `_rev`, `_updatedAt`, slug, title, category, SEO, relationship fields).

## 2. Inputs consumed (read-only)

- `report/SPEC_09/` — `SPEC_09_BASELINE_SNAPSHOT.json`, `SPEC_09_RECORD_GAP_MATRIX.csv` (473 rows), `SPEC_09_PRIORITY_QUEUE.csv`, `SPEC_09_RESEARCH_REQUIRED.csv` (201 rows).
- Wave 1 per-species research profiles (17 species) in the working temp directory.
- Regenerated SPEC 10 / SPEC 10M schema architecture and migration inventory (used only for schema-destination checks).

### Provenance note

The untracked `report/SPEC_11`, `reports/SPEC_11`, `report/SPEC_09`, `report/SPEC_10` and `report/SPEC_10M` trees were absent from the working copy at the start of this run (the SPEC 00–10 chains and this Stage A report were not version-controlled). The full upstream chain was therefore **regenerated deterministically** with the surviving `scripts/SPEC_09_*.js`, `scripts/SPEC_10_*.js`, `scripts/SPEC_10M_*.js` and `scripts/SPEC_11_*.js` before this report was written. Regeneration is verified: SPEC 09 audit gates reconcile (C-02…C-10), SPEC 10 `INTEGRITY.json` reports 20/20 COMPLETE, SPEC 10M Gate A PASS, and Stage A determinism gate G9b confirms research/plan regenerate byte-identical.

## 3. Research register

- `WAVE_1_QUEUE.csv`: 17 species.
- `RESEARCH_REGISTER.csv`: 441 claim rows across the 17 species (accepted 206, caveat 221, pending 14).
- `EVIDENCE_MAP.csv`: 441 rows; every proposed claim carries evidence metadata (source, tier, snippet, date checked).
- 12 claim rows have no exact SPEC 09 research topic link and are recorded as such.

## 4. Proposed mutation plan

- `PROPOSED_MUTATIONS.csv`: 424 mutations (fill 387, replace 36, noop 1); 36 flagged for PM.
- `CONFLICTS.csv`: 50 rows (36 value conflicts, 14 unresolved; 7 unresolved safety-relevant).
- `COMPLETENESS_BEFORE.csv` / `COMPLETENESS_AFTER_PLAN.csv`: 218 species each (SPEC 10 L0–L4 gates).
- Wave 1 projected effect: `l2SpaceBlock 0 -> 11`, open P0 `69 -> 7`.

## 5. Integrity and technical validation

- Destinations validated against the SPEC 10M schema: all proposed structured destinations exist (invalid destinations 0).
- No banned destinations; scope confined to Wave 1 species (off-queue mutations 0).
- Determinism: Stage A research + plan regenerate byte-identical.
- Build/test gates: lint PASS, typecheck PASS, focused SPEC 10M schema test 108/108 PASS, full suite only the known baseline failure (`tests/compare.test.ts`), production build PASS.
- Provenance/needle scan of artifacts: clean.

## 6. Verdict

`sanityWrites=0 mutationCalls=0` — no production write occurred in Stage A. This artifact set is the frozen research/planning baseline consumed by the revision and PM-review phases. `SPEC 11 STAGE A - COMPLETE`; `READY FOR PM ENRICHMENT AUTHORIZATION`.
