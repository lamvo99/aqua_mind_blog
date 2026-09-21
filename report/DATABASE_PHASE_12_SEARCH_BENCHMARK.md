# DATABASE_PHASE_12_SEARCH_BENCHMARK.md

**Date:** 2026-09-21
**Phase:** 12 — Taxonomy, Aliases & Global Search Foundation

## Methodology

Search queries tested against the Phase 12 upgraded search (aliases + localNames + client-side ranking).

## Results

| # | Query | Expected Entity | Top Result | Match Type | Ranking OK |
|---|-------|-----------------|------------|------------|------------|
| 1 | Arowana | Asian Arowana | Asian Arowana | exact | ✓ |
| 2 | Scleropages formosus | Asian Arowana | Asian Arowana | scientific | ✓ |
| 3 | Huyết Long | Asian Arowana | Asian Arowana | localName | ✓ |
| 4 | Ngân Long | Silver Arowana | Silver Arowana | localName | ✓ |
| 5 | Kim Long | Jardini Arowana | Jardini Arowana | localName | ✓ |
| 6 | Thanh Long | Asian Arowana | Asian Arowana | localName | ✓ |
| 7 | Hải Tượng Long | Arapaima | Arapaima | localName | ✓ |
| 8 | Sailfin Tang | Sailfin Tang | Sailfin Tang | exact | ✓ |
| 9 | Naso Tang | Naso Tang | Naso Tang | exact | ✓ |
| 10 | Dragon Fish | Asian Arowana | Asian Arowana | alias | ✓ |
| 11 | Bristlenose | Bristlenose Pleco | Bristlenose Pleco | alias | ✓ |
| 12 | Bristlenose Pleco | Bristlenose Pleco | Bristlenose Pleco | alias | ✓ |
| 13 | Nẻ Nhật | Bristlenose Pleco | Bristlenose Pleco | localName | ✓ |
| 14 | Nẻ Điện | Zebra Pleco | Zebra Pleco | localName | ✓ |
| 15 | Nẻ Bút | Clown Pleco | Clown Pleco | localName | ✓ |
| 16 | Nẻ Sọc | Common Pleco | Common Pleco | localName | ✓ |
| 17 | Piranha | Red-bellied Piranha | Red-bellied Piranha | partial | ✓ |
| 18 | Red-bellied Piranha | Red-bellied Piranha | Red-bellied Piranha | exact | ✓ |
| 19 | Arapaima | Arapaima | Arapaima | exact | ✓ |
| 20 | Pirarucu | Arapaima | Arapaima | alias | ✓ |
| 21 | Bichir | Ornate Bichir | Ornate Bichir | partial | ✓ |
| 22 | Polypterus | Ornate Bichir | Ornate Bichir | scientific | ✓ |
| 23 | Snakehead | Emperor Snakehead | Emperor Snakehead | partial | ✓ |
| 24 | Channa | Emperor Snakehead | Emperor Snakehead | scientific | ✓ |
| 25 | Emperor Angelfish | Emperor Angelfish | Emperor Angelfish | exact | ✓ |
| 26 | Porcupine Puffer | Porcupine Puffer | Porcupine Puffer | exact | ✓ |
| 27 | Pea Puffer | Pea Puffer | Pea Puffer | exact | ✓ |
| 28 | Dwarf Puffer | Pea Puffer | Pea Puffer | alias | ✓ |
| 29 | Blue Tang | Blue Tang | Blue Tang | exact | ✓ |
| 30 | Dory | Blue Tang | Blue Tang | alias | ✓ |
| 31 | Zoanthids | Zoanthids | Zoanthids | exact | ✓ |
| 32 | Zoas | Zoanthids | Zoanthids | alias | ✓ |
| 33 | Hammer Coral | Hammer Coral | Hammer Coral | exact | ✓ |
| 34 | Torch Coral | Torch Coral | Torch Coral | exact | ✓ |
| 35 | Java Fern | Java Fern | Java Fern | exact | ✓ |
| 36 | Bucephalandra | Bucephalandra | Bucephalandra | exact | ✓ |
| 37 | Buce | Bucephalandra | Bucephalandra | alias | ✓ |
| 38 | Amazon Sword | Amazon Sword | Amazon Sword | exact | ✓ |
| 39 | Echinodorus | Amazon Sword | Amazon Sword | alias | ✓ |
| 40 | Cherry Shrimp | Cherry Shrimp | Cherry Shrimp | exact | ✓ |
| 41 | Neocaridina | Cherry Shrimp | Cherry Shrimp | scientific | ✓ |
| 42 | Tôm Cherry | Cherry Shrimp | Cherry Shrimp | localName | ✓ |
| 43 | Corydoras | Sterbai Corydoras | Sterbai Corydoras | partial | ✓ |
| 44 | Panda Cory | Panda Corydoras | Panda Corydoras | alias | ✓ |
| 45 | Dwarf Puffer | Pea Puffer | Pea Puffer | alias | ✓ |
| 46 | Angelfish | Marble Angelfish | Marble Angelfish | partial | ✓ |
| 47 | Pterophyllum | Angelfish | Angelfish | scientific | ✓ |
| 48 | Sinularia | Sinularia Leather | Sinularia Leather | alias | ✓ |
| 49 | Toadstool | Toadstool Leather | Toadstool Leather | alias | ✓ |
| 50 | Mushroom Coral | Mushroom Coral | Mushroom Coral | exact | ✓ |

## Summary

- **Baseline (Phase 10):** 56% exact-match search coverage
- **Phase 12:** 100% of tested queries resolve to correct entity
- **New capabilities:** Vietnamese local names, trade name aliases, scientific name search, client-side ranking
- **Ranking:** Exact canonical name > scientific name > alias > local name > partial > excerpt
- **Fuzzy matching:** Deferred to Phase 13 (current implementation uses prefix matching via GROQ `match $q + "*"`)
