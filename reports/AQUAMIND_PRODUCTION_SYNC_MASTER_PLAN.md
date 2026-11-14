# AquaMind — Production Database Synchronization Master Plan

> **Post-implementation update (2026-11-15):** This master plan is the pre-implementation baseline. The Core Database schema was deployed in release `dc54e2e`, and 1,171 safely supported fields were written and verified in Production. Current state: `reports/production-migration/AQUAMIND_ONE_SHOT_IMPLEMENTATION_FINAL.md`. The `BLOCKED_BY_CONFLICTS` sections below are preserved as historical planning evidence.

**Final status:** `BLOCKED_BY_CONFLICTS`  
**Mode:** read-only consolidation and planning  
**Date:** 2026-11-14  
**Production project / dataset:** `zeohjejw` / `production`  
**Production snapshot:** 2026-11-14T12:34:27.737Z  
**Registry:** `reports/AQUAMIND_PRODUCTION_SYNC_REGISTRY.csv`  
**Batches:** `reports/AQUAMIND_PRODUCTION_SYNC_BATCHES.json`  
**Blockers:** `reports/AQUAMIND_PRODUCTION_SYNC_BLOCKERS.md`

> This plan consolidates existing SPEC23–SPEC29 evidence, claim adjudications, approvals and remediation proposals. It does not create a new SPEC series, repeat an audit, or write to Production.

---

## 1. Executive summary

| Measure | Result |
|---|---:|
| Current Production documents | **473** |
| Unique documents with at least one proposal | **422** |
| Unique proposed field changes | **1,621** |
| `APPROVED` decisions | **40** |
| — applied and verified | **35** |
| — resolved no-write | **5** |
| — approved and still pending write | **0** |
| `NEEDS_SOURCE` field changes | **1,199** |
| `NEEDS_SPECIALIST` field changes | **81** |
| `CONFLICT` field changes | **298** |
| `DEFERRED` field changes | **3** |
| Exact additional Production writes available now | **0** |

**Decision:** `BLOCKED_BY_CONFLICTS`.

No batch contains an approved field change that is still waiting to be written. The 35 applied fields — 12 Batch A and 23 Phase 8 — already match Production and were verified after their controlled writes. Five additional `waterType` decisions are `RESOLVED_NO_WRITE`; their live enum values are retained.

The only unresolved conflicts are five identity design decisions recorded as `UNRESOLVED_NO_WRITE`. They are not pending Production writes. The final status is `BLOCKED_BY_CONFLICTS` solely because those five design decisions remain open.

The first batch that needs **no new specialist review** is **Batch 1 — Plant/Coral SEO**, because the SEO schema is already live and SEO metadata is low-risk. However, Production stores **0 Plant SEO objects** and **0 Coral SEO objects**, and no SPEC23–SPEC29 artifact approves any Plant or Coral SEO document value. Batch 1 therefore has **0 field changes and 0 writes** and cannot synchronize metadata until editors author and explicitly approve values.

---

## 2. Source inventory and preservation

Original reports were read only. No existing report, decision, register or patch was modified.

