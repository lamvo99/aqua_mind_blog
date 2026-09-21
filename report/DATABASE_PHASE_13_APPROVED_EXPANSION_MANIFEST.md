# DATABASE PHASE 13 — Approved Expansion Manifest

> **Generated:** 2026-09-21
> **Source:** All Phase 13 audit reports
> **Rules:** Verified scientific names only | No morphs as new species | ALIAS_ONLY for trade names | PARENT_SPECIES/VARIANT for morphs | DEFER for unverified | HOLD for uncertain identity | NOT_NEEDED for zero-value additions

---

## STATUS LEGEND

| Status | Meaning |
|---|---|
| **ADD_NOW** | Entity verified, should be created immediately |
| **ALIAS_ONLY** | Trade name should become alias of existing entity, not a new species |
| **PARENT_SPECIES/VARIANT** | Morph/variant should link to parent via parentSpecies field |
| **DEFER** | Scientific name unverified or needs more research before adding |
| **HOLD** | Identity uncertain; taxonomy debate or conflicting information |
| **NOT_NEEDED** | Does not add coverage value (duplicate niche, too obscure, or covered by existing entry) |
| **DUPLICATE/MERGE** | Exact duplicate — merge with existing entry |

---

## 1. FRESHWATER COMMUNITY FISH — EXPANSION

### 1.1 Cichlids — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Boeseman's Rainbowfish | *Melanotaenia boesemani* | species | Rainbowfish | freshwater | Community | Missing popular rainbowfish; distinct from Boesemani Rainbowfish already in DB — **HOLD** | HOLD | Conflicting name: may duplicate existing "Boesemani Rainbowfish" entry. Verify if same species. | Actinopterygii > Atheriniformes > Melanotaeniidae |

### 1.2 Goldfish — P1 (all are Carassius auratus morphs)

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | Ryukin Goldfish | *Carassius auratus* | species | Goldfish | freshwater | Community | Popular fancy goldfish morph | P1 | Verified morph of C. auratus. Distinct body shape (high back, deep body). | PARENT_SPECIES/VARIANT — parent: Common Goldfish |
| 3 | Black Moor Goldfish | *Carassius auratus* | species | Goldfish | freshwater | Community | Popular telescope-eye morph | P1 | Verified morph of C. auratus. Dark color + telescope eyes. | PARENT_SPECIES/VARIANT — parent: Common Goldfish |
| 4 | Telescope Goldfish | *Carassius auratus* | species | Goldfish | freshwater | Community | Popular telescope-eye morph (red variant) | P1 | Verified morph of C. auratus. Telescope eyes, red/orange. | PARENT_SPECIES/VARIANT — parent: Common Goldfish |

### 1.3 Others — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 5 | Red-Tail Shark | *Epalzeorhynchos bicolor* | species | Others | freshwater | Community | Iconic freshwater species, very common in trade | P1 | Verified. Distinct from Rainbow Shark (E. frenatum). | Actinopterygii > Cypriniformes > Cyprinidae |
| 6 | Denison Barb | *Sahyadria denisonii* | species | Others | freshwater | Community | Popular "Roseline Shark", common in trade | P1 | Verified. Distinct barb species. | Actinopterygii > Cypriniformes > Cyprinidae |
| 7 | Bala Shark | *Balantiocheilos melanopterus* | species | Others | freshwater | Community | Very common in pet stores, iconic large cyprinid | P1 | Verified. Distinct genus. | Actinopterygii > Cypriniformes > Cyprinidae |
| 8 | Black Ghost Knifefish | *Apteronotus albifrons* | species | Others | freshwater | Community | Iconic species, unique body plan | P1 | Verified. Distinct genus in Apteronotidae. | Actinopterygii > Gymnotiformes > Apteronotidae |
| 9 | Tinfoil Barb | *Barbonymus schwanenfeldii* | species | Others | freshwater | Community | Very common in trade, large barb | P1 | Verified. Distinct genus. | Actinopterygii > Cypriniformes > Cyprinidae |
| 10 | Freshwater Stingray | *Potamotrygon motoro* | species | Others | freshwater | Community, Predator | Iconic monster fish species | P1 | Verified. Type species of Potamotrygon. | Chondrichthyes > Myliobatiformes > Potamotrygonidae |

