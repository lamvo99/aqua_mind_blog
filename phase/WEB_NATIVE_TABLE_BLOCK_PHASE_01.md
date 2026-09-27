# WEB NATIVE TABLE BLOCK — PHASE 01
## Sanity Portable Text Native Table Support

**Project:** AquaMind Blog  
**Phase:** WEB Native Table Block Phase 01  
**Objective:** Add a reusable native Table block to Sanity Portable Text and render it correctly in the Next.js article frontend.

---

# 0. Mission

AquaMind currently uses Sanity Portable Text for article bodies.

This phase adds:

```text
Sanity Studio
    ↓
Portable Text
    └── Table block
          ↓
Next.js Portable Text renderer
          ↓
Semantic HTML <table>
          ↓
Responsive desktop/mobile UI
```

The long-term content workflow will use native Table blocks instead of Markdown tables pasted into the Body.

---

# 1. Non-Negotiable Rules

1. Work only on website infrastructure.
2. Do NOT expand or modify the database.
3. Do NOT create new article/content types.
4. Do NOT migrate all existing articles.
5. Do NOT replace Portable Text.
6. Do NOT create a second Body architecture.
7. Do NOT store raw HTML tables.
8. Do NOT depend on Markdown table parsing.
9. Do NOT add a large dependency merely to implement tables.
10. Existing Portable Text content must continue rendering exactly as before.
11. Accuracy and backward compatibility take priority over convenience.
12. If a SPEC fails, STOP immediately and report the failure.
13. Do not silently work around a failed SPEC.
14. After PASS, create checkpoint and update `AQUA_BLOG_CURRENT_STATE.md`.

---

# 2. Scope

## IN SCOPE

- Sanity Post schema
- Portable Text Body schema
- Native Table block
- Sanity Studio editor UI
- Portable Text renderer
- Responsive table component
- Accessibility
- Table styling
- Tests
- SEO regression
- Existing article regression
- TypeScript
- ESLint
- Production build
- Documentation/checkpoint

## OUT OF SCOPE

- Database expansion
- Database schema changes
- Entity content
- Article writing
- Article migration
- Search redesign
- Finder changes
- Analytics
- i18n
- SEO redesign
- Markdown parser
- Raw HTML authoring
- New Sanity document types
- Content production workflow redesign beyond the Table marker convention

---

# SPEC-00 — Baseline & Architecture Audit

## Objective

Understand the current implementation before modifying anything.

## Inspect

Identify the canonical:

- Sanity Post document schema
- `body` field
- Portable Text configuration
- existing custom Portable Text blocks
- Portable Text renderer
- article detail page
- shared article components
- styling system
- TypeScript types
- test structure
- build/lint/typecheck commands

Search the codebase rather than assuming filenames.

## Required output

Create a short audit record containing:

```text
Post schema:
Body field:
Portable Text schema:
Custom blocks:
Portable Text renderer:
Article route:
Styling architecture:
Relevant tests:
Build command:
Lint command:
Typecheck command:
```

## Hard Stop

STOP if:

- canonical Body cannot be identified
- multiple competing Body implementations exist and cannot be resolved safely
- adding Table requires replacing the current Portable Text architecture
- current baseline has unexplained blocking failures

Do not fix unrelated problems in this SPEC.

---

# SPEC-01 — Canonical Table Data Model

## Objective

Define one reusable generic Table block.

Recommended conceptual model:

```text
Table
├── caption?
├── hasHeader
├── columns[]
└── rows[]
```

A practical implementation may use:

```text
columns:
[
  {
    key,
    label
  }
]

rows:
[
  {
    cells: [
      {
        value
      }
    ]
  }
]
```

Use the project's established Sanity schema conventions.

## Requirements

- Variable number of columns.
- Variable number of rows.
- Optional caption.
- Optional header row.
- Empty cells handled safely.
- No hard-coded aquarium-specific columns.
- No article-specific table types.
- No raw HTML.
- No embedded arbitrary JavaScript.
- Cell content must be safely represented by the schema.
- Existing Portable Text blocks remain unchanged.

## Important

Do not over-engineer rich Portable Text inside every cell unless the existing architecture clearly requires it.

For Phase 01, plain text cells are preferred unless there is a demonstrated requirement for richer cell content.

## Validation

Confirm:

- schema compiles
- Studio can load the schema
- existing Post documents remain valid
- existing Body content is untouched

---

# SPEC-02 — Sanity Studio Table Editor

## Objective

Allow editors to create and edit tables directly in Sanity Studio.

The editor must make the table structure obvious.

Minimum operations:

- Add column
- Remove column
- Add row
- Remove row
- Edit header
- Edit cells
- Edit caption
- Toggle/use header row according to chosen schema

Conceptual UX:

```text
Insert → Table

Caption: __________________

Header:
[✓] Use first row as header

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
|          |          |          |
|          |          |          |

[+ Add Row]
[+ Add Column]
```

Use existing Sanity Studio patterns where possible.

## TSV Paste — OPTIONAL

If it can be implemented safely without major editor complexity:

Allow pasting tab-separated values copied from Excel/Google Sheets.

Example:

```text
What you see    Identification    Check first
Green dust      Green film        Lighting
Green dots      GSA               Light + nutrients
```

If TSV paste requires disproportionate custom editor work:

**DEFER IT.**

Do not block the phase.

---

# SPEC-03 — Portable Text Renderer

## Objective

Render the Table block in the existing article Portable Text pipeline.

Architecture should remain conceptually:

```text
PortableText
├── paragraph
├── heading
├── image
├── callout
├── code
└── table
      ↓
ResponsiveTable
```

Create a reusable `ResponsiveTable` component if appropriate.

Do not put table-specific rendering logic directly into the Article page.

## Requirements

- Server rendering where the current architecture allows it.
- No unnecessary client component.
- Reuse existing typography/layout conventions.
- Safely render all cell values.
- Missing/empty values must not crash rendering.

---

# SPEC-04 — Semantic HTML

## Objective

Render real semantic HTML tables.

With a header:

```html
<table>
  <caption>...</caption>
  <thead>
    <tr>
      <th scope="col">...</th>
      <th scope="col">...</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>...</td>
      <td>...</td>
    </tr>
  </tbody>
</table>
```

Without a header:

```html
<table>
  <tbody>
    ...
  </tbody>
</table>
```

## Requirements

- `<table>`
- `<caption>` when supplied
- `<thead>` when header exists
- `<tbody>`
- `<th scope="col">`
- `<td>`

Do not emulate tables with arbitrary `<div>` structures.

---

# SPEC-05 — Responsive UX

## Desktop

Use a normal readable table.

## Mobile

Use horizontal scrolling rather than converting the table into unrelated cards.

Concept:

```text
Article width
┌──────────────────────────────┐
│ ← horizontal table scroll →  │
│                              │
│ What you see | ID | Check → │
└──────────────────────────────┘
```

## Requirements

- Horizontal overflow belongs to the table wrapper, not the whole page.
- No horizontal overflow on the document/body caused by a table.
- Touch scrolling works.
- Long text wraps appropriately.
- Columns remain understandable.
- Table remains readable on narrow screens.
- Existing article layout is not broken.

Optional sticky header may be implemented only if it is clean and accessible.

---

# SPEC-06 — AquaMind Visual Design

The table must fit the current AquaMind article design.

Audit existing:

- typography
- spacing
- border conventions
- background conventions
- dark mode behavior, if applicable
- article max-width
- mobile breakpoints

Use the existing design system.

Do NOT introduce a separate visual language.

Target:

> Clean, editorial, information-dense, easy to scan.

The table should look appropriate for:

- algae comparisons
- GH/KH/TDS
- filter comparisons
- lighting comparisons
- substrate comparisons
- shrimp parameters
- coral requirements
- equipment comparisons

---

# SPEC-07 — Accessibility & Content Safety

## Accessibility

Verify:

- semantic table structure
- header cells use `<th>`
- `scope="col"` where appropriate
- caption support
- keyboard usability
- screen-reader interpretation
- no information communicated only by color
- sufficient focus visibility if interactive controls exist

## Security/content safety

Do not use unnecessary `dangerouslySetInnerHTML`.

Table cell content should be safely rendered using the existing content rendering model.

Do not allow arbitrary raw HTML from Sanity table cells.

---

# SPEC-08 — Existing Article Regression

This SPEC is mandatory.

Verify existing articles containing:

- paragraphs
- H2/H3/H4
- lists
- links
- images
- captions
- callouts
- code blocks
- inline marks
- existing custom blocks

continue to render correctly.

## Table fixture

Even if no production article uses a Table yet, create a test fixture/example containing:

```text
3 columns
3+ rows
header
caption
empty cell
long text
```

Verify it renders correctly.

## Important

Do NOT migrate existing production articles during this phase.

---

# SPEC-09 — SEO / Performance / Functional Regression

Verify the new block does not break:

- Article JSON-LD
- Breadcrumb JSON-LD
- Table of Contents
- heading anchors
- reading time calculation
- metadata generation
- canonical URL
- OG metadata
- article route rendering

The Table block must not introduce fake headings.

## Performance

- Avoid unnecessary client-side JavaScript.
- Avoid large dependencies.
- Prefer server rendering.
- Do not duplicate article data fetching.

---

# SPEC-10 — Automated Tests

Add appropriate tests for:

1. Table schema/data shape
2. Table renderer
3. Header rendering
4. No-header rendering
5. Caption rendering
6. Empty cell
7. Multiple columns
8. Multiple rows
9. Long text
10. Responsive wrapper
11. Existing Portable Text regression

Use the project's existing test framework and conventions.

Do not create a second test framework.

---

# SPEC-11 — Full Verification

Run the project's canonical commands.

Expected categories:

```text
Tests: PASS
ESLint: PASS
TypeScript: PASS
Production Build: PASS
```

Use the exact project scripts discovered in SPEC-00.

If there are pre-existing failures:

- identify them
- compare against baseline
- do not mislabel them as caused by this phase

If a NEW failure appears:

**STOP.**

Do not proceed to checkpoint until resolved.

---

# SPEC-12 — Production Smoke Test

After build passes, verify:

## Studio

- Post opens.
- Existing Body opens.
- Table block can be inserted.
- Table can be edited.
- Table can be saved.
- Table can be reopened.

## Website

Verify an article containing a Table fixture:

- desktop
- mobile
- dark mode if applicable
- long cell content
- empty cell
- header
- no-header
- caption

Verify no:

- 404
- hydration error
- console error
- layout overflow
- broken Portable Text block

---

# SPEC-13 — Content Workflow Contract

Document the new content convention.

For content production:

```text
[TABLE 01]
```

is a content placeholder, NOT literal article body content.

ChatGPT editorial output should provide:

```text
[TABLE 01]

Purpose:
...

Columns:
1. ...
2. ...
3. ...

Rows:
1. ...
2. ...
3. ...
```

The editor then creates the native Table block in Sanity.

Markdown tables must NOT be pasted into Body as the long-term workflow.

This SPEC does not modify the broader content production workflow document unless explicitly requested.

---

# SPEC-14 — Documentation

Document:

- Table schema
- Studio editing procedure
- renderer location
- responsive behavior
- accessibility behavior
- testing approach
- known limitations
- optional TSV paste status
- how content editors should handle `[TABLE XX]`

Keep documentation concise and project-consistent.

---

# SPEC-15 — Final QA & Checkpoint

Create:

```text
report/WEB_NATIVE_TABLE_BLOCK_PHASE_01_CHECKPOINT.md
```

Required sections:

```text
# WEB Native Table Block Phase 01 Checkpoint

Status:
Date:
Branch:

## Baseline
...

## SPEC Results
SPEC-00:
SPEC-01:
...
SPEC-15:

## Schema
...

## Studio
...

## Renderer
...

## Responsive
...

## Accessibility
...

## Regression
...

## Tests
...

## ESLint
...

## TypeScript
...

## Build
...

## Files Changed
...

## Deferred
...

## Known Issues
...

## Final Verdict
PASS / FAIL
```

Then update:

```text
AQUA_BLOG_CURRENT_STATE.md
```

Add a concise section recording:

- Phase status
- native Table block availability
- renderer
- responsive behavior
- test/build status
- deferred items

---

# FINAL DEFINITION OF DONE

Phase 01 is complete only when all are true:

```text
[ ] SPEC-00 baseline audit PASS
[ ] SPEC-01 canonical Table model PASS
[ ] SPEC-02 Sanity Studio editor PASS
[ ] SPEC-03 Portable Text renderer PASS
[ ] SPEC-04 semantic HTML PASS
[ ] SPEC-05 responsive UX PASS
[ ] SPEC-06 AquaMind styling PASS
[ ] SPEC-07 accessibility/security PASS
[ ] SPEC-08 existing article regression PASS
[ ] SPEC-09 SEO/performance regression PASS
[ ] SPEC-10 tests PASS
[ ] SPEC-11 lint/typecheck/build PASS
[ ] SPEC-12 production smoke test PASS
[ ] SPEC-13 content workflow contract documented
[ ] SPEC-14 documentation PASS
[ ] SPEC-15 checkpoint created
[ ] AQUA_BLOG_CURRENT_STATE.md updated
```

## Final decision rule

If any required item fails:

> **PHASE = FAIL**

Stop and report:

```text
Failed SPEC:
Reason:
Evidence:
Impact:
Recommended next action:
```

Do not silently continue.

---

# Expected End State

Sanity:

```text
Post
 └── Body
      ├── Text
      ├── Image
      ├── Callout
      ├── Code
      └── Table
```

Frontend:

```text
Portable Text
      ↓
Table block
      ↓
ResponsiveTable
      ↓
<table>
```

Content workflow:

```text
Draft
  ↓
Editorial
  ↓
[TABLE 01]
  ↓
Sanity Native Table
  ↓
Published Article
```

This is an infrastructure phase only. Do not expand the database or migrate existing articles.
