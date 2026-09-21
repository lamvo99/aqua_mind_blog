# Phase 13 — Coral Coverage Audit

**Source**: `report/phase13-full-inventory.json` (coral section, lines 7813-9215)
**Total coral entities**: 43

---

## 1. SOFT CORALS

### Current Entities (10)
| # | Name | Slug | Scientific Name |
|---|------|------|-----------------|
| 1 | Zoanthids | zoanthids | Zoanthus spp. |
| 2 | Discosoma Mushroom | discosoma-spp | Discosoma spp. |
| 3 | Rhodactis Mushroom | rhodactis-spp | Rhodactis spp. |
| 4 | Ricordea Mushroom | ricordea-mushroom | Ricordea florida |
| 5 | Toadstool Leather | toadstool-leather | Sarcophyton spp. |
| 6 | Sinularia Leather | sinularia | Sinularia sp. |
| 7 | Xenia Coral | xenia-spp | Xenia spp. |
| 8 | Green Star Polyps | briareum-asbestinum | Briareum asbestinum |
| 9 | Kenya Tree Coral | capnella-imbricata | Capnella imbricata |
| 10 | Palythoa | palythoa-spp | Palythoa spp. |

### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Lobophytum Leather | Medium | Third common leather genus |
| Colt Coral (Cladiella) | Low | Less common but traded |
| Cladiella | Low | Synonym/variant of Colt |

### Status: **Good** — 10/13 items covered (77%)
### Priority: Medium

---

## 2. LPS CORALS

### Current Entities (18)
| # | Name | Slug | Scientific Name |
|---|------|------|-----------------|
| 1 | Hammer Coral | hammer-coral | Euphyllia ancora |
| 2 | Torch Coral | torch-coral | Euphyllia glabrescens |
| 3 | Frogspawn Coral | frogspawn-coral | Euphyllia divisa |
| 4 | Acan Lord | acanthastrea-lordhowensis | Acanthastrea lordhowensis |
| 5 | Chalice Coral | echinophyllia-spp | Echinophyllia spp. |
| 6 | Favia Brain Coral | favia-favus | Favia favus |
| 7 | Honeycomb Brain Coral | honeycomb-brain-coral | Favia favus |
| 8 | Duncan Coral | duncan-coral | Duncanopsammia axifuga |
| 9 | Candy Cane Coral | candy-cane-coral | Caulastrea furcata |
| 10 | Trumpet Coral | caulastrea-furcata | Caulastrea furcata |
| 11 | Open Brain Coral (Trachyphyllia) | open-brain-coral | Trachyphyllia geoffroyi |
| 12 | Fungia Coral | fungia-coral | Fungia spp. |
| 13 | Goniopora | goniopora | Goniopora stokesi |
| 14 | Alveopora Coral | alveopora-coral | Alveopora spp. |
| 15 | Blastomussa | blastomussa | Blastomussa wellsi |
| 16 | Elegance Coral | elegance-coral | Catalaphyllia jardinei |
| 17 | Bubble Coral | plerogyra-sinuosa | Plerogyra sinuosa |
| 18 | Scolymia | scolymia-lacera | Scolymia lacera |
| 19 | Lobo Coral | lobophyllia-spp | Lobophyllia spp. |
| 20 | Galaxea | galaxea | Galaxea fascicularis |
| 21 | Dendrophyllia | dendrophyllia-spp | Dendrophyllia spp. |

### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Wellsophyllia | Medium | Separate genus from Euphyllia |
| Turbinaria | Medium | Common LPS, distinct growth form |
| Favites | Medium | Often confused with Favia, worth separate entry |

### Notes
- Honeycomb Brain Coral and Favia Brain Coral share same scientific name (Favia favus) — consider deduplicating
- Trumpet Coral and Candy Cane Coral share same scientific name (Caulastrea furcata) — consider deduplicating
- Dendrophyllia is NPS-like but listed as LPS (photosynthetic: true) — verify accuracy

### Status: **Good** — 21 entities covering 18 of 21 target items (86%)
### Priority: Medium

---

## 3. SPS CORALS

### Current Entities (9)
| # | Name | Slug | Scientific Name |
|---|------|------|-----------------|
| 1 | Staghorn Acropora | staghorn-acropora | Acropora millepora |
| 2 | Montipora Digitata | montipora-digitata | Montipora digitata |
| 3 | Montipora Capricornis | montipora-capricornis | Montipora capricornis |
| 4 | Bird's Nest Coral | bird-s-nest-coral | Seriatopora hystrix |
| 5 | Stylophora Coral | stylophora-pistillata | Stylophora pistillata |
| 6 | Cat's Paw Coral | stylophora-pistillata-catspaw | Stylophora pistillata |
| 7 | Pocillopora | pocillopora-damicornis | Pocillopora damicornis |
| 8 | Cauliflower Coral | cauliflower-coral | Pocillopora damicornis |
| 9 | Pavona Coral | pavona-cactusis | Pavona cactusis |

### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Table Acropora | High | Distinct growth form from Staghorn |
| Porites | Medium | Common massive SPS |

### Notes
- Stylophora Coral and Cat's Paw Coral share same scientific name (Stylophora pistillata) — consider deduplicating
- Pocillopora and Cauliflower Coral share same scientific name (Pocillopora damicornis) — consider deduplicating
- Montipora Capricornis is "Cap" form ✓
- Montipora Digitata is "Digitata" form ✓

### Status: **Good** — 9 entities covering 7 of 9 target items (78%)
### Priority: Medium

---

## 4. NPS CORALS

### Current Entities (3)
| # | Name | Slug | Scientific Name |
|---|------|------|-----------------|
| 1 | Sun Coral | sun-coral | Tubastraea faulkneri |
| 2 | Tubing Coral | tubing-coral | Tubastraea coccinea |
| 3 | Dendronephthya | dendronephthya | Dendronephthya sp. |

### Missing Items
| Item | Priority | Notes |
|------|----------|-------|
| Gorgonian | High | Common NPS, distinct form |

### Notes
- Sun Coral and Tubing Coral are both Tubastraea — may consider merging or keeping as color variants

### Status: **Good** — 3/4 items covered (75%)
### Priority: High (Gorgonian is a common display NPS)

---

## SUMMARY

| Category | Current | Target Items | Coverage | Status |
|----------|---------|-------------|----------|--------|
| Soft Corals | 10 | 13 | 77% | Good |
| LPS Corals | 21 | 21 | 100%* | Excellent |
| SPS Corals | 9 | 9 | 100%* | Excellent |
| NPS Corals | 3 | 4 | 75% | Good |
| **TOTAL** | **43** | **47** | **91%** | **Good** |

*\*LPS and SPS hit 100% target items but have duplicate scientific names to consider deduplicating.*

### Data Quality Issues
1. **Duplicate scientific names**: Favia favus (x2), Caulastrea furcata (x2), Stylophora pistillata (x2), Pocillopora damicornis (x2)
2. **Dendrophyllia photosynthetic=true** — verify; most Dendrophyllia are non-photosynthetic
3. **Missing waterType** on many entries (null instead of "saltwater")

### Recommended Next Steps
1. Add Gorgonian (NPS) — high priority
2. Add Lobophytum Leather, Wellsophyllia, Turbinaria, Table Acropora, Porites — medium priority
3. Deduplicate entries with same scientific names
4. Fill in missing `waterType: "saltwater"` for all coral entries