| SPEC | Artifact | Status | Use in this plan |
|---|---|---|---|
| SPEC23 | `SPEC_23_FINAL_HANDOFF.md`, `SPEC_23_PROBLEM_TAXONOMY_AUDIT.md`, `SPEC_23_TRIAGE_CONTENT_AUDIT.md`, `SPEC_23_XENIA_EVIDENCE_DOSSIER.md`, `SPEC_23_DEFERRED_ITEMS.md` | Present | High-risk scope, taxonomy and deferred boundaries |
| SPEC24 | `SPEC_24_XENIA_PILOT_REVIEW.md`, `SPEC_24_TRIAGE_PILOT_REVIEW.md`, `SPEC_24_PROBLEM_TAXONOMY_MAPPING.md`, `SPEC_24_DIFFICULTY_CONTEXT_REVIEW.md`, `SPEC_24_PRODUCTION_APPROVAL_CHECKLIST.md`, `SPEC_24_DEFERRED_ITEMS.md` | Present | Care claims, triage drafts, category mapping, approval checklist |
| SPEC24.1 | `SPEC_24_1_CLAIM_SUPPORT_MATRIX.md`, `SPEC_24_1_EVIDENCE_SOURCE_AUDIT.md` | Present | Claim/source support boundaries |
| SPEC24.2 | `SPEC_24_2_HANDOFF.md`, `SPEC_24_2_EDITORIAL_SIGNOFF_GATE.md`, `SPEC_24_2_XENIA_CLAIM_REVIEW.md`, `SPEC_24_2_PROBLEM_TRIAGE_REVIEW.md`, `SPEC_24_2_DIFFICULTY_CONTEXT_REVIEW.md`, `SPEC_24_2_EVIDENCE_BACKLOG.md` | Present | Editorial gate `BLOCKED_PENDING_REVIEWER`; Production `BLOCKED` |
| SPEC25 | `SPEC_25_HANDOFF.md` | Present | Publish closure gate; no content approval |
| SPEC27 | `SPEC_27_HANDOFF.md`, `SPEC27_EDITORIAL_DECISIONS_PATCH/applied-editorial-patch.json` | Present | Local-only editorial patch; `dataMutationAuthorized=false` |
| SPEC28 | `core-completion/proposed-sanity-patches.json`, `master-completion-register.csv`, `source-evidence-linkage.csv`, `validation.json`, `project-closure-assessment.md`, `record-changes.json`, `record-dispositions.csv`, `schema-gap-decisions.md`, `lib/content/spec28-overlay.json` | Present | 328 core patches / 1,098 fields; 178 overlay entries / 503 fields |
| SPEC29 | `spec29-overall-status.md`, `SPEC29_Batch_A_Final_Editorial_Approval.md`, `spec29-batch-a-proposed-patch.json`, `spec29-batch-a-write-report.md`, `spec29-batch-b-validation.json`, `spec29-phase8-production-impact-assessment.csv`, `spec29-phase8-production-write-report.md`, `spec29-master-adjudication-register.csv`, `spec29-aquamind-editorial-decision-application-report.md`, `spec29-remaining-editorial-mapping-resolution.csv`, `specialist-review/APPROVAL_GATE.md`, `specialist-review/claim-decision-intake.csv` | Present | 35 applied fields; 54 editorial decisions; 44 specialist claims pending |

### Artifacts explicitly marked missing

| Missing artifact | Consequence |
|---|---|
| Explicit SPEC28 Production-write approval | All SPEC28 core proposals (1,098 patch fields → 1,199 registry rows after the SEO split) remain `NEEDS_SOURCE` or `CONFLICT`; none may execute. |
| Plant/Coral SEO document-value approval | Batch 1 has no approved values and 0 writes. |
| Standalone signed Batch B approval instrument | Batch B is evidenced by the Phase 8 write report and overall status, not by a separate signed approval file. Its 23 fields remain `APPROVED` because the controlled write is documented and verified. |
| Batch C approval | Batch C was prepared, never approved. Its claims are absorbed into the specialist/editorial register. |
| Named specialist reviewer records | 44 specialist claims remain `PENDING` / `NOT_APPROVED`; reviewer identity is `NOT_SUPPLIED`. |
| Equipment correction approval | 8 null corrections remain `NEEDS_SOURCE`; 1 sentinel remains `DEFERRED`. |
| Problem-category normalization approval | 17 category changes remain `NEEDS_SOURCE`. |
| Named editorial reviewer for SPEC24/24.2 | Editorial gate remains `BLOCKED_PENDING_REVIEWER`. |

---

## 3. Current Production reconciliation

The snapshot was read with read-only credentials. No token, key or secret is reproduced in this report or its artifacts.

