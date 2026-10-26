# SPEC 11A - Phase A Reconciliation (read-only)

Generated: 2026-10-18T04:00:35.694Z  |  No production writes in this phase.

## Baseline verification
| check | result | detail |
| --- | --- | --- |
| A-01 one-shot reported 364/364 writes verified + COMPLETE | PASS | written=364 verified=364 verdict=COMPLETE |
| A-02 one-shot identity hash MATCH | PASS | c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda |
| A-03 remainder register = 60 non-applied rows | PASS | register=60 planNonApplied=60 |
| A-04 Wave 1 = 17 species; research register covers Wave 1 only | PASS | wave1=17 researchSlugs=17 |
| A-05 remainder rows are Wave-1 species (60 rows != 60 species) | PASS | distinctSpecies=16 |
| A-06 live double-read deterministic | PASS | mismatchedTypes=0 |
| A-07 live inventory 473 / species 218 | PASS | total=473 {"species":218,"plant":62,"invertebrate":56,"coral":48,"equipment":46,"problem":43} |
| A-08 live identity hash MATCH (canonical method) | PASS | MATCH |
| A-09 drafts = 0 | PASS | drafts=0 |
| A-10 seals unchanged vs one-shot baseline | PASS | rel=true seo=true |

## What the 60-row remainder actually is
The remainder register contains **60 operations across 16 Wave-1 species** (source: `FINAL_OPERATION_PLAN.csv` non-applied rows). It is **not 60 additional species**. The other 201 species of the 218-species inventory were never in the Wave-1 research scope, so **no external evidence exists for them** in the SPEC 09-11 chain `RESEARCH_REGISTER.csv`/`EVIDENCE_MAP.csv` (which cover only the 17 Wave-1 slugs).

## Per-row blocker classification (60 rows)
```
{
  "INSUFFICIENT_EVIDENCE_DERIVED": 18,
  "CONFLICTING_VALUE_SEMANTIC_MAPPING": 9,
  "INSUFFICIENT_EVIDENCE": 21,
  "CONFLICTING_VALUE": 11,
  "ALREADY_CORRECT_NOOP": 1
}
```

| candidateId | species | field | action | blocker |
| --- | --- | --- | --- | --- |
| OP-001 | koi | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-002 | koi | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-006 | koi | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-018 | koi | ghMin | HOLD_EVIDENCE | insufficient evidence |
| OP-019 | koi | ghMax | HOLD_EVIDENCE | insufficient evidence |
| OP-028 | atractosteus-spatula | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-029 | atractosteus-spatula | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-042 | atractosteus-spatula | tankSizeMinL | HOLD_CONFLICT | conflicting value |
| OP-043 | atractosteus-spatula | tempMinC | HOLD_CONFLICT | conflicting value |
| OP-054 | phractocephalus-hemioliopterus | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-055 | phractocephalus-hemioliopterus | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-060 | phractocephalus-hemioliopterus | oxygenSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-069 | phractocephalus-hemioliopterus | tempMinC | HOLD_CONFLICT | conflicting value |
| OP-070 | phractocephalus-hemioliopterus | tempMaxC | HOLD_CONFLICT | conflicting value |
| OP-081 | zebra-moray-eel | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-082 | zebra-moray-eel | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-086 | zebra-moray-eel | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-087 | zebra-moray-eel | oxygenSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-095 | zebra-moray-eel | tempMinC | HOLD_CONFLICT | conflicting value |
| OP-096 | zebra-moray-eel | temperament | REJECT_SEMANTIC_MAPPING | conflicting value / semantic mapping |
| OP-107 | arapaima-gigas | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-108 | arapaima-gigas | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-112 | arapaima-gigas | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-116 | arapaima-gigas | waterChangeSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-123 | arapaima-gigas | tempMaxC | HOLD_CONFLICT | conflicting value |
| OP-124 | arapaima-gigas | ghMin | HOLD_EVIDENCE | insufficient evidence |
| OP-133 | black-arowana | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-134 | black-arowana | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-138 | black-arowana | flowPreference | HOLD_EVIDENCE | insufficient evidence |
| OP-140 | black-arowana | bioload | HOLD_EVIDENCE | insufficient evidence |
| OP-146 | black-arowana | tankSizeMinL | HOLD_CONFLICT | conflicting value |
| OP-155 | clown-knifefish | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-156 | clown-knifefish | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-160 | clown-knifefish | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-166 | clown-knifefish | groupSize | HOLD_EVIDENCE | insufficient evidence |
| OP-198 | iridescent-shark | diet | SKIP_ALREADY_CORRECT | already correct / no-op |
| OP-208 | longnose-gar | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-209 | longnose-gar | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-214 | longnose-gar | oxygenSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-223 | longnose-gar | tankSizeMinL | HOLD_CONFLICT | conflicting value |
| OP-233 | osteoglossum-bicirrhosum | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-234 | osteoglossum-bicirrhosum | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-238 | osteoglossum-bicirrhosum | flowPreference | HOLD_EVIDENCE | insufficient evidence |
| OP-248 | osteoglossum-bicirrhosum | diet | HOLD_CONFLICT | conflicting value |
| OP-257 | scleropages-formosus | minTankLengthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-258 | scleropages-formosus | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-262 | scleropages-formosus | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-264 | scleropages-formosus | bioload | HOLD_EVIDENCE | insufficient evidence |
| OP-271 | scleropages-formosus | temperament | HOLD_CONFLICT | conflicting value |
| OP-311 | spotted-gar | flowPreference | HOLD_EVIDENCE | insufficient evidence |
| OP-339 | three-barred-peacock-bass | predatesInverts | HOLD_EVIDENCE | insufficient evidence |
| OP-342 | three-barred-peacock-bass | phMax | HOLD_CONFLICT | conflicting value |
| OP-354 | tiger-shovelnose-catfish | minTankWidthCm | HOLD_EVIDENCE | insufficient evidence |
| OP-361 | tiger-shovelnose-catfish | waterChangeSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-369 | tiger-shovelnose-catfish | temperament | REJECT_SEMANTIC_MAPPING | conflicting value / semantic mapping |
| OP-386 | walking-catfish | bioload | HOLD_EVIDENCE | insufficient evidence |
| OP-390 | walking-catfish | predatesInverts | HOLD_EVIDENCE | insufficient evidence |
| OP-409 | weeks-bichir | flowPreference | HOLD_EVIDENCE | conflicting value / semantic mapping |
| OP-412 | weeks-bichir | waterChangeSensitivity | HOLD_EVIDENCE | insufficient evidence |
| OP-416 | weeks-bichir | temperament | REJECT_SEMANTIC_MAPPING | conflicting value / semantic mapping |

## 218-species scope
- Wave 1: 17
- Wave 2 candidates (non-Wave-1 with critical/high safety-relevant gaps): 201
- Wave 3 candidates (non-Wave-1, no critical/high gaps): 0
- Species with no actionable gaps (fully covered): 0
- Evidence-ready operations **outside** the already-applied Wave-1 set: **0**
- Blocked operations: 60 (all Wave-1 holds/conflicts/rejects) + 201 species with no evidence collected

## Conclusion of Phase A
No remainder operation satisfies the SPEC 11A write gates (§4): every row is blocked by insufficient/derived evidence, an unresolved semantic mapping, a conflicting value, or is already correct. See `EVIDENCE_OPERATION_PLAN.csv`.
