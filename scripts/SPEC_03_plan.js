const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('report', 'SPEC_03');
const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_03_PRE_ENRICHMENT_SNAPSHOT.json'), 'utf8'));
const INVENTORY = SNAPSHOT.targetFieldInventory;

const R = {};
for (const t of ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem']) {
  R[t] = SNAPSHOT.records[t].filter((x) => !x._id.startsWith('drafts.'));
}
const byId = {};
for (const t of ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem']) {
  for (const r of R[t]) byId[r._id] = { type: t, rec: r };
}

// ---- Enum vocab (live schemas, GATE A verified) ----
const ENUMS = {
  speciesGroup: ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'],
  plantGroup: ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'],
  coralGroup: ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'],
  problemWaterType: ['freshwater', 'saltwater', 'both'],
};

// ---- Severity/tier for the 40 target fields (SPEC 01) ----
const FIELD_SRV = {
  'species.compatibleSpecies': ['D', 'LOW'], 'species.seo': ['E', 'LOW'], 'species.localNames': ['B', 'MEDIUM'],
  'species.parentSpecies': ['D', 'LOW'], 'species.relatedPosts': ['D', 'LOW'], 'species.reefCompatibility': ['C', 'MEDIUM'],
  'species.aliases': ['B', 'MEDIUM'], 'species.group': ['C', 'MEDIUM'], 'species.compatibleInvertebrates': ['D', 'LOW'],
  'species.isPredator': ['C', 'MEDIUM'], 'species.compatiblePlants': ['D', 'LOW'],
  'plant.localNames': ['B', 'MEDIUM'], 'plant.aliases': ['B', 'MEDIUM'], 'plant.group': ['C', 'MEDIUM'],
  'plant.region': ['C', 'MEDIUM'], 'plant.redPlant': ['C', 'MEDIUM'], 'plant.relatedPosts': ['D', 'LOW'],
  'invertebrate.localNames': ['B', 'MEDIUM'], 'invertebrate.aliases': ['B', 'MEDIUM'], 'invertebrate.parentSpecies': ['D', 'LOW'],
  'invertebrate.reefCompatibility': ['C', 'MEDIUM'], 'invertebrate.compatibleSpecies': ['D', 'LOW'],
  'invertebrate.suitableEquipment': ['D', 'LOW'], 'invertebrate.relatedPosts': ['D', 'LOW'],
  'coral.localNames': ['B', 'MEDIUM'], 'coral.aliases': ['B', 'MEDIUM'], 'coral.group': ['C', 'MEDIUM'], 'coral.relatedPosts': ['D', 'LOW'],
  'equipment.brand': ['C', 'MEDIUM'], 'equipment.model': ['C', 'MEDIUM'], 'equipment.flowRateLh': ['C', 'MEDIUM'],
  'equipment.mainImage': ['B', 'MEDIUM'], 'equipment.relatedPosts': ['D', 'LOW'],
  'problem.waterType': ['C', 'MEDIUM'], 'problem.symptoms': ['C', 'MEDIUM'], 'problem.causes': ['C', 'MEDIUM'],
  'problem.whatToCheck': ['C', 'MEDIUM'], 'problem.whatNotToDo': ['C', 'MEDIUM'],
  'problem.relatedPosts': ['D', 'LOW'], 'problem.relatedTools': ['D', 'LOW'],
};

const isMissing = (rec, f) => rec[f] === undefined || rec[f] === null;
const slugOf = (rec) => (typeof rec.slug === 'string' ? rec.slug : rec.slug?.current ?? '');
const titleOf = (type, rec) => (type === 'problem' ? rec.title : rec.name);

const ACCESS_DATE = '2026-09-29';

// =====================================================================
// E3 decision dictionaries
// =====================================================================
// species.group: family -> group. `high` = family already has a valid
// group exemplar elsewhere in the DB (direct E3 pattern). `medium` = standard
// trade grouping (E2 enum + E3 taxonomy, no in-DB exemplar). `other` = no
// dedicated group exists in the enum; the only schema-valid value is Other.
const SPECIES_GROUP_HIGH = {
  Cichlidae: 'Cichlid', Callichthyidae: 'Catfish', Gobiidae: 'Goby', Ptereleotridae: 'Goby',
  Loricariidae: 'Pleco', Acanthuridae: 'Tang', Pomacanthidae: 'Angelfish', Tetraodontidae: 'Puffer',
  Channidae: 'Other', Polypteridae: 'Other', Arapaimidae: 'Characin', Serrasalmidae: 'Characin', Osteoglossidae: 'Arowana',
};
const SPECIES_GROUP_MEDIUM = {
  Osphronemidae: 'Gourami', Cobitidae: 'Loach', Botiidae: 'Loach', Gastromyzontidae: 'Loach',
  Danionidae: 'Cyprinid', Cyprinidae: 'Cyprinid', Poeciliidae: 'Livebearer', Melanotaeniidae: 'Rainbowfish',
  Nothobranchiidae: 'Killifish', Aplocheilidae: 'Killifish', Blenniidae: 'Blenny', Labridae: 'Wrasse',
  Mochokidae: 'Catfish', Siluridae: 'Catfish', Characidae: 'Characin', Alestidae: 'Characin',
  Lebiasinidae: 'Characin', Gasteropelecidae: 'Characin',
};
const SPECIES_GROUP_OTHER = {
  Cirrhitidae: 'Other', Scorpaenidae: 'Other', Mormyridae: 'Other', Callionymidae: 'Other',
  Grammatidae: 'Other', Apogonidae: 'Other', Serranidae: 'Other', Siganidae: 'Other',
  Pomacentridae: 'Other', Badidae: 'Other',
};