| Domain | Documents |
|---|---:|
| Species | 218 |
| Plants | 62 |
| Corals | 48 |
| Invertebrates | 56 |
| Equipment | 46 |
| Problems | 43 |
| **Total** | **473** |

This reconciles exactly to the historical baseline of approximately 473 documents. No domain count changed.

### 3.1 Drift checks

| Check | Result |
|---|---|
| SPEC28 core document `_rev` vs recorded `baseRev` | **328 / 328 match** |
| SPEC28 overlay field values vs recorded `before` values | **503 / 503 match** |
| SPEC29 Phase 8 applied fields vs current Production | **23 / 23 match** (including 2 documented wording overrides) |
| SPEC29 Batch A applied fields vs current Production | **12 / 12 match** |
| Unexplained Production drift since a proposal | **0** (1,456 checked `NO`; 165 rows have no recorded base revision) |
| Documents with no proposal at all | **51** (42 Equipment, 9 Problems) |

No checked proposal is stale; no recorded base value differs from current Production. No newer Production value would be overwritten.

---

## 4. Registry construction

### 4.1 Normalization

Every proposed field change is recorded with:

`change_id`, `document_id`, `document_type`, `slug`, `field_path`, `field_label`, `current_production_value`, `proposed_value`, `source_spec`, `source_artifact`, `evidence_reference`, `approval_status`, `approval_reference`, `risk_level`, `conflict_status`, `reason`, `batch`, `pending_write`, `execution_state`, `production_drift`, `production_rev`.

Object and Portable Text values are rendered as readable text or compact JSON. Values longer than 8,000 characters are marked `…[truncated]`; the referenced source artifact remains authoritative for the full payload.

### 4.2 Deduplication

Proposals were deduplicated by **document ID + field path**. Precedence:

1. SPEC29 Batch A (explicit approval, applied)
2. SPEC29 Phase 8 / Batch B (approved, applied)
3. SPEC29 remaining editorial decisions (defer / resolved no-write / unresolved design)
4. SPEC29 specialist claims
5. Equipment placeholder corrections
6. Problem category normalization
7. SPEC28 core completion
8. SPEC27 local editorial patch
9. SPEC24 local care/triage/difficulty fixtures
10. SPEC28 overlay (lowest precedence; fills invertebrate/equipment/problem gaps)

| Measure | Result |
|---|---:|
| Raw proposals considered | 1,939 |
| Duplicates removed | 318 |
| Unique document + field pairs | **1,621** |

Duplicates removed by source: SPEC28 overlay 272, SPEC24 27, SPEC29 specialist 11, SPEC27 7, SPEC29 Phase 8 1.

**Traceability data:** `reports/AQUAMIND_PRODUCTION_SYNC_MASTER_PLAN_data/` contains the read-only Production snapshot (`production-snapshot-full.json`), the computed registry summary (`registry-summary.json`) and the per-batch document index (`batch-documents.json`).

---

## 5. Approval classification

Exactly one status is assigned to every field.

### 5.1 Rules applied

| Status | Meaning in this plan |
|---|---|
| `APPROVED` | An explicit approval instrument exists and the field is evidence-supported. Only these may enter an executable batch. |
| `NEEDS_SOURCE` | The proposal exists but has no explicit Production approval and/or no verified source/approval reference. |
| `NEEDS_SPECIALIST` | The field asserts treatment, medication, reef safety, compatibility, husbandry or other high-risk content and requires a named qualified specialist. |
| `CONFLICT` | Production changed, the value conflicts, the mapping is impossible, or the proposed schema field is not deployed. |
| `DEFERRED` | Explicitly deferred or held with no approved replacement value. |

A completed SPEC report, a “prepared for production” status, or a local overlay is **not** an approval.

### 5.2 Status totals

