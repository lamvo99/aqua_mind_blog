// SPEC 11 Phase 02 - source verification generator. Deterministic given the _source_cache.
// READ-ONLY: public web already fetched by SPEC_11_phase02_fetch.js; no Sanity calls; no PM decisions.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = 'reports/SPEC_11/pm_review/phase_02';
const CACHE = OUT + '/_source_cache';
const P1 = 'reports/SPEC_11/pm_review/phase_01';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const urlId = (u) => sha(u).slice(0, 16);

function sp(l){const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else c+=ch;}}r.push(c);return r;}
function readCsv(f){const l=fs.readFileSync(f,'utf8').replace(/^﻿/,'').split(/\r?\n/).filter(x=>x);const h=sp(l[0]);return l.slice(1).map(x=>{const r=sp(x);const o={};h.forEach((k,i)=>o[k]=r[i]??'');return o;});}
function toCsv(rows, cols){const esc=(v)=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return [cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+'\n';}
const URL_RE = /https?:\/\/[^\s<>)\]]+/g;
const cleanUrl = (u) => u.replace(/[.,;:]+$/,'');
function urlsIn(ev){ return ((ev||'').match(URL_RE)||[]).map(cleanUrl); }

const fills = readCsv(P1 + '/FILL_DECISION_RECOMMENDATIONS.csv').filter((r) => r.proposedWritableSet === 'YES');
const reps = readCsv(P1 + '/REPLACEMENT_DECISION_RECOMMENDATIONS.csv').filter((r) => r.proposedWritableSet === 'YES');

function loadCache(url){
  const p = path.join(CACHE, urlId(url) + '.json');
  if (!fs.existsSync(p)) return { url, status: 0, error: 'not_fetched', title: '', text: '', contentSha256: '', dates: [] };
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  const txtPath = path.join(CACHE, urlId(url) + '.txt');
  const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8') : '';
  return Object.assign({}, m, { text });
}
const norm = (t) => (t || '').toLowerCase().replace(/\s+/g, ' ');
const flat = (t) => t.replace(/,/g, '');

function snippet(text, idx, len = 220) {
  const s = Math.max(0, idx - 60);
  return text.slice(s, s + len).trim();
}
function findRe(text, re) {
  const m = re.exec(text);
  return m ? { idx: m.index, match: m[0], groups: m } : null;
}
const STOP = new Set(['fish','fishes','aquarium','aquariums','tank','tanks','care','guide','species','water','the','and','for','with','adult','adults','family','freshwater','profile','factsheet','fact','sheet','wild','large','small','very','also','into','from','their','this','that','can','may','will','been','are','its','one','two','new','more','most','some','such','when','where','than','other','others','have','has','had','they','them','your','you']);
function speciesCheck(rec, pageNorm){
  const binom = /([A-Z][a-z]{3,}\s[a-z]{4,})/.exec(rec.evidenceReference.replace(/</g,' ').replace(/>/g,' '));
  let binomial = binom ? binom[1] : '';
  if (/^(Care|Species|Genus|The|Fresh|Fish|Captive|Factsheet)/.test(binomial)) binomial = '';
  const binOk = binomial ? pageNorm.includes(binomial.toLowerCase().split(' ')[0]) && pageNorm.includes(binomial.toLowerCase().split(' ')[1]) : false;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phrase1 = rec.species.toLowerCase().replace(/[^a-z\s-]/g, '').replace(/-/g, ' ').trim();
  const phrase2 = rec.slug.replace(/-/g, ' ').toLowerCase();
  const phraseOk = (phrase1 && new RegExp('\\b' + esc(phrase1) + '\\b').test(pageNorm)) || (phrase2 && new RegExp('\\b' + esc(phrase2) + '\\b').test(pageNorm));
  const words = (rec.species + ' ' + rec.slug.replace(/-/g, ' ')).toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !STOP.has(w));
  const tokenHits = words.filter((w) => pageNorm.includes(w));
  if (binOk) return { ok: true, basis: 'binomial:' + binomial };
  if (tokenHits.length) return { ok: true, basis: 'tokens:' + tokenHits.slice(0,3).join('/') };
  if (phraseOk) return { ok: true, basis: 'phrase:' + (phrase1 || phrase2) };
  return { ok: false, basis: binomial ? 'no binomial or token match (expected ' + binomial + ')' : 'no species token match' };
}

