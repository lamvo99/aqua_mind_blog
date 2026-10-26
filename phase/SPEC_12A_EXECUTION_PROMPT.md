# SPEC 12A — Relationship Graph Research & Candidate Plan
**Project:** AquaMind Wiki Database  
**Mode:** READ-ONLY / RESEARCH-ONLY  
**Target:** Prepare an evidence-grounded, auditable relationship plan for SPEC 12B  
**Production writes:** STRICTLY FORBIDDEN  
**Sanity deployments:** STRICTLY FORBIDDEN  
**Do not execute:** `SPEC_11_one_shot_execute.js`

---

## 0. Execution instruction

Implement SPEC 12A in the existing AquaMind repository. Do actual repository work, not another open-ended audit. Produce a bounded, machine-readable relationship candidate plan and validation reports that SPEC 12B can consume without guessing.

This stage researches and proposes relationships only. It must not mutate Sanity documents, publish drafts, change schema, deploy Studio, or write to production. Do not ask for PM approval row by row; classify each candidate using explicit evidence and deterministic rules, then report unresolved candidates as held.

Before doing work:
1. Inspect `git status --short`, current branch, recent commits, and the existing SPEC 10N report/artifacts.
2. Locate SPEC 09/10/11 relationship definitions and current repository scripts/tests. Reuse the repository's actual names and schema rather than assuming paths.
3. Establish the current read-only production baseline using existing approved scripts: record count, type counts, drafts, duplicate IDs/slugs, canonical identity hash, and current relationship counts/shape.
4. Confirm the 10N deployment state and current Sanity schema before relying on any field shape. Do not deploy or edit schemas in this spec.
5. Do not overwrite existing artifacts. Create a new `reports/SPEC_12A/` directory and uniquely named outputs.

If the repository's current state differs from the recorded context, treat live checks and source files as authoritative, document the discrepancy, and preserve the safer behavior.

## 1. Known baseline to verify (not blindly trust)

