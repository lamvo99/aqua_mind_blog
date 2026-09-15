# AquaMind Web — WEB-04 Database / Entity SEO Architecture

**Version:** 1.0  
**Status:** Strategy + implementation specification  
**Scope:** SEO architecture for structured aquarium entities and their landing pages  
**Out of scope:** Choosing the next article topic; keyword-volume prioritization; article production workflow

---

## 1. Purpose

WEB-04 defines how AquaMind should turn its structured database entities into useful, indexable, interconnected organic landing pages.

Current entity families documented in the project source-of-truth are:

- Species
- Plants
- Corals
- Equipment
- Invertebrates

The site also has `/wiki` as a unified searchable database surface and `/database` as a database hub.

The objective is **not** to create thin database records for SEO. The objective is to make each indexable entity page useful enough to satisfy a clear user intent, while connecting the entity to articles, problems, tools, learning paths, styles and related entities.

---

## 2. Current-State Basis

This specification is based on `AQUA_BLOG_CURRENT_STATE.md`.

The current source-of-truth documents these implemented routes:

| Surface | Route | Current role |
|---|---|---|
| Species list | `/species` | Filterable species grid + compare |
| Species detail | `/species/[slug]` | Care parameters + compatible species |
| Plant list | `/plants` | Filterable plant grid + compare |
| Plant detail | `/plants/[slug]` | Care parameters |
| Coral list | `/corals` | Filterable coral grid + compare |
| Coral detail | `/corals/[slug]` | Care parameters |
| Equipment list | `/equipment` | Filterable equipment grid + compare |
| Equipment detail | `/equipment/[slug]` | Specs + pros/cons |
| Invertebrate list | `/invertebrates` | Filterable invertebrate grid + compare |
| Invertebrate detail | `/invertebrates/[slug]` | Care parameters |
| Wiki | `/wiki` | Unified searchable database |
| Database | `/database` | Links to all database families |

The Sanity source contains schemas for `species`, `plant`, `coral`, `equipment`, `invertebrate`, and `post`, among others. The documented `species` schema already includes references such as `compatibleSpecies` and `relatedPosts`; the `post` schema includes `relatedPosts`.

The current article detail also has a `RelatedDatabase` component that surfaces related species/plants/corals.

These are strong foundations. WEB-04 should extend them rather than replace them.

---

# 3. Strategic Principle

A database record is not automatically an SEO landing page.

A useful entity page should answer a user question such as:

- What is this?
- Is it suitable for my aquarium?
- How large does it get?
- What water parameters does it need?
- What does it eat?
- What can it live with?
- What equipment or environment does it need?
- What common problems should I watch for?
- Which AquaMind guides explain the topic further?

Therefore the target is:

```text
ENTITY DATA
    ↓
USEFUL ENTITY PAGE
    ↓
SEARCH INTENT SATISFACTION
    ↓
RELATED KNOWLEDGE
    ↓
TOOLS / PROBLEMS / GUIDES
    ↓
DEEPER AQUAMIND SESSION
```

---

# 4. Entity SEO Model

AquaMind should treat each entity as a node in the site's knowledge graph.

```text
                         ENTITY
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       PROFILE          CARE DATA       RELATIONSHIPS
          │                │                │
          ↓                ↓                ↓
      DESCRIPTION     PARAMETERS      COMPATIBILITY
          │                                │
          ├───────────────┬────────────────┘
          ↓               ↓
       ARTICLES        PROBLEMS
          │               │
          └───────┬───────┘
                  ↓
                TOOLS
                  ↓
           LEARNING PATHS
```

The entity is therefore not an isolated page. It is an anchor connecting structured data with editorial content.

---

# 5. Entity Families

## 5.1 Species

Primary user intents:

- species identification / overview;
- care requirements;
- tank size;
- water parameters;
- diet;
- behavior;
- temperament;
- compatibility;
- schooling/social needs;
- breeding where supported;
- common problems;
- related guides.

Recommended page structure:

```text
Breadcrumb
↓
H1 + common/scientific name
↓
Hero / identity summary
↓
Quick facts
↓
Care requirements
↓
Tank / environment
↓
Water parameters
↓
Diet
↓
Behavior / temperament
↓
Compatibility
↓
Common problems
↓
Related articles
↓
Related tools
↓
Related species
```

Do not render fields that have no meaningful data merely to increase page length.

---

