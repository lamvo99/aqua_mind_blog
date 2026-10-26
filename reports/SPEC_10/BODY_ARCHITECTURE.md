# SPEC 10 — Body Architecture (Layer F)

Long-form knowledge that cannot be safely reduced to a single field (SPEC 10 §17–§18).
Sections are architecture templates, not mandatory prose for every record.

## Decision rule recap (§18)

| Representation | Use when | SPEC 10 example |
|---|---|---|
| Structured field | searchable/filterable/numeric/controlled vocab | `minTankFootprint {lengthCm,widthCm}`, `khMin/khMax`, `jumpRisk` |
| Reference / relationship | another Wiki record is the subject | `compatibleSpecies`, `incompatibleSpecies`, `predatorPrey`, `coralNeighbors` |
| Body section | explanation, nuance, exceptions, interacting factors | "why footprint matters", "how to acclimate coral light", "judge practical filter capacity" |

Worked examples: butterflyfish reef risk = `reefInteraction` enum (field) + monitoring narrative (body), NOT a bare boolean;
heater safety = `ratedCapacity` (field, manufacturer claim) + `body:safety` (practical limitation) — two sources with distinct semantics, not duplicates.

## Species / Fish (12 sections)

```
Overview
Adult Size & Growth
Behavior
Tank Requirements
Swimming Space & Footprint
Water Parameters
Feeding
Compatibility
Special Requirements
Common Problems
Breeding (where applicable)
Practical Verdict
```

Structured backing: sizeCm, tankSizeMinL, minTankLengthCm + minTankWidthCm (the footprint), swimmingSpace, jumpRisk, lidRequired, temp/ph/gh (+ proposed kh/salinity), maturityRequirement, bioload, behaviorFlags, compatibleSpecies/incompatibleSpecies.

## Coral (12 sections)

```
Overview
Placement
Lighting & PAR
Flow
Water Chemistry
Nutrition
Growth
Aggression & Spacing
Compatibility
Common Problems
Acclimation
Practical Verdict
```

Structured backing: light (+ proposed par), flow (+ proposed flowPattern), temp (+ proposed salinity/ph/dkh/ca/mg/no3/po4), photosynthetic/feedingType, aggression/aggressionTraits, spacing, reefCompatibility, relatedProblems.

## Plant (11 sections)

```
Overview
Light
CO2
Nutrients
Substrate
Placement
Growth & Trimming
Water Parameters
Common Deficiencies
Algae Sensitivity
Practical Verdict
```

Structured backing: light, co2, fertilizationPlan, substrateType, feedingMode, placement, growth, propagation, heightCm/spreadCm, temp/ph (+ optional gh/kh).

## Invertebrate (11 sections)

```
Overview
Tank Requirements
Water Parameters
Diet & Feeding
Molting / Growth
Compatibility
Predators
Maturity / Biofilm
Breeding
Common Problems
Practical Verdict
```

Structured backing: minTankVolumeL, temp/ph (+ salinity when marine), diet, moltingType, calciumRequirement, maturityRequirement, biofilmRequirement, riskFlags, temperament, reefCompatibility.

## Equipment (10 sections)

```
What It Does
Specifications
Real-World Capacity
Best Use
Limitations
Compatibility
Maintenance
Failure Modes
Safety
Practical Verdict
```

Structured backing: category, waterType, tankSizeMinL/MaxL, flowRateLh, powerW, ratedCapacity (proposed), pros/cons, compatibleEquipment (proposed), relatedProblems (proposed).

## Problem (8 sections)

```
What It Looks Like
Likely Causes
What to Check First
Immediate Action
Treatment / Correction
What Not to Do
Prevention
Escalation
```

Structured backing: symptoms, causes, whatToCheck, whatNotToDo (existing blocks) + proposed blocks: howToDistinguish, immediateAction, treatment, recovery, prevention, monitoring, escalation.

## Quality rules

- Every section template must be fillable without inventing facts (research-gated items flagged in the architecture matrix).
- Never duplicate the same fact across field and body without distinct semantics (§29 contradiction rule).
- "Practical Verdict" is mandatory at Level 2+ (decision-oriented summary, §3).
