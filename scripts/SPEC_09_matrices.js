// SPEC 09 — domain requirement matrices (§5) built from schema inventory + brief.
// READ-ONLY audit support code. Each requirement exposes:
//   id, label, sev, slot, recurring, applic(rec), sevBy(rec), eval(type, rec) -> {cov, fe, be, re, why}
// slot semantics drives gapType (§14): field/pair/fieldbody -> CONTENT/BODY,
// rel/relbody -> RELATIONSHIP, body/none + recurring -> SCHEMA, else BODY.
const CV = {
  COVERED: 'COVERED',
  PARTIAL: 'PARTIALLY_COVERED',
  MISSING: 'MISSING',
  NA: 'NOT_APPLICABLE',
  UNC: 'UNCERTAIN / REQUIRES_RESEARCH',
};

// ---------- text helpers ----------
const bt = (blocks) => (blocks || []).map((b) => (b.children || []).map((c) => c.text || '').join(' ')).join(' ');
function bodyParts(type, r) {
  switch (type) {
    case 'species': return [['excerpt', r.excerpt], ['schooling', r.schooling], ['origin', r.origin]];
    case 'plant': return [['excerpt', r.excerpt], ['propagation', r.propagation]];
    case 'invertebrate': return [['excerpt', r.excerpt], ['origin', r.origin]];
    case 'coral': return [['excerpt', r.excerpt]];
    case 'equipment': return [['excerpt', r.excerpt], ['pros', (r.pros || []).join('; ')], ['cons', (r.cons || []).join('; ')]];
    case 'problem': return [['excerpt', r.excerpt], ['symptoms', bt(r.symptoms)], ['causes', bt(r.causes)], ['whatToCheck', bt(r.whatToCheck)], ['whatNotToDo', bt(r.whatNotToDo)]];
    default: return [['excerpt', r.excerpt]];
  }
}
function bodyText(type, r) {
  return bodyParts(type, r).filter(([, v]) => v).map(([, v]) => String(v)).join(' \u2014 ');
}
function matchBody(type, r, re) {
  for (const [field, v] of bodyParts(type, r)) {
    if (!v) continue;
    const s = String(v);
    if (re.test(s)) {
      const sentences = s.split(/(?<=[.!?;])\s+/);
      const hit = sentences.find((x) => re.test(x)) || s;
      return `body:${field}:"${hit.trim().slice(0, 150)}"`;
    }
  }
  return null;
}
const fv = (k, v) => `field:${k}=${Array.isArray(v) ? v.length + 'refs' : v}`;
const has = (r, k) => r[k] !== undefined && r[k] !== null && r[k] !== '';

// ---------- requirement builders ----------
const reqField = (id, label, sev, keys, opts = {}) => ({
  id, label, sev, slot: 'field', recurring: false, ...opts,
  eval: (type, r) => {
    const fe = keys.filter((k) => has(r, k)).map((k) => fv(k, r[k]));
    return { cov: fe.length ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: fe.length ? 'structured value present' : `no value in ${keys.join('/')}` };
  },
});
const reqPair = (id, label, sev, k1, k2, opts = {}) => ({
  id, label, sev, slot: 'pair', recurring: false, ...opts,
  eval: (type, r) => {
    const a = has(r, k1), b = has(r, k2);
    const fe = [a ? fv(k1, r[k1]) : null, b ? fv(k2, r[k2]) : null].filter(Boolean);
    const cov = a && b ? CV.COVERED : (a || b ? CV.PARTIAL : CV.MISSING);
    return { cov, fe, be: [], re: [], why: cov === CV.COVERED ? 'both endpoints present' : cov === CV.PARTIAL ? `partial range (only ${a ? k1 : k2})` : 'range absent' };
  },
});
const reqBody = (id, label, sev, re, opts = {}) => ({
  id, label, sev, slot: 'body', recurring: false, ...opts,
  eval: (type, r) => {
    const be = matchBody(type, r, re);
    return { cov: be ? CV.COVERED : CV.MISSING, fe: [], be: be ? [be] : [], re: [], why: be ? 'narrative text communicates the topic' : 'no narrative text on topic' };
  },
});
const reqRel = (id, label, sev, key, opts = {}) => ({
  id, label, sev, slot: 'rel', recurring: false, ...opts,
  eval: (type, r) => {
    const n = Array.isArray(r[key]) ? r[key].length : 0;
    return { cov: n > 0 ? CV.COVERED : CV.MISSING, fe: [], be: [], re: n > 0 ? [`rel:${key}=${n}refs`] : [], why: n > 0 ? `${n} relationship refs present` : `relationship array ${key} empty/absent` };
  },
});
const reqFieldBody = (id, label, sev, keys, re, opts = {}) => ({
  id, label, sev, slot: 'fieldbody', recurring: false, ...opts,
  eval: (type, r) => {
    const fe = keys.filter((k) => has(r, k)).map((k) => fv(k, r[k]));
    const be = matchBody(type, r, re);
    const cov = fe.length && be ? CV.COVERED : (fe.length || be ? CV.PARTIAL : CV.MISSING);
    return { cov, fe, be: be ? [be] : [], re: [], why: cov === CV.COVERED ? 'field + narrative both present' : fe.length ? 'structured value present but narrative depth missing' : be ? 'narrative only' : 'neither field nor narrative' };
  },
});
const reqRelBody = (id, label, sev, key, re, opts = {}) => ({
  id, label, sev, slot: 'relbody', recurring: false, ...opts,
  eval: (type, r) => {
    const n = Array.isArray(r[key]) ? r[key].length : 0;
    const be = matchBody(type, r, re);
    const cov = n > 0 ? CV.COVERED : (be ? CV.PARTIAL : CV.MISSING);
    const reEv = n > 0 ? [`rel:${key}=${n}refs`] : [];
    return { cov, fe: [], be: be ? [be] : [], re: reEv, why: n > 0 ? 'relationship refs present' : be ? 'narrative mention only (no refs)' : 'no refs, no narrative' };
  },
});
const reqCustom = (id, label, sev, slot, fn, opts = {}) => ({ id, label, sev, slot, recurring: false, ...opts, eval: fn });

// ---------- applicability signals ----------
const isArowana = (r) => String(r.group || '').toLowerCase() === 'arowana' || /arowana/i.test(r.name || '');

