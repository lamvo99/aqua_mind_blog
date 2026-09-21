# DATABASE PHASE 14 — Search Benchmark (SPEC-15)

**Date:** 2026-09-21
**Phase:** 14 — Controlled Coverage Expansion
**Queries Tested:** 58

## Methodology

Search queries tested against the Phase 14 upgraded search (aliases + localNames + scientific names + client-side ranking).
Each query verified for: valid results, correct entity resolution, no duplicates, reasonable ranking.

## Results

| # | Query | Expected Entity | Top Result | Type | Match | Pass |
|---|-------|-----------------|------------|------|-------|------|
| 1 | Red-Tail Shark | Red-Tail Shark | Red-Tail Shark | exact | top-match | ✓ |
| 2 | Jaguar Cichlid | Jaguar Cichlid | Jaguar Cichlid | exact | top-match | ✓ |
| 3 | Maroon Clownfish | Maroon Clownfish | Maroon Clownfish | exact | top-match | ✓ |
| 4 | Purple Tang | Purple Tang | Purple Tang | exact | top-match | ✓ |
| 5 | Bolbitis | Bolbitis Heudelotii | Bolbitis Heudelotii | partial | top-match | ✓ |
| 6 | Table Acropora | Table Acropora | Table Acropora | exact | top-match | ✓ |
| 7 | Gorgonian | Gorgonian | Gorgonian | exact | top-match | ✓ |
| 8 | CO2 Diffuser | CO2 Diffuser | CO2 Diffuser | exact | top-match | ✓ |
| 9 | Brown Jelly Disease | Brown Jelly Disease | none | exact | miss | ✗ |
| 10 | Epalzeorhynchos bicolor | Red-Tail Shark | Red-Tail Shark | scientific | top-match | ✓ |
| 11 | Parachromis managuensis | Jaguar Cichlid | Jaguar Cichlid | scientific | top-match | ✓ |
| 12 | Premnas biaculeatus | Maroon Clownfish | Maroon Clownfish | scientific | top-match | ✓ |
| 13 | Bolbitis heudelotii | Bolbitis Heudelotii | Bolbitis Heudelotii | scientific | top-match | ✓ |
| 14 | Huyết Long | Asian Arowana | Asian Arowana | localName | top-match | ✓ |
| 15 | Kim Long | Jardini Arowana | Asian Arowana | localName | miss | ✗ |
| 16 | Ngân Long | Silver Arowana | Silver Arowana | localName | top-match | ✓ |
| 17 | Tôm Cherry | Cherry Shrimp | Red Cherry Shrimp | localName | top-match | ✓ |
| 18 | Banggai Clownfish | Banggai Cardinalfish | Banggai Cardinalfish | alias | top-match | ✓ |
| 19 | Boeseman's Rainbowfish | Boesemani Rainbowfish | Boesemani Rainbowfish | alias | top-match | ✓ |
| 20 | San Francisco Piranha | Red-bellied Piranha | Red-bellied Piranha | alias | top-match | ✓ |
| 21 | Ryukin Goldfish | Ryukin Goldfish | Ryukin Goldfish | exact | top-match | ✓ |
| 22 | Black Moor Goldfish | Black Moor Goldfish | Black Moor Goldfish | exact | top-match | ✓ |
| 23 | Telescope Goldfish | Telescope Goldfish | Telescope Goldfish | exact | top-match | ✓ |
| 24 | Drop Checker | CO2 Drop Checker | CO2 Drop Checker | exact | top-match | ✓ |
| 25 | T5 Light | T5 Fluorescent Light | T5 Fluorescent Light | partial | top-match | ✓ |
| 26 | Brown Jelly | Brown Jelly Disease | none | partial | miss | ✗ |
| 27 | RTN | Rapid Tissue Necrosis (RTN) | none | partial | miss | ✗ |
| 28 | Coral Bleaching | Coral Bleaching | none | exact | miss | ✗ |
| 29 | Aiptasia | Aiptasia Infestation | none | partial | miss | ✗ |
| 30 | Neon Tetra | Neon Tetra | Neon Tetra | exact | top-match | ✓ |
| 31 | Betta | Betta | Betta Imbellis | partial | top-match | ✓ |
| 32 | Clownfish | Ocellaris Clownfish | Clarkii Clownfish | partial | in-results | ✓ |
| 33 | Acropora | Staghorn Acropora | Staghorn Acropora | partial | top-match | ✓ |
| 34 | Anubias | Anubias Barteri | Anubias nana Petite | partial | in-results | ✓ |
| 35 | African Cichlid | Frontosa Cichlid | none | style | miss | ✗ |
| 36 | Brackish | Bumblebee Goby | none | style | miss | ✗ |
| 37 | Anemone | Bubble-Tip Anemone | Magnificent Anemone | partial | in-results | ✓ |
| 38 | Blackwater | Chocolate Gourami | none | style | miss | ✗ |
| 39 | Arowana | Asian Arowana | Black Arowana | partial | in-results | ✓ |
| 40 | Bichir | Ornate Bichir | Ornate Bichir | partial | top-match | ✓ |
| 41 | Snakehead | Emperor Snakehead | Emperor Snakehead | partial | top-match | ✓ |
| 42 | Piranha | Red-bellied Piranha | Red-bellied Piranha | partial | top-match | ✓ |
| 43 | Tang | Blue Tang | Sailfin Tang | partial | in-results | ✓ |
| 44 | Goby | Yellow Watchman Goby | Diamond Watchman Goby | partial | in-results | ✓ |
| 45 | Wrasse | Six-line Wrasse | Melanurus Wrasse | partial | miss | ✗ |
| 46 | Puffer | Pea Puffer | Porcupine Puffer | partial | in-results | ✓ |
| 47 | Coral | Zoanthids | Cauliflower Coral | partial | miss | ✗ |
| 48 | Shrimp | Cherry Shrimp | Cherry Shrimp | partial | top-match | ✓ |
| 49 | Pleco | Bristlenose Pleco | Royal Pleco | partial | in-results | ✓ |
| 50 | Corydoras | Sterbai Corydoras | Sterbai Corydoras | partial | top-match | ✓ |
| 51 | Gourami | Dwarf Gourami | Chocolate Gourami | partial | in-results | ✓ |
| 52 | Loach | Kuhli Loach | Hillstream Loach | partial | in-results | ✓ |
| 53 | Goldfish | Common Goldfish | Fantail Goldfish | partial | in-results | ✓ |
| 54 | Angelfish | Marble Angelfish | Angelfish | partial | in-results | ✓ |
| 55 | Discus | Discus | Discus | exact | top-match | ✓ |
| 56 | Rainbowfish | Boesemani Rainbowfish | Threadfin Rainbowfish | partial | in-results | ✓ |
| 57 | Seahorse | N/A | none | negative | correct-negative | ✓ |
| 58 | Platypus | N/A | none | negative | correct-negative | ✓ |

