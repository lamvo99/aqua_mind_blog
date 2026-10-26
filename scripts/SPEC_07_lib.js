const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); }
      });
    }).on('error', rej);
  });
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const stripMeta = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; return c; };
const stripMachine = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; delete c._system; return c; };
function canon(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
}
const contentDiffers = (a, b) => canon(stripMachine(a)) !== canon(stripMachine(b));

function has(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const toCsv = (cols, rows) => [cols.join(',')].concat(rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))).join('\r\n') + '\r\n';

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
  const parseLine = (l) => {
    const o = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { o.push(cur); cur = ''; }
      else cur += ch;
    }
    o.push(cur);
    return o;
  };
  const hdr = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const row = {};
    hdr.forEach((h, i) => { row[h] = vals[i] !== undefined ? vals[i] : ''; });
    return row;
  });
}

const INTENT_ORDER = ['CARE', 'IDENTIFY', 'COMPATIBILITY', 'TANK_REQUIREMENTS', 'FEEDING', 'BEHAVIOR', 'BREEDING', 'TROUBLESHOOT', 'LEARN'];

const KEYWORDS = {
  IDENTIFY: ['distinctive', 'species of', 'found in', 'known for', 'characterized', 'characterised', 'marked', 'streak', 'stripe', 'spots', 'spotted', 'colorful', 'colourful', 'pattern', 'shaped', 'named', 'resemble', 'similar to', 'variety', 'breed of'],
  CARE: ['care', 'keep', 'keeping', 'hardy', 'easy', 'difficult', 'demanding', 'sensitive', 'thrive', 'beginner', 'requirement', 'suitable for'],
  TANK_REQUIREMENTS: ['tank', 'aquarium', 'litre', 'liter', 'gallon', 'minimum', 'setup', 'space', 'lid', 'volume', 'spacious', 'parameters'],
  FEEDING: ['diet', 'eat', 'eats', 'feed', 'feeds', 'feeding', 'carnivore', 'omnivore', 'herbivore', 'flake', 'frozen', 'pellet', 'algae', 'insect', 'worm', 'plankton', 'prey', 'graze', 'grazing', 'shrimp'],
  COMPATIBILITY: ['compatib', 'tank mate', 'tankmate', 'community', 'aggressive', 'peaceful', 'semi-aggressive', 'predator', 'predatory', 'nippy', 'fin nip', 'coexist', 'reef safe', 'reef-safe', 'other fish', 'with fish'],
  BEHAVIOR: ['behaviour', 'behavior', 'temperament', 'school', 'schools', 'shoal', 'shoals', 'group of', 'pairs', 'active', 'shy', 'social', 'swim', 'swims', 'leap', 'dig', 'digs', 'hide', 'hides', 'hover', 'dweller', 'bottom-dweller', 'surface', 'territorial'],
  BREEDING: ['breed', 'breeds', 'breeding', 'spawn', 'spawning', 'fry', 'egg', 'eggs', 'reproduce', 'moult', 'molt', 'gestation'],
  TROUBLESHOOT: ['problem', 'problems', 'disease', 'stress', 'prone', 'susceptib', 'risk', 'threat', 'decline', 'fail', 'parasite', 'ich', 'rot', 'issues'],
  LEARN: ['basin', 'river', 'stream', 'wild', 'habitat', 'native', 'range', 'waters', 'endemic', 'tropical', 'region', 'origin'],
};

const ANGLE = {
  CARE: 'care, water parameters and tank setup',
  IDENTIFY: 'identification and species profile',
  COMPATIBILITY: 'temperament and community-tank considerations',
  TANK_REQUIREMENTS: 'water parameters and tank-size requirements',
  FEEDING: 'diet and feeding habits',
  BEHAVIOR: 'behavior and temperament',
  BREEDING: 'breeding behavior and reproduction notes',
  TROUBLESHOOT: 'care and common problems',
  LEARN: 'habitat, origin and keeping basics',
};