// ================= SPECIES MATRIX (§5.1) =================
const speciesReqs = [
  reqField('common_name', 'Common name', 'LOW', ['name']),
  reqField('scientific_name', 'Scientific name', 'LOW', ['scientificName']),
  reqCustom('taxonomic_context', 'Taxonomic context (family + group)', 'LOW', 'field', (t, r) => {
    const n = (has(r, 'family') ? 1 : 0) + (has(r, 'group') ? 1 : 0);
    const fe = [has(r, 'family') ? fv('family', r.family) : null, has(r, 'group') ? fv('group', r.group) : null].filter(Boolean);
    return { cov: n === 2 ? CV.COVERED : n === 1 ? CV.PARTIAL : CV.MISSING, fe, be: [], re: [], why: `${n}/2 taxonomy fields present` };
  }),
  reqCustom('natural_distribution', 'Natural distribution', 'MEDIUM', 'field', (t, r) => {
    const n = (has(r, 'origin') ? 1 : 0) + (has(r, 'region') ? 1 : 0);
    const fe = [has(r, 'origin') ? fv('origin', r.origin) : null, has(r, 'region') ? fv('region', r.region) : null].filter(Boolean);
    return { cov: n === 2 ? CV.COVERED : n === 1 ? CV.PARTIAL : CV.MISSING, fe, be: [], re: [], why: `${n}/2 distribution fields present` };
  }),
  reqFieldBody('habitat', 'Natural habitat description', 'MEDIUM', ['origin'], /(river|stream|lake|floodplain|estuary|mangrove|swamp|pond|blackwater|clearwater|soft water|flowing|current|rapids|deep|shallow|benthic|pelagic|weeds?|dense vegetation)/i),

  reqField('adult_size', 'Adult size', 'HIGH', ['sizeCm']),
  reqBody('growth_expectations', 'Growth expectations', 'MEDIUM', /(grow(s)? (fast|quickly|large|big)|growth rate|reaches?|adult size in)/i, { recurring: true }),
  reqBody('juvenile_vs_adult', 'Juvenile vs adult differences', 'MEDIUM', /(juvenile|sub-adult|young (fish|ones)|adult (color|colour|pattern)|grow.?out|transition to adult)/i, { recurring: true }),
  reqFieldBody('adult_footprint', 'Adult footprint implications (volume != footprint)', 'HIGH', ['tankSizeMinL'], /(footprint|tank length|too (small|short|narrow)|swimming space|long tank|wide tank|floor space)/i, {
    recurring: true, sevBy: (r) => ((r.sizeCm || 0) >= 60 ? 'CRITICAL' : null),
  }),
  reqBody('growth_tank_transition', 'Growth-related tank transition guidance', 'MEDIUM', /(upgrade|larger tank|outgrow|move to a bigger|plan for a bigger)/i, { recurring: true }),

  reqPair('temperature', 'Temperature range', 'HIGH', 'tempMinC', 'tempMaxC'),
  reqPair('ph', 'pH range', 'MEDIUM', 'phMin', 'phMax'),
  reqPair('gh', 'GH range', 'MEDIUM', 'ghMin', 'ghMax'),
  reqBody('kh', 'KH / carbonate hardness', 'MEDIUM', /\bKH\b|carbonate hardness/i, { recurring: true }),
  reqBody('salinity', 'Salinity / brackish-marine chemistry', 'HIGH', /(salinity|specific gravity|\bSG\b|brackish|ppt)/i, {
    recurring: true, applic: (r) => r.waterType !== 'freshwater', naWhy: 'freshwater species — salinity not applicable',
  }),
  reqBody('species_specific_chemistry', 'Other species-specific chemistry sensitivities', 'MEDIUM', /(copper|medicat|sensitiv|zero nitrate|ammonia|chlorine|chloramine|osmotic)/i),

  reqField('min_tank_volume', 'Minimum tank volume', 'HIGH', ['tankSizeMinL']),
  reqBody('min_tank_dimensions', 'Minimum tank dimensions / length', 'HIGH', /(tank (length|must be)|minimum length|\d{2,4}\s*cm (long|minimum)|at least \d{2,4}\s*cm)/i, {
    recurring: true, sevBy: (r) => ((r.sizeCm || 0) >= 60 ? 'CRITICAL' : null),
  }),
  reqBody('tank_footprint', 'Tank footprint / width requirement', 'HIGH', /(footprint|tank width|wide tank|width of|side-to-side)/i, {
    recurring: true, sevBy: (r) => ((r.sizeCm || 0) >= 60 ? 'CRITICAL' : null),
  }),
  reqBody('swimming_space', 'Swimming space / uninterrupted swimming area', 'HIGH', /(open water|swimming (space|area|length)|long (tank|runs)|uninterrupted|room to (swim|turn))/i, {
    recurring: true, sevBy: (r) => ((r.sizeCm || 0) >= 60 ? 'CRITICAL' : null),
  }),
  reqBody('open_water_requirement', 'Open-water requirement', 'MEDIUM', /(open water|open-water)/i, { recurring: true }),
  reqBody('bottom_area', 'Bottom area requirement', 'MEDIUM', /(bottom|substrate area|sandy bottom|bury)/i, {
    recurring: true, applic: (r) => r.waterZone === 'Bottom', naWhy: 'not a bottom-dwelling record (waterZone)',
  }),
  reqCustom('vertical_space', 'Vertical space requirement', 'MEDIUM', 'none', () => ({ cov: CV.NA, fe: [], be: [], re: [], why: 'no record-level signal; dimension needs assessed under tank dimension requirements' })),
  reqBody('hiding_structures', 'Hiding structures requirement', 'MEDIUM', /(hiding|cave|rockwork|cover|retreat)/i, {
    applic: (r) => r.waterZone === 'Bottom' || /cave|hiding|shy|timid/i.test(bodyText('species', r)),
    naWhy: 'no signal of cave/hiding dependence',
  }),
  reqBody('jumping_risk', 'Escape / jumping risk', 'HIGH', /\bjump/i, {
    recurring: true, sevBy: (r) => (isArowana(r) ? 'CRITICAL' : null),
  }),
  reqBody('lid_requirement', 'Lid / cover requirement', 'HIGH', /\b(lid|hood|canopy|covered top|tight-fitting cover|jump-proof)\b/i, {
    recurring: true, sevBy: (r) => (isArowana(r) ? 'CRITICAL' : null),
  }),
  reqBody('flow_requirement', 'Flow / current requirement', 'MEDIUM', /\bflow\b|water current|current-/i, { recurring: true }),
  reqBody('oxygenation', 'Oxygenation requirement', 'HIGH', /(oxygen|aerat|well-oxygenated|surface agitation|bubble)/i, { recurring: true }),
  reqBody('mature_aquarium', 'Mature / established aquarium requirement', 'HIGH', /(mature|established tank|cycled|biofilm|old filter media)/i),

  reqField('temperament', 'Temperament', 'HIGH', ['temperament']),
  reqBody('territoriality', 'Territoriality', 'HIGH', /territor/i),
  reqFieldBody('schooling', 'Schooling / shoaling requirement', 'HIGH', ['schooling'], /(school|shoal|group of|groups|pairs|alone|single|solo)/i),
  reqBody('solitary', 'Solitary behavior', 'MEDIUM', /(solitary|alone|single fish|not with its own kind|conspecific)/i),
  reqCustom('predator', 'Predator status', 'HIGH', 'fieldbody', (t, r) => {
    const fe = r.isPredator !== undefined ? [fv('isPredator', r.isPredator)] : [];
    const be = matchBody(t, r, /(predator|preys? on|hunts|ambush)/i);
    const cov = fe.length || be ? CV.COVERED : CV.MISSING;
    return { cov, fe, be: be ? [be] : [], re: [], why: fe.length ? 'isPredator flag communicates status' : be ? 'narrative mentions predation' : 'predator status absent' };
  }),
  reqField('diet_type', 'Diet', 'HIGH', ['diet']),
  reqBody('nocturnal', 'Nocturnal behavior', 'MEDIUM', /(nocturnal|at night|nighttime|after dark)/i),
  reqBody('diurnal', 'Diurnal / daytime behavior', 'LOW', /(diurnal|during the day|daytime|in daylight)/i),
  reqBody('burrower', 'Burrowing behavior', 'MEDIUM', /(burrow|digs? (into|in)|sifts? (the|through))/i),
  reqBody('cave_dependent', 'Cave dependence', 'MEDIUM', /\bcave/i),
  reqBody('open_water_swimmer', 'Open-water swimmer behavior', 'MEDIUM', /(open water|open-water)/i),
  reqBody('strong_swimmer', 'Strong swimmer behavior', 'MEDIUM', /(strong|powerful|fast|endless) swim/i),
  reqBody('timid', 'Timid / skittish behavior', 'MEDIUM', /(timid|shy|skittish|nervous|easily stressed)/i),
  reqCustom('community_suitability', 'Community suitability', 'HIGH', 'fieldbody', (t, r) => {
    const fe = has(r, 'temperament') ? [fv('temperament', r.temperament)] : [];
    const be = matchBody(t, r, /(community tank|tankmate|peaceful with|good tankmate|compatible with other fish)/i);
    const cov = be ? CV.COVERED : fe.length ? (r.temperament === 'Aggressive' ? CV.COVERED : CV.PARTIAL) : CV.MISSING;
    return { cov, fe, be: be ? [be] : [], re: [], why: be ? 'narrative describes community behavior' : fe.length ? 'temperament enum only' : 'no temperament/narrative' };
  }),

  reqBody('feeding_frequency', 'Feeding frequency (if meaningful)', 'LOW', /(feed (once|twice|2-3|three)|twice a day|daily feeding|2-3 times)/i),
  reqBody('feeding_method', 'Feeding type / foods accepted', 'MEDIUM', /(flake|pellet|frozen|live food|brine shrimp|bloodworm|wafers?|granules?|veggie)/i),
  reqBody('juvenile_adult_diet', 'Juvenile/adult dietary differences', 'MEDIUM', /(juvenile|fry|babies|grow.?out|young (fish|ones))/i, { recurring: true }),
  reqBody('special_nutrition', 'Special nutritional requirements', 'MEDIUM', /(obligate|picky|only eats?|refuses|speciali[sz]ed diet|sponge feeder|special diet)/i),
  reqBody('feeding_competition', 'Feeding competition', 'MEDIUM', /(compet\w* (for|food)|outcompete|fast eater|aggressive eater)/i, { recurring: true }),
  reqBody('predatory_feeding_behavior', 'Predatory feeding behavior', 'MEDIUM', /(ambush|hunts?|predatory|strikes?|chase)/i, {
    applic: (r) => r.isPredator === true || r.diet === 'Carnivore', naWhy: 'not flagged/dieted as predator',
  }),

  reqRelBody('compatible_tankmates', 'Compatible tankmates (relationship)', 'HIGH', 'compatibleSpecies', /(tankmate|community fish|peaceful with|gets along|can be kept with)/i),
  reqBody('incompatible_tankmates', 'Incompatible tankmates / must-avoid combinations', 'HIGH', /(incompatible|do not keep|avoid (keeping|with)|not (to be )?kept with|will attack|predates on)/i, { recurring: true }),
  reqBody('size_based_predation', 'Size-based predation risk', 'HIGH', /(eats? (small|young)\b|swallow|ingest\w* small|preys? on small|too large to eat)/i, {
    applic: (r) => r.isPredator === true || r.diet === 'Carnivore', naWhy: 'not flagged/dieted as predator',
  }),
  reqBody('territorial_conflicts', 'Territorial conflicts', 'MEDIUM', /territor/i),
  reqBody('fin_nipping', 'Fin-nipping risk', 'HIGH', /fin[- ]?(nip|nipp)|nips? (at )?fins/i),
  reqBody('compatibility_competition', 'Competition for resources', 'MEDIUM', /compet\w+|rival|fight over/i),
  reqCustom('compat_warnings', 'Special compatibility warnings', 'HIGH', 'fieldbody', (t, r) => {
    const fe = r.reefCompatibility !== undefined ? [fv('reefCompatibility', r.reefCompatibility)] : [];
    const be = matchBody(t, r, /(caution|warning|avoid|not recommended|with care|aggressive toward)/i);
    const cov = be ? CV.COVERED : fe.length ? CV.PARTIAL : CV.MISSING;
    return { cov, fe, be: be ? [be] : [], re: [], why: be ? 'narrative warning present' : fe.length ? 'coarse boolean only' : 'no warning signal' };
  }),
  reqCustom('coral_interaction', 'Coral interaction / reef safety depth (§7C)', 'HIGH', 'fieldbody', (t, r) => {
    const fe = r.reefCompatibility !== undefined ? [fv('reefCompatibility', r.reefCompatibility)] : [];
    const be = matchBody(t, r, /(coral|polyp|reef)/i);
    const riskAction = matchBody(t, r, /(nip|pick|eat|graze|bite|predat\w+).{0,40}(coral|polyp)|(coral|polyp).{0,40}(nip|pick|eat|graze|bite)/i);
    const strongDetail = matchBody(t, r, /(sps|lps|soft coral|mushroom|anemone|palythoa|zoanthid).{0,60}(risk|damage|eat|nip|at risk)|will (eat|nip)|often (nip|eat)|known to (eat|nip)|consumes?.{0,20}(polyp|coral)/i);
    const cov = fe.length && riskAction && strongDetail ? CV.COVERED : (fe.length || riskAction || be) ? CV.PARTIAL : CV.MISSING;
    const why = cov === CV.COVERED ? 'reef flag + predation action + species/degree detail'
      : fe.length && (riskAction || be) ? 'reef flag + brief narrative — does not explain what it consumes, coral types at risk, or degree of risk (§7C)'
      : fe.length ? 'boolean reef flag only — no explanation of why compatibility is poor (§7C)'
      : riskAction ? 'narrative risk only, no reef flag' : 'no reef interaction signal';
    return { cov, fe, be: be ? [be] : [], re: [], why };
  }, { applic: (r) => r.waterType === 'saltwater', naWhy: 'freshwater record' }),
  reqBody('invertebrate_predation', 'Invertebrate predation risk', 'HIGH', /((shrimp|snail|prawn|crab|crayfish|lobster)s? .{0,30}(eat|prey|food)|eats? (shrimp|snails?|prawns?)|predator of (shrimp|snails))/i, {
    applic: (r) => r.isPredator === true || r.diet === 'Carnivore', naWhy: 'not flagged/dieted as predator',
  }),

  reqBody('water_change_sensitivity', 'Water-change sensitivity', 'HIGH', /water change/i),
  reqBody('waste_bioload', 'Waste production / bioload', 'MEDIUM', /(bioload|waste|messy|heavy bioload|polluters?)/i),
  reqCustom('maintenance_burden', 'Maintenance burden', 'MEDIUM', 'fieldbody', (t, r) => {
    const fe = has(r, 'difficulty') ? [fv('difficulty', r.difficulty)] : [];
    const be = matchBody(t, r, /(easy to keep|low maintenance|high maintenance|demanding|requires experience)/i);
    const cov = be ? CV.COVERED : fe.length ? CV.PARTIAL : CV.MISSING;
    return { cov, fe, be: be ? [be] : [], re: [], why: be ? 'narrative burden guidance' : fe.length ? 'difficulty enum only' : 'no signal' };
  }),
  reqBody('special_husbandry', 'Special husbandry requirements', 'LOW', /(special care|particular care|extra (care|attention)|needs? extra)/i),

  reqBody('sexual_differences', 'Sexual differences (where useful)', 'MEDIUM', /(\bmales?\b|\bfemales?\b|sex(ual)? (difference|dimorphism))/i),
  reqBody('spawning_behavior', 'Spawning behavior', 'MEDIUM', /(spawn|spawning|breeding|egg laying|lays eggs)/i),
  reqBody('breeding_difficulty', 'Breeding difficulty', 'MEDIUM', /(breed (easily|readily|hard|difficult|in captivity)|easy to breed|hard to breed|never bred)/i, { recurring: true }),
  reqBody('breeding_requirements', 'Breeding special requirements', 'MEDIUM', /(breeding (tank|setup|mop|condition)|condition (them|for)|fry food|hormone|pea mops?)/i, { recurring: true }),
];

