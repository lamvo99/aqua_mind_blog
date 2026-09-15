# WEB-06 Gap Report — Problems / Troubleshooting / Diagnosis

## Status

PASS WITH BACKLOG

---

## Problem / Diagnostic Inventory

| Route | Type | Purpose | Data Source | Rendering | Indexable | Has OG | Has Twitter | Breadcrumb Home | JSON-LD |
|---|---|---|---|---|---|---|---|---|---|
| `/problems` | Hub | Problem listing by category | Sanity (getProblemsList) | Server (ISR 300s) | Yes | Yes | **No** | **No** | **No BreadcrumbList** |
| `/problems/[slug]` | Detail | Individual problem guide | Sanity (direct GROQ) | Server (ISR 3600s) | Yes | Yes (type: "article") | Yes | **No** | BreadcrumbList only |
| `/problems/diagnose` | Diagnostic | Symptom picker → ranked results | Sanity (problems) | Server (ISR 86400s) | Yes | **No** | **No** | **No** | **None** |
| `/tools/diagnostic` | Diagnostic (duplicate) | Same wizard at different URL | Sanity (problems) | Server (ISR 86400s) | Yes | Yes | Yes | Yes | BreadcrumbList |

---

## Sanity / CMS Schema

**Problem schema fields:**

| Field | Type | Status |
|---|---|---|
| title | string | IMPLEMENTED |
| slug | slug | IMPLEMENTED |
| excerpt | text | IMPLEMENTED |
| publishedAt | datetime | IMPLEMENTED |
| category | string (enum: water/algae/plants/fish/equipment) | IMPLEMENTED |
| symptoms | block[] | IMPLEMENTED |
| causes | block[] | IMPLEMENTED |
| whatToCheck | block[] | IMPLEMENTED |
| whatNotToDo | block[] | IMPLEMENTED |
| relatedPosts | reference[] → post | IMPLEMENTED |
| relatedTools | reference[] → tool | IMPLEMENTED |
| actions | — | **NOT IN SCHEMA** |
| urgency | — | **NOT IN SCHEMA** |
| caveats | — | **NOT IN SCHEMA** |
| relatedEntities | — | **NOT IN SCHEMA** (only relatedPosts/relatedTools) |
| relatedProblems | — | **NOT IN SCHEMA** |
| images / mainImage | — | **NOT IN SCHEMA** |
| seo (metaTitle, metaDescription) | — | **NOT IN SCHEMA** |

**Missing schema fields (documented, CMS-dependent):**
- `actions` — prioritized corrective actions (Immediate → Today → Monitor)
- `urgency` — low/moderate/high
- `relatedProblems` — reference[] → problem
- `relatedEntities` — reference[] → species/plant/coral/equipment
- `mainImage` — problem illustration

---

## Problem Page Quality

**Detail page structure (`/problems/[slug]`):**

| Section | Status | Notes |
|---|---|---|
| Breadcrumb | PARTIAL | Missing Home link |
| H1 | IMPLEMENTED | Title from CMS |
| Short answer / summary | IMPLEMENTED | Excerpt |
| Symptoms | IMPLEMENTED | PortableText from CMS |
| Common Causes | IMPLEMENTED | PortableText from CMS |
| What to Check | IMPLEMENTED | PortableText from CMS |
| What to Do / Actions | **MISSING** | Schema field does not exist |
| What Not to Do | IMPLEMENTED | PortableText from CMS |
| When to escalate | **MISSING** | No urgency field in schema |
| Related tools | IMPLEMENTED | CMS reference, displayed in "Recommended" section |
| Related articles | IMPLEMENTED | CMS reference, displayed in "Recommended" section |
| Related problems | **MISSING** | No schema field, no component |
| Related entities | **MISSING** | No schema field, no component |
| FAQ | N/A | Not required per spec unless genuinely useful |
| Disclaimer | IMPLEMENTED | Veterinary disclaimer at bottom |

---

## Symptom → Cause → Action Flow

**Problem page flow:**
- Symptoms → Causes → What to Check → What Not to Do → Recommended (articles + tools)
- **Missing:** What to Do (actions), escalation guidance, monitoring steps
- **Assessment:** Core flow is present; action escalation is CMS-dependent

**Diagnostic flow:**
- Select symptoms → Ranked results → Link to problem page
- **Assessment:** Works; limited to keyword matching on symptomsText

---

## Diagnostic Logic

