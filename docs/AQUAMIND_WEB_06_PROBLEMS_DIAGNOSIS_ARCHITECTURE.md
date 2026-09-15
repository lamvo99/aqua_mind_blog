# AquaMind WEB-06 — Problems & Diagnosis Architecture

**Status:** Strategic specification / implementation-ready planning document  
**Scope:** Problems hub, individual problem pages, Diagnosis experience, SEO, UX, internal linking and knowledge architecture  
**Out of scope:** Choosing which article to publish next; that remains the responsibility of “Quản lý chủ đề”.

---

# 1. Objective

Turn AquaMind Problems + Diagnosis into a coherent **Aquarium Troubleshooting Engine**.

The target experience is:

```text
User has a symptom
        ↓
Finds AquaMind
        ↓
Problem page OR Diagnosis
        ↓
Possible causes
        ↓
What to check
        ↓
Recommended action
        ↓
Relevant tools
        ↓
Relevant entities
        ↓
Relevant articles
        ↓
Return / continue learning
```

The system should work for both:

1. Users who already know the problem.
2. Users who only know what they observe in the aquarium.

The system should prioritize **usefulness, clarity and safe guidance** over SEO tricks.

---

# 2. Current Architecture Baseline

The current AquaMind architecture already contains:

```text
/problems
/problems/[slug]
/problems/diagnose
```

The current Problems surface is organized around aquarium issues, while Diagnosis provides an interactive troubleshooting experience.

Existing site architecture also includes:

- Articles
- Database / entities
- Tools
- Learning Paths
- Start Here
- Inspiration

Therefore WEB-06 should **extend the existing system**, not create a parallel troubleshooting product.

---

# 3. Core Product Principle

AquaMind should distinguish:

### Problem page

A known issue:

> “My fish are hiding.”

### Diagnosis

An unknown issue:

> “Something is wrong with my aquarium. I don't know what.”

These are different intents.

```text
Known problem
     ↓
Problem page

Unknown symptom
     ↓
Diagnosis
```

Diagnosis should ultimately lead users toward a canonical Problem page whenever confidence is sufficient.

---

# 4. Target Information Architecture

```text
                         PROBLEMS
                            │
             ┌──────────────┴──────────────┐
             ↓                             ↓
       Browse Problems                 Diagnose
             │                             │
       Category / Search             Symptoms / Inputs
             │                             │
             └──────────────┬──────────────┘
                            ↓
                     Problem / Causes
                            ↓
                     What to Check
                            ↓
                     What to Do
                            ↓
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
        Tools            Entities          Articles
```

The Problem page is the canonical knowledge destination.

---

# 5. Problem Taxonomy

The current Problems architecture already groups issues around areas such as:

- Water
- Algae
- Plants
- Fish
- Equipment

Keep these conceptual groups, but make taxonomy governance explicit.

Recommended top-level model:

```text
Problems
│
├── Water Quality
├── Algae
├── Plants
├── Fish
├── Equipment
└── Other / General
```

Do not create a category solely because one problem exists.

A category should have enough meaningful content to justify its existence.

---

# 6. Problem Page Canonical Structure

Every substantial problem page should follow a predictable structure.

```text
Breadcrumb
    ↓
H1 Problem
    ↓
Short answer / summary
    ↓
Symptoms
    ↓
Likely causes
    ↓
What to check
    ↓
What to do
    ↓
What not to do
    ↓
When to escalate
    ↓
Related tools
    ↓
Related entities
    ↓
Related articles
    ↓
Related problems
    ↓
FAQ where genuinely useful
```

The current AquaMind Problem pages already use a structure involving:

- Symptoms
- Common Causes
- What to Check
- What Not to Do
- Recommended resources

WEB-06 should standardize and strengthen this existing pattern rather than replace it.

---

# 7. Above-the-Fold Requirements

The user should understand the page quickly.

Above the fold:

```text
H1
Short explanation
Primary symptoms
Immediate first checks
```

Do not make the user scroll through a large decorative hero before seeing useful troubleshooting information.

---

# 8. “Symptoms” Section

Symptoms should describe what the user can actually observe.

Examples of symptom dimensions:

- Behavior
- Appearance
- Water clarity
- Odor
- Plant condition
- Equipment behavior
- Parameter readings

Use plain language.

Avoid assuming the user's diagnosis.

Example:

```text
Observed:
- Fish staying near the surface
- Rapid breathing
- Reduced appetite
```