### 1.4 Cichlids (Community) — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 11 | Severum | *Heros severus* | species | Cichlids | freshwater | Community | Popular medium-large South American cichlid | P1 | Verified. Distinct species. | Actinopterygii > Cichliformes > Cichlidae |

### 1.5 Others — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 12 | Figure-8 Puffer | *Tetraodon biocellatus* | species | Puffer | freshwater, brackish | Community | Popular freshwater/brackish puffer | P2 | Verified. Distinct from Pea Puffer. | Actinopterygii > Tetraodontiformes > Tetraodontidae |

### 1.6 Rasboras / Danios — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 13 | Giant Danio | *Devario aequipinnatus* | species | Rasboras / Danios | freshwater | Community | Popular large danio for community tanks | P2 | Verified. Distinct genus from Danio. | Actinopterygii > Cypriniformes > Cyprinidae |

### 1.7 Plecos — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 14 | Sailfin Pleco | *Pterygoplichthys pardalis* | species | Plecos | freshwater | Community | Very common in trade, often sold as "common pleco" | P2 | Verified. Distinct genus from Hypostomus. | Actinopterygii > Siluriformes > Loricariidae |

### 1.8 Livebearers — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 15 | Halfbeak | *Dermogenys pusilla* | species | Livebearers | freshwater | Community | Popular livebearer, distinct family | P2 | Verified. Distinct family (Hemiramphidae). | Actinopterygii > Beloniformes > Hemiramphidae |

---

## 2. FRESHWATER PREDATOR & LARGE FISH — EXPANSION

### 2.1 Predatory Cichlids — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 16 | Jaguar Cichlid | *Parachromis managuensis* | species | Predatory Cichlids | freshwater | Predator | Very popular predator cichlid | P1 | Verified. Distinct genus. | Actinopterygii > Cichliformes > Cichlidae |
| 17 | Wolf Cichlid | *Parachromis dovii* | species | Predatory Cichlids | freshwater | Predator | Popular large predator cichlid | P1 | Verified. Same genus as Jaguar. | Actinopterygii > Cichliformes > Cichlidae |
| 18 | Midas Cichlid | *Amphilophus citrinellus* | species | Predatory Cichlids | freshwater | Predator | Very popular predator cichlid | P1 | Verified. Distinct genus. | Actinopterygii > Cichliformes > Cichlidae |
| 19 | Red Devil Cichlid | *Amphilophus labiatus* | species | Predatory Cichlids | freshwater | Predator | Popular predator cichlid, often confused with Midas | P1 | Verified. Same genus as Midas. | Actinopterygii > Cichliformes > Cichlidae |

### 2.2 Large Predatory Catfish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | Tiger Shovelnose Catfish | *Pseudoplatystoma tigrinum* | species | Large Predatory Catfish | freshwater | Predator | #2 most popular monster catfish | P1 | Verified. Distinct genus. | Actinopterygii > Siluriformes > Pimelodidae |
| 21 | Pictus Catfish | *Pimelodus pictus* | species | Large Predatory Catfish | freshwater | Community, Predator | Very popular mid-sized predator catfish | P1 | Verified. Distinct genus. | Actinopterygii > Siluriformes > Pimelodidae |

### 2.3 Other Large Fish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 22 | Clown Knifefish | *Chitala chitala* | species | Other Large Fish | freshwater | Predator | Iconic monster fish | P1 | Verified. Distinct genus. | Actinopterygii > Osteoglossiformes > Notopteridae |
| 23 | Iridescent Shark | *Pangasianodon hypophthalmus* | species | Other Large Fish | freshwater | Predator, Large Fish | Extremely common in pet stores | P1 | Verified. Distinct genus. | Actinopterygii > Siluriformes > Pangasiidae |
| 24 | Red-Bellied Pacu | *Piaractus brachypomus* | species | Other Large Fish | freshwater | Predator | Common in trade, often confused with piranha | P1 | Verified. Distinct genus. | Actinopterygii > Characiformes > Serrasalmidae |

### 2.4 Gar — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 25 | Spotted Gar | *Lepisosteus oculatus* | species | Gar | freshwater | Predator | #2 most popular gar species | P1 | Verified. Distinct genus from Alligator Gar. | Actinopterygii > Lepisosteiformes > Lepisosteidae |

### 2.5 Snakehead — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 26 | Spotted Snakehead | *Channa punctata* | species | Snakehead | freshwater | Predator | Common Channa in pet trade | P1 | Verified. Distinct species within Channa. | Actinopterygii > Anabantiformes > Channidae |

### 2.6 Arowana — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 27 | Black Arowana | *Osteoglossum ferreirai* | species | Arowana | freshwater | Predator | Collector favorite, distinct from Silver | P1 | Verified. Distinct species in Osteoglossum. | Actinopterygii > Osteoglossiformes > Osteoglossidae |

### 2.7 Other Large Fish — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 28 | Walking Catfish | *Clarias batrachus* | species | Large Predatory Catfish | freshwater | Predator | Common in trade, iconic species | P2 | Verified. Distinct genus. | Actinopterygii > Siluriformes > Clariidae |

### 2.8 Bichir — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 29 | Weeks Bichir | *Polypterus weeksii* | species | Bichir | freshwater | Predator | Collector bichir species | P2 | Verified. Distinct species within Polypterus. | Actinopterygii > Polypteriformes > Polypteridae |

### 2.9 Gar — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 30 | Longnose Gar | *Lepisosteus osseus* | species | Gar | freshwater | Predator | Less common but notable predator fish | P2 | Verified. Distinct species within Lepisosteus. | Actinopterygii > Lepisosteiformes > Lepisosteidae |

### 2.10 Peacock Bass — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 31 | Orinoco Peacock Bass | *Cichla monoculus* | species | Peacock Bass | freshwater | Predator | #2 most popular peacock bass species | P2 | Verified. Distinct species within Cichla. | Actinopterygii > Cichliformes > Cichlidae |
| 32 | Three-Barred Peacock Bass | *Cichla temensis* | species | Peacock Bass | freshwater | Predator | #3 most popular peacock bass species | P2 | Verified. Distinct species within Cichla. | Actinopterygii > Cichliformes > Cichlidae |

---

## 3. MARINE FISH — EXPANSION

### 3.1 Clownfish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 33 | Maroon Clownfish | *Premnas biaculeatus* | species | Clownfish | saltwater | Anemone/Clownfish, Mixed Reef | Very popular clownfish, distinct genus | P1 | Verified. Now placed in Premnas (not Amphiprion). | Actinopterygii > Perciformes > Pomacentridae |
| 34 | Tomato Clownfish | *Amphiprion frenatus* | species | Clownfish | saltwater | Anemone/Clownfish, Mixed Reef | Popular clownfish species | P1 | Verified. Distinct species. | Actinopterygii > Perciformes > Pomacentridae |
| 35 | Clarkii Clownfish | *Amphiprion clarkii* | species | Clownfish | saltwater | Anemone/Clownfish, Mixed Reef | Most widespread clownfish species | P1 | Verified. Most common wild Amphiprion. | Actinopterygii > Perciformes > Pomacentridae |

### 3.2 Tangs / Surgeonfish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 36 | Purple Tang | *Zebrasoma xanthurum* | species | Tangs | saltwater | Mixed Reef | Popular tang, distinct color | P1 | Verified. Same genus as Yellow Tang. | Actinopterygii > Perciformes > Acanthuridae |
| 37 | Powder Blue Tang | *Acanthurus leucosternon* | species | Tangs | saltwater | Mixed Reef | Iconic tang species | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Acanthuridae |

### 3.3 Angelfish (Marine) — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 38 | Queen Angelfish | *Holacanthus ciliaris* | species | Angelfish | saltwater | Mixed Reef | Iconic marine angelfish | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Pomacanthidae |

### 3.4 Wrasses — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 39 | Cleaner Wrasse | *Labroides dimidiatus* | species | Wrasses | saltwater | Mixed Reef | Iconic cleaner species, very common | P1 | Verified. Distinct genus. Note: Difficult to keep in captivity. | Actinopterygii > Perciformes > Labridae |
| 40 | Melanurus Wrasse | *Halichoeres melanurus* | species | Wrasses | saltwater | Mixed Reef | Popular wrasse, same genus as Yellow Coris | P1 | Verified. Distinct species within Halichoeres. | Actinopterygii > Perciformes > Labridae |
| 41 | Flasher Wrasse | *Paracheilinus filamentosus* | species | Wrasses | saltwater | Mixed Reef | Popular colorful wrasse | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Labridae |

### 3.5 Butterflyfish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 42 | Raccoon Butterflyfish | *Chaetodon lunula* | species | Butterflyfish | saltwater | Mixed Reef | Popular butterflyfish | P1 | Verified. Distinct species within Chaetodon. | Actinopterygii > Perciformes > Chaetodontidae |
| 43 | Longnose Butterflyfish | *Forcipiger flavissimus* | species | Butterflyfish | saltwater | Mixed Reef | Distinct body form, popular | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Chaetodontidae |

### 3.6 Eels / Morays — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 44 | Snowflake Eel | *Echidna nebulosa* | species | Eels | saltwater | FOWLR, Marine Predator | Very popular moray, commonly available | P1 | Verified. Distinct genus from Gymnomuraena. | Actinopterygii > Anguilliformes > Muraenidae |

### 3.7 Hawkfish — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 45 | Longnose Hawkfish | *Oxycirrhites typus* | species | Hawkfish | saltwater | Mixed Reef | Popular hawkfish, distinctive long snout | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Cirrhitidae |
| 46 | Arc-eye Hawkfish | *Paracirrhites arcatus* | species | Hawkfish | saltwater | Mixed Reef | Popular hawkfish | P1 | Verified. Distinct genus. | Actinopterygii > Perciformes > Cirrhitidae |

### 3.8 Gobies — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 47 | Diamond Watchman Goby | *Valenciennea puellaris* | species | Gobies | saltwater | Mixed Reef | Popular sand-sifting goby | P2 | Verified. Distinct genus. | Actinopterygii > Perciformes > Gobiidae |

### 3.9 Blennies — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 48 | Bicolor Blenny | *Ecsenius bicolor* | species | Blennies | saltwater | Mixed Reef | Popular blenny, common in trade | P2 | Verified. Same genus as Tailspot. | Actinopterygii > Perciformes > Blenniidae |

### 3.10 Triggerfish — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 49 | Queen Triggerfish | *Balistoides vetula* | species | Triggerfish | saltwater | FOWLR, Marine Predator | Popular triggerfish | P2 | Verified. Same genus as Clown Trigger. | Actinopterygii > Tetraodontiformes > Balistidae |

### 3.11 Groupers / Basslets — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | Black Cap Basslet | *Gramma melacara* | species | Groupers / Basslets | saltwater | Mixed Reef | Popular basslet, same genus as Royal Gramma | P2 | Verified. Distinct species within Gramma. | Actinopterygii > Perciformes > Grammatidae |

### 3.12 Anthias — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 51 | Bartlett's Anthias | *Pseudanthias bartlettorum* | species | Anthias | saltwater | Mixed Reef | Popular anthias, same genus as Lyretail | P2 | Verified. Distinct species within Pseudanthias. | Actinopterygii > Perciformes > Serranidae |

### 3.13 Cardinalfish — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 52 | Pajama Cardinalfish | *Sphaeramia nematoptera* | species | Cardinalfish | saltwater | Nano Reef, Mixed Reef | Popular cardinalfish, very distinctive pattern | P2 | Verified. Distinct genus. | Actinopterygii > Perciformes > Apogonidae |

### 3.14 Puffers — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 53 | Stars and Stripes Puffer | *Arothron hispidus* | species | Puffers | saltwater | FOWLR, Marine Predator | Popular large marine puffer | P2 | Verified. Distinct genus from Porcupine Puffer. | Actinopterygii > Tetraodontiformes > Tetraodontidae |

### 3.15 Frogfish / Scorpionfish — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 54 | Stonefish | *Synanceia verrucosa* | species | Frogfish / Scorpionfish | saltwater | Marine Predator | Iconic species, though dangerous | HOLD | Verified species, but extreme toxicity makes it questionable for hobby content. Defer for editorial review. | Actinopterygii > Scorpaeniformes > Synanceiidae |

---

## 4. MARINE INVERTEBRATES — EXPANSION

### 4.1 Anemones — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 55 | Sebae Anemone | *Heteractis crispa* | species | Anemones | saltwater | Anemone/Clownfish, Mixed Reef | Popular host anemone | P1 | Verified. Distinct species, common host. | Cnidaria > Actiniaria > Stichodactylidae |
| 56 | Magnificent Anemone | *Heteractis magnifica* | species | Anemones | saltwater | Anemone/Clownfish, Mixed Reef | Premium host anemone | P1 | Verified. Same genus as Sebae. | Cnidaria > Actiniaria > Stichodactylidae |

### 4.2 Starfish — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 57 | Chocolate Chip Starfish | *Protoreaster nodosus* | species | Starfish | saltwater | Mixed Reef, Invertebrate-focused | Iconic decorative starfish | P2 | Verified. Distinct genus. | Asteroidea > Valvatida > Oreasteridae |
| 58 | Fromia Starfish | *Fromia nodosa* | species | Starfish | saltwater | Mixed Reef, Invertebrate-focused | Popular decorative starfish | P2 | Verified. Distinct genus. | Asteroidea > Valvatida > Goniasteridae |

### 4.3 Snails — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 59 | Trochus Snail | *Trochus maculatus* | species | Snails | saltwater | Mixed Reef | Excellent algae eater, popular cleanup crew | P2 | Verified. Distinct genus from Turbo. | Gastropoda > Trochida > Trochidae |
| 60 | Astraea Snail | *Astrea tecta* | species | Snails | saltwater | Mixed Reef | Common cleanup crew snail | P2 | Verified. Distinct genus. | Gastropoda > Trochida > Turbinidae |

### 4.4 Crabs — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 61 | Pom-Pom Crab | *Lybia tessellata* | species | Crabs | saltwater | Mixed Reef, Invertebrate-focused | Popular decorative crab | P2 | Verified. Distinct genus. | Malacostraca > Decapoda > Xanthidae |

### 4.5 Urchins — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 62 | Pencil Urchin | *Heterocentrotus mamillatus* | species | Urchins | saltwater | Mixed Reef | Popular large urchin | P2 | Verified. Distinct genus from Tuxedo. | Echinoidea > Camarodonta > Echinometridae |

---

## 5. CORALS — EXPANSION

### 5.1 Soft Corals — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 63 | Lobophytum Leather | *Lobophytum sp.* | coral | Soft Corals | saltwater | Soft Coral Reef, Mixed Reef | Third common leather genus | P2 | Verified genus. Distinct from Sarcophyton and Sinularia. | Anthozoa > Alcyonacea > Alcyoniidae |

### 5.2 LPS Corals — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 64 | Wellsophyllia | *Wellsophyllia tortora* | coral | LPS Corals | saltwater | LPS Reef, Mixed Reef | Separate genus from Euphyllia | DEFER | Taxonomy debated — some sources synonymize with Euphyllia. Defer until resolved. | Anthozoa > LPS > Euphylliidae (disputed) |
| 65 | Turbinaria | *Turbinaria reniformis* | coral | LPS Corals | saltwater | LPS Reef, Mixed Reef | Common LPS, distinct growth form | P2 | Verified. Distinct genus, SPS-like growth but LPS polyps. | Anthozoa > Scleractinia > Dendrophylliidae |
| 66 | Table Acropora | *Acropora hyacinthus* | coral | SPS Corals | saltwater | SPS Reef, Mixed Reef | Distinct growth form from Staghorn | P1 | Verified. Popular table-form Acropora. | Anthozoa > Scleractinia > Acroporidae |

### 5.3 SPS Corals — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 67 | Porites | *Porites lobata* | coral | SPS Corals | saltwater | SPS Reef, Mixed Reef | Common massive SPS | P2 | Verified. Distinct genus, massive/boulder growth. | Anthozoa > Scleractinia > Poritidae |

### 5.4 NPS Corals — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Gorgonian | *Eunicella cavolini* | coral | NPS Corals | saltwater | NPS, Mixed Reef | Common NPS, distinct fan form | P1 | Verified genus. Note: Many Gorgonian species exist; E. cavolini is a common representative. | Anthozoa > Alcyonacea > Gorgoniidae |

---

## 6. PLANTS — EXPANSION

### 6.1 Epiphytes — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 69 | Bolbitis Heudelotii | *Bolbitis heudelotii* | plant | Epiphytes | freshwater | Planted, Low-Tech | Popular African water fern | P1 | Verified. Distinct genus from Microsorum. | Polypodiopsida > Polypodiales > Dryopteridaceae |
| 70 | Java Fern Windelov | *Microsorum pteropus 'Windelov'* | plant | Epiphytes | freshwater | Planted, Low-Tech | Popular Java Fern cultivar | P1 | Verified cultivar. Distinct leaf shape (bifurcated tips). | PARENT_SPECIES/VARIANT — parent: Java Fern |
| 71 | Java Fern Narrow Leaf | *Microsorum pteropus 'Narrow'* | plant | Epiphytes | freshwater | Planted, Low-Tech | Popular Java Fern cultivar | P1 | Verified cultivar. Narrow leaf form. | PARENT_SPECIES/VARIANT — parent: Java Fern |

### 6.2 Rosette Plants — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 72 | Cryptocoryne Parva | *Cryptocoryne parva* | plant | Rosette Plants | freshwater | Planted, Aquascaping | Smallest Crypt, popular foreground | P1 | Verified. Distinct species, smallest Cryptocoryne. | Liliopsida > Alismatales > Araceae |

### 6.3 Stem Plants — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 73 | Rotala Wallichii | *Rotala wallichii* | plant | Stem Plants | freshwater | Planted | Popular red stem plant | P1 | Verified. Distinct species within Rotala. | Liliopsida > Myrtales > Lythraceae |
| 74 | Pogostemon Helferi | *Pogostemon helferi* | plant | Stem Plants | freshwater | Planted, Aquascaping | Unique "Downoi" star-shaped plant | P1 | Verified. Distinct species. | Liliopsida > Lamiales > Lamiaceae |

### 6.4 Carpet Plants — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 75 | Dwarf Baby Tears | *Hemianthus callitrichoides* | plant | Carpet Plants | freshwater | Aquascaping, Planted | Iconic carpet plant, Cuba | P1 | Verified. Distinct genus. | Liliopsida > Lamiales > Plantaginaceae |

### 6.5 Specialty Plants — P3

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 76 | Thai Onion Plant | *Crinum thaianum* | plant | Specialty Plants | freshwater | Planted | Unique bulb plant, popular in specialized tanks | P3 | Verified. Distinct genus. | Liliopsida > Asparagales > Amaryllidaceae |

---

## 7. EQUIPMENT — EXPANSION

### 7.1 CO2 System — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 77 | CO2 Diffuser | — | equipment | CO2 | freshwater | Planted, High-Tech / CO2 | Essential component for CO2 injection | P1 | Standard planted tank equipment | N/A |
| 78 | CO2 Drop Checker | — | equipment | CO2, Testing | freshwater | Planted, High-Tech / CO2 | Essential CO2 monitoring tool | P1 | Standard planted tank equipment | N/A |

### 7.2 Lighting — P2

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 79 | T5 Fluorescent Light | — | equipment | Lighting | saltwater | Reef, SPS Reef | Still widely used for reef tanks | P2 | Standard reef equipment, especially for SPS | N/A |

---

## 8. PROBLEMS — EXPANSION

### 8.1 Coral Problems — P0 (CRITICAL)

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | Brown Jelly Disease | — | problem | Coral Problems | saltwater | Reef | Common LPS affliction | P0 | Well-documented coral disease | N/A |
| 81 | Rapid Tissue Necrosis | — | problem | Coral Problems | saltwater | Reef | Lethal SPS disease | P0 | Well-documented coral disease | N/A |
| 82 | Slow Tissue Necrosis | — | problem | Coral Problems | saltwater | Reef | Progressive SPS disease | P0 | Well-documented coral disease | N/A |
| 83 | Coral Bleaching | — | problem | Coral Problems | saltwater, freshwater | Reef, Planted | Temperature/light stress response | P0 | Well-documented, affects all corals | N/A |
| 84 | Aiptasia Infestation | — | problem | Coral Problems | saltwater | Reef | Pest anemone infestation | P0 | Common reef pest | N/A |

### 8.2 Water Quality — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 85 | High Nitrite | — | problem | Water Quality | freshwater | Community | Part of nitrogen cycle issues | P1 | Fundamental water quality parameter | N/A |
| 86 | High Nitrate | — | problem | Water Quality | freshwater, saltwater | Community, Reef | Common algae driver | P1 | Fundamental water quality parameter | N/A |
| 87 | pH Crash | — | problem | Water Quality | freshwater, saltwater | Community, Reef | Common fish killer | P1 | Well-documented critical issue | N/A |

### 8.3 Equipment Problems — P1

| # | name | scientificName | domain | group | waterType | aquariumStyle | reason | priority | evidence | taxonomy |
|---|---|---|---|---|---|---|---|---|---|---|
| 88 | Heater Stuck On | — | problem | Equipment Problems | freshwater | Community | Can cook tank, critical failure | P1 | Common equipment failure | N/A |
| 89 | Heater Stuck Off | — | problem | Equipment Problems | freshwater | Community | Temperature crash, critical failure | P1 | Common equipment failure | N/A |
| 90 | pH Drift | — | problem | Equipment Problems | freshwater, saltwater | Community, Reef | Common with inadequate buffering | P1 | Well-documented issue | N/A |

---

## 9. STYLE TAGGING FIXES (No new entities — tag updates only)

| # | entity | currentStyle | addStyle | reason | priority |
|---|---|---|---|---|---|
| 91 | Frontosa | Community | African Cichlid | African Rift Lake cichlid | P1 |
| 92 | Electric Yellow Cichlid | Community | African Cichlid | African Rift Lake cichlid | P1 |
| 93 | Zebra Mbuna | — | African Cichlid | African Rift Lake cichlid | P1 |
| 94 | Tropheus | — | African Cichlid | African Rift Lake cichlid | P1 |
| 95 | Bumblebee Goby | Community | Brackish | Brackish species | P1 |
| 96 | Ocellaris Clownfish | Community | Anemone/Clownfish | Clownfish for host anemone content | P1 |
| 97 | Percula Clownfish | Community | Anemone/Clownfish | Clownfish for host anemone content | P1 |
| 98 | Bubble Tip Anemone | — | Anemone/Clownfish | Host anemone for clownfish content | P1 |
| 99 | Chocolate Gourami | — | Blackwater | Blackwater habitat species | P2 |
| 100 | Cardinal Tetra | Community | Blackwater | Blackwater habitat species | P2 |

---

## EXPANSION SUMMARY

| Status | Count | Notes |
|---|---|---|
| **ADD_NOW** | 79 | Verified entities to create |
| **PARENT_SPECIES/VARIANT** | 7 | Morphs linking to parent (Goldfish ×3, Java Fern ×2, Angelfish already handled, Shrimp morphs) |
| **ALIAS_ONLY** | 0 | None identified in this pass |
| **DEFER** | 2 | Wellsophyllia taxonomy disputed; Stonefish editorial review |
| **HOLD** | 2 | Boeseman's Rainbowfish name conflict; Red Rotala tag needed |
| **NOT_NEEDED** | 5 | San Francisco Piranha (geographic variant of P. nattereri), RTG Arowana (variant of S. formosus), Red-Tailed Golden Arowana (variant), Leichardti Arowana (collector niche), Copperhead Snakehead (niche) |
| **DUPLICATE/MERGE** | 0 | None in expansion (existing dupes handled in taxonomy audit) |
| **Style Tag Updates** | 10 | No new entities — existing entity tag corrections |
| **TOTAL MANIFEST ENTRIES** | 100 | 79 new entities + 7 variant links + 2 defer + 2 hold + 10 style fixes |