| Aspect | Status | Notes |
|---|---|---|
| Inputs | IMPLEMENTED | 16 symptom toggle buttons |
| Scoring | IMPLEMENTED | keyword match ratio (matched/selected × 100) |
| Ranking | IMPLEMENTED | Score desc, then matched count desc |
| Results | IMPLEMENTED | Top 6 results with score, category, matched symptoms |
| No-match state | IMPLEMENTED | "No known problem matches" with link to /problems |
| Empty state | IMPLEMENTED | "Select at least one symptom" |
| Reset | IMPLEMENTED | Clear all button |
| Problem linking | IMPLEMENTED | Each result links to /problems/[slug] |
| Confidence communication | PARTIAL | Shows % but no qualitative label |
| Tool mapping | **MISSING** | Results don't link to relevant tools |
| Entity mapping | **MISSING** | Results don't link to relevant entities |
| Back behavior | N/A | Single-page wizard, no steps to go back |
| Progressive disclosure | N/A | All symptoms shown at once (not step-by-step) |

---

## Diagnostic Safety

| Aspect | Status | Notes |
|---|---|---|
| False certainty | LOW RISK | Uses "Likely causes" language, not "You have X" |
| Missing alternatives | PARTIAL | Shows ranked list but no "what to check next" |
| Unsafe recommendations | LOW RISK | No treatment recommendations in wizard |
| Missing escalation | N/A | No treatment advice given |
| Veterinary disclaimer | IMPLEMENTED | On problem detail pages |

---

## SEO Intent

**Problem hub (`/problems`):**
- Primary intent: "aquarium problems" / "fish sick" / "algae help"
- Unique value: Categorized problem database with diagnosis tool
- Classification: INDEXABLE / STRONG

**Problem detail (`/problems/[slug]`):**
- Primary intent: Specific problem (e.g., "fish gasping", "cloudy water")
- Unique value: Structured symptoms/causes/checks guidance
- Classification: INDEXABLE / STRONG (for pages with real content)

**Diagnose (`/problems/diagnose`):**
- Primary intent: "diagnose fish disease" / "aquarium symptom checker"
- Unique value: Interactive symptom matcher
- Classification: INDEXABLE (utility page, but diagnose page itself has value)

---

## Thin-Page / Index-Bloat

No thin pages detected. All problem pages require CMS content to exist. Empty CMS = no page rendered (getProblemsList returns empty → "coming soon" message on hub). No auto-generated combination pages.

---

## Metadata / Canonical / Robots

| Page | Title | Description | Canonical | OG | Twitter | Robots |
|---|---|---|---|---|---|---|
| `/problems` | "Aquarium Problem Solver — AquaMind" | Yes | Yes | Yes | **MISSING** | Default |
| `/problems/[slug]` | "{title} — Aquarium Problem" | Yes (excerpt) | Yes | Yes (type: "article") | Yes | Default |
| `/problems/diagnose` | "Diagnose Your Aquarium Problem — AquaMind" | Yes | Yes | **MISSING** | **MISSING** | Default |

**Issues:**
1. `/problems` missing Twitter card
2. `/problems/diagnose` missing OG + Twitter
3. `/problems/[slug]` OG type is "article" — should be "website" (consistent with WEB-04 pattern for non-article pages)

---

## Structured Data

| Page | BreadcrumbList | Other | Notes |
|---|---|---|---|
| `/problems` | **MISSING** | None | Needs BreadcrumbList with Home |
| `/problems/[slug]` | Yes (Problems → title) | None | Missing Home in breadcrumb chain |
| `/problems/diagnose` | **MISSING** | None | Needs BreadcrumbList |

---

## Breadcrumbs

| Page | Breadcrumb | Home Link | JSON-LD |
|---|---|---|---|
| `/problems` | Problems (only) | **No** | **No** |
| `/problems/[slug]` | Problems → title | **No** | Yes (missing Home) |
| `/problems/diagnose` | Problems → Diagnose | **No** | **No** |

---

## Internal Linking

| From → To | Status | Notes |
|---|---|---|
| Hub → Detail | IMPLEMENTED | Category-grouped cards link to /problems/[slug] |
| Hub → Diagnose | IMPLEMENTED | "Diagnose my problem" CTA button |
| Detail → Hub | IMPLEMENTED | "All problems" back link |
| Detail → Articles | IMPLEMENTED | relatedPosts in "Recommended" |
| Detail → Tools | IMPLEMENTED | relatedTools in "Recommended" |
| Detail → Entities | **MISSING** | No related species/plants/corals links |
| Detail → Related Problems | **MISSING** | No related problems links |
| Detail → Learning Paths | **MISSING** | No learning path links |
| Diagnose → Problem | IMPLEMENTED | Each result links to /problems/[slug] |
| Diagnose → Hub | IMPLEMENTED | "full problems list" link in empty state |
| Article → Problem | IMPLEMENTED | EntityResources links to /problems |
| Entity → Problem | IMPLEMENTED | EntityResources links to /problems |
| Tool → Problem | IMPLEMENTED | related.ts links tools → /problems |

---

## Entity Relationships

