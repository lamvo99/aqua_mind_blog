# AquaMind WEB-07 — Analytics & Growth System

**Status:** Strategic specification / implementation-ready planning document  
**Primary goal:** Build a measurement and growth system that supports organic traffic growth before monetization optimization.  
**Scope:** Analytics architecture, Search Console measurement, event taxonomy, funnels, dashboards, SEO/content signals, UX signals, growth loops, experimentation and decision rules.  
**Out of scope:** Selecting the next article/topic; that belongs to “Quản lý chủ đề”. Article production belongs to “Viết Content”.

## 1. Objective

AquaMind needs to answer:

1. Where do users come from?
2. What pages bring them in?
3. What do they do after landing?
4. Which features help them continue?
5. What should the website team improve next?

Target system:

```text
Search / Referral / Direct / Social
                ↓
           Landing Page
                ↓
      Article / Entity / Tool / Problem
                ↓
         User Interaction
                ↓
      Internal Navigation
                ↓
       Engagement / Return
                ↓
             Data
                ↓
        Insight / Diagnosis
                ↓
       Website Improvement
                ↓
         Growth Loop
```

The purpose is not to maximize vanity metrics. It is to identify which changes produce useful organic growth and better user journeys.

## 2. Growth Priority

Current strategic priority:

```text
Organic Traffic Growth
        ↓
Content / UX / Internal Discovery Optimization
        ↓
Stable Audience
        ↓
Ads / AdSense / Other Monetization
```

Primary outcome:

> More relevant users discover AquaMind through organic search and successfully find useful aquarium information, tools and resources.

Monetization metrics must not dominate early website decisions.

## 3. Measurement Layers

```text
Layer 1 — Search visibility
Google Search Console

Layer 2 — User behavior
Analytics

Layer 3 — Website health
Performance / technical monitoring

Layer 4 — Content intelligence
CMS + page/entity/tool/problem metadata

Layer 5 — Business / monetization
Ads and monetization platforms later
```

No single layer is sufficient.

## 4. Google Search Console

Use Search Console as the primary source for organic search performance.

Track:

- Clicks
- Impressions
- CTR
- Average position
- Queries
- Landing pages
- Country where useful
- Device
- Search appearance where relevant
- Indexing status
- Core Web Vitals where available
- Sitemap/indexation signals

Search Console explains what happened **before the click**. It does not replace behavioral analytics.

## 5. Analytics

Analytics should answer what happens after the user enters AquaMind.

Minimum dimensions:

- Landing page
- Page type
- Content group
- Referrer/source
- Device
- Country where useful
- Session path
- Engagement
- Key interactions

Recommended page types:

```text
home
article
entity
tool
problem
diagnosis
learning_path
inspiration
hub
start_here
other
```

These must map to actual source routes.

## 6. Content Grouping

Recommended secondary grouping:

```text
content_group
```

Possible values, subject to the existing IA:

```text
Freshwater
Saltwater / Reef
Aquascaping
Equipment
Water Chemistry
Beginner
Troubleshooting
Species
Plants
Corals
```

Do not introduce a grouping that conflicts with the existing taxonomy.

## 7. Landing Page Measurement

For every important page type:

```text
Organic entrances
↓
Engagement
↓
Next-page interaction
↓
Useful action
```

Examples:

### Article

```text
Search → Article → Related article / entity / tool
```

### Tool

```text
Search → Tool → Calculate → Next resource
```

### Problem

```text
Search → Problem → Tool / Article / Entity
```

### Entity

```text
Search → Entity → Related knowledge
```

## 8. Core Event Taxonomy

Keep events small and meaningful.

Core:

```text
page_view
scroll_depth
internal_link_click
external_link_click
search
```

Tools:

```text
tool_view
tool_calculate
tool_result
tool_error
tool_reset
tool_copy_result
```

Problems:

```text
problem_view
problem_related_tool_click
problem_related_article_click
problem_related_entity_click
```

Diagnosis:

```text
diagnosis_start
diagnosis_question_answer
diagnosis_complete
diagnosis_result_click
diagnosis_restart
```

Content/navigation:

```text
article_related_content_click
entity_related_content_click
learning_path_step_click
```

Only implement events that are useful for decisions.

## 9. Event Naming

Use:

```text
noun_action
```

Examples:

```text
tool_calculate
diagnosis_complete
problem_view
```

Avoid multiple names for the same behavior.

## 10. Event Parameters

Useful minimum parameters:

```text
page_type
page_slug
content_group
source_page
destination_page
```

Tool:

```text
tool_slug
```

Problem:

```text
problem_slug
```

Entity:

```text
entity_type
entity_slug
```

Diagnosis:

```text
diagnosis_step
result_problem_slug
```

Do not collect unnecessary personal or sensitive data.

## 11. Internal Discovery Measurement

Track meaningful internal paths:

```text
Article → Tool
Article → Entity
Article → Problem
Tool → Article
Tool → Entity
Problem → Tool
Problem → Article
Entity → Article
Learning Path → Resource
```

Useful metric:

```text
Internal Discovery Rate
=
sessions with meaningful internal-resource interaction
/
eligible sessions
```

This measures the architecture created in WEB-03.

## 12. Tool Funnel

```text
Tool Landing
      ↓
Calculator Interaction
      ↓
Successful Result
      ↓
Next Resource
```

Measure:

- Tool landing sessions
- Calculator interaction rate
- Completion rate
- Error rate
- Result → next-resource rate

## 13. Diagnosis Funnel

```text
Diagnosis Start
      ↓
Questions
      ↓
Diagnosis Complete
      ↓
Result
      ↓
Canonical Problem
```

Measure:

- Start rate
- Completion rate
- Abandonment by step
- No-match rate
- Multiple-match rate
- Result click rate
- Problem continuation

## 14. Article Funnel

```text
Organic Landing
      ↓
Engagement
      ↓
Internal Discovery
      ↓
Second Resource
```

Track:

- Organic entrances
- Engaged sessions
- Scroll reach
- Related-content click rate
- Tool click rate
- Problem click rate
- Entity click rate
- Session continuation

Do not define article success only by time-on-page.

## 15. Entity Funnel

```text
Organic Landing
      ↓
Entity Detail
      ↓
Related Article / Tool / Problem
```

Track:

- Organic entrances
- Related-content clicks
- Entity-to-article rate
- Entity-to-tool rate
- Entity-to-problem rate

This measures WEB-04.

## 16. Problem Funnel

```text
Organic Landing
      ↓
Problem
      ↓
What to Check
      ↓
Tool / Article / Entity
```

Track:

- Organic entrances
- Tool click rate
- Article click rate
- Entity click rate
- Diagnosis start rate
- Continuation rate

## 17. Acquisition Channels

At minimum distinguish:

```text
Organic Search
Direct
Referral
Social
Email
Other
```

Organic Search must be analyzed separately when making SEO decisions.

## 18. Search Console ↔ Analytics

The two systems answer different questions:

```text
Search Console
“What happened before the click?”

Analytics
“What happened after the click?”
```

Example:

```text
High impressions
+ Low CTR
+ Good engagement after click

→ Potential SERP title/intent/ranking opportunity
```

Another:

```text
Good CTR
+ Poor engagement

→ Potential search-promise / landing-experience mismatch
```

These are diagnostic patterns, not automatic conclusions.

## 19. SEO Opportunity Matrix

| Search Console | Analytics | Likely investigation |
|---|---|---|
| High impressions, low CTR | Good engagement | SERP title/meta |
| High impressions, low CTR | Poor engagement | Intent/content alignment |
| Low impressions, good CTR | Good engagement | Ranking/internal authority |
| Good clicks | Poor continuation | UX/internal links |
| Good traffic | High tool interaction | Expand tool ecosystem |
| Good traffic | Low interaction | Review relevance/UX |
| High impressions | Position stuck | Internal linking/content/technical review |

## 20. Traffic Quality

Do not optimize solely for:

```text
Pageviews
```

Prefer:

```text
Relevant organic entrances
+
Useful interaction
+
Internal discovery
+
Returning users
```

A quick exit is not automatically bad; interpret it according to intent.

## 21. Organic Growth KPIs

Primary:

```text
Organic clicks
Organic impressions
Organic landing sessions
Indexed quality pages
```

Secondary:

```text
CTR
Average position
Internal discovery rate
Tool interaction rate
Diagnosis completion rate
Entity continuation rate
Problem continuation rate
```

Tertiary:

```text
Returning organic users
Pages/session
Engaged sessions
Monetizable traffic
```

Monetization becomes more important later.

## 22. Growth Dashboard MVP

```text
AQUAMIND GROWTH
│
├── Organic Overview
│   ├── Clicks
│   ├── Impressions
│   ├── CTR
│   └── Position
│
├── Landing Pages
│   ├── Articles
│   ├── Entities
│   ├── Tools
│   └── Problems
│
├── Discovery
│   ├── Internal click rate
│   ├── Second-resource rate
│   └── Top paths
│
├── Tools
│   ├── Usage
│   ├── Completion
│   └── Errors
│
├── Diagnosis
│   ├── Starts
│   ├── Completion
│   └── Result continuation
│
└── Technical
    ├── Core Web Vitals
    ├── Errors
    └── Indexation
```

The first dashboard does not need dozens of charts.

## 23. Weekly Growth Review

Review:

1. Organic traffic
2. Search Console winners
3. Search Console opportunities
4. Landing-page performance
5. Tool performance
6. Problem/Diagnosis performance
7. Internal-link performance
8. Technical issues
9. Experiments

Avoid daily obsession with noisy metrics.

## 24. Monthly Growth Review

Answer:

```text
What grew?
Why?
What declined?
Why?
Which page types performed best?
Which internal paths worked?
Which features were ignored?
Which technical problems appeared?
What should we improve next?
```

The result feeds the Website roadmap.

Topic decisions remain in “Quản lý chủ đề”.

## 25. Growth Loop

```text
Measure
  ↓
Identify bottleneck
  ↓
Form hypothesis
  ↓
Implement improvement
  ↓
Measure again
  ↓
Keep / revert / iterate
```

Example:

```text
High article traffic
+ low internal discovery
        ↓
Improve contextual links
        ↓
Measure tool/article/entity continuation
```

## 26. Experiment Framework

Each experiment should contain:

```text
Experiment ID
Date
Page / surface
Hypothesis
Change
Primary metric
Secondary metrics
Baseline
Observation window
Result
Decision
Notes
```

No complex experimentation platform is required initially.

## 27. Avoiding False Conclusions

Traffic changes can come from:

- Seasonality
- Search algorithm changes
- New content
- Search-demand changes
- External links
- SERP changes
- Technical changes

Do not attribute every movement to the latest website change.

Use reasonable comparison windows.

## 28. Technical Monitoring

Monitor:

```text
Build failures
Runtime errors
404s
5xx errors
Broken internal links
Slow pages
Core Web Vitals
Indexation anomalies
Sitemap health
```

Where practical, correlate issues with deployment/release history.

## 29. Search Console Operating Process

Weekly/monthly checks:

```text
Pages losing clicks
Pages gaining impressions
Queries with rising impressions
Queries with high CTR
Queries near page 1
Newly indexed pages
Excluded pages
Crawling/indexation anomalies
```

Use this for opportunity discovery and technical detection.

## 30. Topic Management Handoff

If WEB-07 finds:

```text
Search query / intent
High impressions
No strong AquaMind destination
```

do NOT automatically decide to write an article.

Instead:

```text
Analytics / Search Console insight
        ↓
Content opportunity
        ↓
Quản lý chủ đề
        ↓
SERP + content-gap validation
        ↓
Final Content Priority
        ↓
Viết Content
```

This preserves the three-chat workflow.

## 31. Website Improvement Handoff

Website data should directly inform the Website roadmap.

Examples:

```text
High article traffic + low internal discovery
→ Internal-link/UX improvement

High tool traffic + high errors
→ Tool UX/technical improvement

High diagnosis abandonment at step 3
→ Diagnosis UX improvement

High entity traffic + low continuation
→ Entity-page improvement
```

## 32. Content vs Website Decision Boundary

### Content problem

```text
Users search for X
AquaMind has no strong content
```

→ Quản lý chủ đề.

### Website problem

```text
Users arrive at X
but cannot discover related resources
```

→ Xây dựng website.

### Mixed problem

```text
Users arrive
but content does not satisfy intent
```

→ Evaluate content and website evidence together.

## 33. Privacy

Collect only what is needed.

Avoid unnecessary collection of:

- Personal identifiers
- Sensitive information
- Exact location
- Raw user-entered aquarium data