---

## EXPANSION BY DOMAIN

| Domain | ADD_NOW | PARENT_SPECIES/VARIANT | DEFER | HOLD | NOT_NEEDED | Total |
|---|---|---|---|---|---|---|
| FW Community Fish | 14 | 3 (Goldfish morphs) | 0 | 1 | 0 | 18 |
| FW Predator / Large Fish | 17 | 0 | 0 | 0 | 2 | 19 |
| Marine Fish | 22 | 0 | 1 | 0 | 0 | 23 |
| Marine Invertebrates | 8 | 0 | 0 | 0 | 0 | 8 |
| Corals | 6 | 0 | 1 | 0 | 0 | 7 |
| Plants | 7 | 2 (Java Fern) | 0 | 0 | 0 | 9 |
| Equipment | 3 | 0 | 0 | 0 | 0 | 3 |
| Problems | 11 | 0 | 0 | 0 | 0 | 11 |
| Style Tag Updates | 10 | 0 | 0 | 0 | 0 | 10 |
| **TOTAL** | **98** | **5** | **2** | **1** | **2** | **108** |

---

## PRIORITY BREAKDOWN

| Priority | Count | Entity IDs |
|---|---|---|
| **P0 (Critical)** | 5 | Coral Problems: Brown Jelly, RTN, STN, Bleaching, Aiptasia |
| **P1 (High)** | 54 | Cichlids (Severum, Jaguar, Wolf, Midas, Red Devil), Catfish (Tiger Shovelnose, Pictus), Other Large (Clown Knife, Iridescent Shark, Pacu, Red-Tail Shark, Denison Barb, Bala Shark, Black Ghost Knifefish, Tinfoil Barb, FW Stingray), Gar (Spotted), Snakehead (Spotted), Arowana (Black), Clownfish (Maroon, Tomato, Clarkii), Tangs (Purple, Powder Blue), Angelfish (Queen), Wrasses (Cleaner, Melanurus, Flasher), Butterflyfish (Raccoon, Longnose), Eels (Snowflake), Hawkfish (Longnose, Arc-eye), Anemones (Sebae, Magnificent), Corals (Table Acropora, Gorgonian), Plants (Bolbitis, Java Fern Windelov, Java Fern Narrow Leaf, Crypt Parva, Rotala Wallichii, P. helferi, HC Cuba), Equipment (CO2 Diffuser, Drop Checker), Water Quality (Nitrite, Nitrate, pH Crash), Equipment Problems (Heater On/Off, pH Drift), Others (P. fulvidraco, C. striata) |
| **P2 (Medium)** | 35 | Plecos (Sailfin), Puffer (Figure-8), Danios (Giant), Livebearers (Halfbeak), Bichirs (Weeks), Gar (Longnose), Peacock Bass (Monoculus, Temensis), Walking Catfish, Marine (Diamond Watchman, Bicolor Blenny, Queen Trigger, Black Cap Basslet, Bartlett's Anthias, Pajama Cardinal, Stars & Stripes Puffer, Chocolate Chip Starfish, Fromia, Trochus, Astraea, Pom-Pom, Pencil Urchin), Corals (Lobophytum, Turbinaria, Porites), Plants (—), Equipment (T5 Light) |
| **P3 (Low)** | 1 | Plants (Thai Onion) |

---

## TAXONOMY NOTES FOR MIGRATION

1. **Goldfish morphs (3):** All *Carassius auratus* — must set `parentSpecies` = Common Goldfish ID
2. **Java Fern cultivars (2):** Must set `parentSpecies` = Java Fern (*Microsorum pteropus*) ID
3. **Maroon Clownfish:** Should use *Premnas biaculeatus* (not *Amphiprion melanopus* as some databases list)
4. **Gorgonian:** Use *Eunicella cavolini* as representative; note in aliases that many species exist
5. **Cleaner Wrasse:** Add care note that *Labroides dimidiatus* is difficult to sustain in captivity
6. **Wellsophyllia:** DEFER — taxonomy disputed; some authorities place in Euphyllia
7. **Stonefish:** HOLD — extreme toxicity makes hobby content editorial review necessary
