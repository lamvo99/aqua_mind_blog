#!/usr/bin/env node
/**
 * Opt-in production SEO smoke test.
 *
 * Usage:
 *   npm run seo:smoke
 *   node scripts/seo/production-smoke.mjs --json-out seo-smoke.json
 *
 * This is intentionally network-dependent and is not part of the fast test
 * suite. It checks the live sitemap, representative canonical/robots metadata,
 * the approved redirects, true 404 behavior, and a bounded sample of
 * first-party internal links.
 */

import { createRequire } from "node:module"
import { writeFileSync } from "node:fs"
import path from "node:path"
import { runLinkCheck, fetchWithRetry } from "./check-internal-links.mjs"

const require = createRequire(import.meta.url)
const nextConfig = require("../../next.config.js")

const SITE = process.env.SEO_CANONICAL_ORIGIN || "https://www.aquamind.life"
const BASE = process.env.SEO_BASE_URL || SITE

function parseArgs(argv) {
  const options = { base: BASE, jsonOut: "", skipLinks: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = () => {
      index += 1
      return argv[index]
    }
    if (arg === "--base") options.base = next()
    else if (arg === "--json-out") options.jsonOut = next()
    else if (arg === "--skip-links") options.skipLinks = true
  }
  return options
}

function textOf(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function titleOf(html) {
  return textOf(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "")
}

function canonicalOf(html) {
  return textOf(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || "")
}

function canonicalCount(html) {
  return [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)].length
}

function robotsOf(html) {
  return textOf(html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || "")
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => textOf(match[1]))
}

function isNoindex(html) {
  return /noindex/i.test(robotsOf(html))
}