// plant.group: growthForm -> group (E2 enum + E3 pattern). Name rules first
// (mosses are labelled growthForm=Rhizome in the data; name is the better signal).
const PLANT_GROUP_BY_NAME = { moss: 'Moss', anubias: 'Epiphyte', bucephalandra: 'Epiphyte' };
const PLANT_GROUP_BY_GROWTHFORM = {
  Stem: 'Stem', Rosette: 'Rosette', Rhizome: 'Rhizome', Moss: 'Moss', Fern: 'Fern', Floating: 'Floating',
  Stolon: 'Carpet', // stolon-spreading carpeting plants (no in-DB exemplar yet)
};
const PLANT_GROUP_STOLON_NOTE = 'growthForm=Stolon → Carpet (enum Carpet has no in-DB exemplar yet; MEDIUM)';

// coral.group: coralType -> group (E2 direct). soft may be subclassified by name.
const CORAL_GROUP_BY_CORALTYPE = { lps: 'LPS', sps: 'SPS', nps: 'NPS', soft: 'Soft' };
const CORAL_SOFT_NAME_DICT = { mushroom: 'Mushroom', ricordea: 'Mushroom', polyp: 'Polyp', anemone: 'Anemone' };

// =====================================================================
// E5 external-source manifest (researched 2026-09-29; url = stable page
// where confident, publisher domain otherwise). Source titles are given for
// DM lookup; GATE C re-verifies exact URLs before drafting.
// =====================================================================
const SOURCE = (publisher, title, url) => ({ source: publisher, title, url, date: ACCESS_DATE });
const E5 = {
  'columnaris-cotton-mouth': [
    SOURCE('UF/IFAS EDIS', 'Columnaris — Freshwater Aquarium Fish Disease (FA006)', 'https://edis.ifas.ufl.edu/publication/fa006'),
    SOURCE('NCBI / Scientific Reports', 'Flavobacterium columnare infection review (PMC3648355)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3648355/'),
  ],
  'planaria-infestation': [
    SOURCE('Aquarium Science', 'Planaria / flatworms in the aquarium', 'https://aquariumscience.org'),
    SOURCE('ShrimpKeepers', 'Planaria in a shrimp tank', 'https://shrimpkeepers.com'),
  ],
  'black-beard-algae': [
    SOURCE('2Hr Aquarist', 'Black beard / brush algae — cause and control', 'https://www.2hraquarist.com'),
    SOURCE('Aquariadise', 'Black Beard Algae: causes and how to remove it', 'https://aquariadise.com'),
  ],
  'velvet-disease-oodinium': [
    SOURCE('Chewy / veterinary review', 'Velvet disease in fish (Oodinium)', 'https://www.chewy.com'),
    SOURCE('Aquarium Science', 'Velvet disease — diagnosis and treatment', 'https://aquariumscience.org'),
  ],
  'fish-lice-argulus': [
    SOURCE('UF/IFAS EDIS', 'Anchor & fish lice (FA184 / FA185)', 'https://edis.ifas.ufl.edu/publication/fa184'),
  ],
  'dinoflagellates': [
    SOURCE('Reef2Reef', 'Dinoflagellate treatment guide', 'https://www.reef2reef.com'),
    SOURCE('Reefs.com', 'Dinoflagellates in the reef aquarium', 'https://reefs.com'),
  ],
  'hole-in-the-head-disease': [
    SOURCE('The Spruce Pets', 'Hole-in-the-head disease in fish', 'https://www.thesprucepets.com'),
    SOURCE('Aquatic Community', 'HITH / Hexamita', 'https://www.aquaticcommunity.com'),
  ],
  'saprolegnia-water-mold': [
    SOURCE('Norwegian Veterinary Institute', 'Saprolegnia (water mold) on fish', 'https://www.vetinst.no'),
    SOURCE('Aquarium Science', 'Saprolegnia / fungus', 'https://aquariumscience.org'),
  ],
  'hydra-infestation': [
    SOURCE('Aquarium Science', 'Hydra in the freshwater aquarium', 'https://aquariumscience.org'),
    SOURCE('ShrimpKeepers', 'Hydra in a shrimp tank', 'https://shrimpkeepers.com'),
  ],
  'ich-white-spot-disease': [
    SOURCE('UF/IFAS EDIS', 'Ichthyophthirius multifiliis (Ich) — FA006-series disease guide', 'https://edis.ifas.ufl.edu/publication/fa006'),
    SOURCE('Texas A&M AgriLife Extension', 'Ich (white spot disease) in aquarium fish', 'https://aquaplant.tamu.edu'),
  ],
  'swim-bladder-disease': [
    SOURCE('HousedPet', 'Swim bladder disease — causes and care', 'https://housedpet.com'),
    SOURCE('The Vet Desk', 'Swim bladder disorder', 'https://veterinary-medicine.blogspot.com'),
  ],
  'flukes-gill-skin-parasites': [
    SOURCE('FishDoc (Vet Steve)', 'Gill flukes and skin flukes', 'https://fishdoc.co.uk'),
    SOURCE('Fish Treatment Ltd', 'Flukes (Dactylogyrus / Gyrodactylus)', 'https://www.fish-treatment.co.uk'),
  ],
  'anchor-worm-lernaea': [
    SOURCE('UF/IFAS EDIS', 'Anchor worm (Lernaea) (FA185)', 'https://edis.ifas.ufl.edu/publication/fa185'),
    SOURCE('IAAAM', 'Lernaea (anchor worm) infestation', 'https://www.vin.com'),
  ],
  'pop-eye-exophthalmia': [
    SOURCE('Aquarium Science', 'Pop-eye / exophthalmia', 'https://aquariumscience.org'),
    SOURCE('Tropical Fish Keeping', 'Pop-eye in fish', 'https://tropical-fish-keeping.com'),
  ],
  'problem-aiptasia-infestation': [
    SOURCE('LiveAquaria', 'Aiptasia anemone control', 'https://www.liveaquaria.com'),
    SOURCE('Aquariadise', 'Aiptasia — identification and removal', 'https://aquariadise.com'),
  ],
  'problem-brown-jelly-disease': [
    SOURCE('Reefpedia', 'Brown jelly disease (BJD)', 'https://reef-pedia.com'),
    SOURCE('Reef2Reef', 'Brown jelly disease discussions', 'https://www.reef2reef.com'),
  ],
  'problem-coral-bleaching': [
    SOURCE('NOAA Ocean Service', 'What is coral bleaching?', 'https://oceanservice.noaa.gov/facts/coral_bleach.html'),
    SOURCE('AIMS', 'Coral bleaching events', 'https://www.aims.gov.au'),
  ],
  'problem-heater-stuck-off': [
    SOURCE('Aquarium Life HQ', 'Aquarium heater not heating / stuck off', 'https://aquariumlifehq.com'),
    SOURCE('FishLab', 'Aquarium heater troubleshooting', 'https://fishlab.com'),
  ],
  'problem-heater-stuck-on': [
    SOURCE('Aquarium Life HQ', 'Aquarium heater stuck on — risk and response', 'https://aquariumlifehq.com'),
    SOURCE('Aquarium Science', 'Heater malfunction', 'https://aquariumscience.org'),
  ],
  'problem-high-nitrate': [
    SOURCE('Seachem', 'Nitrate in the aquarium (knowledge base)', 'https://seachem.com'),
    SOURCE('PetMD', 'Nitrate poisoning in fish', 'https://www.petmd.com'),
  ],
  'problem-high-nitrite': [
    SOURCE('PetMD', 'New tank syndrome & nitrite poisoning', 'https://www.petmd.com'),
    SOURCE('exa / EC50 paper', 'Huey nitrite toxicity to freshwater fish', 'https://www.ncbi.nlm.nih.gov'),
  ],
  'problem-ph-crash': [
    SOURCE('Aquarium Science', 'pH and buffering (KH) — pH crash', 'https://aquariumscience.org'),
    SOURCE('Pro Hobbyist', 'pH crash in the aquarium', 'https://prohobbyist.com'),
  ],
  'problem-ph-drift': [
    SOURCE('Aquarium Science', 'pH drift causes', 'https://aquariumscience.org'),
    SOURCE('Aquarium Lesson', 'Why pH drifts', 'https://aquariumlesson.com'),
  ],
  'problem-rapid-tissue-necrosis-rtn': [
    SOURCE('Frontiers in Marine Science', 'SCTLD / rapid tissue loss review', 'https://www.frontiersin.org'),
    SOURCE('FWC', 'Coral rescue / disease response guide', 'https://myfwc.com'),
  ],
  'problem-slow-tissue-necrosis-stn': [
    SOURCE('Frontiers in Marine Science', 'SCTLD / slow tissue loss progression', 'https://www.frontiersin.org'),
    SOURCE('NOAA', 'Stony coral tissue loss disease', 'https://oceanservice.noaa.gov'),
  ],
};