This is better than immediately asserting:

> “Your fish have disease X.”

---

# 9. “Common Causes” Section

Causes should be grouped by likelihood and/or category.

Preferred model:

```text
Common
├── Environmental
├── Water quality
├── Biological
├── Equipment
└── Husbandry
```

Where evidence is uncertain, communicate uncertainty.

Avoid false certainty such as:

> “This symptom always means X.”

Use:

> “Possible causes include…”

---

# 10. “What to Check” Section

This is one of the most important parts of the troubleshooting system.

Every actionable problem should identify the next checks.

Example:

```text
What to Check
├── Temperature
├── Ammonia
├── Nitrite
├── Nitrate
├── pH
├── Oxygen / surface agitation
├── Recent maintenance
└── Recent livestock changes
```

Where an AquaMind Tool exists, link directly to it.

Example:

```text
Parameter
    ↓
Water Parameter Tool
```

---

# 11. “What to Do” Section

Actions should be ordered by priority.

Recommended pattern:

```text
Immediate
    ↓
Today
    ↓
Next few days
    ↓
Monitor
```

Do not overwhelm users with 15 simultaneous actions.

Prioritize the safest, highest-value next step.

---

# 12. “What Not to Do”

This section should prevent common harmful reactions.

Examples of anti-patterns:

- Making several major changes at once.
- Blindly dosing chemicals.
- Replacing filter media unnecessarily.
- Adding livestock before stabilizing conditions.
- Treating a symptom without checking underlying conditions.

The exact advice must be supported by the actual problem context.

---

# 13. Escalation / Urgency

Some problems can be:

```text
Low urgency
Monitor and investigate

Moderate
Act soon

High urgency
Immediate checks/action
```

If urgency labels are introduced, they must have clear editorial definitions.

Do not present medical-style certainty where aquarium evidence is uncertain.

For fish disease topics, distinguish aquarium husbandry guidance from veterinary diagnosis.

---

# 14. Diagnosis UX

Diagnosis should answer:

> “What should I check next?”

not:

> “Here is a giant questionnaire.”

The ideal interaction is progressive.

```text
Step 1
What are you observing?

        ↓

Step 2
Which area does it involve?

        ↓

Step 3
Relevant symptoms

        ↓

Step 4
Optional parameter data

        ↓

Step 5
Recent changes

        ↓

Results
```

The exact question tree should be driven by the current implementation and verified domain logic.

Do not invent a sophisticated AI diagnosis engine unless the product requirements explicitly call for it.

---

# 15. Progressive Disclosure

The diagnosis flow should reveal questions conditionally.

Example:

```text
Fish problem?
      ↓
Behavior / appearance / breathing?
      ↓
If breathing:
      ↓
Surface gasping?
      ↓
Recent water change?
      ↓
Water parameters?
```

Do not ask irrelevant questions.

---

# 16. Diagnosis Result Model

The result should not pretend to be certain.

Preferred presentation:

```text
Possible issue
Confidence / evidence
Why it may fit
What to check next
Recommended action
Related Problem page
Related Tool
```

Avoid:

```text
You definitely have X.
```

Prefer:

```text
This pattern can be consistent with X.
Check Y to narrow it down.
```

---

# 17. Diagnosis → Problem Canonicalization

When a diagnosis maps to an existing Problem page:

```text
Diagnosis result
      ↓
Canonical Problem page
```

Example:

```text
Diagnosis
   ↓
Fish Hiding
   ↓
/problems/fish-hiding
```

This prevents duplicate troubleshooting content.

---

# 18. Diagnosis → Tool

If the next step requires measurement:

```text
Diagnosis
   ↓
Check parameter
   ↓
Relevant Tool
```

Examples:

```text
Water issue
   ↓
Water Parameter Tool

Stocking concern
   ↓
Stocking Calculator

Water replacement
   ↓
Water Change Calculator
```

Only link to tools that actually exist.

---

# 19. Diagnosis → Database

Where the result depends on species/equipment:

```text
Problem
   ↓
Species / Plant / Coral / Equipment
```

Example:

```text
Fish hiding
   ↓
Species behavior
   ↓
Compatibility
```

This uses the WEB-04 Entity SEO architecture.

---

# 20. Problem → Article

Problem pages should link to educational articles when the article helps explain the cause or solution.

```text
Problem
   ↓
Supporting article
```

If an article does not exist:

```text
Record content gap
```

