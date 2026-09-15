# AquaMind Web — WEB-03 Internal Linking Architecture

**Version:** 1.0  
**Status:** Strategy / implementation specification  
**Scope:** Website architecture, SEO, discoverability and knowledge-graph linking  
**Out of scope:** Choosing which article to write next; content-production workflow; keyword-volume prioritization

---

## 1. Purpose

WEB-03 defines how AquaMind should connect its existing and future:

- Articles
- Hubs
- Species
- Plants
- Corals
- Invertebrates
- Equipment
- Problems
- Diagnosis
- Tools
- Learning Paths
- Inspiration / Styles
- Wiki / Database surfaces

The goal is to turn the current collection of pages into a **coherent knowledge graph** that helps:

1. users discover the next useful resource;
2. search engines understand topical relationships;
3. important pages receive appropriate internal authority;
4. users move from information → diagnosis → action;
5. new content automatically strengthens existing clusters.

This phase does **not** decide which article topics should be published next. That responsibility belongs to the separate **Quản lý chủ đề** chat.

---

# 2. Current-State Basis

WEB-03 is based on the existing AquaMind IA audit and source-of-truth project audit.

The current website already contains multiple useful surfaces:

- Articles
- Database/entity pages
- Problems
- Diagnosis
- Tools
- Learning Paths
- Start Here
- Inspiration
- Wiki
- Finder / Setup Planner

The WEB-02 IA audit established the target conceptual model:

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
│   └── Inspiration / Styles
│
├── Solve
│   ├── Problems
│   ├── Diagnosis
│   └── Troubleshooting
│
├── Tools
│   ├── Calculators
│   ├── Setup Planner
│   └── Finder / Compatibility
│
└── About / Community
```

WEB-03 operationalizes the relationships between these surfaces.

---

# 3. Core Principle

AquaMind should not rely primarily on a generic:

```text
Related Posts
```

block.

The primary model should be:

```text
CONTEXTUAL INTERNAL LINK
        ↓
READER NEXT STEP
        ↓
RELATED ENTITY / PROBLEM / TOOL / GUIDE
```

Generic Related Posts remains useful as a secondary discovery mechanism.

The best internal link is the one that answers:

> "What is the most useful thing this reader should look at next?"

---

# 4. Target Knowledge Graph

The target graph is:

```text
                         HUB
                          ↕
                       ARTICLE
                    ↙     ↓      ↘
                ENTITY   PROBLEM   TOOL
                  ↕        ↕        ↕
             ENTITY ↔ PARAMETER ↔ GUIDE
                  ↘        ↓       ↙
                   LEARNING PATH
                         ↕
                    INSPIRATION
```

A more practical representation:

```text
Article
 ├──→ Hub
 ├──→ Species / Plant / Coral / Equipment
 ├──→ Problem
 ├──→ Tool
 ├──→ Learning Path
 └──→ Related Article

Entity
 ├──→ Care Guide
 ├──→ Related Entity
 ├──→ Problems
 ├──→ Tools
 └──→ Articles

Problem
 ├──→ Relevant Parameter
 ├──→ Diagnostic Tool
 ├──→ Solution Guide
 ├──→ Related Problem
 └──→ Entity / Species

Tool
 ├──→ Explanation
 ├──→ Relevant Problem
 ├──→ Guide
 └──→ Entity

Learning Path
 ├──→ Article
 ├──→ Tool
 ├──→ Entity
 ├──→ Problem
 └──→ Next Step

Inspiration
 ├──→ Style
 ├──→ Plants
 ├──→ Equipment
 ├──→ Livestock
 └──→ Setup Guide
```

---

# 5. Link Types

AquaMind should distinguish six link classes.

## 5.1 Contextual Links

Links inside article/body content.

Highest value for reader journey.

Example:

```text
Fish are often stressed by sudden changes in water chemistry.
→ Water Parameters Guide
```

Use when the destination adds necessary context.

---

## 5.2 Hub Links

Links from supporting pages toward a primary hub.

Example:

```text
Neon Tetra Care
→ Fish Hub
```

Purpose:

- establish hierarchy;
- strengthen the hub;
- provide broad navigation.

Do not force a hub link into every paragraph.

---

## 5.3 Entity Links

Links between content and structured entities.

Example:

```text
Article:
"The easiest freshwater fish..."

