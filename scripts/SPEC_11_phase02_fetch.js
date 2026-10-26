// SPEC 11 Phase 02 source fetcher - GET-only public web reads; no Sanity access.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const CACHE = 'reports/SPEC_11/pm_review/phase_02/_source_cache';
const UA = 'AquaMindWiki-Verification/1.0 (research evidence check; GET only; contact: repo maintainers)';
const TIMEOUT = 25000;
const MAX_BYTES = 2.5 * 1024 * 1024;

function sp(l){const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else c+=ch;}}r.push(c);return r;}
function readCsv(f){const l=fs.readFileSync(f,'utf8').replace(/^﻿/,'').split(/\r?\n/).filter(x=>x);const h=sp(l[0]);return l.slice(1).map(x=>{const r=sp(x);const o={};h.forEach((k,i)=>o[k]=r[i]??'');return o;});}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const urlId = (u) => sha(u).slice(0, 16);

function collectUrls() {
  const fills = readCsv('reports/SPEC_11/pm_review/phase_01/FILL_DECISION_RECOMMENDATIONS.csv').filter((r) => r.proposedWritableSet === 'YES');
  const reps = readCsv('reports/SPEC_11/pm_review/phase_01/REPLACEMENT_DECISION_RECOMMENDATIONS.csv').filter((r) => r.proposedWritableSet === 'YES');
  const urls = new Set();
  const re = /https?:\/\/[^\s<>)\]]+/g;
  for (const r of fills.concat(reps)) { const ms = (r.evidenceReference || '').match(re) || []; ms.forEach((u) => urls.add(u.replace(/[.,;:]+$/,''))); }
  return [...urls].sort();
}

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    let lib = url.startsWith('http:') ? http : https;
    const req = lib.get(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' }, timeout: TIMEOUT }, (res) => {
      const status = res.statusCode;
      if (status >= 300 && status < 400 && res.headers.location && redirects < 5) {
        res.resume();
        let next = res.headers.location;
        if (next.startsWith('/')) { const u = new URL(url); next = u.protocol + '//' + u.host + next; }
        return fetchUrl(next, redirects + 1).then(resolve);
      }
      const chunks = [];
      let size = 0, aborted = false;
      res.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { aborted = true; req.destroy(); return; } chunks.push(c); });
      res.on('end', () => { if (aborted) return resolve({ url, status, error: 'too_large', finalUrl: url, html: '' }); resolve({ url, status, finalUrl: res.responseUrl || url, html: Buffer.concat(chunks).toString('utf8') }); });
      res.on('error', (e) => resolve({ url, status, error: e.message, finalUrl: url, html: '' }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, error: 'timeout', finalUrl: url, html: '' }); });
    req.on('error', (e) => resolve({ url, status: 0, error: e.message || 'network', finalUrl: url, html: '' }));
  });
}

function htmlToText(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [, ''])[1].replace(/\s+/g, ' ').trim();
  const dates = [];
  const dm = html.match(/(?:dateModified|datePublished|last[- ]?updated|Published|Updated)[^<\n]{0,40}(20\d{2}|19\d{2})[-/](\d{1,2})?[-/]?(\d{1,2})?/gi) || [];
  dm.slice(0, 3).forEach((d) => dates.push(d.slice(0, 80)));
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
  return { text: t.slice(0, 400000), title, dates };
}

(async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  const urls = collectUrls();
  console.log('urls to ensure:', urls.length);
  const results = [];
  const queue = urls.slice();
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const metaPath = path.join(CACHE, urlId(url) + '.json');
      if (fs.existsSync(metaPath) && !process.argv.includes('--refetch')) {
        const m = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        results.push({ url, status: m.status, cached: true, error: m.error || '' });
        continue;
      }
      const r = await fetchUrl(url);
      const { text, title, dates } = r.html ? htmlToText(r.html) : { text: '', title: '', dates: [] };
      const meta = {
        url, finalUrl: r.finalUrl, status: r.status, error: r.error || '', title,
        textLen: text.length, contentSha256: text ? sha(text) : '', dates,
        fetchedAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(CACHE, urlId(url) + '.json'), JSON.stringify(meta, null, 2));
      fs.writeFileSync(path.join(CACHE, urlId(url) + '.txt'), text);
      results.push({ url, status: r.status, cached: false, error: r.error || '', textLen: text.length });
      console.log((r.status === 200 ? 'OK  ' : 'FAIL') + ' ' + r.status + ' ' + url + (r.error ? ' [' + r.error + ']' : '') + (text.length ? ' text=' + text.length : ''));
      await new Promise((res) => setTimeout(res, 250));
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  const ok = results.filter((r) => r.status === 200).length;
  const fail = results.filter((r) => r.status !== 200);
  console.log('FETCH SUMMARY: ok=' + ok + '/' + results.length + ' failed=' + fail.length);
  fail.forEach((f) => console.log('  UNAVAILABLE ' + f.status + ' ' + f.url + (f.error ? ' ' + f.error : '')));
})();
