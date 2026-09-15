# WEB-05 Checkpoint — Tools / Utility SEO & UX

## Verdict

**PASS WITH BACKLOG**

## Summary of Changes

### CalculatorLayout Breadcrumb + JSON-LD (`app/components/tools/CalculatorLayout.tsx`)
- Replaced custom inline breadcrumb (Calculator icon + text links) with shared `<Breadcrumb>` component
- Added "Home" → "Tools" → tool name breadcrumb path
- Added `BreadcrumbList` JSON-LD schema via `breadcrumbSchema()`
- Removed unused `Calculator` icon import, added `breadcrumbSchema` import

### Tools Hub (`app/tools/page.tsx`)
- Added "Home" to breadcrumb path
- Added `BreadcrumbList` JSON-LD schema with Home → Tools

### Finder (`app/finder/page.tsx`)
- Added `openGraph` metadata (title, description, type, locale)
- Added `twitter` card metadata (summary_large_image)
- Added "Home" to breadcrumb path
- Added `BreadcrumbList` JSON-LD schema with Home → Finder
- Wrapped return in fragment (`<>`) for JSON-LD + content

### Diagnostic (`app/tools/diagnostic/page.tsx`)
- Added `openGraph` metadata (title, description, type, locale)
- Added `twitter` card metadata (summary_large_image)
- Added "Home" to both visual breadcrumb and JSON-LD schema

### All 12 Tool Pages — OpenGraph + Twitter
Added `openGraph` and `twitter` metadata to:
1. `/tools/aquarium-volume` — Volume Calculator
2. `/tools/water-change` — Water Change Calculator
3. `/tools/co2` — CO₂ Estimator
4. `/tools/dosing` — Dosing Calculator
5. `/tools/pump-flow` — Pump & Filter Flow Calculator
6. `/tools/salt-mixing` — Salt Mixing Calculator
7. `/tools/lighting` — Aquarium Lighting Calculator
8. `/tools/stocking` — Fish Stocking Calculator
9. `/tools/compatibility-checker` — Compatibility Checker
10. `/tools/aquarium-calculator` — Aquarium Calculator (All-in-One)
11. `/setup-planner` — Setup Planner
12. `/tools/diagnostic` — Problem Diagnostic (listed above)

### Aquarium Calculator HowTo JSON-LD (`app/tools/aquarium-calculator/page.tsx`)
- Added `howTo` prop to `CalculatorLayout` with 4 steps:
  1. Enter tank dimensions
 2. Set substrate depth
 3. Choose stocking level
 4. Review all results

## Files Modified

| File | Change |
|---|---|
| `app/components/tools/CalculatorLayout.tsx` | Breadcrumb component + BreadcrumbList JSON-LD |
| `app/tools/page.tsx` | Home breadcrumb + BreadcrumbList JSON-LD |
| `app/finder/page.tsx` | OG, Twitter, Home breadcrumb, BreadcrumbList JSON-LD |
| `app/tools/diagnostic/page.tsx` | OG, Twitter, Home breadcrumb |
| `app/tools/aquarium-volume/page.tsx` | OG + Twitter metadata |
| `app/tools/water-change/page.tsx` | OG + Twitter metadata |
| `app/tools/co2/page.tsx` | OG + Twitter metadata |
| `app/tools/dosing/page.tsx` | OG + Twitter metadata |
| `app/tools/pump-flow/page.tsx` | OG + Twitter metadata |
| `app/tools/salt-mixing/page.tsx` | OG + Twitter metadata |
| `app/tools/lighting/page.tsx` | OG + Twitter metadata |
| `app/tools/stocking/page.tsx` | OG + Twitter metadata |
| `app/tools/compatibility-checker/page.tsx` | OG + Twitter metadata |
| `app/tools/aquarium-calculator/page.tsx` | OG + Twitter + HowTo JSON-LD |
| `app/setup-planner/page.tsx` | OG + Twitter metadata |
| `WEB-05_GAP_REPORT.md` | New file |

## Verification

| Check | Result |
|---|---|
| Lint | PASS (6 pre-existing warnings in AquariumPlanner.tsx) |
| Tests | 210 pass, 1 pre-existing failure (compare.test.ts) |
| Build | PASS (271 static pages, ~28s compile) |
| CalculatorLayout breadcrumb | Home → Tools → [Tool] with Breadcrumb component |
| BreadcrumbList JSON-LD | All 10 calculator tools + hub + finder + diagnostic |
| HowTo JSON-LD | All 10 calculator tools + compatibility-checker + aquarium-calculator |
| OpenGraph | All 14 tool/finder pages |
| Twitter cards | All 14 tool/finder pages |

## Backlog (CMS-dependent or deferred)

1. Tool descriptions could be richer (CMS-driven)
2. Per-tool FAQ sections (CMS-driven)
3. URL state sharing for calculator inputs
4. Calculator results sharing/saving
5. Related tools cross-linking on Finder/Diagnostic pages
6. Analytics events for calculator usage (WEB-07)
7. Some calculators (Co2, Volume, WaterChange) use custom forms instead of ToolForm primitives