→ Neon Tetra
→ Corydoras
→ Betta
```

Only link entities that are genuinely discussed.

Do not automatically link every species name on every page.

---

## 5.4 Problem Links

Links from informational content to troubleshooting resources.

Example:

```text
Aquarium Cycling Guide
→ Ammonia Spike
```

Use when the reader could reasonably encounter the problem.

---

## 5.5 Tool Links

Links from explanatory content to a tool that helps the reader act.

Example:

```text
How Much Water Should You Change?
→ Water Change Calculator
```

A tool should be linked when it materially reduces the reader's work.

---

## 5.6 Learning Path Links

Links into structured education.

Example:

```text
Beginner article
→ Beginner Aquarium Learning Path
```

Use for pages where a reader is likely to need a sequence rather than a single answer.

---

# 6. Directionality Rules

Internal links should not be one-way only.

AquaMind should aim for meaningful bidirectional relationships.

## Article ↔ Entity

```text
Article
→ Species

Species
→ Care articles
```

## Article ↔ Problem

```text
Article
→ Problem

Problem
→ Relevant article
```

## Article ↔ Tool

```text
Article
→ Tool

Tool
→ Explanation / guide
```

## Hub ↔ Supporting Content

```text
Hub
→ Supporting pages

Supporting pages
→ Hub
```

## Learning Path ↔ Resources

```text
Learning Path
→ Article / Tool / Entity

Resource
→ Learning Path
```

The reverse link should exist only when it helps the user; do not create artificial reciprocal links everywhere.

---

# 7. Article Linking Framework

Every important article should be evaluated for these destinations:

```text
1. Parent / Hub
2. 1–3 supporting articles
3. Relevant entity pages
4. Relevant problem pages
5. Relevant tool
6. Relevant learning path
```

Not every article needs all six.

Use only relevant destinations.

### Recommended contextual density

Do not set a hard number of links per 1,000 words.

Instead:

> Add a link when a reasonable reader would benefit from opening the destination.

Avoid:

- keyword-stuffed links;
- repeated links to the same destination;
- long lists of unrelated links;
- linking every entity mention.

---

# 8. Article → Article Rules

Prioritize:

1. prerequisite knowledge;
2. direct continuation;
3. troubleshooting;
4. comparison;
5. practical next step;
6. deeper reference.

Example:

```text
"Why Aquarium Water Gets Cloudy"
→ Nitrogen Cycle
→ Water Testing
→ Cloudy Water Problem
→ Water Change Calculator
```

Avoid:

```text
Article A
→ random Article B
→ random Article C
```

Shared category alone is not enough.

---

# 9. Article → Entity Rules

Entity links should represent **semantic references**, not keyword targets.

Good:

```text
"Neon Tetras are schooling fish..."
→ Neon Tetra entity
```

Bad:

```text
Add "Neon Tetra" link to every article
```

The system should eventually support entity-aware linking where practical, but automated linking must be conservative.

---

# 10. Entity Page Linking Framework

Each important entity page should expose:

```text
Entity
│
├── Overview
├── Care / Requirements
├── Related Articles
├── Common Problems
├── Compatible / Related Entities
├── Relevant Tools
└── Learning Resources
```

For example:

```text
Neon Tetra
│
├── Care Guide
├── Tank Size
├── Water Parameters
├── Feeding
├── Tank Mates
├── Fish Hiding
├── Stocking Calculator
└── Beginner Learning Path
```

Only show sections when data/resources actually exist.

Do not render empty modules.

---

# 11. Problem Page Linking Framework

Problem pages are a major AquaMind differentiator.

Target flow:

```text
Symptom
 ↓
Problem
 ↓
Likely Causes
 ↓
What to Check
 ↓
Parameter / Entity
 ↓
Tool
 ↓
Action / Guide
```

Example:

```text
Fish Hiding
 ↓
Stress / Environment
 ↓
Water Parameters
 ↓
Stocking
 ↓
Compatibility
 ↓
Stocking Calculator
```

Problem pages should always provide a clear next action.

---

# 12. Problem → Tool Rules

Link to a tool when the problem can be investigated or acted upon quantitatively.

Examples:

```text
Ammonia problem
→ Water / parameter resource

Overstocking concern
→ Stocking Calculator

Water change question
→ Water Change Calculator