// ================= PLANT MATRIX (§5.2) =================
const plantReqs = [
  reqField('common_name', 'Common name', 'LOW', ['name']),
  reqField('scientific_name', 'Scientific name', 'LOW', ['scientificName']),
  reqField('plant_type', 'Plant type / group', 'MEDIUM', ['group']),
  reqField('growth_form_plant', 'Growth form', 'MEDIUM', ['growthForm']),
  reqFieldBody('natural_habitat_plant', 'Natural habitat', 'MEDIUM', ['region'], /(stream|river|marsh|ditch|forest|jungle|terrestrial|marshy|wetland|paddy)/i),

  reqField('light_requirement', 'Light requirement (qualitative)', 'HIGH', ['light']),
  reqBody('light_intensity', 'Light intensity / acclimation guidance', 'MEDIUM', /(intensity|too (much|strong|bright) light|moderate light|par\b)/i, {
    recurring: true, sevBy: (r) => (['High', 'Medium-High'].includes(r.light) ? 'HIGH' : null),
  }),
  reqBody('par', 'PAR guidance', 'MEDIUM', /\bPAR\b/i, {
    recurring: true, sevBy: (r) => (['High', 'Medium-High'].includes(r.light) ? 'HIGH' : null),
  }),
  reqBody('photoperiod', 'Photoperiod considerations', 'MEDIUM', /(photoperiod|hours of light|\d+\s*(-|to)?\s*\d*\s*h\b|lighting schedule)/i, { recurring: true }),
  reqBody('light_acclimation', 'Light acclimation (transition)', 'MEDIUM', /(acclimat\w+|adapt\w* (to|gradually)|gradually (increase|adjust)|too much light at first)/i),

  reqField('co2_requirement', 'CO2 requirement', 'HIGH', ['co2']),
  reqCustom('low_tech_suitability', 'Low-tech suitability', 'MEDIUM', 'field', (t, r) => {
    if (!has(r, 'co2')) return { cov: CV.MISSING, fe: [], be: [], re: [], why: 'no CO2 value' };
    const cov = r.co2 === 'None' ? CV.COVERED : r.co2 === 'Low' ? CV.PARTIAL : CV.COVERED;
    return { cov, fe: [fv('co2', r.co2)], be: [], re: [], why: r.co2 === 'None' ? 'explicitly CO2-free' : r.co2 === 'Low' ? 'Low CO2 — low-tech margin unclear' : 'CO2 dependency communicated' };
  }),
  reqBody('co2_response', 'CO2 response / low-tech behavior', 'MEDIUM', /(without CO2|responds to CO2|CO2 makes|melts without|grow(s)? slower without)/i),

  reqBody('macro_nutrients', 'Macro nutrients', 'MEDIUM', /(nitrate|phosphate|potassium|macro[- ]?nutrient|NPK)/i, { recurring: true }),
  reqBody('micro_nutrients', 'Micro nutrients / trace elements', 'MEDIUM', /(micro[- ]?nutrient|trace (element|mineral)|iron|manganese)/i, { recurring: true }),
  reqBody('root_vs_water_column', 'Root feeding vs water-column feeding', 'MEDIUM', /(root (feeder|feeding|feed|tab|uptake)|water column|absorb\w* through roots)/i, {
    recurring: true,
    applic: (r) => !['Epiphyte', 'Moss', 'Fern', 'Floating'].includes(r.group) && r.placement !== 'Epiphyte' && r.placement !== 'Floating',
    naWhy: 'epiphyte/moss/fern/floating — not substrate-rooted',
  }),
  reqBody('substrate_requirements', 'Substrate requirements', 'HIGH', /(substrate|aquarium soil|nutrient soil|sand|gravel|root tab)/i, {
    recurring: true,
    applic: (r) => !['Epiphyte', 'Moss', 'Fern', 'Floating'].includes(r.group) && r.placement !== 'Epiphyte' && r.placement !== 'Floating',
    naWhy: 'epiphyte/moss/fern/floating — attaches to hardscape or floats, substrate not required',
  }),
  reqBody('fertilization', 'Fertilization implications', 'HIGH', /(fertiliz\w+|dosing|dose|liquid fert|root tabs?|complete fertilizer)/i, { recurring: true }),
  reqBody('deficiency_sensitivity', 'Deficiency sensitivity', 'MEDIUM', /(deficien\w+|yellowing|pinhole|stunted|chlorosis)/i, { recurring: true }),

  reqPair('temperature_plant', 'Temperature range', 'MEDIUM', 'tempMinC', 'tempMaxC'),
  reqPair('ph_plant', 'pH range', 'MEDIUM', 'phMin', 'phMax'),
  reqBody('gh_plant', 'GH preference', 'MEDIUM', /\bGH\b|general hardness/i, { recurring: true }),
  reqBody('kh_plant', 'KH preference', 'MEDIUM', /\bKH\b|carbonate hardness/i, { recurring: true }),

  reqField('placement', 'Placement (fore/mid/back/floating/epiphyte)', 'MEDIUM', ['placement']),
  reqBody('epiphyte_attachment', 'Epiphyte / hardscape attachment', 'MEDIUM', /(attach\w* to (wood|rock)|epiphyte|tie (down|to)|glue to|grow(s)? on (wood|rock))/i, {
    applic: (r) => r.group === 'Epiphyte' || r.placement === 'Epiphyte' || r.group === 'Moss' || r.group === 'Fern',
    naWhy: 'not an epiphyte/moss/fern record',
  }),
  reqBody('space_requirements_plant', 'Space requirements / spread room', 'MEDIUM', /(spread|fills in|room to grow|space between|trim to keep)/i, { recurring: true }),

  reqField('growth_rate', 'Growth rate', 'LOW', ['growth']),
  reqBody('adult_height', 'Adult height', 'MEDIUM', /(height|grows? (up to|to)|cm tall|tall)/i, { recurring: true }),
  reqBody('spread_width', 'Spread / width', 'MEDIUM', /(spread|runners?|creeps?|fills in|covers)/i, { recurring: true }),
  reqField('propagation', 'Propagation', 'MEDIUM', ['propagation']),
  reqBody('trimming', 'Trimming / pruning', 'MEDIUM', /(trim|prun\w+|cut back|replant)/i),

  reqBody('flow_tolerance', 'Flow tolerance', 'MEDIUM', /\bflow\b|water movement|current/i, { recurring: true }),

  reqBody('algae_sensitivity', 'Algae sensitivity', 'MEDIUM', /algae/i),
  reqBody('melting', 'Melting behavior', 'MEDIUM', /melts?|melting/i),
  reqBody('nutrient_deficiency_problems', 'Nutrient deficiency problems', 'MEDIUM', /(deficien\w+|yellow(leaves)?|pinholes?)/i),
  reqBody('light_problems', 'Light-related problems', 'MEDIUM', /(too much light|light burn|burning|algae from (too much )?light|shading)/i),
  reqBody('co2_problems', 'CO2-related problems', 'MEDIUM', /(pearling|CO2 (crash|too (much|high))|suffocat)/i),
  reqBody('transition_issues', 'Transition / acclimation issues', 'MEDIUM', /(melt|transplant|emersed|grown (emerged|above water)|acclimat\w+|melting after)/i),
];

