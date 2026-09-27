# WEB Native Table Block Phase 01 — Documentation

**Project:** AquaMind Blog
**Phase:** WEB Native Table Block Phase 01
**Date:** 2026-09-27

---

## 1. Overview

A reusable native **Table** block is now available in Sanity Portable Text and renders as a
responsive, accessible, semantic HTML `<table>` in the Next.js article frontend.

```text
Sanity Studio
    ↓ Portable Text
Table block
    ↓ Portable Text renderer
ResponsiveTable
    ↓
Semantic HTML <table>
```

This is an infrastructure phase. No database entity, no article, and no other Portable Text
block was changed, added, or migrated.

---

## 2. Table Schema

**Location:** `sanity/schemaTypes/table.ts`
**Type name:** `table` (object type, inserted into the Post `body` array)

Data model:

```text
Table
├── caption      (string, optional)
├── hasHeader    (boolean, default true)
├── columns[]    → { label }
└── rows[]       → { cells[] → { value } }
```

- Variable number of columns and rows.
- Cells are plain text (`value`). No raw HTML and no embedded JavaScript.
- Sanity auto-assigns `_key` to each column/row/cell for stable identity; rendering maps
  columns and cells **positionally** (cell N belongs to column N).
- Registered in `sanity/schemaTypes/index.ts` and enabled in the Post `body` array in
  `sanity/schemaTypes/post.ts`:

```ts
of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }, { type: 'code' }, { type: 'table' }]
```

Existing Post documents and existing Body content remain valid and untouched.

---

## 3. Studio Editing Procedure

Insert a table through the Body editor: **➕ → Table**.

Editing operations supported by the native Sanity array editor:

- Add / remove a column (edited via the Columns list).
- Add / remove a row (edited via the Rows list).
- Edit each column label (becomes the header cell when `hasHeader` is on).
- Edit each row cell (plain text).
- Edit the caption.
- Toggle **Show column labels as a header row** (`hasHeader`).

Cell/column mapping is positional: the first cell of each row belongs to the first column.

### TSV Paste (OPTIONAL — deferred)

Pasting tab-separated values copied from Excel/Google Sheets was evaluated. The required
custom Sanity Studio editor (grid UI + multi-line textarea + TSV → model conversion) is a
disproportionate custom-editor effort for Phase 01, so **TSV paste is DEFERRED** per the SPEC-02
rule. The standard array editor remains the supported input path.

---

## 4. Renderer

**Location:** `app/components/ResponsiveTable.tsx`

- Server component (no `use client`), no client-side JavaScript added.
- Rendered by the existing portable-text pipeline when `_type === 'table'`:
  `app/components/PortableText.tsx` routes the block to `ResponsiveTable`.
- No table-specific rendering logic lives in the article page.

## 5. Responsive Behavior

- Desktop: normal readable `<table>` with the project's editorial styling.
- Mobile: horizontal scrolling belongs to the table wrapper (`overflow-x-auto`,
  `min-w-[480px]`), never to the document/body — the page itself never overflows.
- Touch scrolling works (native scroll container).
- Long text wraps inside cells (`break-words`); columns remain understandable.

## 6. Accessibility

- Semantic `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` structure.
- Header cells use `<th scope="col">`.
- `<caption>` reflects the table caption for screen readers.
- No information is communicated only by color (zebra striping is decorative, headers are
  distinguished by position/`th` too).
- Cell text renders through React's automatic escaping — no `dangerouslySetInnerHTML`,
  no arbitrary raw HTML from Sanity cells.

## 7. Testing Approach

**File:** `tests/responsive-table.test.tsx` (Vitest 4, `@vitest-environment jsdom`,
project conventions)

Covered: schema/data shape (static schema registration checks), renderer basics, header
rendering (`th scope="col"`), no-header rendering, caption, empty cells, multiple
columns/rows, long text, responsive wrapper, plain-text safety (XSS payload test), and a
full Portable Text regression fixture (paragraph + H2 + image + code + table + paragraph)
that also mocks `next/image` and `@/lib/sanity` `urlFor`.

Run with: `npx vitest run`.

## 8. Content Workflow Contract — `[TABLE XX]`

For content production, `[TABLE 01]`, `[TABLE 02]`, … is a **content placeholder**, NOT
literal article body content. It marks where the editor must create a native Table block.

ChatGPT editorial output should provide, next to the placeholder:

```text
[TABLE 01]

Purpose:
Summarize recommended water parameters.

Columns:
1. Parameter
2. Target
3. Safe Range

Rows:
1. pH | 6.8 | 6.5 – 7.2
2. Temperature | 25°C | 24 – 27°C
```

The editor then creates the native Table block in Sanity Studio (caption, header toggle,
columns, rows) and publishes.

**Markdown tables must NOT be pasted into Body as the long-term workflow.**

## 9. Known Limitations

- Plain-text cells only (no rich text, links, or images inside cells) in Phase 01.
- No TSV paste (deferred; see above).
- No sticky header (deferred — optional, see SPEC-05).
- Live Sanity Studio click-through requires a Vercel redeploy (schema ships via git;
  local `npx sanity deploy` times out in this environment).

---

## 10. Verification Status (summary)

| Check | Result |
|-------|--------|
| TypeScript | PASS |
| ESLint | PASS (6 pre-existing warnings, AquariumPlanner.tsx) |
| Tests | 253/254 PASS (1 pre-existing `compare.test.ts` failure) |
| Production Build | PASS (563 pages) |
| Security audit (no `dangerouslySetInnerHTML`) | PASS |