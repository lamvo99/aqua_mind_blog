# AquaMind WEB-08 — UX, Performance & Animation Audit / Improvement Specification

**Status:** Strategic specification / implementation-ready planning document  
**Primary objective:** Establish a premium, fast, accessible and conversion-friendly AquaMind experience without sacrificing SEO or organic growth.  
**Scope:** Home, global UI, navigation, responsive UX, animation, interaction design, performance, Core Web Vitals, images, fonts, loading, accessibility, error/empty states and QA.  
**Important:** This document is a specification for OpenCode to **audit the current source first**. It must not assume that a feature, animation, component or optimization already exists.

---

# 1. Objective

AquaMind is already deployed.

The purpose of WEB-08 is not to redesign the website blindly.

The correct sequence is:

```text
Current Production
        ↓
Current Source Audit
        ↓
UI/UX Inventory
        ↓
Animation Inventory
        ↓
Performance Inventory
        ↓
Problems / Evidence
        ↓
Prioritized Improvements
        ↓
Implementation
        ↓
Measurement
```

The audit must establish the actual current state before implementation.

---

# 2. Primary Questions

OpenCode must be able to answer these questions after the audit.

## Home

- What does the Home page currently contain?
- What is the exact section order?
- Which sections are server-rendered?
- Which sections are client components?
- Is there a hero animation?
- Is there an aquarium animation?
- Are there hover effects?
- Are there scroll-triggered animations?
- Are there entrance animations?
- Are animations CSS, Framer Motion, GSAP, SVG, canvas, Lottie, video or another implementation?
- Are animations currently disabled on reduced-motion devices?
- Is there any animation that causes layout shift?
- Does the Home page load images eagerly or lazily?
- What is the current LCP candidate?
- What is the likely bottleneck?

## Global UI

- What header/navigation exists?
- Is mobile navigation implemented?
- What footer exists?
- What global buttons/components exist?
- What design tokens are already defined?
- Are there duplicated UI patterns?
- Are default browser styles visible anywhere?

## Responsive

- Does the UI work at mobile widths?
- Tablet?
- Desktop?
- Ultrawide?
- Are cards overflowing?
- Are tables horizontally scrollable?
- Are tap targets large enough?
- Does typography scale correctly?

## Performance

- What scripts are loaded?
- What fonts are loaded?
- What images are loaded?
- Are images optimized?
- Is JavaScript unnecessarily shipped to the client?
- Are Client Components overused?
- Are large dependencies present?
- Are third-party scripts present?
- Are animations expensive?
- Are layout shifts occurring?
- Are pages statically generated/server rendered where appropriate?

## Accessibility

- Keyboard navigation?
- Focus states?
- Semantic HTML?
- Heading hierarchy?
- Image alt text?
- Form labels?
- Reduced motion?
- Color contrast?
- Screen-reader behavior?
- Mobile touch accessibility?

---

# 3. Non-Negotiable Audit Rule

OpenCode must not report:

> “Animation is missing.”

unless the source and production behavior have actually been inspected.

Instead report:

```text
Feature:
Status:
Evidence:
Source location:
Implementation:
Desktop:
Mobile:
Performance impact:
Accessibility:
Recommendation:
```

Use:

```text
IMPLEMENTED
PARTIAL
MISSING
UNKNOWN
BROKEN
NOT APPLICABLE
```

---

# 4. Audit Evidence Levels

Every finding should have an evidence level.

### A — Verified in source

The implementation is directly confirmed in source.

### B — Verified in production

The behavior is confirmed on the deployed website.

### C — Inferred

The behavior is inferred from source architecture but not directly observed.

### D — Unknown

Insufficient evidence.

Never convert C or D into A.

---

# 5. Audit Deliverables

OpenCode must produce/update a complete report containing:

```text
CURRENT_UI_STATE.md
```

or the project's established equivalent.

The report should include:

1. Route inventory
2. Component inventory
3. Design-system inventory
4. Home structure
5. Animation inventory
6. Interaction inventory
7. Responsive audit
8. Accessibility audit
9. Performance audit
10. Image/font audit
11. Client/server architecture audit
12. Third-party script audit
13. Loading-state audit
14. Error/empty-state audit
15. UX issues
16. Priority matrix
17. Recommended implementation phases
18. Verification results

Do not create duplicate state files if the project already has a canonical CURRENT_STATE document. Update the existing canonical document.

---

# 6. Route Inventory