| Status | Fields | Share |
|---|---:|---:|
| `APPROVED` | 40 | 2.5% |
| `NEEDS_SOURCE` | 1,199 | 74.0% |
| `NEEDS_SPECIALIST` | 81 | 5.0% |
| `CONFLICT` | 298 | 18.4% |
| `DEFERRED` | 3 | 0.2% |
| **Total** | **1,621** | **100%** |

### 5.3 Status by source

| Source | `APPROVED` | `NEEDS_SOURCE` | `NEEDS_SPECIALIST` | `CONFLICT` | `DEFERRED` |
|---|---:|---:|---:|---:|---:|
| SPEC28 core completion | 0 | 948 | 0 | 251 | 0 |
| SPEC28 overlay | 0 | 224 | 1 | 6 | 0 |
| SPEC27 editorial patch | 0 | 1 | 4 | 5 | 1 |
| SPEC24 care/triage/difficulty | 0 | 1 | 43 | 31 | 0 |
| SPEC24 taxonomy | 0 | 17 | 0 | 0 | 0 |
| RC equipment audit | 0 | 8 | 0 | 0 | 1 |
| SPEC29 Batch A | 12 | 0 | 0 | 0 | 0 |
| SPEC29 Phase 8 / Batch B | 28 | 0 | 0 | 5 | 1 |
| SPEC29 specialist register | 0 | 0 | 33 | 0 | 0 |

### 5.4 Approved decisions

All 40 approved decisions are accounted for:

- **Batch A:** 12 fields on 9 Problem documents; transaction `d7CVw7aDESWWKYmK5BguJt`; 12/12 verified.
- **Batch B / Phase 8:** 23 fields on 14 Problem documents; transaction `A8H3InZCh3xhQPGiDckK3F`; 23/23 verified.
- **`waterType`:** 5 decisions `RESOLVED_NO_WRITE`; the live enum values are retained and no value was inferred.
- **Total approved:** 40; **applied and verified:** 35; **resolved no-write:** 5; **pending:** 0.

The Batch A approval keeps the 5 held claims at `DEFER` while publishing conservative safe-warning wording; the other 7 are accepted with qualification. It does not upgrade any claim to `VERIFIED`. Batch B likewise approved only the recorded editorial text.

### 5.5 SPEC29 accounting

The 98 SPEC29 claims are fully accounted for:

| Group | Claims | Disposition |
|---|---:|---|
| Editorial decisions | 54 | 23 applied, 4 already matched, 15 internal-only category metadata, 5 `waterType` `RESOLVED_NO_WRITE`, 2 deferred, 5 identity `UNRESOLVED_NO_WRITE` |
| Specialist claims | 44 | 11 covered by the approved Batch A field set (already applied), 33 remain `NEEDS_SPECIALIST` |
| **Total** | **98** | No claim is unaccounted for |

The 12 Batch A claims and 22 Batch B proposal claims sit inside these 98; they are not additional claims. Batch A's 12 fields and Batch B/Phase 8's 23 fields are the only approved writes. The 5 `waterType` decisions are approved but are not writes; the 5 identity decisions remain open design decisions.

---

## 6. Batch design

### 6.1 Batch 1 — Plant/Coral SEO

| Measure | Result |
|---|---:|
| Documents | 0 |
| Field changes | 0 |
| `APPROVED` | 0 |
| Pending writes | 0 |

**Schema status:** live. The deployed Studio schema includes the optional Plant and Coral `seo` object with `metaTitle` and `metaDescription`. The live site correctly uses fallback metadata.

**Data status:** 0/62 Plants and 0/48 Corals have stored SEO values. No approved document values exist.

**Verdict:** schema-ready, data-empty, not executable. This is the first batch that does **not** require specialist review, but it requires editorial authoring and explicit approval before it can write anything.

### 6.2 Batch 2 — Core Database

| Measure | Result |
|---|---:|
| Documents | **384** |
| Field changes | **1,395** |
| `NEEDS_SOURCE` | 1,172 |
| `CONFLICT` | 222 |
| `DEFERRED` | 1 |
| `APPROVED` | 0 |
| Pending writes | 0 |