// ================= CORAL MATRIX (§5.3) =================
const coralReqs = [
  reqField('common_name', 'Common name', 'LOW', ['name']),
  reqField('scientific_name_coral', 'Scientific name', 'LOW', ['scientificName']),
  reqField('coral_type', 'Coral type', 'MEDIUM', ['coralType']),
  reqField('coral_group', 'Coral group / family context', 'MEDIUM', ['group']),
  reqBody('growth_form_coral', 'Growth form (branching/plating/encrusting)', 'MEDIUM', /(branch\w+|encrust\w+|plating|table\b|columnar|digitate|massive)/i, { recurring: true }),

  reqField('light_coral', 'Qualitative lighting requirement', 'HIGH', ['light']),
  reqBody('par_coral', 'PAR guidance', 'MEDIUM', /\bPAR\b/i, { recurring: true, sevBy: (r) => (r.coralType === 'sps' ? 'HIGH' : null) }),
  reqField('placement_coral', 'Placement', 'HIGH', ['placement']),
  reqBody('acclimation_coral', 'Light acclimation', 'HIGH', /(acclimat\w+|adapt\w* to (the )?light|ramp (up|down)|start (them|it) low)/i),
  reqBody('lighting_risks', 'Lighting-related risks', 'MEDIUM', /(light stress|too (much|strong) light|photoinhibit|light.*bleach)/i, { recurring: true }),

  reqField('flow_coral', 'Flow requirement', 'HIGH', ['flow']),
  reqBody('flow_pattern', 'Flow pattern (direct vs indirect, laminar vs turbulent)', 'MEDIUM', /(direct flow|indirect|laminar|turbulent|gentle flow|random flow)/i, { recurring: true }),
  reqBody('flow_tissue_considerations', 'Flow/tissue considerations', 'MEDIUM', /(tissue|polyp extension|smother\w*|detritus settle)/i, { recurring: true }),

  reqPair('temperature_coral', 'Temperature range', 'HIGH', 'tempMinC', 'tempMaxC'),
  reqBody('salinity_coral', 'Salinity / specific gravity', 'HIGH', /(salinity|specific gravity|1\.02[3-6]|\bSG\b)/i, { recurring: true }),
  reqBody('ph_coral', 'pH', 'HIGH', /(\bph\b of|ph 8|ph level|ph 8\.\d)/i, { recurring: true }),
  reqBody('alkalinity', 'Alkalinity (dKH)', 'HIGH', /(alkalinity|\bdKH\b|carbonate hardness)/i, { recurring: true }),
  reqBody('calcium', 'Calcium', 'HIGH', /(calcium|\[ ?ca ?\]|ca 4\d\d)/i, { recurring: true }),
  reqBody('magnesium', 'Magnesium', 'MEDIUM', /(magnesium|\[ ?mg ?\])/i, { recurring: true }),
  reqBody('nitrate', 'Nitrate', 'MEDIUM', /(nitrate|\[ ?no3 ?\])/i, { recurring: true }),
  reqBody('phosphate', 'Phosphate', 'MEDIUM', /(phosphate|\[ ?po4 ?\])/i, { recurring: true }),
  reqBody('stability', 'Water stability requirements', 'HIGH', /(stab\w+|consistency|stable|steady)/i, { recurring: true }),

  reqField('photosynthetic', 'Photosynthetic role', 'MEDIUM', ['photosynthetic']),
  reqBody('feeding_coral', 'Feeding', 'MEDIUM', /(feed\w+|plankton|target feed|catch food)/i, { recurring: true }),
  reqBody('feeding_type_coral', 'Feeding type', 'LOW', /(phyto\w*|zoo\w*plankton|plankton|carnivor\w*|omnivor\w*)/i, { recurring: true }),
  reqBody('feeding_frequency_coral', 'Feeding frequency (meaningful for NPS)', 'MEDIUM', /(daily|2-3 times|every feeding|multiple times)/i, {
    recurring: true,
    applic: (r) => r.group === 'NPS' || r.photosynthetic === false, naWhy: 'photosynthetic coral — feeding frequency not critical',
    sevBy: (r) => (r.group === 'NPS' || r.photosynthetic === false ? 'HIGH' : null),
  }),
  reqBody('nutrient_availability', 'Nutrient availability', 'MEDIUM', /(nutrient|overfeeding|low nutrient|zero nitrate)/i, { recurring: true }),

  reqBody('growth_rate_coral', 'Growth rate', 'MEDIUM', /(fast.grow|slow.grow|growth rate|grows (quickly|slowly))/i, { recurring: true }),
  reqBody('space_coral', 'Space requirements', 'HIGH', /(leave space|room to grow|grows (into|over|encroaches)|space between)/i, { recurring: true }),

  reqField('aggression', 'Aggression level', 'HIGH', ['aggression']),
  reqBody('sweeper_tentacles', 'Sweeper tentacles', 'HIGH', /sweeper|sweep\w* (out|across)/i, { recurring: true }),
  reqBody('chemical_warfare', 'Chemical warfare (allelopathy)', 'HIGH', /(chemical (warfare|signal)|allelopath\w+|suppress\w+ other coral)/i, { recurring: true }),
  reqBody('stinging', 'Stinging risk', 'MEDIUM', /(sting\w+|nematocyst)/i, { recurring: true }),
  reqBody('placement_neighbors', 'Placement relative to neighbors', 'HIGH', /(neighbor\w*|away from|distance|next to|between them)/i, { recurring: true }),

  reqCustom('reef_safe_status', 'Reef-safe status', 'HIGH', 'field', (t, r) => {
    if (r.reefCompatibility === undefined) return { cov: CV.MISSING, fe: [], be: [], re: [], why: 'reefCompatibility absent' };
    return { cov: CV.COVERED, fe: [fv('reefCompatibility', r.reefCompatibility)], be: [], re: [], why: 'reef-safe status communicated' };
  }),
  reqBody('reef_caveats', 'Species-dependent reef caveats', 'HIGH', /(caution|except|may (nip|eat|pick)|species-dependent|some fish)/i),
  reqBody('coral_interaction_coral', 'Coral interaction / neighbor effects', 'MEDIUM', /(other coral|nearby coral|adjacent coral|stinging coral)/i, { recurring: true }),
  reqBody('fish_interaction_coral', 'Fish interaction', 'MEDIUM', /(butterfly|angelfish|parrot|wrasse|fish (may|can|will) (nip|pick|eat)|herbivorous fish)/i, { recurring: true }),
  reqBody('invertebrate_interaction_coral', 'Invertebrate interaction', 'MEDIUM', /(snail|shrimp|crab|urchin)/i, { recurring: true }),

  reqBody('bleaching', 'Bleaching knowledge', 'HIGH', /bleach/i),
  reqBody('stn_rtn', 'STN / RTN / tissue recession', 'HIGH', /(\bSTN\b|\bRTN\b|tissue (loss|recession)|rapid tissue|slow tissue)/i),
  reqBody('pests_coral', 'Pests knowledge', 'HIGH', /(pest|flatworm|nudibranch|vermetid|spider crab|red bug)/i, { recurring: true }),
  reqBody('algae_coral', 'Algae problems', 'MEDIUM', /algae/i),
  reqBody('flow_stress_coral', 'Flow stress problems', 'MEDIUM', /(flow.{0,20}(too (much|strong|weak)|stress)|torn tissue)/i),
  reqBody('chemistry_problems', 'Chemistry-related problems', 'HIGH', /((alkalinity|calcium|phosphate|nitrate).{0,30}(crash|drop|swing|issue)|test (kit|your water))/i, { recurring: true }),
];