CO₂ issue
→ CO₂ Calculator

Pump/flow issue
→ relevant flow tool
```

Do not link a tool merely because it exists.

The tool must solve a step in the diagnosis.

---

# 13. Tool → Content Rules

Every important tool should have an explanatory context layer.

Target:

```text
Tool
│
├── What it calculates
├── Why it matters
├── How to use it
├── Interpretation
├── Related problems
├── Related guides
└── Related entities
```

Example:

```text
Stocking Calculator
→ Overstocking guide
→ Fish compatibility
→ Beginner aquarium setup
→ Relevant species
```

This prevents tools from becoming isolated utility pages.

---

# 14. Learning Path Linking

Learning Paths should act as **orchestration pages**, not content silos.

A path may contain:

```text
Step 1 → Article
Step 2 → Tool
Step 3 → Entity
Step 4 → Problem
Step 5 → Article
```

Each resource should know how it relates to the path.

Example:

```text
Beginner Aquarium Path
│
├── Understand nitrogen cycle
├── Choose tank
├── Set up filtration
├── Cycle aquarium
├── Test water
├── Choose fish
└── Start maintenance
```

The learning path should reuse existing resources instead of duplicating their content.

---

# 15. Inspiration Linking

Inspiration should convert visual interest into actionable discovery.

Target:

```text
Inspiration Scene
 ↓
Aquascape Style
 ↓
Plants
 ↓
Hardscape
 ↓
Equipment
 ↓
Livestock
 ↓
Setup Guide
```

Example:

```text
Iwagumi
→ Iwagumi inspiration
→ Recommended plant entities
→ Lighting / CO₂
→ Aquascaping guide
→ Setup resources
```

Do not turn inspiration into a disconnected gallery.

---

# 16. Hub Architecture

Recommended primary hubs:

1. Beginner Aquarium
2. Water Quality
3. Fish
4. Aquascaping & Plants
5. Equipment
6. Problems & Troubleshooting
7. Marine & Reef
8. Tools
9. Aquarium Database

A hub should:

- explain the subject;
- identify major subtopics;
- link to the best resources;
- provide a logical next step;
- receive links from supporting pages.

Do not create a new hub simply because a category exists.

---

# 17. Link Priority

Internal links should be prioritized using this hierarchy:

### Tier 1 — Critical

Links between:

```text
Hub ↔ core supporting content
Problem ↔ solution
Article ↔ directly relevant tool
Article ↔ directly relevant entity
```

### Tier 2 — Important

```text
Article ↔ related article
Entity ↔ related entity
Learning Path ↔ resource
```

### Tier 3 — Optional

```text
Secondary discovery
Lifestyle
Inspiration cross-links
```

Do not spend engineering effort automating Tier 3 before Tier 1 is reliable.

---

# 18. Anchor Text Rules

Anchor text should describe the destination naturally.

Good:

- `nitrogen cycle`
- `water change calculator`
- `Neon Tetra care guide`
- `fish hiding`
- `aquarium stocking`

Avoid:

- `click here`
- repeated exact-match phrases everywhere;
- unnaturally long keyword strings;
- anchors that do not match the destination.

Anchor text should help users predict what they will find.

---

# 19. Related Posts Rules

`Related Posts` is a secondary recommendation layer.

Priority:

1. Same problem / same user journey
2. Supporting article
3. Parent hub article
4. Next practical step
5. Broader contextual resource

Do not select related posts based only on shared tags.

Do not create fake references to unpublished posts.

If no strong related post exists, show fewer recommendations.

---

# 20. Orphan Page Prevention

A page should not be published into the main SEO ecosystem without a planned incoming path.

For every important indexable page:

```text
At least one intentional inbound link
```

Preferably:

```text
Hub
→ Page
```

and where relevant:

```text
Page
→ Hub
```

A sitemap is not a substitute for internal discoverability.

---

# 21. Click-Depth Goal

Important pages should normally be reachable within a reasonable number of clicks from major navigation/hub surfaces.

Target:

```text
Homepage
 ↓
Hub
 ↓
Content
```

Avoid:

```text
Homepage
 ↓
Category
 ↓
Filter
 ↓
Sub-filter
 ↓
Pagination
 ↓
