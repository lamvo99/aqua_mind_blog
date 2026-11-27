#!/usr/bin/env node
/**
 * Bounded first-party internal-link checker for AquaMind.
 *
 * Local use:
 *   npm run build
 *   npx next start -p 3100
 *   npm run seo:links
 *
 * Production smoke (opt-in):
 *   npm run seo:smoke
 *
 * Direct use:
 *   node scripts/seo/check-internal-links.mjs --base https://www.aquamind.life --mode smoke
 *   node scripts/seo/check-internal-links.mjs --base http://localhost:3100 --mode inventory
 *   node scripts/seo/check-internal-links.mjs --base http://localhost:3100 --mode sitemap-sample --source-limit 10
 *
 * The checker never crawls unboundedly: it checks a fixed representative source
 * inventory, or a deterministic sample of sitemap URLs, and stops after
 * --max-targets unique destinations. External, mailto, tel and javascript links
 * are ignored. /studio is excluded because it is the CMS and robots-disallowed.
 */

import { pathToFileURL } from "node:url"
import path from "node:path"

export const DEFAULT_INVENTORY_SOURCES = [
  "/",
  "/about",
  "/database",
  "/wiki",
  "/tools",
  "/tools/reef-dosing",
  "/equipment",
  "/equipment/aquarium-soil-substrate",
  "/invertebrates",
  "/invertebrates/neocaridina-davidi",
  "/species",
  "/species/oscar",
  "/posts",
  "/collections/beginner-invertebrates",
  "/problems",
  "/learn",
]

export const DEFAULT_SMOKE_SOURCES = [
  "/",
  "/tools/reef-dosing",
  "/equipment/aquarium-soil-substrate",
  "/invertebrates/neocaridina-davidi",
  "/collections/beginner-invertebrates",
  "/posts/20-30l-nano-aquarium-the-perfect-choice-for-beginners",
  "/species/oscar",
]

export const EXCLUDED_PATH_PREFIXES = ["/studio"]

const TRACKING_PARAM = /^(utm_|gclid$|fbclid$|msclkid$|mc_cid$|mc_eid$)/

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

export function normalizeInternalUrl(input, pageUrl, origin) {
  if (!input || typeof input !== "string") return null
  const trimmed = decodeHtml(input).trim()
  if (!trimmed || trimmed.startsWith("#")) return null
  if (/^(mailto|tel|javascript|data|blob):/i.test(trimmed)) return null

  let url
  try {
    url = new URL(trimmed, pageUrl)
  } catch {
    return null
  }

  if (url.origin !== origin) return null
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return null
  }

  url.hash = ""
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "")
  }
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) url.searchParams.delete(key)
  }
  return url.toString()
}

export function extractFirstPartyLinks(html, pageUrl, origin) {
  if (!html || typeof html !== "string") return []
  const seen = new Set()
  const links = []
  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi
  for (const match of html.matchAll(hrefPattern)) {
    const normalized = normalizeInternalUrl(match[1], pageUrl, origin)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    links.push(normalized)
  }
  return links
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500
}