## 5.2 Plants

Primary intents:

- plant identification;
- placement / foreground / midground / background;
- light requirements;
- CO2 requirements;
- nutrients;
- growth rate;
- difficulty;
- propagation;
- compatible aquarium conditions;
- algae / deficiency issues;
- related aquascaping styles.

Target relationship graph:

```text
Plant
├──→ Plant Care
├──→ CO2 / Lighting Guide
├──→ Aquascaping Style
├──→ Related Plants
├──→ Problems
└──→ Articles
```

---

## 5.3 Corals

Primary intents:

- coral identification;
- reef suitability;
- placement;
- lighting;
- flow;
- feeding;
- aggression / compatibility;
- water chemistry;
- difficulty;
- common problems;
- reef-system guides.

Coral pages should clearly distinguish freshwater concepts from marine/reef concepts and avoid cross-linking that creates semantic confusion.

---

## 5.4 Equipment

Primary intents:

- what the equipment does;
- specifications;
- suitable tank size/use case;
- strengths and limitations;
- setup;
- maintenance;
- compatibility with other equipment;
- alternatives;
- relevant calculators/guides;
- reviews where actual editorial content exists.

Recommended structure:

```text
Equipment
↓
What it does
↓
Specifications
↓
Best use cases
↓
Pros / limitations
↓
Setup
↓
Maintenance
↓
Compatibility
↓
Related guides
↓
Related tools
```

Do not turn every equipment record into a thin commercial page. The page must provide useful information independent of affiliate/commercial intent.

---

## 5.5 Invertebrates

Primary intents:

- care;
- tank requirements;
- water parameters;
- diet;
- behavior;
- compatibility;
- breeding where relevant;
- common problems;
- related species/plants/articles.

The implementation should share common entity infrastructure with Species where practical, but content semantics must remain distinct.

---

# 6. Indexability Policy

Not every database state should automatically be indexed.

## Index by default when:

- the entity is published/active;
- it has a stable canonical slug;
- it has sufficient meaningful content/data;
- the page returns 200;
- the page is not a duplicate of another entity;
- the entity is intentionally part of AquaMind's public knowledge base.

## Do not target for indexing when:

- the record is draft/private;
- the record is empty or effectively thin;
- the URL is only a temporary filter state;
- the page is a duplicate/alias with no distinct intent;
- the entity is not intended for public discovery.

Important: do **not** mass-`noindex` existing entity pages without first auditing actual content quality and Search Console behavior.

---

# 7. Canonical Rules

Each primary entity should self-canonicalize:

```text
/species/neon-tetra
→ canonical: /species/neon-tetra
```

Filtered listing states such as:

```text
/species?type=schooling
/species?difficulty=easy
```

must be treated as UI/filter states unless AquaMind deliberately promotes a dedicated landing page for that intent.

Do not create thousands of canonical variants.

---

# 8. Entity URL Strategy

Keep the existing stable family routes unless a separate technical audit proves a migration is necessary:

```text
/species/[slug]
/plants/[slug]
/corals/[slug]
/equipment/[slug]
/invertebrates/[slug]
```

The route itself should communicate entity type.

Avoid:

```text
/wiki/neon-tetra
/entity/neon-tetra
/item/neon-tetra
```

for the primary species URL if `/species/[slug]` already serves that purpose.

`/wiki` should remain a discovery/search surface rather than creating a second canonical page for every entity.

---

# 9. Wiki vs Entity Pages

This distinction must remain explicit.

## `/wiki`

Purpose:

> Find and explore knowledge across entity families.

It is a **directory/discovery interface**.

## `/species/[slug]`, `/plants/[slug]`, etc.

Purpose:

> Be the canonical destination for a specific entity.

Therefore:

```text
Wiki
  ↓
Entity page
  ↓
Knowledge graph
```

Do not duplicate the full entity content inside Wiki.

---

# 10. Database Hub

`/database` should act as the top-level entry point to structured knowledge.

Target model:

```text
/database
│
├── Species
├── Plants
├── Corals
├── Invertebrates
├── Equipment
└── Wiki
```

The page should explain what each database contains and when a user should use it.

This is a navigation/architecture page, not a place to dump all entity content.

---

# 11. Entity → Article Linking

Every entity page should have editorial links when relevant.

Examples:

```text
Neon Tetra
├──→ The Easiest Aquarium Fish for Beginners
├──→ Beginner Fish Guide
├──→ Schooling Fish Guide
└──→ Compatible Tank Mates
```

The exact article set should come from actual Sanity references/content relationships, not fabricated links.

If there is no relevant article, do not create a fake “related article” block.

---

# 12. Article → Entity Linking

Articles should link to important entities when the entity is genuinely discussed.

Current source-of-truth already documents a `RelatedDatabase` component on article pages.

WEB-04 should extend this toward a consistent pattern:

```text
Article body
   ↓
Contextual entity links
   ↓
Related database entities
```

Example:

```text
Article: Best Beginner Fish
        ↓
Neon Tetra
Corydoras
Betta
Guppy
```

The body link and related entity module serve different purposes and can coexist.

---

# 13. Entity → Problem Linking

Where a problem is relevant to an entity, expose it.

Example:

```text
Species
  ↓
Common Problems
  ├── Fish Hiding
  ├── Loss of Appetite
  └── Gasping
```

Do not imply that every problem applies to every species. Relationships must be editorially meaningful.

---

# 14. Entity → Tool Linking

Tools should be surfaced when they help the user act on the entity.

Examples:

```text
Species
→ Stocking Calculator
→ Compatibility Checker

Plant
→ Lighting Calculator
→ CO2 Calculator

Coral
→ Salt / Water tools where applicable

Equipment
→ Pump Flow Calculator
→ Aquarium Volume Calculator
```

Only show tools that are genuinely relevant to the entity type/use case.

---

# 15. Entity → Learning Path

Where an entity fits a beginner or advanced learning sequence:

```text
Entity
  ↓
Relevant Learning Path
```

Example:

```text
Beginner species
→ Beginner Aquarium Setup
→ Choosing Your First Fish
```

This creates a path from reference knowledge to education.

---

# 16. Entity → Entity Relationships

Use relationships carefully.

Useful relationship types include:

- compatible with;
- similar to;
- alternative to;
- commonly kept with;
- requires;
- commonly associated with;
- related plant;
- related equipment.

The existing source-of-truth explicitly documents `compatibleSpecies` on Species.

Do not infer compatibility solely from taxonomy or name similarity.

---

# 17. Data Completeness Model

Each entity should have a quality state.

Suggested internal model:

```text
DRAFT
↓
BASIC
↓
COMPLETE
↓
ENRICHED
```

### BASIC

Minimum identity information and a useful summary.

### COMPLETE

Enough information to satisfy the entity's main care intent.

### ENRICHED

Additional relationships, articles, tools, problems and high-quality media.

Only entities meeting the site's indexability threshold should be exposed as strong SEO landing pages.

---

# 18. Avoid Thin-Content at Scale

This is the biggest SEO risk of a database-heavy site.

AquaMind should not do this:

```text
1,000 entities
↓
1,000 pages
↓
Mostly identical templates
↓
Very little unique information
```

Instead:

```text
Structured facts
+
Unique entity-specific information
+
Useful relationships
+
Relevant editorial resources
```

Template consistency is good. Content duplication is not.

---

# 19. Entity Page SEO Metadata

Every indexable entity should have:

- unique title;
- useful meta description;
- canonical URL;
- Open Graph metadata;
- appropriate social image where available;
- breadcrumb;
- descriptive H1;
- meaningful image alt text;
- structured data only when the schema accurately represents the page.

Do not generate keyword-stuffed titles such as:

```text
Neon Tetra | Neon Tetra Care | Neon Tetra Tank Size | Neon Tetra Food | AquaMind
```

Prefer natural titles based on the page's actual value proposition.

---

# 20. Structured Data

WEB-04 should audit the structured data currently used by entity pages before adding anything new.

Principles:

1. Schema must describe visible page content.
2. Do not invent properties that the database does not support.
3. Do not mark every entity as a Product merely because it can be purchased somewhere.
4. Do not add unsupported review/rating data.
5. Validate generated JSON-LD.

The project source-of-truth already documents JSON-LD infrastructure for Article/Breadcrumb/Organization and notes structured-data support. Entity-specific schema should be added only where appropriate and supported by the actual content.

---

# 21. Breadcrumb Strategy

Entity breadcrumbs should follow the IA, not arbitrary relationships.

Examples:

```text
Home
→ Database
→ Fish
→ Neon Tetra
```

```text
Home
→ Database
→ Plants
→ Anubias Nana
```

```text
Home
→ Database
→ Equipment
→ Canister Filter
```

If a user arrived from an article, the breadcrumb should still represent the canonical site hierarchy rather than the user's previous click path.

---

# 22. Related Content Modules

Entity detail pages should eventually support a consistent module sequence:

```text
Related Articles
↓
Common Problems
↓
Useful Tools
↓
Related Entities
↓
Learning Resources
```

Do not display empty modules.

Do not show unrelated random content merely to fill a grid.

---

# 23. Search / Discovery

The existing Wiki provides unified searchable discovery across the documented entity families.

Search should route users to canonical entity pages.

Example:

```text
Search: neon tetra
        ↓
Species result
        ↓
/species/neon-tetra
```

Do not create indexable search-result pages for every query.

---

# 24. Filters and Compare

Current database lists support filtering and comparison.

These are primarily **interactive utilities**.

Default policy:

```text
Entity detail → indexable
Entity listing → indexable
Filter state → utility unless promoted intentionally
Compare state → utility
```

Do not create an SEO page for every combination of filters.

If a filter combination proves strategically valuable later, create a dedicated landing page with its own content and canonical URL rather than exposing an infinite faceted URL space.

---

# 25. Entity Linking Governance

Every relationship should have a reason.

Recommended relationship classes in the data model:

```text
relatedPosts
compatibleSpecies
relatedPlants
relatedEquipment
relatedProblems
relatedTools
relatedCollections
relatedStyles
```

Only add fields that are actually useful to the product.

Prefer explicit editorial references for high-value relationships over fully automatic fuzzy matching.

Automatic suggestions can be used as an editor-assistance feature, but publishing should remain controlled.

---

# 26. Sanity CMS Recommendations

The existing Sanity schemas should be extended incrementally.

Potential reusable relationship fields:

```text
relatedPosts[]
relatedProblems[]
relatedTools[]
relatedCollections[]
relatedEntities[]
```

However, avoid adding every possible reference field to every schema.

Use the smallest model that supports the intended user journey.

Where relationships are symmetric, define a clear ownership/source of truth to prevent inconsistent duplicate editing.

---

# 27. Query / Fetch Strategy

The source-of-truth documents two main Sanity data-fetching approaches:

- centralized database helpers;
- direct Sanity GROQ for several feature areas.

WEB-04 should prefer reusable query helpers for entity relationships where practical.

Target concept:

```text
getSpeciesBySlug()
getRelatedPostsForSpecies()
getRelatedProblemsForSpecies()
getRelatedToolsForSpecies()
getRelatedSpecies()
```

Do not introduce a separate backend or database solely for entity SEO.

---

# 28. Performance Requirements

Entity pages must preserve the current server-rendering/ISR architecture where practical.

The current source-of-truth documents ISR for database lists and entity detail routes.

Do not turn all entity pages into large client components merely to support filters, compare, or animations.

Interactive controls should remain isolated to client components.

---

# 29. Entity SEO Measurement

After implementation, monitor entity pages separately from articles.

Recommended metrics:

```text
Indexed entity pages
Organic impressions
Organic clicks
Average position
CTR
Landing-page sessions
Pages/session
Entity → article clicks
Entity → tool clicks
Entity → problem clicks
Entity → related entity clicks
```

The purpose is to learn which entity families actually attract organic users.

This data should be fed to the **Quản lý chủ đề** chat only when it informs content decisions. WEB-04 itself does not decide the next article topic.

---

# 30. Implementation Plan — WEB-04

## 04A — Entity Inventory Audit

Create an inventory of all published records across:

- Species
- Plants
- Corals
- Equipment
- Invertebrates

For each record capture:

- slug;
- title/name;
- publication state;
- image;
- description/content completeness;
- relationships;
- related posts;
- indexability state;
- canonical;
- metadata.

### Acceptance

No unexplained public entity route remains outside the inventory.

---

## 04B — Entity Quality Audit

Score each entity for completeness.

Suggested dimensions:

```text
Identity
Description
Care data
Unique information
Image
Relationships
Related editorial content
```

### Acceptance

The team can distinguish useful entity pages from thin records.

---

## 04C — Canonical / Metadata Audit

Verify all five entity families.

### Acceptance

Every intended indexable entity has correct canonical and metadata.

---

## 04D — Relationship Architecture

