# DATABASE EXPANSION — PHASE 1

## Purpose

Begin the first controlled expansion of the AquaMind Database after Database Foundation is complete.

This phase is focused on:

> **Selecting and implementing the first high-value missing Database entities.**

The target is **up to 30 new entities**, but 30 is NOT a quota.

If fewer than 30 entities can be justified from the available project evidence, add fewer.

---

# SOURCE MATERIALS

Read these before doing anything:

1. `DATABASE_EXPANSION_ROADMAP.md`
2. `DATABASE_FOUNDATION_CHECKPOINT.md`
3. The current AquaMind source code and Sanity schemas/data
4. `aquarium_content_plan.xlsx`

Content-plan workbook sheets include aquarium categories such as:

- 🐠 Cá Nước Ngọt
- 🌊 Cá & Sinh Vật Biển
- 🪸 San Hô & Reef
- 🌿 Thủy Sinh
- ⚙️ Kỹ Thuật & Thiết Bị
- 🦐 Tôm Cảnh
- 📖 Hướng Dẫn Loài Cụ Thể
- 💊 Bệnh & Điều Trị
- 🎓 Hướng Dẫn Người Mới
- 🔬 Khoa Học & Nghiên Cứu
- 🌡️ Quản Lý Hồ Nâng Cao
- 🧩 Sinh Vật Đặc Biệt

Use the actual workbook content, not assumptions about it.

---

# IMPORTANT CURRENT CONTEXT

The Database Foundation is complete.

Known verified foundation state:

- Plant difficulty query is correct.
- Coral difficulty query is correct.
- Coral `coralType` is now displayed.
- Equipment specification pipeline is correct, but existing equipment specification data is missing.
- `relatedPosts` pipeline is complete.
- 88/177 entities currently have related posts.
- `compatibleSpecies` pipeline is complete but currently has 0 populated relationships.
- Compatibility data requires curated domain data.

Do NOT reopen or redo these foundation tasks unless a real regression is discovered.

---

# GLOBAL RULES

## Rule 1 — Audit first

Before adding anything:

1. Read current Database data.
2. Build an exact inventory of existing entities.
3. Read the content-plan workbook.
4. Identify candidate topics/entities represented in the content plan but missing from Database.
5. Check whether an equivalent/synonym entity already exists.
6. Only then select candidates.

Do NOT create duplicates.

## Rule 2 — Search Console limitation

Search Console data is currently unavailable.

Therefore:

- do NOT claim search volume;
- do NOT invent keyword metrics;
- do NOT say an entity has high Google demand unless supported by actual data.

For this phase, use:

- content-plan coverage;
- current Database gaps;
- user utility;
- ecosystem value;
- data readiness;
- existing article opportunities.

Mark all search-demand conclusions as:

`SEARCH DEMAND DATA REQUIRED`

when appropriate.

## Rule 3 — Quality over quota

The objective is NOT:

`177 → 207/232`

for the sake of a number.

An entity should be added only when it has a clear role in the AquaMind knowledge ecosystem.

## Rule 4 — No speculative relationships

Do not fabricate:

- compatibility;
- disease relationships;
- equipment compatibility;
- plant/fish compatibility;
- coral compatibility.

Only use verified project data or explicit curated data.

## Rule 5 — Sequential implementation

This phase itself must be implemented in batches.

Do NOT create all 30 entities in one uncontrolled operation.

Use:

```text
CANDIDATE AUDIT
      ↓
BATCH 1 — 10 entities
      ↓
VERIFY
      ↓
BATCH 2 — 10 entities
      ↓
VERIFY
      ↓
BATCH 3 — up to 10 entities
      ↓
FINAL VERIFY
```

If a batch fails, STOP before the next batch.

---

# SPEC 1 — CURRENT INVENTORY RECHECK

## Objective

Establish the real current Database state before expansion.

Produce an internal inventory containing:

- Species count
- Plant count
- Coral count
- Equipment count
- Invertebrate count
- total entity count

Also list all existing entities.

## PASS criteria

- Current counts are verified from the actual source/CMS.
- No duplicate candidates remain unidentified.
- Existing entity naming conventions are understood.

STOP if FAIL.

---

# SPEC 2 — CONTENT PLAN ENTITY GAP ANALYSIS

## Objective

Cross-reference the content plan against the current Database.

For every relevant content-plan topic, determine:

```text
Topic
→ Requires Database Entity?
→ Entity exists?
→ Entity missing?
→ Existing equivalent?
→ Supporting article exists?
```

Create a candidate pool.

Prioritize topics where the missing entity can support:

- multiple articles;
- Problems;
- Tools;
- internal links;
- category pages;
- future compatibility relationships.

Do NOT treat every content-plan topic as requiring a Database entity.

Examples of topics that may NOT require entities:

- generic how-to articles;
- broad beginner concepts;
- opinion/lifestyle content;
- purely informational science topics.

Use the actual content-plan wording and structure.

## PASS criteria

A documented candidate pool exists with source sheet/topic references.

STOP if FAIL.

---

# SPEC 3 — SELECT TIER-1 CANDIDATES

## Objective

Select the first expansion candidates.

Use these descriptive criteria:

### Search Opportunity

Unavailable unless supported by real GSC/research data.

### User Utility

How directly the entity helps aquarium keepers.

### Ecosystem Value

Potential connections to:

- articles;
- problems;
- tools;
- related entities;
- category pages.

### Data Readiness

Whether the project can maintain reliable data for the entity.

Create a candidate table:

| Candidate | Type | Content Plan Sheet | Supporting Topic(s) | Existing? | Ecosystem Value | Data Readiness | Search Data |
|---|---|---|---|---|---|---|---|

Select:

- Batch 1: up to 10
- Batch 2: up to 10
- Batch 3: up to 10

Do not force all 30.

## PASS criteria

Every selected entity has a documented reason for inclusion based on project evidence.

No duplicate entity.

STOP if FAIL.

---

# SPEC 4 — ENTITY DATA COMPLETENESS CONTRACT

Before implementing Batch 1, inspect the current schema and define the minimum valid data for each selected entity type.

Do NOT create thin placeholder records.

For example:

## Species

At minimum, where applicable:

- name
- scientific name
- excerpt/description
- difficulty
- water type
- tank size
- temperature
- pH
- image

## Plant

At minimum, where applicable:

- name
- scientific name
- description
- difficulty
- plant type
- light
- CO2 requirement
- temperature
- pH
- image

## Coral

At minimum, where applicable:

- name
- scientific name
- description
- coral type
- difficulty
- lighting
- flow
- image

## Equipment

At minimum, where applicable:

- name
- type
- purpose
- relevant specifications
- image

## Invertebrate

At minimum, where applicable:

- name
- scientific name
- description
- type
- difficulty
- water type
- tank size
- image

These are minimum examples, not permission to invent fields.

Use the actual schema as authoritative.

If reliable data is unavailable for a selected entity, remove it from the batch and replace it with another candidate.

---

# SPEC 5 — BATCH 1 IMPLEMENTATION

Implement up to 10 selected entities.

For each entity:

1. Add it using the existing schema.
2. Use accurate, source-supported data.
3. Add an appropriate image only if a verified/licensed source is available.
4. Follow existing naming conventions.
5. Follow existing slug conventions.
6. Do not change schema unless absolutely necessary.
7. Do not create speculative relationships.
8. Verify the detail page.
9. Verify listing/category behavior.
10. Verify search/filter behavior where applicable.

Do NOT add relatedPosts unless an existing verified relationship exists.

Do NOT add compatibleSpecies unless verified curated data exists.

## PASS criteria

All Batch 1 entities:

- save correctly;
- appear in expected queries;
- render correctly;
- have no missing required fields;
- have valid slugs;
- do not break existing pages.

