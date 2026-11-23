#!/usr/bin/env node
/**
 * GSC indexing inventory and crawl audit.
 *
 * Read-only GET crawl of the sitemap + route probes. No Sanity writes, no
 * deployment. Writes CSV/JSON evidence under the requested output directory.
 *
 * Usage:
 *   node scripts/gsc/audit-indexing.mjs --base=https://www.aquamind.life --label=production-baseline --out=report/gsc-2026-11-22/baseline-production
 *   node scripts/gsc/audit-indexing.mjs --base=http://localhost:3106 --label=local-postfix --out=report/gsc-2026-11-22/postfix-local
 */
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=')
    return [key, rest.join('=')]
  })
)
const BASE = (args.base || 'https://www.aquamind.life').replace(/\/$/, '')
const LABEL = args.label || 'audit'
const OUT = path.resolve(args.out || 'report/gsc-2026-11-22/audit')
const AUDIT_DATE = '2026-11-22'
const CONCURRENCY = Number(args.concurrency || 6)

const STATIC_PROBES = [
  '/styles',
  '/search',
  '/styles/iwagumi',
  '/inspiration',
  '/hubs',
  '/collections',
  '/learn',
  '/tools',
  '/problems/diagnose',
  '/finder',
  '/setup-planner',
]

const FILTERED_PROBES = [
  '/species?difficulty=Beginner',
  '/corals?coralType=lps',
  '/problems?category=fish',
  '/search?q=Vietnam&type=species',
]

const UNKNOWN_PROBES = [
  '/species/__gsc_missing__',
  '/plants/__gsc_missing__',
  '/corals/__gsc_missing__',
  '/invertebrates/__gsc_missing__',
  '/equipment/__gsc_missing__',
  '/problems/__gsc_missing__',
  '/posts/__gsc_missing__',
  '/category/__gsc_missing__',
  '/inspiration/__gsc_missing__',
  '/collections/__gsc_missing__',
  '/learn/__gsc_missing__',
  '/styles/__gsc_missing__',
  '/hubs/__gsc_missing__',
  '/this-route-does-not-exist',
]

const ASSET_EXTENSION = /\.(?:css|js|mjs|json|xml|txt|png|jpe?g|gif|webp|svg|ico|pdf|zip|woff2?|ttf|eot|mp4|webm|avif)(?:$|\?)/i

function parseHtml(html) {
  const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) || [])[1] || ''
  const robots = (html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/) || [])[1] || ''
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''
  const h1Raw = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''
  const h1 = h1Raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((match) => match[1])
  return { canonical, robots, title: title.trim(), h1, links }
}