export async function fetchWithRetry(
  url,
  { timeoutMs = 20000, retries = 2, method = "GET", redirect = "follow" } = {}
) {
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        redirect,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": "AquaMindSEORegression/1.0" },
      })
      const body = method === "HEAD" ? "" : await response.text()
      if (isRetryableStatus(response.status) && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`)
        await sleep(300 * (attempt + 1))
        continue
      }
      return {
        status: response.status,
        finalUrl: response.url || url,
        headers: response.headers,
        body,
        error: null,
      }
    } catch (error) {
      lastError = error
      if (attempt < retries) await sleep(300 * (attempt + 1))
    }
  }
  return {
    status: 0,
    finalUrl: url,
    headers: null,
    body: "",
    error: lastError instanceof Error ? lastError.message : String(lastError || "fetch failed"),
  }
}

function sampleSitemapUrls(locs, origin, limit) {
  const sameOrigin = locs.filter((loc) => {
    try {
      return new URL(loc).origin === origin
    } catch {
      return false
    }
  })
  if (sameOrigin.length === 0) return []
  const step = Math.max(1, Math.floor(sameOrigin.length / limit))
  const sample = []
  for (let index = 0; index < sameOrigin.length && sample.length < limit; index += step) {
    sample.push(sameOrigin[index])
  }
  return sample
}

async function resolveSources(options, origin) {
  if (Array.isArray(options.sources) && options.sources.length > 0) return options.sources
  if (options.mode === "smoke") return DEFAULT_SMOKE_SOURCES
  if (options.mode === "sitemap-sample") {
    const sitemapUrl = new URL("/sitemap.xml", options.base).toString()
    const response = await fetchWithRetry(sitemapUrl, {
      timeoutMs: options.timeoutMs,
      retries: options.retries,
    })
    if (response.status !== 200 || response.error) {
      throw new Error(`Cannot read sitemap at ${sitemapUrl}: ${response.error || `HTTP ${response.status}`}`)
    }
    const locs = [...response.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
    return sampleSitemapUrls(locs, origin, options.sourceLimit)
  }
  return DEFAULT_INVENTORY_SOURCES
}

function parseArgs(argv) {
  const options = {
    base: process.env.SEO_BASE_URL || "http://localhost:3100",
    mode: "inventory",
    sourceLimit: 12,
    maxTargets: 200,
    concurrency: 4,
    timeoutMs: 20000,
    retries: 2,
    jsonOut: "",
    sources: [],
    help: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = () => {
      index += 1
      return argv[index]
    }
    if (arg === "--base") options.base = next()
    else if (arg === "--mode") options.mode = next()
    else if (arg === "--source-limit") options.sourceLimit = Number(next())
    else if (arg === "--max-targets") options.maxTargets = Number(next())
    else if (arg === "--concurrency") options.concurrency = Number(next())
    else if (arg === "--timeout-ms") options.timeoutMs = Number(next())
    else if (arg === "--retries") options.retries = Number(next())
    else if (arg === "--json-out") options.jsonOut = next()
    else if (arg === "--sources") {
      options.sources.push(...String(next() || "").split(",").map((value) => value.trim()).filter(Boolean))
    } else if (arg === "--help" || arg === "-h") options.help = true
  }
  return options
}

export async function runLinkCheck(options = {}) {
  const config = {
    base: options.base || process.env.SEO_BASE_URL || "http://localhost:3100",
    mode: options.mode || "inventory",
    sourceLimit: options.sourceLimit ?? 12,
    maxTargets: options.maxTargets ?? 200,
    concurrency: options.concurrency ?? 4,
    timeoutMs: options.timeoutMs ?? 20000,
    retries: options.retries ?? 2,
    sources: options.sources || [],
  }
  const origin = new URL(config.base).origin
  const sources = await resolveSources(config, origin)
  const sourceResults = []
  const targetSources = new Map()
  let truncated = false

  for (const source of sources) {
    const sourceUrl = new URL(source, config.base).toString()
    const page = await fetchWithRetry(sourceUrl, {
      timeoutMs: config.timeoutMs,
      retries: config.retries,
      method: "GET",
    })
    if (page.status !== 200 || page.error) {
      sourceResults.push({
        source: sourceUrl,
        status: page.status,
        error: page.error,
      })
      continue
    }
    const links = extractFirstPartyLinks(page.body, sourceUrl, origin)
    for (const link of links) {
      if (!targetSources.has(link)) {
        if (targetSources.size >= config.maxTargets) {
          truncated = true
          continue
        }
        targetSources.set(link, new Set())
      }
      targetSources.get(link).add(sourceUrl)
    }
    sourceResults.push({ source: sourceUrl, status: 200, links: links.length, error: null })
  }

  const queue = [...targetSources.keys()]
  const targetResults = []
  async function worker() {
    while (queue.length > 0) {
      const target = queue.shift()
      let response = await fetchWithRetry(target, {
        timeoutMs: config.timeoutMs,
        retries: config.retries,
        method: "HEAD",
      })
      if (response.status === 405 || response.status === 501) {
        response = await fetchWithRetry(target, {
          timeoutMs: config.timeoutMs,
          retries: config.retries,
          method: "GET",
        })
      }
      const ok = !response.error && response.status >= 200 && response.status < 400
      targetResults.push({
        target,
        status: response.status,
        finalUrl: response.finalUrl,
        error: response.error,
        sources: [...targetSources.get(target)],
        ok,
      })
    }
  }
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(config.concurrency, 8)) }, () => worker())
  )

  const failures = targetResults.filter((result) => !result.ok)
  const sourceFailures = sourceResults.filter((result) => result.status !== 200 || result.error)
  return {
    checkedAt: new Date().toISOString(),
    base: config.base,
    mode: config.mode,
    sources: sourceResults,
    targets: targetResults,
    summary: {
      sourceCount: sourceResults.length,
      sourceFailures: sourceFailures.length,
      uniqueTargets: targetResults.length,
      passed: targetResults.length - failures.length,
      failed: failures.length,
      truncated,
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(`Usage: node scripts/seo/check-internal-links.mjs [options]

  --base <url>         Base URL (default: SEO_BASE_URL or http://localhost:3100)
  --mode <mode>        inventory | smoke | sitemap-sample (default: inventory)
  --sources <a,b,c>    Explicit source paths instead of the built-in inventory
  --source-limit <n>   Max sitemap sample sources (default: 12)
  --max-targets <n>    Max unique internal targets (default: 200)
  --concurrency <n>    Concurrent target checks, max 8 (default: 4)
  --timeout-ms <n>     Per-request timeout (default: 20000)
  --retries <n>        Retries for network/5xx/429 failures (default: 2)
  --json-out <file>    Write the full result JSON to a file
`)
    return
  }

  const result = await runLinkCheck(options)
  console.log(`SEO internal-link check`)
  console.log(`Base: ${result.base}`)
  console.log(`Mode: ${result.mode}`)
  console.log(
    `Sources: ${result.summary.sourceCount}; unique targets: ${result.summary.uniqueTargets}; passed: ${result.summary.passed}; failed: ${result.summary.failed}`
  )
  if (result.summary.truncated) {
    console.log(`Target limit reached; additional links were not checked (--max-targets ${options.maxTargets}).`)
  }
  for (const source of result.sources) {
    if (source.status !== 200 || source.error) {
      console.log(`[SOURCE FAIL] ${source.source} -> ${source.error || `HTTP ${source.status}`}`)
    }
  }
  for (const failure of result.targets.filter((target) => !target.ok)) {
    console.log(
      `[LINK FAIL] ${failure.target} -> ${failure.error || `HTTP ${failure.status}`} (from ${failure.sources.join(", ")})`
    )
  }
  if (options.jsonOut) {
    const { writeFileSync } = await import("node:fs")
    writeFileSync(path.resolve(options.jsonOut), JSON.stringify(result, null, 2))
    console.log(`JSON: ${path.resolve(options.jsonOut)}`)
  }
  if (result.summary.failed > 0 || result.summary.sourceFailures > 0) {
    process.exitCode = 1
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main().catch((error) => {
    console.error(`Internal-link checker error: ${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  })
}