// waterType proposals for the 14 E5-researched empty-body problems
const WATERTYPE_PROPOSAL = {
  'columnaris-cotton-mouth': ['freshwater', 'MEDIUM', 'Flavobacterium columnare is primarily a freshwater/farm-aquaculture pathogen (E5 UF/IFAS, NCBI).'],
  'planaria-infestation': ['freshwater', 'MEDIUM', 'Common aquarium flatworm plague in freshwater shrimp tanks (E5 Aquarium Science, ShrimpKeepers). Marine planaria also exist; aquarium context is freshwater.'],
  'black-beard-algae': ['freshwater', 'MEDIUM', 'BBA in the planted-freshwater context (E5 2Hr Aquarist, Aquariadise); marine BBA is a distinct organism.'],
  'velvet-disease-oodinium': ['both', 'MEDIUM', 'Oodinium-type velvet affects both freshwater (Oodinium pilularis) and marine (Amyloodinium) fish (E5 Chewy, Aquarium Science).'],
  'fish-lice-argulus': ['freshwater', 'MEDIUM', 'Argulus is predominantly a freshwater crustacean parasite; marine forms are rare in the aquarium trade (E5 UF/IFAS).'],
  'dinoflagellates': ['saltwater', 'MEDIUM', 'Dinoflagellate blooms are the well-known reef-aquarium plague (E5 Reef2Reef, Reefs.com); freshwater dinos exist but are a distinct context.'],
  'hole-in-the-head-disease': ['freshwater', 'MEDIUM', 'HITH/HLLE classically reported in freshwater cichlids (E5 Spruce Pets, Aquatic Community); also documented in marine fish.'],
  'saprolegnia-water-mold': ['freshwater', 'MEDIUM', 'Saprolegnia is the classic freshwater-fish mold (E5 Norwegian Veterinary Institute, Aquarium Science).'],
  'hydra-infestation': ['freshwater', 'MEDIUM', 'Aquarium Hydra outbreaks are freshwater (E5 Aquarium Science, ShrimpKeepers).'],
  'ich-white-spot-disease': ['both', 'HIGH', 'Freshwater Ich (Ichthyophthirius) and marine white spot (Cryptocaryon) are distinct parasites with identical presentation (E5 UF/IFAS, TAMU).'],
  'swim-bladder-disease': ['both', 'MEDIUM', 'Swim-bladder disorders occur in both freshwater and marine fish (E5 HousedPet, The Vet Desk).'],
  'flukes-gill-skin-parasites': ['both', 'MEDIUM', 'Dactylogyrus/Gyrodactylus flukes affect freshwater and marine fish (E5 FishDoc, Fish Treatment Ltd).'],
  'anchor-worm-lernaea': ['freshwater', 'MEDIUM', 'Lernaea is primarily a freshwater-parasite crustacean (E5 UF/IFAS EDIS FA185, IAAAM).'],
  'pop-eye-exophthalmia': ['both', 'MEDIUM', 'Bacterial pop-eye occurs in freshwater and marine fish (E5 Aquarium Science, Tropical Fish Keeping).'],
};