Inspect all public routes.

Categorize:

```text
Home
Article
Database / Entity
Tool
Problem
Diagnosis
Learning Path
Inspiration
Start Here
Hub
Other
```

For each route record:

```text
Route
Page type
Rendering mode
Main components
Data source
Interactive components
Images
Animation
SEO metadata
Potential performance risks
```

---

# 7. Home Page Audit

The Home page is a high-priority surface.

Document exact structure:

```text
Header
↓
Hero
↓
Section 1
↓
Section 2
↓
Section 3
↓
...
↓
Footer
```

Do not use generic descriptions.

Record the actual implementation.

---

# 8. Home Hero Audit

Inspect:

- Hero headline
- Supporting copy
- Primary CTA
- Secondary CTA
- Visual
- Background
- Image/video
- Animation
- Decorative elements
- Responsive behavior
- Loading behavior

Answer:

```text
Does the hero communicate AquaMind's value within seconds?
Does the CTA make sense?
Does the visual reinforce the aquarium knowledge/product identity?
Does the hero consume excessive vertical space?
Does it delay LCP?
```

---

# 9. Home Animation Audit

This is a mandatory audit area.

Determine whether Home currently has:

### Entrance animation

Example:

```text
Hero fades/slides in
Cards appear progressively
```

### Scroll animation

Example:

```text
Section enters viewport
Illustration moves
```

### Hover interaction

Example:

```text
Card lift
Image scale
Button transition
```

### Ambient animation

Example:

```text
Water movement
Particles
Fish movement
Floating elements
```

### Interactive animation

Example:

```text
User interaction changes visual state
```

For each:

```text
Animation
Location
Technology
Trigger
Duration
Easing
Desktop
Mobile
Reduced motion
Performance risk
Recommendation
```

---

# 10. Animation Quality Standard

AquaMind should use animation to communicate:

- Hierarchy
- Continuity
- Interaction
- State change
- Brand atmosphere

Not merely decoration.

Preferred principles:

```text
Fast
Subtle
Purposeful
Predictable
Interruptible
Accessible
```

Avoid:

```text
Long page transitions
Excessive parallax
Constant motion
Large particle systems
Autoplay video backgrounds
Animation that blocks content
```

---

# 11. Recommended Animation Hierarchy

If the audit determines that animation is missing or weak, prioritize:

```text
Level 1 — Micro interactions
    ↓
Level 2 — Hero / section entrance
    ↓
Level 3 — Card / content interactions
    ↓
Level 4 — Brand ambient motion
    ↓
Level 5 — Complex aquarium simulation
```

Do not jump directly to Level 5.

---

# 12. Reduced Motion

All non-essential animation should respect:

```text
prefers-reduced-motion
```

When reduced motion is enabled:

```text
Fade/transform animation
        ↓
Minimal/no motion
```

Content and state changes must remain understandable.

---

# 13. Animation Performance

For every animation inspect:

- Main-thread work
- Layout changes
- Paint cost
- Compositing
- Image size
- DOM/SVG complexity
- JavaScript execution

Prefer animations of properties that can be efficiently composited.

Avoid unnecessary:

```text
top
left
width
height
```

animations when transform/opacity can achieve the same result.

---

# 14. Layout Shift

Identify elements that change size after initial rendering.

Common risks:

- Images without dimensions
- Fonts swapping
- Dynamic cards
- Ads later
- Client-rendered content
- Animation that changes layout
- Async CMS content

Important requirement:

> Animation must never be used in a way that causes avoidable CLS.

---

# 15. Core Web Vitals

Audit:

### LCP

Identify:

```text
LCP element
Loading source
Image/font dependency
Render delay
Server response dependency
```

### INP

Inspect:

```text
Heavy event handlers
Large client bundles
Complex animations
Long JavaScript tasks
```

### CLS

Inspect:

```text
Images
Fonts
Dynamic components
Animations
Async content
```

Also record:

- TTFB
- FCP
- Total blocking time where available
- JS bundle size
- Image payload
- Number of requests

---

# 16. Performance Evidence

Where possible use:

```text
Lighthouse
PageSpeed Insights
Chrome DevTools
Next.js build output
Production network inspection
```

Do not rely on a single synthetic test.

Record test conditions:

```text
URL
Device profile
Network profile
Date
Tool
Score
Core Web Vitals
Main findings
```

---

# 17. Next.js Rendering Audit