Article
```

Do not optimize for an arbitrary universal number. Optimize for clear, shallow user journeys.

---

# 22. Navigation vs Internal Linking

Do not solve every discovery problem by adding navbar items.

Use:

```text
Navigation
= primary global destinations

Hubs
= subject-level navigation

Contextual links
= next best action

Related resources
= secondary discovery
```

This keeps the UI clean while allowing a deep knowledge graph.

---

# 23. Automation Strategy

Automation is allowed only when relationship confidence is high.

### Safe automation candidates

- Article → explicitly referenced entity
- Tool → known explanatory article
- Problem → explicitly configured tool
- Learning Path → configured resources
- Entity → configured related resources
- Breadcrumb → known IA hierarchy

### Unsafe automation

Do not automatically:

- link every matching keyword;
- create links solely from tag overlap;
- insert dozens of links into article body;
- infer medical/treatment relationships without editorial review;
- create links to irrelevant pages because of lexical similarity.

---

# 24. Recommended Data Model

The implementation should prefer explicit relationships where possible.

Conceptual fields:

```text
Article
- hub
- relatedArticles[]
- relatedEntities[]
- relatedProblems[]
- relatedTools[]
- learningPaths[]

Entity
- relatedArticles[]
- relatedProblems[]
- relatedTools[]
- relatedEntities[]

Problem
- relatedArticles[]
- relatedEntities[]
- relatedTools[]
- relatedProblems[]

Tool
- relatedArticles[]
- relatedProblems[]
- relatedEntities[]

LearningPath
- resources[]
```

Do not add every field to every Sanity schema automatically.

First inspect the existing schemas and reuse current reference fields where possible.

---

# 25. Avoid Schema Explosion

Do NOT create:

```text
20 new reference fields
```

without checking whether existing Sanity relationships already provide the same capability.

Implementation preference:

```text
Existing schema
 ↓
Reusable relationship
 ↓
Small extension only if required
```

Architecture should remain maintainable.

---

# 26. Component Strategy

Prefer reusable components for relationship modules:

```text
<RelatedArticles />
<RelatedEntities />
<RelatedProblems />
<RelatedTools />
<LearningPathNextStep />
<HubNavigation />
<ContextualResource />
```

But body-editor contextual links should remain part of rich text/content where editorial context matters.

Do not replace all contextual linking with UI cards.

---

# 27. Link Rendering Rules

Internal links must:

- use normal internal URLs;
- be crawlable;
- have descriptive anchor text;
- preserve accessibility;
- work without JavaScript where practical;
- avoid unnecessary client-side navigation complexity;
- not open new tabs by default.

Cards should remain semantic links, not clickable `div`s.

---

# 28. SEO Considerations

Internal linking should help search engines discover and understand important pages.

Prioritize links toward:

- canonical indexable pages;
- important hubs;
- high-value entities;
- useful problem pages;
- useful tools.

Do not use internal links to manipulate rankings through excessive repetition.

Do not link to:

- search-result URLs;
- temporary filter states;
- useless query parameters;
- duplicate/canonicalized variants;

unless there is a deliberate product reason.

---

# 29. Mobile UX

Internal linking must remain usable on mobile.

Avoid:

- huge walls of resource cards;
- excessive related-link modules;
- tiny anchor text;
- repetitive link blocks.

Prefer:

```text
Read next
Check this
Use this tool
Explore this species
```

with concise descriptions.

---

# 30. Measurement

After implementation, monitor:

### Discoverability

- pages with zero internal links;
- inbound-link count;
- click depth;
- crawl/index behavior.

### Engagement

- internal-link click-through;
- article → tool transitions;
- article → entity transitions;
- problem → tool transitions;
- learning-path progression.

### SEO

- indexed pages;
- impressions;
- ranking distribution;
- organic landing pages;
- pages gaining/losing impressions.

Search Console data should be used for measurement and prioritization, but **content topic selection remains in the Quản lý chủ đề workflow**.

---

# 31. Implementation Plan

## WEB-03A — Existing Link Inventory

Inspect the codebase and Sanity schemas.

Inventory:

- existing `Related Posts`;
- article references;
- entity references;
- problem references;
- tool references;
- learning path references;
- breadcrumbs;
- footer links;
- navigation links.

Deliverable:

```text
AQUAMIND_INTERNAL_LINK_CURRENT_STATE.md
```

---

## WEB-03B — Link Graph Matrix

Create a matrix:

| From | To | Current | Desired | Method |
|---|---|---|---|---|
| Article | Hub | ? | Yes | contextual/module |
| Article | Entity | ? | Relevant | reference |
| Article | Problem | ? | Relevant | contextual |
| Article | Tool | ? | Relevant | CTA/context |
| Entity | Article | ? | Yes | related resources |
| Problem | Tool | ? | Relevant | diagnosis |
| Tool | Article | ? | Yes | explanation |
| Learning Path | Resource | ? | Yes | configured |
| Inspiration | Entity | ? | Relevant | metadata/reference |

Do not assume current state; inspect the source.

---

## WEB-03C — Relationship Model

Define which relationships should be:

- explicit Sanity references;
- derived from existing data;
- editorial contextual links;
- UI-generated modules.

---

## WEB-03D — Reusable Components

Implement only the components justified by the current architecture.

---

## WEB-03E — Hub Connectivity

Ensure each primary hub has:

```text
Hub
 ↓