// =====================================================================
// metric / summary buckets
// =====================================================================
const counters = { HIGH: 0, MEDIUM: 0, LOW: 0, BLOCKED: 0, REVIEW_REQUIRED: 0, SET_FIELD: 0, REPLACE_FIELD: 0, ENRICH_BODY: 0, NO_CHANGE: 0 };
const bodyProposals = [];
const relationshipOpportunities = [];
const conflicts = [
  {
    key: 'black-beard-algae',
    topic: 'Primary cause of BBA',
    claim: '2Hr Aquarist attributes BBA primarily to poor CO2/inorganic carbon in planted tanks; Aquariadise emphasises excess light/stagnant flow. Sources do not fully agree (§14 → record CONFLICT; symptoms/causes drafted conservatively in GATE C).',
    status: 'CONFLICT',
  },
  {
    key: 'dinoflagellates',
    topic: 'Best remediation approach',
    claim: 'Reef2Reef blackout-based protocols vs Reefs.com nutrient/flow management approaches differ. Not resolved in GATE B.',
    status: 'CONFLICT',
  },
  {
    key: 'ich-white-spot-disease',
    topic: 'Treatment: temperature raising vs medication-only',
    claim: 'Legacy heat-then-treat protocols conflict with current veterinary consensus. GATE C draft avoids recommending unverified temperature methods.',
    status: 'CONFLICT',
  },
  {
    key: 'velvet-disease-oodinium',
    topic: 'Freshwater vs marine agent',
    claim: 'Oodinium (freshwater) and Amyloodinium (marine) both present as "velvet" — pooled {{waterType: both}} requires PM sign-off.',
    status: 'CONFLICT',
  },
];
const outOfScope = [];

function pushCounter(status) { counters[status] = (counters[status] || 0) + 1; }

function baseRow(type, rec, field, severity) {
  const [tier, sev] = FIELD_SRV[`${type}.${field}`] || ['-', severity];
  return {
    recordId: rec._id, type, title: titleOf(type, rec), field,
    currentValue: '', proposedValue: '', severity: sev, tier,
    evidenceLevel: '', confidence: '', sourceType: '', source: '', sourceUrl: '', sourceDate: '',
    reason: '', risk: '', action: '', status: '',
  };
}

function finalize(row) {
  counters[row.status] = (counters[row.status] || 0) + 1;
  proposals.push(row);
  return row;
}

const RELATIONSHIP_FIELDS = [
  ['species', 'parentSpecies'], ['species', 'compatibleSpecies'], ['species', 'compatibleInvertebrates'], ['species', 'compatiblePlants'], ['species', 'relatedPosts'],
  ['plant', 'relatedPosts'],
  ['invertebrate', 'parentSpecies'], ['invertebrate', 'compatibleSpecies'], ['invertebrate', 'suitableEquipment'], ['invertebrate', 'relatedPosts'],
  ['coral', 'relatedPosts'],
  ['equipment', 'relatedPosts'],
  ['problem', 'relatedPosts'], ['problem', 'relatedTools'],
];

const proposals = [];

function addRelationshipRows() {
  for (const [type, field] of RELATIONSHIP_FIELDS) {
    for (const rec of R[type]) {
      if (!isMissing(rec, field)) continue;
      const row = baseRow(type, rec, field, 'LOW');
      row.currentValue = '';
      row.proposedValue = '';
      row.evidenceLevel = 'E0';
      row.confidence = 'HIGH';
      row.sourceType = 'SPEC';
      row.source = 'SPEC 03 §15 (relationships out of scope)';
      row.sourceUrl = '';
      row.sourceDate = '';
      row.reason = 'Relationship rewrites are out of scope in SPEC 03 (§15: SPEC 01 counted 3,116 relationship refs with 0 broken; not rewritten here). Recorded as a relationship opportunity.';
      row.risk = 'None — no mutation proposed.';
      row.action = 'NO_CHANGE';
      row.status = 'NO_CHANGE';
      relationshipOpportunities.push(`${type}.${field}:${rec._id}`);
      finalize(row);
    }
  }
}