// ================= INVERTEBRATE MATRIX (§5.4) =================
const invReqs = [
  reqField('common_name', 'Common name', 'LOW', ['name']),
  reqField('scientific_name_inv', 'Scientific name', 'LOW', ['scientificName']),
  reqField('type_group', 'Type / group', 'MEDIUM', ['group']),
  reqFieldBody('natural_habitat_inv', 'Natural role / habitat', 'MEDIUM', ['region'], /(rock|sand|crevice|burrow|leaf litter|live rock|gravel|underground|mangrove)/i),

  reqPair('temperature_inv', 'Temperature range', 'HIGH', 'tempMinC', 'tempMaxC'),
  reqBody('salinity_inv', 'Salinity', 'HIGH', /(salinity|specific gravity|1\.02\d|\bSG\b)/i, {
    recurring: true, applic: (r) => r.waterType !== 'freshwater', naWhy: 'freshwater record',
  }),
  reqPair('ph_inv', 'pH range', 'HIGH', 'phMin', 'phMax'),
  reqBody('gh_kh_inv', 'GH / KH where relevant', 'MEDIUM', /\b(GH|KH)\b|hardness/i, { recurring: true }),
  reqBody('calcium_inv', 'Calcium where relevant (shells/molts)', 'HIGH', /(calcium|cuttlebone|shell develop|mineral)/i, {
    recurring: true,
    applic: (r) => ['shrimp', 'snail', 'crab', 'urchin'].includes(r.group), naWhy: 'group does not shell/molt',
  }),
  reqBody('magnesium_inv', 'Magnesium where relevant', 'MEDIUM', /magnesium/i, { recurring: true, applic: (r) => r.waterType !== 'freshwater', naWhy: 'freshwater record' }),
  reqBody('stability_inv', 'Stability requirements', 'HIGH', /(stab\w+|gradual|sudden change|slowly)/i, { recurring: true }),

  reqField('diet_inv', 'Diet type', 'HIGH', ['diet']),
  reqBody('natural_food', 'Natural food source', 'HIGH', /(natural food|biofilm|algae|detritus|leftover|microfilm|decaying)/i),
  reqBody('supplemental_feeding', 'Supplemental feeding', 'MEDIUM', /(feed|supplement|wafers?|powder|blanched|protein food)/i),
  reqBody('starvation_risk', 'Risk of starvation', 'HIGH', /(starv\w+|without food|will starve|run out of food)/i),

  reqBody('molting', 'Molting knowledge', 'HIGH', /mou?lt/i, {
    recurring: true, applic: (r) => ['shrimp', 'crab'].includes(r.group), naWhy: 'group does not molt',
  }),
  reqBody('molting_minerals', 'Calcium/mineral needs for molting', 'HIGH', /(mou?lt.{0,40}(calcium|mineral|hard water)|cuttlebone|mineral supplement)/i, {
    recurring: true, applic: (r) => ['shrimp', 'crab', 'snail'].includes(r.group), naWhy: 'group does not shell/molt',
  }),
  reqBody('molting_hazards', 'Molting hazards', 'MEDIUM', /(failed to mou?lt|mou?lt (fail|death|problem)|stuck in (the )?mou?lt)/i, {
    recurring: true, applic: (r) => ['shrimp', 'crab'].includes(r.group), naWhy: 'group does not molt',
  }),
  reqBody('post_molt_vulnerability', 'Post-molt vulnerability', 'MEDIUM', /(after (a )?mou?lt|post.?mou?lt|soft shell|hide after)/i, {
    recurring: true, applic: (r) => ['shrimp', 'crab'].includes(r.group), naWhy: 'group does not molt',
  }),

  reqBody('fish_predators', 'Fish predator risk', 'HIGH', /(fish .{0,25}(eat|predat\w+)|predator (fish|of)|will eat (it|them))/i, {
    applic: (r) => ['shrimp', 'snail', 'crab', 'starfish'].includes(r.group), naWhy: 'group not typical prey',
  }),
  reqBody('invertebrate_predators', 'Invertebrate predator risk', 'MEDIUM', /(whelk|cone snail|predator.{0,20}(shrimp|snail|crab)|crab.{0,25}(shrimp|snail))/i),
  reqField('temperament_inv', 'Aggression / temperament', 'MEDIUM', ['temperament']),
  reqBody('competition_inv', 'Competition', 'MEDIUM', /compet\w+|fight over|rival/i),
  reqCustom('reef_compat_inv', 'Reef compatibility', 'HIGH', 'field', (t, r) => {
    if (r.reefCompatibility === undefined) return { cov: CV.MISSING, fe: [], be: [], re: [], why: 'reefCompatibility absent' };
    return { cov: CV.COVERED, fe: [fv('reefCompatibility', r.reefCompatibility)], be: [], re: [], why: 'reef-safe status communicated' };
  }, { applic: (r) => r.waterType !== 'freshwater', naWhy: 'freshwater record' }),

  reqBody('min_tank_inv', 'Minimum tank requirements', 'MEDIUM', /(minimum tank|tank size|at least|litres?|gallons?|nano)/i, { recurring: true }),
  reqBody('hiding_areas', 'Hiding areas', 'MEDIUM', /(hiding|hide|cave|retreat|cover)/i),
  reqBody('substrate_inv', 'Substrate requirements', 'MEDIUM', /(substrate|sand|soil|gravel|leaf litter)/i),
  reqBody('rockwork', 'Rockwork requirements', 'MEDIUM', /(live rock|rockwork|rock pile|caves?)/i, { recurring: true, applic: (r) => r.waterType === 'saltwater', naWhy: 'freshwater record' }),
  reqBody('escape_risk', 'Escape risk', 'HIGH', /(escape|climb\w*|lid|out of the tank)/i, {
    applic: (r) => ['crab', 'shrimp'].includes(r.group), naWhy: 'group not known to climb/escape',
  }),

  reqBody('reproduction', 'Reproduction / breeding behavior', 'MEDIUM', /(breed\w*|reproduce|berried|berries|larvae|babies|fry)/i),
  reqBody('breeding_difficulty_inv', 'Breeding difficulty', 'MEDIUM', /(easy to breed|breed (easily|readily|in captivity)|hard to breed|never bred)/i, { recurring: true }),
  reqBody('larval_requirements', 'Larval requirements (where relevant)', 'LOW', /(larvae|planktonic|larval)/i, { recurring: true }),

  reqBody('mature_aquarium_inv', 'Mature aquarium requirement', 'HIGH', /(mature|established|cycled)/i, { recurring: true, applic: (r) => ['shrimp', 'snail'].includes(r.group), naWhy: 'group not dependent on tank maturity' }),
  reqBody('established_biofilm', 'Established biofilm requirement', 'HIGH', /biofilm/i, {
    recurring: true, applic: (r) => ['shrimp', 'snail'].includes(r.group) || ['Detritivore', 'Scavenger', 'Filter feeder'].includes(r.diet), naWhy: 'no biofilm-dependent signal',
  }),
  reqBody('specialized_food_inv', 'Specialized food', 'MEDIUM', /(speciali[sz]ed (diet|food)|only eats|specific diet|sponge)/i),
  reqBody('specialized_habitat_inv', 'Specialized habitat', 'LOW', /(burrow|crevice|branch|leaf litter|specific habitat)/i),
];

