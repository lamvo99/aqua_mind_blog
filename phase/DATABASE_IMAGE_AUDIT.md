# DATABASE IMAGE AUDIT — AquaMind

## Purpose

Audit the image quality and entity-to-image mapping across the entire AquaMind Database.

This is a **READ-ONLY AUDIT**.

The goal is to identify incorrect, suspicious, missing, duplicated, or low-quality images before making any production changes.

---

# IMPORTANT RULES

1. **DO NOT modify source code.**
2. **DO NOT modify CMS data.**
3. **DO NOT replace, delete, rename, upload, or optimize images.**
4. **DO NOT create a new implementation phase.**
5. **DO NOT commit changes.**
6. Only inspect the current source/data and produce an audit report.
7. Do not assume an image is correct merely because its filename, alt text, or URL contains the entity name.
8. If visual verification is not possible from the available source/assets, mark the item `UNVERIFIED` rather than guessing.
9. Separate confirmed problems from suspected problems.
10. Preserve the existing project terminology and entity structure.

---

# SCOPE

Audit all Database entity types currently implemented by AquaMind:

- Species
- Plants
- Corals
- Equipment
- Invertebrates

Also inspect any shared image/data mapping used by these entity types.

---

# AUDIT OBJECTIVES

For every entity, determine:

- Entity name
- Slug
- Scientific name, if available
- Entity type
- Current image URL/path/reference
- Image filename, if available
- Image alt text
- Image source/reference, if available
- Whether an image exists
- Whether the image appears to represent the correct entity
- Whether the image represents the correct entity category/type
- Whether there are obvious quality problems
- Whether the same image is incorrectly reused across unrelated entities

---

# CLASSIFICATION

Each entity must receive exactly one primary image status:

## PASS

Use when the available evidence supports that the image correctly represents the entity.

## SUSPECT

Use when the image may be correct, but visual/source evidence is insufficient or there is a reasonable concern.

## WRONG

Use when the image clearly represents a different entity/species/type.

Example:

`Zoanthids → Sun Coral / Tubastraea`

This should be classified as `WRONG`.

## MISSING

Use when the entity has no usable image.

## LOW_QUALITY

Use when the image appears to represent the correct entity but is unsuitable for the website because of obvious technical/content quality problems.

Examples:

- severely blurred
- corrupted
- extremely low resolution
- obvious placeholder
- unrelated crop
- unusable visual

## UNVERIFIED

Use when the audit cannot reliably determine correctness from the available evidence.

Do not convert `UNVERIFIED` into `PASS` by assumption.

---

# CRITICAL CHECKS

## 1. Entity ↔ Image correctness

Check whether the actual image corresponds to the entity.

Do not rely only on:

- filename
- slug
- alt text
- database name

Example:

If entity is:

`Zoanthids`

but image is:

`Sun Coral / Tubastraea`

then:

`WRONG`

---

## 2. Scientific name consistency

Where scientific names exist, compare the image mapping against the expected entity.

For example:

- common name
- scientific name
- genus
- species
- coral type

Do not claim species-level correctness if the available evidence only supports genus/family-level identification.

---

## 3. Entity category consistency

Check whether the image belongs to the correct broad category.

Examples:

- Coral image must not be a fish.
- Fish image must not be a coral.
- Equipment image must not be livestock.
- Plant image must not be algae/coral unless that is explicitly the entity.
- Invertebrate image must not be an unrelated fish/coral.

---

## 4. Coral-specific check

For every coral image, check whether the image visually matches the stated coral type/name where verification is possible.

Pay particular attention to:

- Zoanthids
- SPS
- LPS
- NPS
- soft corals
- named coral genera/species

Do not assume two coral types are interchangeable simply because both are corals.

---

## 5. Species-specific check

For species entries, check:

- common name
- scientific name
- genus/species
- obvious visual mismatch

If species-level identification cannot be confirmed, mark `SUSPECT` or `UNVERIFIED`, not `PASS`.

---

## 6. Plant-specific check

Check whether the image represents the intended aquarium plant and not:

- terrestrial plant
- unrelated aquatic plant
- moss/algae when the entity is a vascular plant
- another plant with a similar common name

---

