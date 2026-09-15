# AquaMind WEB-05 — Tools SEO Architecture

**Status:** Strategic specification / implementation-ready planning document  
**Scope:** Website architecture, SEO, UX and discoverability for AquaMind Tools  
**Out of scope:** Choosing which article to write next; keyword publishing roadmap belongs to “Quản lý chủ đề”.

---

## 1. Objective

Transform AquaMind Tools from a collection of interactive utilities into a coherent **SEO Utility Layer**.

Target model:

```text
Google / User Intent
        ↓
SEO Tool Landing Page
        ↓
Interactive Calculator / Utility
        ↓
Explanation + Formula + Examples
        ↓
Related Problems
        ↓
Related Database Entities
        ↓
Related Articles
        ↓
Other Tools
```

The tool must remain useful even when JavaScript is unavailable for the informational portion of the page. The interactive calculator is the utility layer, not the entire SEO page.

---

## 2. Current Architecture Baseline

The current AquaMind source-of-truth indicates that the website already has a Tools area with approximately 12 utilities, including calculators/utilities around:

- Aquarium volume
- Water change
- Stocking
- CO2
- Lighting
- Pump flow
- Salt mixing
- Dosing
- Water parameters
- Diagnosis
- and related aquarium utilities

The existing architecture also includes Articles, Problems, Database/entity pages and Learning Paths.

**Important:** This specification does not require replacing the current tools implementation. The preferred approach is to harden and standardize the existing architecture.

---

## 3. Core Principle

AquaMind should NOT optimize tools by simply adding text around a calculator.

Each indexable tool should answer a concrete user task:

> “I came here to calculate/check/decide something, and AquaMind helped me do it.”

Therefore every tool page should have:

1. Clear task/title.
2. Interactive utility.
3. Result explanation.
4. Method/formula where appropriate.
5. Example.
6. Assumptions and limitations.
7. Safety/context notes where relevant.
8. Related problems.
9. Related database entities.
10. Related articles.
11. Related tools.

---

## 4. Tool Taxonomy

Group tools by user intent rather than implementation detail.

### A. Setup & Capacity

- Aquarium Volume
- Stocking / Capacity

### B. Water Management

- Water Change
- Water Parameters
- Salt Mixing
- Dosing

### C. Planted Aquarium

- CO2
- Lighting

### D. Equipment

- Pump Flow
- Equipment-related calculations

### E. Troubleshooting

- Diagnosis
- Problem-oriented utilities

The exact grouping must follow the real current tool inventory in source code. Do not invent tools merely to fill a category.

---

## 5. URL Architecture

Preferred canonical model:

```text
/tools
/tools/[tool-slug]
```

Examples:

```text
/tools/aquarium-volume
/tools/water-change
/tools/stocking
/tools/co2
/tools/lighting
```

Avoid exposing implementation-specific URLs as SEO destinations.

Query state such as:

```text
/tools/aquarium-volume?length=60&width=30&height=36
```

should remain a calculator state, not a separate indexable page.

### Rule

- Canonical tool page = indexable.
- Calculator state/query parameters = utility state.
- Do not generate an SEO page for every possible input combination.
- Compare/filter URLs require explicit policy before indexation.

---

## 6. Indexation Policy

### Index

A tool should normally be indexable when:

- It solves a recurring aquarium-related search intent.
- It has meaningful explanatory content.
- The calculator is functional.
- The result is understandable.
- It has unique value.
- It can receive contextual internal links.

### Do not index / reconsider

- Empty tool shells.
- Duplicate tools.
- Experimental utilities.
- Parameter-state URLs.
- Internal/debug routes.
- Tool results that only differ by user-entered numbers.
- Pages with insufficient explanatory value.

This is a quality gate, not a blanket `noindex` rule.

---

## 7. Standard Tool Page Structure

Every indexable tool should use a consistent information hierarchy:

```text
Breadcrumb
    ↓
H1 + concise value proposition
    ↓
Tool / Calculator
    ↓
Result
    ↓
What the result means
    ↓
How it works
    ↓
Formula / assumptions
    ↓
Worked example
    ↓
Important caveats
    ↓
Related Problems
    ↓
Related Database
    ↓
Related Articles
    ↓
Related Tools
    ↓
FAQ where genuinely useful
```

The interactive component should appear early.

Do not force users to read a long article before reaching the calculator.

---

## 8. SEO Metadata

Each canonical tool page should have:

- Unique `<title>`
- Unique meta description
- Canonical URL
- Open Graph metadata
- Twitter/social metadata where supported
- Breadcrumb
- Appropriate structured data only when justified by the actual page content

Avoid keyword stuffing.

The primary title should describe the task naturally.

Example pattern:

```text
Aquarium Volume Calculator — Calculate Actual Water Volume | AquaMind
```

Do not mechanically use this exact title for every tool.

---

## 9. Structured Data

Use only schema types that accurately describe the page.

Potential supporting schemas depend on the real implementation and content:

- WebPage
- BreadcrumbList
- Organization / WebSite at site level
- Article only if the page genuinely contains an article and satisfies the relevant requirements

Do NOT mark a calculator as a Product merely because it is a useful tool.

Do NOT manufacture ratings/reviews.

Structured data must match visible page content.

---

## 10. Internal Linking Model

Tools should become nodes in the AquaMind knowledge graph.

### Tool → Article

Example:

```text
Aquarium Volume Calculator
        ↓
How to Calculate Aquarium Volume
```

### Tool → Problem

```text
Water Change Calculator
        ↓
Cloudy Water
        ↓
Ammonia Spike
```

### Tool → Entity

```text
Stocking Calculator
        ↓
Fish Species
        ↓
Tank Requirements
```

### Tool → Tool

Use only where the next tool is genuinely useful.

Example:

```text
Aquarium Volume
       ↓
Water Change
       ↓
Dosing
```

### Tool → Learning Path

Where a tool supports a specific learning step:

```text
Beginner Setup
      ↓
Aquarium Volume Calculator
```

---

## 11. Contextual Linking Rules

Avoid a generic “Related Tools” block as the only linking mechanism.

At least one contextual link should appear when useful:

```text
Explanation sentence
        ↓
Relevant tool
```

Example:

> If you are calculating the amount of water to replace, use the Water Change Calculator.

The link should help the user continue the task.

---

## 12. Result UX

The result is the primary interaction.

Requirements:

- Clear input labels.
- Correct units.
- Sensible defaults only when they do not mislead.
- Validation.
- Helpful error messages.
- Immediate result feedback.
- Copy/share capability only if genuinely useful.
- Mobile-friendly controls.
- Keyboard accessibility.
- No critical result hidden behind unnecessary animation.

### Result hierarchy

```text
RESULT
Value
Unit
Short interpretation
Optional warning / context
```

Avoid displaying a large number without explaining what it means.

---

## 13. Units & Conversion

Aquarium users may use different unit systems.

Where relevant, support:

- Liters
- Gallons
- Centimeters
- Inches
- °C / °F
- ppm / relevant concentration units

The tool must clearly state which unit is being used.

Never silently mix unit systems.

---

## 14. Formula Transparency

For mathematical tools, show the underlying method when useful.

Example:

```text
Volume
= Length × Width × Height
```

Then explain:

- Gross volume.
- Estimated actual water volume.
- Displacement assumptions.
- Why the calculator result may differ from a physical measurement.

The purpose is education and trust, not exposing implementation code.

---

## 15. Safety & Uncertainty

Some tools can influence animal welfare or chemical dosing.

For these tools:

- State assumptions.
- Avoid presenting estimates as guarantees.
- Provide appropriate caution.
- Make clear when actual measurements should override calculations.
- Avoid false precision.

Example:

```text
Calculated value ≠ guaranteed safe biological outcome.
```