function normalizeInternalLink(href, base) {
  if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return null
  let url
  try {
    url = new URL(href, base)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (url.host !== new URL(base).host) return null
  if (ASSET_EXTENSION.test(url.pathname)) return null
  const pathname = url.pathname || '/'
  return {
    href,
    path: pathname,
    hasQuery: Boolean(url.search),
    trailingSlash: pathname !== '/' && pathname.endsWith('/'),
  }
}

async function crawl(url, base) {
  let current = url
  const chain = []
  for (let i = 0; i < 6; i++) {
    let response
    try {
      response = await fetch(current, {
        redirect: 'manual',
        headers: { 'user-agent': 'AquaMind-GSC-Indexing-Audit/1.0' },
        signal: AbortSignal.timeout(30000),
      })
    } catch (error) {
      return { url, finalUrl: current, status: 0, chain, error: String(error), canonical: '', robots: '', xRobots: '', title: '', h1: '', htmlBytes: 0, links: [] }
    }
    chain.push({ status: response.status, url: current, location: response.headers.get('location') || '' })
    if ([301, 302, 307, 308].includes(response.status) && response.headers.get('location')) {
      current = new URL(response.headers.get('location'), current).toString()
      continue
    }
    const contentType = response.headers.get('content-type') || ''
    const html = contentType.includes('text/html') ? await response.text() : ''
    return {
      url,
      finalUrl: current,
      status: response.status,
      chain,
      xRobots: response.headers.get('x-robots-tag') || '',
      htmlBytes: Buffer.byteLength(html),
      ...parseHtml(html),
    }
  }
  return { url, finalUrl: current, status: 999, chain, error: 'redirect loop', canonical: '', robots: '', xRobots: '', title: '', h1: '', htmlBytes: 0, links: [] }
}

function familyFor(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return 'home'
  if (parts[0] === 'tools') return `tools/${parts[1] ? 'detail' : 'index'}`
  if (['species', 'plants', 'corals', 'invertebrates', 'equipment', 'problems', 'posts', 'category', 'learn', 'collections', 'styles', 'hubs', 'inspiration'].includes(parts[0])) {
    return `${parts[0]}/${parts[1] ? 'detail' : 'index'}`
  }
  return parts[0]
}

function isSoft404(result) {
  if (result.status !== 200) return false
  const title = (result.title || '').toLowerCase()
  const h1 = (result.h1 || '').toLowerCase()
  return /not found|404|article not found|collection not found/.test(`${title} ${h1}`)
}

function classify(result, inSitemap, source) {
  const finalPath = new URL(result.finalUrl).pathname
  const hasQuery = Boolean(new URL(result.url).search)
  const isSearch = finalPath === '/search'
  const noindex = /noindex/i.test(result.robots || '') || /noindex/i.test(result.xRobots || '')
  const redirected = result.chain.some((item) => [301, 302, 307, 308].includes(item.status))
  const nonSelfCanonical = Boolean(result.canonical) && result.canonical.replace(/\/$/, '') !== result.finalUrl.replace(/\/$/, '')

  if (result.status === 404 || result.status === 410) return { classification: 'EXPECTED_404', reason: 'Unknown/removed route returns a real 404/410.' }
  if (result.status === 0) return { classification: 'HTTP_ERROR', reason: result.error || 'Request failed.' }
  if (result.status === 999) return { classification: 'HTTP_ERROR', reason: result.error || 'Redirect loop.' }
  if (redirected) {
    if (inSitemap) return { classification: 'REDIRECT_URL_IN_SITEMAP', reason: 'Sitemap URL redirects; sitemap must contain the final URL only.' }
    return { classification: 'REDIRECT_URL', reason: `Internal/legacy URL redirects to ${result.finalUrl}.` }
  }
  if (result.status !== 200) return { classification: 'HTTP_ERROR', reason: `HTTP ${result.status}.` }
  if (isSoft404(result)) return { classification: 'SOFT_404_OR_THIN_ROUTE_CANDIDATE', reason: 'HTTP 200 but the rendered title/H1 is a not-found page.' }
  if (inSitemap && noindex) return { classification: 'NOINDEX_URL_IN_SITEMAP', reason: 'Sitemap URL declares noindex or X-Robots-Tag noindex.' }
  if (inSitemap && nonSelfCanonical) return { classification: 'DUPLICATE_OR_NONCANONICAL', reason: `Sitemap URL canonicalizes to ${result.canonical}.` }
  if (inSitemap && !result.canonical) return { classification: 'DUPLICATE_OR_NONCANONICAL', reason: 'Sitemap URL has no canonical.' }
  if (hasQuery || isSearch) {
    return { classification: 'FILTERED_OR_PARAMETER_URL', reason: isSearch ? 'Search result page is intentionally noindex.' : 'Filtered/parameter URL; verify noindex + canonical base.' }
  }
  if (noindex) return { classification: 'INTENTIONALLY_NONINDEXABLE', reason: 'Noindex route outside sitemap; verify intent.' }
  if (inSitemap) return { classification: 'INDEXABLE_AND_CORRECT', reason: 'HTTP 200, self-canonical, indexable, in sitemap.' }
  if (result.canonical && result.canonical.replace(/\/$/, '') === result.finalUrl.replace(/\/$/, '')) {
    return { classification: 'INDEXABLE_BUT_MISSING_FROM_SITEMAP', reason: 'HTTP 200, self-canonical, indexable, but absent from sitemap.' }
  }
  return { classification: 'NEEDS_GSC_URL_CONFIRMATION', reason: 'Unclassified URL; exact GSC group is unavailable.' }
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length)
  let index = 0
  async function run() {
    while (index < items.length) {
      const i = index++
      results[i] = await worker(items[i], i)
      if ((i + 1) % 50 === 0) console.log(`crawled ${i + 1}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const sitemapResponse = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(30000) })
  const sitemapXml = await sitemapResponse.text()
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemapXml, 'utf8')
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  const sitemapSet = new Set(sitemapUrls)
  const sitemapNormalized = new Set(sitemapUrls.map((url) => url.replace(/\/$/, '')))

  const robotsResponse = await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(30000) })
  const robotsText = await robotsResponse.text()
  fs.writeFileSync(path.join(OUT, 'robots.txt'), robotsText, 'utf8')

  const initialTargets = [
    ...sitemapUrls.map((url) => ({ url, source: 'sitemap' })),
    ...STATIC_PROBES.map((p) => ({ url: `${BASE}${p}`, source: 'static-probe' })),
    ...FILTERED_PROBES.map((p) => ({ url: `${BASE}${p}`, source: 'filtered-probe' })),
    ...UNKNOWN_PROBES.map((p) => ({ url: `${BASE}${p}`, source: 'unknown-probe' })),
  ]
  const seen = new Set()
  const targets = initialTargets.filter((target) => {
    const key = target.url.replace(/\/$/, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`base=${BASE} sitemap=${sitemapUrls.length} targets=${targets.length}`)
  const firstPass = await pool(targets, async (target) => ({ target, result: await crawl(target.url, BASE) }), CONCURRENCY)

  const linkSources = new Map()
  const internalLinkIssues = []
  for (const { target, result } of firstPass) {
    if (target.source !== 'sitemap' || result.status !== 200) continue
    for (const href of result.links || []) {
      const link = normalizeInternalLink(href, BASE)
      if (!link) continue
      const canonicalTarget = `${BASE}${link.path.replace(/\/$/, '') || '/'}`
      if (!linkSources.has(canonicalTarget)) linkSources.set(canonicalTarget, new Set())
      if (canonicalTarget !== result.finalUrl) linkSources.get(canonicalTarget).add(result.url)
      if (link.trailingSlash) internalLinkIssues.push({ from: result.url, to: href, reason: 'Trailing-slash link redirects to the non-slash canonical URL.' })
      if (link.path === '/tools/setup-planner') internalLinkIssues.push({ from: result.url, to: href, reason: 'Internal link points to a configured redirect source.' })
    }
  }

  const extraTargets = [...linkSources.keys()]
    .filter((url) => !seen.has(url.replace(/\/$/, '')))
    .map((url) => ({ url, source: 'internal-link' }))
  for (const target of extraTargets) seen.add(target.url.replace(/\/$/, ''))
  const extraPass = extraTargets.length
    ? await pool(extraTargets, async (target) => ({ target, result: await crawl(target.url, BASE) }), CONCURRENCY)
    : []

  const all = [...firstPass, ...extraPass]
  const rows = all.map(({ target, result }) => {
    const inSitemap = sitemapSet.has(result.url) || sitemapSet.has(result.finalUrl) || sitemapNormalized.has(result.url.replace(/\/$/, '')) || sitemapNormalized.has(result.finalUrl.replace(/\/$/, ''))
    const classification = classify(result, inSitemap, target.source)
    const inbound = linkSources.get(result.finalUrl.replace(/\/$/, ''))?.size || linkSources.get(result.url.replace(/\/$/, ''))?.size || 0
    return {
      url: result.url,
      source: target.source,
      inSitemap,
      family: familyFor(new URL(result.finalUrl).pathname),
      status: result.status,
      finalUrl: result.finalUrl,
      redirectChain: result.chain.filter((item) => [301, 302, 307, 308].includes(item.status)).map((item) => `${item.status} ${item.url} -> ${item.location}`).join(' | '),
      canonical: result.canonical || '',
      robots: result.robots || '',
      xRobots: result.xRobots || '',
      title: result.title || '',
      h1: result.h1 || '',
      htmlBytes: result.htmlBytes || 0,
      inboundLinks: inbound,
      classification: classification.classification,
      reason: classification.reason,
      error: result.error || '',
    }
  }).sort((a, b) => a.url.localeCompare(b.url))

  const countBy = (key) => rows.reduce((counts, row) => { counts[row[key]] = (counts[row[key]] || 0) + 1; return counts }, {})
  const summary = {
    label: LABEL,
    auditDate: AUDIT_DATE,
    base: BASE,
    readOnly: true,
    sitemap: {
      url: `${BASE}/sitemap.xml`,
      httpStatus: sitemapResponse.status,
      urlCount: sitemapUrls.length,
      duplicateUrls: sitemapUrls.length - new Set(sitemapUrls).size,
      queryUrls: sitemapUrls.filter((url) => url.includes('?')).length,
    },
    robots: { httpStatus: robotsResponse.status, disallowsStudio: /Disallow:\s*\/studio/i.test(robotsText), sitemapDirective: /Sitemap:\s*https:\/\/www\.aquamind\.life\/sitemap\.xml/i.test(robotsText) },
    crawledTargets: rows.length,
    classificationCounts: countBy('classification'),
    statusCounts: countBy('status'),
    sitemapUrlIssues: rows.filter((row) => row.inSitemap && row.classification !== 'INDEXABLE_AND_CORRECT').map((row) => ({ url: row.url, classification: row.classification, reason: row.reason })),
    indexableMissingFromSitemap: rows.filter((row) => row.classification === 'INDEXABLE_BUT_MISSING_FROM_SITEMAP').map((row) => row.url),
    soft404Candidates: rows.filter((row) => row.classification === 'SOFT_404_OR_THIN_ROUTE_CANDIDATE').map((row) => ({ url: row.url, status: row.status, title: row.title, h1: row.h1 })),
    unknownProbeResults: rows.filter((row) => row.source === 'unknown-probe').map((row) => ({ url: row.url, status: row.status, classification: row.classification })),
    filteredProbeResults: rows.filter((row) => row.source === 'filtered-probe').map((row) => ({ url: row.url, status: row.status, canonical: row.canonical, robots: row.robots, classification: row.classification })),
    internalLinkIssueCount: internalLinkIssues.length,
  }

  const csvEscape = (value) => {
    const text = String(value ?? '')
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const columns = ['url', 'source', 'inSitemap', 'family', 'status', 'finalUrl', 'redirectChain', 'canonical', 'robots', 'xRobots', 'title', 'h1', 'htmlBytes', 'inboundLinks', 'classification', 'reason', 'error']
  fs.writeFileSync(path.join(OUT, 'url-inventory.csv'), `\ufeff${[columns.join(','), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))].join('\n')}\n`, 'utf8')
  fs.writeFileSync(path.join(OUT, 'url-inventory.json'), `${JSON.stringify({ summary, rows }, null, 2)}\n`, 'utf8')
  fs.writeFileSync(path.join(OUT, 'crawl-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  const issueColumns = ['from', 'to', 'reason']
  fs.writeFileSync(path.join(OUT, 'internal-link-issues.csv'), `\ufeff${[issueColumns.join(','), ...internalLinkIssues.map((row) => issueColumns.map((column) => csvEscape(row[column])).join(','))].join('\n')}\n`, 'utf8')
  fs.writeFileSync(path.join(OUT, 'internal-link-issues.json'), `${JSON.stringify(internalLinkIssues, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
