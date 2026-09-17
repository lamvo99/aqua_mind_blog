# DATABASE IMAGE REMEDIATION — P1

## Purpose
Remediate ONLY the two P1 image issues identified by `DATABASE_IMAGE_AUDIT_REPORT.md`.

### Scope
1. Coral: `Zoanthids`
   - slug: `zoanthids`
   - Sanity document: `coral-zoanthids`
   - field: `mainImage`
   - Current image was manually identified as visually inconsistent with Zoanthids and appearing more like Sun Coral / Tubastraea.
   - Audit could not independently verify the image because provenance metadata is unavailable.

2. Equipment: `Hang-On-Back Filter`
   - slug: `hang-on-back-filter`
   - Current status: missing `mainImage`.

## CRITICAL RULES

### Zoanthids
DO NOT search the internet and automatically choose a replacement image.
DO NOT use Google Images, Wikimedia, Unsplash, stock sites, or other external sources to select an image automatically.

The project owner must explicitly provide/approve the replacement image.

If no approved replacement asset exists:
- inspect and document the current Sanity mapping;
- DO NOT replace `mainImage`;
- mark the item `BLOCKED — OWNER IMAGE REQUIRED`.

### Hang-On-Back Filter
Inspect the existing project/source assets first.
If an approved asset already exists, it may be used.
If no approved asset exists, DO NOT invent or download one and DO NOT create a placeholder.
Mark it `BLOCKED — OWNER IMAGE REQUIRED`.

## SANITY / CMS SAFETY

Before any CMS write:
1. Confirm exact document ID.
2. Confirm exact field.
3. Confirm document type/schema.
4. Do not change schema definitions.
5. Do not change unrelated fields.
6. Preserve existing image/reference conventions.

If write credentials/access are unavailable, STOP before CMS writes and report the required owner-side action.

## PROCESS

### Phase A — Pre-check
Inspect:
- Sanity schema
- entity query
- current image mapping
- existing project assets
- equipment image conventions
- image upload/reference conventions

### Phase B — Zoanthids
Only replace `mainImage` if an explicitly approved replacement image is available.
Otherwise leave unchanged and report the block.

### Phase C — Hang-On-Back Filter
Only add `mainImage` if an approved project asset is available.
Otherwise leave unchanged and report the block.

### Phase D — Verification
After any approved remediation:
- run lint;
- run relevant tests;
- run production build;
- verify affected routes;
- confirm image loads;
- confirm no unrelated fields changed.

Verify:
- `/corals/zoanthids`
- `/equipment/hang-on-back-filter`

## REQUIRED OUTPUT

Create:
`DATABASE_IMAGE_REMEDIATION_CHECKPOINT.md`

Include:
1. Scope
2. Before State
3. Actions
4. Verification
5. Final Status
6. Remaining Backlog

Final status must be one of:
- `PASS`
- `PASS WITH ONE BLOCKED`
- `BLOCKED — OWNER ASSET REQUIRED`
- `FAIL`

## STRICT SCOPE CONTROL

Do NOT:
- modify the 12 low-quality images;
- modify image schemas;
- modify unrelated entities;
- change SEO;
- change layout/UI;
- change article content;
- create WEB-09;
- refactor unrelated code.

Only handle the two P1 findings.

## FINAL RESPONSE FORMAT

Status:
[PASS / PASS WITH ONE BLOCKED / BLOCKED / FAIL]

Zoanthids:
[status + exact action]

Hang-On-Back Filter:
[status + exact action]

Tests:
[result]

Build:
[result]

Production:
[affected routes]

Checkpoint:
`DATABASE_IMAGE_REMEDIATION_CHECKPOINT.md`

Remaining:
[only genuinely remaining owner asset requirements]