Inspect whether each page is appropriately:

```text
Static / SSG
Server-rendered
Client-rendered
Hybrid
```

Look for unnecessary Client Components.

Questions:

- Does a component actually need browser state?
- Does it need event handlers?
- Does it need browser APIs?
- Could only a small interactive island be client-side?

Avoid converting whole pages into Client Components merely for small interactions.

---

# 18. JavaScript Bundle Audit

Identify:

- Large dependencies
- Duplicate libraries
- Client-only packages
- Unused dependencies
- Large icon packages
- Animation libraries
- Analytics packages
- Editor/CMS packages leaking into client bundles

For each:

```text
Dependency
Why loaded
Bundle impact
Used where
Can it be removed?
Can it be dynamically imported?
```

Do not remove a dependency without confirming usage.

---

# 19. Dynamic Import Strategy

Use dynamic imports when a component is:

- Heavy
- Below the fold
- Interactive
- Not required for first paint

Potential candidates:

```text
Complex calculators
Charts
Diagnosis UI
Heavy visualizations
Large editors
```

Do not dynamically import critical above-the-fold content merely for theoretical optimization.

---

# 20. Image Audit

For every major page inspect:

- Format
- Dimensions
- Compression
- Responsive sizing
- `next/image` usage where applicable
- Lazy loading
- Priority loading
- Aspect ratio
- Alt text
- Placeholder behavior

Important rule:

> The primary LCP image should not accidentally be lazy-loaded.

---

# 21. Image Strategy

Recommended:

```text
Hero / LCP image
→ optimized + correctly prioritized

Below-fold images
→ lazy-loaded

Decorative images
→ minimal payload

Large visual
→ responsive source sizes
```

Do not preload every image.

---

# 22. Font Audit

Inspect:

- Font family
- Font files
- Weight count
- Variable fonts
- Preload
- `font-display`
- Local vs external provider
- Duplicate font loading

Avoid loading many weights that are never used.

---

# 23. Typography UX

Audit:

- Heading scale
- Body readability
- Line length
- Line height
- Mobile scaling
- Link visibility
- Code/table readability
- Number/measurement readability

For article content, prioritize comfortable reading over excessive visual density.

---

# 24. Header / Navigation Audit

Inspect:

### Desktop

- Logo
- Primary nav
- Dropdowns
- Search
- CTA
- Active state

### Mobile

- Menu trigger
- Navigation drawer/menu
- Close behavior
- Focus trap if modal-style
- Scroll locking
- Active route
- Touch target

Test keyboard navigation.

---

# 25. Footer Audit

Inspect:

- Information hierarchy
- Important links
- Legal/privacy
- Social links
- Newsletter if present
- Sitemap-like discovery
- Mobile stacking

Avoid turning the footer into an SEO keyword dump.

---

# 26. Design System Audit

Inventory:

```text
Colors
Typography
Spacing
Radius
Shadows
Buttons
Cards
Inputs
Badges
Tabs
Breadcrumbs
Tables
Alerts
Empty states
Loading states
```

Determine whether each is:

```text
Centralized
Partially centralized
Duplicated
Hard-coded
```

---

# 27. Component Consistency

Find duplicate patterns.

Examples:

```text
Three different Card components
Multiple button implementations
Different section heading styles
Different spacing conventions
```

Do not automatically merge components.

First determine whether the differences are intentional.

---

# 28. UI Hierarchy

For important pages inspect:

```text
Primary action
Secondary action
Supporting information
Navigation
Decorative elements
```

A page should have a clear visual hierarchy.

---

# 29. Card Audit

Cards are likely used extensively across AquaMind.

Check:

- Click target
- Hover state
- Keyboard state
- Image ratio
- Text truncation
- Metadata hierarchy
- Mobile behavior
- Consistent height where appropriate

Do not force equal heights when it harms content readability.

---

# 30. Button Audit

Every button should have:

```text
Default
Hover
Active
Focus
Disabled
Loading
```

where relevant.

Primary actions should be visually distinct.

---

# 31. Link Audit

Distinguish clearly between:

```text
Navigation link
Contextual content link
CTA
External link
```

Links should not look like plain text when they are important navigation.

---

# 32. Article UX Audit

Inspect:

- Title
- Meta
- Hero image
- Table of contents if present
- Reading width
- Heading hierarchy
- Paragraph spacing
- Images
- Captions
- Related content
- Tools
- Problems
- Entities
- CTA
- End-of-article navigation