Run:

- lint
- relevant tests
- build if practical

STOP if FAIL.

---

# SPEC 6 — BATCH 1 DATA QA

Perform a separate QA pass.

Check:

- scientific names;
- entity type;
- required fields;
- image correctness;
- slug;
- water type;
- tank size;
- difficulty;
- category-specific fields;
- accidental duplicates.

Do not silently correct questionable factual data.

Flag it.

## PASS criteria

All Batch 1 entities pass QA.

STOP if FAIL.

---

# SPEC 7 — BATCH 2

Only after Batch 1 PASS.

Implement up to 10 additional entities using the same process.

Then:

- lint
- tests
- build
- route verification
- data QA

STOP if FAIL.

---

# SPEC 8 — BATCH 3

Only after Batch 2 PASS.

Implement up to 10 additional entities.

If fewer candidates remain with sufficient evidence, STOP expansion rather than adding weak entities.

Then run full verification.

---

# SPEC 9 — RELATIONSHIP ENRICHMENT

Do NOT automatically populate compatibility.

For newly added entities:

### relatedPosts

Add only when:

- a relevant existing article exists;
- the relationship is explicitly justified.

### compatibleSpecies

Leave empty unless curated verified compatibility data exists.

### Problems

Add only when the project already has a verified relationship.

### Tools

Add only when a relevant existing tool exists.

The objective is to create clean nodes first. Relationship enrichment can be a separate data curation workflow.

---

# SPEC 10 — FINAL VERIFICATION

Verify:

## Counts

- previous entity count
- new entities added
- final entity count

## Pages

Representative pages from every affected type.

## Technical

- lint
- tests
- production build
- TypeScript

## Data

- no duplicates
- no placeholder content
- no broken images
- no invalid slugs
- no missing required fields

## Regression

Existing Database pages continue to work.

---

# REQUIRED DELIVERABLE

Create:

`DATABASE_EXPANSION_PHASE_1_CHECKPOINT.md`

Include:

## 1. Executive Summary

- starting entity count
- entities added
- ending entity count
- overall status

## 2. Candidate Analysis

Document:

- candidate pool;
- selected entities;
- rejected candidates and why.

## 3. Batch Results

For each batch:

- entities added;
- data sources;
- verification;
- test results.

## 4. Content Plan Cross-Reference

For every added entity:

- sheet name;
- relevant topic(s);
- reason it belongs in Database.

## 5. Data Quality

Report:

- missing fields;
- questionable data;
- image issues;
- duplicate checks.

## 6. Relationships

Report:

- relatedPosts added;
- Problems links;
- Tools links;
- compatibleSpecies state.

## 7. Verification

- lint
- tests
- build
- TypeScript
- route checks

## 8. Remaining Backlog

Separate:

- CMS data entry
- future entity candidates
- relationship curation
- Search Console data requirement

---

# IMPORTANT: DO NOT DO THESE THINGS

Do NOT:

- add 500 entities;
- add 1,000 entities;
- scrape random websites;
- invent SEO metrics;
- invent compatibility;
- generate fake scientific information;
- create placeholder entities;
- redesign the Database;
- create new SEO phases;
- modify unrelated website code.

---

# FINAL RESPONSE

Return:

```text
DATABASE EXPANSION PHASE 1

Status:
[PASS / PASS WITH BACKLOG / BLOCKED / FAIL]

Starting entities:
[...]

Candidates reviewed:
[...]

Batch 1:
[...]

Batch 2:
[...]

Batch 3:
[...]

Entities added:
[...]

Final entity count:
[...]

Tests:
[...]

Build:
[...]

Checkpoint:
DATABASE_EXPANSION_PHASE_1_CHECKPOINT.md

Search Console:
NOT AVAILABLE

Next:
[exact next action]
```

The guiding principle is:

> **Expand the Database because the content ecosystem needs the entity, not because the Database needs a bigger number.**