const ANGLE_SHORT = {
  CARE: 'care',
  IDENTIFY: 'species profile',
  COMPATIBILITY: 'compatibility',
  TANK_REQUIREMENTS: 'water requirements',
  FEEDING: 'feeding',
  BEHAVIOR: 'behavior',
  BREEDING: 'breeding',
  TROUBLESHOOT: 'common problems',
  LEARN: 'species profile',
};

function scoreIntent(rec) {
  const text = [rec.excerpt, rec.schooling].filter(has).join(' ').toLowerCase();
  const scores = {};
  for (const i of INTENT_ORDER) scores[i] = 0;
  const matched = {};
  for (const i of INTENT_ORDER) {
    matched[i] = [];
    for (const kw of KEYWORDS[i]) if (text.includes(kw)) { scores[i]++; matched[i].push(kw); }
  }
  const fieldEvidence = [];
  if ((Array.isArray(rec.compatibleSpecies) && rec.compatibleSpecies.length) || has(rec.reefCompatibility) || rec.isPredator === true) { scores.COMPATIBILITY += 1; fieldEvidence.push('compatibility field present'); }
  if (Array.isArray(rec.relatedProblems) && rec.relatedProblems.length) { scores.TROUBLESHOOT += 1; fieldEvidence.push('relatedProblems refs'); }
  if (has(rec.schooling)) { scores.BEHAVIOR += 1; fieldEvidence.push('schooling text'); }
  if (has(rec.tankSizeMinL) && has(rec.tempMinC) && has(rec.phMin)) { scores.TANK_REQUIREMENTS += 1; fieldEvidence.push('tankSize/temp/ph fields'); }
  if (has(rec.difficulty)) { scores.CARE += 1; fieldEvidence.push('difficulty field'); }
  if (has(rec.diet)) { scores.FEEDING += 1; fieldEvidence.push('diet field'); }
  const ranked = INTENT_ORDER.slice().sort((a, b) => scores[b] - scores[a] || INTENT_ORDER.indexOf(a) - INTENT_ORDER.indexOf(b));
  let intent = ranked[0];
  let intentCandidates = [ranked[0]];
  if (ranked[1] && scores[ranked[0]] - scores[ranked[1]] <= 1 && scores[ranked[0]] >= 5) {
    intent = 'MULTI_INTENT';
    intentCandidates = [ranked[0], ranked[1]];
  } else if (scores[ranked[0]] <= 1) {
    intent = 'LEARN';
    intentCandidates = [ranked[0]];
  }
  const evidence = [];
  for (const i of (intent === 'MULTI_INTENT' ? intentCandidates : [intent])) {
    if (matched[i].length) evidence.push('excerpt keyword: "' + matched[i].slice(0, 4).join('", "') + '"');
  }
  for (const f of fieldEvidence.slice(0, 3)) evidence.push('field: ' + f);
  return { intent: intent, intentCandidates: intentCandidates, scores: scores, evidence: evidence };
}

function dedupeWords(s) {
  const seen = {};
  return s.split(' ').filter((w) => { const k = w.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; }).join(' ');
}