// ================= EQUIPMENT MATRIX (§5.5) =================
const equipReqs = [
  reqFieldBody('purpose', 'What it does / purpose', 'MEDIUM', ['excerpt'], /(for|designed|helps|keeps|provides|filter|light|heater|pump)/i),
  reqBody('problem_solved', 'What problem it solves', 'MEDIUM', /(solves?|prevents?|reduces?|removes?|keeps?|maintains?)/i),

  reqPair('suitable_tank_size', 'Suitable tank size range', 'HIGH', 'tankSizeMinL', 'tankSizeMaxL'),
  reqCustom('water_type_suitability', 'Freshwater/marine/reef suitability', 'HIGH', 'field', (t, r) => {
    const fe = [];
    if (Array.isArray(r.aquariumStyle) && r.aquariumStyle.length) fe.push(fv('aquariumStyle', r.aquariumStyle));
    if (has(r, 'category')) fe.push(fv('category', r.category));
    return { cov: fe.length ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: fe.length ? 'style/category communicates suitability' : 'no suitability signal' };
  }),
  reqField('tank_type', 'Tank type / equipment category', 'MEDIUM', ['category']),
  reqField('flow_capacity', 'Flow capacity (L/h)', 'HIGH', ['flowRateLh'], {
    applic: (r) => ['Filter', 'Pump'].includes(r.category), naWhy: 'category has no flow metric',
  }),
  reqBody('turnover', 'Turnover guidance', 'HIGH', /(turnover|times per hour|x per hour|\dx\b)/i, {
    recurring: true, applic: (r) => ['Filter', 'Pump'].includes(r.category), naWhy: 'category has no turnover concept',
  }),
  reqBody('filtration_capacity', 'Filtration capacity / rated load', 'HIGH', /(gph|litres? per hour|rated for|capacity|handles tanks)/i, {
    recurring: true, applic: (r) => r.category === 'Filter', naWhy: 'not a filter',
  }),
  reqBody('load_limitations', 'Load limitations (stocking vs capacity)', 'HIGH', /(stock\w+|bioload|heavy load|max(imum)? (fish|stock)|too many fish)/i, { recurring: true }),
  reqBody('practical_capacity', 'Practical vs marketing capacity', 'LOW', /(real|actual|marketing|understated|true (flow|capacity)|decent for)/i, { recurring: true }),

  reqBody('best_use_case', 'Best use case', 'MEDIUM', /(ideal|best for|designed for|perfect for|suitable for|great for)/i),
  reqBody('installation', 'Installation guidance', 'MEDIUM', /(install\w+|mount\w+|position\w*|set ?up)/i, { recurring: true }),
  reqBody('placement_equipment', 'Placement guidance', 'MEDIUM', /(place\w*|underwater|inline|sump|below|above the tank)/i, { recurring: true }),
  reqBody('configuration', 'Configuration guidance', 'MEDIUM', /(config\w+|adjust\w*|setting\w*|flow (knob|dial)|wattage)/i, { recurring: true }),

  reqCustom('limitations', 'What it cannot do / limitations', 'HIGH', 'fieldbody', (t, r) => {
    const fe = Array.isArray(r.cons) && r.cons.length ? [fv('cons', r.cons)] : [];
    const be = matchBody(t, r, /(cannot|not (suitable|recommended|enough)|limitation|downside|weakness|noisy|only handles)/i);
    const cov = fe.length || be ? CV.COVERED : CV.MISSING;
    return { cov, fe, be: be ? [be] : [], re: [], why: fe.length ? 'cons list communicates limitations' : be ? 'narrative limitation present' : 'no limitations communicated' };
  }, { sevBy: (r) => (!Array.isArray(r.cons) || !r.cons.length) && ['Heater', 'Filter'].includes(r.category) ? 'CRITICAL' : null }),
  reqBody('when_inadequate', 'When it becomes inadequate', 'HIGH', /(inadequate|too (small|weak|slow)|replace with|upgrade|beyond)/i, { recurring: true }),
  reqBody('noise_heat', 'Noise / heat / running-cost implications', 'MEDIUM', /(nois\w+|hum|vibrat|heat(ing)? out|watt|power consum)/i),

  reqBody('compatible_equipment', 'Compatible equipment / system interactions', 'MEDIUM', /(pair\w* with|compatib\w+|works with|inline with|alongside)/i, { recurring: true }),
  reqBody('system_interactions', 'System interactions (sump/canister/inline)', 'MEDIUM', /(sump|canister|inline|with other (gear|equipment)|co2 system)/i, { recurring: true }),
  reqBody('reef_fresh_constraints', 'Reef vs freshwater constraints', 'MEDIUM', /(reef safe|saltwater|freshwater only|corrosive|brackish)/i),

  reqBody('cleaning', 'Cleaning / maintenance routine', 'HIGH', /(clean\w+|rinse|swab|scrub|maintain\w*|replace media)/i),
  reqBody('replacement', 'Replacement schedule / parts', 'MEDIUM', /(replace\w*|cartridge|membrane|every \d+|per month|lifespan)/i, { recurring: true }),
  reqBody('consumables', 'Consumables', 'MEDIUM', /(cartridge|filter media|sponge|refill|salt|test reagent|replacement part)/i, { recurring: true }),
  reqBody('failure_modes', 'Failure modes', 'HIGH', /(fail\w*|break\w*|clog\w*|leak\w*|burn(ed)? out|stop(s)? work)/i, { recurring: true }),

  reqBody('common_misuse', 'Common misuse', 'HIGH', /(misuse|never (run|use|turn)|do not (run|use)|must be (submerged|primed)|forget to)/i, { recurring: true }),
  reqBody('overflow_risk', 'Overflow / water-damage risk', 'HIGH', /(overflow|flood|water damage|drip|leak onto)/i, {
    recurring: true, applic: (r) => ['Filter', 'Pump', 'Heater'].includes(r.category), naWhy: 'category not water-moving',
  }),
  reqBody('electrical_safety', 'Electrical safety', 'HIGH', /(electr\w+|GFCI|ground(ed|ing)?|plug|water contact|current)/i, {
    recurring: true, applic: (r) => ['Heater', 'Pump', 'Light'].includes(r.category), naWhy: 'category not electrical',
  }),
  reqField('power_draw', 'Power draw (W)', 'LOW', ['powerW']),
];

