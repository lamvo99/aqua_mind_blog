# SPEC 10 — Completeness Levels (measurable gates)

Levels are evaluated per record by future enrichment validators. NOT_APPLICABLE requirements (rule false) are excluded from every gate (§19).

## Universal gates

| Level | Gate |
|---|---|
| **L0 — Identification only** | `name` + `scientificName` + `slug` + domain identity key (species: `sizeCm`; problem: `title`+category). Cannot support any husbandry decision. |
| **L1 — Basic usable** | L0 + core care scalars: temperature range, pH range, min tank volume (species/invertebrate/equipment: tank size range), diet, temperament/difficulty. Reader knows *what it is* + *roughly what it needs*. |
| **L2 — Decision ready** | L1 + all REQUIRED-L2 targets present (see matrix `introducedLevel=L2`): species space block (footprint/length/width/swimmingSpace/jumpRisk/lidRequired), maturity/bioload, ≥1 compatible AND ≥1 incompatible relation or explicit negative-knowledge note, body ≥8/12 sections incl. Practical Verdict. Reader can decide *"does it fit my tank?"* |
| **L3 — Advanced husbandry** | L2 + CONDITIONAL-applicable behavior flags resolved, water-change/bioload sensitivity, full body template (≥10/12 species; domain equivalents), troubleshooting links ≥3, acclimation/stability sections, breeding sections where applicable, problem: all 8 sections. Context-dependent decisions supported. |
| **L4 — Expert reference** | L3 + research provenance: every research-gated target has source+evidence+confidence+editorDecision; relationship network depth (≥5 verified compatible entries, predator/prey resolved where applicable); PAR/advanced numerics annotated with evidenceClass; edge cases documented. Never false precision (§23). |

## Per-domain L2 gate highlights

| Domain | Mandatory L2 structured targets (REQUIRED + level L2) |
|---|---|
| species | minTankLengthCm, minTankWidthCm (footprint = length x width), swimmingSpace, jumpRisk, lidRequired, flowPreference, oxygenSensitivity, maturityRequirement, waterChangeSensitivity, bioload, communitySuitability, behaviorFlags(territorial,solitary,timid), schooling(groupSize), relations: compatible+incompatible |
| plant | lightIntensity-body section, photoperiod, fertilizationPlan, substrateType/feedingMode (when rule true), heightCm, spreadCm, space body section |
| invertebrate | minTankVolumeL, stabilityRequirement, calciumRequirement (when rule true), moltingType (when rule true), maturityRequirement, biofilmRequirement (when rule true), riskFlags[STARVATION], molting body (when rule true) |
| coral | growthForm, salinity/ph/dkh/ca ranges, stability body, feedingType, spacing, reef-caveats body, acclimation body, bleaching/STN-RTN bodies, aggressionTraits (sweeper) |
| equipment | waterType, real-world-capacity + when-inadequate + failure-modes + cleaning safety bodies, suitable tank size |
| problem | existing 4 blocks + new howToDistinguish, immediateAction, treatment, prevention, escalation blocks |

## Audience coverage (§21)

| Audience | Must answer | Satisfied at |
|---|---|---|
| Beginner | Can I keep it? / how big a tank? / what water? / what does it eat? / is it easy? / what can go wrong? | **L1** (identification+core) + species **L2 space block** (tank-fit safety) |
| Intermediate | Why this setup? / compatibility constraints / behavior→stocking / parameters that matter / equipment / maintenance pattern | **L2** (relations, bioload, maturity, body sections, troubleshooting links) |
| Advanced | Adult growth & long-term planning / advanced chemistry / behavioral ecology / species-specific compatibility / breeding / specialized nutrition / disease nuance / equipment optimization / reef interactions / edge cases | **L3 + L4** (full body, conditional flags, research provenance, relationship depth) |

## Dangerous-gap preservation (§24)

Any record carrying an unresolved P0 item (large-fish dimensions/footprint/swimming, jumping/lid, compatibility, predator/prey, invertebrate predation, molting, mature/biofilm, coral chemistry, problem escalation, heater safety) **cannot pass L2** regardless of other content.