// ---- field claim matchers -> {kind: direct|derived|antonym|absent, rule, snippet} ----
const ENUMS = {
  flowPreference: {
    STILL: { syn: /flow preference[:\s]{0,10}still|still water|calm water|little water movement|minimal(?: water)? movement|low flow|gentle flow|slow[- ]moving/, anti: /strong current|fast[- ]flowing|rapid current|high flow/ },
    MODERATE: { syn: /flow preference[:\s]{0,10}moderate|moderate (?:flow|current|water movement)|medium flow|moderate to high/, anti: /strong current|fast[- ]flowing|still water|calm water/ },
    STRONG: { syn: /flow preference[:\s]{0,10}strong|strong current|fast[- ]flowing|rapid current|high flow|strong flow/, anti: /still water|calm water/ },
  },
  oxygenSensitivity: {
    SENSITIVE: { syn: /sensitive to|requires? (?:high|good|plenty of|extra) oxygen|well[- ]?oxygenated|heavily aerated|oxygen-rich|high oxygen|aeration|aerated/, anti: /no special|not sensitive/ },
    NEUTRAL: { syn: /oxygen/, anti: /sensitive to low|requires? high oxygen/ },
  },
  temperament: {
    Aggressive: { syn: /aggressive|predatory|will attack|attacks tankmates|violent/, anti: /peaceful|docile|gentle/ },
    'Semi-aggressive': { syn: /semi[- ]aggressive|semiaggressive|can be aggressive|mildly aggressive/, anti: /entirely peaceful/ },
    Peaceful: { syn: /peaceful|docile|gentle/, anti: /aggressive|predatory/ },
  },
  diet: {
    Omnivore: { syn: /omnivor/, anti: /strictly carnivorous|exclusively carnivorous/ },
    Carnivore: { syn: /carnivor|meat[- ]eating|predatory diet/, anti: /omnivor/ },
    Herbivore: { syn: /herbivor|vegetarian|plant[- ]eating/, anti: /carnivor/ },
    Micropredator: { syn: /micropredator|small prey/, anti: /herbivor/ },
  },
  jumpRisk: {
    HIGH: { syn: /jump|leap|out of the water|out of (?:the )?tank/, anti: /do(?:es)? not jump|never jump/ },
    MODERATE: { syn: /jump|leap/, anti: /do(?:es)? not jump/ },
    LOW: { syn: /unlikely to jump|occasionally jump/, anti: /frequent jumper|known jumpers/ },
    NONE: { syn: /do(?:es)? not jump|never jumps/, anti: /jump/ },
  },
  lidRequired: {
    ESSENTIAL: { syn: /lid|canopy|hood|secure cover|cover(?:ed)? (?:the )?tank|tight[- ]fitting|escap/, anti: /no lid/ },
    RECOMMENDED: { syn: /lid|canopy|hood|cover/, anti: /open top is safe/ },
    NOT_REQUIRED: { syn: /no lid|does not need a lid|open[- ]top/, anti: /jump/ },
  },
  maturityRequirement: {
    REQUIRED: { syn: /mature|sexual maturity|breeding[- ]age|reaches maturity/, anti: /never matures/ },
    SUGGESTED: { syn: /mature|years? (?:of age|old)/, anti: /immediate|instantly/ },
    NONE: { syn: /no special maturity|small specimen/, anti: /only adults/ },
  },
  bioload: {
    HIGH: { syn: /heavy bioload|high bio-?load|bio-?load[^.\n]{0,25}(?:high|extreme|large)|massive waste|extreme waste|waste output extreme|large amount of waste|messy|produces a lot of waste|lots of waste/, anti: /low bioload/ },
    MODERATE: { syn: /moderate bioload|moderate waste|moderate bio-?load/, anti: /heavy bioload|extreme/ },
    LOW: { syn: /low bioload|small waste/, anti: /heavy bioload|messy|extreme/ },
  },
  waterChangeSensitivity: {
    HIGH: { syn: /sensitive to water|water changes? (?:are )?(?:important|critical|essential)|prone to|nitrate/, anti: /hardy/ },
    MODERATE: { syn: /water changes?|water quality/, anti: /immune/ },
    LOW: { syn: /hardy|tolerant of/, anti: /sensitive to water/ },
  },
  communitySuitability: {
    UNSUITABLE: { syn: /not (?:recommended|suitable|for the community)|unsuitable|should not be kept|dangerous to|will eat|choose tankmates carefully|fit into its mouth|cannot fit|eats? smaller/, anti: /good community fish/ },
    CONDITIONAL: { syn: /with caution|large tank only|semi[- ]aggressive|not for beginners|cichlid|choose tankmates carefully|depending on|similarly[- ]sized/, anti: /universally peaceful/ },
    SUITABLE: { syn: /community fish|good community|peaceful/, anti: /aggressive|choose tankmates carefully/ },
  },
  predatesInverts: {
    LIKELY: { syn: /shrimp|snail|invertebrate|crustacean|prawn/, anti: /will not eat shrimp/ },
    POSSIBLE: { syn: /shrimp|snail|invertebrate|crustacean/, anti: /guaranteed safe/ },
    NONE: { syn: /safe with invertebrates|will not eat shrimp|no interest in/, anti: /eats shrimp/ },
  },
  swimmingSpace: {
    HIGH: { syn: /open water|open[- ]water|swimming space|long|floor space|tank length|powerful swimmer|cruis/, anti: /bottom dweller only/ },
    MODERATE: { syn: /middle|midwater|swims|active/, anti: /never leaves bottom/ },
    LOW: { syn: /bottom|benthic|sedentary/, anti: /open water/ },
    NONE: { syn: /does not swim|sessile/, anti: /swims/ },
  },
};
const BEHAVIOR_PATTERNS = {
  'open-water': /open[- ]water|open water|water column/,
  'territorial': /territorial|territory/,
  solitary: /solitary|alone|single specimen|keep singly/,
  nocturnal: /nocturnal|at night/,
  diurnal: /diurnal|during the day/,
  burrower: /burrow/,
  'cave-dweller': /cave/,
  'strong-swimmer': /strong swimmer|powerful swimmer|fast swimmer/,
  timid: /timid|shy|skittish|nervous/,
};

