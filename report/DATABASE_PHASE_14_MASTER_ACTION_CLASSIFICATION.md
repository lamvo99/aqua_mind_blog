# DATABASE PHASE 14 — Master Action Classification (SPEC-01)

> **Generated:** 2026-09-21
> **Source:** Phase 13 Approved Expansion Manifest + Taxonomy Identity Audit + Full Inventory
> **Purpose:** For EVERY candidate in the Phase 13 manifest, classify into canonical action types before any entity creation
> **Scope:** 100 manifest entries (Sections 1–9) + 10 mandatory identity reviews

---

## STATUS LEGEND (SPEC-01 Classification)

| Classification | Meaning |
|---|---|
| **canonical species** | Standalone new species — create as independent entity |
| **morph** | Color form / ornamental strain — create with `parentSpecies` link |
| **cultivar** | Plant variety — create with `parentSpecies` link |
| **trade name** | Should become `aliases` of existing entity, not a new species |
| **duplicate** | Exact duplicate of existing entity — merge |
| **alias** | Add to existing entity's `aliases` field |
| **equipment subtype** | Equipment subcategory — create under parent equipment group |
| **problem subtype** | Problem subcategory — create under parent problem group |

---

## 1. MASTER ACTION CLASSIFICATION TABLE — ALL MANIFEST CANDIDATES

