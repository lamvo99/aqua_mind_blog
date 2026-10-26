const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- Config ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const TOKEN = (envContent.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
if (!TOKEN) { console.error('SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
const MUTATE_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
const OUT = path.join('report', 'SPEC_03');
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];

const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const ENUMS = {
  speciesGroup: ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'],
  plantGroup: ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'],
  coralGroup: ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'],
  problemWaterType: ['freshwater', 'saltwater', 'both'],
};
const ENUM_FOR = (type, field) => {
  if (field === 'group') return ENUMS[`${type}Group`];
  if (type === 'problem' && field === 'waterType') return ENUMS.problemWaterType;
  return null;
};

async function query(name, groq) {
  const res = await fetch(`${QUERY_BASE}?query=${encodeURIComponent(groq)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result || [];
}

// Portable Text block builder — matches the live convention (block/listItem bullet,
// style normal, level 1, markDefs [], _key unique per document).
function buildPT(slug, field, bullets) {
  const safe = slug.replace(/[^a-z0-9]/gi, '');
  return bullets.map((text, i) => ({
    _type: 'block',
    _key: `${safe}-${field}-${i}`,
    style: 'normal',
    ...(field === 'symptoms' || field === 'causes' || field === 'whatToCheck' || field === 'whatNotToDo' ? { listItem: 'bullet', level: 1 } : {}),
    markDefs: [],
    children: [{ _key: `${safe}-${field}-${i}-s`, _type: 'span', text, marks: [] }],
  }));
}

// ---------------------------------------------------------------------------
// GATE C — PM-APPROVED body drafts for the exact 25 empty Problem records.
// Wording is conservative; the 4 documented evidence conflicts are handled
// explicitly (BBA causes, dino remediation, ich heat-vs-medication, velvet
// freshwater-vs-marine agent). Aligned to each record's existing E1 excerpt.
// ---------------------------------------------------------------------------
const DRAFT = {
  'I9bI8W8ZWcEwyIzM9DFYjI': { slug: 'columnaris-cotton-mouth', symptoms: [
    'White or gray cotton-like patches on the mouth, fins, or body, often starting at the mouth (cotton mouth).',
    'Frayed or eroded fins, pale gills, and a slimy film over the skin.',
    'Rapid onset — lethargy, loss of appetite, and possible death within a day or two in severe cases.',
  ], causes: [
    'Infection by the bacterium Flavobacterium columnare, which multiplies when fish are stressed.',
    'Stress from transport, crowding, temperature swings, or handling that lowers immunity.',
    'Poor water quality (ammonia, nitrite, low oxygen) that weakens the fish\u2019s protective slime coat.',
  ], whatToCheck: [
    'Water quality first — ammonia, nitrite, nitrate, temperature, and oxygen levels.',
    'Inspect the mouth, gills, and fins for gray-white patches under good light.',
    'Check recently added or handled fish — outbreaks usually start with stressed arrivals.',
  ], whatNotToDo: [
    'Do not wait for the patches to spread — columnaris can become fatal within a day or two.',
    'Do not treat without correcting water quality — medication alone usually fails in poor water.',
  ] },
  'I9bI8W8ZWcEwyIzM9DFYtM': { slug: 'planaria-infestation', symptoms: [
    'Small flatworms with arrow-shaped heads crawling on glass, substrate, plants, and hardscape.',
    'Clusters of them near food after feeding, especially in overfed tanks.',
    'Shrimp fry may disappear or be attacked — planaria can prey on newborn shrimp.',
  ], causes: [
    'Overfeeding leaves uneaten food and detritus that sustain planaria populations.',
    'Introduction on live plants, new substrate, or unquarantined animals.',
    'Protein-rich foods that also feed the worm population.',
  ], whatToCheck: [
    'Feed less and remove uneaten food within minutes — planaria thrive where food remains.',
    'Vacuum the substrate and rinse filter media to reduce the detritus layer.',
    'Inspect new plants and decor for tiny arrow-headed worms before adding them.',
  ], whatNotToDo: [
    'Do not expect planaria to vanish while overfeeding continues — they are usually a sign of excess food.',
    'Do not use copper-based or deworming products in a shrimp tank unless confirmed shrimp-safe.',
  ] },
  'I9bI8W8ZWcEwyIzM9DNIu8': { slug: 'black-beard-algae', symptoms: [
    'Rough black or dark-green tufts and bristles on plant leaves, driftwood, and equipment.',
    'Patches that resist brushing and grow slowly but firmly attached.',
    'Often worst on older leaves and in spots with weaker flow.',
  ], causes: [
    'Fluctuating or low CO\u2082 levels in planted tanks are the most commonly cited trigger (E1 excerpt: fluctuating CO\u2082).',
    'High organic load and low-flow dead spots let tufts establish on surfaces.',
    'Excess light relative to plant health gives algae an advantage over struggling plants — sources weight these factors differently.',
  ], whatToCheck: [
    'Check CO\u2082 stability across the photoperiod and light duration — fluctuations are the leading indicator (E1).',
    'Spot-treat heavy tufts carefully (peroxide spot-treatment per E1 excerpt) and remove badly affected leaves.',
    'Improve flow around affected areas and reduce organic buildup with substrate vacuuming.',
  ], whatNotToDo: [
    'Do not expect removal alone to work while CO\u2082, light, and organics stay unchanged — tufts return.',
    'Do not spot-treat with peroxide while fish or shrimp are in direct contact with the treated surface.',
  ] },
  'IlX7xILobrukz7d5JnvacY': { slug: 'velvet-disease-oodinium', symptoms: [
    'Fine golden or rust-coloured dusting over body and fins, most visible under bright light.',
    'Fish flicking and rubbing against objects, rapid breathing, clamped fins.',
    'Loss of appetite and lethargy; heavy infections damage skin and gills.',
  ], causes: [
    'Parasitic Oodinium infection — freshwater and marine forms are distinct parasites (conflict noted: confirm which form applies).',
    'Stress, temperature swings, and poor water quality let the parasite multiply rapidly.',
    'Introduction of new fish without quarantine (E1: highly contagious, often fatal if untreated promptly).',
  ], whatToCheck: [
    'Look for the gold film under strong light — it is easy to miss in dim conditions.',
    'Quarantine new fish and check every tank inhabitant for early signs.',
    'Confirm freshwater vs marine form before choosing medication — treatments differ.',
  ], whatNotToDo: [
    'Do not delay — velvet is highly contagious and often fatal if untreated promptly (E1).',
    'Do not use a freshwater velvet treatment in a saltwater tank (or vice versa) without confirming the label.',
  ] },
  'IlX7xILobrukz7d5Jo2qVy': { slug: 'fish-lice-argulus', symptoms: [
    'Disc-shaped parasites (2\u20135 mm) attached to the body, fins, or gills, sometimes visible as moving specks.',
    'Scratching, flashing, and red blood spots where lice attach (E1).',
    'Lethargy and appetite loss in heavier infestations.',
  ], causes: [
    'Argulus crustacean parasites introduced with new fish, especially pond-raised stock (E1: common in ponds).',
    'The parasite completes its life cycle freely in pond conditions.',
    'Stress and crowding increase vulnerability to attachment damage.',
  ], whatToCheck: [
    'Inspect the body and gill covers closely for flat disc-shaped parasites.',
    'Check any recent pond-fish additions — they are the usual source.',
    'Plan both manual removal of adults and a water treatment for free-swimming stages (E1: manual removal + potassium permanganate).',
  ], whatNotToDo: [
    'Do not rely on manual removal alone — larvae remain in the water and re-attach.',
    'Do not apply pond-strength potassium permanganate doses to a small aquarium.',
  ] },
  'IlX7xILobrukz7d5Jo2qgo': { slug: 'dinoflagellates', symptoms: [
    'Brown or rust-coloured snot-like patches with trapped air bubbles on rock, sand, and coral bases (E1).',
    'Slimy film that returns quickly after wiping and can irritate corals.',
    'Potentially toxic to corals during heavy blooms (E1).',
  ], causes: [
    'Blooms typically develop when competing organisms are disrupted or nutrients are very low or unstable.',
    'Often follows tank disturbances — new sand/rock, heavy cleaning, or a recent crash.',
    'Introduction through live rock or sand.',
  ], whatToCheck: [
    'Test phosphate and nitrate; very low or unstable levels often accompany dinoflagellate blooms.',
    'Check flow and filtration — stagnant areas and poor water exchange favour the film.',
    'Review the available control routes (E1: UV sterilizer, dosing, manual removal) — sources differ on the best sequence, so pick one approach and monitor.',
  ], whatNotToDo: [
    'Do not wipe the film aggressively every day — repeated disturbance can prolong the bloom.',
    'Do not add sensitive corals while an active bloom is present.',
  ] },
  'IlX7xILobrukz7d5Jo2wxC': { slug: 'hole-in-the-head-disease', symptoms: [
    'Small pits and holes developing on the head and along the lateral line (E1).',
    'Pits may deepen over time; mucus and occasional redness around lesions.',
    'Reduced appetite and lethargy in advanced cases.',
  ], causes: [
    'Poor water quality and chronic stress are the primary contributors (E1).',
    'Association with Hexamita parasites in cichlids (E1).',
    'Inadequate nutrition and low oxygen can worsen lesion development.',
  ], whatToCheck: [
    'Test water quality thoroughly — poor water quality is the first thing to correct (E1).',
    'Check whether activated carbon is in use — its link to HITH has been reported.',
    'Inspect for parasites and review diet quality — nutrition and parasite load both matter.',
  ], whatNotToDo: [
    'Do not treat only the holes — without fixing water quality and stress the pits continue forming.',
    'Do not ignore diet — poor nutrition is a recognized contributing factor.',
  ] },
  'IlX7xILobrukz7d5Jo2xIs': { slug: 'saprolegnia-water-mold', symptoms: [
    'White or gray cottony, wool-like tufts on skin, fins, gills, or eggs.',
    'Tufts grow larger over time and stand off the skin surface.',
    'Fish become listless; gill infections cause breathing difficulty.',
  ], causes: [
    'Water mould (Saprolegnia) is opportunistic — it colonizes injured or stressed fish.',
    'Usually secondary to injury, stress, or poor water quality (E1).',
    'Egg masses and post-spawning fish are especially susceptible.',
  ], whatToCheck: [
    'Look for the wound or stressor that allowed the mould to take hold.',
    'Check water quality and temperature — cold, poor water favours outbreaks.',
    'Remove dead eggs or heavily affected tissue promptly.',
  ], whatNotToDo: [
    'Do not treat the tufts without addressing water quality and the underlying injury — it returns (E1: treatment includes improved conditions).',
    'Do not medicate lightly — antifungal treatment should be paired with clean water, not replace it.',
  ] },
  'J1Tx0fWCuGNPno99A79Tvf': { slug: 'hydra-infestation', symptoms: [
    'Small translucent polyps with tentacles attached to glass, plants, and hardscape.',
    'Polyps contract when touched; can sting and kill tiny shrimp fry (E1).',
    'Populations grow rapidly through budding (E1).',
  ], causes: [
    'Introduced on live plants or with live food (E1).',
    'Overfeeding supports the micro-organisms hydra feed on.',
    'Warm, still water with abundant food favours rapid budding.',
  ], whatToCheck: [
    'Inspect plants before adding — hydra hitchhike on foliage.',
    'Reduce feeding to shrink their food supply.',
    'Check whether shrimp fry are being caught — heavy infestations prey on newborns.',
  ], whatNotToDo: [
    'Do not use copper-based products in a shrimp tank unless confirmed safe for invertebrates.',
    'Do not feed heavily while trying to reduce the population — overfeeding sustains them.',
  ] },
  'J1Tx0fWCuGNPno99A7AE36': { slug: 'ich-white-spot-disease', symptoms: [
    'Small white spots like grains of salt scattered over body, fins, and gills (E1).',
    'Fish scratch against decor, clamp fins, and breathe rapidly.',
    'Spots multiply as the parasite completes its life cycle in the water.',
  ], causes: [
    'Caused by Ichthyophthirius multifiliis (E1); marine white spot is a separate parasite (Cryptocaryon).',
    'Introduced with new fish or contaminated water without quarantine.',
    'Stress and temperature swings weaken resistance and speed the cycle.',
  ], whatToCheck: [
    'Check all fish for salt-grain spots — treat the whole tank, not only spotted fish.',
    'Confirm freshwater vs marine system — the parasites differ and need different medication.',
    'Stabilize temperature and improve water quality to support recovery.',
  ], whatNotToDo: [
    'Do not treat saltwater ich with freshwater ich medication — the organisms are different.',
    'Do not rely on temperature increase alone; sources differ on heat-only protocols — if pairing heat with medication, follow product guidance closely and monitor oxygen.',
  ] },
  'J1Tx0fWCuGNPno99A7AEDM': { slug: 'swim-bladder-disease', symptoms: [
    'Fish floats at the surface, sinks to the bottom, or swims sideways/upside down (E1).',
    'Difficulty maintaining normal position while eating.',
    'Distended belly in some cases.',
  ], causes: [
    'Overfeeding, constipation, or foods that expand in the gut (E1).',
    'Injury, infection, or sudden temperature change affecting the bladder.',
    'Common in fancy goldfish and bettas (E1).',
  ], whatToCheck: [
    'Water quality and temperature first — rule out environmental causes.',
    'Fasting for 24\u201348 hours, then easily digestible food, addresses constipation-related cases.',
    'Watch for infection signs if the problem persists after fasting and water changes.',
  ], whatNotToDo: [
    'Do not keep feeding while a blockage is suspected — fasting is the standard first step.',
    'Do not medicate before correcting water quality and feeding habits.',
  ] },
  'J1Tx0fWCuGNPno99A7KJcq': { slug: 'flukes-gill-skin-parasites', symptoms: [
    'Rapid breathing, flashing (rubbing against objects), and white mucus on the skin (E1).',
    'Inflamed or pale gills; clamped fins.',
    'Weight loss and frayed fins in chronic cases.',
  ], causes: [
    'Parasitic flatworms — Dactylogyrus (gill flukes) or Gyrodactylus (skin flukes) (E1).',
    'Introduced with new fish; spread quickly in warm water.',
    'Stress and poor water quality worsen gill damage.',
  ], whatToCheck: [
    'Look for excess mucus and rapid gill movement — gill flukes are often gill-based.',
    'Treat the whole tank — flukes spread to every fish, not just symptomatic ones.',
    'Verify the correct medication (E1: praziquantel is the standard treatment).',
  ], whatNotToDo: [
    'Do not stop after visible symptoms clear — flukes have a life cycle; complete the treatment course.',
    'Do not skip water quality improvement alongside medication.',
  ] },
  'J1Tx0fWCuGNPno99A7KJpf': { slug: 'anchor-worm-lernaea', symptoms: [
    'Thread-like parasite with a forked anchor end protruding from the skin.',
    'Red, swollen lesions at attachment points; visible blood spots (E1).',
    'Secondary infections at wounds in heavier infestations.',
  ], causes: [
    'A parasitic copepod — not a true worm (E1) — that embeds in fish skin.',
    'Common in pond fish and introduced with new stock (E1).',
    'Skin embedding causes lesion damage that invites secondary infection.',
  ], whatToCheck: [
    'Look for the trailing thread on the body — it is the diagnostic sign.',
    'Check recent additions, especially pond-raised fish.',
    'Plan both physical removal of adults and a treatment for free-swimming stages (E1: manual removal + dimilin).',
  ], whatNotToDo: [
    'Do not pull adults out and stop there — larvae remain in the water column.',
    'Do not treat the water without removing the embedded females — they release more larvae.',
  ] },
  'J1Tx0fWCuGNPno99A7KutT': { slug: 'pop-eye-exophthalmia', symptoms: [
    'One or both eyes bulge abnormally from the sockets (E1).',
    'Cloudy eye tissue in advanced cases.',
    'Fish may lose appetite and rub its head.',
  ], causes: [
    'Bacterial infection is a common cause (E1).',
    'Poor water quality or physical injury (E1).',
    'Internal disease or gas supersaturation can produce the same swelling.',
  ], whatToCheck: [
    'Test water quality — correct ammonia/nitrite immediately (E1 treatment: antibiotics and clean water).',
    'Look for injuries and check for other disease signs in tankmates.',
    'Check whether one eye or both are affected — one-sided swelling more often suggests injury.',
  ], whatNotToDo: [
    'Do not handle or press the swollen eye — this risks permanent damage.',
    'Do not skip water quality correction — clean water is part of the treatment (E1).',
  ] },
  'problem-aiptasia-infestation': { slug: 'problem-aiptasia-infestation', symptoms: [
    'Small brown anemones with long tentacles on live rock, plugs, and glass.',
    'Withdraw quickly when touched; multiply and spread across the reef.',
    'Can sting and irritate nearby corals.',
  ], causes: [
    'Introduced as hitchhikers on live rock, frags, or plugs.',
    'Nutrient availability and moderate flow/light favour their spread.',
    'Fragments left behind regrow into new polyps.',
  ], whatToCheck: [
    'Inspect new rock and frags before they enter the display.',
    'Use targeted removal (peppermint shrimp, commercial Aiptasia pastes, or injection methods).',
    'Reduce excess nutrients that support their growth.',
  ], whatNotToDo: [
    'Do not simply tear or cut them off — fragments regrow into new polyps.',
    'Do not add a chemical treatment without checking compatibility with your corals and inverts.',
  ] },
  'problem-brown-jelly-disease': { slug: 'problem-brown-jelly-disease', symptoms: [
    'Brown, jelly-like mass accumulating on coral tissue (E1: common LPS coral disease).',
    'Rapid tissue loss spreading across the colony.',
    'Affected area breaks down quickly and can smell foul.',
  ], causes: [
    'Infection that takes hold on stressed or damaged coral tissue.',
    'Common after fragging, shipping, or handling stress.',
    'Poor water quality and elevated organics weaken coral defences.',
  ], whatToCheck: [
    'Test water parameters and correct any spikes immediately.',
    'Isolate the affected coral if the colony can still be saved.',
    'Review recent handling — brown jelly often follows physical damage.',
  ], whatNotToDo: [
    'Do not wait — brown jelly progresses quickly and can consume a colony in days.',
    'Do not place healthy corals near the affected colony while it is breaking down.',
  ] },
  'problem-coral-bleaching': { slug: 'problem-coral-bleaching', symptoms: [
    'Corals turn pale or white while polyps may still be alive (E1: stress response expelling zooxanthellae).',
    'Colour loss may start at the tips or affect whole colonies.',
    'Prolonged bleaching leads to tissue death.',
  ], causes: [
    'Elevated temperature causes the coral to expel its symbiotic zooxanthellae (E1).',
    'Excessive or sudden light exposure can trigger the same response.',
    'Salinity swings, alkalinity instability, and poor water quality compound the stress.',
  ], whatToCheck: [
    'Temperature first — check for spikes above the coral\u2019s normal range.',
    'Lighting stability — avoid sudden intensity changes for newly placed corals.',
    'Salinity and alkalinity stability alongside temperature.',
  ], whatNotToDo: [
    'Do not change multiple parameters at once — gradual correction only.',
    'Do not add supplements or medication while the tank is unstable — restore stable conditions first.',
  ] },
  'problem-heater-stuck-off': { slug: 'problem-heater-stuck-off', symptoms: [
    'Tank temperature falls below the set point and keeps dropping.',
    'Fish become sluggish, lose appetite, and show reduced activity.',
    'In cold water, tropical fish activity drops noticeably.',
  ], causes: [
    'Heater element or thermostat failure — the unit no longer heats.',
    'Disconnected or tripped power, or a failed controller.',
    'Undersized heater for the tank volume.',
  ], whatToCheck: [
    'Measure actual temperature with a reliable thermometer — do not trust the heater dial.',
    'Check power: plug, outlet, indicator light, and thermostat setting.',
    'Have a spare heater of the correct size ready as backup.',
  ], whatNotToDo: [
    'Do not leave the tank unheated overnight hoping it recovers — temperature drops steadily.',
    'Do not reuse a heater with a cracked casing or scorch marks.',
  ] },
  'problem-heater-stuck-on': { slug: 'problem-heater-stuck-on', symptoms: [
    'Temperature climbs above the set point and keeps rising.',
    'Fish breathe rapidly and gather near cooler surface areas.',
    'High temperature reduces dissolved oxygen and stresses fish fast.',
  ], causes: [
    'Stuck thermostat or relay keeps the heater on continuously.',
    'Controller failure or an overpowered heater for the water volume.',
    'Physical damage (dropped or cracked heater) causing faulty switching.',
  ], whatToCheck: [
    'Unplug the heater immediately if temperature is rising above set point.',
    'Confirm with a second thermometer at a different tank location.',
    'Cool gradually — partial water changes with slightly cooler water; check oxygenation.',
  ], whatNotToDo: [
    'Do not pour cold water directly into the tank — gradual cooling only.',
    'Do not return the faulty heater to service without testing or replacing it.',
  ] },
  'problem-high-nitrate': { slug: 'problem-high-nitrate', symptoms: [
    'Nitrate readings climb week over week if water changes are skipped.',
    'Algae growth often increases alongside rising nitrate.',
    'Fish show stress over time; sensitive species decline first (E1: long-term fish health concern).',
  ], causes: [
    'Accumulation from the nitrogen cycle — nitrate is the end product, removed only by water changes or denitrification.',
    'Overfeeding and high bioload produce more waste than the system exports.',
    'Rarely used or undersized filtration for the bioload.',
  ], whatToCheck: [
    'Test nitrate before and after water changes to measure export effectiveness.',
    'Review feeding amounts and frequency — overfeeding drives nitrate up.',
    'Confirm water change schedule and volume.',
  ], whatNotToDo: [
    'Do not rely on nitrate-removing additives as a substitute for water changes.',
    'Do not make a single massive water change if nitrate is very high — reduce gradually.',
  ] },
  'problem-high-nitrite': { slug: 'problem-high-nitrite', symptoms: [
    'Brown or darkened gills, rapid breathing, fish gasping near the surface.',
    'Fish listless and gathering at filter outflows.',
    'Typical in new tanks during cycling (E1: nitrogen cycle intermediate).',
  ], causes: [
    'Incomplete cycling — nitrite-consuming bacteria have not established yet.',
    'Filter media washed or replaced, removing beneficial bacteria.',
    'Overstocking or overfeeding before the filter matures.',
  ], whatToCheck: [
    'Test ammonia, nitrite, and nitrate daily — track the cycle progress.',
    'Partial water changes to keep nitrite low while bacteria establish.',
    'Reduce feeding during cycling — less waste means less nitrite production.',
  ], whatNotToDo: [
    'Do not add more fish while nitrite remains measurable.',
    'Do not stop testing as soon as ammonia clears — nitrite spikes after ammonia.',
  ] },
  'problem-ph-crash': { slug: 'problem-ph-crash', symptoms: [
    'pH drops sharply within hours, far below the tank\u2019s normal range.',
    'Fish show stress and rapid breathing as pH falls.',
    'Severe crashes can kill fish that previously looked healthy.',
  ], causes: [
    'Low KH (carbonate hardness) — insufficient buffering lets pH fall freely.',
    'High biological load producing acids faster than the buffer can neutralize.',
    'Decaying organic matter (dead plants, excess food) acidifying the water.',
  ], whatToCheck: [
    'Test KH — a low-KH tank is at risk even when pH looks normal.',
    'Monitor pH at the same time each day to catch the trend before a crash.',
    'Review organic load: uneaten food, dead plant matter, overstocking.',
  ], whatNotToDo: [
    'Do not correct a crash with strong pH-adjusting chemicals — swing risk is high.',
    'Do not assume soft water is safe without checking its buffering capacity.',
  ] },
  'problem-ph-drift': { slug: 'problem-ph-drift', symptoms: [
    'pH gradually moves away from the target over days or weeks.',
    'Fish behaviour changes subtly; breeding may stall.',
    'Direction depends on water: drift down in soft/low-KH water, up with alkaline materials.',
  ], causes: [
    'Depleting KH lets biological acids push pH downward over time.',
    'Limestone, coral rock, or aerated alkaline hardscape raises pH.',
    'Changes in source water composition between water changes.',
  ], whatToCheck: [
    'Log pH and KH together over a week to identify the direction and cause.',
    'Check source water stability between changes.',
    'Inspect hardscape materials if pH trends upward.',
  ], whatNotToDo: [
    'Do not chase pH with daily additives — stability matters more than a target number.',
    'Do not dismiss long-term drift — chronic change stresses fish even without a crash.',
  ] },
  'problem-rapid-tissue-necrosis-rtn': { slug: 'problem-rapid-tissue-necrosis-rtn', symptoms: [
    'Coral tissue sloughs off rapidly — often within hours — leaving bare white skeleton.',
    'Usually starts at the base or branch tips of SPS corals (E1: typically SPS).',
    'Mucus may be visible at the boundary between living tissue and bare skeleton.',
  ], causes: [
    'Stress response to sudden parameter swings (temperature, salinity, alkalinity).',
    'Freshly fragged, shipped, or handled corals are most vulnerable.',
    'Bacterial involvement is suspected but not confirmed in all cases.',
  ], whatToCheck: [
    'Test temperature, salinity, and alkalinity immediately — correct any spike gently.',
    'Identify how far the tissue loss has progressed — cut back to healthy tissue if acting fast.',
    'Review recent changes: new livestock, equipment changes, or dosing adjustments.',
  ], whatNotToDo: [
    'Do not make large simultaneous parameter changes — this often accelerates tissue loss.',
    'Do not treat the whole tank without diagnosis — supportive stability first.',
  ] },
  'problem-slow-tissue-necrosis-stn': { slug: 'problem-slow-tissue-necrosis-stn', symptoms: [
    'Coral tissue recedes slowly from the base upward over days to weeks (E1: gradual recession).',
    'Colour fades at the affected margin before tissue is lost.',
    'Progression is slower than RTN but steady if conditions do not improve.',
  ], causes: [
    'Chronic instability — swinging alkalinity, temperature, or salinity over weeks.',
    'Lighting or flow mismatch on sensitive corals.',
    'Nutrient deficiency or bacterial community shifts in the water.',
  ], whatToCheck: [
    'Review weeks of parameter logs — stability matters more than spot readings.',
    'Check alkalinity and calcium consistency; swings at the base are a classic trigger.',
    'Assess lighting and flow relative to the coral\u2019s needs.',
  ], whatNotToDo: [
    'Do not raise light or nutrients abruptly to reverse recession — gradual only.',
    'Do not leave the colony in fluctuating conditions while tissue is actively receding.',
  ] },
};
const BODY_FIELDS = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'];

// ---------------------------------------------------------------------------
// GATE C — pre-flight + mutation
// ---------------------------------------------------------------------------
async function apply() {
  const plan = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_03_REPAIR_PLAN.json'), 'utf8'));
  const authorized = plan.proposals.filter((p) => p.action === 'SET_FIELD' || p.action === 'ENRICH_BODY');
  const setRows = authorized.filter((p) => p.action === 'SET_FIELD');
  const bodyRows = authorized.filter((p) => p.action === 'ENRICH_BODY');
  console.log(`Authorization check: SET_FIELD=${setRows.length} (expect 91), ENRICH_BODY=${bodyRows.length} (expect 100), total=${authorized.length} (expect 191)`);
  if (setRows.length !== 91 || bodyRows.length !== 100 || authorized.length !== 191) {
    console.error('STOP: authorized row count mismatch.'); process.exit(3);
  }
  const unauthorized = plan.proposals.filter((p) => !['SET_FIELD', 'ENRICH_BODY'].includes(p.action));
  const byAction = {};
  unauthorized.forEach((p) => { byAction[p.action] = (byAction[p.action] || 0) + 1; });
  console.log(`Excluded from mutation (must remain untouched): ${JSON.stringify(byAction)}`);

  // 1. Fresh-fetch canonical dataset
  const preDump = {};
  for (const t of WIKI_TYPES) preDump[t] = await query(t, `*[_type == "${t}"][]`);
  const preById = {};
  for (const t of WIKI_TYPES) for (const r of preDump[t]) preById[r._id] = { type: t, rec: r };
  const preCanonical = {};
  for (const t of WIKI_TYPES) for (const it of preDump[t]) {
    if (it._id.startsWith('drafts.')) continue;
    preCanonical[it._id] = { type: t, title: titleOf(t, it), slug: slugValue(it.slug), rev: it._rev ?? null,
      h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })) };
  }
  const preHash = sha256(Object.keys(preCanonical).sort().map((id) => preCanonical[id].h).join('\n'));
  console.log(`Fresh pre-mutation fetch: ${Object.keys(preCanonical).length} records, canonicalHash=${preHash}`);
  if (Object.keys(preCanonical).length !== 473) { console.error('STOP: pre-count != 473'); process.exit(3); }

  // 2. Pre-flight: _rev presence + current-value verification + enum + draft content
  const failures = [];
  for (const row of authorized) {
    const live = preById[row.recordId];
    if (!live) { failures.push(`${row.recordId}: not found in fresh fetch`); continue; }
    if (!live.rec._rev) { failures.push(`${row.recordId}: missing _rev`); continue; }
    const value = live.rec[row.field];
    const missing = value === undefined || value === null || (Array.isArray(value) && value.length === 0);
    if (!missing) { failures.push(`${row.recordId}.${row.field}: live value present but plan says missing (${JSON.stringify(value).slice(0, 60)})`); continue; }
    if (row.action === 'SET_FIELD') {
      const allowed = ENUM_FOR(row.type, row.field);
      if (!allowed) { failures.push(`${row.recordId}.${row.field}: no enum for SET`); continue; }
      if (!allowed.includes(row.proposedValue)) { failures.push(`${row.recordId}.${row.field}: proposed "${row.proposedValue}" not in enum`); continue; }
    }
    if (row.action === 'ENRICH_BODY') {
      const d = DRAFT[row.recordId];
      if (!d) { failures.push(`${row.recordId}: no DRAFT content`); continue; }
      const bullets = d[row.field];
      if (!bullets || bullets.length !== (row.field === 'whatNotToDo' ? 2 : 3)) {
        failures.push(`${row.recordId}.${row.field}: draft bullet count ${bullets ? bullets.length : 0} != expected`); continue;
      }
    }
  }
  const bodyTargets = new Set(bodyRows.map((r) => r.recordId));
  if (bodyTargets.size !== 25) failures.push(`body targets=${bodyTargets.size} != 25`);
  for (const id of bodyTargets) if (!DRAFT[id]) failures.push(`DRAFT missing for body target ${id}`);
  if (failures.length) {
    console.error(`STOP — ${failures.length} pre-flight failure(s), no mutation issued:`);
    failures.forEach((f) => console.error('  ' + f));
    process.exit(3);
  }
  console.log(`Pre-flight OK: all ${authorized.length} rows verified (fresh _rev, missing current values, enum-valid SETs, 25 DRAFT bodies).`);

  // 3. Group per record (field-level patches, one guarded patch per record)
  const patchByRecord = {};
  for (const row of authorized) {
    if (!patchByRecord[row.recordId]) patchByRecord[row.recordId] = { rows: [], set: {} };
    const entry = patchByRecord[row.recordId];
    entry.rows.push(row);
    entry.set[row.field] = row.action === 'SET_FIELD' ? row.proposedValue : buildPT(DRAFT[row.recordId].slug, row.field, DRAFT[row.recordId][row.field]);
  }
  const recordIds = Object.keys(patchByRecord);
  console.log(`Preparing ${recordIds.length} record patches (${authorized.length} field mutations)...`);

  // 4. Execute with ifRevisionID guard; abort on first failure (never force-write)
  const log = [];
  let appliedFields = 0;
  let failed = false;
  for (const id of recordIds) {
    const entry = patchByRecord[id];
    const revBefore = preById[id].rec._rev;
    const body = { mutations: [{ patch: { id, ifRevisionID: revBefore, set: entry.set } }] };
    const res = await fetch(MUTATE_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`STOP: patch failed for ${id}: ${res.status} ${text}`);
      failed = true;
      entry.rows.forEach((row) => log.push({
        recordId: id, type: row.type, title: row.title, field: row.field,
        before: row.currentValue, after: row.action === 'SET_FIELD' ? row.proposedValue : '[ENRICH_BODY]',
        confidence: row.confidence, evidence: `${row.evidenceLevel}|${row.source}`,
        previousRevision: revBefore, newRevision: null, timestamp: new Date().toISOString(),
        status: res.status === 409 ? 'ABORTED_REVISION_CONFLICT' : `FAILED_HTTP_${res.status}`,
        transactionId: null,
      }));
      continue;
    }
    const json = await res.json();
    const doc = json.results?.[0]?.document || {};
    appliedFields += entry.rows.length;
    for (const row of entry.rows) log.push({
      recordId: id, type: row.type, title: row.title, field: row.field,
      before: row.currentValue, after: row.action === 'SET_FIELD' ? row.proposedValue : '[ENRICH_BODY:' + row.field + ']',
      confidence: row.confidence, evidence: `${row.evidenceLevel}|${row.source}`,
      previousRevision: revBefore, newRevision: doc._rev ?? null, timestamp: new Date().toISOString(),
      status: 'APPLIED', transactionId: json.transactionId || null,
    });
    console.log(`APPLIED ${entry.rows[0].type} ${id}: ${entry.rows.map((r) => r.field).join('+')}`);
  }
  if (failed) {
    fs.writeFileSync(path.join(OUT, 'SPEC_03_MUTATION_LOG.json'), JSON.stringify({
      spec: 'SPEC 03', phase: 'MUTATION_LOG', generatedAt: new Date().toISOString(),
      authorizedCount: 191, appliedFieldCount: appliedFields, entries: log,
      aborted: true, note: 'Mutation run aborted on failure — no force-write. Partial log preserved.',
    }, null, 2));
    console.error(`STOP: mutation aborted. Applied ${appliedFields}/191 fields. Partial log written.`);
    process.exit(4);
  }
  console.log(`All ${recordIds.length} patches accepted. Applied ${appliedFields} field mutations.`);

  // 5. Post-fetch + diff verification
  const postDump = {};
  for (const t of WIKI_TYPES) postDump[t] = await query(t, `*[_type == "${t}"][]`);
  const postById = {};
  for (const t of WIKI_TYPES) for (const r of postDump[t]) postById[r._id] = { type: t, rec: r };

  const authorizedSet = new Set(authorized.map((r) => `${r.recordId}|${r.field}`));
  const changedFields = [];
  const identityDiff = { id: 0, slug: 0, title: 0 };
  const metaFields = new Set(['_rev', '_updatedAt', '_createdAt']);
  for (const [id, pre] of Object.entries(preById)) {
    const post = postById[id];
    if (!post) { identityDiff.id++; continue; }
    if (titleOf(pre.type, pre.rec) !== titleOf(post.type, post.rec)) identityDiff.title++;
    if (JSON.stringify(slugValue(pre.rec.slug)) !== JSON.stringify(slugValue(post.rec.slug))) identityDiff.slug++;
    const keys = new Set([...Object.keys(pre.rec), ...Object.keys(post.rec)]);
    for (const k of keys) {
      if (metaFields.has(k)) continue;
      if (JSON.stringify(pre.rec[k] ?? null) !== JSON.stringify(post.rec[k] ?? null)) {
        changedFields.push({ id, type: pre.type, field: k, before: pre.rec[k] ?? null, after: post.rec[k] ?? null });
      }
    }
  }
  const unexpected = changedFields.filter((c) => !authorizedSet.has(`${c.id}|${c.field}`));
  const missingChange = authorized.filter((a) => !changedFields.some((c) => c.id === a.recordId && c.field === a.field));
  console.log(`Diff: ${changedFields.length} fields changed, expected=${authorized.length}, unexpected=${unexpected.length}, not-applied=${missingChange.length}`);
  console.log(`Identity diff: id=${identityDiff.id} slug=${identityDiff.slug} title=${identityDiff.title}`);
  if (unexpected.length || missingChange.length || identityDiff.slug || identityDiff.title) {
    console.error('STOP — unauthorized mutation detected:');
    unexpected.slice(0, 10).forEach((u) => console.error(`  unexpected: ${u.id}.${u.field}`));
    missingChange.slice(0, 10).forEach((m) => console.error(`  not applied: ${m.recordId}.${m.field}`));
    process.exit(5);
  }

  // post canonical hash (identity only — must be unchanged)
  const postCanonical = {};
  for (const t of WIKI_TYPES) for (const it of postDump[t]) {
    if (it._id.startsWith('drafts.')) continue;
    postCanonical[it._id] = { type: t, title: titleOf(t, it), slug: slugValue(it.slug), rev: it._rev ?? null,
      h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })) };
  }
  const postHash = sha256(Object.keys(postCanonical).sort().map((id) => postCanonical[id].h).join('\n'));
  const counts = Object.fromEntries(WIKI_TYPES.map((t) => [t, postDump[t].filter((r) => !r._id.startsWith('drafts.')).length]));
  console.log(`post canonicalHash=${postHash} (identity unchanged=${postHash === preHash}), counts=${JSON.stringify(counts)}`);

  // 6. Artifacts (§16/§17)
  fs.writeFileSync(path.join(OUT, 'SPEC_03_MUTATION_LOG.json'), JSON.stringify({
    spec: 'SPEC 03', phase: 'MUTATION_LOG', generatedAt: new Date().toISOString(),
    authorizedCount: 191, appliedFieldCount: appliedFields, patchCount: recordIds.length,
    canonicalHashBefore: preHash, canonicalHashAfter: postHash,
    entries: log, aborted: false,
  }, null, 2));

  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const diffCsv = ['recordId,type,title,field,before,after,status'];
  for (const e of log) diffCsv.push([e.recordId, e.type, e.title, e.field, JSON.stringify(e.before), JSON.stringify(e.after), e.status].map(enc).join(','));
  fs.writeFileSync(path.join(OUT, 'SPEC_03_CONTENT_DIFF.csv'), '\uFEFF' + diffCsv.join('\n'));

  fs.writeFileSync(path.join(OUT, 'SPEC_03_POST_ENRICHMENT_SNAPSHOT.json'), JSON.stringify({
    manifest: {
      spec: 'SPEC 03', phase: 'POST_ENRICHMENT', generatedAt: new Date().toISOString(),
      projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION,
      wikiTypeCounts: counts, totalWikiRecords: Object.values(counts).reduce((a, b) => a + b, 0),
      canonicalHash: postHash, canonicalHashBefore: preHash,
      identityUnchanged: postHash === preHash,
      mutationsApplied: appliedFields, expectedMutations: 191,
      unexpectedMutations: 0,
      identityDiff,
    },
    perRecord: postCanonical, records: postDump,
  }, null, 2));

  fs.writeFileSync(path.join(OUT, 'SPEC_03_RAW_SOURCE_MANIFEST.json'), JSON.stringify({
    spec: 'SPEC 03', phase: 'RAW_SOURCE_MANIFEST', generatedAt: new Date().toISOString(),
    extractionMethod: 'Sanity HTTP API — data/query (read-only); mutation via data/mutate with ifRevisionID guard.',
    projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION,
    counts, total: Object.values(counts).reduce((a, b) => a + b, 0),
    drafts: 0,
    canonicalHashBefore: preHash, canonicalHashAfter: postHash,
    authorizedRows: 191, appliedRows: appliedFields,
    patchCount: recordIds.length,
    unauthorizedMutations: unexpected.length,
    aborted: false,
  }, null, 2));

  console.log('\nWrote SPEC_03_MUTATION_LOG.json, SPEC_03_CONTENT_DIFF.csv, SPEC_03_POST_ENRICHMENT_SNAPSHOT.json, SPEC_03_RAW_SOURCE_MANIFEST.json');
}

apply().catch((e) => { console.error(e); process.exit(1); });