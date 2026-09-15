# AquaMind WEB-02 — Information Architecture Audit & Target Architecture

## 1. Purpose

This document defines the Information Architecture (IA) audit and target architecture for the AquaMind production website.

It is based on:
- `AQUA_BLOG_CURRENT_STATE.md` — source-code audit of the current production codebase.
- Current production site structure observed on `https://www.aquamind.life/`.

This phase is **not a content publishing plan**. It does not decide which article should be written next. Content priority remains the responsibility of the separate “Quản lý chủ đề” workflow.

## 2. Current Architecture

AquaMind currently has these major product/content surfaces:

- Articles: `/posts`, `/posts/[slug]`
- Categories: `/category/[slug]`
- Database: `/database`
- Species: `/species`, `/species/[slug]`
- Plants: `/plants`, `/plants/[slug]`
- Corals: `/corals`, `/corals/[slug]`
- Equipment: `/equipment`, `/equipment/[slug]`
- Invertebrates: `/invertebrates`, `/invertebrates/[slug]`
- Problems: `/problems`, `/problems/[slug]`, `/problems/diagnose`
- Tools: `/tools/*`
- Learn: `/learn`, `/learn/[slug]`
- Start Here: `/start-here`
- Styles: `/styles/[slug]`
- Inspiration: `/inspiration`, `/inspiration/[slug]`
- Finder: `/finder`
- Setup Planner: `/setup-planner`
- Wiki: `/wiki`
- Search: `/search`

The current global navigation exposes Start Here, Articles, Learn Paths, Tools, Database, Problems, Inspiration and About. Database is a dropdown containing Wiki, Fish, Invertebrates, Plants, Corals and Equipment.

## 3. Current Strengths

1. AquaMind already has multiple strong information surfaces rather than being a blog-only site.
2. The site has a useful beginner journey at `/start-here`.
3. Learning paths provide structured progression.
4. Problems and diagnostic tools provide task-oriented discovery.
5. Tools provide utility-oriented entry points.
6. Database provides entity-oriented discovery.
7. Articles provide informational depth.
8. Related posts, related database entries and wiki promotions already create cross-surface linking.
9. Current pages are responsive and generally consistent.
10. The architecture can be improved incrementally without a rebuild.

## 4. Main IA Problems

### 4.1 Navigation is product-surface oriented, but not yet intent-oriented

The top navigation lists features/surfaces. It does not explicitly communicate the main user jobs:

- Learn
- Identify / choose
- Solve a problem
- Calculate / plan
- Explore entities
- Get inspiration

This is not necessarily a defect, but it creates a discoverability opportunity.

### 4.2 Taxonomy overlap exists

The current category system contains overlapping concepts such as:

- Aquarium / Aquarium Care / Learning Center / Beginner Guides
- Aquarium Equipment / Equipment / Equipment Reviews / Reviews
- Aquascaping / Aquascape Styles / World Aquascaping
- DIY & Projects / DIY Aquarium
- Freshwater / Freshwater Fish / Species Guides
- Saltwater & Reef / Corals & Reef / Marine Fish & Invertebrates
- Pest & Problems / Diseases & Treatment / Tips & Tricks

These should not all be treated as equivalent top-level navigation concepts.

### 4.3 Categories are currently doing several jobs at once

A category can represent:
- editorial topic
- content type
- audience level
- ecosystem
- commercial intent
- problem type
- media/distribution topic

These dimensions should be separated conceptually even if the existing CMS schema remains unchanged in the first implementation.

### 4.4 Database, Wiki and entity pages overlap conceptually

The site has `/database`, `/wiki`, and five entity databases. This is useful but can confuse the mental model unless their roles are explicitly defined.

### 4.5 Tools and Problems are currently treated as separate destinations

For users, these are often part of the same workflow:

Problem → check parameter → use tool → read guide → inspect entity.

The architecture should make these relationships explicit.

## 5. Target Information Architecture

The target model is a **task + knowledge architecture**, not a pure category tree.

