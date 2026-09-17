# WEBSITE_DATABASE_UX_DISCOVERY_PHASE_9

## Phase
WEB-09 — Database UX & Discovery Experience

## Objective

Build a polished, consistent, accessible, mobile-friendly Database Experience on top of the frozen DATABASE V1.

The goal is to make the existing 404-entity database, Search, Filters, Finder, and Relationships easy to discover and use.

This phase is a FRONTEND / UX / DISCOVERY phase.

### HARD SCOPE RULES

1. Do NOT add new database entities.
2. Do NOT change the frozen DATABASE V1 schema.
3. Do NOT invent new factual data.
4. Do NOT change existing relationship semantics.
5. Do NOT move content-production work into this phase.
6. Images are OUT OF SCOPE.
7. Do not modify content strategy, article briefs, or publishing workflow.
8. Existing Post-V1 database enrichment remains backlog work.
9. Preserve existing working Search, Filter, Finder, URL state, Compare, and Relationship behavior unless a SPEC explicitly improves its UX without changing semantics.
10. Work sequentially: SPEC 1 PASS → SPEC 2 → ... . If any SPEC fails, STOP and fix it before continuing.

---

# CURRENT BASELINE

DATABASE V1 is frozen at 404 entities:

- Species: 151
- Plants: 64
- Corals: 49
- Equipment: 47
- Invertebrates: 50
- Problems: 33
- Inspiration: 10

Database V1 has already passed:

- entity enumeration
- slug integrity
- required fields
- semantic vocabulary
- numeric integrity
- water-type consistency
- Search
- Filters
- Finder
- relationships
- dynamic routes
- GROQ/query performance audit

Database V1 freeze explicitly covers entity count, schema shapes, semantic fields, GROQ queries, Search/Filter behavior, Finder algorithm, and relationship structure.

Phase 9 must therefore treat DATABASE V1 as a stable platform, not a moving data target.

---

# SPEC-1 — Baseline & Codebase Audit

Before changing code:

1. Inspect current Database hub.
2. Inspect:
   - `/species`
   - `/plants`
   - `/corals`
   - `/equipment`
   - `/invertebrates`
   - `/problems`
3. Inspect all reusable:
   - database cards
   - grid/list components
   - filter components
   - search components
   - pagination/load components
   - relationship components
   - breadcrumbs
   - empty states
   - loading states
4. Inspect current responsive behavior.
5. Inspect existing tests.
6. Record current behavior before modifying anything.

Deliverable:

`DATABASE_UX_PHASE_9_BASELINE.md`

Required:

- route inventory
- component inventory
- current UX strengths
- current UX inconsistencies
- existing test coverage
- known limitations
- exact files likely to change

PASS criteria:

- baseline documented
- no code changes made before baseline
- no DATABASE V1 schema changes

---

# SPEC-2 — Database Information Architecture

Define and implement a consistent Database IA.

Primary structure:

Database
├── Species
├── Plants
├── Corals
├── Invertebrates
├── Equipment
└── Problems

Inspiration may remain a separate discovery surface and must not be incorrectly represented as an entity database category if current architecture treats it separately.

Database hub must clearly expose:

- what the database contains
- major entity categories
- Search entry
- Browse entry
- Finder entry where appropriate
- links to relevant tools where already available

Do not create unnecessary new navigation layers.

PASS criteria:

- user can reach every database domain from `/database`
- labels are consistent
- no dead links
- mobile navigation remains usable
- existing global navigation is not broken

---

# SPEC-3 — Unified Database Listing Shell

Create/reuse a common listing experience for:

- Species
- Plants
- Corals
- Equipment
- Invertebrates

Problems may use its existing specialized diagnosis/problem UX where appropriate.

The common shell should provide:

- page heading
- concise purpose/context
- search
- filters
- result count
- result grid/list
- clear/reset controls
- empty state
- responsive layout
- breadcrumb

Do not force identical fields across different domains.

Domain-specific filters must remain domain-specific.

PASS criteria:

- five entity listings have coherent visual and interaction patterns
- domain-specific semantics are preserved
- no duplicated implementation where reusable components are appropriate
- no regression to existing filter behavior

---

# SPEC-4 — Search UX

Improve search presentation without changing the underlying database semantics.

Requirements:

- clear search input
- obvious search state
- result count
- useful no-result state
- clear search action
- preserve URL state where current implementation supports it
- keyboard accessible
- mobile friendly
- search terms must not be silently discarded

If a global search surface already exists, integrate the Database experience with it rather than creating a competing search system.

PASS criteria:

- search works across supported entity types
- no-result state is clear
- search state survives intended navigation/back behavior
- no duplicate/conflicting search systems are introduced

---

# SPEC-5 — Filter UX

Improve usability of existing filters.

Requirements:

- group related filters logically
- distinguish primary filters from secondary filters when useful
- show active filters
- provide clear/reset
- preserve URL state
- responsive desktop/mobile behavior
- avoid excessive visual density
- filter combinations remain deterministic
- filter labels use existing controlled vocabulary

For mobile:

- filters must not permanently consume excessive viewport space
- use an appropriate drawer/sheet/collapsible pattern if already supported by project conventions

Do NOT add new filter dimensions unless they already exist in DATABASE V1.

PASS criteria:

- every existing filter dimension remains functional
- active filter state is visible
- reset returns to unfiltered state
- URL state roundtrip remains valid
- mobile filter interaction is usable

---

# SPEC-6 — Result Cards

Audit and standardize entity cards.

Cards should expose the most useful existing information for their domain.

General requirements:

- clear entity name
- scientific name where available/applicable
- key parameters or semantic badges where appropriate
- difficulty where available
- water type where available
- relevant category/type
- clear clickable affordance
- accessible focus state

Do not overload cards with every database field.

Do not invent missing values.

Null/unknown values should be omitted or represented according to existing project conventions.

PASS criteria:

- cards are visually coherent
- information hierarchy is clear
- cards are keyboard accessible
- no fabricated data
- no broken links

---

# SPEC-7 — Result Count, Empty, Loading & Error States

Create consistent states across database surfaces.

Required states:

1. Loading
2. Loaded with results
3. Loaded with zero results
4. Error
5. Optional partial/unknown state where applicable

Empty states should explain what happened and provide a useful next action:

- clear filters
- broaden search
- return to database
- use Finder where appropriate

Do not make claims about data that are not supported.

PASS criteria:

- no blank dead-end screen for expected empty/error/loading states
- states are accessible
- no layout-breaking flash or uncontrolled content shift

---

# SPEC-8 — Responsive Database UX

Audit at minimum:

- desktop
- tablet
- mobile

Check:

- filter controls
- cards
- headings
- breadcrumbs
- search
- result count
- relationship sections
- buttons/links
- horizontal overflow
- touch targets

Do not introduce a new responsive framework.

Use existing project styling conventions.

PASS criteria:

- no unintended horizontal overflow
- core database workflows work on mobile
- interactive controls have practical touch targets
- cards remain readable

---

# SPEC-9 — Entity Detail UX Consistency

Audit detail pages for:

- Species
- Plants
- Corals
- Equipment
- Invertebrates
- Problems where applicable

Create a consistent information hierarchy while preserving domain-specific fields.

Recommended conceptual order:

1. Breadcrumb
2. Entity identity
3. Key facts
4. Parameters/specifications
5. Compatibility/suitability
6. Relationships
7. Problems/issues where applicable
8. Tools/resources where already available
9. Related resources where already available

Do not force sections that have no valid data.

Do not alter relationship meaning.

PASS criteria:

- detail pages have predictable structure
- important facts are easy to scan
- relationship sections are discoverable
- no empty meaningless sections
- existing SEO metadata/schema behavior is preserved

---

# SPEC-10 — Relationship Discovery UX

The database already contains relationship structures.

Improve their presentation, not their semantics.

Relationship sections should:

- use clear labels
- distinguish relationship types
- link directly to entity pages
- handle empty relationships gracefully
- avoid circular visual repetition
- work on mobile

Where useful, group relationships such as:

- Compatible Plants
- Compatible Invertebrates
- Suitable Equipment
- Related Problems
- Related Resources

Only show a relationship section when the underlying data supports it.

PASS criteria:

- relationship navigation works end-to-end
- no broken entity URLs
- no misleading relationship labels
- empty relationship states are handled

---

# SPEC-11 — Database → Finder Integration

Make the relationship between Database browsing and Finder obvious.

Possible entry points:

- Database hub → Finder
- listing pages → Finder
- relevant empty states → Finder
- entity detail → Finder where contextually appropriate

Do not create duplicate Finder logic.

Do not modify the Finder algorithm unless required to fix a Phase 9 UX regression.

PASS criteria:

- Finder is discoverable
- links preserve intended navigation
- existing Finder URL state and result behavior remain intact

---

# SPEC-12 — Database → Tools Integration

Audit existing database/tool connections.

Where already supported, expose relevant tools contextually.

Examples:

- aquarium calculator
- water parameter tools
- diagnosis
- compatibility/finder tools

Rules:

- only link to existing tools
- no fake tool availability
- no content-production links invented
- preserve current tool semantics

PASS criteria:

- useful existing tools are discoverable from relevant database surfaces
- no dead or misleading links

---

# SPEC-13 — Accessibility

Audit and improve Database UX for accessibility.

Requirements:

- semantic headings
- keyboard navigation
- visible focus
- accessible labels
- form labels
- buttons vs links used correctly
- appropriate ARIA only where necessary
- sufficient target sizes
- no keyboard traps
- meaningful empty/error messages

Do not add unnecessary ARIA when native HTML semantics are sufficient.

PASS criteria:

- all core database workflows are keyboard usable
- interactive controls have accessible names
- focus state is visible
- heading hierarchy is coherent

---

# SPEC-14 — URL State & Shareability

Verify all existing URL-driven database states.

At minimum test:

- search
- filters
- filter combinations
- reset
- browser refresh
- back/forward
- direct URL opening

If an existing database page supports URL state, preserve it.

Do not introduce a second incompatible URL encoding scheme.

PASS criteria:

- URL → UI roundtrip works
- UI → URL roundtrip works
- refresh preserves state
- back/forward behaves predictably
- invalid parameters fail safely

---

# SPEC-15 — Performance & Rendering Audit

Do not redesign the data fetching architecture.

Verify:

- no N+1 queries
- no unnecessary client fetching
- no duplicate GROQ requests
- no large data transferred unnecessarily
- images/components do not cause avoidable layout problems
- listing pages remain responsive

Use existing Phase 8 performance baseline as comparison.

PASS criteria:

- no meaningful regression against Phase 8 baseline
- no N+1 introduced
- no unnecessary dependencies added

---

# SPEC-16 — SEO Preservation

Phase 9 must preserve the existing technical SEO baseline.

Verify:

- title
- description
- canonical
- robots behavior
- breadcrumbs
- JSON-LD where already implemented
- Open Graph/Twitter metadata
- entity detail indexing behavior

Do not redesign SEO strategy in this phase.

PASS criteria:

- no accidental noindex
- no canonical regression
- no broken metadata
- no broken structured data

---

# SPEC-17 — Test Coverage

Add/update tests for new UX behavior.

At minimum cover:

- database hub links
- listing rendering
- search state
- filter state
- reset behavior
- empty state
- relationship links
- Finder links
- URL roundtrip
- responsive-critical logic where testable

Do not delete existing tests merely to make the suite green.

The known pre-existing `compare.test.ts` failure must remain explicitly documented unless separately fixed.

PASS criteria:

- all new tests pass
- no new regression
- pre-existing failure remains isolated/documented

---

# SPEC-18 — Full QA

Run:

- tests
- ESLint
- TypeScript if possible
- production build

Important:

If TypeScript or build times out due to the known project issue, record:

`TIMEOUT — known project issue`

Do NOT report TIMEOUT as PASS.

Check:

- all database routes
- search
- filters
- Finder
- detail pages
- relationships
- mobile behavior
- keyboard workflow
- URL state
- no console errors introduced

PASS criteria:

- no new regressions
- lint PASS
- tests PASS except documented pre-existing failure
- timeout issues accurately reported
- critical routes manually verified

---

# SPEC-19 — Final UX Audit

Perform a final human-style walkthrough.

Journeys:

### Journey A — Browse
Database → Species → filter → result → detail

### Journey B — Search
Database → search → result → detail

### Journey C — Filter
Database → entity listing → multiple filters → reset

### Journey D — Finder
Database → Finder → answer questions → result → detail

### Journey E — Relationship
Species → compatible plants/equipment/problems → linked entity

### Journey F — Mobile
Mobile → Database → listing → filter → detail → relationship

### Journey G — URL
Filtered listing → copy URL → reopen → same state

PASS criteria:

- no dead ends
- no confusing navigation
- no broken state
- no misleading information
- all critical journeys complete

---

# SPEC-20 — Freeze / Checkpoint

Create:

`DATABASE_UX_DISCOVERY_PHASE_9_CHECKPOINT.md`

Also update:

`AQUA_BLOG_CURRENT_STATE.md`

Checkpoint MUST contain:

1. Phase status
2. Date
3. Branch
4. Baseline
5. Final state
6. Files changed
7. Components created/updated
8. Routes verified
9. Search verification
10. Filter verification
11. Finder verification
12. Relationship verification
13. Responsive verification
14. Accessibility verification
15. SEO verification
16. Performance verification
17. Test result
18. ESLint result
19. TypeScript result
20. Build result
21. Known pre-existing issues
22. New regressions
23. Deferred items
24. Next phase recommendation

### FINAL GATE

Only mark:

`PHASE 9 — PASS`

when all critical UX workflows work and no new regression exists.

Do NOT modify DATABASE V1 freeze state.

Do NOT add entities.

Do NOT silently fix unrelated backlog items.

---

# OUT OF SCOPE

- New database entities
- New database schema fields
- Database enrichment
- Content production
- Article writing
- Sanity editorial workflow
- Images
- Analytics
- Search Console
- Major SEO strategy changes
- New backend architecture
- Graph database
- Authentication redesign
- Monetization

---

# SUCCESS DEFINITION

Phase 9 succeeds when a visitor can enter the AquaMind Database and naturally:

Browse → Search → Filter → Compare/Inspect → Open Entity → Explore Relationships → Use Finder/Tools → Continue Discovery

without confusion, dead ends, broken URL state, or inconsistent UX.

The database remains the frozen 404-entity V1 platform.