The article should support both:

```text
Quick answer
Deep reading
Next resource
```

---

# 33. Database / Entity UX Audit

Inspect:

- Entity title
- Key facts
- Images
- Parameters
- Compatibility
- Difficulty
- Related articles
- Related problems
- Related tools

Avoid overwhelming users with database fields above the useful information.

---

# 34. Tool UX Audit

Inspect:

- Input clarity
- Units
- Defaults
- Validation
- Result hierarchy
- Error messages
- Reset
- Copy/share where useful
- Explanation
- Related resources

Tool results should not be visually buried.

---

# 35. Problem UX Audit

Use WEB-06 requirements.

Inspect:

```text
Symptoms
Causes
What to Check
What to Do
What Not to Do
Related Tools
Related Articles
Related Entities
```

The user should reach actionable guidance quickly.

---

# 36. Diagnosis UX Audit

Inspect:

- Progress
- Question clarity
- Answer affordances
- Back
- Restart
- Validation
- Result clarity
- No-match state
- Multiple-match state
- Mobile usability
- Reduced motion

Avoid unnecessarily long questionnaires.

---

# 37. Loading States

Every async surface should have an intentional loading state.

Audit:

```text
Page
Search
Tool
Diagnosis
Images
CMS data
```

Avoid:

```text
Blank white space
Layout jumps
Spinner without context
```

Prefer skeletons only where they improve perceived continuity.

---

# 38. Empty States

Audit:

```text
No search results
No related content
No diagnosis match
No data
```

Every meaningful empty state should explain:

```text
What happened
What the user can do next
```

---

# 39. Error States

Audit:

- 404
- 500
- CMS failure
- Image failure
- Tool validation error
- Network failure
- Invalid route

Errors should be recoverable where possible.

---

# 40. Accessibility Audit

Minimum:

```text
Semantic HTML
Heading hierarchy
Landmarks
Keyboard navigation
Focus visibility
Focus order
Form labels
Button names
Link names
Alt text
Color contrast
Reduced motion
Responsive zoom
```

Where possible validate using automated tooling plus manual checks.

---

# 41. Keyboard Navigation

Test:

```text
Tab
Shift+Tab
Enter
Space
Escape
Arrow keys where appropriate
```

No interactive element should become unreachable.

---

# 42. Focus Management

Especially important for:

- Mobile menu
- Dialogs
- Search overlays
- Diagnosis
- Tool validation
- Dynamic result panels

After an interaction, focus should remain logical.

---

# 43. Mobile-First Audit

Test at minimum:

```text
320px
375px
390px
414px
768px
1024px
1280px
1440px
```

Use actual browser testing where possible.

Check:

- Overflow
- Typography
- Cards
- Navigation
- Images
- Tables
- Buttons
- Sticky elements
- Animation
- Touch targets

---

# 44. Mobile Aquarium Context

Remember that many users may use AquaMind:

```text
standing beside the aquarium
one-handed
on a phone
while performing maintenance
```

Therefore:

- Important actions should be easy to tap.
- Measurement values should be readable.
- Tool inputs should be simple.
- Troubleshooting content should be scannable.
- Avoid excessive visual decoration.

---

# 45. Touch Targets

Interactive targets should be comfortably tappable.

Audit:

```text
Buttons
Links
Cards
Menu
Tabs
Form controls
```

Avoid tightly packed controls.

---

# 46. Search UX

If site search exists, audit:

- Search trigger
- Input
- Autocomplete if any
- Result ranking
- Empty state
- Keyboard behavior
- Mobile behavior
- Search analytics
- Loading state

Search is a discovery mechanism, not merely a utility.

---

# 47. Motion Budget

Define a qualitative motion budget.

```text
Critical content
→ minimal/no motion

Primary interaction
→ subtle motion

Brand atmosphere
→ restrained ambient motion

Decorative effects
→ optional and lightweight
```

Do not allow animation to dominate the aquarium content.

---

# 48. Home Animation Recommendation Framework

After audit, classify the Home page:

### A — Strong

Animation already communicates brand and hierarchy.

Action:

```text
Keep
Optimize
Polish
```

### B — Partial

Some useful motion exists but the experience feels static.

Action:

```text
Add targeted micro/section motion
```

### C — Static

No meaningful motion exists.

Action:

```text
Design a lightweight animation layer
```

### D — Over-animated

Motion exists but hurts usability/performance.