This is especially important for:

- Stocking
- Dosing
- CO2
- Salt mixing
- Water parameters

---

## 16. Tool Quality Gate

Before a tool becomes an SEO landing page:

```text
[ ] Tool works
[ ] Inputs validate correctly
[ ] Units are explicit
[ ] Result is understandable
[ ] Formula/method is correct where applicable
[ ] Assumptions are documented
[ ] Mobile layout works
[ ] Keyboard/accessibility works
[ ] Canonical exists
[ ] Metadata exists
[ ] Breadcrumb exists
[ ] Internal links exist
[ ] No accidental query-state indexing
[ ] Error state works
[ ] No console/runtime errors
```

---

## 17. Performance

Do not sacrifice performance for SEO copy.

Preferred architecture:

```text
Server-rendered SEO shell
        +
Client-side interactive calculator
```

Only the interactive portion should require client-side behavior where possible.

Avoid unnecessarily turning the entire page into a Client Component.

Heavy visualizations or secondary widgets should use dynamic loading when measurement shows a benefit.

---

## 18. Analytics

Track tool usage independently from page traffic.

Recommended events:

```text
tool_view
tool_calculate
tool_result
tool_reset
tool_error
tool_copy_result
tool_external_link_click
```

Event payload should identify the tool and useful non-sensitive context.

Do not collect unnecessary personal data.

Useful metrics:

- Tool landing page impressions
- Organic clicks
- CTR
- Average position
- Tool calculation rate
- Result completion rate
- Error rate
- Exit rate
- Internal-link click rate
- Tool-assisted sessions

---

## 19. SEO Measurement

For each tool:

```text
Search impressions
Clicks
CTR
Average position
Indexed status
Organic landing sessions
Calculator interaction rate
Next-page/internal-link rate
```

The goal is not simply:

> “Tool has traffic.”

The goal is:

> “Tool attracts relevant organic visitors and helps them continue through AquaMind.”

---

## 20. Tool ↔ Content Relationship

This workstream must remain separate from deciding what article to publish next.

The website should expose relationships such as:

```text
Tool
  ↓
Related content IDs / references
```

But the Content Management workflow decides which article should exist.

If a related article does not exist:

```text
Do not invent the link.
```

Instead record the missing relationship as a content gap for the “Quản lý chủ đề” chat.

---

## 21. Sanity / CMS Considerations

If tool metadata is currently hard-coded, do not immediately move everything into Sanity.

First determine:

- Which fields are truly editorial.
- Which fields are application logic.
- Which relationships require CMS management.
- Which data is safer as source code/configuration.

Recommended split:

### Code

- Calculation logic.
- Validation.
- Units.
- Algorithms.
- Interactive UI.

### CMS / structured content

Potentially:

- Intro.
- Explanation.
- FAQ.
- Related article references.
- Related problem references.
- Editorial notes.

Only introduce CMS fields where they provide clear operational value.

---

## 22. Tool Landing Page Template

Create a reusable component/system rather than styling each tool independently.

Conceptually:

```text
<ToolPage>
  <Breadcrumb />
  <ToolHero />
  <ToolInteractive />
  <ToolResult />
  <ToolExplanation />
  <ToolFormula />
  <ToolExample />
  <ToolCaveats />
  <RelatedProblems />
  <RelatedEntities />
  <RelatedArticles />
  <RelatedTools />
</ToolPage>
```

Names are conceptual. Follow the project's actual component conventions.

---

## 23. Recommended Navigation

The Tools hub should not merely be a grid of calculators.

Recommended:

```text
Tools
│
├── Setup & Capacity
├── Water
├── Planted Aquarium
├── Equipment
└── Troubleshooting
```

Each category should have a short explanation.

Do not create thin category pages solely for SEO.

---

## 24. Search UX

The Tools hub should allow users to discover a utility quickly.

Potential features:

- Search/filter by task.
- Category grouping.
- Clear tool descriptions.
- Recently used tools only if technically justified.
- Mobile-friendly layout.

Do not create crawlable URLs for every UI filter state unless deliberately designed as SEO landing pages.

---

## 25. Animation Policy

Animation is **not an SEO requirement**.

Use animation only to improve:

- Result feedback.
- Input/output transition.
- Loading state.
- Visual explanation.

Avoid:

- Large hero animation delaying the calculator.
- Motion that obscures results.
- Excessive decorative motion.
- Motion that harms Core Web Vitals.

Respect reduced-motion preferences.

---

## 26. Accessibility

Minimum requirements:

- Semantic labels.
- Keyboard navigation.
- Focus visibility.
- Screen-reader-friendly result announcements where appropriate.
- Sufficient contrast.
- Error messages associated with inputs.
- `prefers-reduced-motion` support.

---

## 27. Recommended Implementation Phases

### WEB-05A — Tool Inventory & Classification

Audit every current tool.

Output:

```text
Tool
URL
Purpose
Category
Indexability
Current metadata
Current schema
Current internal links
Current analytics
Current UX state
Status
```

### WEB-05B — Canonical Tool Page Template

Build reusable SEO/UX shell.

### WEB-05C — Tool Metadata & Content Model

Standardize metadata and editorial relationships.

### WEB-05D — Internal Linking Integration

Connect tools with:

- Articles
- Problems
- Entities
- Learning Paths
- Other tools

### WEB-05E — Query/State Indexation Protection

Ensure user-entered calculator states do not create SEO duplication.

### WEB-05F — Analytics

Implement tool interaction events.

### WEB-05G — QA

Validate all tools on:

- Desktop
- Mobile
- Keyboard
- Invalid inputs
- Edge cases
- Slow network
- Reduced motion

---

## 28. Definition of Done

WEB-05 is complete when:

```text
[ ] All existing tools inventoried
[ ] Tool categories documented
[ ] Indexability policy documented
[ ] Canonical URL policy implemented
[ ] Standard tool page structure implemented
[ ] Metadata standardized
[ ] Structured data validated where applicable
[ ] Query-state policy implemented
[ ] Internal-link relationships supported
[ ] Tool UX standardized
[ ] Accessibility baseline passes
[ ] Analytics events implemented
[ ] No accidental duplicate/indexable states
[ ] Build passes
[ ] Tests pass
[ ] Production smoke test passes
[ ] CURRENT_STATE updated
```

---

## 29. Explicit Non-Goals

This phase does NOT:

- Decide the next article to publish.
- Perform keyword-volume ranking.
- Replace the content calendar.
- Rewrite all existing articles.
- Rebuild the calculator algorithms without evidence.
- Replace Sanity.
- Replace Next.js.
- Add unnecessary tools.
- Add decorative animation solely for SEO.

---

## 30. Strategic Outcome

After WEB-05:

```text
                    AQUAMIND
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     ARTICLES       DATABASE        TOOLS
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                    PROBLEMS
                       ↓
                  KNOWLEDGE GRAPH
                       ↓
                 Organic Discovery
                       ↓
                    Traffic
```

Tools become a permanent utility layer of AquaMind rather than a collection of isolated calculators.

---

## 31. Relationship to Other AquaMind Chats

### 🗂️ Quản lý chủ đề

Owns:

- Search Console research.
- SERP research.
- Keyword/content gaps.
- Final content priority.
- Publishing roadmap.

### ✍️ Viết Content

Owns:

- Production of an approved topic.
- AquaMind_CONTENT_PRODUCTION_WORKFLOW.md.
- Article-level research and writing.

### 🌐 Xây dựng website

Owns:

- Tool architecture.
- Tool UX.
- Technical SEO.
- Internal linking implementation.
- Database architecture.
- Problems architecture.
- Analytics.
- Performance.
- Security.
- Website roadmap.

This separation must be preserved.
