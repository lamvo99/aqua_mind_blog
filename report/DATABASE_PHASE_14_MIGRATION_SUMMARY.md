# DATABASE PHASE 14 — Migration Summary

**Date:** 2026-09-21
**Phase:** 14 — Controlled Coverage Expansion + Taxonomy Normalization
**Baseline:** 397 entities | **Final:** 483 entities

---

## Migration Action Summary

| Action | Count | Notes |
|--------|------:|-------|
| ADD (new canonical species) | 86 | Species, plants, corals, invertebrates, equipment, problems |
| VARIANT / PARENT | 3 | Ryukin, Black Moor, Telescope Goldfish -> Common Goldfish |
| ALIAS ONLY | 3 | Banggai Clownfish, Boeseman's Rainbowfish, San Francisco Piranha |
| STYLE TAG UPDATE | 10 | African Cichlid (4), Brackish (1), Anemone/Clownfish (3), Blackwater (2) |
| DUPLICATE / MERGE | 0 | No merges needed |
| DEFER | 1 | Stonefish (editorial review) |
| HOLD | 1 | Stonefish (extreme toxicity, hobby content questionable) |

---

## Batch Breakdown

### Batch 1: Normalization (13 operations)

- Alias additions: 3 (Banggai Cardinalfish, Boesemani Rainbowfish, Red-bellied Piranha)
- Style tag updates: 10 entities
  - African Cichlid: Frontosa, Electric Yellow, Zebra Mbuna, Dubois' Tropheus
  - Brackish: Bumblebee Goby
  - Anemone/Clownfish: Ocellaris, Percula, Bubble-Tip Anemone
  - Blackwater: Chocolate Gourami, Cardinal Tetra

### Batch 2: Freshwater (31 created)

- **Community fish:** Red-Tail Shark, Denison Barb, Bala Shark, Black Ghost Knifefish, Tinfoil Barb, Severum, Figure-8 Puffer, Giant Danio, Sailfin Pleco, Halfbeak, Rainbow Shark, Synodontis Catfish, Siamese Algae Eater, Red Garra, Golden Pencilfish
- **Predator/large fish:** Jaguar Cichlid, Wolf Cichlid, Midas Cichlid, Red Devil Cichlid, Tiger Shovelnose Catfish, Pictus Catfish, Clown Knifefish, Iridescent Shark, Red-Bellied Pacu, Spotted Gar, Spotted Snakehead, Black Arowana, Walking Catfish, Weeks Bichir, Longnose Gar, Orinoco Peacock Bass, Three-Barred Peacock Bass, Freshwater Stingray, Pea Puffer, Frontosa Cichlid, Pike Cichlid, Blue Acara, Cockatoo Dwarf Cichlid, Congo Dwarf Cichlid, Scarlet Badis, Golden Wonder Killifish, Paradise Fish, Arapaima, Angelfish, Emerald Betta, Dubois' Tropheus, Siamese Fighting Fish

### Batch 3: Marine (29 created)

- **Clownfish:** Maroon, Tomato, Clarkii (3)
- **Tangs:** Purple, Powder Blue (2)
- **Angelfish:** Queen (1)
- **Wrasses:** Cleaner, Melanurus, Flasher (3)
- **Butterflyfish:** Raccoon, Longnose (2)
- **Eels:** Snowflake, Zebra Moray (2)
- **Hawkfish:** Longnose, Arc-eye (2)
- **Gobies:** Diamond Watchman (1)
- **Blennies:** Bicolor (1)
- **Triggers:** Queen (1)
- **Puffers:** Stars and Stripes (1)
- **Anthias:** Bartlett's (1)
- **Cardinalfish:** Pajama (1)
- **Basslets:** Black Cap (1)
- **Grammas:** Royal Gramma (1)
- **Other:** Green Chromis, Marine Betta, Dwarf Lionfish, Lyretail Anthias, Six Line Wrasse (5)
- **Invertebrates:** Sebae Anemone, Rock Flower Anemone, Tuxedo Urchin, Pencil Urchin, Sand-Sifting Starfish, Blue Crayfish, Pom-Pom Crab, Thai Micro Crab, Red Claw Crab, Cerith Snail, Zebra Nerite Snail, Tridacna Maxima Clam, Sea Cucumber, Feather Duster Worm, Cleaners Shrimp, Sexy Anemone Shrimp (16)

### Batch 4: Mixed (27 created)

- **Corals (5):** Lobophytum Leather, Turbinaria, Table Acropora, Porites, Gorgonian
- **Plants (8):** Bolbitis Heudelotii, Java Fern Windelov, Java Fern Narrow Leaf, Cryptocoryne Parva, Rotala Wallichii, Pogostemon Helferi, Dwarf Baby Tears (update), Thai Onion Plant
- **Equipment (3):** CO2 Diffuser, CO2 Drop Checker, T5 Fluorescent Light
- **Problems (11):** Brown Jelly Disease, RTN, STN, Coral Bleaching, Aiptasia Infestation, High Nitrite, High Nitrate, pH Crash, Heater Stuck On, Heater Stuck Off, pH Drift

---

## Sanity Mutations Summary

| Operation | Count |
|-----------|------:|
| Documents created | 100 |
| Documents updated | 11 (10 style tags + 1 plant update) |
| Documents deleted | 0 |
| References repointed | 0 |