// ================= PROBLEM MATRIX (§5.6) =================
const probReqs = [
  reqCustom('symptoms', 'Observable symptoms', 'HIGH', 'field', (t, r) => {
    const n = (r.symptoms || []).length;
    const fe = n ? [fv('symptoms', r.symptoms)] : [];
    return { cov: n ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: n ? `${n} symptom blocks present` : 'no symptoms' };
  }),
  reqCustom('what_it_indicates', 'What it may indicate (primary causes)', 'HIGH', 'field', (t, r) => {
    const n = (r.causes || []).length;
    const fe = n ? [fv('causes', r.causes)] : [];
    return { cov: n ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: n ? `${n} cause blocks present` : 'no causes' };
  }),
  reqCustom('differential_causes', 'Differential causes (multiple)', 'HIGH', 'field', (t, r) => {
    const n = (r.causes || []).length;
    const cov = n >= 2 ? CV.COVERED : n === 1 ? CV.PARTIAL : CV.MISSING;
    const fe = n ? [fv('causes', r.causes)] : [];
    return { cov, fe, be: [], re: [], why: `${n} distinct cause blocks` };
  }),
  reqBody('how_to_distinguish', 'How to distinguish between causes', 'HIGH', /(versus|\bvs\.?|distinguish|unlike|if .{0,40}then|check if|means that)/i),
  reqCustom('first_check', 'First check / highest-priority observations', 'HIGH', 'field', (t, r) => {
    const n = (r.whatToCheck || []).length;
    const fe = n ? [fv('whatToCheck', r.whatToCheck)] : [];
    return { cov: n ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: n ? `${n} whatToCheck blocks present` : 'no check guidance' };
  }),

  reqBody('secondary_causes', 'Secondary / contributing causes', 'MEDIUM', /(also|secondary|contributing|stress|poor maintenance|overfeeding)/i),
  reqBody('environmental_causes', 'Environmental causes', 'MEDIUM', /(water param\w+|ammonia|nitrate|nitrite|temperature|pH|light(ing)?)/i),
  reqBody('husbandry_causes', 'Husbandry causes', 'MEDIUM', /(overfeed\w+|overstock\w+|water change|maintenance|unclean|dirty filter)/i),

  reqBody('immediate_action', 'Immediate action', 'HIGH', /(immediately|right away|first thing|as soon as|start by)/i, { recurring: true }),
  reqBody('corrective_action', 'Corrective action / treatment', 'HIGH', /(treat\w*|treatment|dosage|add carbon|reduce|increase|remove|perform a water change)/i),
  reqBody('recovery_expectations', 'Recovery expectations', 'MEDIUM', /(recover\w*|within (a few|days|weeks|month)|regrow\w*|heal\w*|return to normal)/i, { recurring: true }),

  reqCustom('what_not_to_do', 'What NOT to do', 'HIGH', 'field', (t, r) => {
    const n = (r.whatNotToDo || []).length;
    const fe = n ? [fv('whatNotToDo', r.whatNotToDo)] : [];
    return { cov: n ? CV.COVERED : CV.MISSING, fe, be: [], re: [], why: n ? `${n} whatNotToDo blocks present` : 'no warnings' };
  }),
  reqBody('overcorrection_risks', 'Overcorrection risks', 'MEDIUM', /(overcorrect\w+|too (much|fast|sudden)|sudden change|can (make|cause) (it|things) worse|crash)/i),

  reqBody('prevention', 'Long-term prevention', 'MEDIUM', /(prevent\w+|avoid\w+|regular|routine|keep .{0,20}stable)/i, { recurring: true }),
  reqBody('monitoring', 'Monitoring guidance', 'MEDIUM', /(monitor\w+|test (water|weekly|daily)|check (daily|weekly|regularly)|watch for)/i, { recurring: true }),
  reqBody('maintenance_prevention', 'Maintenance-linked prevention', 'MEDIUM', /(water change|weekly maintenance|filter maintenance|maintenance schedule)/i, { recurring: true }),

  reqBody('escalation', 'Escalation: when hobbyist help is insufficient', 'HIGH', /(veterinar\w+|\bvets?\b|professional|specialist|fish health expert|consult)/i, { recurring: true }),
];

module.exports = { CV, bt, bodyParts, bodyText, matchBody, fv, has, reqField, reqPair, reqBody, reqRel, reqFieldBody, reqRelBody, reqCustom, isArowana, speciesReqs, plantReqs, coralReqs, invReqs, equipReqs, probReqs };