The latest reported baseline before SPEC 10N was:
- 473 Wiki records.
- 218 species, 62 plants, 56 invertebrates, 48 corals, 46 equipment, 43 problems.
- 0 drafts and 0 duplicate slugs.
- Canonical identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`.
- SPEC 10N reported 473 records, 0 drafts, identity hash match, and `content_mutations: 0`.
- SPEC 10N updated website integration and deployed the Sanity Studio schema successfully. Its full test suite had 387 passing and one reported failure in `tests/compare.test.ts` (`compare config covers all four database types`). Verify whether this is still present; do not claim it is caused by SPEC 12A without evidence.
- SPEC 11 one-shot writes were reported as successful for 364/364 operations across 17 Wave-1 species. Do not rerun that executor or alter those fields.
- SPEC 11A remainder stage performed 0 production writes and left evidence/conflict/mapping blockers unresolved.
- The database has 218 species, while earlier SPEC 11 evidence collection covered only 17. Relationship coverage must be evaluated against the actual full record inventory, not only Wave 1.

## 2. Scope

Design and validate relationship candidates among existing Wiki records. The plan may cover relationships such as:
- species ↔ compatible plants, invertebrates, corals, or other species, only where the current schema supports that exact relationship and compatibility is justified;
- species ↔ equipment;
- species ↔ water parameters / husbandry guidance / problems;
- problem ↔ likely causes, diagnostic checks, and safe corrective guidance;
- plant ↔ lighting, substrate, CO₂, flow, and compatible livestock;
- equipment ↔ intended tank type, capacity, or use case;
- record-to-record related content for useful discovery, if and only if the current schema has a suitable field and the relationship is semantically justified.

These are categories to investigate, not permission to invent new fields or write unsupported relationships. First inspect the actual schema, existing references, query consumers, and the relationship model. Prefer existing supported relationship fields. If the desired relationship has no valid schema representation, record it as a schema gap for later review; do not change schema in SPEC 12A.

Do not modify titles, slugs, categories, SEO metadata, body copy, husbandry values, images, or any unrelated field. Do not create new Wiki records.

## 3. Evidence and relationship quality rules

Every proposed edge must be a distinct, testable relationship, not a generic “related” guess. Capture:
- stable candidate ID;
- source record `_id`, type, title, and slug (where available);
- target record `_id`, type, title, and slug (where available);
- relationship field/path supported by the current schema;
- relationship kind and directionality;
- concise rationale;
- supporting source URL(s) or existing first-party database evidence;
- exact evidence note/quote or a precise location in the source;
- source type and evidence class;
- confidence (`HIGH`, `MEDIUM`, `LOW`, `UNVERIFIED`);
- risk tier (`P0`, `P1`, `P2`, `P3`);
- decision (`PROPOSE_WRITE`, `PROPOSE_WITH_CAVEAT`, `HOLD_EVIDENCE`, `HOLD_CONFLICT`, `REJECT_SEMANTIC_MAPPING`, `SKIP_ALREADY_PRESENT`, `NOT_APPLICABLE`);
- caveats, conflicts, and reason for any hold/rejection;
- date checked;
- whether the edge is already present;
- exact planned mutation path/value, but only in the offline plan.

Source hierarchy:
1. Peer-reviewed scientific literature and authoritative scientific databases.
2. Government, university, museum, or institutional sources.
3. Established aquarium organizations and high-quality specialist references.
4. Manufacturer documentation only for product specifications or intended-use claims.
5. Community content may be supplementary only and cannot be the sole support for a safety-critical or compatibility claim.

Rules:
- Never fabricate sources, URLs, citations, quotes, or evidence.
- A source supporting two organisms' broad habitat does not automatically prove they are safe tank mates.
- Shared freshwater/marine classification, region, size, or diet alone is not sufficient evidence of compatibility.
- Distinguish natural ecology from aquarium suitability.
- Do not infer coral compatibility, predation risk, temperament, adult size, water parameters, disease treatment, or equipment sizing from taxonomy alone.
- Do not turn “not found” into “false” or “incompatible.”
- Conflicting evidence must be held, not averaged into a fabricated conclusion.
- Do not use generated text as evidence.
- Existing valid edges should be preserved and marked `SKIP_ALREADY_PRESENT`, not duplicated.
- If a relationship cannot be justified, leave it absent.
- Relationships involving livestock safety, toxicity, predation, aggression, disease, or potentially harmful treatment are P0/P1 and require stronger evidence; if evidence is ambiguous, hold them.
- Do not treat a website's “related articles” module as biological evidence for compatibility.
- Prefer a small number of defensible edges over high graph density.

## 4. Required implementation steps

### Phase A — Schema and consumer mapping
1. Inspect the live repository schema and deployed-schema evidence from SPEC 10N.
2. Map every supported relationship field to:
   - allowed target type(s);
   - directionality;
   - whether it is a Sanity reference, slug/string, embedded object, or reverse query;
   - consumers in `lib/database.ts`, page routes, and GROQ queries;
   - existing validation rules.
3. Identify existing relationships and duplicate/invalid/dangling references.
4. Create `reports/SPEC_12A/RELATIONSHIP_FIELD_MAP.csv` and `RELATIONSHIP_BASELINE.json`.
5. If a field's shape is uncertain, do not generate candidates for it; document the uncertainty.

### Phase B — Build complete inventory and candidate scope
1. Enumerate all existing records from the actual production dataset read-only.
2. Include all supported record types and all 218 species (or the verified current count), not only the 17 SPEC 11 Wave-1 species.
3. Use the existing applicability matrix, relationship model, and relevant SPEC 09/10 artifacts if present. Do not blindly trust old candidate lists if their record IDs or schema shapes no longer match.
4. Generate candidate edges only when a specific relationship hypothesis exists.
5. Bound the workload: prioritize useful, high-value relationships and process in deterministic batches by type/record ID. If external research is unavailable, record the gap and continue with candidates that can be assessed from valid existing evidence.
6. Do not generate all-to-all edges or arbitrary similarity links.

### Phase C — Evidence gathering and adjudication
1. For every candidate, retrieve evidence from real sources using available research/search capability or repository-provided evidence artifacts.
2. Store source URL, title/publisher, access/check date, evidence note, and the exact claim supported.
3. Where one source does not directly support the edge, classify as held rather than extrapolating.
4. Detect contradictory evidence and duplicate candidates.
5. Apply the decision rules from Section 3 consistently and deterministically.
6. Clearly distinguish:
   - directly supported relationship;
   - plausible but not adequately supported;
   - conflict;
   - invalid semantic mapping;
   - already-existing edge;
   - not applicable.

### Phase D — Offline mutation plan and safety validation
1. Produce a proposed write plan for SPEC 12B, but do not execute it.
2. Each operation must identify one exact document ID, one exact allowed relationship path, and one exact intended value/addition.
3. Never include a document's title, slug, category, SEO, body, or non-relationship fields in the mutation plan.
4. For arrays, propose additive/idempotent operations only. Never replace an entire existing array unless the current schema and an explicit, tested rule require it; default is additive-only.
5. If Sanity references are used, verify every target `_id` exists and has an allowed type.
6. Detect self-links, duplicate edges, reciprocal duplicates where semantics are directional, cycles where the relationship type must be acyclic, and dangling targets.
7. Validate that running the planned operations twice would not duplicate edges.
8. Provide before/after counts as simulated values only and label them `SIMULATED`; do not represent simulation as a live change.

### Phase E — Tests and reports
Add or update tests for:
- relationship field mapping and target-type constraints;
- unknown/missing record IDs;
- dangling references;
- duplicate edges and idempotency;
- directionality;
- self-links;
- P0 safety relationships held when evidence is insufficient;
- conflicts remain non-writable;
- no non-relationship fields appear in the plan;
- no Sanity mutation client or write API is called;
- no schema deployment is invoked;
- current known test baseline is recorded accurately.

Run available validation:
- lint;
- TypeScript typecheck;
- focused SPEC 12A tests;
- full test suite;
- production build if the repository state makes it appropriate.
Do not fix unrelated existing failures under this spec unless the change is demonstrably necessary and narrowly scoped. Report each pre-existing failure explicitly.

## 5. Mandatory read-only guarantees

This spec must not call or invoke:
- `create`, `patch`, `transaction`, `mutate`, or other Sanity write operations;
- publish/unpublish/delete operations;
- schema deployment commands;
- any script with production mutation behavior;
- `SPEC_11_one_shot_execute.js`;
- SPEC 12B or any follow-up write executor.

If practical, use a read-only Sanity client/token for the whole run. Search the code and execution path for mutation calls before running scripts. If an existing helper can write, do not use it unless it has a provable dry-run/read-only mode. No credentials or token values may be printed in logs or reports.

## 6. Required deliverables

Create `reports/SPEC_12A/` containing at minimum:

1. `SPEC_12A_EXECUTION_REPORT.md`
   - final verdict: `COMPLETE`, `PARTIAL`, or `BLOCKED`;
   - exact scope processed and scope not processed;
   - verified live baseline;
   - schema/consumer mapping summary;
   - counts by relationship kind and target type;
   - counts by decision and risk tier;
   - evidence source-quality summary;
   - candidate and edge coverage by record type;
   - test results and known failures;
   - blockers, assumptions, and explicit next action for SPEC 12B.
2. `RELATIONSHIP_FIELD_MAP.csv`
3. `RELATIONSHIP_BASELINE.json`
4. `RELATIONSHIP_CANDIDATES.csv` — one row per candidate edge.
5. `RELATIONSHIP_EVIDENCE.csv` — normalized source evidence, linked by candidate ID.
6. `RELATIONSHIP_CONFLICTS.csv`
7. `SPEC_12B_DRY_RUN_PLAN.json` — only eligible proposed operations, no execution.
8. `SPEC_12B_HELD_REGISTER.csv` — all held/rejected/not-applicable candidates with reasons.
9. `VALIDATION_RESULTS.json`
10. `INTEGRITY.json` — pre/post identity hash, counts, draft count, relationship counts, and `content_mutations: 0`.
11. `CHECKSUMS.txt` for the produced artifacts.

CSV files must include headers even when empty. Use UTF-8. JSON must be valid and machine-readable. Use stable sorting and stable candidate IDs so repeated runs can be compared. Never place secrets in artifacts.

## 7. Acceptance criteria

SPEC 12A may be marked `COMPLETE` only if all are true:
- verified complete live record inventory has been read without mutations;
- supported relationship fields and consumers are mapped;
- candidates are grounded in real existing record IDs and supported relationship paths;
- every candidate has an explicit decision and reason;
- every `PROPOSE_WRITE` / `PROPOSE_WITH_CAVEAT` edge has traceable evidence and passes type, identity, duplication, and safety checks;
- all unresolved/conflicting/weakly supported edges are held, not silently promoted;
- dry-run plan contains only relationship changes and is idempotent;
- no production write, publish action, or schema deployment occurred;
- pre/post identity and record counts match and `content_mutations` is exactly `0`;
- required reports exist and focused tests pass;
- any known unrelated full-suite failure is documented honestly.

If evidence gathering is limited by network or source access, return `PARTIAL`, preserve the usable candidate set, enumerate exact gaps, and do not invent evidence to force `COMPLETE`.

## 8. Final response format

When done, report:
1. Verdict (`COMPLETE` / `PARTIAL` / `BLOCKED`).
2. Exact number of records inspected and candidate edges evaluated.
3. Eligible edges proposed, held, rejected, and already present.
4. Confirmed `content_mutations: 0`.
5. Tests/build and known failures.
6. Paths to all report artifacts.
7. Whether SPEC 12B can begin, and any hard blockers.

Do not claim production content was improved during SPEC 12A. This stage only creates a verified relationship plan for the separate write stage.
