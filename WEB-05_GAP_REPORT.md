# WEB-05 Gap Report

## Status

PASS WITH BACKLOG

## Tool Inventory

| # | Tool | Route | Category | Client/Server | Indexable | Has HowTo | Has OG | Has Twitter |
|---|---|---|---|---|---|---|---|---|
| 1 | Setup Planner | `/setup-planner` | Setup | Client (ISR) | Yes | No | No | No |
| 2 | Aquarium Calculator | `/tools/aquarium-calculator` | Setup | Client | Yes | **No** | **No** | **No** |
| 3 | Volume Calculator | `/tools/aquarium-volume` | Setup | Client | Yes | Yes | **No** | **No** |
| 4 | Water Change | `/tools/water-change` | Water | Client | Yes | Yes | **No** | **No** |
| 5 | CO2 Estimator | `/tools/co2` | Planted | Client | Yes | Yes | **No** | **No** |
| 6 | Dosing | `/tools/dosing` | Water | Client | Yes | Yes | **No** | **No** |
| 7 | Pump Flow | `/tools/pump-flow` | Equipment | Client | Yes | Yes | **No** | **No** |
| 8 | Salt Mixing | `/tools/salt-mixing` | Water | Client | Yes | Yes | **No** | **No** |
| 9 | Lighting | `/tools/lighting` | Planted | Client | Yes | Yes | **No** | **No** |
| 10 | Stocking | `/tools/stocking` | Setup | Client | Yes | Yes | **No** | **No** |
| 11 | Compatibility Checker | `/tools/compatibility-checker` | Setup | ISR | Yes | Yes | **No** | **No** |
| 12 | Diagnostic | `/tools/diagnostic` | Troubleshoot | ISR | Yes | No | **No** | **No** |
| 13 | Finder | `/finder` | Discovery | ISR | Yes | No | **No** | **No** |
| — | Tools Hub | `/tools` | Hub | Static | Yes | No | Yes | **No** |

## SEO Metadata

| Issue | Pages Affected | Priority |
|---|---|---|
| Missing `openGraph` on 12 tool pages + finder | 13 pages | P1 |
| Missing `twitter` on all 14 tool/finder pages | 14 pages | P1 |
| CalculatorLayout breadcrumb lacks "Home" | 10 tool pages | P1 |
| Tools hub breadcrumb lacks "Home" | `/tools` | P1 |
| Finder breadcrumb lacks "Home" | `/finder` | P1 |
| Diagnostic breadcrumb lacks "Home" | `/tools/diagnostic` | P1 |

## JSON-LD

| Issue | Pages Affected | Priority |
|---|---|---|
| No `BreadcrumbList` on tools hub | `/tools` | P1 |
| No `BreadcrumbList` on finder | `/finder` | P1 |
| CalculatorLayout doesn't emit `BreadcrumbList` | 10 tool pages | P1 |
| No HowTo on aquarium-calculator | `/tools/aquarium-calculator` | P2 |
| Diagnostic uses BreadcrumbList only (no HowTo) | `/tools/diagnostic` | P2 |

## Breadcrumb Consistency

CalculatorLayout uses a custom inline breadcrumb (Calculator icon + text links) instead of the shared `<Breadcrumb>` component used by the rest of the site. This creates visual and structural inconsistency.

## Result UX

All calculators display results immediately after calculation. Units are clear. Validation provides per-field error messages. Disclaimers present on all tool pages. No issues found.

## Calculation Safety

All calculators use shared `validateDimension`/`validatePercent` helpers. Bounds checking present. Division by zero not possible in current formulas. No issues found.

## Internal Linking

WEB-03 established tool → article/entity relationships via `TOOL_LEARN_LINKS` and `EntityResources`. All 10 CalculatorLayout tools have "Related tools" and "Learn more" sections. Diagnostic and Finder have limited linking (no related tools section).

## Finder

- 4-question quiz matching fish/plants/corals
- ISR with 86400s revalidation
- BreadcrumbList JSON-LD missing
- Breadcrumb lacks "Home"
- No related tools section
- Mobile-friendly option buttons

## Test Coverage

34 calculator tests + 10 finder tests + 7 compatibility tests all passing. No missing critical test coverage.

## Implementation Scope

### Code-only fixes:
1. CalculatorLayout: Replace custom breadcrumb with `<Breadcrumb>` + add Home + emit `BreadcrumbList` JSON-LD
2. All 12 tool pages: Add `openGraph` and `twitter` metadata
3. Finder: Add `openGraph`, `twitter`, BreadcrumbList JSON-LD, fix breadcrumb Home
4. Diagnostic: Add `openGraph`, `twitter`, fix breadcrumb Home
5. Tools hub: Add BreadcrumbList JSON-LD with Home
6. Aquarium Calculator: Add HowTo JSON-LD