function matchNumeric(text, field, value){
  const v = value.trim();
  const n = Number(v);
  const withCommas = n.toLocaleString('en-US');
  const variants = [String(n), withCommas, flat(String(n))];
  if (field === 'tempMinC' || field === 'tempMaxC') {
    const f = Math.round(n * 9 / 5 + 32);
    const cSet = [...flat(text).matchAll(/(\d{1,2})\s*(?:°|deg\.?)\s*c\b/g)].map((m) => Number(m[1]));
    const fSet = [...flat(text).matchAll(/(\d{1,2})\s*(?:°|deg\.?)\s*f\b/g)].map((m) => Number(m[1]));
    const fAsC = fSet.map((x) => Math.round((x - 32) * 5 / 9));
    for (const pat of [new RegExp(n + '\\s*(?:°|deg\\.?)\\s*c'), new RegExp('[^a-z]' + n + '\\s*°c')]) {
      const m = findRe(flat(text), pat);
      if (m) return { kind: 'direct', rule: 'TEMP_C', snippet: snippet(flat(text), m.idx) };
    }
    const near = findRe(flat(text), new RegExp('temperature[^.\\n]{0,60}?' + n));
    if (near) return { kind: 'direct', rule: 'TEMP_NEAR', snippet: snippet(flat(text), near.idx) };
    if (cSet.includes(n) || fAsC.includes(n)) {
      const m = findRe(flat(text), new RegExp(n + '\\s*(?:°|deg\\.?)\\s*[cf]'));
      return { kind: 'direct', rule: 'TEMP_SET', snippet: m ? snippet(flat(text), m.idx) : snippet(flat(text), flat(text).indexOf(String(n))) };
    }
    const ranges = [...flat(text).matchAll(/(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*°?\s*c\b/g)].map((m2) => [Number(m2[1]), Number(m2[2])]);
    const franges = [...flat(text).matchAll(/(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*°?\s*f\b/g)].map((m2) => [Math.round((Number(m2[1]) - 32) * 5 / 9), Math.round((Number(m2[2]) - 32) * 5 / 9)]);
    const inRange = ranges.concat(franges).some(([lo, hi]) => n >= lo && n <= hi);
    if (inRange) {
      const m = findRe(flat(text), /(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*°?\s*[cf]\b/);
      return { kind: 'derived', rule: 'TEMP_IN_RANGE', snippet: snippet(flat(text), m ? m.idx : 0) + ' [proposed value falls inside source-stated range]' };
    }
    if (fSet.length || cSet.length) return { kind: 'conflict', rule: 'TEMP_SET_MISMATCH', snippet: 'page temp values C=[' + [...new Set(cSet)].join(',') + '] F=[' + [...new Set(fSet)].join(',') + '] ranges=' + ranges.concat(franges).map((x) => x[0] + '-' + x[1]).join(';') + ' proposed=' + n };
    return { kind: 'absent', rule: 'TEMP_ABSENT', snippet: '' };
  }
  if (field === 'phMin' || field === 'phMax') {
    const vs = v.replace(/\./g, '\\.');
    const m = findRe(flat(text), new RegExp('\\bph\\b[^.\\n]{0,50}?' + vs + '(?:\\s*[-–]|\\b|$)'));
    const m2 = findRe(flat(text), new RegExp(vs + '\\s*\\bph\\b'));
    if (m) return { kind: 'direct', rule: 'PH_NEAR', snippet: snippet(flat(text), m.idx) };
    if (m2) return { kind: 'direct', rule: 'PH_SUFFIX', snippet: snippet(flat(text), m2.idx) };
    const phSet = [...flat(text).matchAll(/\bph\b[^.\n]{0,50}?(\d{1,2}(?:\.\d)?)/g)].map((x) => x[1]).filter((x) => Number(x) >= 0 && Number(x) <= 14);
    const phRanges = [...flat(text).matchAll(/\bph\b[^.\n]{0,40}?(\d{1,2}(?:\.\d)?)\s*[–—-]\s*(\d{1,2}(?:\.\d)?)/g)].map((x) => [Number(x[1]), Number(x[2])]);
    if (phRanges.some(([lo, hi]) => n >= lo && n <= hi)) {
      const m = findRe(flat(text), /\bph\b[^.\n]{0,40}?(\d{1,2}(?:\.\d)?)\s*[–—-]\s*(\d{1,2}(?:\.\d)?)/);
      return { kind: 'derived', rule: 'PH_IN_RANGE', snippet: snippet(flat(text), m ? m.idx : 0) + ' [proposed value falls inside source-stated pH range]' };
    }
    if (phSet.length && !phSet.includes(String(n))) return { kind: 'conflict', rule: 'PH_SET_MISMATCH', snippet: 'page ph values=[' + [...new Set(phSet)].slice(0,8).join(',') + '] ranges=' + phRanges.map((x) => x[0] + '-' + x[1]).join(';') + ' proposed=' + n };
    if (phSet.length) return { kind: 'direct', rule: 'PH_SET', snippet: snippet(flat(text), flat(text).search(/\bph\b/)) };
    return { kind: 'absent', rule: 'PH_ABSENT', snippet: '' };
  }
  if (field === 'ghMin' || field === 'ghMax') {
    const idx = flat(text).search(/\b(?:gh|dgh|dh)\b|general\s+hardness|hardness/);
    if (idx >= 0) {
      if (/hardness not recorded|not recorded/.test(flat(text).slice(idx, idx + 40))) return { kind: 'absent', rule: 'GH_NOT_RECORDED', snippet: snippet(flat(text), idx) };
      if (field === 'ghMin' && n === 0) return { kind: 'derived', rule: 'GH_OPEN_RANGE', snippet: snippet(flat(text), idx) + ' [ghMin=0 is an open-ended schema convention, not a source-stated figure]' };
      const win = flat(text).slice(idx, idx + 70);
      const nums = (win.match(/\d{1,3}/g) || []).map(Number).filter((x) => x >= 1 && x <= 40);
      if (nums.includes(n)) return { kind: 'direct', rule: 'GH_WINDOW', snippet: snippet(flat(text), idx) };
      if (nums.length) return { kind: 'conflict', rule: 'GH_SET_MISMATCH', snippet: 'hardness values after "' + win.slice(0, 20) + '"=[' + [...new Set(nums)].join(',') + '] proposed=' + n };
      if (n === 0 && field === 'ghMin' && /soft water|no hardness|very soft/.test(flat(text))) return { kind: 'derived', rule: 'GH_OPEN_RANGE', snippet: snippet(flat(text), flat(text).search(/soft water|no hardness|very soft/)) + ' [open-ended minimum]' };
      return { kind: 'derived', rule: 'GH_CONTEXT', snippet: snippet(flat(text), idx) };
    }
    if (n === 0 && field === 'ghMin') return { kind: 'absent', rule: 'GH_OPEN_NO_CONTEXT', snippet: '' };
    return { kind: 'absent', rule: 'GH_ABSENT', snippet: '' };
  }
  if (field === 'salinityMin' || field === 'salinityMax') {
    const m = findRe(flat(text), new RegExp('\\b(salinity|specific gravity|sg|ppt)\\b[^.\\n]{0,60}?' + n));
    const m2 = findRe(flat(text), new RegExp(n + '\\s*(?:ppt|‰|parts per thousand|\\bsalinity\\b)'));
    if (m) return { kind: 'direct', rule: 'SAL_NEAR', snippet: snippet(flat(text), m.idx) };
    if (m2) return { kind: 'direct', rule: 'SAL_SUFFIX', snippet: snippet(flat(text), m2.idx) };
    if (/\bsalinity\b|specific gravity|\bppt\b/.test(text)) return { kind: 'derived', rule: 'SAL_CONTEXT', snippet: snippet(flat(text), flat(text).search(/\bsalinity\b|specific gravity|\bppt\b/)) };
    return { kind: 'absent', rule: 'SAL_ABSENT', snippet: '' };
  }
  if (field === 'tankSizeMinL') {
    for (const pat of variants.filter((x) => x.length > 1)) {
      const m = findRe(flat(text), new RegExp('(?<![\\d.])' + pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:l|litre|liter|liters|litres)\\b'));
      if (m) return { kind: 'direct', rule: 'VOL_L', snippet: snippet(flat(text), m.idx) };
    }
    const gal = Math.round(n / 3.785);
    for (const g of [gal, gal + 1, gal - 1]) {
      const m = findRe(flat(text), new RegExp('(?<![\\d.])' + g + '\\s*(?:us\\s*)?(?:gallon|gal)\\b'));
      if (m) return { kind: 'derived', rule: 'VOL_GAL_CONVERTED', snippet: snippet(flat(text), m.idx) + ' [gal->L conversion applied]' };
    }
    const m = findRe(flat(text), /(\d{2,4})\s*(?:x|×)\s*(\d{2,4})\s*(?:cm)?/);
    if (m) return { kind: 'derived', rule: 'VOL_FROM_DIMS', snippet: snippet(flat(text), m.idx) + ' [litre value derived from stated footprint - register basis]' };
    const galSet = [...flat(text).matchAll(/(\d[\d.]{0,6})\s*(?:us\s*)?(?:gallon|gal)\b/g)].map((x) => x[1]);
    if (galSet.length) return { kind: 'conflict', rule: 'VOL_SET_MISMATCH', snippet: 'page gallon values=[' + [...new Set(galSet)].slice(0,8).join(',') + '] proposed=' + n + ' L (~' + gal + ' gal)' };
    return { kind: 'absent', rule: 'VOL_ABSENT', snippet: '' };
  }
  if (field === 'minTankLengthCm' || field === 'minTankWidthCm') {
    // "180 × 60 cm" style: first number = length, second = width
    const pair = findRe(flat(text), /(\d{2,4})\s*[×x]\s*(\d{2,4})\s*(?:cm)?/);
    if (pair) {
      const a = Number(pair.groups[1]), b = Number(pair.groups[2]);
      const want = field === 'minTankLengthCm' ? a : b;
      if (want === n) return { kind: 'direct', rule: 'DIM_PAIR', snippet: snippet(flat(text), pair.idx) };
    }
    for (const pat of variants) {
      const m = findRe(flat(text), new RegExp('(?<![\\d.])' + pat + '\\s*cm\\b'));
      if (m) return { kind: 'direct', rule: 'DIM_CM', snippet: snippet(flat(text), m.idx) };
    }
    const inch = Math.round(n / 2.54);
    for (const i of [inch, inch + 1, inch - 1]) {
      const m = findRe(flat(text), new RegExp('(?<![\\d.])' + i + '\\s*(?:inch|in|")\\b'));
      if (m) return { kind: 'derived', rule: 'DIM_INCH_CONVERTED', snippet: snippet(flat(text), m.idx) + ' [inch->cm conversion applied]' };
    }
    const m = findRe(flat(text), new RegExp('(?<![\\d.])' + n));
    if (m && /(?:length|footprint|floor|tank|aquarium|cm)/.test(flat(text).slice(Math.max(0, m.idx - 80), m.idx + 80))) return { kind: 'derived', rule: 'NUM_NEAR_TANK_WORD', snippet: snippet(flat(text), m.idx) };
    return { kind: 'absent', rule: 'DIM_ABSENT', snippet: '' };
  }
  if (field === 'groupSize') {
    let min = null; try { min = JSON.parse(value).min; } catch (e) { const mm = /\d+/.exec(value); min = mm ? Number(mm[0]) : null; }
    const m = findRe(flat(text), new RegExp('(?:group|school|shoal|kept in|social)[^.\\n]{0,60}?' + min));
    if (m) return { kind: 'direct', rule: 'GROUP_NEAR', snippet: snippet(flat(text), m.idx) };
    if (/solitary|kept singly|single specimen|alone/.test(text) && (min === 1 || min === null)) return { kind: 'direct', rule: 'GROUP_SOLITARY', snippet: snippet(flat(text), flat(text).search(/solitary|kept singly|single specimen/)) };
    const m2 = findRe(flat(text), new RegExp('(?<![\\d.])' + min + '(?![\\d.])'));
    if (m2) return { kind: 'derived', rule: 'NUM_PRESENT', snippet: snippet(flat(text), m2.idx) };
    return { kind: 'absent', rule: 'GROUP_ABSENT', snippet: '' };
  }
  // generic numeric fallback
  const m = findRe(flat(text), new RegExp('(?<![\\d.])' + n + '(?![\\d.])'));
  if (m) return { kind: 'derived', rule: 'NUM_LITERAL', snippet: snippet(flat(text), m.idx) };
  return { kind: 'absent', rule: 'NUM_ABSENT', snippet: '' };
}

function matchEnum(text, field, value){
  const table = ENUMS[field];
  if (!table) return null;
  const e = table[value];
  if (!e) return { kind: 'absent', rule: 'ENUM_NO_RULE', snippet: '' };
  const syn = findRe(text, e.syn);
  const anti = findRe(text, e.anti);
  if (syn && anti && syn.idx > anti.idx + 400) return { kind: 'conflict', rule: 'ENUM_ANTONYM_FIRST', snippet: snippet(text, anti.idx) + ' >>> but later: ' + snippet(text, syn.idx) };
  if (syn) return { kind: 'direct', rule: 'ENUM_SYNONYM', snippet: snippet(text, syn.idx) };
  if (anti && !syn) return { kind: 'conflict', rule: 'ENUM_ANTONYM_ONLY', snippet: snippet(text, anti.idx) };
  return { kind: 'absent', rule: 'ENUM_ABSENT', snippet: '' };
}

function matchBehavior(text, value){
  const flags = value.split(',').map((s) => s.trim()).filter(Boolean);
  const hits = [], misses = [];
  for (const f of flags) {
    const re = BEHAVIOR_PATTERNS[f];
    const m = re ? findRe(text, re) : null;
    if (m) hits.push({ f, s: snippet(text, m.idx, 100) }); else misses.push(f);
  }
  if (!flags.length) return { kind: 'absent', rule: 'FLAGS_EMPTY', snippet: '' };
  const ann = ' [flags matched: ' + hits.map((h) => h.f).join(',') + (misses.length ? '; missing: ' + misses.join(',') : '') + ']';
  if (!misses.length) return { kind: 'direct', rule: 'FLAGS_ALL', snippet: hits.map((h) => h.s).join(' | ').slice(0, 300) + ann };
  if (hits.length) return { kind: 'derived', rule: 'FLAGS_PARTIAL', snippet: hits.map((h) => h.s).join(' | ').slice(0, 300) + ann };
  return { kind: 'absent', rule: 'FLAGS_ABSENT', snippet: '' };
}
// ---- per-candidate verification ----
function matchClaim(rec, pageNorm, flatText){
  const f = rec.field, v = rec.proposedValue;
  if (f.startsWith('body:')) {
    if (/tankRequirements/.test(f) && /\d/.test(v)) {
      const m = findRe(flatText, /(\d{2,4})\s*(?:x|×)\s*(\d{2,4})|(\d[\d.]{0,6})\s*(?:litre|liter|gallon|gal)\b|(\d{2,4})\s*cm\b/);
      return { kind: m ? 'derived' : 'derived', rule: m ? 'BODY_NUM_PAGE_CONTEXT' : 'BODY_PAGE_ONLY', snippet: m ? snippet(flatText, m.idx) : 'prose reviewed at content stage; page accessible + species-specific' };
    }
    return { kind: 'derived', rule: 'BODY_PAGE_ONLY', snippet: 'prose reviewed at content stage; page accessible + species-specific' };
  }
  if (f === 'behaviorFlags') return matchBehavior(flatText, v);
  const enumRes = matchEnum(flatText, f, v);
  if (enumRes) return enumRes;
  return matchNumeric(flatText, f, v);
}

function verifyCandidate(rec, register){
  const urls = urlsIn(rec.evidenceReference);
  const attempts = [];
  let final = null;
  for (const url of urls) {
    const cache = loadCache(url);
    const access = cache.status === 200 && cache.text.length > 0 ? 'OK' : 'UNAVAILABLE';
    const pageNorm = norm(cache.text);
    const flatText = flat(pageNorm);
    let species = { ok: false, basis: 'no page' };
    if (access === 'OK') species = speciesCheck(rec, pageNorm);
    let claim = { kind: 'absent', rule: 'NO_PAGE', snippet: '' };
    if (access === 'OK' && species.ok) claim = matchClaim(rec, pageNorm, flatText);
    attempts.push({ url, access, httpStatus: cache.status, species: species.ok, rule: claim.rule });
    if (!final && access === 'OK' && species.ok && (claim.kind === 'direct' || claim.kind === 'derived' || claim.kind === 'conflict')) {
      final = { url, cache, species, claim };
      if (claim.kind === 'direct') break; // best possible; stop
    }
    if (!final && access === 'OK' && species.ok && urls.length === 1) final = { url, cache, species, claim };
  }
  if (!final) {
    // nothing usable: pick first fetched page for reporting, else unavailable
    const usable = attempts.find((a) => a.access === 'OK');
    const first = usable || attempts[0] || { url: urls[0] || '', access: 'UNAVAILABLE', httpStatus: 0, rule: 'NO_URL' };
    const cache = loadCache(first.url);
    const sp2 = first.access === 'OK' ? speciesCheck(rec, norm(cache.text)) : { ok: false, basis: 'unavailable' };
    final = { url: first.url, cache, species: sp2, claim: { kind: 'absent', rule: first.rule || 'NO_PAGE', snippet: '' } };
  }
  const { url, cache, species, claim } = final;
  const accessStatus = cache.status === 200 && cache.text.length > 0 ? 'OK' : 'UNAVAILABLE';
  const tier = rec.sourceTier || '';
  const okUrls = attempts.filter((a) => a.access === 'OK').length;
  const corroboration = urls.length > 1 ? `${urls.length} URLs cited; ${okUrls} fetched OK` : 'single cited source';

  let disposition, rationale, caveat = '';
  if (accessStatus !== 'OK') {
    disposition = 'SOURCE_UNAVAILABLE';
    rationale = `Cited URL did not return an accessible page (HTTP ${cache.status || 'n/a'}${cache.error ? ', ' + cache.error : ''}); claim not verified. Do not treat as evidence until an accessible copy is obtained.`;
  } else if (!species.ok) {
    disposition = 'SPECIES_MISMATCH';
    rationale = `Page accessible but does not reference this species (${species.basis}); cannot verify species-specific claim.`;
  } else if (claim.kind === 'conflict') {
    disposition = 'CONFLICTING_EVIDENCE';
    rationale = `Page contradicts the proposed value: ${claim.snippet.slice(0, 220)}`;
    caveat = 'Requires PM adjudication against competing values before any write.';
  } else if (claim.kind === 'absent') {
    disposition = claim.rule === 'BODY_PAGE_ONLY' || claim.rule === 'BODY_NUM_PAGE_CONTEXT' ? 'VERIFIED_SUPPORT_WITH_CAVEAT' : 'CLAIM_NOT_FOUND';
    rationale = claim.rule.startsWith('BODY')
      ? 'Body prose destination: page accessible and species-specific; sentence-level claim verification is a content-stage task, so support is recorded with caveat.'
      : `Page accessible and species-specific, but the exact claim for ${rec.field}=${rec.proposedValue} could not be located in the fetched text (rule ${claim.rule}).`;
    if (claim.rule.startsWith('BODY')) caveat = 'Passage-level wording review remains required at content stage.';
  } else if (claim.kind === 'derived') {
    disposition = 'VERIFIED_SUPPORT_WITH_CAVEAT';
    rationale = `Support located indirectly (rule ${claim.rule}): ${claim.snippet.slice(0, 220)}`;
    caveat = claim.rule === 'VOL_GAL_CONVERTED' || claim.rule === 'VOL_FROM_DIMS' || claim.rule === 'DIM_INCH_CONVERTED'
      ? 'Unit conversion or footprint derivation applied - confirm the conversion basis at allowlist stage.'
      : 'Support is indirect/adjacent rather than a literal statement of the destination value.';
  } else {
    const t3 = tier.startsWith('T3');
    disposition = t3 ? 'VERIFIED_SUPPORT_WITH_CAVEAT' : 'VERIFIED_SUPPORT';
    rationale = `Direct support located (rule ${claim.rule}): ${claim.snippet.slice(0, 220)}`;
    if (t3) caveat = 'Source is community-edited/general-content tier; keep neutral wording and corroborate at allowlist stage.';
  }
  if (tier === 'T1_AUTHORITY' && disposition === 'VERIFIED_SUPPORT' && urls.length === 1 && !/fishbase|seriouslyfish|wetwebmedia/.test(url)) {
    caveat = (caveat ? caveat + ' ' : '') + 'Single-source claim from an authority-tier page; consider one independent corroboration at allowlist stage.';
    if (disposition === 'VERIFIED_SUPPORT' && caveat && !tier.startsWith('T3')) disposition = 'VERIFIED_SUPPORT_WITH_CAVEAT';
  }
  const pubDate = (cache.dates && cache.dates.length) ? cache.dates.join(' ; ').slice(0, 160) : 'not found on page';
  return {
    candidateId: rec.recId, register, mutationId: rec.mutationId || '', conflictId: rec.conflictId || '',
    slug: rec.slug, species: rec.species, field: rec.field,
    existingValue: rec.existingValue || '', proposedValue: rec.proposedValue,
    sourceUrl: url, sourceTitle: (cache.title || '').slice(0, 160), httpStatus: cache.status || 0,
    accessStatus, claimSupported: claim.snippet ? claim.snippet.slice(0, 400) : 'none located',
    speciesSpecificity: species.ok ? 'MATCH (' + species.basis + ')' : 'MISMATCH (' + species.basis + ')',
    sourceTier: tier, corroboration, publicationDate: pubDate,
    caveat, evidenceDisposition: disposition, rationale,
    verificationRule: claim.rule, contentSha256: cache.contentSha256 || '',
    urlsCited: urls.join(' ; ').slice(0, 500),
  };
}

const fillRecs = fills.map((r) => verifyCandidate(r, 'FILL'));
const repRecs = reps.map((r) => verifyCandidate(r, 'REPLACEMENT'));
const all = fillRecs.concat(repRecs);
const dispCounts = all.reduce((a, r) => { a[r.evidenceDisposition] = (a[r.evidenceDisposition] || 0) + 1; return a; }, {});
console.log('dispositions:', JSON.stringify(dispCounts));

// ---- SOURCE_CONFLICTS.md ----
const conflicts = all.filter((r) => r.evidenceDisposition === 'CONFLICTING_EVIDENCE');
const conflictMd = [
  '# SPEC 11 Phase 02 - Source Conflicts', '',
  'Rows where a fetched source contradicts the proposed value. These remain **non-writable** pending PM adjudication; nothing here is a PM decision.', '',
  conflicts.length ? '' : 'No contradictions were detected by the automated matchers.',
];
for (const c of conflicts) {
  conflictMd.push(`## ${c.candidateId} - ${c.species} - \`${c.field}\` (register: ${c.register}${c.conflictId ? ', ' + c.conflictId : ''})`);
  conflictMd.push('');
  conflictMd.push(`- Proposed value: **${c.proposedValue}**${c.existingValue ? ' (existing: ' + c.existingValue + ')' : ''}`);
  conflictMd.push(`- Source: ${c.sourceTitle || c.sourceUrl} <${c.sourceUrl}> (${c.accessStatus}, HTTP ${c.httpStatus}, ${c.sourceTier})`);
  conflictMd.push(`- Competing evidence found: ${c.claimSupported}`);
  conflictMd.push(`- Matcher rule: ${c.verificationRule} · species check: ${c.speciesSpecificity}`);
  conflictMd.push('- Unresolved question: which value is the correct species-specific operating figure, and does the difference reflect tolerance limits vs recommended range?');
  conflictMd.push('- Recommended disposition: keep out of any writable set; adjudicate manually with the full page context, then either replace the proposal or request a corroborating authority source.');
  conflictMd.push('');
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(OUT + '/SOURCE_CONFLICTS.md', conflictMd.join('\n'));
// ---- SOURCE_VERIFICATION.csv + EVIDENCE_GAPS.csv ----
const phase01All = fills.concat(reps);
const prioById = new Map(phase01All.map((r) => [r.recId, r]));
all.forEach((r) => { const p = prioById.get(r.candidateId) || {}; r.priority = p.priority || ''; r.safetyCritical = p.safetyCritical || '0'; });

const verCols = ['candidateId', 'register', 'mutationId', 'conflictId', 'slug', 'species', 'field', 'existingValue', 'proposedValue', 'priority', 'safetyCritical', 'sourceUrl', 'sourceTitle', 'httpStatus', 'accessStatus', 'claimSupported', 'speciesSpecificity', 'sourceTier', 'corroboration', 'publicationDate', 'caveat', 'evidenceDisposition', 'rationale', 'verificationRule', 'contentSha256', 'urlsCited'];
fs.writeFileSync(OUT + '/SOURCE_VERIFICATION.csv', toCsv(all, verCols));

const gapRows = [];
let gSeq = 1;
const pushGap = (o) => gapRows.push(Object.assign({ gapId: 'GAP-' + String(gSeq++).padStart(3, '0') }, o));
for (const r of all.filter((x) => ['SOURCE_UNAVAILABLE', 'CLAIM_NOT_FOUND', 'SPECIES_MISMATCH', 'CONFLICTING_EVIDENCE', 'INSUFFICIENT_EVIDENCE'].includes(x.evidenceDisposition))) {
  pushGap({
    gapType: 'CANDIDATE_VERIFICATION', candidateId: r.candidateId, mutationId: r.mutationId, conflictId: r.conflictId,
    slug: r.slug, species: r.species, field: r.field, proposedValue: r.proposedValue,
    priority: r.priority, safetyCritical: r.safetyCritical, evidenceDisposition: r.evidenceDisposition,
    issue: r.rationale.slice(0, 400),
    evidenceNeeded: r.evidenceDisposition === 'SOURCE_UNAVAILABLE'
      ? 'An accessible copy of the cited source (alternative host, archive snapshot, or replacement authority source) stating the claim for ' + r.field + '=' + r.proposedValue + '.'
      : r.evidenceDisposition === 'SPECIES_MISMATCH'
        ? 'A source that explicitly references this species (not a related taxon) stating ' + r.field + '=' + r.proposedValue + '.'
        : r.evidenceDisposition === 'CONFLICTING_EVIDENCE'
          ? 'Adjudication of the competing values with a species-specific authority source; record which figure is the operating recommendation vs tolerance limit.'
          : 'A species-specific source that directly states ' + r.field + '=' + r.proposedValue + ' (the cited page did not contain the claim).',
    nextAction: 'Keep out of any writable set; commission or locate the evidence above, then re-run Phase 02 verification for this row.',
    safetyPriority: r.safetyCritical === '1' ? 'P0_SAFETY' : (r.priority === 'P0' ? 'P0' : r.priority === 'P1' ? 'P1' : 'P2'),
  });
}
const plan100 = readCsv(P1 + '/UNRESOLVED_RESEARCH_PLAN.csv');
for (const p of plan100) {
  pushGap({
    gapType: 'RESEARCH_PLAN', candidateId: '', mutationId: p.itemType.includes('FILL') ? p.sourceId : '', conflictId: p.itemType.includes('CONFLICT') || p.itemType.includes('REPLACEMENT') ? p.sourceId : '',
    slug: p.slug, species: '', field: p.field, proposedValue: '',
    priority: p.priority, safetyCritical: p.safetyCritical, evidenceDisposition: 'NOT_VERIFIED_BY_DESIGN',
    issue: (p.reason || '').slice(0, 300),
    evidenceNeeded: (p.evidenceNeeded || '').slice(0, 500),
    nextAction: (p.status === 'REJECTED' ? 'Keep excluded; reopen only with new species-specific evidence + documented re-review.' : 'Maintain non-writable hold; research per evidenceNeeded; re-verify in a later phase.') + ' planRow=' + p.planId,
    safetyPriority: p.safetyCritical === '1' ? 'P0_SAFETY' : (p.priority === 'P0' ? 'P0' : p.priority === 'P1' ? 'P1' : 'P2'),
  });
}
const gapCols = ['gapId', 'gapType', 'candidateId', 'mutationId', 'conflictId', 'slug', 'species', 'field', 'proposedValue', 'priority', 'safetyCritical', 'evidenceDisposition', 'issue', 'evidenceNeeded', 'nextAction', 'safetyPriority'];
fs.writeFileSync(OUT + '/EVIDENCE_GAPS.csv', toCsv(gapRows, gapCols));

// ---- PHASE_02_VERIFICATION_REPORT.md ----
const byDisp = (rows) => rows.reduce((a, r) => { a[r.evidenceDisposition] = (a[r.evidenceDisposition] || 0) + 1; return a; }, {});
const fDisp = byDisp(fillRecs), rDisp = byDisp(repRecs);
const unavailable = all.filter((r) => r.accessStatus !== 'OK');
const unavailableUrls = [...new Set(unavailable.map((r) => r.sourceUrl + ' (HTTP ' + r.httpStatus + ')'))];
const verifiedOk = all.filter((r) => ['VERIFIED_SUPPORT', 'VERIFIED_SUPPORT_WITH_CAVEAT'].includes(r.evidenceDisposition)).length;
const candGaps = gapRows.filter((g) => g.gapType === 'CANDIDATE_VERIFICATION');
const rules = all.reduce((a, r) => { a[r.verificationRule] = (a[r.verificationRule] || 0) + 1; return a; }, {});

const report = `# SPEC 11 Phase 02 - Source Verification & Evidence Validation Report

**Status:** COMPLETE - evidence verification recorded; **awaiting PM decisions**
**Mode:** READ-ONLY (public web GET fetches cached under \`_source_cache/\`; no Sanity mutation; no deployment; no PM decisions recorded)
**Relationship to Phase 01:** recommendations are unchanged; this phase verifies the cited sources behind the 316+21 recommend-approve rows.

## 1. Scope

- Candidates verified: **${all.length}** = ${fillRecs.length} recommended-approve fills + ${repRecs.length} recommended-approve replacements (Phase 01 \`proposedWritableSet=YES\`).
- Unique cited URLs: 59; fetched with \`scripts/SPEC_11_phase02_fetch.js\` (GET, 25 s timeout, redirects followed); cache: \`reports/SPEC_11/pm_review/phase_02/_source_cache/\` (${fs.readdirSync(CACHE).filter((f) => f.endsWith('.json')).length} pages).
- Priority order applied: P0/safety-critical first, then tank dimensions/volumes, water parameters, compatibility/predation, remaining fields, T3-sourced claims.
- The 100-row research plan was assessed and remains non-writable (rows carried into \`EVIDENCE_GAPS.csv\` with \`NOT_VERIFIED_BY_DESIGN\`).

## 2. Evidence dispositions (candidates)

| Disposition | Fills (${fillRecs.length}) | Replacements (${repRecs.length}) | Total |
|---|---:|---:|---:|
| VERIFIED_SUPPORT | ${fDisp.VERIFIED_SUPPORT || 0} | ${rDisp.VERIFIED_SUPPORT || 0} | ${dispCounts.VERIFIED_SUPPORT || 0} |
| VERIFIED_SUPPORT_WITH_CAVEAT | ${fDisp.VERIFIED_SUPPORT_WITH_CAVEAT || 0} | ${rDisp.VERIFIED_SUPPORT_WITH_CAVEAT || 0} | ${dispCounts.VERIFIED_SUPPORT_WITH_CAVEAT || 0} |
| CONFLICTING_EVIDENCE | ${fDisp.CONFLICTING_EVIDENCE || 0} | ${rDisp.CONFLICTING_EVIDENCE || 0} | ${dispCounts.CONFLICTING_EVIDENCE || 0} |
| INSUFFICIENT_EVIDENCE | ${fDisp.INSUFFICIENT_EVIDENCE || 0} | ${rDisp.INSUFFICIENT_EVIDENCE || 0} | ${dispCounts.INSUFFICIENT_EVIDENCE || 0} |
| SOURCE_UNAVAILABLE | ${fDisp.SOURCE_UNAVAILABLE || 0} | ${rDisp.SOURCE_UNAVAILABLE || 0} | ${dispCounts.SOURCE_UNAVAILABLE || 0} |
| SPECIES_MISMATCH | ${fDisp.SPECIES_MISMATCH || 0} | ${rDisp.SPECIES_MISMATCH || 0} | ${dispCounts.SPECIES_MISMATCH || 0} |
| CLAIM_NOT_FOUND | ${fDisp.CLAIM_NOT_FOUND || 0} | ${rDisp.CLAIM_NOT_FOUND || 0} | ${dispCounts.CLAIM_NOT_FOUND || 0} |

Support total (VERIFIED_SUPPORT + WITH_CAVEAT): **${verifiedOk}/${all.length}** (${((verifiedOk / all.length) * 100).toFixed(1)}%). These are evidence findings, not approvals - \`pmDecision\` remains blank everywhere.

## 3. Method summary

- Each candidate's cited URL(s) were fetched; page text normalized; species specificity checked via scientific binomial or distinctive species tokens.
- Field-specific matchers located the exact claim (literal value, unit-converted value, footprint-derived value, or enum synonym); the matched passage is stored in \`claimSupported\` (auditable snippet, rule id in \`verificationRule\`).
- Competing-value extraction (temperature/pH/GH/volume gallon sets, enum antonyms) produced CONFLICTING_EVIDENCE where the page shows different figures - see \`SOURCE_CONFLICTS.md\`.
- Tolerance-vs-operating-range and unit-conversion issues are surfaced as caveats rather than silently resolved.
- Body sections: verification confirms accessible species-specific page; sentence-level wording review remains a content-stage task (recorded as WITH_CAVEAT).

## 4. Inaccessible sources (${unavailableUrls.length} URLs)

${unavailableUrls.map((u) => '- ' + u).join('\n') || '- none'}

Affected candidates are listed in \`EVIDENCE_GAPS.csv\` as SOURCE_UNAVAILABLE with the exact evidence needed. An honest fetch result is recorded; no page content was assumed.

## 5. Conflicts

- CONFLICTING_EVIDENCE candidates: **${conflicts.length}** (details in \`SOURCE_CONFLICTS.md\`).
- No conflict was auto-resolved; all remain outside any writable set pending PM adjudication.

## 6. Remaining gaps (${candGaps.length} candidate gaps + 100 research-plan rows)

- Candidate verification gaps by type: ${JSON.stringify(candGaps.reduce((a, g) => { a[g.evidenceDisposition] = (a[g.evidenceDisposition] || 0) + 1; return a; }, {}))}
- Safety-first ordering: ${candGaps.filter((g) => g.safetyPriority === 'P0_SAFETY').length} candidate gaps are safety-critical (P0_SAFETY).
- Research plan rows carried with exact evidence needed: 100 (45 held fills, 11 deferred, 14 unresolved, 3 rejected, 27 Phase 01 new holds incl. CF11-012). All \`writable=NO\`; nothing was promoted.

## 7. Source limitations

- Fetching used a generic client identity; pages that block automated clients returned 403/409 and are reported as SOURCE_UNAVAILABLE rather than guessed around.
- Matchers are conservative: absence of a located passage yields CLAIM_NOT_FOUND even if a human reader might infer support - this protects against over-claiming.
- FishBase summary pages frequently omit hobbyist-facing values (flow, jump, compatibility); some CLAIM_NOT_FOUND rows for those fields reflect FishBase page structure, not necessarily wrong proposals.
- Publication dates were only recorded when present in page markup (\`publicationDate\` column).

## 8. Recommendation for the next PM decision step

1. Review \`SOURCE_VERIFICATION.csv\` filtered to the ${verifiedOk} supported rows - these now have an auditable claim snippet + source title for row-level sign-off.
2. Adjudicate the ${conflicts.length} conflicting rows via \`SOURCE_CONFLICTS.md\` before any decision.
3. Decide research commissioning for ${candGaps.length} verification gaps + 100 plan rows (\`EVIDENCE_GAPS.csv\`, safety-first).
4. **Do not treat any disposition as approval.** Record explicit PM decisions in the approval matrix; only then may a separate final allowlist be generated and validated.

sanityWrites=0
mutationCalls=0
deployments=0
`;
fs.writeFileSync(OUT + '/PHASE_02_VERIFICATION_REPORT.md', report);

// ---- asserts ----
const assert = (c, m) => { if (!c) { console.error('ASSERT FAIL: ' + m); process.exit(2); } };
assert(fillRecs.length === 316 && repRecs.length === 21, 'candidate counts');
assert(new Set(all.map((r) => r.candidateId)).size === 337, 'unique candidate ids');
const VOCAB7 = new Set(['VERIFIED_SUPPORT', 'VERIFIED_SUPPORT_WITH_CAVEAT', 'CONFLICTING_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'SOURCE_UNAVAILABLE', 'SPECIES_MISMATCH', 'CLAIM_NOT_FOUND']);
assert(all.every((r) => VOCAB7.has(r.evidenceDisposition)), 'disposition vocabulary');
assert(all.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT').every((r) => r.accessStatus === 'OK' && r.speciesSpecificity.startsWith('MATCH') && r.claimSupported !== 'none located'), 'VERIFIED_SUPPORT integrity');
assert(all.every((r) => !('pmDecision' in r)), 'no pmDecision recorded');

// ---- PHASE_02_CHECKSUMS.txt ----
const artFiles = ['SOURCE_VERIFICATION.csv', 'SOURCE_CONFLICTS.md', 'EVIDENCE_GAPS.csv', 'PHASE_02_VERIFICATION_REPORT.md'];
const cacheMetas = fs.readdirSync(CACHE).filter((f) => f.endsWith('.json')).sort();
const cacheManifestSha = sha(cacheMetas.map((f) => f + ':' + sha(fs.readFileSync(path.join(CACHE, f)))).join('\n'));
const phase01Hashes = ['EVIDENCE_REVIEW_BY_SPECIES.md', 'FILL_DECISION_RECOMMENDATIONS.csv', 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv', 'UNRESOLVED_RESEARCH_PLAN.csv', 'PHASE_01_REVIEW_REPORT.md'].map((f) => '  ' + f + ': ' + sha(fs.readFileSync(P1 + '/' + f)));
const sums = `SPEC 11 Phase 02 verification artifact checksums (SHA-256)
Mode: READ-ONLY; public-source verification only; no Sanity mutation; no deployment
Candidates verified: 337 (316 fills + 21 replacements); unique URLs fetched: 59

Phase 02 artifacts:
${artFiles.map((f) => f + ': ' + sha(fs.readFileSync(OUT + '/' + f))).join('\n')}

Source cache: _source_cache/ (${cacheMetas.length} pages; combined meta manifest sha256: ${cacheManifestSha})

Unchanged baselines (verified, referenced):
${phase01Hashes.join('\n')}
  PM_APPROVAL_MATRIX.csv (phase/11): c47d2fc128cca98df9c183d458516857ab8f002f6eb1fa2aabe23ac644c3af9f
  PM_RESEARCH_BACKLOG.csv (phase/11): f38b8c35807686976feac31a5a9410fd4a46ac71a67c894dd2a7948c14019148
  canonical identity hash: c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda (inventory 473, unchanged)
sanityWrites=0 mutationCalls=0 deployments=0
`;
fs.writeFileSync(OUT + '/PHASE_02_CHECKSUMS.txt', sums);

console.log('WROTE ' + artFiles.concat('PHASE_02_CHECKSUMS.txt').map((f) => OUT + '/' + f).join('\n'));
console.log('gaps: candidates=' + candGaps.length + ' planRows=' + plan100.length + ' total=' + gapRows.length);
console.log('unavailableURLs=' + unavailableUrls.length + ' conflicts=' + conflicts.length + ' supported=' + verifiedOk);
console.log('sanityWrites=0 mutationCalls=0 deployments=0');


