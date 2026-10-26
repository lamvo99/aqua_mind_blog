const fs = require('fs');
const path = require('path');

// SPEC 10 — knowledge architecture builder (READ-ONLY).
// Emits the 8 design artifacts of report/SPEC_10/ from authored architecture data
// joined with SPEC 09 coverage (source of truth). No Sanity calls, no mutations.

const OUT = path.join('report', 'SPEC_10');
fs.mkdirSync(OUT, { recursive: true });

// ---------- loaders ----------
function readCsv(p) {
  const t = fs.readFileSync(p, 'utf8');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows[0]; return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const writeCsv = (name, header, rows) => {
  const out = [header.join(','), ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(','))].join('\n') + '\n';
  fs.writeFileSync(path.join(OUT, name), out);
  console.log(`wrote ${name}: ${rows.length} rows`);
};

const spec09 = readCsv(path.join('report', 'SPEC_09', 'SPEC_09_DOMAIN_SUMMARY.csv')).filter((r) => r.rowType === 'REQUIREMENT');
const coverage = new Map(spec09.map((r) => [`${r.domain}:${r.requirement}`, r]));
const schemaReg = readCsv(path.join('report', 'SPEC_09', 'SPEC_09_SCHEMA_GAP_REGISTER.csv'));
const schemaByKey = new Map(schemaReg.map((r) => [`${r.domain}:${r.requirement}`, r]));
const researchReg = readCsv(path.join('report', 'SPEC_09', 'SPEC_09_RESEARCH_REQUIRED.csv'));
const researchKeys = new Set(researchReg.map((r) => `${r.domain}:${r.requirement}`));
const fieldMatrix = readCsv(path.join('report', 'SPEC_01', 'SPEC_01_SCHEMA_FIELD_MATRIX.csv'));

// ---------- architecture data ----------
// row: [requirementId, layer, primaryRepresentation, target, applicabilityClass, completenessLevel, secondary?, rule?, note?]
// layer: A identification | B requirements | C behavior/function | D relationships | E maintenance/risk | F explanatory body
// repr : EXISTING_FIELD | NEW_FIELD | RELATIONSHIP | BODY
// applic: REQUIRED | OPTIONAL | CONDITIONAL | NOT_APPLICABLE | UNKNOWN
const SPECIES = [
  ['common_name', 'A', 'EXISTING_FIELD', 'name', 'REQUIRED', 'L1', '', '', ''],
  ['scientific_name', 'A', 'EXISTING_FIELD', 'scientificName', 'REQUIRED', 'L1', '', '', ''],
  ['taxonomic_context', 'A', 'EXISTING_FIELD', 'family+group', 'REQUIRED', 'L1', 'BODY', '', 'body adds family context prose'],
  ['natural_distribution', 'A', 'EXISTING_FIELD', 'origin+region', 'REQUIRED', 'L1', 'BODY', '', ''],
  ['habitat', 'A', 'BODY', 'body:overview', 'REQUIRED', 'L1', '', '', 'habitat description is explanatory prose'],
  ['adult_size', 'A', 'EXISTING_FIELD', 'sizeCm', 'REQUIRED', 'L1', '', '', ''],
  ['growth_expectations', 'F', 'BODY', 'body:adult-size-growth', 'REQUIRED', 'L3', '', '', 'trajectory prose; sizeCm covers endpoint only'],
  ['juvenile_vs_adult', 'F', 'BODY', 'body:adult-size-growth', 'OPTIONAL', 'L3', '', '', ''],
  ['adult_footprint', 'B', 'NEW_FIELD', 'minTankLengthCm', 'REQUIRED', 'L2', 'BODY', '', 'P0: volume != footprint (§6); footprint = length x width of the SAME dimensions block (no duplicate object, §29); implications prose in body'],
  ['growth_tank_transition', 'E', 'BODY', 'body:adult-size-growth', 'REQUIRED', 'L3', '', '', 'when to upsize guidance'],
  ['temperature', 'B', 'EXISTING_FIELD', 'tempMinC/tempMaxC', 'REQUIRED', 'L1', '', '', ''],
  ['ph', 'B', 'EXISTING_FIELD', 'phMin/phMax', 'REQUIRED', 'L1', '', '', ''],
  ['gh', 'B', 'EXISTING_FIELD', 'ghMin/ghMax', 'REQUIRED', 'L2', '', '', ''],
  ['kh', 'B', 'NEW_FIELD', 'khMin/khMax', 'REQUIRED', 'L2', '', 'research', 'carbonate hardness absent from schema'],
  ['salinity', 'B', 'NEW_FIELD', 'salinityMin/Max (ppt)', 'CONDITIONAL', 'L2', '', 'waterType in (saltwater, brackish)', ''],
  ['species_specific_chemistry', 'B', 'BODY', 'body:water-parameters', 'CONDITIONAL', 'L3', '', 'documented sensitive species', ''],
  ['min_tank_volume', 'B', 'EXISTING_FIELD', 'tankSizeMinL', 'REQUIRED', 'L1', '', '', ''],
  ['min_tank_dimensions', 'B', 'NEW_FIELD', 'minTankLengthCm', 'REQUIRED', 'L2', '', '', 'P0 schema item SG-001'],
  ['tank_footprint', 'B', 'NEW_FIELD', 'minTankWidthCm', 'REQUIRED', 'L2', '', '', 'P0 schema item SG-002'],
  ['swimming_space', 'B', 'NEW_FIELD', 'swimmingSpace (enum)', 'REQUIRED', 'L2', 'BODY', '', 'P0 schema item SG-006; enum NONE/LOW/MODERATE/HIGH'],
  ['open_water_requirement', 'B', 'NEW_FIELD', 'behaviorFlags[open-water]', 'REQUIRED', 'L2', '', '', 'shared target with open_water_swimmer (single source of truth)'],
  ['bottom_area', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'benthic/sand-dwelling groups', ''],
  ['vertical_space', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'tall-bodied/surface groups (arowana, angelfish, etc.)', 'SPEC 09 NA-all rule replaced by explicit group rule'],
  ['hiding_structures', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'cave/shy species', ''],
  ['jumping_risk', 'C', 'NEW_FIELD', 'jumpRisk (enum NONE/LOW/MODERATE/HIGH)', 'REQUIRED', 'L2', 'BODY', '', 'P0 schema item SG-003'],
  ['lid_requirement', 'B', 'NEW_FIELD', 'lidRequired (enum NOT_REQUIRED/RECOMMENDED/ESSENTIAL)', 'REQUIRED', 'L2', '', '', 'P0 schema item SG-007'],
  ['flow_requirement', 'B', 'NEW_FIELD', 'flowPreference (enum STILL/MODERATE/STRONG)', 'REQUIRED', 'L2', '', '', ''],
  ['oxygenation', 'B', 'NEW_FIELD', 'oxygenSensitivity (enum NEUTRAL/SENSITIVE)', 'REQUIRED', 'L2', '', '', ''],
  ['mature_aquarium', 'E', 'NEW_FIELD', 'maturityRequirement (enum NONE/SUGGESTED/REQUIRED)', 'REQUIRED', 'L2', 'BODY', '', 'shared vocabulary with invertebrate schema'],
  ['temperament', 'C', 'EXISTING_FIELD', 'temperament', 'REQUIRED', 'L1', 'NEW_FIELD', '', 'keep coarse enum; granular behavior moves to behaviorFlags'],
  ['territoriality', 'C', 'NEW_FIELD', 'behaviorFlags[territorial]', 'REQUIRED', 'L2', '', '', ''],
  ['schooling', 'C', 'EXISTING_FIELD', 'schooling (text) + groupSize {min,max}', 'REQUIRED', 'L2', 'BODY', '', 'extend text field with structured group size'],
  ['solitary', 'C', 'NEW_FIELD', 'behaviorFlags[solitary]', 'REQUIRED', 'L2', '', '', 'presence=positive signal; negatives live in body (Gate C rule)'],
  ['predator', 'C', 'EXISTING_FIELD', 'isPredator', 'REQUIRED', 'L1', 'RELATIONSHIP', '', 'boolean stays; predation detail via predatorPrey relations'],
  ['diet_type', 'A', 'EXISTING_FIELD', 'diet', 'REQUIRED', 'L1', 'BODY', '', ''],
  ['nocturnal', 'C', 'NEW_FIELD', 'behaviorFlags[nocturnal]', 'CONDITIONAL', 'L3', '', 'documented nocturnal groups (catfish, loaches, eels, cichlids)', ''],
  ['diurnal', 'C', 'NEW_FIELD', 'behaviorFlags[diurnal]', 'OPTIONAL', 'L3', '', '', ''],
  ['burrower', 'C', 'NEW_FIELD', 'behaviorFlags[burrower]', 'CONDITIONAL', 'L3', '', 'sand-dwellers (loaches, eels, rays, gobies)', ''],
  ['cave_dependent', 'C', 'NEW_FIELD', 'behaviorFlags[cave-dweller]', 'CONDITIONAL', 'L3', '', 'cavity-spawning/shy groups', ''],
  ['open_water_swimmer', 'C', 'NEW_FIELD', 'behaviorFlags[open-water]', 'CONDITIONAL', 'L2', '', 'sizeCm>=15 or pelagic groups', 'shared with open_water_requirement'],
  ['strong_swimmer', 'C', 'NEW_FIELD', 'behaviorFlags[strong-swimmer]', 'CONDITIONAL', 'L3', '', 'large/riverine groups', ''],
  ['timid', 'C', 'NEW_FIELD', 'behaviorFlags[timid]', 'REQUIRED', 'L3', '', '', 'community-stocking relevant for all'],
  ['community_suitability', 'D', 'NEW_FIELD', 'communitySuitability (enum UNSUITABLE/CONDITIONAL/SUITABLE)', 'REQUIRED', 'L2', 'RELATIONSHIP', '', 'summary enum; full truth lives in compatible/incompatible relations'],
  ['feeding_frequency', 'E', 'BODY', 'body:feeding', 'OPTIONAL', 'L3', '', 'where meaningful', ''],
  ['feeding_method', 'B', 'BODY', 'body:feeding', 'REQUIRED', 'L2', '', '', 'practical feeding strategy cannot be one field (SPEC 10 §8)'],
  ['juvenile_adult_diet', 'F', 'BODY', 'body:feeding', 'OPTIONAL', 'L3', '', '', ''],
  ['special_nutrition', 'B', 'BODY', 'body:feeding', 'CONDITIONAL', 'L3', '', 'specialist feeders', ''],
  ['feeding_competition', 'E', 'BODY', 'body:feeding', 'CONDITIONAL', 'L3', '', 'slow/semi-aggressive feeders', ''],
  ['predatory_feeding_behavior', 'C', 'BODY', 'body:feeding', 'CONDITIONAL', 'L3', '', 'predators', ''],
  ['compatible_tankmates', 'D', 'RELATIONSHIP', 'compatibleSpecies (+conditions)', 'REQUIRED', 'L2', 'BODY', '', 'exists but empty 218/218 (REL-01); extend entries with conditions[] for conditional compatibility (§10)'],
  ['incompatible_tankmates', 'D', 'RELATIONSHIP', 'incompatibleSpecies (PROPOSED)', 'REQUIRED', 'L2', 'BODY', '', 'no schema slot today (REL-02)'],
  ['size_based_predation', 'D', 'RELATIONSHIP', 'predatorPrey (PROPOSED typed refs)', 'CONDITIONAL', 'L2', 'BODY', 'predators/omnivores that eat tankmates', 'REL-03'],
  ['territorial_conflicts', 'D', 'BODY', 'body:compatibility', 'CONDITIONAL', 'L3', '', 'territorial species', ''],
  ['fin_nipping', 'D', 'BODY', 'body:compatibility', 'CONDITIONAL', 'L2', '', 'documented nippers', ''],
  ['compatibility_competition', 'D', 'BODY', 'body:compatibility', 'CONDITIONAL', 'L3', '', 'resource-competition species', ''],
  ['compat_warnings', 'D', 'BODY', 'body:compatibility', 'REQUIRED', 'L3', '', '', ''],
  ['coral_interaction', 'D', 'NEW_FIELD', 'reefInteraction (enum REEF_SAFE/CAUTION/SPECIES_DEPENDENT/NOT_REEF_SAFE)', 'CONDITIONAL', 'L2', 'RELATIONSHIP', 'waterType=saltwater', '§11: replaces reefCompatibility boolean semantics; detail flags (coral-predator/polyp-picker/tissue-nipper) in body'],
  ['invertebrate_predation', 'D', 'NEW_FIELD', 'predatesInverts (enum NONE/POSSIBLE/LIKELY)', 'CONDITIONAL', 'L2', 'RELATIONSHIP', 'isPredator=true or diet in (carnivore, omnivore)', 'REL-05'],
  ['water_change_sensitivity', 'E', 'NEW_FIELD', 'waterChangeSensitivity (enum LOW/MODERATE/HIGH)', 'REQUIRED', 'L2', '', '', ''],
  ['waste_bioload', 'E', 'NEW_FIELD', 'bioload (enum LOW/MODERATE/HIGH)', 'REQUIRED', 'L2', '', '', ''],
  ['maintenance_burden', 'E', 'EXISTING_FIELD', 'difficulty (semantics extended: careLevel)', 'REQUIRED', 'L1', 'BODY', '', ''],
  ['special_husbandry', 'F', 'BODY', 'body:special-requirements', 'CONDITIONAL', 'L3', '', 'specialist species', ''],
  ['sexual_differences', 'F', 'BODY', 'body:breeding', 'OPTIONAL', 'L3', '', '', ''],
  ['spawning_behavior', 'F', 'BODY', 'body:breeding', 'CONDITIONAL', 'L3', '', 'known breeders', ''],
  ['breeding_difficulty', 'F', 'NEW_FIELD', 'breedingDifficulty (enum)', 'CONDITIONAL', 'L3', '', 'known breeders', ''],
  ['breeding_requirements', 'F', 'BODY', 'body:breeding', 'CONDITIONAL', 'L4', '', 'known breeders', 'research-gated'],
];