Action:

```text
Reduce
Simplify
Remove unnecessary effects
```

Do not decide which case applies until audited.

---

# 49. Recommended Home Motion Direction

If new Home motion is justified, prefer an aquarium-inspired but restrained language.

Possible concepts:

```text
Subtle water-flow movement
Gentle light/shimmer
Slow plant sway
Small fish movement
Soft section reveal
Card hover elevation
```

Do not build a full aquarium simulation for the homepage unless there is a clear product reason.

The Home page is primarily a discovery surface.

---

# 50. SEO Compatibility

Animation must never hide essential content from search engines.

Important content should exist in semantic HTML.

Avoid:

```text
Content only visible after complex JS animation
Canvas-only text
Image-only navigation
```

---

# 51. SEO + Performance Tradeoff

Do not sacrifice:

```text
LCP
INP
CLS
crawlability
accessibility
```

for visual effects.

A beautiful animation that slows the page is not a successful improvement.

---

# 52. Third-Party Script Audit

Inventory:

```text
Analytics
Search
Ads
Social
Embeds
Fonts
Other external scripts
```

For each:

```text
Purpose
Provider
Load timing
Page scope
Performance impact
Privacy impact
Can it be delayed?
```

---

# 53. Future AdSense Readiness

Ads are not the current optimization target.

However architecture should avoid creating future problems.

Reserve conceptual areas for:

```text
Ad slots
```

without adding unnecessary empty containers now.

Future ads must not cause layout shift.

---

# 54. Performance Budget

After source audit, establish realistic budgets.

Suggested initial targets:

```text
LCP: aim for < 2.5s
INP: aim for < 200ms
CLS: aim for < 0.1
```

These are targets, not proof of failure by themselves.

Also monitor:

```text
JS payload
Image payload
Font payload
Third-party payload
```

Use real production measurements where available.

---

# 55. Prioritization Framework

Every issue receives:

```text
Impact
Effort
Risk
Confidence
```

Suggested priority:

```text
P0 — Broken / severe accessibility / severe performance
P1 — High-impact UX / SEO / performance
P2 — Meaningful polish
P3 — Nice-to-have
```

Do not label visual preferences as P0.

---

# 56. UX Issue Format

Every issue should be recorded as:

```text
ID:
Page:
Category:
Evidence:
Current behavior:
Problem:
User impact:
SEO impact:
Performance impact:
Accessibility impact:
Recommendation:
Priority:
Effort:
Risk:
```

---

# 57. Animation Issue Format

```text
ID:
Page:
Animation:
Current implementation:
Trigger:
Technology:
Performance risk:
Accessibility:
UX value:
Recommendation:
Priority:
```

---

# 58. Performance Issue Format

```text
ID:
URL:
Metric:
Current evidence:
Likely cause:
User impact:
Recommendation:
Priority:
Verification method:
```

---

# 59. Implementation Phases

## WEB-08A — Source + Production Audit

Do not change UI yet.

Deliver:

```text
Route inventory
Component inventory
Home structure
Animation inventory
Performance inventory
Responsive inventory
Accessibility inventory
```

---

## WEB-08B — Critical UX Fixes

Fix:

- Broken navigation
- Broken responsive behavior
- Missing focus states
- Severe layout issues
- Broken forms
- Critical readability problems

---

## WEB-08C — Performance Foundation

Address:

- LCP
- CLS
- INP
- Images
- Fonts
- Client bundles
- Third-party scripts
- Rendering strategy

---

## WEB-08D — Design System Consistency

Standardize only confirmed duplicated patterns.

---

## WEB-08E — Home Motion

Only after performance foundation.

Possible order:

```text
Micro interactions
↓
Section entrance
↓
Hero enhancement
↓
Optional ambient aquarium motion
```

Each step requires measurement.

---

## WEB-08F — Page-Type UX Polish

Optimize:

```text
Article
Entity
Tool
Problem
Diagnosis
Learning Path
```

based on actual audit findings.

---

## WEB-08G — Accessibility

Run:

```text
Automated audit
+
Manual keyboard test
+
Responsive test
+
Reduced-motion test
```

---

## WEB-08H — Final QA

Test:

```text
Production build
Desktop
Mobile
Slow network
Reduced motion
Keyboard
Error states
Empty states
404
Analytics
SEO metadata
Core Web Vitals
```

---

# 60. Do Not Over-Engineer

WEB-08 must not become a reason to rebuild the entire website.