important resources

Resource
 ↓
Hub
```

---

## WEB-03F — Problem / Tool Loop

Strengthen:

```text
Problem
→ Check
→ Parameter
→ Tool
→ Guide
```

---

## WEB-03G — Entity Connectivity

Strengthen:

```text
Article
↔ Entity
↔ Related Article
↔ Problem
↔ Tool
```

---

## WEB-03H — Orphan Detection

Add a development/audit mechanism that can identify important pages with no meaningful inbound links.

---

## WEB-03I — QA

Verify:

- no broken internal links;
- no links to non-existent slugs;
- no accidental query/filter links in SEO modules;
- no duplicate link blocks;
- mobile usability;
- accessibility;
- build;
- tests.

---

# 32. Definition of Done

WEB-03 is complete when:

- [ ] Current internal-link architecture is inventoried from source.
- [ ] Target link graph is documented.
- [ ] Hub relationships are defined.
- [ ] Article relationships are defined.
- [ ] Entity relationships are defined.
- [ ] Problem/tool diagnostic relationships are defined.
- [ ] Learning Path relationships are defined.
- [ ] Inspiration relationships are defined.
- [ ] Related Posts rules are documented.
- [ ] Orphan-page detection exists or is documented for follow-up.
- [ ] Search/filter utility URLs are not unintentionally promoted as SEO destinations.
- [ ] Internal links use crawlable, accessible URLs.
- [ ] No mass keyword-based auto-linking is introduced.
- [ ] Existing Sanity schemas are reused where practical.
- [ ] No unnecessary URL migration occurs.
- [ ] Tests/build pass.
- [ ] Current-state documentation is updated.

---

# 33. Non-Goals

WEB-03 does NOT:

- choose the next article;
- assign search volume;
- assign keyword difficulty;
- create the publishing calendar;
- rewrite articles;
- redesign the entire homepage;
- migrate Sanity;
- migrate Next.js;
- replace the current URL structure;
- create hundreds of new hub pages.

Those belong to other workstreams.

---

# 34. Relationship With Other AquaMind Chats

## 🗂️ Quản lý chủ đề

Owns:

```text
Search Console
→ SERP research
→ content gaps
→ priority
→ publishing roadmap
→ update roadmap
```

WEB-03 provides the website's linking/architecture constraints to that workflow.

## ✍️ Viết Content

Owns:

```text
Topic
→ Content Production Workflow
→ Draft
→ Editorial Layer
→ Visuals
→ Metadata
→ QA
```

The content workflow should receive relevant internal-link targets from the website architecture when a topic is being produced.

## 🌐 Xây dựng website

Owns:

```text
Technical SEO
Information Architecture
Internal Linking
Database SEO
Tools SEO
Problems / Diagnosis
Analytics
UX
Performance
Security
Monetization readiness
```

---

# 35. Final Architecture Principle

AquaMind should evolve from:

```text
A collection of articles + features
```

into:

```text
A connected aquarium knowledge system
```

The desired user journey is:

```text
Google
  ↓
Useful page
  ↓
Understand
  ↓
Explore
  ↓
Diagnose
  ↓
Calculate / Decide
  ↓
Learn
  ↓
Return to AquaMind
```

Internal linking is the connective tissue that makes this system work.

Do not maximize the number of links.

**Maximize the usefulness of the next link.**