const BANNED_TITLE = [/\bbest\b/i, /\bultimate\b/i, /\bcomplete guide\b/i, /\beverything you need\b/i, /\btop\s*\d+\b/i, /#1\b/i, /\b20\d{2}\b/i];
const scanBanned = (s) => BANNED_TITLE.filter((re) => re.test(s)).map((re) => String(re));

function angleForIntent(intent, rec) {
  if (intent === 'MULTI_INTENT') {
    const cands = rec.__intentCandidates || [];
    const p1 = ANGLE_SHORT[cands[0]] || 'care';
    const p2 = ANGLE_SHORT[cands[1]] || 'profile';
    return dedupeWords(p1 + ' and ' + p2);
  }
  return ANGLE[intent] || ANGLE.CARE;
}

function buildTitle(rec, intent) {
  const angle = angleForIntent(intent, rec);
  const sci = has(rec.scientificName) ? ' (' + rec.scientificName + ')' : '';
  const base = rec.name + sci + ': ' + angle;
  if (base.length <= 65) return base;
  const noSci = rec.name + ': ' + angle;
  if (noSci.length <= 65) return noSci;
  const short = rec.name + sci + ': ' + (angle.split(' and ')[0]);
  if (short.length <= 65) return short;
  const noSciShort = rec.name + ': ' + (angle.split(' and ')[0]);
  if (noSciShort.length <= 65) return noSciShort;
  let t = base;
  while (t.length > 65 && t.includes(' ')) t = t.slice(0, t.lastIndexOf(' '));
  return t;
}

function article(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }

function buildDescription(rec, intent) {
  const sci = has(rec.scientificName) ? ' (' + rec.scientificName + ')' : '';
  const level = has(rec.difficulty) ? rec.difficulty + '-level ' : '';
  const region = has(rec.region) ? ' from ' + rec.region : '';
  const dietClause = has(rec.diet) ? 'It is ' + article(rec.diet.toLowerCase()) + ' ' + rec.diet.toLowerCase() + '.' : '';
  const angleClause = 'Covers ' + anglePhraseForDesc(intent, rec) + '.';

  const sizeClause = has(rec.sizeCm) ? 'grows to ' + rec.sizeCm + ' cm' : null;
  const tankClause = has(rec.tankSizeMinL) ? 'needs at least ' + rec.tankSizeMinL + ' L' : null;
  const waterBits = [];
  if (has(rec.tempMinC) && has(rec.tempMaxC)) waterBits.push(rec.tempMinC + '-' + rec.tempMaxC + '\u00B0C');
  if (has(rec.phMin) && has(rec.phMax)) waterBits.push('pH ' + rec.phMin + '-' + rec.phMax);
  const ghBit = (has(rec.ghMin) && has(rec.ghMax)) ? 'GH ' + rec.ghMin + '-' + rec.ghMax + ' dGH' : null;

  function compose(useSci, useRegion, useGh, useDiet, useSize, useTank, compact) {
    const s1 = rec.name + (useSci ? sci : '') + ' is ' + article(level + (rec.waterType || 'fish')) + ' ' + level + (rec.waterType || 'aquarium') + ' fish' + (useRegion ? region : '') + '.';
    let s2 = '';
    if (compact) {
      const w = waterBits.slice();
      const ghS = (useGh && ghBit && w.length) ? ', ' + ghBit : '';
      const sz = useSize && sizeClause;
      const tk = useTank && tankClause;
      const atW = w.length ? ' at ' + w.join(', ') : '';
      if (sz && tk) s2 = 'Grows to ' + rec.sizeCm + ' cm, needs ' + rec.tankSizeMinL + ' L' + atW + ghS + '.';
      else if (sz) s2 = 'Grows to ' + rec.sizeCm + ' cm' + atW + ghS + '.';
      else if (tk) s2 = 'Needs ' + rec.tankSizeMinL + ' L' + atW + ghS + '.';
      else if (w.length) s2 = 'Thrives at ' + w.join(', ') + ghS + '.';
    } else {
      const clauses = [];
      if (useSize && sizeClause) clauses.push(sizeClause);
      if (useTank && tankClause) clauses.push(tankClause);
      if (waterBits.length) clauses.push('thrives at ' + waterBits.join(', ') + (useGh && ghBit ? ', ' + ghBit : ''));
      if (clauses.length) {
        const joined = clauses.length === 1 ? clauses[0] : (clauses.length === 2 ? clauses[0] + ' and ' + clauses[1] : clauses.slice(0, -1).join(', ') + ', and ' + clauses[clauses.length - 1]);
        s2 = 'It ' + joined + '.';
      }
    }
    return [s1, s2, useDiet ? dietClause : '', angleClause].filter(Boolean).join(' ');
  }

  const variants = [
    { text: compose(true, true, true, true, true, true, false), dropped: [] },
    { text: compose(true, true, false, true, true, true, false), dropped: ['gh'] },
    { text: compose(true, false, false, true, true, true, false), dropped: ['gh', 'region'] },
    { text: compose(false, false, false, true, true, true, false), dropped: ['gh', 'region', 'scientificName'] },
    { text: compose(false, false, false, true, true, true, true), dropped: ['gh', 'region', 'scientificName'] },
    { text: compose(false, false, false, false, true, true, true), dropped: ['gh', 'region', 'scientificName', 'diet'] },
    { text: compose(false, false, false, false, false, true, true), dropped: ['gh', 'region', 'scientificName', 'diet', 'sizeCm'] },
    { text: compose(false, false, false, false, false, false, true), dropped: ['gh', 'region', 'scientificName', 'diet', 'sizeCm', 'tankSizeMinL'] },
  ];
  for (const v of variants) if (v.text.length <= 160) return v;
  let t = variants[variants.length - 1].text;
  while (t.length > 160 && t.includes(' ')) {
    t = t.slice(0, t.lastIndexOf(' '));
    if (!/\.$/.test(t)) t += '.';
  }
  return { text: t, dropped: ['fallback-word-trim'] };
}

function anglePhraseForDesc(intent, rec) {
  if (intent === 'MULTI_INTENT') {
    const cands = rec.__intentCandidates || [];
    return dedupeWords((ANGLE_SHORT[cands[0]] || 'care') + ' and ' + (ANGLE_SHORT[cands[1]] || 'profile'));
  }
  if (intent === 'BEHAVIOR' && !has(rec.schooling)) return 'behavior and temperament';
  if (intent === 'TROUBLESHOOT' && !(Array.isArray(rec.relatedProblems) && rec.relatedProblems.length)) return 'care and troubleshooting notes';
  return ANGLE[intent] || ANGLE.CARE;
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (s) => normalize(s).split(' ').filter(Boolean);
function jaccard(a, b) {
  const A = new Set(tokens(a)); const B = new Set(tokens(b));
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

const CONTENT_FIELDS = ['scientificName', 'excerpt', 'sizeCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament', 'difficulty', 'region', 'group', 'family', 'origin', 'waterZone', 'schooling', 'aquariumStyle', 'relatedProblems', 'relatedPosts', 'aliases', 'localNames', 'publishedAt', 'isPredator', 'reefCompatibility', 'mainImage'];
function contentSignals(rec) {
  let n = 0;
  for (const f of CONTENT_FIELDS) if (has(rec[f])) n++;
  return n;
}

const BANNED_TITLE_PATTERNS = ['\\bbest\\b', '\\bultimate\\b', '\\bcomplete guide\\b', '\\beverything you need\\b', '\\btop\\s*\\d+\\b', '#1\\b', '\\b20\\d{2}\\b'];

function buildContext(species) {
  const bySci = {};
  for (const s of species) (bySci[s.scientificName] = bySci[s.scientificName] || []).push(s);
  const families = {};
  const ctx = {};
  for (const s of species) {
    const sibs = (bySci[s.scientificName] || []).filter((x) => x._id !== s._id);
    const generic = sibs.some((x) => x.name.toLowerCase().includes(s.name.toLowerCase()) && x.name.toLowerCase() !== s.name.toLowerCase());
    ctx[s._id] = { siblings: sibs.map((x) => ({ id: x._id, name: x.name })), siblingCount: sibs.length, genericName: generic, familySize: sibs.length + 1, parentSpecies: s.parentSpecies ? s.parentSpecies._ref || s.parentSpecies : null };
    if (sibs.length) families[s.scientificName] = (families[s.scientificName] || 1) + sibs.length;
  }
  return { perRecord: ctx, sharedScientificNameFamilies: families };
}

function generateProposal(rec, recordCtx) {
  const intentInfo = scoreIntent(rec);
  rec.__intentCandidates = intentInfo.intentCandidates;
  const title = buildTitle(rec, intentInfo.intent);
  const desc = buildDescription(rec, intentInfo.intent);
  const description = desc.text;
  const evidenceFields = ['name', 'slug'];
  for (const f of CONTENT_FIELDS) if (has(rec[f])) evidenceFields.push(f);
  evidenceFields.push('intentEvidence: ' + intentInfo.evidence.join('; '));

  const excerptLen = has(rec.excerpt) ? rec.excerpt.trim().length : 0;
  let confidence, status, reason, reasonCode, seoStatus = null;

  if (recordCtx.genericName) {
    confidence = 'BLOCKED'; status = 'BLOCKED'; reasonCode = 'CANNIBALIZATION_GENERIC_NAME';
    reason = 'Record name is a generic substring of a sibling record sharing scientificName ' + (rec.scientificName || '') + '; distinct metadata cannot be certified until editorial decides which page owns the generic query.';
    seoStatus = 'BLOCKED_BY_CANNIBALIZATION';
  } else if (excerptLen < 80) {
    confidence = 'BLOCKED'; status = 'BLOCKED'; reasonCode = 'THIN_EXCERPT';
    reason = 'Excerpt of ' + excerptLen + ' chars is below the 80-char evidence floor for a distinctive meta description; SEO_STATUS = BLOCKED_BY_CONTENT until content expands.';
    seoStatus = 'BLOCKED_BY_CONTENT';
  } else if (recordCtx.siblingCount > 0 || recordCtx.parentSpecies || intentInfo.intent === 'MULTI_INTENT') {
    confidence = 'MEDIUM'; status = 'REVIEW_REQUIRED';
    reasonCode = recordCtx.siblingCount > 0 ? 'SHARED_SCIENTIFIC_NAME_SIBLING' : (recordCtx.parentSpecies ? 'VARIANT_WITH_PARENT_SPECIES' : 'MULTI_INTENT');
    reason = reasonCode === 'SHARED_SCIENTIFIC_NAME_SIBLING'
      ? 'Shares scientificName with ' + recordCtx.siblingCount + ' sibling record(s); proposal must be reviewed together with siblings to guarantee distinctness.'
      : (reasonCode === 'VARIANT_WITH_PARENT_SPECIES'
        ? 'Variant record with parentSpecies link; metadata must be differentiated from the canonical parent page.'
        : 'Two or more search intents score within 1 point; primary intent ambiguous (candidates: ' + intentInfo.intentCandidates.join(' + ') + ').');
  } else if (contentSignals(rec) < 20) {
    confidence = 'MEDIUM'; status = 'REVIEW_REQUIRED'; reasonCode = 'LIMITED_CONTENT_SIGNALS';
    reason = 'Content signal count ' + contentSignals(rec) + ' below HIGH threshold 20; proposal drafted but requires review.';
  } else {
    confidence = 'HIGH'; status = 'MUTATION_READY'; reasonCode = 'SUFFICIENT_EVIDENCE';
    reason = 'Identity, intent and evidence are unambiguous: ' + contentSignals(rec) + ' content signals, single dominant intent (' + intentInfo.intent + '), no sibling or distinctness conflict.';
  }

  return {
    recordId: rec._id,
    recordType: 'species',
    title: rec.name,
    slug: slugValue(rec.slug),
    currentMetaTitle: null,
    currentMetaDescription: null,
    proposedMetaTitle: title,
    proposedMetaDescription: description,
    searchIntent: intentInfo.intent,
    primaryTopic: anglePhraseForDesc(intentInfo.intent, rec),
    focusKeyword: null,
    secondaryKeywords: null,
    evidenceFields: evidenceFields,
    confidence: confidence,
    mutationStatus: status,
    reason: reason,
    replacementReason: null,
    reasonCode: reasonCode,
    seoStatus: seoStatus,
    intentCandidates: intentInfo.intentCandidates,
    intentScores: intentInfo.scores,
    contentSignals: contentSignals(rec),
    excerptLength: excerptLen,
    siblingCount: recordCtx.siblingCount,
    siblingNames: recordCtx.siblings.map((x) => x.name),
    genericNameFlag: recordCtx.genericName,
    parentSpecies: recordCtx.parentSpecies,
    proposedTitleLength: title.length,
    proposedDescriptionLength: description.length,
    factsDropped: desc.dropped,
    bannedTitleHits: scanBanned(title),
    bannedDescriptionHits: scanBanned(description),
    distinctnessFlag: null,
  };
}

function mergeFlag(existing, flag) {
  if (!existing) return flag;
  if (existing === 'NEAR_DUP_BOTH' || flag === 'NEAR_DUP_BOTH' || existing !== flag) return 'NEAR_DUP_BOTH';
  return existing;
}

function buildAllProposals(species) {
  const sorted = species.slice().sort((a, b) => a._id.localeCompare(b._id));
  const ctx = buildContext(sorted);
  let rows;
  try {
    rows = sorted.map((s) => generateProposal(s, ctx.perRecord[s._id]));
  } finally {
    for (const s of sorted) delete s.__intentCandidates;
  }

  const byTitle = {};
  for (const r of rows) {
    const k = normalize(r.proposedMetaTitle);
    (byTitle[k] = byTitle[k] || []).push(r);
  }
  let titleCollisions = 0;
  for (const k of Object.keys(byTitle)) {
    if (byTitle[k].length > 1) {
      titleCollisions += byTitle[k].length;
      for (const r of byTitle[k]) {
        r.confidence = 'BLOCKED';
        r.mutationStatus = 'BLOCKED';
        r.reasonCode = 'TITLE_COLLISION';
        r.reason = 'Proposed metaTitle is identical to another record after normalization; the pair must be differentiated before any review or mutation.';
        r.seoStatus = 'BLOCKED_BY_CANNIBALIZATION';
      }
    }
  }

  const pairs = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const titleSim = jaccard(rows[i].proposedMetaTitle, rows[j].proposedMetaTitle);
      const descSim = jaccard(rows[i].proposedMetaDescription, rows[j].proposedMetaDescription);
      const nearTitle = titleSim >= 0.75;
      const nearDesc = descSim >= 0.80;
      if (nearTitle || nearDesc) {
        const flag = nearTitle && nearDesc ? 'NEAR_DUP_BOTH' : (nearTitle ? 'NEAR_DUP_TITLE' : 'NEAR_DUP_DESC');
        rows[i].distinctnessFlag = mergeFlag(rows[i].distinctnessFlag, flag);
        rows[j].distinctnessFlag = mergeFlag(rows[j].distinctnessFlag, flag);
        pairs.push({ a: rows[i].recordId, b: rows[j].recordId, titleSim: Number(titleSim.toFixed(4)), descSim: Number(descSim.toFixed(4)), overlap: flag });
      }
    }
  }
  return { rows: rows, ctx: ctx, pairs: pairs, titleCollisions: titleCollisions };
}

const PROPOSAL_COLUMNS = [
  'recordId', 'recordType', 'title', 'slug', 'currentMetaTitle', 'currentMetaDescription',
  'proposedMetaTitle', 'proposedMetaDescription', 'searchIntent', 'primaryTopic',
  'focusKeyword', 'secondaryKeywords', 'evidenceFields', 'confidence', 'mutationStatus',
  'reason', 'replacementReason', 'reasonCode', 'seoStatus', 'contentSignals', 'excerptLength',
  'siblingCount', 'genericNameFlag', 'parentSpecies', 'proposedTitleLength', 'proposedDescriptionLength', 'factsDropped', 'distinctnessFlag',
];

const flattenForCsv = (row) => {
  const o = {};
  for (const c of PROPOSAL_COLUMNS) {
    const v = row[c];
    o[c] = Array.isArray(v) ? v.join('; ') : (v === null || v === undefined ? '' : v);
  }
  return o;
};

module.exports = {
  TOKEN, BASE, WIKI_TYPES, EXPECTED, EXPECTED_HASH, INTENT_ORDER, ANGLE, ANGLE_SHORT, KEYWORDS,
  CONTENT_FIELDS, PROPOSAL_COLUMNS, BANNED_TITLE_PATTERNS,
  q, sha256, slugValue, titleOf, stripMeta, stripMachine, canon, contentDiffers, has, parseCsv, csvCell, toCsv,
  scoreIntent, buildTitle, buildDescription, anglePhraseForDesc, scanBanned,
  normalize, tokens, jaccard, contentSignals, buildContext, generateProposal, buildAllProposals, flattenForCsv,
};