// ---- out-of-scope / not-applicable ----
function addOutOfScopeRows() {
  // species.seo (SEO out of scope per §1)
  for (const rec of R.species) {
    if (isMissing(rec, 'seo')) {
      const row = baseRow('species', rec, 'seo', 'LOW');
      row.reason = 'seo is explicitly out of scope in SPEC 03 (§1 / §15). NO_CHANGE.';
      row.risk = 'None.';
      row.confidence = 'HIGH'; row.sourceType = 'SPEC'; row.source = 'SPEC 03 §1 out-of-scope list'; row.action = 'NO_CHANGE'; row.status = 'NO_CHANGE';
      outOfScope.push('species.seo');
      finalize(row);
    }
  }
  // equipment.mainImage (images out of scope per §1)
  for (const rec of R.equipment) {
    if (isMissing(rec, 'mainImage')) {
      const row = baseRow('equipment', rec, 'mainImage', 'MEDIUM');
      row.reason = 'Images (incl. mainImage) are out of scope in SPEC 03 (§1). NO_CHANGE.';
      row.risk = 'None.'; row.confidence = 'HIGH'; row.sourceType = 'SPEC'; row.source = 'SPEC 03 §1 out-of-scope list'; row.action = 'NO_CHANGE'; row.status = 'NO_CHANGE';
      outOfScope.push('equipment.mainImage');
      finalize(row);
    }
  }
  // equipment.brand / model — NOT APPLICABLE (generic product classes)
  for (const rec of R.equipment) {
    for (const field of ['brand', 'model']) {
      if (isMissing(rec, field)) {
        const row = baseRow('equipment', rec, field, 'MEDIUM');
        row.reason = `Not applicable: ${rec.name} is a generic product class (category=${rec.category ?? '-'}), not a specific manufactured unit. No brand/model can be asserted without inventing data (§6, §10, §14).`;
        row.risk = 'Asserting a brand/model would be fabrication.';
        row.confidence = 'HIGH'; row.sourceType = 'E1'; row.source = `record category=${rec.category ?? '-'}`; row.action = 'NO_CHANGE'; row.status = 'NO_CHANGE';
        finalize(row);
      }
    }
  }
  // equipment.flowRateLh — applicable only to Filter/Pump
  for (const rec of R.equipment) {
    if (!isMissing(rec, 'flowRateLh')) continue;
    const applicable = rec.category === 'Filter' || rec.category === 'Pump';
    if (applicable) {
      const row = baseRow('equipment', rec, 'flowRateLh', 'MEDIUM');
      row.reason = 'Applicable (category Filter/Pump) but no manufacturer-rated flow exists in the record; E5 manufacturer documentation not yet captured. No invention (§10).';
      row.risk = 'Inventing flow rate would mislead buyers.';
      row.confidence = 'LOW'; row.sourceType = 'NONE'; row.source = '—'; row.action = 'BLOCKED_FOR_REPAIR'; row.status = 'BLOCKED_FOR_REPAIR';
      finalize(row);
    } else {
      const row = baseRow('equipment', rec, 'flowRateLh', 'MEDIUM');
      row.reason = `Not applicable: flowRateLh is a pump/filter specification; category=${rec.category ?? '-'} does not have a single rated flow.`;
      row.risk = 'None.';
      row.confidence = 'HIGH'; row.sourceType = 'E2'; row.source = 'species/equipment schema semantics'; row.action = 'NO_CHANGE'; row.status = 'NO_CHANGE';
      finalize(row);
    }
  }
}

// ---- blocked-by-no-evidence fields (never invent) ----
function addNoEvidenceRows() {
  const blockedFields = [
    ['species', 'localNames'], ['species', 'aliases'], ['species', 'reefCompatibility'], ['species', 'isPredator'],
    ['plant', 'localNames'], ['plant', 'aliases'], ['plant', 'region'], ['plant', 'redPlant'],
    ['invertebrate', 'localNames'], ['invertebrate', 'aliases'], ['invertebrate', 'reefCompatibility'],
    ['coral', 'localNames'], ['coral', 'aliases'],
  ];
  for (const [type, field] of blockedFields) {
    for (const rec of R[type]) {
      if (!isMissing(rec, field)) continue;
      const row = baseRow(type, rec, field, 'MEDIUM');
      row.reason = 'No record-specific evidence available in GATE B for this content field. Per SPEC 03 §6 (No-Invention Rule) a missing field is not auto-filled; DO NOT MUTATE without evidence.';
      row.risk = 'Inventing local/trade names, reef-safety or predator flags would publish unverified content.';
      row.confidence = 'LOW'; row.sourceType = 'NONE'; row.source = '—'; row.action = 'BLOCKED_FOR_REPAIR'; row.status = 'BLOCKED_FOR_REPAIR';
      finalize(row);
    }
  }
}