Do not create fake links.

The “Quản lý chủ đề” workflow decides whether and when that missing article should be produced.

---

# 21. Problem → Problem

Problems can link to related problems.

Examples:

```text
Cloudy Water
    ↔
Ammonia Spike

Fish Gasping
    ↔
Low Oxygen

Algae Bloom
    ↔
Excess Nutrients
```

Links must be contextually meaningful.

Do not generate a huge generic related-problem list.

---

# 22. Internal Linking Pattern

Recommended graph:

```text
Problem
 ├── Cause → Article
 ├── Check → Tool
 ├── Entity → Database
 ├── Learn → Learning Path
 ├── Related → Problem
 └── Start Here → relevant hub
```

This integrates WEB-03 and WEB-04.

---

# 23. SEO Metadata

Each canonical Problem page should have:

- Unique title.
- Unique meta description.
- Canonical.
- Open Graph metadata.
- Breadcrumb.
- Appropriate structured data where justified.

Titles should describe the user problem naturally.

Avoid:

```text
Fish Hiding — Fish Hiding Causes — Fish Hiding Solution — Fish Hiding Guide
```

Use a natural search-oriented title instead.

---

# 24. Structured Data

Do not invent a “Problem” schema that does not exist.

Use only applicable schema types supported by the page content.

Potential supporting schemas include:

- WebPage
- BreadcrumbList
- Article where the page genuinely qualifies as an article

The visible content must match the structured data.

---

# 25. Indexation Policy

Canonical Problem pages should generally be indexable when they:

- Solve a meaningful user problem.
- Contain useful original guidance.
- Have sufficient content depth.
- Are stable URLs.
- Are not duplicate pages.

Do not index:

```text
/problem?filter=...
/problems/diagnose?answers=...
```

or other transient diagnosis state URLs unless there is an explicit SEO reason.

Diagnosis is primarily an interactive utility.

---

# 26. Diagnosis URL Policy

Preferred:

```text
/problems/diagnose
```

User state should remain client/application state unless there is a deliberate shareable-session feature.

Avoid creating:

```text
/problems/diagnose?step=4&symptom=fish&answer=...
```

as indexable content.

If shareable diagnosis results are ever introduced, they require a separate canonical/indexation design.

---

# 27. Search / Browse Problems

The Problems hub should support fast discovery.

Potential UX:

```text
Problems
│
├── Search
├── Browse by category
├── Common problems
└── Diagnose
```

Do not make search/filter states crawlable by default.

---

# 28. Problem Quality Gate

A Problem page should not be published/indexed unless:

```text
[ ] Clear problem definition
[ ] Observable symptoms
[ ] Plausible causes
[ ] Actionable checks
[ ] Prioritized actions
[ ] “What not to do” where useful
[ ] Appropriate urgency/caveat
[ ] Related tools where relevant
[ ] Related entities where relevant
[ ] Related articles where available
[ ] Canonical
[ ] Metadata
[ ] Breadcrumb
[ ] Mobile UX
[ ] Accessibility
[ ] No unsupported claims
```

---

# 29. Data Model Direction

If Problems are CMS-backed, conceptual fields may include:

```text
Problem
├── title
├── slug
├── summary
├── category
├── symptoms[]
├── causes[]
├── checks[]
├── actions[]
├── avoid[]
├── urgency
├── caveats[]
├── relatedTools[]
├── relatedEntities[]
├── relatedArticles[]
├── relatedProblems[]
└── seo
```

This is a conceptual model.

Do not modify the Sanity schema until the current source schema is audited.

---

# 30. Logic vs Editorial Data

Recommended separation:

### Code

- Diagnosis flow logic.
- Scoring/ranking.
- Validation.
- UI state.
- Interaction behavior.

### CMS / structured content

Potentially:

- Problem descriptions.
- Symptoms.
- Causes.
- Checks.
- Actions.
- Editorial relationships.
- SEO fields.

Do not move algorithmic logic into CMS merely to make it editable.

---

# 31. Diagnosis Scoring

If the current Diagnosis implementation uses scoring, audit it before changing it.

A reasonable conceptual model is:

```text
Observed symptoms
       +
Parameter evidence
       +
Recent changes
       +
Context
       ↓
Candidate problems
       ↓
Ranked possibilities
```

Do not expose an arbitrary numeric “confidence percentage” unless the underlying scoring method justifies it.

Prefer qualitative evidence:

- Strong match
- Possible match
- Weak match

if that better reflects the actual algorithm.

---

# 32. Safety & Animal Welfare

This system affects real aquarium animals.

Therefore:

- Avoid overconfident diagnosis.
- Encourage measurement when measurement is relevant.
- Avoid recommending blind medication.
- Avoid dangerous chemical combinations.
- Clearly separate general husbandry guidance from disease diagnosis.
- Encourage professional veterinary help where appropriate for serious disease situations.

This is a product-quality requirement, not merely SEO copy.

---

# 33. Accessibility

Diagnosis and Problem pages must support:

- Keyboard navigation.
- Visible focus.
- Semantic labels.
- Accessible form errors.
- Screen-reader-friendly result updates.
- Clear headings.
- Sufficient contrast.
- Reduced-motion support.

For diagnosis:

```text
Question
Answer options
Current step
Result
```

must be understandable to assistive technology.

---

# 34. Mobile UX

Troubleshooting is likely to happen beside the aquarium, often on a phone.

Priorities:

1. Large tap targets.
2. Short sections.
3. Sticky/obvious progress where useful.
4. Easy back/previous behavior.
5. Results readable without horizontal scrolling.
6. Calculator/tool handoff should preserve context where technically possible.

Avoid large decorative blocks that push the actual troubleshooting content down.

---

# 35. Animation Policy

Animation is secondary.

Useful animation:

- Diagnosis step transition.
- Result reveal.
- Progress transition.
- Loading state.

Avoid:

- Long transitions.
- Decorative animation before useful content.
- Motion that hides an urgent result.
- Animation that increases layout shift.

Respect `prefers-reduced-motion`.

---

# 36. Performance

Preferred:

```text
Server-rendered Problem content
        +
Client-side Diagnosis interaction
```

Do not convert the entire Problems section to a Client Component unnecessarily.

The diagnosis wizard may be client-side while the canonical problem page remains primarily server-rendered.

---

# 37. Analytics

Recommended events:

```text
problem_view
problem_related_tool_click
problem_related_article_click
problem_related_entity_click
diagnosis_start
diagnosis_question_answer
diagnosis_complete
diagnosis_result_click
diagnosis_restart
```

Track useful aggregate behavior without collecting unnecessary personal information.

Important metrics:

- Problem organic landing sessions.
- Diagnosis starts.
- Diagnosis completion rate.
- Result → Problem click rate.
- Problem → Tool click rate.
- Problem → Article click rate.
- Problem → Entity click rate.
- Diagnosis abandonment by step.
- Search → Problem click rate.

---

# 38. Growth Loop

The Problems system should create a feedback loop:

```text
Google search
     ↓
Problem page
     ↓
Useful diagnosis / tool
     ↓
More AquaMind pages visited
     ↓
Better engagement
     ↓
More discoverable resources
```

Separately:

```text
Diagnosis searches / user behavior
     ↓
Unresolved intents
     ↓
Content gaps
     ↓
Quản lý chủ đề
     ↓
New article decision
```

The second loop is a handoff to the content strategy chat, not an automatic article generator.

---

# 39. Implementation Phases

## WEB-06A — Problems Inventory

Audit all current:

```text
/problems
/problems/[slug]
```

Record:

- URL
- Category
- Content depth
- Sections
- Metadata
- Schema
- Related links
- Tool links
- Entity links
- Article links
- Indexability
- UX status

---

## WEB-06B — Problem Page Template

Standardize the canonical Problem page structure.

Do not rewrite every problem's editorial content during this phase.

---

## WEB-06C — Diagnosis Audit

Audit the current Diagnosis implementation:

- Question tree.
- Scoring.
- Result mapping.
- Back behavior.
- Restart behavior.
- Validation.
- Accessibility.
- Mobile UX.
- Edge cases.

Do not redesign the algorithm without first documenting the existing one.

---

## WEB-06D — Knowledge Graph Integration

Connect:

```text
Problem ↔ Tool
Problem ↔ Entity
Problem ↔ Article
Problem ↔ Problem
Problem ↔ Learning Path
```

---

## WEB-06E — Indexation & Metadata

Implement:

- Canonical.
- Metadata.
- Breadcrumb.
- Structured data where justified.
- Diagnosis URL policy.

---

## WEB-06F — Analytics

Implement event tracking.

---

## WEB-06G — QA

Test:

- Desktop.
- Mobile.
- Keyboard.
- Screen reader basics.
- Invalid input.
- Empty state.
- No-match diagnosis.
- Multiple possible matches.
- Back/restart.
- Deep links.
- 404.
- Slow network.
- Reduced motion.

---

# 40. No-Match State

Diagnosis must have a useful fallback.

Example conceptual behavior:

```text
No strong match found.

Try:
1. Check water parameters.
2. Review recent changes.
3. Browse common problems.
4. Start again with different symptoms.
```

Do not invent a diagnosis merely because the system needs a result.

---

# 41. Multiple-Match State

When several problems fit:

```text
Possible causes

1. Strong match
2. Possible match
3. Possible match
```

For each:

- Why it fits.
- What to check next.

The goal is narrowing the problem, not pretending to know the answer.

---

# 42. Orphan Prevention

Every canonical Problem page should be discoverable through at least one meaningful path:

```text
Problems hub
OR
Article
OR
Tool
OR
Entity
OR
Learning Path
```

Do not rely solely on sitemap inclusion.

---

# 43. Click Depth

Target:

```text
Homepage
  ↓
Problems
  ↓
Problem
```

or:

```text
Article
  ↓
Problem
```

Avoid requiring multiple unrelated navigation steps to reach a problem.

---

# 44. Breadcrumb Strategy

Canonical hierarchy:

```text
Home
 > Problems
 > Category
 > Problem
```

If the same problem can be reached through multiple paths, maintain one canonical breadcrumb hierarchy.

Do not create different canonical URLs for every navigation path.

---

# 45. Search Intent Coverage

Problem pages should cover user intents such as:

```text
"What is happening?"
"Why is this happening?"
"What should I check?"
"How do I fix it?"
"Can I prevent it?"
```

The page should answer these naturally.

This is an architecture requirement; exact keyword targeting belongs to “Quản lý chủ đề”.

---

# 46. What WEB-06 Must NOT Do

Do not:

- Decide which new problem pages to create based on search volume.
- Decide the next blog article.
- Generate hundreds of thin problem pages.
- Automatically generate medical/disease diagnoses.
- Add fake certainty.
- Create indexable diagnosis states.
- Duplicate article content inside every problem page.
- Add unnecessary AI just because it sounds advanced.

---

# 47. Definition of Done

WEB-06 is complete when:

```text
[ ] Existing Problems inventory complete
[ ] Problem taxonomy documented
[ ] Canonical Problem template implemented
[ ] Diagnosis flow audited
[ ] Diagnosis result model documented
[ ] Problem ↔ Tool linking supported
[ ] Problem ↔ Entity linking supported
[ ] Problem ↔ Article linking supported
[ ] Problem ↔ Problem linking supported
[ ] Diagnosis state indexation controlled
[ ] Metadata/canonical verified
[ ] Structured data validated where applicable
[ ] Accessibility baseline passes
[ ] Mobile UX passes
[ ] Analytics implemented
[ ] No-match state works
[ ] Multiple-match state works
[ ] Build passes
[ ] Tests pass
[ ] Production smoke test passes
[ ] CURRENT_STATE updated
```

---

# 48. Strategic Outcome

After WEB-06:

```text
                 AQUAMIND PROBLEMS
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
          Browse               Diagnose
              │                   │
              ↓                   ↓
        Problem Page ←──── Result
              │
      ┌───────┼────────┐
      ↓       ↓        ↓
    Tools   Entities  Articles
      │       │        │
      └───────┼────────┘
              ↓
         Knowledge Graph
              ↓
        Better Discovery
              ↓
           Traffic
```

The long-term product vision is:

> **AquaMind should help users move from an observation to an explanation, from an explanation to an action, and from an action to deeper aquarium knowledge.**

---

# 49. Relationship to Other AquaMind Chats

## 🗂️ Quản lý chủ đề

Owns:

- Search Console.
- SERP research.
- Content gap.
- New article priority.
- Publishing roadmap.
- Updating content priorities based on traffic.

## ✍️ Viết Content

Owns:

- Writing approved articles.
- Following `AquaMind_CONTENT_PRODUCTION_WORKFLOW.md`.
- Article research and production.

## 🌐 Xây dựng website

Owns:

- Problem architecture.
- Diagnosis UX.
- Diagnosis technical implementation.
- SEO/indexation behavior.
- Internal linking.
- Tool/entity integration.
- Analytics.
- Performance.
- Security.

This separation must remain explicit.