function normalizeForCompare(url) {
  const parsed = new URL(url)
  parsed.hash = ""
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "")
  return parsed.toString()
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const failures = []
  const checks = []
  const record = (name, ok, detail) => {
    checks.push({ name, ok, detail: detail || "" })
    if (!ok) failures.push({ name, detail: detail || "" })
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail || ""}`}`)
  }

  const base = options.base.replace(/\/+$/, "")
  const sitemapUrl = `${base}/sitemap.xml`
  const sitemapResponse = await fetchWithRetry(sitemapUrl, { timeoutMs: 30000, retries: 2 })
  record("sitemap HTTP 200", sitemapResponse.status === 200 && !sitemapResponse.error, sitemapResponse.error || `HTTP ${sitemapResponse.status}`)
  const contentType = sitemapResponse.headers?.get("content-type") || ""
  record("sitemap is XML", /xml/i.test(contentType), contentType || "missing content-type")

  const locs = sitemapLocs(sitemapResponse.body)
  const paths = locs.map((loc) => {
    try {
      return new URL(loc).pathname
    } catch {
      return ""
    }
  })
  record("sitemap is non-empty", locs.length > 0, `observed ${locs.length} URLs`)
  record("sitemap has no duplicate URLs", new Set(locs).size === locs.length, `${locs.length - new Set(locs).size} duplicates`)
  const invalidUrls = locs.filter((loc) => {
    try {
      const url = new URL(loc)
      return url.origin !== SITE || url.protocol !== "https:" || url.search || url.hash
    } catch {
      return true
    }
  })
  record("sitemap URLs are absolute https on the canonical host", invalidUrls.length === 0, invalidUrls.slice(0, 5).join(", "))

  const configuredRedirects = await nextConfig.redirects()
  const redirectSources = new Set(configuredRedirects.map((item) => item.source))
  const redirectSourcesInSitemap = [...redirectSources].filter((source) => paths.includes(source))
  record("sitemap excludes configured redirect sources", redirectSourcesInSitemap.length === 0, redirectSourcesInSitemap.join(", "))

  const knownNoindex = ["/search", "/studio"]
  const noindexInSitemap = knownNoindex.filter((pathname) => paths.includes(pathname))
  record("sitemap excludes known noindex routes", noindexInSitemap.length === 0, noindexInSitemap.join(", "))

  const requiredPaths = [
    "/tools/reef-dosing",
    "/equipment/aquarium-soil-substrate",
    "/invertebrates/neocaridina-davidi",
  ]
  for (const required of requiredPaths) {
    record(`sitemap contains ${required}`, paths.includes(required), `observed ${locs.length} URLs`)
  }

  const findSitemapUrl = (predicate) => locs.find((loc) => {
    try {
      return predicate(new URL(loc))
    } catch {
      return false
    }
  })

  const representative = [
    { name: "homepage", url: locs.find((loc) => loc === SITE) || `${SITE}/` },
    { name: "post", url: findSitemapUrl((url) => url.pathname.startsWith("/posts/")) || `${SITE}/posts` },
    { name: "species", url: findSitemapUrl((url) => url.pathname.startsWith("/species/")) || `${SITE}/species` },
    { name: "equipment", url: findSitemapUrl((url) => url.pathname.startsWith("/equipment/")) || `${SITE}/equipment` },
    { name: "category/listing", url: findSitemapUrl((url) => url.pathname.startsWith("/category/")) || `${SITE}/posts` },
    { name: "tool", url: `${SITE}/tools/reef-dosing` },
  ]

  for (const route of representative) {
    const response = await fetchWithRetry(route.url, { timeoutMs: 30000, retries: 2 })
    const expectedCanonical = route.url === SITE || route.url === `${SITE}/` ? SITE : normalizeForCompare(route.url)
    const canonical = canonicalOf(response.body)
    record(`${route.name} 200`, response.status === 200 && !response.error, response.error || `HTTP ${response.status}`)
    record(`${route.name} self-canonical`, canonical === expectedCanonical, `got "${canonical}" expected "${expectedCanonical}"`)
    record(`${route.name} has exactly one canonical`, canonicalCount(response.body) === 1, `${canonicalCount(response.body)} canonical tags`)
    record(`${route.name} indexable`, !isNoindex(response.body), robotsOf(response.body) || "no robots meta")
    record(`${route.name} has title`, titleOf(response.body).length > 0, "empty title")
  }

  const searchPage = await fetchWithRetry(`${SITE}/search?q=seo-regression`, { timeoutMs: 30000, retries: 2 })
  record("search page 200", searchPage.status === 200 && !searchPage.error, searchPage.error || `HTTP ${searchPage.status}`)
  record("search page noindex", isNoindex(searchPage.body), robotsOf(searchPage.body) || "no robots meta")
  record("search page canonical", canonicalOf(searchPage.body) === `${SITE}/search`, `got "${canonicalOf(searchPage.body)}"`)

  const filteredListing = await fetchWithRetry(`${SITE}/species?difficulty=Beginner`, { timeoutMs: 30000, retries: 2 })
  record(
    "filtered listing 200",
    filteredListing.status === 200 && !filteredListing.error,
    filteredListing.error || `HTTP ${filteredListing.status}`
  )
  record("filtered listing noindex", isNoindex(filteredListing.body), robotsOf(filteredListing.body) || "no robots meta")
  record(
    "filtered listing canonical",
    canonicalOf(filteredListing.body) === `${SITE}/species`,
    `got "${canonicalOf(filteredListing.body)}"`
  )

  const redirectCases = [
    { source: "/equipment/aquasoil-substrate", status: 301, destination: "/equipment/aquarium-soil-substrate" },
    { source: "/invertebrates/neocaridina-davidi-cherry", status: 301, destination: "/invertebrates/neocaridina-davidi" },
    { source: "/tools/setup-planner", status: 308, destination: "/setup-planner" },
    { source: "/plants/java-moss", status: 308, destination: "/plants/taxiphyllum-barbieri" },
    { source: "/corals/acan-lords", status: 308, destination: "/corals/acan-lord" },
  ]

  for (const redirect of redirectCases) {
    const sourceUrl = `${SITE}${redirect.source}`
    const response = await fetchWithRetry(sourceUrl, { timeoutMs: 30000, retries: 2, redirect: "manual" })
    const location = response.headers?.get("location") || ""
    const resolved = location ? new URL(location, SITE).toString() : ""
    const expectedDestination = `${SITE}${redirect.destination}`
    record(
      `redirect ${redirect.source} status ${redirect.status}`,
      response.status === redirect.status,
      `got ${response.status}`
    )
    record(
      `redirect ${redirect.source} destination`,
      resolved === expectedDestination,
      `got "${resolved}" expected "${expectedDestination}"`
    )
    record(
      `redirect ${redirect.source} has no chain`,
      !redirectSources.has(redirect.destination),
      `${redirect.destination} is also a redirect source`
    )

    const destinationResponse = await fetchWithRetry(expectedDestination, { timeoutMs: 30000, retries: 2 })
    record(
      `redirect ${redirect.source} destination 200`,
      destinationResponse.status === 200 && !destinationResponse.error,
      destinationResponse.error || `HTTP ${destinationResponse.status}`
    )
    record(
      `redirect ${redirect.source} destination self-canonical`,
      canonicalOf(destinationResponse.body) === normalizeForCompare(expectedDestination),
      `got "${canonicalOf(destinationResponse.body)}"`
    )
    record(
      `redirect ${redirect.source} destination has exactly one canonical`,
      canonicalCount(destinationResponse.body) === 1,
      `${canonicalCount(destinationResponse.body)} canonical tags`
    )
    record(
      `redirect ${redirect.source} destination indexable`,
      !isNoindex(destinationResponse.body),
      robotsOf(destinationResponse.body) || "no robots meta"
    )
  }

  const missingUrl = `${SITE}/tools/__seo-regression-missing__`
  const missing = await fetchWithRetry(missingUrl, { timeoutMs: 30000, retries: 2, redirect: "manual" })
  record("unknown URL returns 404", missing.status === 404, `got ${missing.status}`)
  record("404 response is noindex", isNoindex(missing.body), robotsOf(missing.body) || "no robots meta")

  let linkResult = null
  if (!options.skipLinks) {
    linkResult = await runLinkCheck({
      base,
      mode: "smoke",
      maxTargets: 150,
      concurrency: 4,
      timeoutMs: 20000,
      retries: 2,
    })
    record(
      "internal-link smoke has no broken links",
      linkResult.summary.failed === 0 && linkResult.summary.sourceFailures === 0,
      `sources ${linkResult.summary.sourceFailures} failed; targets ${linkResult.summary.failed} failed`
    )
  }

  const report = {
    checkedAt: new Date().toISOString(),
    base,
    canonicalOrigin: SITE,
    sitemap: {
      status: sitemapResponse.status,
      observedCount: locs.length,
      requiredPaths,
    },
    checks,
    linkCheck: linkResult
      ? {
          summary: linkResult.summary,
          failures: linkResult.targets.filter((target) => !target.ok),
        }
      : null,
    failures,
  }

  if (options.jsonOut) {
    const output = path.resolve(options.jsonOut)
    writeFileSync(output, JSON.stringify(report, null, 2))
    console.log(`JSON: ${output}`)
  }

  console.log(`\nSitemap observed: ${locs.length} URLs`)
  console.log(`${failures.length === 0 ? "ALL PRODUCTION SMOKE CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`}`)
  if (failures.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(`Production SEO smoke error: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