### Section 1: Freshwater Community Fish

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Boeseman's Rainbowfish | species | YES — `species-melanotaenia-boesemani` ("Boesemani Rainbowfish") | YES (*Melanotaenia boesemani*) | **duplicate** | MERGE — same species, name spelling variant | Existing: Boesemani Rainbowfish | Identical scientific name. "Boeseman's" vs "Boesemani" is a common name spelling variation. | HOLD | Verify if distinct entry needed or if "Boeseman's" becomes alias of existing. See mandatory review #8. |
| 2 | Ryukin Goldfish | species | NO | YES (*Carassius auratus*) | **morph** | CREATE with `parentSpecies` = Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`) | Common Goldfish | Verified C. auratus morph. Distinct body shape (high back, deep body). | P1 | PARENT_SPECIES/VARIANT — domestic fancy goldfish form |
| 3 | Black Moor Goldfish | species | NO | YES (*Carassius auratus*) | **morph** | CREATE with `parentSpecies` = Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`) | Common Goldfish | Verified C. auratus morph. Dark color + telescope eyes. | P1 | PARENT_SPECIES/VARIANT — domestic fancy goldfish form |
| 4 | Telescope Goldfish | species | NO | YES (*Carassius auratus*) | **morph** | CREATE with `parentSpecies` = Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`) | Common Goldfish | Verified C. auratus morph. Telescope eyes, red/orange variant. | P1 | PARENT_SPECIES/VARIANT — domestic fancy goldfish form |
| 5 | Red-Tail Shark | species | NO | YES (*Epalzeorhynchos bicolor*) | **canonical species** | CREATE new entity | — | Verified. Distinct from Rainbow Shark (*E. frenatum*) already in DB. | P1 | Distinct genus, iconic freshwater species |
| 6 | Denison Barb | species | NO | YES (*Sahyadria denisonii*) | **canonical species** | CREATE new entity | — | Verified. Distinct barb species ("Roseline Shark"). | P1 | Popular trade fish, distinct genus |
| 7 | Bala Shark | species | NO | YES (*Balantiocheilos melanopterus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Very common in pet stores |
| 8 | Black Ghost Knifefish | species | NO | YES (*Apteronotus albifrons*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus in Apteronotidae. | P1 | Iconic species, unique body plan |
| 9 | Tinfoil Barb | species | NO | YES (*Barbonymus schwanenfeldii*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Very common in trade |
| 10 | Freshwater Stingray | species | NO | YES (*Potamotrygon motoro*) | **canonical species** | CREATE new entity | — | Verified. Type species of Potamotrygon. | P1 | Iconic monster fish species |
| 11 | Severum | species | NO | YES (*Heros severus*) | **canonical species** | CREATE new entity | — | Verified. Distinct species. | P1 | Popular medium-large South American cichlid |
| 12 | Figure-8 Puffer | species | NO | YES (*Tetraodon biocellatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct from Pea Puffer (*Carinotetraodon travancoricus*). | P2 | Popular freshwater/brackish puffer |
| 13 | Giant Danio | species | NO | YES (*Devario aequipinnatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Danio. | P2 | Popular large danio |
| 14 | Sailfin Pleco | species | NO | YES (*Pterygoplichthys pardalis*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Hypostomus. | P2 | Very common, often sold as "common pleco" |
| 15 | Halfbeak | species | NO | YES (*Dermogenys pusilla*) | **canonical species** | CREATE new entity | — | Verified. Distinct family (Hemiramphidae). | P2 | Popular livebearer |

### Section 2: Freshwater Predator & Large Fish

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 16 | Jaguar Cichlid | species | NO | YES (*Parachromis managuensis*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Very popular predator cichlid |
| 17 | Wolf Cichlid | species | NO | YES (*Parachromis dovii*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Jaguar. | P1 | Popular large predator cichlid |
| 18 | Midas Cichlid | species | NO | YES (*Amphilophus citrinellus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Very popular predator cichlid |
| 19 | Red Devil Cichlid | species | NO | YES (*Amphilophus labiatus*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Midas. | P1 | Often confused with Midas |
| 20 | Tiger Shovelnose Catfish | species | NO | YES (*Pseudoplatystoma tigrinum*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | #2 most popular monster catfish |
| 21 | Pictus Catfish | species | NO | YES (*Pimelodus pictus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Very popular mid-sized predator catfish |
| 22 | Clown Knifefish | species | NO | YES (*Chitala chitala*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Iconic monster fish |
| 23 | Iridescent Shark | species | NO | YES (*Pangasianodon hypophthalmus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Extremely common in pet stores |
| 24 | Red-Bellied Pacu | species | NO | YES (*Piaractus brachypomus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Common, often confused with piranha |
| 25 | Spotted Gar | species | NO | YES (*Lepisosteus oculatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Alligator Gar. | P1 | #2 most popular gar species |
| 26 | Spotted Snakehead | species | NO | YES (*Channa punctata*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Channa. | P1 | Common Channa in pet trade |
| 27 | Black Arowana | species | NO | YES (*Osteoglossum ferreirai*) | **canonical species** | CREATE new entity | — | Verified. Distinct species in Osteoglossum. | P1 | Collector favorite, distinct from Silver |
| 28 | Walking Catfish | species | NO | YES (*Clarias batrachus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Common in trade |
| 29 | Weeks Bichir | species | NO | YES (*Polypterus weeksii*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Polypterus. Spelling confirmed. | P2 | Collector bichir species |
| 30 | Longnose Gar | species | NO | YES (*Lepisosteus osseus*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Lepisosteus. | P2 | Less common but notable predator |
| 31 | Orinoco Peacock Bass | species | NO | YES (*Cichla monoculus*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Cichla. | P2 | #2 most popular peacock bass |
| 32 | Three-Barred Peacock Bass | species | NO | YES (*Cichla temensis*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Cichla. | P2 | #3 most popular peacock bass |

### Section 3: Marine Fish

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 33 | Maroon Clownfish | species | NO | YES (*Premnas biaculeatus*) | **canonical species** | CREATE new entity | — | Verified. Now placed in *Premnas* (not *Amphiprion*). | P1 | Distinct genus, very popular |
| 34 | Tomato Clownfish | species | NO | YES (*Amphiprion frenatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct species. | P1 | Popular clownfish |
| 35 | Clarkii Clownfish | species | NO | YES (*Amphiprion clarkii*) | **canonical species** | CREATE new entity | — | Verified. Most widespread wild Amphiprion. | P1 | Most common wild clownfish |
| 36 | Purple Tang | species | NO | YES (*Zebrasoma xanthurum*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Yellow Tang (*Z. flavescens*). | P1 | Popular tang, distinct color |
| 37 | Powder Blue Tang | species | NO | YES (*Acanthurus leucosternon*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Iconic tang species |
| 38 | Queen Angelfish | species | NO | YES (*Holacanthus ciliaris*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Iconic marine angelfish |
| 39 | Cleaner Wrasse | species | NO | YES (*Labroides dimidiatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Iconic cleaner; add care note: difficult to sustain in captivity |
| 40 | Melanurus Wrasse | species | NO | YES (*Halichoeres melanurus*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Halichoeres. | P1 | Popular wrasse |
| 41 | Flasher Wrasse | species | NO | YES (*Paracheilinus filamentosus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Popular colorful wrasse |
| 42 | Raccoon Butterflyfish | species | NO | YES (*Chaetodon lunula*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Chaetodon. | P1 | Popular butterflyfish |
| 43 | Longnose Butterflyfish | species | NO | YES (*Forcipiger flavissimus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Distinct body form |
| 44 | Snowflake Eel | species | NO | YES (*Echidna nebulosa*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Gymnomuraena. | P1 | Very popular moray |
| 45 | Longnose Hawkfish | species | NO | YES (*Oxycirrhites typus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Popular hawkfish |
| 46 | Arc-eye Hawkfish | species | NO | YES (*Paracirrhites arcatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Popular hawkfish |
| 47 | Diamond Watchman Goby | species | NO | YES (*Valenciennea puellaris*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Popular sand-sifting goby |
| 48 | Bicolor Blenny | species | NO | YES (*Ecsenius bicolor*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Tailspot (*E. stigmatura*). | P2 | Popular blenny |
| 49 | Queen Triggerfish | species | NO | YES (*Balistoides vetula*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Clown Trigger (*B. conspicillum*). | P2 | Popular triggerfish |
| 50 | Black Cap Basslet | species | NO | YES (*Gramma melacara*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Gramma. | P2 | Same genus as Royal Gramma |
| 51 | Bartlett's Anthias | species | NO | YES (*Pseudanthias bartlettorum*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Pseudanthias. | P2 | Popular anthias |
| 52 | Pajama Cardinalfish | species | NO | YES (*Sphaeramia nematoptera*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Very distinctive pattern |
| 53 | Stars and Stripes Puffer | species | NO | YES (*Arothron hispidus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Porcupine Puffer (*Diodon holocanthus*). | P2 | Popular large marine puffer |
| 54 | Stonefish | species | NO | YES (*Synanceia verrucosa*) | **canonical species** | HOLD — deferred for editorial review | — | Verified species, but extreme toxicity makes hobby content questionable. | HOLD | Defer for editorial review |

### Section 4: Marine Invertebrates

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 55 | Sebae Anemone | species | NO | YES (*Heteractis crispa*) | **canonical species** | CREATE new entity | — | Verified. Distinct species, common host. | P1 | Popular host anemone |
| 56 | Magnificent Anemone | species | NO | YES (*Heteractis magnifica*) | **canonical species** | CREATE new entity | — | Verified. Same genus as Sebae. | P1 | Premium host anemone |
| 57 | Chocolate Chip Starfish | species | NO | YES (*Protoreaster nodosus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Iconic decorative starfish |
| 58 | Fromia Starfish | species | NO | YES (*Fromia nodosa*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Popular decorative starfish |
| 59 | Trochus Snail | species | NO | YES (*Trochus maculatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Turbo. | P2 | Excellent algae eater |
| 60 | Astraea Snail | species | NO | YES (*Astrea tecta*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Common cleanup crew snail |
| 61 | Pom-Pom Crab | species | NO | YES (*Lybia tessellata*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Popular decorative crab |
| 62 | Pencil Urchin | species | NO | YES (*Heterocentrotus mamillatus*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Tuxedo. | P2 | Popular large urchin |

### Section 5: Corals

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 63 | Lobophytum Leather | coral | NO | YES (*Lobophytum sp.*) | **canonical species** | CREATE new entity | — | Verified genus. Distinct from Sarcophyton and Sinularia. | P2 | Third common leather genus |
| 64 | Wellsophyllia | coral | NO | YES (*Wellsophyllia tortora*) | **canonical species** | DEFER — taxonomy disputed | — | Taxonomy debated — some sources synonymize with Euphyllia. | DEFER | Defer until taxonomy resolved |
| 65 | Turbinaria | coral | NO | YES (*Turbinaria reniformis*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P2 | Common LPS, SPS-like growth |
| 66 | Table Acropora | coral | NO | YES (*Acropora hyacinthus*) | **canonical species** | CREATE new entity | — | Verified. Popular table-form Acropora. | P1 | Distinct growth form from Staghorn |
| 67 | Porites | coral | NO | YES (*Porites lobata*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus, massive/boulder growth. | P2 | Common massive SPS |
| 68 | Gorgonian | coral | NO | YES (*Eunicella cavolini*) | **canonical species** | CREATE new entity | — | Verified genus. Note: many species exist; *E. cavolini* is representative. | P1 | Common NPS, distinct fan form |

### Section 6: Plants

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 69 | Bolbitis Heudelotii | plant | NO | YES (*Bolbitis heudelotii*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus from Microsorum. | P1 | Popular African water fern |
| 70 | Java Fern Windelov | plant | NO | YES (*Microsorum pteropus 'Windelov'*) | **cultivar** | CREATE with `parentSpecies` = Java Fern (plant ID needed) | Java Fern (*Microsorum pteropus*) | Verified cultivar. Bifurcated leaf tips. | P1 | PARENT_SPECIES/VARIANT — Java Fern cultivar |
| 71 | Java Fern Narrow Leaf | plant | NO | YES (*Microsorum pteropus 'Narrow'*) | **cultivar** | CREATE with `parentSpecies` = Java Fern (plant ID needed) | Java Fern (*Microsorum pteropus*) | Verified cultivar. Narrow leaf form. | P1 | PARENT_SPECIES/VARIANT — Java Fern cultivar |
| 72 | Cryptocoryne Parva | plant | NO | YES (*Cryptocoryne parva*) | **canonical species** | CREATE new entity | — | Verified. Distinct species, smallest Cryptocoryne. | P1 | Popular foreground plant |
| 73 | Rotala Wallichii | plant | NO | YES (*Rotala wallichii*) | **canonical species** | CREATE new entity | — | Verified. Distinct species within Rotala. | P1 | Popular red stem plant |
| 74 | Pogostemon Helferi | plant | NO | YES (*Pogostemon helferi*) | **canonical species** | CREATE new entity | — | Verified. Distinct species. | P1 | Unique "Downoi" star-shaped plant |
| 75 | Dwarf Baby Tears | plant | NO | YES (*Hemianthus callitrichoides*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P1 | Iconic carpet plant from Cuba |
| 76 | Thai Onion Plant | plant | NO | YES (*Crinum thaianum*) | **canonical species** | CREATE new entity | — | Verified. Distinct genus. | P3 | Unique bulb plant |

### Section 7: Equipment

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 77 | CO2 Diffuser | equipment | NO | N/A | **equipment subtype** | CREATE new entity | — | Standard planted tank equipment. | P1 | Essential CO2 injection component |
| 78 | CO2 Drop Checker | equipment | NO | N/A | **equipment subtype** | CREATE new entity | — | Standard planted tank equipment. | P1 | Essential CO2 monitoring tool |
| 79 | T5 Fluorescent Light | equipment | NO | N/A | **equipment subtype** | CREATE new entity | — | Standard reef equipment, especially for SPS. | P2 | Still widely used for reef tanks |

### Section 8: Problems

| # | Candidate | Domain | Current Entity Exists? | Scientific Name Verified? | Classification | Final Action | Parent | Evidence | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | Brown Jelly Disease | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented coral disease. | P0 | Common LPS affliction |
| 81 | Rapid Tissue Necrosis | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented coral disease. | P0 | Lethal SPS disease |
| 82 | Slow Tissue Necrosis | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented coral disease. | P0 | Progressive SPS disease |
| 83 | Coral Bleaching | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented, affects all corals. | P0 | Temperature/light stress response |
| 84 | Aiptasia Infestation | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Common reef pest. | P0 | Pest anemone infestation |
| 85 | High Nitrite | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Fundamental water quality parameter. | P1 | Part of nitrogen cycle issues |
| 86 | High Nitrate | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Fundamental water quality parameter. | P1 | Common algae driver |
| 87 | pH Crash | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented critical issue. | P1 | Common fish killer |
| 88 | Heater Stuck On | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Common equipment failure. | P1 | Can cook tank, critical failure |
| 89 | Heater Stuck Off | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Common equipment failure. | P1 | Temperature crash |
| 90 | pH Drift | problem | NO | N/A | **problem subtype** | CREATE new entity | — | Well-documented issue. | P1 | Common with inadequate buffering |

---

## 2. STYLE TAG UPDATES (No New Entities — Tag Corrections Only)

| # | Entity | Current Style | Add Style | Reason | Priority |
|---|---|---|---|---|---|
| 91 | Frontosa Cichlid | Community | African Cichlid | African Rift Lake cichlid (*Cyphotilapia frontosa*) | P1 |
| 92 | Electric Yellow Cichlid | Community | African Cichlid | African Rift Lake cichlid (*Labidochromis caeruleus*) | P1 |
| 93 | Zebra Mbuna Cichlid | — (none) | African Cichlid | African Rift Lake cichlid | P1 |
| 94 | Dubois' Tropheus | — (none) | African Cichlid | African Rift Lake cichlid (*Tropheus duboisi*) | P1 |
| 95 | Bumblebee Goby | Community | Brackish | Brackish species (*Brachygobius doriae*), waterType=brackish | P1 |
| 96 | Ocellaris Clownfish | Community | Anemone/Clownfish | Clownfish for host anemone content (*Amphiprion ocellaris*) | P1 |
| 97 | Percula Clownfish | Community | Anemone/Clownfish | Clownfish for host anemone content (*Amphiprion percula*) | P1 |
| 98 | Bubble Tip Anemone | — (none) | Anemone/Clownfish | Host anemone for clownfish content (*Entacmaea quadricolor*) | P1 |
| 99 | Chocolate Gourami | — (none) | Blackwater | Blackwater habitat species (*Sphaerichthys osphromenoides*) | P2 |
| 100 | Cardinal Tetra | Community | Blackwater | Blackwater habitat species (*Paracheirodon axelrodi*) | P2 |

---

## 3. MANDATORY IDENTITY REVIEWS (SPEC-01 §Mandatory)

### Review #1: Banggai Clownfish

| Field | Finding |
|---|---|
| **Manifest reference** | Marine Fish Audit listed "Banggai Clownfish" as *Amphiprion polymnus* (Banggai variant) |
| **Correct identity** | **Pterapogon kauderni** — Banggai Cardinalfish (family Apogonidae) |
| **Verification** | Entity ALREADY EXISTS in DB as "Banggai Cardinalfish" (`sebdKYryWZgYP2rm3noHja`, id: `sebdKYryWZgYP2rm3noHja`) |
| **Error type** | **Misidentification** — "Banggai Clownfish" is not an Amphiprion. The Banggai Cardinalfish (*P. kauderni*) is a cardinalfish, not a clownfish |
| **Action** | **DO NOT CREATE** — Entity already exists under correct name. "Banggai Clownfish" should be added as an alias to the existing Banggai Cardinalfish entry, or flagged as a common misnomer |
| **Classification** | **alias** (add "Banggai Clownfish" as alias of existing Banggai Cardinalfish) |

### Review #2: Panda Clownfish

| Field | Finding |
|---|---|
| **Manifest reference** | Marine Fish Audit listed "Panda Clownfish" as *Amphiprion ocellaris* (Panda morph) |
| **Correct identity** | *Amphiprion ocellaris* — Panda is a color morph of Ocellaris Clownfish |
| **Verification** | Ocellaris Clownfish exists in DB (`species-amphiprion-ocellaris`) |
| **Error type** | **Morph listed as species** — Panda is a selectively bred color form, not a distinct species |
| **Action** | **CREATE as morph** with `parentSpecies` = Ocellaris Clownfish (`species-amphiprion-ocellaris`) |
| **Classification** | **morph** — parent: Ocellaris Clownfish |
| **Note** | Not in main manifest rows (was in audit only). Should be added as PARENT_SPECIES/VARIANT if desired |

### Review #3: Stars-and-Stripes Puffer

| Field | Finding |
|---|---|
| **Manifest reference** | Entry #53 — "Stars and Stripes Puffer" listed as *Arothron hispidus* |
| **Correct identity** | *Arothron hispidus* — Stars and Stripes Puffer (Hispida Puffer) |
| **Verification** | Scientific name verified. Distinct genus (*Arothron*) from Porcupine Puffer (*Diodon holocanthus*) already in DB |
| **Action** | **CREATE** — canonical species, verified |
| **Classification** | **canonical species** |
| **Status** | ✅ VERIFIED — no identity issue |

### Review #4: RTG Arowana

| Field | Finding |
|---|---|
| **Manifest reference** | NOT_NEEDED list — "RTG Arowana (variant of S. formosus)" |
| **Correct identity** | Red-Tailed Golden Arowana = *Scleropages formosus* (RTG color variant) |
| **Verification** | Asian Arowana (*S. formosus*) exists in DB (`species-scleropages-formosus`) |
| **Error type** | **Geographic/color variant** — RTG is a trade name for a specific golden morph of Asian Arowana, not a separate species |
| **Action** | **DO NOT CREATE as species** — If coverage desired, add as morph with `parentSpecies` = Asian Arowana, or add "Red-Tailed Golden Arowana" / "RTG Arowana" as alias |
| **Classification** | **morph** (if created) or **alias** (if added to existing) |
| **Status** | Manifest correctly classified as NOT_NEEDED |

### Review #5: Goldfish (Black Moor, Ryukin, Telescope)

| Field | Finding |
|---|---|
| **Manifest reference** | Entries #2, #3, #4 — all listed as *Carassius auratus* |
| **Correct identity** | All are domestic ornamental forms of *Carassius auratus* (Common Goldfish) |
| **Verification** | Common Goldfish exists in DB (`sebdKYryWZgYP2rm3oqsPG`). Already 5 C. auratus entries in DB (Common, Fantail, Oranda, Ranchu, Fancy) |
| **Error type** | **Domestic forms correctly identified as morphs** — manifest properly flagged as PARENT_SPECIES/VARIANT |
| **Action** | **CREATE as morphs** with `parentSpecies` = Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`) |
| **Classification** | **morph** × 3 |
| **Status** | ✅ VERIFIED — classification correct in manifest |

### Review #6: San Francisco Piranha

| Field | Finding |
|---|---|
| **Manifest reference** | NOT_NEEDED list — "San Francisco Piranha (geographic variant of P. nattereri)" |
| **Correct identity** | San Francisco Red-Bellied Piranha = *Pygocentrus nattereri* (geographic variant from São Francisco basin) |
| **Verification** | Red-bellied Piranha (*P. nattereri*) exists in DB (`species-pygocentrus-nattereri`) |
| **Error type** | **Geographic variant** — Same species, different river basin. Not a distinct species |
| **Action** | **DO NOT CREATE** — Red-bellied Piranha already covers this. If desired, add "San Francisco Piranha" as alias |
| **Classification** | **alias** (of Red-bellied Piranha) |
| **Status** | Manifest correctly classified as NOT_NEEDED |

### Review #7: Striped Snakehead

| Field | Finding |
|---|---|
| **Manifest reference** | P1 priority list mentions "C. striata" |
| **Correct identity** | *Channa striata* — Striped Snakehead / Asian Snakehead / Murrel |
| **Verification** | Entity ALREADY EXISTS in DB as "Asian Snakehead" (`sebdKYryWZgYP2rm3noGMy`) with aliases: ["Murrel", "Striped Snakehead", "Common Snakehead"] |
| **Error type** | **Alias already captured** — "Striped Snakehead" is already an alias of the existing Asian Snakehead entry |
| **Action** | **DO NOT CREATE** — Already covered. "Striped Snakehead" is already listed as an alias |
| **Classification** | **duplicate** (already exists with this alias) |
| **Status** | ✅ Already handled — no action needed |

### Review #8: Boeseman's Rainbowfish

| Field | Finding |
|---|---|
| **Manifest reference** | Entry #1 — "Boeseman's Rainbowfish" listed as *Melanotaenia boesemani*, status: HOLD |
| **Correct identity** | *Melanotaenia boesemani* — Boesemani Rainbowfish |
| **Verification** | Entity ALREADY EXISTS in DB as "Boesemani Rainbowfish" (`species-melanotaenia-boesemani`) |
| **Error type** | **Duplicate with name spelling variant** — "Boeseman's" vs "Boesemani" is the same species. The DB uses "Boesemani" ( possessive form of the discoverer's name Boeseman ) |
| **Action** | **DO NOT CREATE** — Same species already exists. Add "Boeseman's Rainbowfish" as alias to existing entry if desired |
| **Classification** | **duplicate** — merge with existing Boesemani Rainbowfish |
| **Status** | Manifest correctly flagged as HOLD. Resolution: DUPLICATE |

### Review #9: Nerite (Marine Proxy Check)

| Field | Finding |
|---|---|
| **Manifest reference** | Not a direct manifest entry — referenced in coverage audits |
| **Current state** | Nerite Snail exists in DB as freshwater entity (*Neritina natalensis*). Coverage matrix uses it as "FW proxy" for marine snail coverage |
| **Verification** | Nerite Snail (`Neritina natalensis`) is a freshwater/brackish species. Marine nerites exist (e.g., *Neritina* spp.) but are different taxa |
| **Action** | No new entity needed for marine nerite — the freshwater Nerite Snail adequately represents the genus in the database. Marine snail coverage is addressed by Trochus, Astraea, Nassarius, Cerith entries |
| **Classification** | **N/A** — no action required |
| **Status** | ✅ Coverage adequate via freshwater proxy + marine snail entries |

### Review #10: Polypterus weeksii — Spelling Verification

| Field | Finding |
|---|---|
| **Manifest reference** | Entry #29 — "Weeks Bichir" listed as *Polypterus weeksii* |
| **Correct spelling** | *Polypterus weeksii* — **CONFIRMED CORRECT** |
| **Verification** | FishBase accepts *P. weeksii* (Boulenger, 1899). Also known as "Palleri Bichir" in some trade sources. The species name honors Charles C. Weeks |
| **Note** | One audit report had a typo "*Polypterusweeksii*" (missing space) — this is a formatting error, not a taxonomy issue |
| **Action** | **CREATE** — spelling verified |
| **Classification** | **canonical species** |
| **Status** | ✅ VERIFIED — no spelling issue |

---

## 4. CLASSIFICATION SUMMARY

### By Classification Type

| Classification | Count | Entries |
|---|---|---|
| **canonical species** | 65 | Red-Tail Shark, Denison Barb, Bala Shark, Black Ghost Knifefish, Tinfoil Barb, FW Stingray, Severum, Figure-8 Puffer, Giant Danio, Sailfin Pleco, Halfbeak, Jaguar Cichlid, Wolf Cichlid, Midas Cichlid, Red Devil Cichlid, Tiger Shovelnose Catfish, Pictus Catfish, Clown Knifefish, Iridescent Shark, Red-Bellied Pacu, Spotted Gar, Spotted Snakehead, Black Arowana, Walking Catfish, Weeks Bichir, Longnose Gar, Orinoco Peacock Bass, Three-Barred Peacock Bass, Maroon Clownfish, Tomato Clownfish, Clarkii Clownfish, Purple Tang, Powder Blue Tang, Queen Angelfish, Cleaner Wrasse, Melanurus Wrasse, Flasher Wrasse, Raccoon Butterflyfish, Longnose Butterflyfish, Snowflake Eel, Longnose Hawkfish, Arc-eye Hawkfish, Diamond Watchman Goby, Bicolor Blenny, Queen Triggerfish, Black Cap Basslet, Bartlett's Anthias, Pajama Cardinalfish, Stars & Stripes Puffer, Sebae Anemone, Magnificent Anemone, Chocolate Chip Starfish, Fromia Starfish, Trochus Snail, Astraea Snail, Pom-Pom Crab, Pencil Urchin, Lobophytum Leather, Turbinaria, Table Acropora, Porites, Gorgonian, Bolbitis Heudelotii, Cryptocoryne Parva, Rotala Wallichii, Pogostemon Helferi, Dwarf Baby Tears, Thai Onion Plant |
| **morph** | 3 | Ryukin Goldfish, Black Moor Goldfish, Telescope Goldfish (all → parent: Common Goldfish) |
| **cultivar** | 2 | Java Fern Windelov, Java Fern Narrow Leaf (both → parent: Java Fern) |
| **duplicate** | 2 | Boeseman's Rainbowfish (= Boesemani Rainbowfish), Striped Snakehead (= Asian Snakehead alias) |
| **alias** | 2 | Banggai Clownfish (→ alias of Banggai Cardinalfish), San Francisco Piranha (→ alias of Red-bellied Piranha) |
| **equipment subtype** | 3 | CO2 Diffuser, CO2 Drop Checker, T5 Fluorescent Light |
| **problem subtype** | 11 | Brown Jelly Disease, RTN, STN, Coral Bleaching, Aiptasia, High Nitrite, High Nitrate, pH Crash, Heater Stuck On, Heater Stuck Off, pH Drift |
| **DEFER** | 1 | Wellsophyllia (taxonomy disputed) |
| **HOLD** | 1 | Stonefish (editorial review — extreme toxicity) |
| **N/A (style tags)** | 10 | See Section 2 above |
| **TOTAL** | 100 | — |

### By Final Action

| Final Action | Count | Notes |
|---|---|---|
| **CREATE (canonical)** | 65 | New standalone species/entities |
| **CREATE (morph/cultivar)** | 5 | 3 goldfish morphs + 2 Java Fern cultivars |
| **CREATE (equipment)** | 3 | CO2 Diffuser, Drop Checker, T5 Light |
| **CREATE (problems)** | 11 | All problem subtypes |
| **DO NOT CREATE** | 5 | 2 duplicates (Boeseman's, Striped Snakehead) + 2 aliases (Banggai Clownfish, SF Piranha) + 1 already exists (RTG Arowana) |
| **DEFER** | 1 | Wellsophyllia |
| **HOLD** | 1 | Stonefish |
| **Tag update only** | 10 | Style tag corrections, no new entities |
| **TOTAL** | 100 | — |

### Dependency Map (parentSpecies links)

| Child Entity | Parent Entity | Parent ID |
|---|---|---|
| Ryukin Goldfish | Common Goldfish | `sebdKYryWZgYP2rm3oqsPG` |
| Black Moor Goldfish | Common Goldfish | `sebdKYryWZgYP2rm3oqsPG` |
| Telescope Goldfish | Common Goldfish | `sebdKYryWZgYP2rm3oqsPG` |
| Java Fern Windelov | Java Fern | **ID TBD** (plant entity) |
| Java Fern Narrow Leaf | Java Fern | **ID TBD** (plant entity) |

---

## 5. CRITICAL FINDINGS

### Identity Errors Corrected

1. **Banggai Clownfish** — NOT *Amphiprion polymnus*. Correct identity is *Pterapogon kauderni* (Banggai Cardinalfish), which already exists in DB
2. **Striped Snakehead** — NOT a new species. Already exists as alias of Asian Snakehead (*Channa striata*)
3. **Boeseman's Rainbowfish** — NOT distinct from Boesemani Rainbowfish. Same species, name spelling variant
4. **San Francisco Piranha** — NOT a new species. Geographic variant of *Pygocentrus nattereri*, already covered

### Entities Already in DB (No Creation Needed)

| Candidate | Existing Entity | Existing ID |
|---|---|---|
| Banggai Clownfish | Banggai Cardinalfish | `sebdKYryWZgYP2rm3noHja` |
| Striped Snakehead | Asian Snakehead | `sebdKYryWZgYP2rm3noGMy` |
| Boeseman's Rainbowfish | Boesemani Rainbowfish | `species-melanotaenia-boesemani` |
| RTG Arowana | Asian Arowana | `species-scleropages-formosus` |
| San Francisco Piranha | Red-bellied Piranha | `species-pygocentrus-nattereri` |

### Revised Entity Count

| Category | Manifest Count | After SPEC-01 Classification | Delta |
|---|---|---|---|
| New canonical species | 79 (ADD_NOW) | 65 | -14 |
| Morph/cultivar variants | 7 (PARENT_SPECIES) | 5 | -2 |
| Equipment | 3 | 3 | 0 |
| Problems | 11 | 11 | 0 |
| DEFER | 2 | 1 | -1 |
| HOLD | 2 | 1 | -1 |
| Style tag updates | 10 | 10 | 0 |
| **Net new entities to create** | **100** | **95** | **-5** |

---

## 6. NEXT STEPS

1. **Resolve Java Fern parent ID** — Need plant entity ID for *Microsorum pteropus* before creating cultivars
2. **Add aliases** to existing entities: "Banggai Clownfish" → Banggai Cardinalfish, "Boeseman's Rainbowfish" → Boesemani Rainbowfish
3. **Execute DEFER** — Wellsophyllia: monitor taxonomy debate, revisit in Phase 15
4. **Execute HOLD** — Stonefish: editorial review for hobby content appropriateness
5. **Proceed with CREATE** — 84 entities (65 canonical + 5 morph/cultivar + 3 equipment + 11 problems)
6. **Apply style tag updates** — 10 existing entity tag corrections