For tool/diagnosis events, prefer aggregate or categorical values.

Do not send raw sensitive form data to analytics.

## 34. Consent / Compliance

Before enabling additional tracking:

- Review applicable consent requirements.
- Review cookie behavior.
- Review analytics provider settings.
- Review data retention.
- Review IP/location handling.

Do not add tracking blindly.

## 35. Analytics Performance

Analytics must not materially degrade the website.

Requirements:

- Avoid unnecessary scripts.
- Avoid blocking rendering.
- Avoid excessive event volume.
- Batch/throttle events where practical.
- Prefer one coherent analytics architecture.
- Do not add a separate analytics library for every feature.

## 36. Implementation Phases

### WEB-07A — Analytics Inventory

Audit the current implementation:

```text
Provider
Tracking scripts
Events
Page views
Consent
Environment variables
Production behavior
```

Document existing behavior before adding anything.

### WEB-07B — Page Taxonomy

Standardize:

```text
page_type
content_group
```

where appropriate.

### WEB-07C — Core Events

Start with high-value events:

```text
internal_link_click
tool_calculate
diagnosis_start
diagnosis_complete
```

Then expand only when justified.

### WEB-07D — Funnel Tracking

Implement article, tool, problem, diagnosis and entity continuation funnels.

### WEB-07E — Search Console Operating Process

Document weekly/monthly review.

### WEB-07F — Growth Dashboard

Create the first useful dashboard.

### WEB-07G — Experiment Framework

Create experiment log and decision rules.

### WEB-07H — Privacy & Performance QA

Validate:

- Consent
- Data minimization
- Script performance
- Event duplication
- Production behavior

## 37. Definition of Done

```text
[ ] Current analytics implementation audited
[ ] Search Console measurement documented
[ ] Page taxonomy defined
[ ] Content grouping defined
[ ] Core event taxonomy defined
[ ] Event naming standardized
[ ] Internal discovery tracked
[ ] Tool funnel tracked
[ ] Diagnosis funnel tracked
[ ] Problem funnel tracked
[ ] Entity continuation tracked
[ ] Privacy reviewed
[ ] Analytics performance reviewed
[ ] Growth dashboard MVP defined/implemented
[ ] Weekly review process documented
[ ] Monthly review process documented
[ ] Experiment log established
[ ] Content handoff rules documented
[ ] Website improvement rules documented
[ ] Build passes
[ ] Tests pass
[ ] Production smoke test passes
[ ] CURRENT_STATE updated
```

## 38. Strategic Outcome

```text
                   AQUAMIND DATA
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      SEARCH         BEHAVIOR      TECHNICAL
      CONSOLE        ANALYTICS     MONITORING
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                  Growth Insights
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
       Content Opportunity    Website Opportunity
              ↓                   ↓
      Quản lý chủ đề        Xây dựng website
              ↓                   ↓
          New Content       UX / SEO / Feature
              └─────────┬─────────┘
                        ↓
                     Growth
```

The objective is not simply to increase sessions.

The objective is to build a website where:

> More people find AquaMind through search, more of them find the next useful resource, and the system becomes better at helping aquarium keepers over time.

## 39. Relationship to Other AquaMind Chats

### 🗂️ Quản lý chủ đề

Owns:

- Search Console topic discovery
- SERP research
- Keyword/content gaps
- Final Content Priority
- Master Traffic Roadmap
- Publishing priorities

### ✍️ Viết Content

Owns:

- Article production
- `AquaMind_CONTENT_PRODUCTION_WORKFLOW.md`
- Article research
- Final article content

### 🌐 Xây dựng website

Owns:

- Analytics implementation
- Website growth experiments
- UX improvements
- Technical SEO
- Internal linking
- Tools
- Problems/Diagnosis
- Database/Entities
- Performance
- Security
- Monetization readiness

The Website chat may surface content opportunities, but must hand the content decision to “Quản lý chủ đề”.

## 40. Immediate Next Step

Before implementing new analytics events:

```text
CURRENT SOURCE AUDIT
        ↓
What analytics already exists?
        ↓
What provider?
        ↓
What events?
        ↓
What Search Console integration?
        ↓
What consent/privacy behavior?
        ↓
What is missing?
        ↓
Implement only the gaps
```

Do not blindly add a second analytics system or duplicate existing tracking.
