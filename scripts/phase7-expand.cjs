const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

const SPECIES = [
  { name: 'Common Goldfish', scientificName: 'Carassius auratus', slug: 'carassius-auratus', waterType: 'freshwater', region: 'East Asia', difficulty: 'Beginner', tankSizeMinL: 75, tempMinC: 18, tempMaxC: 24, phMin: 6.5, phMax: 7.5, sizeCm: 30, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community', 'Pond / Outdoor'], excerpt: 'The classic goldfish. Hardy, peaceful, and one of the most recognized aquarium fish worldwide. Needs more space than commonly assumed.' },
  { name: 'Fantail Goldfish', scientificName: 'Carassius auratus', slug: 'fantail-goldfish', waterType: 'freshwater', region: 'East Asia', difficulty: 'Beginner', tankSizeMinL: 75, tempMinC: 18, tempMaxC: 24, phMin: 6.5, phMax: 7.5, sizeCm: 20, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community', 'Pond / Outdoor'], excerpt: 'A popular fancy goldfish variety with a distinctive double tail. Graceful swimmer that needs clean, cool water.' },
  { name: 'Oranda Goldfish', scientificName: 'Carassius auratus', slug: 'oranda-goldfish', waterType: 'freshwater', region: 'East Asia', difficulty: 'Intermediate', tankSizeMinL: 75, tempMinC: 18, tempMaxC: 24, phMin: 6.5, phMax: 7.5, sizeCm: 25, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community'], excerpt: 'Fancy goldfish with a distinctive head growth (wen). Elegant and popular, requires slightly more care than common goldfish.' },
  { name: 'Ranchu Goldfish', scientificName: 'Carassius auratus', slug: 'ranchu-goldfish', waterType: 'freshwater', region: 'East Asia', difficulty: 'Intermediate', tankSizeMinL: 75, tempMinC: 18, tempMaxC: 24, phMin: 6.5, phMax: 7.5, sizeCm: 20, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community'], excerpt: 'The King of Goldfish in Japan. A dorsal-less fancy variety with a rounded body and gentle disposition.' },
  { name: 'Hatchetfish', scientificName: 'Gasteropelecus sternicla', slug: 'gasteropelecus-sternicla', waterType: 'freshwater', region: 'South America', difficulty: 'Intermediate', tankSizeMinL: 60, tempMinC: 23, tempMaxC: 28, phMin: 6, phMax: 7.5, sizeCm: 6.5, temperament: 'Peaceful', diet: 'Carnivore', isPredator: false, aquariumStyle: ['Community', 'Planted'], excerpt: 'A surface-dwelling fish with a distinctive hatchet-shaped body. Can leap from the water to catch insects. Needs a tight-fitting lid.' },
  { name: 'Golden Pencilfish', scientificName: 'Nannostomus beckfordi', slug: 'nannostomus-beckfordi', waterType: 'freshwater', region: 'South America', difficulty: 'Intermediate', tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 5.5, phMax: 7.5, sizeCm: 6, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community', 'Planted'], excerpt: 'An elegant, slender fish with a distinctive horizontal stripe. Peaceful schooling fish for planted tanks with soft, acidic water.' },
  { name: 'Dwarf Pencilfish', scientificName: 'Nannostomus marginatus', slug: 'nannostomus-marginatus', waterType: 'freshwater', region: 'South America', difficulty: 'Intermediate', tankSizeMinL: 40, tempMinC: 23, tempMaxC: 27, phMin: 5, phMax: 7, sizeCm: 3.5, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community', 'Planted', 'Betta / Nano'], excerpt: 'One of the smallest pencilfish. Peaceful nano species for soft, acidic planted tanks. Best kept in schools.' },
  { name: 'Dwarf Snakehead', scientificName: 'Channa barca', slug: 'channa-barca', waterType: 'freshwater', region: 'South Asia', difficulty: 'Advanced', tankSizeMinL: 200, tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 7.5, sizeCm: 20, temperament: 'Aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Predator'], excerpt: 'A small but striking snakehead with blue-green markings. Air-breathing predator that needs a secure lid and species-only tank.' },
  { name: 'Pike Cichlid', scientificName: 'Crenicichla compressiceps', slug: 'crenicichla-compressiceps', waterType: 'freshwater', region: 'South America', difficulty: 'Advanced', tankSizeMinL: 150, tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7, sizeCm: 25, temperament: 'Aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Predator'], excerpt: 'A slender, elongated predatory cichlid from South America. Fast, agile hunter that needs plenty of swimming space.' },
  { name: 'Peacock Bass', scientificName: 'Cichla ocellaris', slug: 'cichla-ocellaris', waterType: 'freshwater', region: 'South America', difficulty: 'Advanced', tankSizeMinL: 300, tempMinC: 24, tempMaxC: 30, phMin: 6, phMax: 7.5, sizeCm: 40, temperament: 'Aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Predator', 'Large Fish'], excerpt: 'A large, powerful predatory cichlid with a distinctive eyespot on the tail. Requires a very large tank and robust filtration.' },
  { name: 'Dwarf Lionfish', scientificName: 'Dendrochirus brachypterus', slug: 'dendrochirus-brachypterus', waterType: 'saltwater', region: 'Marine Indo-Pacific', difficulty: 'Intermediate', tankSizeMinL: 150, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, sizeCm: 20, temperament: 'Semi-aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Marine Predator', 'Mixed Reef'], excerpt: 'A smaller, more manageable lionfish with venomous spines. Striking appearance with flowing fins. May eat small fish and shrimp.' },
  { name: 'Marine Betta', scientificName: 'Cephalopholis argus', slug: 'cephalopholis-argus', waterType: 'saltwater', region: 'Marine Indo-Pacific', difficulty: 'Intermediate', tankSizeMinL: 150, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, sizeCm: 25, temperament: 'Semi-aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Marine Predator', 'Mixed Reef'], excerpt: 'A colorful marine grouper with blue spots. Shy but predatory. May eat smaller tank mates. Needs hiding spots.' },
  { name: 'Copperband Butterflyfish', scientificName: 'Chelmon rostratus', slug: 'chelmon-rostratus', waterType: 'saltwater', region: 'Marine Indo-Pacific', difficulty: 'Advanced', tankSizeMinL: 150, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, sizeCm: 15, temperament: 'Peaceful', diet: 'Carnivore', isPredator: false, aquariumStyle: ['Mixed Reef', 'Fish Only'], reefCompatibility: true, excerpt: 'A striking butterflyfish with a long snout for picking food from crevices. Beautiful but difficult to keep. May nip at corals.' },
  { name: 'Clown Triggerfish', scientificName: 'Balistoides conspicillum', slug: 'balistoides-conspicillum', waterType: 'saltwater', region: 'Marine Indo-Pacific', difficulty: 'Advanced', tankSizeMinL: 300, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, sizeCm: 50, temperament: 'Aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Marine Predator', 'Fish Only'], excerpt: 'A large, striking triggerfish with bold patterns. Powerful jaws can crush shells. May rearrange decorations and eat tank mates.' },
  { name: 'Zebra Moray Eel', scientificName: 'Gymnomuraena zebra', slug: 'gymnomuraena-zebra', waterType: 'saltwater', region: 'Marine Indo-Pacific', difficulty: 'Intermediate', tankSizeMinL: 200, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, sizeCm: 100, temperament: 'Semi-aggressive', diet: 'Carnivore', isPredator: true, aquariumStyle: ['Marine Predator', 'Fish Only'], excerpt: 'A large eel with striking black-and-white stripes. Generally peaceful toward fish too large to eat. Needs plenty of hiding spots.' },
  { name: 'Koi', scientificName: 'Cyprinus rubrofuscus', slug: 'cyprinus-rubrofuscus', waterType: 'freshwater', region: 'East Asia', difficulty: 'Beginner', tankSizeMinL: 200, tempMinC: 2, tempMaxC: 30, phMin: 6.5, phMax: 8.5, sizeCm: 90, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Pond / Outdoor', 'Large Fish'], excerpt: 'Ornamental carp bred for color and pattern. Hardy and long-lived. Primarily a pond fish but can be kept in very large indoor tanks.' },
  { name: 'Molly', scientificName: 'Poecilia sphenops', slug: 'poecilia-sphenops', waterType: 'freshwater', region: 'Central America', difficulty: 'Beginner', tankSizeMinL: 60, tempMinC: 22, tempMaxC: 28, phMin: 7, phMax: 8.5, sizeCm: 10, temperament: 'Peaceful', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community', 'Betta / Nano'], excerpt: 'A hardy livebearer available in many colors. Tolerates a wide range of water conditions. Breeds readily in captivity.' },
  { name: 'Paradise Fish', scientificName: 'Macropodus opercularis', slug: 'macropodus-opercularis', waterType: 'freshwater', region: 'East Asia', difficulty: 'Beginner', tankSizeMinL: 60, tempMinC: 15, tempMaxC: 25, phMin: 6, phMax: 8, sizeCm: 12, temperament: 'Semi-aggressive', diet: 'Carnivore', isPredator: false, aquariumStyle: ['Community'], excerpt: 'A hardy labyrinth fish that tolerates cooler temperatures. Colorful with flowing fins. Males can be territorial. Good for unheated tanks.' },
  { name: 'Australian Redclaw Crayfish', scientificName: 'Cherax quadricarinatus', slug: 'cherax-quadricarinatus', waterType: 'freshwater', region: 'Australia / Oceania', difficulty: 'Intermediate', tankSizeMinL: 80, tempMinC: 18, tempMaxC: 28, phMin: 6.5, phMax: 8, sizeCm: 25, temperament: 'Semi-aggressive', diet: 'Omnivore', isPredator: false, aquariumStyle: ['Community'], excerpt: 'A large, colorful freshwater crayfish. Hardy and active. Will eat plants and may catch slow fish. Best kept alone or with fast tank mates.' },
]

const PLANTS = [
  { name: 'Rotala Macrandra', scientificName: 'Rotala macrandra', slug: 'rotala-macrandra', waterType: 'freshwater', difficulty: 'Advanced', light: 'High', co2: 'Medium', growthForm: 'Stem', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], redPlant: true, excerpt: 'A stunning red stem plant that demands high light and CO₂. One of the most vibrant red plants for aquascaping.' },
  { name: 'Ludwigia Red', scientificName: 'Ludwigia palustris', slug: 'ludwigia-palustris', waterType: 'freshwater', difficulty: 'Intermediate', light: 'Medium-High', co2: 'Low', growthForm: 'Stem', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], redPlant: true, excerpt: 'A versatile red stem plant. Turns red under high light. Easier than Rotala Macrandra but still needs good lighting.' },
  { name: 'Alternanthera Reineckii Mini', scientificName: 'Alternanthera reineckii Mini', slug: 'alternanthera-reineckii-mini', waterType: 'freshwater', difficulty: 'Intermediate', light: 'High', co2: 'Low', growthForm: 'Stem', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], redPlant: true, excerpt: 'A compact red plant perfect for foreground/midground. Needs high light to maintain its red coloration.' },
  { name: 'Scarlet Temple', scientificName: 'Alternanthera reineckii Rosanervig', slug: 'scarlet-temple', waterType: 'freshwater', difficulty: 'Intermediate', light: 'High', co2: 'Low', growthForm: 'Stem', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], redPlant: true, excerpt: 'A variety of Alternanthera with vibrant red-pink leaves. Striking accent plant for high-tech setups.' },
  { name: 'Java Moss', scientificName: 'Taxiphyllum barbieri', slug: 'java-moss', waterType: 'freshwater', difficulty: 'Beginner', light: 'Low', co2: 'None', growthForm: 'Moss', aquariumStyle: ['Low-Tech', 'Aquascaping', 'Betta / Nano', 'Shrimp'], excerpt: 'The most popular aquarium moss. Extremely hardy and versatile. Attaches to driftwood and rocks. Great for shrimp tanks.' },
  { name: 'Christmas Moss', scientificName: 'Vesicularia ferriei', slug: 'christmas-moss', waterType: 'freshwater', difficulty: 'Beginner', light: 'Low-Medium', co2: 'None', growthForm: 'Moss', aquariumStyle: ['Low-Tech', 'Aquascaping', 'Shrimp'], excerpt: 'A beautiful moss with triangular branching that resembles a Christmas tree. Slightly more structured than Java Moss.' },
  { name: 'Weeping Moss', scientificName: 'Vesicularia ferriei', slug: 'weeping-moss', waterType: 'freshwater', difficulty: 'Beginner', light: 'Low-Medium', co2: 'None', growthForm: 'Moss', aquariumStyle: ['Low-Tech', 'Aquascaping', 'Shrimp'], excerpt: 'A moss that grows downward in a weeping pattern. Creates a dramatic cascading effect on driftwood and rocks.' },
  { name: 'Monte Carlo', scientificName: 'Micranthemum tweediei', slug: 'micranthemum-tweediei', waterType: 'freshwater', difficulty: 'Intermediate', light: 'High', co2: 'Medium', growthForm: 'Carpet', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], excerpt: 'A popular carpet plant that forms a dense, low-growing mat. Needs high light and CO₂ for best results.' },
  { name: 'Dwarf Sagittaria', scientificName: 'Sagittaria subulata', slug: 'sagittaria-subulata', waterType: 'freshwater', difficulty: 'Beginner', light: 'Medium', co2: 'None', growthForm: 'Carpet', aquariumStyle: ['Low-Tech', 'Community', 'Shrimp'], excerpt: 'A hardy carpet plant that spreads via runners. Tolerates a wide range of conditions. Good foreground plant for beginners.' },
  { name: 'Glossostigma', scientificName: 'Glossostigma elatinoides', slug: 'glossostigma-ela-tinoides', waterType: 'freshwater', difficulty: 'Advanced', light: 'High', co2: 'Medium', growthForm: 'Carpet', aquariumStyle: ['High-Tech / CO2', 'Aquascaping'], excerpt: 'One of the smallest aquarium plants. Forms an extremely low, dense carpet. Demands high light and CO₂.' },
  { name: 'Bucephalandra', scientificName: 'Bucephalandra sp.', slug: 'bucephalandra', waterType: 'freshwater', difficulty: 'Beginner', light: 'Low', co2: 'None', growthForm: 'Rhizome', aquariumStyle: ['Low-Tech', 'Aquascaping', 'Shrimp'], excerpt: 'A diverse genus of epiphytic plants from Borneo. Attaches to wood and rocks. Slow-growing and very hardy.' },
  { name: 'Water Sprite', scientificName: 'Ceratopteris thalictroides', slug: 'ceratopteris-thalictroides', waterType: 'freshwater', difficulty: 'Beginner', light: 'Low-Medium', co2: 'None', growthForm: 'Floating', aquariumStyle: ['Low-Tech', 'Community', 'Betta / Nano'], excerpt: 'A fast-growing floating plant with delicate, lacy leaves. Excellent for absorbing excess nutrients. Can also be planted.' },
]