Rules:

```text
Keep working architecture
Fix evidence-backed problems
Reuse components
Avoid unnecessary dependencies
Avoid large animation frameworks unless justified
Avoid redesigning pages that already work
```

---

# 61. Definition of Done

```text
[ ] Current source audited
[ ] Production behavior audited
[ ] All public routes inventoried
[ ] Home exact structure documented
[ ] Home animation status verified
[ ] Global UI audited
[ ] Responsive behavior audited
[ ] Accessibility baseline audited
[ ] Images audited
[ ] Fonts audited
[ ] JS/client bundle audited
[ ] Third-party scripts audited
[ ] Rendering strategy audited
[ ] Loading states audited
[ ] Error states audited
[ ] Empty states audited
[ ] Core Web Vitals measured or measurement method established
[ ] UX issues prioritized
[ ] Animation issues prioritized
[ ] Performance issues prioritized
[ ] Critical fixes implemented
[ ] Performance improvements implemented
[ ] Animation improvements implemented only where justified
[ ] Reduced-motion support verified
[ ] Mobile QA passed
[ ] Desktop QA passed
[ ] Production smoke test passed
[ ] Build passes
[ ] Tests pass
[ ] CURRENT_STATE updated
```

---

# 62. Strategic Outcome

After WEB-08:

```text
             AQUAMIND EXPERIENCE
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
      UX        PERFORMANCE     ACCESSIBILITY
       │             │             │
       └─────────────┼─────────────┘
                     ↓
                  TRUST
                     ↓
               ENGAGEMENT
                     ↓
             INTERNAL DISCOVERY
                     ↓
                ORGANIC GROWTH
```

The goal is not:

> “Make AquaMind more animated.”

The goal is:

> **Make AquaMind feel premium, useful, fast and alive — while keeping the content easy to discover, read and use.**

---

# 63. Relationship to Other AquaMind Chats

## 🗂️ Quản lý chủ đề

Owns:

- Search Console topic discovery
- SERP research
- Content gap
- Final Content Priority
- Master Traffic Roadmap
- Publishing priorities

WEB-08 can provide evidence such as:

```text
High-traffic page with poor engagement
```

but does not decide what article should be written next.

## ✍️ Viết Content

Owns:

- Article production
- `AquaMind_CONTENT_PRODUCTION_WORKFLOW.md`
- Research
- Final article copy

WEB-08 may identify UX problems in article presentation, but does not rewrite article content as part of this phase.

## 🌐 Xây dựng website

Owns:

- UI/UX
- Animation
- Performance
- Accessibility
- Responsive behavior
- Navigation
- Design system
- Technical SEO presentation
- Tool UX
- Problem UX
- Entity UX
- Analytics implementation
- Monetization readiness

---

# 64. Immediate OpenCode Instruction

The first OpenCode task must be an audit, not an implementation.

Use this sequence:

```text
1. Read project documentation.
2. Inspect current source tree.
3. Inspect package.json and dependencies.
4. Inspect routing.
5. Inspect Home.
6. Inspect global layout/header/footer.
7. Inspect design-system components.
8. Inspect Article/Entity/Tool/Problem/Diagnosis pages.
9. Inspect animation implementation.
10. Inspect image/font strategy.
11. Inspect Client vs Server Components.
12. Inspect analytics and third-party scripts.
13. Run production build.
14. Run available tests/lint/type checks.
15. Inspect generated build information.
16. Run production browser checks if available.
17. Measure representative pages.
18. Produce evidence-based audit.
19. Prioritize issues.
20. Only then propose implementation phases.
```

OpenCode must not modify production behavior during the initial audit unless a command inherently generates temporary build artifacts.

---

# 65. Required Final Audit Summary

At the end of the audit, OpenCode must provide a compact executive summary:

```text
AQUAMIND WEB-08 AUDIT

Overall UX:
Overall Performance:
Overall Accessibility:
Overall Animation:
Overall Mobile:
Overall Desktop:

Home:
- Current animation:
- Main UX issue:
- Main performance issue:

Top P0:
1.
2.

Top P1:
1.
2.
3.

Quick Wins:
1.
2.
3.

Major Improvements:
1.
2.
3.

Animation Recommendation:
KEEP / POLISH / ADD / REDUCE

Performance Recommendation:
...

Next Implementation Phase:
...
```

The summary must be based on verified findings from the actual AquaMind source and production site.