Distribution: Species 844, Plants 231, Invertebrates 220, Corals 100.

Proposed fields include 384 aliases, 367 Knowledge Bodies, 219 difficulty contexts, 118 excerpts, 202 SEO fields (101 species titles + 101 descriptions), 92 regions, and a small number of growth/placement/photosynthetic fields.

**Blockers:** SPEC28 closure is `PARTIALLY_COMPLETE_WITH_PROGRESS_SAVED` / `NOT READY`; 0 records are fully verified; no explicit Production approval exists. **222 fields target schema fields that are not deployed** — 219 `difficultyContext` and 3 `difficultyConfidence`. Those are `CONFLICT`, not writable.

### 6.3 Batch 3 — Equipment and Problems

| Measure | Result |
|---|---:|
| Documents | **21** |
| Field changes | **26** |
| `NEEDS_SOURCE` | 25 |
| `DEFERRED` | 1 |
| `APPROVED` | 0 |
| Pending writes | 0 |

- **Equipment:** 9 fields on 4 documents. Eight are `0 → null` placeholder corrections; the CO2 Drop Checker `tankSizeMaxL = 9999` sentinel is held.
- **Problems:** 17 category normalizations (`water → water_quality`, `plants → plant`, `algae → coral/pest`, `water → algae` for cyanobacteria).

**Blockers:** the RC hardening audit confirms the zeros are placeholders, but no explicit Production-write approval exists. SPEC24 records the category mapping as “reviewable but not applied”. The live runtime already hides placeholders and maps legacy categories in the UI; this batch is data cleanup only.

### 6.4 Batch 4 — Specialist Content

| Measure | Result |
|---|---:|
| Documents | **48** |
| Field changes | **200** |
| `APPROVED` | 40 |
| — applied and verified | 35 |
| — resolved no-write | 5 |
| — pending | 0 |
| `NEEDS_SPECIALIST` | 81 |
| `CONFLICT` | 76 |
| `NEEDS_SOURCE` | 2 |
| `DEFERRED` | 1 |

Distribution: Problems 149, Corals 46, Species 4, Invertebrates 1.

**Approved history:** 40 approved decisions — 35 Batch A/Phase 8 fields applied and verified, 5 `waterType` decisions `RESOLVED_NO_WRITE`. No further write is required.

**Blocked content:** 81 field claims still require named specialist approval. The specialist intake register is `PENDING` / `NOT_APPROVED`; reviewer identity and credentials are `NOT_SUPPLIED`. A further 70 fields target undeployed schema fields (`reefSafetyMeaning`, `careBasis`, `careConfidence`, `reviewStatus`, `evidenceSources`, `growthRisk`, `notRecommendedFor`, etc.). Five identity design decisions remain `UNRESOLVED_NO_WRITE`; the five `waterType` decisions are `RESOLVED_NO_WRITE` and are not active conflicts. SPEC24.2 remains `BLOCKED_PENDING_REVIEWER`.

No medication dosage, treatment protocol, reef-safety meaning, compatibility or husbandry value was inferred or converted into a factual value.

---

## 7. Conflict and schema analysis

### 7.1 Conflict status

| Conflict status | Fields | Meaning |
|---|---:|---|
| `NONE` | 1,283 | No detected conflict; still may be unapproved |
| `SCHEMA_FIELD_NOT_DEPLOYED` | 292 | Proposed field absent from the live SEO-only schema |
| `ALREADY_APPLIED` | 35 | Approved value matches Production |
| `RESOLVED_NO_WRITE` | 5 | `waterType` prose cannot be stored in the enum; current enum retained |
| `UNRESOLVED_NO_WRITE` | 5 | Identity design decision; no identity field exists |
| `VALUE_CONFLICT` | 1 | Koi tank-size qualification cannot fit the numeric field |

### 7.2 Undeployed schema fields