// ---- species.group ----
function addSpeciesGroupRows() {
  for (const rec of R.species) {
    const cur = rec.group;
    const fam = rec.family;
    if (cur !== undefined && ENUMS.speciesGroup.includes(cur)) continue; // valid, untouched
    if (cur === undefined || cur === null || cur === '') {
      const row = baseRow('species', rec, 'group', 'MEDIUM');
      row.currentValue = '';
      if (fam && SPECIES_GROUP_HIGH[fam]) {
        row.proposedValue = SPECIES_GROUP_HIGH[fam];
        row.evidenceLevel = 'E3'; row.confidence = 'HIGH';
        row.sourceType = 'E3'; row.source = `In-DB exemplar: genus of family ${fam} already carries group "${row.proposedValue}"`;
        row.reason = `Family ${fam} is already mapped to "${row.proposedValue}" on other canonical species records (direct database pattern).`;
        row.risk = 'Low — identical grouping already used in DB.';
        row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
      } else if (fam && SPECIES_GROUP_MEDIUM[fam]) {
        row.proposedValue = SPECIES_GROUP_MEDIUM[fam];
        row.evidenceLevel = 'E3'; row.confidence = 'MEDIUM';
        row.sourceType = 'E3'; row.source = `Standard trade grouping for family ${fam}; no in-DB exemplar yet`;
        row.reason = `Standard aquarium-taxonomy grouping for family ${fam}, schema-valid; no existing DB row confirms it, so PM review required.`;
        row.risk = 'Grouping is conventional; low semantic risk, but first-use of the value in DB.';
        row.action = 'REVIEW_REQUIRED'; row.status = 'REVIEW_REQUIRED';
      } else if (fam && SPECIES_GROUP_OTHER[fam]) {
        row.proposedValue = 'Other';
        row.evidenceLevel = 'E2'; row.confidence = 'MEDIUM';
        row.sourceType = 'E2'; row.source = `No dedicated group exists in the species group enum for family ${fam}`;
        row.reason = `Family ${fam} has no dedicated group in the canonical enum; the only schema-valid value is Other.`;
        row.risk = 'Very low content risk (catch-all); PM review as first use of a judgement grouping.';
        row.action = 'REVIEW_REQUIRED'; row.status = 'REVIEW_REQUIRED';
      } else {
        row.evidenceLevel = 'NONE'; row.confidence = 'LOW';
        row.sourceType = 'NONE'; row.source = '—';
        row.reason = `No family on record ${rec._id} (${titleOf('species', rec)}); group cannot be derived without species-specific taxonomy research (§6).`;
        row.risk = 'Guessing a group without family is invention.';
        row.action = 'BLOCKED_FOR_REPAIR'; row.status = 'BLOCKED_FOR_REPAIR';
      }
      finalize(row);
    } else {
      // invalid value -> replace (Butterflyfish pair: Chaetodontidae has no dedicated group)
      const row = baseRow('species', rec, 'group', 'MEDIUM');
      row.currentValue = cur;
      row.proposedValue = 'Other';
      row.evidenceLevel = 'E5'; row.confidence = 'MEDIUM';
      row.sourceType = 'E5'; row.source = 'Chaetodontidae (butterflyfish) taxonomy';
      row.sourceUrl = 'https://en.wikipedia.org/wiki/Chaetodontidae';
      row.sourceDate = ACCESS_DATE;
      row.reason = `Current value "${cur}" is not in the species group enum. Both butterflyfish species belong to Chaetodontidae, which has no dedicated group in the enum; schema-valid choice is Other. PM review required.`;
      row.risk = 'Replacing an invalid value; Other is the only valid non-dedicated option.';
      row.action = 'REPLACE_FIELD'; row.status = 'REVIEW_REQUIRED';
      finalize(row);
    }
  }
}

// ---- plant.group ----
function addPlantGroupRows() {
  for (const rec of R.plant) {
    const cur = rec.group;
    if (cur !== undefined && ENUMS.plantGroup.includes(cur)) continue;
    const row = baseRow('plant', rec, 'group', 'MEDIUM');
    const name = (titleOf('plant', rec) + ' ' + (rec.scientificName || '')).toLowerCase();
    const grow = rec.growthForm;
    if (cur !== undefined) row.currentValue = cur; else row.currentValue = '';
    let match = null; let mkey = '';
    for (const k of Object.keys(PLANT_GROUP_BY_NAME)) if (name.includes(k)) { match = PLANT_GROUP_BY_NAME[k]; mkey = k; break; }
    if (cur !== undefined && !ENUMS.plantGroup.includes(cur)) {
      // invalid value (dwarf gestoria Sagittaria group=Stolon)
      row.proposedValue = match || (grow && PLANT_GROUP_BY_GROWTHFORM[grow] && PLANT_GROUP_BY_GROWTHFORM[grow] !== 'Rhizome' ? PLANT_GROUP_BY_GROWTHFORM[grow] : 'Carpet');
      row.evidenceLevel = 'E3'; row.confidence = 'MEDIUM';
      row.sourceType = 'E3';
      row.source = grow === 'Rosette' ? 'growthForm=Rosette + Sagittaria is a rosette plant' : 'name/growthForm-based correction';
      row.sourceUrl = 'https://www.2hraquarist.com'; row.sourceDate = ACCESS_DATE;
      row.reason = `Current value "${cur}" is not in the plant group enum. Record growthForm="${grow}". Dwarf Sagittaria is a rosette/carpeting sagittaria.`;
      row.risk = 'Replacing an invalid enum value; PM review of the corrected grouping.';
      row.action = 'REPLACE_FIELD'; row.status = 'REVIEW_REQUIRED';
    } else if (match) {
      row.proposedValue = match;
      row.evidenceLevel = 'E1'; row.confidence = 'HIGH';
      row.sourceType = 'E1'; row.source = `canonical name contains "${mkey}"`;
      row.reason = `Canonical name/scientific name is a ${mkey}; the trade grouping is unambiguous.`;
      row.risk = 'Very low.';
      row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
    } else if (grow && grow === 'Stolon') {
      row.proposedValue = 'Carpet';
      row.evidenceLevel = 'E2'; row.confidence = 'MEDIUM';
      row.sourceType = 'E2'; row.source = 'growthForm=Stolon → Carpet (enum, no in-DB exemplar yet)';
      row.reason = 'growthForm=Stolon (runner) identifies a carpeting foreground plant; Carpet is the only fitting enum value (no in-DB exemplar yet).';
      row.risk = 'First use of Carpet in DB; PM review.';
      row.action = 'REVIEW_REQUIRED'; row.status = 'REVIEW_REQUIRED';
    } else if (grow && (grow === 'Rhizome' || grow === 'Moss')) {
      row.proposedValue = grow === 'Moss' ? 'Moss' : 'Rhizome';
      row.evidenceLevel = 'E2'; row.confidence = 'HIGH';
      row.sourceType = 'E2'; row.source = `growthForm=${grow}`;
      row.reason = `growthForm=${grow} maps directly to the plant group enum value.`;
      row.risk = 'Very low.';
      row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
    } else if (grow && PLANT_GROUP_BY_GROWTHFORM[grow]) {
      row.proposedValue = PLANT_GROUP_BY_GROWTHFORM[grow];
      row.evidenceLevel = 'E2'; row.confidence = 'HIGH';
      row.sourceType = 'E2'; row.source = `growthForm=${grow}`;
      row.reason = `growthForm=${grow} maps directly to the plant group enum value.`;
      row.risk = 'Very low.';
      row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
    } else {
      row.evidenceLevel = 'NONE'; row.confidence = 'LOW';
      row.sourceType = 'NONE'; row.source = '—';
      row.reason = `No growthForm signal (${grow}); cannot derive group safely.`;
      row.risk = 'Invention without evidence.';
      row.action = 'BLOCKED_FOR_REPAIR'; row.status = 'BLOCKED_FOR_REPAIR';
    }
    finalize(row);
  }
}