const PLANT = [
  ['common_name', 'A', 'EXISTING_FIELD', 'name', 'REQUIRED', 'L1', '', '', ''],
  ['scientific_name', 'A', 'EXISTING_FIELD', 'scientificName', 'REQUIRED', 'L1', '', '', ''],
  ['plant_type', 'A', 'EXISTING_FIELD', 'group/type', 'REQUIRED', 'L1', '', '', ''],
  ['growth_form_plant', 'A', 'EXISTING_FIELD', 'growthForm', 'REQUIRED', 'L1', '', '', ''],
  ['natural_habitat_plant', 'A', 'BODY', 'body:overview', 'REQUIRED', 'L1', '', '', ''],
  ['light_requirement', 'B', 'EXISTING_FIELD', 'light', 'REQUIRED', 'L1', '', '', ''],
  ['light_intensity', 'B', 'BODY', 'body:light', 'REQUIRED', 'L2', '', '', 'acclimation/intensity nuance; no duplicate of light enum (§30)'],
  ['par', 'B', 'NEW_FIELD', 'parMin/parMax', 'OPTIONAL', 'L4', '', 'only where evidence supports numbers', 'research-gated; qualitative stays authoritative'],
  ['photoperiod', 'B', 'BODY', 'body:light', 'REQUIRED', 'L2', '', '', ''],
  ['light_acclimation', 'E', 'BODY', 'body:light', 'REQUIRED', 'L3', '', '', ''],
  ['co2_requirement', 'B', 'EXISTING_FIELD', 'co2', 'REQUIRED', 'L1', '', '', ''],
  ['low_tech_suitability', 'B', 'EXISTING_FIELD', 'co2 (semantics: NONE/LOW implies low-tech)', 'REQUIRED', 'L2', 'BODY', '', ''],
  ['co2_response', 'B', 'BODY', 'body:co2', 'REQUIRED', 'L3', '', '', ''],
  ['macro_nutrients', 'B', 'BODY', 'body:nutrients', 'REQUIRED', 'L3', '', '', ''],
  ['micro_nutrients', 'B', 'BODY', 'body:nutrients', 'REQUIRED', 'L3', '', '', ''],
  ['root_vs_water_column', 'B', 'NEW_FIELD', 'feedingMode (enum ROOT/WATER_COLUMN/BOTH)', 'CONDITIONAL', 'L2', '', 'not (Epiphyte/Moss/Fern/Floating)', ''],
  ['substrate_requirements', 'B', 'NEW_FIELD', 'substrateType (enum NONE/SAND/SOIL/MIXED)', 'CONDITIONAL', 'L2', 'BODY', 'not (Epiphyte/Moss/Fern/Floating)', ''],
  ['fertilization', 'B', 'NEW_FIELD', 'fertilizationPlan (enum NONE/LIGHT_LIQUID/REGULAR/TARGETED)', 'REQUIRED', 'L2', 'BODY', '', 'HIGH severity; core plant decision field'],
  ['deficiency_sensitivity', 'E', 'BODY', 'body:common-deficiencies', 'REQUIRED', 'L3', '', '', ''],
  ['temperature_plant', 'B', 'EXISTING_FIELD', 'tempMinC/tempMaxC', 'REQUIRED', 'L1', '', '', ''],
  ['ph_plant', 'B', 'EXISTING_FIELD', 'phMin/phMax', 'REQUIRED', 'L1', '', '', ''],
  ['gh_plant', 'B', 'NEW_FIELD', 'ghMin/ghMax', 'OPTIONAL', 'L3', '', 'where evidence exists', 'research-gated'],
  ['kh_plant', 'B', 'NEW_FIELD', 'khMin/khMax', 'OPTIONAL', 'L3', '', 'where evidence exists', 'research-gated'],
  ['placement', 'B', 'EXISTING_FIELD', 'placement', 'REQUIRED', 'L1', '', '', ''],
  ['epiphyte_attachment', 'C', 'BODY', 'body:placement', 'CONDITIONAL', 'L3', '', 'Epiphyte placement', ''],
  ['space_requirements_plant', 'B', 'BODY', 'body:growth-and-trimming', 'REQUIRED', 'L2', '', '', 'spread-room advice is contextual'],
  ['growth_rate', 'C', 'EXISTING_FIELD', 'growth', 'REQUIRED', 'L2', '', '', ''],
  ['adult_height', 'C', 'NEW_FIELD', 'heightCm', 'REQUIRED', 'L2', '', '', 'aquascaping placement decision data'],
  ['spread_width', 'C', 'NEW_FIELD', 'spreadCm', 'REQUIRED', 'L2', '', 'research', ''],
  ['propagation', 'F', 'EXISTING_FIELD', 'propagation', 'REQUIRED', 'L3', '', '', ''],
  ['trimming', 'F', 'BODY', 'body:growth-and-trimming', 'REQUIRED', 'L3', '', '', ''],
  ['flow_tolerance', 'B', 'NEW_FIELD', 'flowTolerance (enum LOW/MODERATE/HIGH)', 'REQUIRED', 'L3', '', '', ''],
  ['algae_sensitivity', 'E', 'BODY', 'body:algae-sensitivity', 'REQUIRED', 'L3', '', '', ''],
  ['melting', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', '', '', ''],
  ['nutrient_deficiency_problems', 'E', 'BODY', 'body:common-deficiencies', 'REQUIRED', 'L3', '', '', ''],
  ['light_problems', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', '', '', ''],
  ['co2_problems', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', '', '', ''],
  ['transition_issues', 'E', 'BODY', 'body:transition', 'REQUIRED', 'L3', '', '', ''],
];

const INVERTEBRATE = [
  ['common_name', 'A', 'EXISTING_FIELD', 'name', 'REQUIRED', 'L1', '', '', ''],
  ['scientific_name_inv', 'A', 'EXISTING_FIELD', 'scientificName', 'REQUIRED', 'L1', '', '', ''],
  ['type_group', 'A', 'EXISTING_FIELD', 'group/type', 'REQUIRED', 'L1', '', '', ''],
  ['natural_habitat_inv', 'A', 'BODY', 'body:overview', 'REQUIRED', 'L1', '', '', ''],
  ['temperature_inv', 'B', 'EXISTING_FIELD', 'tempMinC/tempMaxC', 'REQUIRED', 'L1', '', '', ''],
  ['salinity_inv', 'B', 'NEW_FIELD', 'salinityMin/Max (ppt)', 'CONDITIONAL', 'L2', '', 'waterType=saltwater', ''],
  ['ph_inv', 'B', 'EXISTING_FIELD', 'phMin/phMax', 'REQUIRED', 'L1', '', '', ''],
  ['gh_kh_inv', 'B', 'NEW_FIELD', 'ghMin/ghMax + khMin/khMax', 'OPTIONAL', 'L3', '', 'where evidence exists', 'research-gated'],
  ['calcium_inv', 'B', 'NEW_FIELD', 'calciumRequirement (enum NONE/SUGGESTED/REQUIRED)', 'CONDITIONAL', 'L2', 'BODY', 'shells/molts: snails, shrimp, crabs', 'HIGH severity; mineral decision field'],
  ['magnesium_inv', 'B', 'BODY', 'body:water-parameters', 'CONDITIONAL', 'L3', '', 'shrimp/crustacean groups', 'research-gated'],
  ['stability_inv', 'B', 'NEW_FIELD', 'stabilityRequirement (enum LOW/MODERATE/CRITICAL)', 'REQUIRED', 'L2', 'BODY', '', 'HIGH severity'],
  ['diet_inv', 'A', 'EXISTING_FIELD', 'diet', 'REQUIRED', 'L1', '', '', ''],
  ['natural_food', 'B', 'BODY', 'body:diet-and-feeding', 'REQUIRED', 'L2', '', '', ''],
  ['supplemental_feeding', 'B', 'BODY', 'body:diet-and-feeding', 'REQUIRED', 'L3', '', '', ''],
  ['starvation_risk', 'E', 'NEW_FIELD', 'riskFlags[STARVATION]', 'REQUIRED', 'L2', 'BODY', '', 'HIGH severity'],
  ['molting', 'C', 'NEW_FIELD', 'moltingType (enum NONE/RARE/FREQUENT)', 'CONDITIONAL', 'L2', 'BODY', 'crustaceans (shrimp, crabs, crayfish)', 'P0-relevant: 30/31 applicable missing (SPEC 09)'],
  ['molting_minerals', 'B', 'BODY', 'body:molting', 'CONDITIONAL', 'L2', '', 'crustaceans', 'research-gated; HIGH severity'],
  ['molting_hazards', 'E', 'BODY', 'body:molting', 'CONDITIONAL', 'L3', '', 'crustaceans', ''],
  ['post_molt_vulnerability', 'E', 'BODY', 'body:molting', 'CONDITIONAL', 'L3', '', 'crustaceans', ''],
  ['fish_predators', 'D', 'RELATIONSHIP', 'predatorPrey (PROPOSED typed refs)', 'CONDITIONAL', 'L2', 'BODY', 'prey-sized invertebrates', 'REL-03/05'],
  ['invertebrate_predators', 'D', 'RELATIONSHIP', 'predatorPrey (PROPOSED typed refs)', 'CONDITIONAL', 'L3', '', 'community records', ''],
  ['temperament_inv', 'C', 'EXISTING_FIELD', 'temperament', 'REQUIRED', 'L1', '', '', ''],
  ['competition_inv', 'D', 'BODY', 'body:compatibility', 'REQUIRED', 'L3', '', '', ''],
  ['reef_compat_inv', 'D', 'EXISTING_FIELD', 'reefCompatibility', 'CONDITIONAL', 'L2', '', 'waterType=saltwater', ''],
  ['min_tank_inv', 'B', 'NEW_FIELD', 'minTankVolumeL', 'REQUIRED', 'L2', '', '', 'species pattern reused for consistency'],
  ['hiding_areas', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'cave/shy species', ''],
  ['substrate_inv', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'burrowers/sand-sifters', ''],
  ['rockwork', 'B', 'BODY', 'body:tank-requirements', 'CONDITIONAL', 'L3', '', 'reef grazers/lochers', ''],
  ['escape_risk', 'E', 'NEW_FIELD', 'riskFlags[ESCAPE]', 'CONDITIONAL', 'L2', 'BODY', 'climbing groups (crabs, some snails, sleeper gobies)', 'HIGH severity'],
  ['reproduction', 'F', 'BODY', 'body:breeding', 'OPTIONAL', 'L3', '', '', ''],
  ['breeding_difficulty_inv', 'F', 'NEW_FIELD', 'breedingDifficulty (enum)', 'CONDITIONAL', 'L3', '', 'known breeders', ''],
  ['larval_requirements', 'F', 'BODY', 'body:breeding', 'CONDITIONAL', 'L4', '', 'breedable species', 'research-gated'],
  ['mature_aquarium_inv', 'E', 'NEW_FIELD', 'maturityRequirement (enum NONE/SUGGESTED/REQUIRED)', 'REQUIRED', 'L2', 'BODY', '', 'shared vocabulary with species schema; HIGH severity'],
  ['established_biofilm', 'E', 'NEW_FIELD', 'biofilmRequirement (enum NONE/REQUIRED)', 'CONDITIONAL', 'L2', 'BODY', 'grazers: shrimp, snails, detritivores', 'HIGH severity; 43 applicable, 0 covered in SPEC 09'],
  ['specialized_food_inv', 'B', 'BODY', 'body:diet-and-feeding', 'CONDITIONAL', 'L3', '', 'specialist feeders', ''],
  ['specialized_habitat_inv', 'B', 'BODY', 'body:tank-requirements', 'OPTIONAL', 'L4', '', '', ''],
];

const CORAL = [
  ['common_name', 'A', 'EXISTING_FIELD', 'name', 'REQUIRED', 'L1', '', '', ''],
  ['scientific_name_coral', 'A', 'EXISTING_FIELD', 'scientificName', 'REQUIRED', 'L1', '', '', ''],
  ['coral_type', 'A', 'EXISTING_FIELD', 'coralType', 'REQUIRED', 'L1', '', '', ''],
  ['coral_group', 'A', 'EXISTING_FIELD', 'group', 'REQUIRED', 'L1', '', '', ''],
  ['growth_form_coral', 'A', 'NEW_FIELD', 'growthForm (enum BRANCHING/PLATING/ENCRASTING/MASSIVE/FOLIACEOUS)', 'REQUIRED', 'L2', '', '', 'no growth-form field on coral schema today'],
  ['light_coral', 'B', 'EXISTING_FIELD', 'light', 'REQUIRED', 'L1', '', '', ''],
  ['par_coral', 'B', 'NEW_FIELD', 'parMin/parMax', 'OPTIONAL', 'L4', '', 'only where evidence supports numbers', 'research-gated; qualitative light stays authoritative (§23)'],
  ['placement_coral', 'B', 'EXISTING_FIELD', 'placement', 'REQUIRED', 'L2', '', '', ''],
  ['acclimation_coral', 'E', 'BODY', 'body:acclimation', 'REQUIRED', 'L2', '', '', 'research-gated; HIGH severity'],
  ['lighting_risks', 'E', 'BODY', 'body:lighting-risks', 'REQUIRED', 'L3', '', '', ''],
  ['flow_coral', 'B', 'EXISTING_FIELD', 'flow', 'REQUIRED', 'L1', '', '', ''],
  ['flow_pattern', 'B', 'NEW_FIELD', 'flowPattern (enum DIRECT/INDIRECT/RANDOM/OSCILLATING/LAMINAR)', 'REQUIRED', 'L3', 'BODY', '', '§12: flow quality beyond quantity'],
  ['flow_tissue_considerations', 'B', 'BODY', 'body:flow', 'REQUIRED', 'L3', '', '', ''],
  ['temperature_coral', 'B', 'EXISTING_FIELD', 'tempMinC/tempMaxC', 'REQUIRED', 'L1', '', '', ''],
  ['salinity_coral', 'B', 'NEW_FIELD', 'salinityMin/Max (ppt) or sgMin/sgMax', 'REQUIRED', 'L2', '', 'research', 'HIGH severity; coral chemistry block'],
  ['ph_coral', 'B', 'NEW_FIELD', 'phMin/phMax', 'REQUIRED', 'L2', '', 'research', 'coral chemistry block'],
  ['alkalinity', 'B', 'NEW_FIELD', 'dkhMin/dkhMax', 'REQUIRED', 'L2', '', 'research', 'HIGH severity; coral chemistry block'],
  ['calcium', 'B', 'NEW_FIELD', 'caMin/caMax (ppm)', 'REQUIRED', 'L2', '', 'research', 'HIGH severity; coral chemistry block'],
  ['magnesium', 'B', 'NEW_FIELD', 'mgMin/mgMax (ppm)', 'REQUIRED', 'L3', '', 'research', 'coral chemistry block'],
  ['nitrate', 'B', 'NEW_FIELD', 'no3Min/no3Max (ppm)', 'REQUIRED', 'L3', '', 'research', 'coral chemistry block'],
  ['phosphate', 'B', 'NEW_FIELD', 'po4Min/po4Max (ppm)', 'REQUIRED', 'L3', '', 'research', 'coral chemistry block'],
  ['stability', 'B', 'BODY', 'body:water-chemistry', 'REQUIRED', 'L2', '', '', 'HIGH severity; stability is a strategy, not a number (§9)'],
  ['photosynthetic', 'C', 'EXISTING_FIELD', 'photosynthetic', 'REQUIRED', 'L1', '', '', ''],
  ['feeding_coral', 'B', 'BODY', 'body:nutrition', 'REQUIRED', 'L3', '', '', ''],
  ['feeding_type_coral', 'C', 'NEW_FIELD', 'feedingType (enum ZOOXANTHELLAE/MIXED/CARNIVOROUS/NPS)', 'REQUIRED', 'L2', '', '', 'classification decides feeding workflow'],
  ['feeding_frequency_coral', 'B', 'BODY', 'body:nutrition', 'CONDITIONAL', 'L3', '', 'NPS/non-photosynthetic corals', ''],
  ['nutrient_availability', 'B', 'BODY', 'body:nutrition', 'REQUIRED', 'L3', '', '', ''],
  ['growth_rate_coral', 'C', 'NEW_FIELD', 'growthRate (enum SLOW/MODERATE/FAST)', 'REQUIRED', 'L3', '', '', ''],
  ['space_coral', 'B', 'NEW_FIELD', 'spacing (enum CLOSE/MODERATE/SPACED)', 'REQUIRED', 'L2', 'BODY', '', 'placement decision field; detail in body'],
  ['aggression', 'C', 'EXISTING_FIELD', 'aggression', 'REQUIRED', 'L2', '', '', ''],
  ['sweeper_tentacles', 'C', 'NEW_FIELD', 'aggressionTraits[SWEEPER]', 'REQUIRED', 'L2', 'BODY', '', 'one multi-select serves sweeper/allelopathy/stinging (Gate C vocabulary rule)'],
  ['chemical_warfare', 'C', 'NEW_FIELD', 'aggressionTraits[ALLOLEPATHY]', 'REQUIRED', 'L3', 'BODY', '', ''],
  ['stinging', 'C', 'NEW_FIELD', 'aggressionTraits[STING]', 'REQUIRED', 'L3', 'BODY', '', ''],
  ['placement_neighbors', 'D', 'RELATIONSHIP', 'coralNeighbors (PROPOSED typed refs)', 'REQUIRED', 'L3', 'BODY', '', 'REL-13: coral-coral spacing/aggression cannot be expressed today'],
  ['reef_safe_status', 'D', 'EXISTING_FIELD', 'reefCompatibility', 'REQUIRED', 'L1', '', '', ''],
  ['reef_caveats', 'D', 'BODY', 'body:reef-caveats', 'REQUIRED', 'L2', '', '', 'HIGH severity; species-dependent nuance (§11)'],
  ['coral_interaction_coral', 'D', 'RELATIONSHIP', 'coralNeighbors (PROPOSED typed refs)', 'REQUIRED', 'L3', 'BODY', '', 'neighbor effects as typed relations + narrative'],
  ['fish_interaction_coral', 'D', 'RELATIONSHIP', 'species<->coral reefInteraction (bidirectional view)', 'REQUIRED', 'L3', 'BODY', '', 'coral-side view of the fish-side relation; no duplicate slot (§29)'],
  ['invertebrate_interaction_coral', 'D', 'BODY', 'body:compatibility', 'REQUIRED', 'L3', '', '', ''],
  ['bleaching', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L2', 'RELATIONSHIP', '', 'HIGH severity; relatedProblems links + narrative'],
  ['stn_rtn', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L2', 'RELATIONSHIP', '', 'HIGH severity'],
  ['pests_coral', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', 'RELATIONSHIP', '', 'HIGH severity'],
  ['algae_coral', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', '', '', ''],
  ['flow_stress_coral', 'E', 'BODY', 'body:common-problems', 'REQUIRED', 'L3', '', '', ''],
  ['chemistry_problems', 'E', 'BODY', 'body:chemistry-problems', 'REQUIRED', 'L3', 'RELATIONSHIP', '', 'HIGH severity'],
];

const EQUIPMENT = [
  ['purpose', 'A', 'EXISTING_FIELD', 'excerpt (semantics: function/intended use)', 'REQUIRED', 'L1', 'BODY', '', 'excerpt serves identification; body adds What It Does section'],
  ['problem_solved', 'A', 'BODY', 'body:what-it-does', 'REQUIRED', 'L2', '', '', ''],
  ['suitable_tank_size', 'B', 'EXISTING_FIELD', 'tankSizeMinL/tankSizeMaxL', 'REQUIRED', 'L1', '', '', ''],
  ['water_type_suitability', 'B', 'NEW_FIELD', 'waterType (enum freshwater/saltwater/both)', 'REQUIRED', 'L1', '', '', 'currently text-derived (46/46 covered); structuring enables filtering (§18)'],
  ['tank_type', 'A', 'EXISTING_FIELD', 'category', 'REQUIRED', 'L1', '', '', ''],
  ['flow_capacity', 'B', 'EXISTING_FIELD', 'flowRateLh', 'CONDITIONAL', 'L2', '', 'pumps, filters, powerheads', ''],
  ['turnover', 'B', 'NEW_FIELD', 'turnoverPerH', 'CONDITIONAL', 'L3', '', 'marine/filtration categories', 'research-gated; HIGH severity'],
  ['filtration_capacity', 'B', 'NEW_FIELD', 'ratedCapacity {value,unit,basis}', 'CONDITIONAL', 'L3', '', 'filters, skimmers, reactors', 'research-gated; preserves manufacturer spec (§15)'],
  ['load_limitations', 'E', 'BODY', 'body:real-world-capacity', 'REQUIRED', 'L2', '', '', 'HIGH severity; rated != real (§15)'],
  ['practical_capacity', 'E', 'BODY', 'body:real-world-capacity', 'REQUIRED', 'L3', '', '', ''],
  ['best_use_case', 'C', 'BODY', 'body:best-use', 'REQUIRED', 'L2', '', '', ''],
  ['installation', 'C', 'BODY', 'body:specifications', 'OPTIONAL', 'L3', '', '', ''],
  ['placement_equipment', 'C', 'BODY', 'body:specifications', 'REQUIRED', 'L3', '', '', ''],
  ['configuration', 'C', 'BODY', 'body:specifications', 'REQUIRED', 'L3', '', '', ''],
  ['limitations', 'E', 'EXISTING_FIELD', 'cons', 'REQUIRED', 'L1', 'BODY', '', 'cons array is the strongest existing body layer (37/46)'],
  ['when_inadequate', 'E', 'BODY', 'body:limitations', 'REQUIRED', 'L2', '', '', 'HIGH severity'],
  ['noise_heat', 'E', 'BODY', 'body:limitations', 'REQUIRED', 'L3', '', '', ''],
  ['compatible_equipment', 'D', 'RELATIONSHIP', 'compatibleEquipment (PROPOSED equipment->equipment)', 'REQUIRED', 'L3', 'BODY', '', 'no equipment-to-equipment slot exists'],
  ['system_interactions', 'D', 'BODY', 'body:compatibility', 'REQUIRED', 'L3', '', '', ''],
  ['reef_fresh_constraints', 'B', 'BODY', 'body:limitations', 'CONDITIONAL', 'L3', '', 'categories usable in both water types', ''],
  ['cleaning', 'E', 'BODY', 'body:maintenance', 'REQUIRED', 'L2', '', '', 'HIGH severity'],
  ['replacement', 'E', 'BODY', 'body:maintenance', 'REQUIRED', 'L3', '', '', ''],
  ['consumables', 'E', 'BODY', 'body:maintenance', 'REQUIRED', 'L3', '', '', ''],
  ['failure_modes', 'E', 'BODY', 'body:failure-modes', 'REQUIRED', 'L2', 'RELATIONSHIP', '', 'HIGH severity; links to problem records'],
  ['common_misuse', 'E', 'BODY', 'body:safety', 'REQUIRED', 'L2', '', '', 'HIGH severity'],
  ['overflow_risk', 'E', 'BODY', 'body:safety', 'CONDITIONAL', 'L2', '', 'water-moving categories (filters, powerheads, top-offs)', 'HIGH severity'],
  ['electrical_safety', 'E', 'BODY', 'body:safety', 'CONDITIONAL', 'L2', '', 'electrical categories (heaters, lights, controllers)', 'HIGH severity; Digital Heater P0'],
  ['power_draw', 'B', 'EXISTING_FIELD', 'powerW', 'REQUIRED', 'L1', '', '', ''],
];

const PROBLEM = [
  ['symptoms', 'E', 'EXISTING_FIELD', 'symptoms (portable-text block)', 'REQUIRED', 'L1', '', '', ''],
  ['what_it_indicates', 'E', 'EXISTING_FIELD', 'causes (portable-text block)', 'REQUIRED', 'L1', '', '', ''],
  ['differential_causes', 'E', 'EXISTING_FIELD', 'causes (semantics: multiple causes w/ ordering)', 'REQUIRED', 'L2', '', '', ''],
  ['how_to_distinguish', 'E', 'BODY', 'newBlock:howToDistinguish', 'REQUIRED', 'L2', '', '', 'differential diagnosis; 5/43 covered in SPEC 09'],
  ['first_check', 'E', 'EXISTING_FIELD', 'whatToCheck (portable-text block)', 'REQUIRED', 'L1', '', '', ''],
  ['secondary_causes', 'E', 'EXISTING_FIELD', 'causes (semantics: tag entries secondary)', 'REQUIRED', 'L3', '', '', ''],
  ['environmental_causes', 'E', 'EXISTING_FIELD', 'causes (semantics: tag entries environmental)', 'REQUIRED', 'L3', '', '', ''],
  ['husbandry_causes', 'E', 'EXISTING_FIELD', 'causes (semantics: tag entries husbandry)', 'REQUIRED', 'L3', '', '', ''],
  ['immediate_action', 'E', 'BODY', 'newBlock:immediateAction', 'REQUIRED', 'L2', '', '', '§16 pipeline step missing today; 9/43 covered'],
  ['corrective_action', 'E', 'BODY', 'newBlock:treatment', 'REQUIRED', 'L2', '', '', '§16 correction step'],
  ['recovery_expectations', 'E', 'BODY', 'newBlock:recovery', 'REQUIRED', 'L3', '', '', ''],
  ['what_not_to_do', 'E', 'EXISTING_FIELD', 'whatNotToDo (portable-text block)', 'REQUIRED', 'L1', '', '', ''],
  ['overcorrection_risks', 'E', 'EXISTING_FIELD', 'whatNotToDo (semantics: include overcorrection)', 'REQUIRED', 'L3', '', '', 'no duplicate block (§30)'],
  ['prevention', 'E', 'BODY', 'newBlock:prevention', 'REQUIRED', 'L2', '', '', '§16 prevention step; 2/43 covered'],
  ['monitoring', 'E', 'BODY', 'newBlock:monitoring', 'REQUIRED', 'L3', '', '', 'ongoing checks vs first-check block'],
  ['maintenance_prevention', 'E', 'BODY', 'newBlock:prevention (maintenance entries)', 'REQUIRED', 'L3', '', '', 'shared block with prevention'],
  ['escalation', 'E', 'BODY', 'newBlock:escalation', 'REQUIRED', 'L2', '', '', 'P0: 0/43 covered (SPEC 09); §16 final step'],
];

const DOMAINS = { species: SPECIES, plant: PLANT, invertebrate: INVERTEBRATE, coral: CORAL, equipment: EQUIPMENT, problem: PROBLEM };

// ---------- field -> knowledge mapping rules ----------
// keyed by document_type.field_name -> [layer, servedRequirements, status, note]
const FIELD_MAP = {
  'species.name': ['A', 'common_name', 'ADEQUATE', ''],
  'species.scientificName': ['A', 'scientific_name', 'ADEQUATE', ''],
  'species.family': ['A', 'taxonomic_context', 'ADEQUATE', ''],
  'species.origin': ['A', 'natural_distribution', 'ADEQUATE', ''],
  'species.region': ['A', 'natural_distribution', 'ADEQUATE', ''],
  'species.group': ['A', 'taxonomic_context', 'ADEQUATE', ''],
  'species.excerpt': ['A/F', 'habitat', 'EXTEND_SEMANTICS', 'excerpt doubles as mini-body; long-form body is the real target'],
  'species.sizeCm': ['A', 'adult_size', 'ADEQUATE', ''],
  'species.tankSizeMinL': ['B', 'min_tank_volume', 'INSUFFICIENT_FOR_DECISIONS', 'volume-only: cannot express footprint/dimensions/turning room (SPEC 10 §6)'],
  'species.tempMinC': ['B', 'temperature', 'ADEQUATE', ''],
  'species.tempMaxC': ['B', 'temperature', 'ADEQUATE', ''],
  'species.phMin': ['B', 'ph', 'ADEQUATE', ''],
  'species.phMax': ['B', 'ph', 'ADEQUATE', ''],
  'species.ghMin': ['B', 'gh', 'ADEQUATE', ''],
  'species.ghMax': ['B', 'gh', 'ADEQUATE', ''],
  'species.diet': ['A/B', 'diet_type', 'ADEQUATE', ''],
  'species.temperament': ['C', 'temperament', 'EXTEND_SEMANTICS', 'single enum forces mutually exclusive concepts; add behaviorFlags (SPEC 10 §7)'],
  'species.waterZone': ['C', 'open_water_swimmer', 'EXTEND_SEMANTICS', 'zone enum helps; pair with behaviorFlags'],
  'species.schooling': ['C', 'schooling', 'EXTEND_SEMANTICS', 'text field; add structured groupSize {min,max}'],
  'species.difficulty': ['E', 'maintenance_burden', 'EXTEND_SEMANTICS', 'define careLevel semantics'],
  'species.isPredator': ['C', 'predator', 'ADEQUATE', ''],
  'species.reefCompatibility': ['D', 'coral_interaction', 'INSUFFICIENT_FOR_DECISIONS', 'boolean cannot express §11 tiers (caution/species-dependent/predator detail)'],
  'species.compatibleSpecies': ['D', 'compatible_tankmates', 'INSUFFICIENT_FOR_DECISIONS', 'empty 218/218; add conditions[] on entries'],
  'species.compatiblePlants': ['D', 'plant pairing', 'EXTEND_SEMANTICS', ''],
  'species.compatibleInvertebrates': ['D', 'invertebrate pairing', 'EXTEND_SEMANTICS', ''],
  'species.suitableEquipment': ['D', 'equipment pairing', 'EXTEND_SEMANTICS', ''],
  'species.relatedProblems': ['D', 'troubleshooting links', 'EXTEND_SEMANTICS', ''],
  'species.aquariumStyle': ['D', 'style pairing', 'EXTEND_SEMANTICS', ''],
  'plant.name': ['A', 'common_name', 'ADEQUATE', ''],
  'plant.scientificName': ['A', 'scientific_name', 'ADEQUATE', ''],
  'plant.growthForm': ['A', 'growth_form_plant', 'ADEQUATE', ''],
  'plant.group': ['A', 'plant_type', 'ADEQUATE', ''],
  'plant.excerpt': ['A/F', 'natural_habitat_plant', 'EXTEND_SEMANTICS', 'long-form body target'],
  'plant.light': ['B', 'light_requirement', 'ADEQUATE', ''],
  'plant.co2': ['B', 'co2_requirement, low_tech_suitability', 'ADEQUATE', ''],
  'plant.growth': ['C', 'growth_rate', 'ADEQUATE', ''],
  'plant.placement': ['B', 'placement, epiphyte_attachment', 'EXTEND_SEMANTICS', ''],
  'plant.tempMinC': ['B', 'temperature_plant', 'ADEQUATE', ''],
  'plant.tempMaxC': ['B', 'temperature_plant', 'ADEQUATE', ''],
  'plant.phMin': ['B', 'ph_plant', 'ADEQUATE', ''],
  'plant.phMax': ['B', 'ph_plant', 'ADEQUATE', ''],
  'plant.propagation': ['F', 'propagation', 'ADEQUATE', ''],
  'plant.redPlant': ['A', 'plant_type', 'EXTEND_SEMANTICS', ''],
  'plant.suitableEquipment': ['D', 'equipment pairing', 'EXTEND_SEMANTICS', ''],
  'plant.relatedProblems': ['D', 'troubleshooting links', 'EXTEND_SEMANTICS', ''],
  'coral.name': ['A', 'common_name', 'ADEQUATE', ''],
  'coral.scientificName': ['A', 'scientific_name', 'ADEQUATE', ''],
  'coral.coralType': ['A', 'coral_type', 'ADEQUATE', ''],
  'coral.group': ['A', 'coral_group', 'ADEQUATE', ''],
  'coral.excerpt': ['A/F', 'overview', 'EXTEND_SEMANTICS', 'long-form body target'],
  'coral.light': ['B', 'light_coral', 'ADEQUATE', ''],
  'coral.flow': ['B', 'flow_coral', 'EXTEND_SEMANTICS', 'add flowPattern enum (§12)'],
  'coral.placement': ['B', 'placement_coral', 'ADEQUATE', ''],
  'coral.aggression': ['C', 'aggression', 'EXTEND_SEMANTICS', 'add aggressionTraits multi-select'],
  'coral.reefCompatibility': ['D', 'reef_safe_status', 'EXTEND_SEMANTICS', 'OK for corals; fish-side boolean is the insufficient one'],
  'coral.photosynthetic': ['C', 'photosynthetic', 'ADEQUATE', ''],
  'coral.tempMinC': ['B', 'temperature_coral', 'ADEQUATE', ''],
  'coral.tempMaxC': ['B', 'temperature_coral', 'ADEQUATE', ''],
  'coral.difficulty': ['E', 'maintenance_burden', 'EXTEND_SEMANTICS', ''],
  'coral.suitableEquipment': ['D', 'equipment pairing', 'EXTEND_SEMANTICS', ''],
  'coral.relatedProblems': ['D', 'problem links', 'EXTEND_SEMANTICS', ''],
  'invertebrate.name': ['A', 'common_name', 'ADEQUATE', ''],
  'invertebrate.scientificName': ['A', 'scientific_name_inv', 'ADEQUATE', ''],
  'invertebrate.group': ['A', 'type_group', 'ADEQUATE', ''],
  'invertebrate.excerpt': ['A/F', 'natural_habitat_inv', 'EXTEND_SEMANTICS', 'long-form body target'],
  'invertebrate.sizeCm': ['A', 'adult size', 'ADEQUATE', ''],
  'invertebrate.waterType': ['B', 'salinity_inv, reef_compat_inv', 'EXTEND_SEMANTICS', ''],
  'invertebrate.tempMinC': ['B', 'temperature_inv', 'ADEQUATE', ''],
  'invertebrate.tempMaxC': ['B', 'temperature_inv', 'ADEQUATE', ''],
  'invertebrate.phMin': ['B', 'ph_inv', 'ADEQUATE', ''],
  'invertebrate.phMax': ['B', 'ph_inv', 'ADEQUATE', ''],
  'invertebrate.diet': ['A', 'diet_inv', 'ADEQUATE', ''],
  'invertebrate.temperament': ['C', 'temperament_inv', 'ADEQUATE', ''],
  'invertebrate.reefCompatibility': ['D', 'reef_compat_inv', 'ADEQUATE', ''],
  'invertebrate.compatibleSpecies': ['D', 'compatible_tankmates', 'INSUFFICIENT_FOR_DECISIONS', 'empty 56/56 (REL-12)'],
  'invertebrate.suitableEquipment': ['D', 'equipment pairing', 'EXTEND_SEMANTICS', ''],
  'invertebrate.relatedProblems': ['D', 'troubleshooting links', 'EXTEND_SEMANTICS', ''],
  'equipment.name': ['A', 'purpose', 'ADEQUATE', ''],
  'equipment.brand': ['A', 'identification', 'STRUCTURAL', ''],
  'equipment.model': ['A', 'identification', 'STRUCTURAL', ''],
  'equipment.category': ['A/B', 'tank_type', 'ADEQUATE', ''],
  'equipment.excerpt': ['A', 'purpose, problem_solved', 'EXTEND_SEMANTICS', 'long-form body target'],
  'equipment.flowRateLh': ['B', 'flow_capacity', 'INSUFFICIENT_FOR_DECISIONS', 'manufacturer rating only; practical capacity belongs in body (§15)'],
  'equipment.powerW': ['B', 'power_draw', 'ADEQUATE', ''],
  'equipment.tankSizeMinL': ['B', 'suitable_tank_size', 'ADEQUATE', ''],
  'equipment.tankSizeMaxL': ['B', 'suitable_tank_size', 'ADEQUATE', ''],
  'equipment.aquariumStyle': ['D', 'style pairing', 'EXTEND_SEMANTICS', ''],
  'equipment.pros': ['E', 'best_use_case', 'ADEQUATE', ''],
  'equipment.cons': ['E', 'limitations', 'ADEQUATE', 'strongest equipment body layer'],
  'equipment.relatedPosts': ['-', 'content linking', 'STRUCTURAL', ''],
  'problem.title': ['A', 'identification', 'ADEQUATE', ''],
  'problem.category': ['E', 'taxonomy navigation', 'EXTEND_SEMANTICS', 'navigation aid, not knowledge'],
  'problem.waterType': ['E', 'scope', 'ADEQUATE', ''],
  'problem.excerpt': ['A', 'identification', 'EXTEND_SEMANTICS', ''],
  'problem.symptoms': ['E', 'symptoms', 'ADEQUATE', ''],
  'problem.causes': ['E', 'what_it_indicates, differential_causes, secondary/environmental/husbandry_causes', 'EXTEND_SEMANTICS', 'needs entry semantics (primary/secondary/type tags)'],
  'problem.whatToCheck': ['E', 'first_check', 'EXTEND_SEMANTICS', 'distinguish first-check vs ongoing monitoring'],
  'problem.whatNotToDo': ['E', 'what_not_to_do, overcorrection_risks', 'EXTEND_SEMANTICS', ''],
  'problem.relatedTools': ['D', 'tool links', 'EXTEND_SEMANTICS', ''],
  'problem.relatedPosts': ['-', 'content linking', 'STRUCTURAL', ''],
};
const STRUCTURAL_DEFAULT = ['-', '', 'STRUCTURAL', 'no husbandry knowledge served (identity/SEO/media/slug/publishedAt class)'];

// ---------- relationship model (Gate C) ----------
// status: EXISTING_EMPTY | EXISTING_PARTIAL | EXISTING_FULL | PROPOSED | DERIVED
const REL_MODEL = [
  ['REL-M01', 'species', 'species', 'compatibleSpecies', 'EXISTING_EMPTY', 'COMPATIBLE + CONDITIONAL', 'source->target refs (+conditions[] proposed)', 'none (populate forward); reverse view rendered from refs', 'entries require evidence note when conditions[] used', 'REL-01', 218, 'extend entry shape: {ref, conditions[], confidence}'],
  ['REL-M02', 'invertebrate', 'species', 'compatibleSpecies', 'EXISTING_EMPTY', 'COMPATIBLE', 'source->target refs', 'same', 'evidence note', 'REL-12', 56, ''],
  ['REL-M03', 'species', 'plant', 'compatiblePlants', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal (pairing)', 'REL-06', 111, '107/218 populated'],
  ['REL-M04', 'species', 'invertebrate', 'compatibleInvertebrates', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal', 'REL-07', 118, ''],
  ['REL-M05', 'species', 'equipment', 'suitableEquipment', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal', 'REL-08', 87, ''],
  ['REL-M06', 'species', 'problem', 'relatedProblems', 'EXISTING_PARTIAL', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'REL-09', 87, ''],
  ['REL-M07', 'plant', 'equipment', 'suitableEquipment', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal', 'REL-10', 10, ''],
  ['REL-M08', 'plant', 'problem', 'relatedProblems', 'EXISTING_PARTIAL', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'REL-10', 10, ''],
  ['REL-M09', 'coral', 'equipment', 'suitableEquipment', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal', 'REL-14', 12, ''],
  ['REL-M10', 'coral', 'problem', 'relatedProblems', 'EXISTING_PARTIAL', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'REL-14', 12, ''],
  ['REL-M11', 'invertebrate', 'equipment', 'suitableEquipment', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->target refs', 'same', 'minimal', 'REL-14-class', 0, ''],
  ['REL-M12', 'invertebrate', 'problem', 'relatedProblems', 'EXISTING_PARTIAL', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'REL-14-class', 0, ''],
  ['REL-M13', 'plant', 'style', 'aquariumStyle', 'EXISTING_FULL', 'SUITABILITY', 'source->style terms', 'n/a', 'none', 'REL-11', 0, '62/62 populated'],
  ['REL-M14', 'equipment', 'style', 'aquariumStyle', 'EXISTING_PARTIAL', 'SUITABILITY', 'source->style terms', 'n/a', 'none', 'REL-15', 0, ''],
  ['REL-M15', 'problem', 'tool', 'relatedTools', 'EXISTING_PARTIAL', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'REL-17', 27, ''],
  ['REL-P01', 'species', 'species', 'incompatibleSpecies (PROPOSED)', 'PROPOSED', 'INCOMPATIBLE', 'source->target refs (+reason enum)', 'mutual display recommended', 'reason required (predation/temperament/size/water)', 'REL-02', 218, 'no slot exists today'],
  ['REL-P02', 'species+invertebrate', 'species+invertebrate', 'predatorPrey (PROPOSED)', 'PROPOSED', 'PREDATOR_PREY', 'typed refs predator->prey (+size condition)', 'prey shows predator warning', 'size/diet evidence note required', 'REL-03/REL-05', 218, 'covers size_based_predation, fish_predators, invertebrate_predators'],
  ['REL-P03', 'species', 'coral', 'reefInteraction detail (PROPOSED object)', 'PROPOSED', 'CORAL_INTERACTION', 'ref + {tier, targets[], frequency, monitoring}', 'coral shows fish-risk view', '§11 six-question evidence', 'REL-04', 56, 'extends boolean reefCompatibility; tier enum shared with species.reefInteraction field'],
  ['REL-P04', 'coral', 'coral', 'coralNeighbors (PROPOSED)', 'PROPOSED', 'AGGRESSION (SWEEP/STING/SHADE/ALLELOPATHY/OVERGROW)', 'source->target refs + type', 'symmetric spacing view', 'distance/evidence note', 'REL-13', 48, 'serves placement_neighbors + coral_interaction_coral'],
  ['REL-P05', 'equipment', 'equipment', 'compatibleEquipment (PROPOSED)', 'PROPOSED', 'DEPENDENCY', 'source->target refs', 'symmetric display', 'minimal', 'SPEC 10 §15', 46, ''],
  ['REL-P06', 'equipment', 'problem', 'relatedProblems (PROPOSED)', 'PROPOSED', 'TROUBLESHOOTING', 'source->target refs', 'same', 'minimal', 'SPEC 10 §15', 46, 'failure-modes navigation'],
  ['REL-D01', 'problem', 'species', '(no new field: DERIVED)', 'DERIVED', 'BACKREFERENCE', 'derived from species.relatedProblems', 'n/a (query-time)', 'n/a', 'REL-16', 43, 'avoid duplicate source of truth (§29)'],
];

// ---------- research model (Gate E) ----------
const RESEARCH_MODEL = [
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'researchId', 'string', 'yes', 'stable id RS-xxx', 'links to SPEC 09 research register'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'recordId', 'string', 'yes', 'Sanity _id', 'target record'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'requirementId', 'string', 'yes', 'SPEC 09 requirement id', 'which knowledge requirement'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'claim', 'text', 'yes', 'exact question/claim to verify', 'never vague; one testable claim'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'applicability', 'enum', 'yes', 'REQUIRED|OPTIONAL|CONDITIONAL|NOT_APPLICABLE|UNKNOWN', 'prevents false gaps (§19)'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'priority', 'enum', 'yes', 'P0|P1|P2|P3', 'carries SPEC 09 danger priority (§24)'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'sourceTypeNeeded', 'enum', 'yes', 'see SOURCE_TYPE values', 'declared before searching'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'source', 'url/text', 'yes (when found)', '', 'never manufactured (§22)'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'evidence', 'text', 'yes (when found)', 'quote/figure/table ref', 'raw support for the claim'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'evidenceClass', 'enum', 'yes (when found)', 'see EVIDENCE_CLASS values', 'evidence typing (§23)'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'confidence', 'enum', 'yes', 'HIGH|MEDIUM|LOW|UNVERIFIED', 'reviewer confidence'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'dateChecked', 'date (ISO)', 'yes (when found)', '', 're-check trigger'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'uncertainty', 'text', 'no', 'species-variable, conflicting sources…', 'honest uncertainty capture (§23)'],
  ['RESEARCH_ITEM_FIELD', 'FIELD', 'editorDecision', 'enum', 'yes', 'ACCEPTED|ACCEPTED_WITH_CAVEAT|REJECTED|PENDING_RESEARCH', 'human gate before content lands'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'ESTABLISHED_FACT', '-', '-', 'peer-reviewed / consensus fact', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'ACCEPTED_HUSBANDRY_RANGE', '-', '-', 'widely accepted aquarium range', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'PRACTICAL_RECOMMENDATION', '-', '-', 'practitioner best practice', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'MANUFACTURER_CLAIM', '-', '-', 'rated/spec claims; never equal to real-world (§15)', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'EXPERT_CONSENSUS', '-', '-', 'specialist agreement without single study', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'SPECIES_VARIABLE', '-', '-', 'differs by population/individual', '§23'],
  ['EVIDENCE_CLASS', 'ENUM_VALUE', 'RESEARCH_NEEDED', '-', '-', 'no usable source yet', '§23'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'SCIENTIFIC_LITERATURE', '-', '-', 'tier 1 preference', '§22 source hierarchy'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'GOVERNMENT_INSTITUTIONAL', '-', '-', 'tier 2', '§22'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'AQUARIUM_ORGANIZATION', '-', '-', 'tier 3 established aquarium organizations', '§22'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'MANUFACTURER_DOCUMENTATION', '-', '-', 'tier 4; product claims only', '§22'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'VETERINARY_AQUATIC_HEALTH', '-', '-', 'tier 5 disease/health claims', '§22'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'SPECIALIST_REFERENCE', '-', '-', 'tier 6 high-quality specialist refs', '§22'],
  ['SOURCE_TYPE', 'ENUM_VALUE', 'COMMUNITY_SUPPLEMENTARY', '-', '-', 'tier 7; supplementary only, never sole evidence', '§22'],
  ['CONFIDENCE', 'ENUM_VALUE', 'HIGH', '-', '-', 'multiple/major source, unambiguous', ''],
  ['CONFIDENCE', 'ENUM_VALUE', 'MEDIUM', '-', '-', 'single good source or consistent secondary', ''],
  ['CONFIDENCE', 'ENUM_VALUE', 'LOW', '-', '-', 'weak/conflicting; publish only with caveat', ''],
  ['CONFIDENCE', 'ENUM_VALUE', 'UNVERIFIED', '-', '-', 'no source yet', ''],
  ['EDITOR_DECISION', 'ENUM_VALUE', 'ACCEPTED / ACCEPTED_WITH_CAVEAT / REJECTED / PENDING_RESEARCH', '-', '-', 'all four permitted; PENDING keeps record honest', 'never manufacture evidence (§22)'],
];

// ---------- build + emit ----------
const DOMAIN_TOTALS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const stop = (msg) => { console.log('STOP CONDITION: ' + msg); process.exit(2); };

const allRows = [];
for (const [domain, rows] of Object.entries(DOMAINS)) {
  for (const r of rows) {
    const [id, layer, repr, target, applic, level, secondary = '', rule = '', note = ''] = r;
    const cov = coverage.get(`${domain}:${id}`);
    if (!cov) stop(`requirement '${domain}:${id}' not found in SPEC 09 requirements — cannot be mapped.`);
    allRows.push({ domain, id, layer, repr, target, applic, level, secondary, rule, note, cov });
  }
}
// set equality vs SPEC 09 (stop condition: any requirement cannot be mapped / unmapped extras)
for (const c of spec09) {
  if (!allRows.some((r) => r.domain === c.domain && r.id === c.requirement))
    stop(`SPEC 09 requirement '${c.domain}:${c.requirement}' has no SPEC 10 architecture decision.`);
}
for (const r of allRows) {
  if (!r.target) stop(`empty representation target for '${r.domain}:${r.id}'.`);
  if (r.applic === 'CONDITIONAL' && !r.rule)
    stop(`CONDITIONAL '${r.domain}:${r.id}' lacks an applicability rule (would misclassify records).`);
}
console.log(`mapped ${allRows.length} requirements across 6 domains (set-equality with SPEC 09 OK)`);

const P_RANK = { P0: 0, P1: 1, P2: 2, P3: 3, NONE: 4, '': 5 };
const sevToPriority = { CRITICAL: 'P0', HIGH: 'P1', MEDIUM: 'P2', LOW: 'P3' };

// ---- 1) KNOWLEDGE_ARCHITECTURE_MATRIX.csv ----
writeCsv('KNOWLEDGE_ARCHITECTURE_MATRIX.csv',
  ['domain', 'requirement', 'label', 'knowledgeLayer', 'primaryRepresentation', 'target', 'secondaryRepresentation', 'applicabilityClass', 'introducedLevel', 'researchGated', 'spec09Priority', 'spec09Severity', 'spec09Covered', 'spec09Partial', 'spec09Missing', 'spec09NA', 'decisionNote'],
  allRows.map((r) => ({
    domain: r.domain, requirement: r.id, label: r.cov.label, knowledgeLayer: r.layer,
    primaryRepresentation: r.repr, target: r.target, secondaryRepresentation: r.secondary,
    applicabilityClass: r.applic, introducedLevel: r.level,
    researchGated: researchKeys.has(`${r.domain}:${r.id}`) ? 'y' : 'n',
    spec09Priority: schemaByKey.get(`${r.domain}:${r.id}`)?.priority || '',
    spec09Severity: r.cov.severity, spec09Covered: r.cov.covered, spec09Partial: r.cov.partial,
    spec09Missing: r.cov.missing, spec09NA: r.cov.na,
    decisionNote: [r.note, r.rule ? `rule: ${r.rule}` : ''].filter(Boolean).join(' | '),
  })));

// ---- 2) APPLICABILITY_MATRIX.csv ----
writeCsv('APPLICABILITY_MATRIX.csv',
  ['domain', 'requirement', 'label', 'applicabilityClass', 'applicabilityRule', 'spec09NA', 'spec09Applicable', 'falseGapControl'],
  allRows.map((r) => ({
    domain: r.domain, requirement: r.id, label: r.cov.label, applicabilityClass: r.applic,
    applicabilityRule: r.rule || (r.applic === 'REQUIRED' ? 'all records in domain' : r.applic === 'OPTIONAL' ? 'editorial judgment; absence is not a gap' : ''),
    spec09NA: r.cov.na,
    spec09Applicable: String(+r.cov.covered + +r.cov.partial + +r.cov.missing + +r.cov.uncertain),
    falseGapControl: r.applic === 'CONDITIONAL' ? `NOT_APPLICABLE when rule false: ${r.rule}` :
      r.applic === 'OPTIONAL' ? 'optional — never counted as gap when absent' :
      r.applic === 'NOT_APPLICABLE' ? 'not a gap by definition (§19)' : 'required for all domain records',
  })));

// ---- 3) FIELD_TO_KNOWLEDGE_MAPPING.csv ----
writeCsv('FIELD_TO_KNOWLEDGE_MAPPING.csv',
  ['document_type', 'field_name', 'field_type', 'knowledgeLayer', 'servedRequirements', 'mappingStatus', 'proposedChange', 'note'],
  fieldMatrix.map((f) => {
    const m = FIELD_MAP[`${f.document_type}.${f.field_name}`] || STRUCTURAL_DEFAULT;
    const proposed = m[2] === 'ADEQUATE' ? 'KEEP' : m[2] === 'STRUCTURAL' ? 'KEEP (structural)' :
      m[2] === 'EXTEND_SEMANTICS' ? 'EXTEND semantics/shape' : 'EXTEND with new decision fields (see architecture matrix)';
    return {
      document_type: f.document_type, field_name: f.field_name, field_type: f.field_type,
      knowledgeLayer: m[0], servedRequirements: m[1], mappingStatus: m[2], proposedChange: proposed, note: m[3],
    };
  }));

// ---- 4) RELATIONSHIP_MODEL.csv ----
writeCsv('RELATIONSHIP_MODEL.csv',
  ['relationshipId', 'sourceDomain', 'targetDomain', 'slotName', 'status', 'relationType', 'direction', 'reciprocityRule', 'evidenceRequirement', 'spec09Reference', 'appliesToRecords', 'notes'],
  REL_MODEL.map((r) => ({
    relationshipId: r[0], sourceDomain: r[1], targetDomain: r[2], slotName: r[3], status: r[4],
    relationType: r[5], direction: r[6], reciprocityRule: r[7], evidenceRequirement: r[8],
    spec09Reference: r[9], appliesToRecords: r[10], notes: r[11],
  })));

// ---- 5) RESEARCH_MODEL.csv ----
writeCsv('RESEARCH_MODEL.csv',
  ['modelElement', 'elementKind', 'name', 'dataType', 'required', 'allowedValues', 'notes'],
  RESEARCH_MODEL.map((r) => ({
    modelElement: r[0], elementKind: r[1], name: r[2], dataType: r[3], required: r[4], allowedValues: r[5], notes: r[6],
  })));

// ---- 6) PRIORITY_MIGRATION_QUEUE.csv ----
const items = [];
const migSeen = new Map();
for (const r of allRows) {
  const key = `${r.domain}|${r.target}`;
  const isMigration = r.repr === 'NEW_FIELD' || (r.repr === 'RELATIONSHIP' && r.target.includes('PROPOSED')) || (r.repr === 'BODY' && r.target.startsWith('newBlock:'));
  if (!isMigration) continue;
  const cleanTarget = r.target.replace(/\s*\(.*\)$/, '');
  const k2 = `${r.domain}|${cleanTarget}`;
  const reg = schemaByKey.get(`${r.domain}:${r.id}`);
  const sev = r.cov.severity;
  if (!migSeen.has(k2)) {
    migSeen.set(k2, {
      domain: r.domain, target: cleanTarget, repr: r.repr === 'NEW_FIELD' ? 'SCHEMA_MIGRATION' : r.repr === 'RELATIONSHIP' ? 'RELATIONSHIP_SLOT' : 'BODY_BLOCK',
      reqs: [], priorities: [], sevs: [],
    });
  }
  const it = migSeen.get(k2);
  it.reqs.push(r.id);
  it.priorities.push(reg?.priority || sevToPriority[sev] || 'P2');
  it.sevs.push(sev);
}
const sevRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
for (const it of migSeen.values()) {
  it.priority = it.priorities.slice().sort((a, b) => P_RANK[a] - P_RANK[b])[0];
  const maxSev = it.sevs.slice().sort((a, b) => sevRank[a] - sevRank[b])[0];
  if (it.domain === 'problem' && it.target === 'newBlock:escalation') it.priority = 'P0'; // §24 known P0
  items.push({
    phase: it.repr === 'RELATIONSHIP_SLOT' ? 'SPEC_12' : 'MIGRATION',
    itemType: it.repr, target: `${it.domain}: ${it.target}`, priority: it.priority,
    affectedRecords: DOMAIN_TOTALS[it.domain], requirementsServed: it.reqs.join('|'),
    dependsOn: '', expectedOutcome: `structurally unblocks ${it.reqs.length} requirement(s) on ${DOMAIN_TOTALS[it.domain]} ${it.domain} records`,
    rationale: `max severity ${maxSev}; ${it.reprs || 'representation per §18 decision rule'}`,
  });
}
// record P0 items (from SPEC 09 record matrix)
const recMatrix = readCsv(path.join('report', 'SPEC_09', 'SPEC_09_RECORD_GAP_MATRIX.csv'));
for (const m of recMatrix.filter((r) => r.recommendedEnrichmentPriority === 'P0')) {
  items.push({
    phase: m.type === 'equipment' ? 'SPEC_13' : 'SPEC_11', itemType: 'RECORD_ENRICHMENT',
    target: `${m.type}: ${m.title} (${m.slug})`, priority: 'P0', affectedRecords: 1,
    requirementsServed: '', dependsOn: m.type === 'species' ? 'space-block + jump/lid schema migration (P0)' : 'equipment body sections',
    expectedOutcome: 'removes CRITICAL status (welfare/safety gaps)',
    rationale: `${m.criticalGapCount} critical, ${m.highGapCount} high gaps (SPEC 09)`,
  });
}
// domain batches (remaining records)
const batchPhase = { species: 'SPEC_11', plant: 'SPEC_13', invertebrate: 'SPEC_13', coral: 'SPEC_13', equipment: 'SPEC_13', problem: 'SPEC_13' };
for (const domain of Object.keys(DOMAINS)) {
  const rows = recMatrix.filter((r) => r.type === domain);
  const p0 = rows.filter((r) => r.recommendedEnrichmentPriority === 'P0').length;
  items.push({
    phase: batchPhase[domain], itemType: 'DOMAIN_BATCH', target: `${domain}: remaining THIN records`,
    priority: 'P1', affectedRecords: rows.length - p0, requirementsServed: '',
    dependsOn: domain === 'species' ? 'space-block migration' : 'domain schema migration',
    expectedOutcome: `raise THIN records toward Level 2 (decision ready)`,
    rationale: `${rows.length - p0} records after P0 wave (SPEC 09 statuses)`,
  });
}
// research batches
const resByDomain = {};
for (const r of researchReg) (resByDomain[r.domain] = resByDomain[r.domain] || []).push(r);
for (const [domain, rows] of Object.entries(resByDomain)) {
  const hasHigh = rows.some((r) => ['CRITICAL', 'HIGH'].includes(r.maxSeverity));
  items.push({
    phase: domain === 'species' ? 'SPEC_11' : 'SPEC_13', itemType: 'RESEARCH_BATCH',
    target: `${domain}: research program (${rows.length} aggregate items)`, priority: hasHigh ? 'P1' : 'P2',
    affectedRecords: DOMAIN_TOTALS[domain], requirementsServed: '',
    dependsOn: 'research model (RESEARCH_MODEL.csv) + editor decisions',
    expectedOutcome: 'fills research-gated gaps with sourced evidence (never model memory)',
    rationale: `source hierarchy §22; evidence classes §23`,
  });
}
const typeRank = { SCHEMA_MIGRATION: 0, BODY_BLOCK: 1, RELATIONSHIP_SLOT: 2, RECORD_ENRICHMENT: 3, DOMAIN_BATCH: 4, RESEARCH_BATCH: 5 };
items.sort((a, b) =>
  (P_RANK[a.priority] - P_RANK[b.priority]) ||
  (typeRank[a.itemType] - typeRank[b.itemType]) ||
  a.target.localeCompare(b.target));
writeCsv('PRIORITY_MIGRATION_QUEUE.csv',
  ['queueId', 'order', 'phase', 'itemType', 'target', 'priority', 'affectedRecords', 'requirementsServed', 'dependsOn', 'expectedOutcome', 'rationale'],
  items.map((it, i) => ({ queueId: `Q-${String(i + 1).padStart(3, '0')}`, order: i + 1, ...it })));

// ---- 7) BODY_ARCHITECTURE.md ----
const bodyMd = `# SPEC 10 — Body Architecture (Layer F)

Long-form knowledge that cannot be safely reduced to a single field (SPEC 10 §17–§18).
Sections are architecture templates, not mandatory prose for every record.

## Decision rule recap (§18)

| Representation | Use when | SPEC 10 example |
|---|---|---|
| Structured field | searchable/filterable/numeric/controlled vocab | \`minTankFootprint {lengthCm,widthCm}\`, \`khMin/khMax\`, \`jumpRisk\` |
| Reference / relationship | another Wiki record is the subject | \`compatibleSpecies\`, \`incompatibleSpecies\`, \`predatorPrey\`, \`coralNeighbors\` |
| Body section | explanation, nuance, exceptions, interacting factors | "why footprint matters", "how to acclimate coral light", "judge practical filter capacity" |

Worked examples: butterflyfish reef risk = \`reefInteraction\` enum (field) + monitoring narrative (body), NOT a bare boolean;
heater safety = \`ratedCapacity\` (field, manufacturer claim) + \`body:safety\` (practical limitation) — two sources with distinct semantics, not duplicates.

## Species / Fish (12 sections)

\`\`\`
Overview
Adult Size & Growth
Behavior
Tank Requirements
Swimming Space & Footprint
Water Parameters
Feeding
Compatibility
Special Requirements
Common Problems
Breeding (where applicable)
Practical Verdict
\`\`\`

Structured backing: sizeCm, tankSizeMinL, minTankLengthCm + minTankWidthCm (the footprint), swimmingSpace, jumpRisk, lidRequired, temp/ph/gh (+ proposed kh/salinity), maturityRequirement, bioload, behaviorFlags, compatibleSpecies/incompatibleSpecies.

## Coral (12 sections)

\`\`\`
Overview
Placement
Lighting & PAR
Flow
Water Chemistry
Nutrition
Growth
Aggression & Spacing
Compatibility
Common Problems
Acclimation
Practical Verdict
\`\`\`

Structured backing: light (+ proposed par), flow (+ proposed flowPattern), temp (+ proposed salinity/ph/dkh/ca/mg/no3/po4), photosynthetic/feedingType, aggression/aggressionTraits, spacing, reefCompatibility, relatedProblems.

## Plant (11 sections)

\`\`\`
Overview
Light
CO2
Nutrients
Substrate
Placement
Growth & Trimming
Water Parameters
Common Deficiencies
Algae Sensitivity
Practical Verdict
\`\`\`

Structured backing: light, co2, fertilizationPlan, substrateType, feedingMode, placement, growth, propagation, heightCm/spreadCm, temp/ph (+ optional gh/kh).

## Invertebrate (11 sections)

\`\`\`
Overview
Tank Requirements
Water Parameters
Diet & Feeding
Molting / Growth
Compatibility
Predators
Maturity / Biofilm
Breeding
Common Problems
Practical Verdict
\`\`\`

Structured backing: minTankVolumeL, temp/ph (+ salinity when marine), diet, moltingType, calciumRequirement, maturityRequirement, biofilmRequirement, riskFlags, temperament, reefCompatibility.

## Equipment (10 sections)

\`\`\`
What It Does
Specifications
Real-World Capacity
Best Use
Limitations
Compatibility
Maintenance
Failure Modes
Safety
Practical Verdict
\`\`\`

Structured backing: category, waterType, tankSizeMinL/MaxL, flowRateLh, powerW, ratedCapacity (proposed), pros/cons, compatibleEquipment (proposed), relatedProblems (proposed).

## Problem (8 sections)

\`\`\`
What It Looks Like
Likely Causes
What to Check First
Immediate Action
Treatment / Correction
What Not to Do
Prevention
Escalation
\`\`\`

Structured backing: symptoms, causes, whatToCheck, whatNotToDo (existing blocks) + proposed blocks: howToDistinguish, immediateAction, treatment, recovery, prevention, monitoring, escalation.

## Quality rules

- Every section template must be fillable without inventing facts (research-gated items flagged in the architecture matrix).
- Never duplicate the same fact across field and body without distinct semantics (§29 contradiction rule).
- "Practical Verdict" is mandatory at Level 2+ (decision-oriented summary, §3).
`;
fs.writeFileSync(path.join(OUT, 'BODY_ARCHITECTURE.md'), bodyMd);
console.log('wrote BODY_ARCHITECTURE.md');

// ---- 8) COMPLETENESS_LEVELS.md ----
const levelsMd = `# SPEC 10 — Completeness Levels (measurable gates)

Levels are evaluated per record by future enrichment validators. NOT_APPLICABLE requirements (rule false) are excluded from every gate (§19).

## Universal gates

| Level | Gate |
|---|---|
| **L0 — Identification only** | \`name\` + \`scientificName\` + \`slug\` + domain identity key (species: \`sizeCm\`; problem: \`title\`+category). Cannot support any husbandry decision. |
| **L1 — Basic usable** | L0 + core care scalars: temperature range, pH range, min tank volume (species/invertebrate/equipment: tank size range), diet, temperament/difficulty. Reader knows *what it is* + *roughly what it needs*. |
| **L2 — Decision ready** | L1 + all REQUIRED-L2 targets present (see matrix \`introducedLevel=L2\`): species space block (footprint/length/width/swimmingSpace/jumpRisk/lidRequired), maturity/bioload, ≥1 compatible AND ≥1 incompatible relation or explicit negative-knowledge note, body ≥8/12 sections incl. Practical Verdict. Reader can decide *"does it fit my tank?"* |
| **L3 — Advanced husbandry** | L2 + CONDITIONAL-applicable behavior flags resolved, water-change/bioload sensitivity, full body template (≥10/12 species; domain equivalents), troubleshooting links ≥3, acclimation/stability sections, breeding sections where applicable, problem: all 8 sections. Context-dependent decisions supported. |
| **L4 — Expert reference** | L3 + research provenance: every research-gated target has source+evidence+confidence+editorDecision; relationship network depth (≥5 verified compatible entries, predator/prey resolved where applicable); PAR/advanced numerics annotated with evidenceClass; edge cases documented. Never false precision (§23). |

## Per-domain L2 gate highlights

| Domain | Mandatory L2 structured targets (REQUIRED + level L2) |
|---|---|
| species | minTankLengthCm, minTankWidthCm (footprint = length x width), swimmingSpace, jumpRisk, lidRequired, flowPreference, oxygenSensitivity, maturityRequirement, waterChangeSensitivity, bioload, communitySuitability, behaviorFlags(territorial,solitary,timid), schooling(groupSize), relations: compatible+incompatible |
| plant | lightIntensity-body section, photoperiod, fertilizationPlan, substrateType/feedingMode (when rule true), heightCm, spreadCm, space body section |
| invertebrate | minTankVolumeL, stabilityRequirement, calciumRequirement (when rule true), moltingType (when rule true), maturityRequirement, biofilmRequirement (when rule true), riskFlags[STARVATION], molting body (when rule true) |
| coral | growthForm, salinity/ph/dkh/ca ranges, stability body, feedingType, spacing, reef-caveats body, acclimation body, bleaching/STN-RTN bodies, aggressionTraits (sweeper) |
| equipment | waterType, real-world-capacity + when-inadequate + failure-modes + cleaning safety bodies, suitable tank size |
| problem | existing 4 blocks + new howToDistinguish, immediateAction, treatment, prevention, escalation blocks |

## Audience coverage (§21)

| Audience | Must answer | Satisfied at |
|---|---|---|
| Beginner | Can I keep it? / how big a tank? / what water? / what does it eat? / is it easy? / what can go wrong? | **L1** (identification+core) + species **L2 space block** (tank-fit safety) |
| Intermediate | Why this setup? / compatibility constraints / behavior→stocking / parameters that matter / equipment / maintenance pattern | **L2** (relations, bioload, maturity, body sections, troubleshooting links) |
| Advanced | Adult growth & long-term planning / advanced chemistry / behavioral ecology / species-specific compatibility / breeding / specialized nutrition / disease nuance / equipment optimization / reef interactions / edge cases | **L3 + L4** (full body, conditional flags, research provenance, relationship depth) |

## Dangerous-gap preservation (§24)

Any record carrying an unresolved P0 item (large-fish dimensions/footprint/swimming, jumping/lid, compatibility, predator/prey, invertebrate predation, molting, mature/biofilm, coral chemistry, problem escalation, heater safety) **cannot pass L2** regardless of other content.
`;
fs.writeFileSync(path.join(OUT, 'COMPLETENESS_LEVELS.md'), levelsMd);
console.log('wrote COMPLETENESS_LEVELS.md');

// ---- summary for report/validate ----
const reprCounts = {};
const applicCounts = {};
const levelCounts = {};
for (const r of allRows) {
  reprCounts[r.repr] = (reprCounts[r.repr] || 0) + 1;
  applicCounts[r.applic] = (applicCounts[r.applic] || 0) + 1;
  levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
}
const summary = {
  requirements: allRows.length, reprCounts, applicCounts, levelCounts,
  migrationItems: items.filter((i) => ['SCHEMA_MIGRATION', 'BODY_BLOCK', 'RELATIONSHIP_SLOT'].includes(i.itemType)).length,
  schemaMigration: items.filter((i) => i.itemType === 'SCHEMA_MIGRATION').length,
  bodyBlocks: items.filter((i) => i.itemType === 'BODY_BLOCK').length,
  relSlots: items.filter((i) => i.itemType === 'RELATIONSHIP_SLOT').length,
  recordP0: items.filter((i) => i.itemType === 'RECORD_ENRICHMENT').length,
  queueTotal: items.length,
  priority: items.reduce((a, i) => (a[i.priority] = (a[i.priority] || 0) + 1, a), {}),
  researchGated: allRows.filter((r) => researchKeys.has(`${r.domain}:${r.id}`)).length,
  fieldMapStatus: fieldMatrix.reduce((a, f) => { const s = (FIELD_MAP[`${f.document_type}.${f.field_name}`] || STRUCTURAL_DEFAULT)[2]; a[s] = (a[s] || 0) + 1; return a; }, {}),
};
fs.writeFileSync('C:/Users/lam72/AppData/Local/Temp/opencode/spec10_arch_summary.json', JSON.stringify(summary, null, 1));
console.log('SUMMARY:', JSON.stringify(summary));
console.log('ARCHITECTURE BUILD PASS');

