# SPEC 13A — Relationship Coverage Research (Read-Only)

**Mode:** READ-ONLY. GET queries only. Zero content mutations, zero schema changes, zero deploys.
**Target:** `zeohjejw` / `production` / API `v2026-05-25`
**Executed:** 2026-10-20
**Verdict:** `PASS` — research complete, 21 candidates proposed, 10 held, plan offline only.

---

## 1. Purpose

Produce an evidence-backed, bounded relationship-coverage plan without writing to the dataset.
Outputs feed a separate SPEC 13B execution prompt; **nothing in this batch is authorized for production write.**

## 2. Baseline re-confirmed (Phase A/B)

| Check | Result |
|---|---|
| A-01 SPEC 12A reports intact | PASS |
| A-02 SPEC 12B checksums (10 tracked) | PASS, 0 mismatch |
| A-03 handoff artifacts present | PASS |
| A-04 documented test-file checksum drift | PASS (documented, not silent) |
| B-01 record counts 473 | PASS (species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43) |
| B-02 drafts = 0 | PASS |
| B-03 duplicate `_id`/slug = 0 | PASS |
| B-04 identity hash | MATCH |
| B-05 relationship edges | 3173 (expected post-12B) |
| B-06 broken references | 0 (174 outside wiki types resolve to `post`/`tool`) |

Identity hash: `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda`

## 3. Coverage matrix (Phase C)

28 relationship fields across 6 source types. Full detail: `COVERAGE_MATRIX.csv`.

Key empty fields (0 edges, highest safety value):

| Source | Field | Records | With data | Edges |
|---|---|---|---|---|
| species | predatorPrey | 218 | 0 | 0 |
| invertebrate | predatorPrey | 56 | 0 | 0 |
| species | incompatibleSpecies | 218 | 0 | 0 |
| species | reefInteractionDetail | 218 | 0 | 0 |
| invertebrate | compatibleSpecies | 56 | 0 | 0 |
| invertebrate | suitableEquipment | 56 | 0 | 0 |
| invertebrate | parentSpecies | 56 | 0 | 0 |
| coral | coralNeighbors | 48 | 0 | 0 |
| coral | relatedPosts | 48 | 0 | 0 |
| equipment | compatibleEquipment | 46 | 0 | 0 |
| equipment | relatedProblems | 46 | 0 | 0 |

Selected families (`PRIORITY_DECISIONS.csv`): **`predatorPrey`** (P0) and **`incompatibleSpecies`** (P1).
Rationale: both are organism-level livestock-safety signals, currently empty, and evidence is directly quotable from a class-3 specialist reference. All other fields deferred.

## 4. Evidence basis (Phase D)

Single source class used: `C3_SPECIALIST_REFERENCE` = Seriously Fish species profiles (5 pages).
Each candidate carries the exact URL and excerpt in `EVIDENCE.csv`; no taxonomy/name-similarity/popularity inference was used.

| Source species | Evidence statement (verbatim basis) |
|---|---|
| Oscar (*Astronotus ocellatus*) | "predatory nature dictates that it should not be combined with much smaller fishes"; diet includes "smaller fish, insects, crustaceans" |
| Angelfish (*Pterophyllum scalare*) | "may eat small fish such as tetras" |
| Bala Shark (*Balantiocheilos melanopterus*) | "will also eat very small fishes and can upset slow-moving or more timid tankmates" |
| Dwarf Puffer (*Carinotetraodon travancoricus*) | "tends to nip the fins of slow-moving or long-finned fish"; "fed small snails (shell on) regularly" |
| Yo-Yo Loach (*Botia almorhae*) | "Slow-moving, long-finned species such as ornamental bettas, guppies and many cichlids should also be avoided"; "botiids also prey on aquatic snails" |

## 5. Candidate plan (Phase E)

21 operations, 2 families, all `sourceType = species`, all `action = add-if-absent`:

- **predatorPrey: 15** — Oscar ×6 (chili rasbora, green neon tetra, neon tetra, cherry/amano/ghost shrimp), Angelfish ×3 (neon, green neon, cardinal tetra), Bala Shark ×2 (chili, pygmy rasbora), Dwarf Puffer ×2 (great ramshorn, Malaysian trumpet snail), Yo-Yo Loach ×2 (MTS, ramshorn).
- **incompatibleSpecies: 6** — Bala Shark → honey gourami, Bala Shark → Betta imbellis, Yo-Yo → guppy, Yo-Yo → angelfish, Dwarf Puffer → angelfish (all `temperament`), Oscar → pygmy corydoras (`size`).

Design rules enforced:
- Source/target pairs are **disjoint across families** (no relation encoded twice).
- `predatorPrey` is **directional** (source = predator, ref = prey); no reverse edge auto-added.
- `incompatibleSpecies` is used only for non-prey reasons (`temperament`, `size`).
- `reason` uses the schema enum `predation|temperament|size|water`; every entry has required fields only.
- Deterministic `_key`: `'rel' + sha256('13a|' + candidateId).slice(0, 10)` (required for object-array items).
- All 21 decisions are `PROPOSE_WITH_CAVEAT`; confidence HIGH (explicit statement) or MEDIUM (size/temperament inference).

Simulation: edges 3173 → 3194, **0 duplicate edges on reapply**.

## 6. Held / rejected register

10 rows (`HELD_REGISTER.csv`): 8 `HOLD_EVIDENCE`, 2 `REJECT_SEMANTIC_MAPPING`. Examples:

- Dwarf Puffer → cherry/ghost shrimp: source mentions shrimp cohabitation with "varying success" — ambiguous, held.
- Dwarf Puffer → guppy/dwarf gourami: fin-nipping statement is generic, target not named — held.
- Yo-Yo → *Betta macrostoma*: source says "ornamental bettas" (*B. splendens*); catalog record is a different species — rejected as semantic mis-mapping.
- Oscar → angelfish: angelfish (15 cm) is not "much smaller" than a 35 cm oscar — rejected.
- Angelfish → rummynose tetra: 5 cm may be too large; source unspecified — held.

No conflict rows (`CONFLICTS.csv` header only): no pre-existing edges in either family, so no overwrite decisions were required.

## 7. Validations (12/12 PASS)

| ID | Validation | Result |
|---|---|---|
| V-01 | every path is an allowed relationship field | PASS |
| V-02 | source/target exist with allowed types | PASS |
| V-03 | no self-links | PASS |
| V-04 | no dangling references | PASS |
| V-05 | no duplicate edge in plan or against live data | PASS |
| V-06 | idempotent (0 duplicates on reapply) | PASS |
| V-07 | directionality respected, no auto reverse | PASS |
| V-08 | entry-object shape matches schema exactly | PASS |
| V-09 | evidence row per operation | PASS |
| V-10 | relationship fields only, no mutation client | PASS |
| V-11 | no SPEC 12B candidate reintroduced | PASS |
| V-12 | held/conflict/rejected never leak into plan | PASS |

## 8. Integrity after research

`INTEGRITY.json`: verdict **CLEAN**; content_mutations 0, schema_changes 0, deploys 0; records 473; drafts 0; identity MATCH; edges 3173 before and after.

## 9. Tests and gates

- `tests/spec13a-plan.test.ts` — 15/15.
- `npm run lint` — 0 findings.
- `npx tsc --noEmit` — 0 errors.
- Full suite (`npx vitest run --pool=vmThreads`) — 32 files, 432 tests, 431 pass, 1 known baseline failure (`tests/compare.test.ts`: asserts four compare domains while `lib/compare.ts` defines five). The load-dependent 5s timeout flake did not reproduce in this run.

## 10. Limitations and handoff

- Evidence is limited to five class-3 pages; no primary literature or keeper-forum corroboration was used.
- Size-based predation claims are conditional on relative size and individual temperament; entries carry that caveat in the plan and report, not in the schema (the schema has no caveat field for these two families).
- `incompatibleEntry` has no evidence field, so provenance lives only in `EVIDENCE.csv` and this report.
- **No write is authorized by this document.** SPEC 13B must: re-read the live baseline, re-run all preflight checks, confirm the 21 candidates still resolve and are absent, and obtain explicit approval before any mutation.
- SPEC 12A/12B artifacts remain byte-identical; the only known drift is the SPEC 12B test timeout in `tests/spec12a-plan.test.ts` (documented in `BASELINE.json`).