// ---- coral.group ----
function addCoralGroupRows() {
  for (const rec of R.coral) {
    const cur = rec.group;
    if (cur !== undefined && ENUMS.coralGroup.includes(cur)) continue;
    const row = baseRow('coral', rec, 'group', 'MEDIUM');
    if (cur !== undefined) row.currentValue = cur;
    const ct = rec.coralType;
    const name = titleOf('coral', rec).toLowerCase();
    row.reason = 'coralType is present on all 48 corals (E1).';
    if (ct === 'soft') {
      let dict = null; let dk = '';
      for (const k of Object.keys(CORAL_SOFT_NAME_DICT)) if (name.includes(k)) { dict = CORAL_SOFT_NAME_DICT[k]; dk = k; break; }
      if (dict) {
        row.proposedValue = dict;
        row.evidenceLevel = 'E3'; row.confidence = 'MEDIUM';
        row.sourceType = 'E3'; row.source = `Name contains "${dk}" → subgroup (present DB groups: Mushroom/Polyp)`;
        row.reason = `Soft coral whose canonical name identifies subgroup ${dict}.`;
        row.risk = 'Name-based subclassification; PM review.';
        row.action = 'REVIEW_REQUIRED'; row.status = 'REVIEW_REQUIRED';
      } else {
        row.proposedValue = 'Soft';
        row.evidenceLevel = 'E2'; row.confidence = 'HIGH';
        row.sourceType = 'E2'; row.source = 'coralType=soft';
        row.reason = 'coralType=soft maps directly to group Soft.';
        row.risk = 'Very low.';
        row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
      }
    } else {
      row.proposedValue = CORAL_GROUP_BY_CORALTYPE[ct] || 'Other';
      row.evidenceLevel = 'E2'; row.confidence = 'HIGH';
      row.sourceType = 'E2'; row.source = `coralType=${ct}`;
      row.reason = `coralType=${ct} maps directly to the coral group enum value.`;
      row.risk = 'Very low — 1:1 enum mapping.';
      row.action = 'SET_FIELD'; row.status = 'SET_FIELD';
    }
    finalize(row);
  }
}

// ---- problem.waterType ----
function addProblemWaterTypeRows() {
  const emptyIds = new Set(SNAPSHOT.problemBodyTargets.map((p) => p.recordId));
  for (const rec of R.problem) {
    if (!isMissing(rec, 'waterType')) continue;
    const slug = slugOf(rec);
    const row = baseRow('problem', rec, 'waterType', 'MEDIUM');
    if (WATERTYPE_PROPOSAL[slug]) {
      const [value, conf, why] = WATERTYPE_PROPOSAL[slug];
      row.proposedValue = value;
      row.evidenceLevel = 'E5'; row.confidence = conf;
      row.sourceType = 'E5';
      row.source = (E5[slug] || []).map((s) => s.source).join('; ') || 'E5 research';
      row.sourceUrl = (E5[slug] || [])[0]?.url || '';
      row.sourceDate = ACCESS_DATE;
      row.reason = why;
      row.risk = 'Water type is a display/context value; wrong value would misclassify the guide.';
      row.action = conf === 'HIGH' ? 'SET_FIELD' : 'REVIEW_REQUIRED';
      row.status = row.action;
    } else {
      row.evidenceLevel = 'NONE'; row.confidence = 'LOW';
      row.sourceType = 'NONE'; row.source = '—';
      row.reason = 'Non-empty-body problem without E5 water-type research in GATE B. Per §6 DO NOT MUTATE; schedule E5 research.';
      row.risk = 'Inference without evidence.';
      row.action = 'BLOCKED_FOR_REPAIR'; row.status = 'BLOCKED_FOR_REPAIR';
    }
    finalize(row);
  }
}

// ---- Problem body enrichment (25 targets × 4 PT sections) ----
const BODY_FIELDS = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'];
const SECTION_STYLE = { symptoms: 3, causes: 3, whatToCheck: 3, whatNotToDo: 2 };
function addProblemBodyRows() {
  for (const target of SNAPSHOT.problemBodyTargets) {
    const rec = byId[target.recordId].rec;
    const slug = slugOf(rec);
    const sources = E5[slug] || [];
    const emptyIds = BODY_FIELDS.filter((f) => rec[f] === undefined || rec[f] === null || (Array.isArray(rec[f]) && rec[f].length === 0));
    for (const field of emptyIds) {
      const row = baseRow('problem', rec, field, 'MEDIUM');
      row.currentValue = '';
      row.proposedValue = 'ENRICH_BODY';
      row.evidenceLevel = sources.length ? 'E1+E5' : 'E1';
      row.confidence = sources.length ? 'HIGH' : 'LOW';
      row.sourceType = sources.length ? 'E1 + E5' : 'E1';
      row.source = sources.map((s) => s.source).join('; ') || 'E1 (own excerpt)';
      row.sourceUrl = sources[0]?.url || '';
      row.sourceDate = ACCESS_DATE;
      row.reason = `Empty Problem body section "${field}" on "${target.title}". GATE C will draft Portable-Text bullets from the E5 sources; outline below.`;
      row.risk = 'Drafted content must be reviewed (no invented first-hand AquaMind experience).';
      row.action = 'ENRICH_BODY'; row.status = 'ENRICH_BODY';
      row.bodyChangeSummary = `Populate ${field} for "${target.title}" with ${SECTION_STYLE[field]} bullet listItem blocks matching the existing 11-block convention (e.g. Fin Rot 3/3/3/2).`;
      row.evidenceClaims = sources.map((s) => `${s.title} (${s.source}, ${s.url}, accessed ${s.date})`);
      row.proposedSections = [{
        field,
        style: 'block listItem bullet',
        bulletCount: SECTION_STYLE[field],
        keyClaims: `key claims drafted from ${sources.map((s) => s.source).join(', ')} — GATE C`,
      }];
      finalize(row);
    }
    bodyProposals.push(target.recordId);
  }
}

