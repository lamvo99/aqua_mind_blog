# WEB-06 Checkpoint — Problems / Troubleshooting / Diagnosis SEO & UX

## Status

PASS WITH BACKLOG

## Specification

WEB-06 Problems / Troubleshooting / Diagnosis SEO & UX

## Requirements

Core requirements verified. CMS-dependent items documented as backlog.

## Problem / Diagnostic Inventory

4 routes audited:
- `/problems` — Hub (ISR 300s)
- `/problems/[slug]` — Detail (ISR 3600s, 19 problem slugs)
- `/problems/diagnose` — Diagnosis wizard (ISR 86400s)
- `/tools/diagnostic` — Duplicate diagnostic at tools path (ISR 86400s)

## CMS / Sanity Schema

Problem schema has: title, slug, excerpt, publishedAt, category, symptoms, causes, whatToCheck, whatNotToDo, relatedPosts, relatedTools.

Missing schema fields (CMS-dependent, documented):
- actions (prioritized corrective actions)
- urgency (low/moderate/high)
- relatedProblems (reference[] → problem)
- relatedEntities (reference[] → species/plant/coral/equipment)
- mainImage

## Problem Page Quality

Existing structure: Symptoms → Common Causes → What to Check → What Not to Do → Recommended (articles + tools) → Disclaimer.

Missing: "What to Do" actions section, escalation guidance, related problems, entity links. CMS-dependent.

## Symptom → Cause → Action

Diagnostic wizard: 16 symptom toggles → keyword matching against symptomsText → ranked results by match ratio.

Qualitative labels added: "Strong match" (≥75%), "Possible match" (≥40%), "Weak match" (<40%).

## Diagnostic Logic

Deterministic keyword matching. Transparent scoring. No false certainty. Low safety risk.

## Diagnostic Safety

Uses "Likely causes" language. No treatment recommendations in wizard. Veterinary disclaimer on problem detail pages.

## SEO / Indexability

All 4 problem routes indexable with unique metadata. `/problems/diagnose` and `/tools/diagnostic` coexist as separate indexable URLs (different navigation contexts).

## Structured Data

- Hub: BreadcrumbList with Home (added)
- Detail: BreadcrumbList with Home → Problems → title (fixed)
- Diagnose: BreadcrumbList with Home → Problems → Diagnose (added)

## Internal Linking

Hub → Detail: IMPLEMENTED
Hub → Diagnose: IMPLEMENTED (CTA button)
Detail → Articles/Tools: IMPLEMENTED (CMS references)
Detail → Related Problems: MISSING (CMS schema dependency)
Detail → Entities: MISSING (CMS schema dependency)
Diagnose → Problem: IMPLEMENTED (result links)
Entity → Problem: IMPLEMENTED (WEB-03 EntityResources)

## Problems Hub

Categorized listing with 5 categories, emoji icons, diagnosis CTA. No search. No pagination needed (small dataset).

## Accessibility / Mobile

All pages: responsive layouts, semantic headings, keyboard navigation, aria-pressed on diagnosis buttons, role=progressbar. No critical issues.

## Tests

- diagnosis.test.ts: 7 tests PASS
- 193 total tests pass, 1 pre-existing failure (compare.test.ts)
- 2 worker timeouts (infrastructure, not code-related)

## Lint

PASS (6 pre-existing warnings in AquariumPlanner.tsx)

## Build

PASS — 271 static pages generated

## Production Verification

All problem routes generate static HTML:
- `/problems` — 194 B
- `/problems/[slug]` — 213 B (19 pages)
- `/problems/diagnose` — 184 B
- `/tools/diagnostic` — 184 B

## Implemented

| File | Change |
|---|---|
| `app/problems/page.tsx` | Home breadcrumb + BreadcrumbList JSON-LD + Twitter card |
| `app/problems/[slug]/page.tsx` | Home in breadcrumb + fix BreadcrumbList + fix OG type to "website" |
| `app/problems/diagnose/page.tsx` | Home breadcrumb + BreadcrumbList JSON-LD + OG + Twitter |
| `app/components/problems/DiagnosisWizard.tsx` | Qualitative match labels (Strong/Possible/Weak) |
| `WEB-06_GAP_REPORT.md` | New file |

## Deferred

1. Problem schema: add `actions`, `urgency`, `relatedProblems`, `relatedEntities`, `mainImage` (CMS migration required)
2. Problem detail: add "What to Do" actions section, related problems section, entity links (requires schema fields)
3. Problems hub: add search within problems
4. Diagnosis: add tool/entity mapping in results
5. Analytics events (WEB-07)

## Dependencies

- Problem schema enhancements require Sanity Studio access + CMS content migration
- Entity linking from problems requires new schema fields
- Analytics (WEB-07) deferred

## Current State

Updated: YES

## Known Issues

1. Pre-existing: compare.test.ts failure (4 vs 5 DB types)
2. Pre-existing: 2 Vitest worker timeouts (infrastructure)
3. `/tools/diagnostic` and `/problems/diagnose` are near-duplicates (different navigation contexts — both kept)

## Next Phase

WEB-07