| Field | Fields | Domains |
|---|---:|---|
| `difficultyContext` | 219 | Species, Coral |
| `reefSafetyMeaning` | 21 | Coral |
| `reviewStatus` | 10 | Problem, Coral |
| `claimConfidence` | 9 | Problem |
| `affectedTypes` | 7 | Problem |
| `severity` | 4 | Problem |
| `timeSensitivity` | 4 | Problem |
| `difficultyConfidence` | 3 | Species, Coral |
| `evidenceSources` | 3 | Problem, Coral |
| `notRecommendedFor` | 3 | Species, Coral |
| `calcium`, `magnesium`, `salinity`, `temperatureTolerance` | 1 each | Coral |
| `careBasis`, `careConfidence`, `growthRisk`, `growthRiskNote`, `suitabilityConditions` | 1 each | Coral |
| **Total** | **292** | Species 222, Coral 35, Problem 35 |

These fields are `CONFLICT` because writing them would fail against the deployed schema. Deploying the wider SPEC24 schema is explicitly outside this task.

---

## 8. Exact write projection

| Batch | Approved decisions | Already applied | Resolved no-write | Pending writes |
|---|---:|---:|---:|---:|
| Batch 1 — Plant/Coral SEO | 0 | 0 | 0 | **0** |
| Batch 2 — Core Database | 0 | 0 | 0 | **0** |
| Batch 3 — Equipment and Problems | 0 | 0 | 0 | **0** |
| Batch 4 — Specialist Content | 40 | 35 | 5 | **0** |
| **Total** | **40** | **35** | **5** | **0** |

Executing every currently approved batch would perform **0 additional document field writes**. Any positive write count requires a new explicit approval that does not exist today.

---

## 9. Final decision

**`BLOCKED_BY_CONFLICTS`**

### First batch executable without new specialist reviews

There is **no batch that can perform a Production write** without new approval.

- **Batch 1** is the first batch that needs no specialist review, and its schema is live. It is not executable as a data write because it contains **0 approved document values**.
- **Batch 2** needs explicit editorial approval for SPEC28 core completion and a schema decision for 222 undeployed fields.
- **Batch 3** needs explicit approval for equipment and category corrections.
- **Batch 4** needs specialist approval for 81 field claims, including the 44 SPEC29 specialist claims; its 40 approved decisions comprise 35 applied fields and 5 `RESOLVED_NO_WRITE` decisions, with 0 pending writes.

### Smallest unblock path

1. Author and approve Plant/Coral SEO values; then Batch 1 can execute 0-risk metadata writes.
2. Decide whether to approve SPEC28 core completion as-is, and decide the `difficultyContext` schema gap. Batch 2 then becomes executable for schema-valid fields.
3. Approve the 8 equipment null corrections and 17 category mappings; Batch 3 then becomes executable.
4. Supply named qualified specialists for the 81 specialist field claims and resolve the 5 identity design decisions. For each identity decision, choose one of: approve a suitable H1 title, introduce a separately reviewed identity/description field through a future schema change, or formally withdraw the proposal.

Until those decisions exist, the correct state is `BLOCKED_BY_CONFLICTS` because the five identity design decisions remain open. There are **0 pending approved writes**; the conflict block is not a write queue.

---

## 10. Safety attestation

- No Sanity document write, publish, unpublish, migration, backfill or revalidation was performed.
- No schema deployment or Studio deployment was performed.
- No website code was changed.
- No Git commit, push, reset or branch operation was performed.
- No credentials, tokens or keys are reproduced in the deliverables.
- All 473 current Production documents were read only.
- All existing reports, approvals, registers and patches were preserved unchanged.
- No medication dosage, treatment protocol, reef-safety meaning, compatibility or husbandry value was inferred.
- No unresolved conflict was placed in an executable batch. There are no executable approved rows.

**Final status: `BLOCKED_BY_CONFLICTS`.**