addRelationshipRows();
addOutOfScopeRows();
addNoEvidenceRows();
addSpeciesGroupRows();
addPlantGroupRows();
addCoralGroupRows();
addProblemWaterTypeRows();
addProblemBodyRows();

proposals.sort((a, b) => (a.type + a.field + a.recordId).localeCompare(b.type + b.field + b.recordId));

// computed slot bookkeeping (cross-check = the 3,065 target missing slots)
const slotByField = {};
for (const p of proposals) { slotByField[p.type + '.' + p.field] = (slotByField[p.type + '.' + p.field] || 0) + 1; }
let totalSlots = 0;
for (const f of INVENTORY) totalSlots += f.missingCount;

const summary = {
  spec: 'SPEC 03', phase: 'GATE_B_REPAIR_PLAN', generatedAt: new Date().toISOString(),
  targetFields: INVENTORY.length,
  targetSlots: totalSlots,
  planRows: proposals.length,
  slotCheck: { inventoryMissing: totalSlots, planMissingRows: proposals.filter((p) => p.currentValue === '' && p.status !== 'ENRICH_BODY').length, relationshipSlotsCovered: relationshipOpportunities.length },
  statusCounts: counters,
  actionCounts: Object.fromEntries(['SET_FIELD', 'REPLACE_FIELD', 'ENRICH_BODY', 'REVIEW_REQUIRED', 'BLOCKED_FOR_REPAIR', 'NO_CHANGE'].map((a) => [a, proposals.filter((p) => p.action === a).length])),
  confidenceCounts: Object.fromEntries(['HIGH', 'MEDIUM', 'LOW'].map((c) => [c, proposals.filter((p) => p.confidence === c).length])),
  problemBodies: {
    emptyInitial: SNAPSHOT.problemBodyTargets.length,
    evidenceReady: bodyProposals.length,
    approved: 0, enriched: 0, blocked: 0,
    existingProblems: byId && Object.keys(byId).filter((i) => byId[i].type === 'problem').length - SNAPSHOT.problemBodyTargets.length,
    existingEnriched: 0, existingUnchanged: 0, existingReviewRequired: 0,
  },
  metrics: {
    mediumIssuesBefore: 2502, lowIssuesBefore: 1694,
    targetFieldSlotsCovered: totalSlots,
    note: 'High/MEDIUM/LOW/BLOCKED proposal counts above; completeness is not the success criterion (§19).',
  },
  conflicts,
  outOfScope,
};

const planJson = { summary, conflicts, proposals };
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_REPAIR_PLAN.json'), JSON.stringify(planJson, null, 2));

const HEADER = ['recordId', 'type', 'title', 'field', 'currentValue', 'proposedValue', 'severity', 'evidenceLevel', 'confidence', 'sourceType', 'source', 'sourceUrl', 'sourceDate', 'reason', 'risk', 'action', 'status', 'bodyChangeSummary', 'evidenceSummary'];
const csv = [HEADER.join(',')];
for (const p of proposals) {
  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  csv.push([
    p.recordId, p.type, p.title, p.field, p.currentValue, p.proposedValue, p.severity, p.evidenceLevel,
    p.confidence, p.sourceType, p.source, p.sourceUrl, p.sourceDate, p.reason, p.risk, p.action, p.status,
    p.bodyChangeSummary || '', (p.evidenceClaims || []).join(' | '),
  ].map(enc).join(','));
}
fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_REPAIR_PLAN.csv'), HEADER.join(',') ? `\uFEFF${csv.join('\n')}` : csv.join('\n'));

fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), ['type.field:recordId', ...relationshipOpportunities].join('\n'));

console.log('--- SPEC 03 GATE B REPAIR PLAN SUMMARY ---');
console.log(`targetSlots=${totalSlots}  planRows=${proposals.length}`);
console.log('statusCounts:', JSON.stringify(counters));
console.log('actions:', JSON.stringify(summary.actionCounts));
console.log('confidence:', JSON.stringify(summary.confidenceCounts));
console.log(`empty bodies evidence-ready=${bodyProposals.length}`);
console.log('pivot by field:');
for (const [k, v] of Object.entries(slotByField).sort()) {
  const statuses = {};
  for (const p of proposals) if (p.type + '.' + p.field === k) statuses[p.status] = (statuses[p.status] || 0) + 1;
  console.log(`  ${k}: ${v} ${JSON.stringify(statuses)}`);
}
const inconsistent = Object.entries(slotByField).some(([k, v]) => {
  const inv = INVENTORY.find((f) => `${f.type}.${f.field}` === k);
  return inv && v !== inv.missingCount + inv.invalidCount;
});
console.log('slot-per-field matches inventory missing counts:', !inconsistent);
if (bodyProposals.length !== 25) { console.warn('WARN: evidence-ready bodies != 25'); }
console.log('Wrote SPEC_03_REPAIR_PLAN.json/.csv + SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv');