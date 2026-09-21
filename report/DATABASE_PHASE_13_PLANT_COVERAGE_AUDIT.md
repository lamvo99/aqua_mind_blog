# Phase 13 — Plant Coverage Audit

**Source:** `report/phase13-full-inventory.json` — `plant` array  
**Total plant entities in database:** 53  
**Entities across the 10 audited groups:** 36  
**Additional plants outside audited groups:** 7 (Myriophyllum, Hornwort, Blyxa japonica, Anacharis, Staurogyne repens, Water Sprite, Peacock Moss, Marimo Moss Ball, Hydrocotyle tripartita, Lilaeopsis, Pygmy Chain Sword, Dwarf Lettuce, Dwarf Baby Tears)

---

## 1. Stem Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 14 |
| **Status** | PARTIAL |
| **Priority** | P1 |

**Represented:**
- Rotala rotundifolia (Red Rotala)
- Rotala indica
- Rotala Macrandra
- Rotala sp. H'Ra
- Ludwigia Red (palustris)
- Ludwigia Super Red
- Ludwigia arcuata
- Ludwigia repens
- Bacopa caroliniana
- Pogostemon stellatus
- Limnophila aromatica (Rice Paddy Herb)
- Hygrophila difformis (Water Wisteria)
- Ambulia (Limnophila sessiliflora)
- Cabomba caroliniana

**Missing Popular Lines:**
- Hygrophila polysperma (Rosanervig / Sunset)
- Limnophila sessiliflora (listed as Ambulia — counted)
- Ammannia gracilis / Ammannia senegalensis
- Pogostemon helferi (Downoi)
- Pogostemon erectus
- Rotala wallichii
- Rotala H'Ra (covered)
- Ludwigia glandulosa
- Ludwigia peruensis
- Didiplis diandra

---

## 2. Rosette Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 6 |
| **Status** | PARTIAL |
| **Priority** | P1 |

**Represented:**
- Amazon Sword (Echinodorus grisebachii)
- Cryptocoryne wendtii
- Cryptocoryne balansae
- Cryptocoryne beckettii
- Vallisneria spiralis
- Sagittaria (platyphylla)

**Missing Popular Lines:**
- Cryptocoryne lucens
- Cryptocoryne parva
- Cryptocoryne undulata
- Echinodorus bleheri (large Amazon Sword variants)
- Echinodorus tenellus (Pygmy Chain Sword — present as separate entity outside group)
- Blyxa japonica (present but not classified as Rosette in DB)

---

## 3. Carpet Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 6 |
| **Status** | PARTIAL |
| **Priority** | P1 |

**Represented:**
- Monte Carlo (Micranthemum tweediei)
- Dwarf Hairgrass (Eleocharis parvula)
- Glossostigma (elatinoides)
- Marsilea hirsuta
- Sagittaria (S. platyphylla / S. subulata)
- Lilaeopsis brasiliensis

**Missing Popular Lines:**
- Cuba (Hemianthus callitrichoides — listed as Dwarf Baby Tears outside group)
- Eleocharis acicularis 'Mini'
- Eleocharis sp. 'Belem'
- Eleocharis vivipara
- Micranthemum umbrosum (Monte Carlo alternative)
- Cryptocoryne parva (foreground)

---

## 4. Moss

| Metric | Value |
|--------|-------|
| **Entities in DB** | 6 |
| **Status** | PARTIAL |
| **Priority** | P2 |

**Represented:**
- Java Moss (Taxiphyllum barbieri)
- Christmas Moss (Vesicularia montagnei)
- Taiwan Moss (Taxiphyllum alternans)
- Weeping Moss (Vesicularia ferriei)
- Flame Moss (Taxiphyllum sp.)
- Peacock Moss (Taxiphyllum sp.)

**Missing Popular Lines:**
- Fissidens fontanus (Phoenix Moss)
- Fissidens sp. 'Griffithii'
- Christmas Moss (Vesicularia montagnei — covered)
- Bolbitis (analog: Mini Bolbitis fern)

---

## 5. Epiphytes

| Metric | Value |
|--------|-------|
| **Entities in DB** | 4 |
| **Status** | PARTIAL |
| **Priority** | P1 |

**Represented:**
- Anubias barteri
- Anubias nana Petite
- Bucephalandra (spp.)
- Java Fern (Microsorum pteropus)

**Missing Popular Lines:**
- Java Fern Windelov
- Java Fern Narrow Leaf
- Java Fern Tricolor
- Anubias barteri var. caladiifolia
- Anubias barteri var. coffeefolia
- Bolbitis heudelotii (African Water Fern)
- Microsorum pteropus 'Windelov' (separate listing)

---

## 6. Floating Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 5 |
| **Status** | COVERED |
| **Priority** | P2 |

**Represented:**
- Frogbit (Limnobium laevigatum)
- Salvinia (cucullata)
- Duckweed (Lemna minor)
- Red Root Floater (Phyllanthus fluitans)
- Dwarf Lettuce / Water Lettuce (Pistia stratiotes)

**Missing Popular Lines:**
- Amazon Frogbit (covered as Frogbit)
- Giant Duckweed (Spirodela polyrhiza)
- European Frogbit (Hydrocharis morsus-ranae)

---

## 7. Red Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 6 |
| **Status** | PARTIAL |
| **Priority** | P1 |

**Represented:**
- Alternanthera Reineckii (full-size)
- Alternanthera Reineckii Mini
- Rotala H'Ra
- Ludwigia Red (palustris)
- Ludwigia Super Red
- Scarlet Temple (A. reineckii Rosanervig)

**Missing Popular Lines:**
- Rotala Macrandra (present but not tagged `redPlant: true`)
- Ludwigia sp. 'Red' (other cultivars)
- Bloodrot / Rotala 'Blood Red'
- Alternanthera reineckii 'Rosanervig' (covered as Scarlet Temple)
- Eusteralis stellata (Pogostemon helferi Red)

---

## 8. Low-Tech Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 6+ |
| **Status** | COVERED |
| **Priority** | P3 |

**Represented:**
- Java Fern (Microsorum pteropus)
- Anubias barteri / nana Petite
- Java Moss (Taxiphyllum barbieri)
- Vallisneria spiralis
- Amazon Sword (Echinodorus grisebachii)
- Cryptocoryne wendtii / balansae / beckettii

**Missing Popular Lines:**
- Valisneria nana ( dwarf variant)
- Anubias barteri var. coffeefolia
- Microsorum pteropus 'Windelov'

---

## 9. Background Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 5+ |
| **Status** | COVERED |
| **Priority** | P2 |

**Represented:**
- Vallisneria spiralis
- Ambulia (Limnophila sessiliflora)
- Water Wisteria (Hygrophila difformis)
- Cabomba caroliniana
- Bacopa caroliniana

**Missing Popular Lines:**
- Hygrophila polysperma
- Rotala rotundifolia (background use, covered)
- Ludwigia repens (background use, covered)

---

## 10. Specialty Plants

| Metric | Value |
|--------|-------|
| **Entities in DB** | 0 |
| **Status** | MISSING |
| **Priority** | P3 |

**Represented:** None

**Missing Popular Lines:**
- Mangrove (Rhizophora mangle)
- Air Plants / Tillandsia (Tillandsia spp.)
- Bog plants (Sarracenia, Drosera, etc.)
- Littorella uniflora
- Crinum thaianum (Thai Onion Plant)

---

## Summary Table

| # | Group | Entities | Status | Priority | Gap |
|---|-------|----------|--------|----------|-----|
| 1 | Stem Plants | 14 | PARTIAL | P1 | Missing Ammannia, Pogostemon helferi, Rotala wallichii |
| 2 | Rosette Plants | 6 | PARTIAL | P1 | Missing Cryptocoryne lucens, parva, undulata |
| 3 | Carpet Plants | 6 | PARTIAL | P1 | Missing Cuba (HC), Eleocharis acicularis Mini |
| 4 | Moss | 6 | PARTIAL | P2 | Missing Fissidens fontanus |
| 5 | Epiphytes | 4 | PARTIAL | P1 | Missing Java Fern varieties, Bolbitis |
| 6 | Floating Plants | 5 | COVERED | P2 | Minor: Giant Duckweed |
| 7 | Red Plants | 6 | PARTIAL | P1 | Missing Bloodrot, Rotala Macrandra red tag |
| 8 | Low-Tech Plants | 6+ | COVERED | P3 | Minor gaps |
| 9 | Background Plants | 5+ | COVERED | P2 | Minor gaps |
| 10 | Specialty Plants | 0 | MISSING | P3 | No Mangrove, Air Plants, Bog Plants |

**Overall Plant Coverage Score:** 36 / 53 entities fall within the 10 audited groups (68%)  
**Groups fully covered:** 3 of 10 (Floating, Low-Tech, Background)  
**Groups partially covered:** 6 of 10  
**Groups missing:** 1 of 10 (Specialty)
