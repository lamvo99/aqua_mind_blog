# AquaMind — Phase 1
# WEB-01 Technical SEO & Indexation Audit + Implementation

## Mission

Implement **Phase 1 only**.

The detailed requirements are stored in the project's documentation folder:

```text
/docs/
```

The relevant specification is:

```text
AQUAMIND_WEB_01_TECHNICAL_SEO_INDEXATION.md
```

Do not use this phase as permission to implement WEB-02 through WEB-08.

---

## 1. Read First

Read:

1. `docs/AQUAMIND_WEB_01_TECHNICAL_SEO_INDEXATION.md`
2. The existing project `CURRENT_STATE.md` (or canonical CURRENT_STATE file)
3. Relevant existing project documentation needed to understand routing/build architecture

Do not modify code before understanding the current implementation.

---

## 2. Audit Before Implementation

Audit the current source against WEB-01.

Inspect at minimum:

```text
routing
app structure
metadata
robots
sitemap
canonical generation
URL helpers
redirects
404 handling
structured data
index/noindex rules
query parameters
CMS slug handling
internal URL generation
```

For each requirement determine:

```text
IMPLEMENTED
PARTIAL
MISSING
BROKEN
N/A
UNKNOWN
```

Every conclusion must have evidence:

```text
Requirement
Current state
Source location
Production evidence where applicable
Gap
Impact
```

---

## 3. Create Gap Report

Before making substantial changes, create/update:

```text
WEB-01_GAP_REPORT.md
```

Use the project's existing audit/report convention if one exists.

Prioritize:

```text
P0 — critical SEO/indexation/broken behavior
P1 — high-impact technical SEO
P2 — medium-impact improvement
P3 — polish/backlog
```

---

## 4. Implement WEB-01 Only

Fix the confirmed gaps that belong to WEB-01.

Do not:

- redesign the website
- change CMS
- change framework
- implement WEB-02 IA work
- implement WEB-03 internal-linking architecture
- implement WEB-04 entity expansion
- implement WEB-05 tools architecture
- implement WEB-06 diagnosis architecture
- implement WEB-07 analytics/growth system
- implement WEB-08 animation/performance redesign

A later-spec dependency may only be implemented if it is strictly necessary for WEB-01 to function correctly. Document such dependency explicitly.

---

## 5. Validation

Run the strongest available checks, including as applicable:

```text
lint
TypeScript/type check
tests
production build
```

Verify representative production URLs when possible.

Check for regressions in:

```text
Home
Article
Entity
Tool
Problem
other existing public routes
```

---

## 6. Update Current State

Update the canonical `CURRENT_STATE.md` after implementation.

Record:

```text
Phase: WEB-01
Status
Implemented
Partial
Known issues
Tests
Build
Production verification
Remaining backlog
```

Never claim completion without verification.

---

## 7. Checkpoint

Create/update:

```text
WEB-01_CHECKPOINT.md
```

Final status must be one of:

```text
PASS
PASS WITH BACKLOG
BLOCKED
```

### PASS
All critical requirements are verified.

### PASS WITH BACKLOG
No blocking issue remains; only explicitly documented non-blocking backlog remains.

### BLOCKED
A critical requirement cannot be safely completed or verified.

If BLOCKED, stop.

---

## 8. Stop Rule

**Do not start WEB-02 in this phase.**

Even if WEB-02 requirements are discovered during the audit, record them as future dependencies/backlog and stop after the WEB-01 checkpoint.

The next phase will be authorized separately.

---

## 9. Final Response

At the end, report only the Phase 1 outcome with:

```text
WEB-01 status:
Audit summary:
Implemented:
Remaining:
Tests:
Build:
Production verification:
Checkpoint:
Blocking issues:
Recommended next phase: WEB-02
```