Problems connect to:
- Articles: via `relatedPosts` (CMS reference) — IMPLEMENTED
- Tools: via `relatedTools` (CMS reference) — IMPLEMENTED
- Entities (species/plant/coral): **NOT IN SCHEMA** — documented dependency
- Related problems: **NOT IN SCHEMA** — documented dependency

---

## Diagnostic → Resource Flow

Current flow:
```
Diagnosis result → /problems/[slug] → (relatedPosts, relatedTools)
```

Missing:
- Diagnosis result → Problem → Entity links
- Diagnosis result → Relevant tool links (e.g., water issue → Water Change Calculator)
- Diagnosis result → Learning path links

---

## Problems Hub

| Aspect | Status |
|---|---|
| Purpose | IMPLEMENTED — Categorized problem listing |
| Category organization | IMPLEMENTED — 5 categories with emoji icons |
| Cards | IMPLEMENTED — Title + excerpt per problem |
| Descriptions | PARTIAL — Excerpt only, no per-category description |
| Crawlable links | IMPLEMENTED — Standard <Link> elements |
| Pagination | N/A — All problems listed (small dataset) |
| Filters | N/A — Category sections serve as filter |
| Search | **MISSING** — No search within problems |
| Empty state | IMPLEMENTED — "Problem guides coming soon" |
| Duplicate entries | None detected |
| Indexability | IMPLEMENTED |

---

## Filter / Query Safety

No URL-based filter/query parameters on problem pages. Diagnosis state is client-side only. No crawl trap risk.

---

## Accessibility

| Page | Headings | Labels | Keyboard | Focus | ARIA | Mobile |
|---|---|---|---|---|---|---|
| Hub | h1, h2 per category | Links | Yes | Default | Minimal | Yes |
| Detail | h1, h2 per section | Links | Yes | Default | Minimal | Yes |
| Diagnose | h1 | Buttons, progress bar | Yes | Default | aria-pressed, role=progressbar | Yes |

No critical accessibility issues found. Minor: problem hub cards lack explicit group labels.

---

## Mobile UX

All problem pages use responsive layouts. Diagnosis wizard uses `lg:grid-cols-[minmax(0,1fr)_360px]` — on mobile, results panel stacks below symptom list. No horizontal overflow detected. Tap targets are adequate (button-based symptom selection).

---

## Performance

- Problem hub: Server Component, ISR 300s — good
- Problem detail: Server Component, ISR 3600s — good
- Diagnose: Server Component + Client wizard, ISR 86400s — good
- No N+1 queries detected
- DiagnosisWizard uses `useMemo` for scoring — efficient
- No unnecessary client JS beyond the wizard

---

## Test Coverage

| Area | Status |
|---|---|
| diagnosis.ts | IMPLEMENTED — 7 tests (keyword match, ranking, edge cases) |
| Problem rendering | **NOT TESTED** |
| Problem queries | **NOT TESTED** |
| SEO metadata | **NOT TESTED** |
| JSON-LD | **NOT TESTED** |
| Breadcrumb | **NOT TESTED** |

---

## Duplicate Route

`/tools/diagnostic` is a near-exact duplicate of `/problems/diagnose`:
- Same `DiagnosisWizard` component
- Same data fetching
- Different breadcrumbs and surrounding layout
- Both are indexable with unique metadata

**Decision:** Keep both routes (they serve different navigation contexts). Document the relationship.

---

## WEB-04 Dependencies

No WEB-04 dependencies blocking WEB-06. Entity → Problem linking already works via `EntityResources`.

---

## Implementation Scope (Code-Only Fixes)

### P1 — High Priority

1. **Problems hub** (`app/problems/page.tsx`): Add Home breadcrumb + BreadcrumbList JSON-LD + Twitter card
2. **Problem detail** (`app/problems/[slug]/page.tsx`): Add Home to breadcrumb + fix BreadcrumbList JSON-LD to include Home + fix OG type from "article" to "website"
3. **Diagnose page** (`app/problems/diagnose/page.tsx`): Add Home breadcrumb + BreadcrumbList JSON-LD + OG + Twitter
4. **Duplicate diagnostic** (`app/tools/diagnostic/page.tsx`): Add Home to breadcrumb + fix BreadcrumbList to include Home

### P2 — Medium Priority

5. **DiagnosisWizard** (`app/components/problems/DiagnosisWizard.tsx`): Add qualitative match labels ("Strong match" / "Possible match") alongside percentage

### Deferred (CMS-dependent or later phase)

- Problem schema: add `actions`, `urgency`, `relatedProblems`, `relatedEntities`, `mainImage`
- Problem detail: add "What to Do" actions section, related problems section, entity links
- Hub: add search within problems
- Analytics events (WEB-07)
- Content gap: many problems may lack sufficient CMS content for some fields