Implement or normalize the most useful relationship types.

Start with:

```text
Entity ↔ Article
Entity ↔ Entity
Entity ↔ Problem
Entity ↔ Tool
Entity ↔ Learning Path
```

Do not implement all relationship types at once if the CMS data does not support them yet.

---

## 04E — Entity Page UX

Create a shared entity-detail information architecture while preserving family-specific content.

Common shell:

```text
Breadcrumb
Hero
Quick facts
Core information
Care / requirements
Relationships
Related resources
```

Family-specific sections remain unique.

---

## 04F — Internal Linking Integration

Connect WEB-04 with WEB-03.

Ensure:

```text
Article → Entity
Entity → Article
Entity → Problem
Entity → Tool
Entity → Entity
```

works consistently.

---

## 04G — SEO Validation

Validate:

- indexability;
- canonical;
- metadata;
- structured data where applicable;
- breadcrumbs;
- sitemap inclusion;
- internal links;
- 404 behavior;
- mobile rendering.

---

## 04H — Automated Regression Tests

Add tests for:

```text
✓ Published entity has stable slug
✓ Indexable entity has canonical
✓ Entity route resolves
✓ Missing entity returns 404
✓ No duplicate canonical
✓ Sitemap contains intended entities
✓ Relationship links resolve
✓ No empty relationship sections render
✓ JSON-LD remains valid where used
```

---

# 31. Definition of Done

WEB-04 is complete when:

```text
✓ All five entity families inventoried
✓ Entity quality model defined
✓ Indexability rules documented
✓ Canonical rules implemented/verified
✓ Metadata verified
✓ Wiki/entity distinction preserved
✓ Entity → article links supported
✓ Entity → entity links supported
✓ Entity → problem links supported where relevant
✓ Entity → tool links supported where relevant
✓ Entity → learning path links supported where relevant
✓ Filter/compare states remain controlled
✓ Thin-content risk documented and guarded
✓ Entity UX uses a consistent information architecture
✓ Sitemap integration verified
✓ Automated tests pass
✓ Build/analyze pass
✓ CURRENT_STATE updated
```

---

# 32. What WEB-04 Must NOT Do

Do not:

- create thousands of thin SEO pages;
- fabricate entity facts;
- fabricate compatibility;
- add fake ratings/reviews;
- create infinite filter-index pages;
- duplicate Wiki content onto every entity;
- replace the current Next.js + Sanity architecture;
- create a separate backend solely for SEO;
- automatically generate large amounts of low-quality prose;
- decide which new article should be written next.

---

# 33. Relationship to the Three AquaMind Work Chats

## 🌐 Xây dựng website
Owns:

- entity architecture;
- entity page UX;
- indexability;
- canonical/metadata implementation;
- relationships;
- internal linking infrastructure;
- database SEO system.

## 🗂️ Quản lý chủ đề
Owns:

- Search Console analysis;
- SERP research;
- keyword/content gaps;
- content priority;
- deciding which article/topic comes next;
- article refresh priorities.

WEB-04 may provide entity traffic data to this chat, but does not choose the publishing queue.

## ✍️ Viết Content
Owns:

- production of a selected article/topic;
- following `AquaMind_CONTENT_PRODUCTION_WORKFLOW.md`;
- editorial quality;
- article SEO metadata/content according to the workflow.

---

# 34. Future Direction

Once WEB-04 is stable, AquaMind should be able to evolve toward:

```text
                     AQUAMIND KNOWLEDGE GRAPH
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
       ARTICLES             ENTITIES             PROBLEMS
          │                    │                    │
          └──────────────┬─────┴──────┬─────────────┘
                         ↓            ↓
                       TOOLS      LEARNING PATHS
                         │            │
                         └─────┬──────┘
                               ↓
                          USER JOURNEY
```

The long-term competitive advantage is not simply “more articles”. It is a connected aquarium knowledge system where a user can enter from Google through an article, entity, problem or tool and continue naturally through the ecosystem.

---

# 35. Next Website Phase

After WEB-04, the next planned workstream is:

## WEB-05 — Tools SEO Architecture

Focus:

- tool landing pages;
- calculator SEO;
- utility vs indexable state;
- tool → article links;
- tool → entity links;
- tool → problem links;
- formulas/explanations;
- structured data where appropriate;
- performance;
- measurement.

WEB-05 remains separate from content-topic prioritization.