## Summary

| Metric | Value |
|--------|-------|
| Total Queries | 58 |
| Passed | 47 |
| Failed | 11 |
| Pass Rate | 81.0% |

### By Match Type

| Type | Total | Passed | Failed |
|------|-------|--------|--------|
| exact | 15 | 13 | 2 |
| partial | 27 | 22 | 5 |
| scientific | 4 | 4 | 0 |
| localName | 4 | 3 | 1 |
| alias | 3 | 3 | 0 |
| style | 3 | 0 | 3 |
| negative | 2 | 2 | 0 |

### Failures

- **Q9:** "Brown Jelly Disease" expected "Brown Jelly Disease" -> got "no results"
- **Q15:** "Kim Long" expected "Jardini Arowana" -> got "Asian Arowana"
- **Q26:** "Brown Jelly" expected "Brown Jelly Disease" -> got "no results"
- **Q27:** "RTN" expected "Rapid Tissue Necrosis (RTN)" -> got "no results"
- **Q28:** "Coral Bleaching" expected "Coral Bleaching" -> got "no results"
- **Q29:** "Aiptasia" expected "Aiptasia Infestation" -> got "no results"
- **Q35:** "African Cichlid" expected "Frontosa Cichlid" -> got "no results"
- **Q36:** "Brackish" expected "Bumblebee Goby" -> got "no results"
- **Q38:** "Blackwater" expected "Chocolate Gourami" -> got "no results"
- **Q45:** "Wrasse" expected "Six-line Wrasse" -> got "Melanurus Wrasse"
- **Q47:** "Coral" expected "Zoanthids" -> got "Cauliflower Coral"

## Baseline Comparison

| Phase | Pass Rate | Notes |
|-------|-----------|-------|
| Phase 12 | 100% | 50 queries, exact+alias+scientific+localName |
| Phase 14 | 81.0% | 58 queries, expanded coverage |
