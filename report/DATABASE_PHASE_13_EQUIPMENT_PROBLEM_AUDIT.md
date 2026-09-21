# Phase 13 — Equipment & Problem Coverage Audit

**Source**: `report/phase13-full-inventory.json`
**Equipment entities**: 47 (lines 10785-12133)
**Problem entities**: 33 (lines 12134-12995)

---

## EQUIPMENT AUDIT

### 1. Filtration

#### Current Entities (7)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Hang-On-Back Filter | Filter | hang-on-back-filter |
| 2 | Canister Filter | Filter | canister-filter |
| 3 | Sponge Filter | Filter | sponge-filter |
| 4 | Internal Filter | Filter | internal-filter |
| 5 | Filter Floss | Other | filter-floss |
| 6 | Media Reactor | Other | media-reactor |
| 7 | Return Pump | Pump | return-pump |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Undergravel Filter | Low | Legacy, rarely used now |
| Wet/Dry Filter | Medium | Common in larger marine setups |
| Fluidized Bed Filter | Low | Niche product |

#### Status: **Good** — 7/10 items covered
### Priority: Medium

---

### 2. Lighting

#### Current Entities (4)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Planted LED Light | Light | planted-led-light |
| 2 | Reef LED Light | Light | reef-led-light |
| 3 | LED Aquarium Light | Light | led-aquarium-light |
| 4 | PAR Meter | Test Kit | par-meter |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| T5 Fluorescent | Medium | Still widely used for reef |
| T8 Fluorescent | Low | Budget option, declining |
| Halide / Metal Halide | Low | Legacy high-intensity |
| Full Spectrum Bulb | Low | Generic term, covered by LED variants |

#### Status: **Fair** — 4/8 items covered (50%)
### Priority: Medium (T5 especially for reef keepers)

---

### 3. Heating

#### Current Entities (3)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Digital Heater | Heater | digital-heater |
| 2 | Submersible Heater | Heater | submersible-heater |
| 3 | Aquarium Thermometer | Test Kit | aquarium-thermometer |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| — | — | Coverage complete for basic needs |

#### Status: **Complete**
### Priority: Low

---

### 4. Circulation

#### Current Entities (3)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Wave Maker | Pump | wave-maker |
| 2 | Circulation Pump (Powerhead) | Pump | circulation-pump-powerhead |
| 3 | Air Pump | Pump | air-pump |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Closed Loop System | Low | Niche marine setup |

#### Status: **Good** — 3/4 items covered
### Priority: Low

---

### 5. CO2

#### Current Entities (3)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | CO₂ Regulator Kit | CO₂ System | co-regulator-kit |
| 2 | CO₂ Cylinder | CO₂ System | co-cylinder |
| 3 | Dechlorinator | Other | dechlorinator |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| CO₂ Diffuser | High | Essential component for planted tanks |
| CO₂ Drop Checker | High | Common monitoring tool |
| CO₂ Calculator / Bubble Counter | Medium | Useful accessory |

#### Status: **Fair** — 3/6 items covered (50%)
### Priority: High (diffuser and drop checker are essential for planted)

---

### 6. ATO (Auto Top-Off)

#### Current Entities (1)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Auto Top-Off System | ATO | auto-top-off-system |

#### Missing Items: None

#### Status: **Complete**
### Priority: Low

---

### 7. Dosing

#### Current Entities (1)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Dosing Pump | Dosing | dosing-pump |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Kalk Reactor | Medium | Advanced reef calcification |

#### Status: **Good** — 1/2 items covered
### Priority: Medium

---

### 8. Skimming

#### Current Entities (1)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Protein Skimmer | Skimmer | protein-skimmer |

#### Missing Items: None

#### Status: **Complete**
### Priority: Low

---

### 9. Reactors

#### Current Entities (2)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Media Reactor | Other | media-reactor |
| 2 | Calcium Reactor | Other | calcium-reactor |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Carbon Reactor | Low | Covered by Media Reactor umbrella |
| GFO Reactor | Low | Covered by Media Reactor umbrella |
| Biopellet Reactor | Low | Covered by Media Reactor umbrella |

#### Status: **Complete** (generic media reactor covers sub-types)
### Priority: Low

---

### 10. Testing

#### Current Entities (7)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Master Test Kit | Test Kit | master-test-kit |
| 2 | Water Test Strips | Test Kit | water-test-strips |
| 3 | Digital pH Meter | Test Kit | digital-ph-meter |
| 4 | TDS Meter | Test Kit | tds-meter |
| 5 | Refractometer | Test Kit | refractometer |
| 6 | Aquarium Thermometer | Test Kit | aquarium-thermometer |
| 7 | PAR Meter | Test Kit | par-meter |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Drop Checker | High | CO2 monitoring for planted tanks |