## 7. Equipment-specific check

Check whether the image corresponds to the stated equipment.

Examples:

- Protein skimmer
- Filter
- Pump
- Light
- Heater
- Wave maker
- CO2 equipment

An image of a different equipment category should be `WRONG`.

---

## 8. Invertebrate-specific check

Check whether the image corresponds to the stated invertebrate.

Examples:

- shrimp
- snail
- crab
- starfish
- other aquarium invertebrates

---

# DUPLICATE IMAGE AUDIT

Identify images reused by multiple entities.

Classify reuse as:

### EXPECTED

The same image may legitimately represent a category/group page.

### SUSPICIOUS

The same image is used by multiple specific entities where separate images would normally be expected.

### WRONG

The reused image clearly belongs to another entity.

Report:

- image reference
- entities using it
- entity types
- assessment

---

# IMAGE QUALITY AUDIT

Where technical information is available, inspect:

- dimensions
- aspect ratio
- file type
- file size
- obvious corruption
- obvious placeholder image
- obvious stock/watermark issues
- severe compression
- unsuitable crop

Do not enforce arbitrary resolution requirements unless the current project already defines them.

---

# SOURCE / LICENSE AUDIT

If image source/license metadata exists in the source:

- report it
- identify missing source information
- identify obvious attribution/license concerns

Do NOT perform external legal conclusions.

If source/license information is absent, report:

`SOURCE INFORMATION NOT AVAILABLE`

Do not assume an image is licensed or unlicensed.

---

# OUTPUT

Create a Markdown report:

`DATABASE_IMAGE_AUDIT_REPORT.md`

Do not modify any other project files.

The report must contain:

# 1. Executive Summary

Include:

- Total entities audited
- PASS
- SUSPECT
- WRONG
- MISSING
- LOW_QUALITY
- UNVERIFIED
- Duplicate image findings

# 2. Critical Findings

List all confirmed `WRONG` images first.

For each:

| Entity | Type | Current Image | Expected | Status | Evidence | Recommended Action |
|---|---|---|---|---|---|---|

Do not recommend a specific replacement image unless the evidence/source already exists.

# 3. Suspect Findings

Same structure.

# 4. Missing Images

List all entities without usable images.

# 5. Low Quality Images

List technical/content quality problems.

# 6. Duplicate Images

List suspicious or incorrect reuse.

# 7. Source / License Metadata Gaps

List missing or incomplete image provenance information.

# 8. Full Audit Table

One row per entity:

| Type | Entity | Slug | Scientific Name | Image | Status | Confidence | Notes |
|---|---|---|---|---|---|---|---|

Confidence:

- HIGH
- MEDIUM
- LOW

# 9. Recommended Remediation Priority

Group only into:

## P0 — Clearly Wrong

Images that visibly represent another entity.

## P1 — Important

Missing/suspect/quality issues on high-value database pages.

## P2 — Cleanup

Minor quality, duplicate, metadata, or provenance issues.

---

# SPECIAL CASE: ZOANTHIDS

The current production page:

`https://www.aquamind.life/corals/zoanthids`

has been manually observed to display an image that appears to be Sun Coral / Tubastraea rather than Zoanthids.

Treat this as a finding to verify during the audit.

Do not silently replace it.

The report should state whether the source/data confirms this mapping and identify the exact file/data field responsible.

---

# TRACEABILITY

For every `WRONG`, `SUSPECT`, `MISSING`, or `LOW_QUALITY` finding, identify where the image mapping originates.

Examples:

- source file
- data object
- CMS query
- image field
- static asset
- URL
- mapping function
- fallback logic

Use exact file paths and line numbers where possible.

---

# FINAL DECISION

End the report with:

## Overall Database Image Health

Choose one:

- `GOOD`
- `GOOD WITH BACKLOG`
- `ACTION REQUIRED`
- `CRITICAL`

Then provide:

1. Number of confirmed wrong images.
2. Number of missing images.
3. Number of suspicious images.
4. Whether the problem appears isolated or systemic.
5. Whether implementation changes are required.
6. Exact files/data sources that would need modification if remediation is approved.

Again:

**DO NOT MODIFY CODE OR DATA.**
**AUDIT ONLY.**