```text
AquaMind
│
├── Learn
│   ├── Start Here
│   ├── Learning Paths
│   └── Articles
│
├── Explore
│   ├── Fish
│   ├── Plants
│   ├── Corals
│   ├── Invertebrates
│   ├── Equipment
│   └── Aquascaping Styles / Inspiration
│
├── Solve
│   ├── Problems
│   ├── Diagnosis
│   └── Guides / Troubleshooting
│
├── Tools
│   ├── Calculators
│   ├── Setup Planner
│   └── Finder / Compatibility
│
└── About / Community
```

This is a conceptual IA. Existing URLs do not need to be changed simply to match this model.

## 6. Recommended Top-Level Navigation

Recommended long-term navigation:

- Start Here
- Learn
- Explore
- Solve
- Tools
- Database / Explore entities
- Inspiration
- Search

However, because the current navigation is already usable, **do not redesign the navbar immediately**. First implement the underlying hierarchy and cross-linking rules.

## 7. Role of Each Surface

### Start Here

Primary onboarding hub.

Goal:
- first-time visitor orientation
- beginner journey
- direct links to essential guides, tools and database pages

### Learn

Structured education.

Contains:
- learning paths
- foundational guides
- articles

### Articles

Broad editorial knowledge layer.

Articles should link into entities, problems and tools when relevant.

### Explore / Database

Entity discovery layer.

Examples:
- species
- plants
- corals
- equipment
- invertebrates

Each entity should be able to link back to relevant guides, problems, tools and related entities.

### Solve

Problem-first user journey.

```text
Symptom
→ Problem
→ Causes
→ Checks
→ Tool / Parameter
→ Recommended action
→ Related guide
```

### Tools

Utility layer.

Tools should not be isolated calculators. Each tool should link to explanations, relevant articles, problems and entities where appropriate.

### Inspiration

Visual discovery layer.

It should connect styles → inspiration scenes → plants → equipment → relevant guides.

## 8. Hub Model

AquaMind should evolve toward a small number of strong hubs rather than many equally important category pages.

Recommended hub families:

1. Beginner Aquarium Hub
2. Water Quality Hub
3. Fish Hub
4. Aquascaping & Plants Hub
5. Equipment Hub
6. Problems & Troubleshooting Hub
7. Marine & Reef Hub
8. Tools Hub
9. Aquarium Database Hub

The exact editorial topics inside each hub are owned by the separate Topic Management workflow.

## 9. Internal Linking Model

The target graph should look like:

```text
Article
 ↕
Hub
 ↕
Entity
 ↕
Problem
 ↕
Tool
 ↕
Learning Path
```

Examples:

```text
Fish article
→ species page
→ compatibility tool
→ stocking tool
→ fish problem
→ beginner guide
```

```text
Water-quality article
→ parameter explanation
→ diagnostic problem
→ water-change tool
→ nitrogen-cycle guide
```

```text
Aquascape style
→ inspiration scene
→ plant entities
→ equipment entities
→ aquascaping guide
```

## 10. Category Policy

Do not delete or rename existing categories in this phase without evidence.

Instead classify categories into conceptual dimensions:

### Topic
Aquascaping, aquarium care, equipment, water quality, etc.

### Ecosystem
Freshwater, saltwater/reef, terrarium/paludarium, etc.

### Entity
Fish, plants, corals, invertebrates, equipment.

### Intent
Beginner, how-to, troubleshooting, review, buying, reference.

### Format / distribution
Social media, photography, community, lifestyle.

The current Sanity category model can remain stable while these relationships are expressed through hub pages and internal links.

## 11. Search and Filters

Search remains a utility, not a primary content hierarchy.

The following should be treated carefully:

- `/search?q=...`
- filtered `/posts` states
- database filters
- inspiration filters
- wiki filters

Do not allow utility state to become the de facto information architecture.

## 12. Breadcrumb Strategy

Breadcrumbs should express the user's conceptual path, not merely the URL path.

Preferred examples:

```text
Home → Learn → Beginner Guides → Article
Home → Explore → Fish → Species
Home → Solve → Problems → Fish Hiding
Home → Tools → Water Change Calculator
Home → Inspiration → Iwagumi
```

The exact breadcrumb labels can differ from URLs.

## 13. Homepage Role

The homepage should remain the **gateway**, not become a giant directory.

Recommended future homepage priorities:

1. Clear value proposition
2. Start Here / beginner entry
3. Featured/high-value content
4. Major knowledge pathways
5. Problem-solving entry
6. Tools / utility entry
7. Latest content
8. Newsletter / retention

Do not add every database, category and feature to the homepage.

## 14. Database vs Wiki

Recommended distinction:

### Database
Structured entity collection.

Examples:
- Fish
- Plants
- Corals
- Equipment
- Invertebrates

### Wiki
Unified knowledge browser across those entities.

The Wiki should remain a discovery/search layer, not a duplicate database navigation tree.

## 15. Problems + Tools Relationship

Problems and tools should form a diagnostic loop.

```text
Problem
 ↓
What to check?
 ↓
Relevant parameter
 ↓
Relevant calculator/tool
 ↓
Interpretation
 ↓
Recommended guide
```

This is one of AquaMind's strongest opportunities for differentiation.

## 16. Learning Paths Relationship

Learning Paths should aggregate existing resources rather than create an isolated content silo.

Each step can link to:
- article
- database entity
- tool
- problem
- next step

This creates a structured route through the broader knowledge graph.

## 17. Inspiration Relationship

Inspiration should connect visual examples to actionable knowledge:

```text
Inspiration Scene
→ Style
→ Plants
→ Equipment
→ Fish / Livestock
→ Setup Guide
```

## 18. What NOT to Change in WEB-02

- Do not rebuild Next.js routing.
- Do not migrate Sanity.
- Do not rename all existing URLs.
- Do not delete categories simply because they overlap.
- Do not create hundreds of new hub pages.
- Do not redesign the homepage solely for SEO.
- Do not add content topics here.
- Do not introduce a large navigation redesign before validating the IA.

## 19. Recommended Implementation Order

### WEB-02A — IA Inventory

Create a complete inventory of all current page types, navigation entries, categories, database entities, tools, learning paths, problems and inspiration.

### WEB-02B — Surface Roles

Document the role of each surface and identify overlaps.

### WEB-02C — Hub Model

Define the small set of primary hub concepts.

### WEB-02D — Navigation Mapping

Map existing navigation to the target conceptual model without immediately changing URLs.

### WEB-02E — Internal-Link Rules

Define contextual linking rules between articles, hubs, entities, problems, tools and learning paths.

### WEB-02F — Breadcrumb Rules

Make breadcrumbs consistent with the conceptual hierarchy.

### WEB-02G — Category Governance

Document which categories are editorial topics, ecosystems, intents or distribution topics.

### WEB-02H — Validation

Check:
- no orphaned primary surfaces
- important pages reachable within reasonable click depth
- no duplicate navigation concepts
- no critical surface hidden behind an unclear label
- mobile navigation remains usable

## 20. Acceptance Criteria

WEB-02 is DONE when:

- [ ] Every major route has a documented IA role.
- [ ] Every navigation item maps to a clear user intent.
- [ ] Database vs Wiki responsibilities are documented.
- [ ] Problems vs Tools responsibilities are documented.
- [ ] Learning Paths aggregate existing resources correctly.
- [ ] Inspiration links to actionable knowledge.
- [ ] Category overlap is documented without destructive renaming.
- [ ] Hub concepts are defined.
- [ ] Internal-link rules are documented.
- [ ] Breadcrumb rules are documented.
- [ ] Search/filter URLs remain utility surfaces unless intentionally promoted.
- [ ] No major URL migration is introduced without evidence.
- [ ] Existing tests/build continue to pass.
- [ ] `AQUA_BLOG_CURRENT_STATE.md` is updated after implementation.

## 21. Priority

**Priority: P1 — High**

Reason: AquaMind already has a large multi-surface architecture. Improving the conceptual hierarchy and linking system will increase discoverability and make future content scale safer, without requiring a rebuild.

## 22. Relationship to Other Workflows

This phase belongs to the **Website Development** workflow.

It does NOT decide:
- which article to write next
- search-volume-based topic priority
- publishing cadence
- final content production

Those belong to **Quản lý chủ đề**.

Content production belongs to **Viết Content** and follows `AquaMind_CONTENT_PRODUCTION_WORKFLOW.md`.