#### Status: **Good** — 7/8 items covered
### Priority: High (drop checker is essential for CO2 tanks)

---

### 11. Substrate

#### Current Entities (4)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Aquarium Soil Substrate | Substrate | aquarium-soil-substrate |
| 2 | Aquasoil Substrate | Substrate | aquasoil-substrate |
| 3 | Aquarium Gravel | Substrate | aquarium-gravel |
| 4 | RO/DI Water Filter | Other | ro-di-water-filter |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Sand (Pool/Fine) | Medium | Common for cichlid/reef tanks |
| Coral Sand / Aragonite | Medium | Marine/reef substrate |

#### Status: **Good** — 4/6 items covered
### Priority: Medium

---

### 12. Maintenance

#### Current Entities (2)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Gravel Vacuum | Maintenance | gravel-vacuum |
| 2 | Algae Scraper | Maintenance | algae-scraper |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Pruning Scissors / Aquascaping Scissors | Medium | Essential for planted tanks |

#### Status: **Good** — 2/3 items covered
### Priority: Medium

---

## PROBLEM AUDIT

### 1. Fish Disease

#### Current Entities (12)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Ich (White Spot Disease) | — | ich-white-spot-disease |
| 2 | Velvet Disease (Oodinium) | — | velvet-disease-oodinium |
| 3 | Columnaris (Cotton Mouth) | — | columnaris-cotton-mouth |
| 4 | Dropsy | fish | dropsy |
| 5 | Fin Rot | fish | fin-rot |
| 6 | Pop Eye (Exophthalmia) | — | pop-eye-exophthalmia |
| 7 | Swim Bladder Disease | — | swim-bladder-disease |
| 8 | Hole in the Head Disease | — | hole-in-the-head-disease |
| 9 | Saprolegnia (Water Mold) | — | saprolegnia-water-mold |
| 10 | Flukes (Gill and Skin Parasites) | — | flukes-gill-skin-parasites |
| 11 | Anchor Worm (Lernaea) | — | anchor-worm-lernaea |
| 12 | Fish Lice (Argulus) | — | fish-lice-argulus |
| 13 | White Spot Disease | fish | white-spot-disease |
| 14 | Fish Gasping at Surface | fish | fish-gasping-surface |
| 15 | Fish Hiding | fish | fish-hiding |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Fish Fungus | Medium | Common, covered partially by Saprolegnia |

#### Notes
- **Ich (White Spot Disease)** and **White Spot Disease** appear to be duplicates — consider merging
- Several entities have `name: null` — names need to be populated
- Several entities have `category: null` — should be "fish"

#### Status: **Excellent** — 15 entities covering 9/9 target categories
### Priority: Low

---

### 2. Algae

#### Current Entities (6)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Hair Algae | algae | hair-algae |
| 2 | Black Beard Algae (BBA) | algae | black-beard-algae |
| 3 | Staghorn Algae | algae | staghorn-algae |
| 4 | Brown Diatom Algae | algae | brown-diatom-algae |
| 5 | Green Water | algae | green-water |
| 6 | Dinoflagellates | — | dinoflagellates |
| 7 | Cyanobacteria | water | cyanobacteria |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Green Spot Algae (GSA) | Medium | Common in low-phosphate tanks |
| Blue-Green Algae (BGA) | Medium | Same as Cyanobacteria — verify coverage |

#### Notes
- Cyanobacteria is categorized as "water" — should be "algae" or "blue-green algae"
- Dinoflagellates has `category: null` — should be "algae"

#### Status: **Good** — 7 entities covering 6/8 target items
### Priority: Medium

---

### 3. Plant Problems

#### Current Entities (2)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Plant Nutrient Deficiency | plants | plant-nutrient-deficiency |
| 2 | Plant Leaves Melting | plants | plant-leaves-melting |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Algae on Plant Leaves | Low | Subset of algae problems |

#### Status: **Good** — 2/3 items covered
### Priority: Low

---

### 4. Water Quality

#### Current Entities (6)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | High Ammonia | water | high-ammonia |
| 2 | Old Tank Syndrome | water | old-tank-syndrome |
| 3 | Cloudy Water | water | cloudy-water |
| 4 | Temperature Shock | fish | temperature-shock |
| 5 | Planaria Infestation | — | planaria-infestation |
| 6 | Hydra Infestation | — | hydra-infestation |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| High Nitrite | High | Part of nitrogen cycle issues |
| High Nitrate | High | Common algae driver |
| pH Crash | High | Common fish killer |
| Ozone (excess) | Low | Niche marine issue |

#### Notes
- Temperature Shock is categorized as "fish" — should be "water"
- Planaria Infestation has `category: null` — should be "pests" or "invertebrate"
- Hydra Infestation has `category: null` — should be "pests" or "invertebrate"

#### Status: **Fair** — 6 entities covering 4/8 target items
### Priority: **High** — Nitrite, Nitrate, and pH Crash are critical gaps

---

### 5. Coral Problems

#### Current Entities (0)
No coral-specific problem entities exist in the database.

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Brown Jelly Disease | High | Common LPS affliction |
| Rapid Tissue Necrosis (RTN) | High | Lethal SPS disease |
| Slow Tissue Necrosis (STN) | High | Progressive SPS disease |
| Coral Bleaching | High | Temperature/light stress |
| Coral Aiptasia | High | Pest anemone infestation |

#### Status: **Critical Gap** — 0/5 items covered
### Priority: **Critical** — Coral problems are essential for reef content

---

### 6. Equipment Problems

#### Current Entities (2)
| # | Name | Category | Slug |
|---|------|----------|------|
| 1 | Filter Crash | equipment | filter-crash |
| 2 | Low Filter Flow | equipment | low-filter-flow |

#### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| pH Drift | High | Common with inadequate buffering |
| Heater Stuck On | High | Can cook tank |
| Heater Stuck Off | High | Temperature crash |
| Skimmer Overflow | Medium | Common marine issue |

#### Status: **Fair** — 2/6 items covered
### Priority: **High** — Heater and pH problems are critical

---

## SUMMARY

### Equipment Coverage

| Category | Current | Target | Coverage | Status |
|----------|---------|--------|----------|--------|
| Filtration | 7 | 10 | 70% | Good |
| Lighting | 4 | 8 | 50% | Fair |
| Heating | 3 | 3 | 100% | Complete |
| Circulation | 3 | 4 | 75% | Good |
| CO2 | 3 | 6 | 50% | Fair |
| ATO | 1 | 1 | 100% | Complete |
| Dosing | 1 | 2 | 50% | Fair |
| Skimming | 1 | 1 | 100% | Complete |
| Reactors | 2 | 3 | 67% | Good |
| Testing | 7 | 8 | 88% | Good |
| Substrate | 4 | 6 | 67% | Good |
| Maintenance | 2 | 3 | 67% | Good |
| **TOTAL** | **38** | **55** | **69%** | **Fair** |

### Problem Coverage

| Category | Current | Target | Coverage | Status |
|----------|---------|--------|----------|--------|
| Fish Disease | 15 | 9 | 167%* | Excellent |
| Algae | 7 | 8 | 88% | Good |
| Plant Problems | 2 | 3 | 67% | Good |
| Water Quality | 6 | 8 | 75% | Fair |
| Coral Problems | 0 | 5 | 0% | **Critical** |
| Equipment Problems | 2 | 6 | 33% | Fair |
| **TOTAL** | **32** | **39** | **82%** | **Good** |

*\*Fish disease has extra entities beyond target list (parasites, behavioral issues)*

---

## TOP PRIORITY GAPS

### Critical (add immediately)
1. **Coral Problems** — 0 entities: Brown Jelly, RTN, STN, Coral Bleaching, Coral Aiptasia
2. **Water Quality** — Missing: High Nitrite, High Nitrate, pH Crash
3. **Equipment Problems** — Missing: pH Drift, Heater Stuck On/Off

### High Priority
4. **CO2 System** — Missing: CO₂ Diffuser, Drop Checker
5. **Lighting** — Missing: T5 Fluorescent
6. **Substrate** — Missing: Sand, Coral Sand

### Medium Priority
7. **Dosing** — Missing: Kalk Reactor
8. **Maintenance** — Missing: Pruning Scissors
9. **Algae** — Missing: Green Spot Algae, Blue-Green Algae (BGA)

### Data Quality Issues
- **17 entities have `name: null`** — names must be populated from slug
- **8 entities have `category: null`** — categories need assignment
- **Temperature Shock** categorized as "fish" instead of "water"
- **Cyanobacteria** categorized as "water" instead of "algae"
- **Ich** appears twice (ich-white-spot-disease + white-spot-disease) — deduplicate