const CORALS = [
  { name: 'Acan Lord', scientificName: 'Acanthastrea lordhowensis', slug: 'acanthastrea-lordhowensis', coralType: 'lps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['LPS Reef', 'Mixed Reef'], excerpt: 'A popular LPS coral with vivid, fleshy polyps. Available in many colors. Moderate care requirements.' },
  { name: 'Chalice Coral', scientificName: 'Echinophyllia sp.', slug: 'echinophyllia', coralType: 'lps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['LPS Reef', 'Mixed Reef'], excerpt: 'A stunning plating LPS coral with vibrant colors. Available in many morphs. Moderate light and flow.' },
  { name: 'Scolymia', scientificName: 'Scolymia lacera', slug: 'scolymia-lacera', coralType: 'lps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['LPS Reef', 'Mixed Reef'], excerpt: 'A large, solitary LPS coral with vivid fleshy polyps. One polyp per skeleton. Popular for its vibrant colors.' },
  { name: 'Open Brain Coral', scientificName: 'Trachyphyllia geoffroyi', slug: 'trachyphyllia-geoffroyi', coralType: 'lps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'Low-Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['LPS Reef', 'Mixed Reef'], excerpt: 'A classic LPS coral with a large, folded polyp. Best placed on the sand bed. Moderate care.' },
  { name: 'Pocillopora', scientificName: 'Pocillopora damicornis', slug: 'pocillopora-damicornis', coralType: 'sps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'High', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['SPS Reef', 'Mixed Reef'], excerpt: 'A branching SPS coral also known as Cauliflower Coral. Relatively hardy for an SPS. Good for beginner SPS keepers.' },
  { name: 'Cat\'s Paw Coral', scientificName: 'Stylophora pistillata', slug: 'stylophora-pistillata', coralType: 'sps', waterType: 'saltwater', difficulty: 'Intermediate', light: 'High', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['SPS Reef', 'Mixed Reef'], excerpt: 'A branching SPS coral with rounded tips. Hardy and fast-growing for an SPS. Available in pink, purple, and green.' },
  { name: 'Ricordea Mushroom', scientificName: 'Ricordea florida', slug: 'ricordea-florida', coralType: 'soft', waterType: 'saltwater', difficulty: 'Beginner', light: 'Low-Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['Soft Coral Reef', 'Mixed Reef'], excerpt: 'A colorful mushroom coral with a bumpy texture. Available in many vibrant colors. Easy to keep and propagate.' },
  { name: 'Sinularia', scientificName: 'Sinularia sp.', slug: 'sinularia', coralType: 'soft', waterType: 'saltwater', difficulty: 'Beginner', light: 'Moderate', photosynthetic: true, reefCompatibility: true, aquariumStyle: ['Soft Coral Reef', 'Mixed Reef'], excerpt: 'A leather coral with finger-like projections. Hardy and fast-growing. Can release terpenes that irritate other corals.' },
]

const INVERTEBRATES = [
  { name: 'Sulawesi Red Cherry Shrimp', scientificName: 'Caridina dennerli', slug: 'caridina-dennerli', waterType: 'freshwater', difficulty: 'Intermediate', region: 'East Asia', group: 'shrimp', aquariumStyle: ['Community', 'Shrimp'], excerpt: 'A striking red shrimp from Lake Matano in Sulawesi. Requires warm, alkaline water. More challenging than Neocaridina.' },
  { name: 'Sulawesi Cardinal Shrimp', scientificName: 'Caridina omnipos', slug: 'caridina-omnipos', waterType: 'freshwater', difficulty: 'Intermediate', region: 'East Asia', group: 'shrimp', aquariumStyle: ['Community', 'Shrimp'], excerpt: 'A small, colorful shrimp from Sulawesi lakes. Red body with white markings. Needs warm, hard water.' },
  { name: 'Blue Tiger Shrimp', scientificName: 'Caridina sp.', slug: 'blue-tiger-shrimp', waterType: 'freshwater', difficulty: 'Intermediate', region: 'East Asia', group: 'shrimp', aquariumStyle: ['Community', 'Shrimp'], excerpt: 'A striking blue shrimp with orange eyes. A selectively bred Caridina variety. Needs soft, acidic water.' },
  { name: 'Rabbit Snail', scientificName: 'Tylomelania sp.', slug: 'tylomelania', waterType: 'freshwater', difficulty: 'Intermediate', region: 'East Asia', group: 'snail', aquariumStyle: ['Community', 'Shrimp'], excerpt: 'A large, cone-shaped snail from Sulawesi. Available in many colors. Needs warm, hard water. Slow breeder.' },
  { name: 'Brittle Star', scientificName: 'Ophiocoma sp.', slug: 'ophiocoma', waterType: 'saltwater', difficulty: 'Beginner', region: 'Marine Indo-Pacific', group: 'starfish', aquariumStyle: ['Mixed Reef', 'Invertebrate-focused'], reefCompatibility: true, excerpt: 'A reef-safe detritivore that hides in live rock. Excellent cleanup crew member. Mostly nocturnal.' },
  { name: 'Sea Cucumber', scientificName: 'Holothuria sp.', slug: 'holothuria', waterType: 'saltwater', difficulty: 'Intermediate', region: 'Marine Indo-Pacific', group: 'worm', aquariumStyle: ['Mixed Reef', 'Invertebrate-focused'], reefCompatibility: true, excerpt: 'A detritivore that processes sand and waste. Reef-safe but needs established tank. Can be sensitive to water changes.' },
  { name: 'Cerith Snail', scientificName: 'Cerithium sp.', slug: 'cerithium', waterType: 'saltwater', difficulty: 'Beginner', region: 'Marine Indo-Pacific', group: 'snail', aquariumStyle: ['Mixed Reef', 'Invertebrate-focused'], reefCompatibility: true, excerpt: 'A small, useful cleanup crew snail. Burrows in sand, consumes algae and detritus. Hardy and reef-safe.' },
  { name: 'Sexy Anemone Shrimp', scientificName: 'Periclimenes brevicarpalis', slug: 'periclimenes-brevicarpalis', waterType: 'saltwater', difficulty: 'Intermediate', region: 'Marine Indo-Pacific', group: 'shrimp', aquariumStyle: ['Mixed Reef', 'Invertebrate-focused'], reefCompatibility: true, excerpt: 'A small, translucent shrimp that lives on sea anemones. Fascinating symbiotic relationship. Reef-safe.' },
]

const EQUIPMENT = [
  { name: 'Planted LED Light', slug: 'planted-led-light', category: 'Light', group: 'Lighting', aquariumStyle: ['Planted', 'Aquascaping', 'High-Tech / CO2'], excerpt: 'Full-spectrum LED light designed for planted aquariums. Provides optimal wavelengths for plant growth.' },
  { name: 'Reef LED Light', slug: 'reef-led-light', category: 'Light', group: 'Lighting', aquariumStyle: ['Mixed Reef', 'LPS Reef', 'SPS Reef'], excerpt: 'High-output LED light designed for reef corals. Provides blue and white spectrum for coral growth and coloration.' },
  { name: 'Digital Heater', slug: 'digital-heater', category: 'Heater', group: 'Temperature', aquariumStyle: ['Community', 'Planted', 'Mixed Reef'], excerpt: 'Precision digital aquarium heater with electronic thermostat. More accurate than traditional heaters.' },
  { name: 'Aquarium Chiller', slug: 'aquarium-chiller', category: 'Chiller', group: 'Temperature', aquariumStyle: ['Community', 'Planted', 'Mixed Reef'], excerpt: 'Cools aquarium water for species requiring lower temperatures. Essential for coldwater and some marine setups.' },
  { name: 'Protein Skimmer', slug: 'protein-skimmer', category: 'Skimmer', group: 'Marine', aquariumStyle: ['Mixed Reef', 'Fish Only'], excerpt: 'Removes organic waste from marine aquariums before it breaks down. Essential for reef and FOWLR tanks.' },
  { name: 'ATO System', slug: 'ato-system', category: 'ATO', group: 'Marine', aquariumStyle: ['Mixed Reef', 'SPS Reef'], excerpt: 'Automatic Top-Off system that replaces evaporated water with fresh water. Maintains stable salinity in marine tanks.' },
  { name: 'Dosing Pump', slug: 'dosing-pump', category: 'Dosing', group: 'Marine', aquariumStyle: ['Mixed Reef', 'SPS Reef'], excerpt: 'Programmable pump for automatic dosing of supplements, additives, or two-part solutions. Essential for reef tanks.' },
  { name: 'Gravel Vacuum', slug: 'gravel-vacuum', category: 'Maintenance', group: 'Maintenance', aquariumStyle: ['Community', 'Planted', 'Shrimp'], excerpt: 'Essential tool for substrate cleaning during water changes. Removes debris from gravel without disturbing plants.' },
  { name: 'Algae Scraper', slug: 'algae-scraper', category: 'Maintenance', group: 'Maintenance', aquariumStyle: ['Community', 'Planted', 'Mixed Reef'], excerpt: 'Magnetic or handheld tool for removing algae from aquarium glass. Keeps viewing panels clean.' },
  { name: 'Aquasoil Substrate', slug: 'aquasoil-substrate', category: 'Substrate', group: 'Substrate', aquariumStyle: ['Planted', 'High-Tech / CO2', 'Aquascaping'], excerpt: 'Active substrate that lowers pH and provides nutrients for planted tanks. Essential for high-tech aquascaping.' },
]

async function createEntities(type, entities) {
  let created = 0
  let errors = 0

  for (const entity of entities) {
    try {
      const doc = { _type: type, ...entity }
      const result = await client.create(doc)
      created++
      console.log(`  Created ${type}: ${entity.name} (${result._id})`)
    } catch (e) {
      errors++
      console.log(`  ERROR creating ${entity.name}: ${e.message}`)
    }
  }

  return { created, errors }
}

async function main() {
  console.log('=== PHASE 7 ENTITY EXPANSION ===\n')

  let totalCreated = 0
  let totalErrors = 0

  console.log('--- Species (20) ---')
  const speciesResult = await createEntities('species', SPECIES)
  totalCreated += speciesResult.created
  totalErrors += speciesResult.errors

  console.log('\n--- Plants (12) ---')
  const plantsResult = await createEntities('plant', PLANTS)
  totalCreated += plantsResult.created
  totalErrors += plantsResult.errors

  console.log('\n--- Corals (8) ---')
  const coralsResult = await createEntities('coral', CORALS)
  totalCreated += coralsResult.created
  totalErrors += coralsResult.errors

  console.log('\n--- Invertebrates (8) ---')
  const invertsResult = await createEntities('invertebrate', INVERTEBRATES)
  totalCreated += invertsResult.created
  totalErrors += invertsResult.errors

  console.log('\n--- Equipment (10) ---')
  const equipResult = await createEntities('equipment', EQUIPMENT)
  totalCreated += equipResult.created
  totalErrors += equipResult.errors

  console.log(`\n=== TOTAL ===`)
  console.log(`Created: ${totalCreated}`)
  console.log(`Errors: ${totalErrors}`)
}

main().catch(e => { console.error(e); process.exit(1) })
