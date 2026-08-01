const searches = {
  'nitrogen-cycle': ['aquarium water test kit', 'ammonia test aquarium'],
  'water-change': ['aquarium water change', 'gravel siphon aquarium'],
  'water-change-frequency': ['aquarium water', 'fish tank maintenance'],
}

async function searchOpenverse(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=8`
  const res = await fetch(url, { headers: { 'User-Agent': 'aquamind-content/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((r) => ({
    title: r.title,
    license: r.license,
    provider: r.provider,
    width: r.width,
    height: r.height,
    url: r.url,
    thumb: r.thumbnail,
    source: r.source,
  }))
}

for (const [key, terms] of Object.entries(searches)) {
  console.log(`\n########## ${key} ##########`)
  for (const term of terms) {
    try {
      const results = await searchOpenverse(term)
      console.log(`\n  term: ${term} (${results.length})`)
      for (const r of results) {
        const landscape = r.width > r.height ? 'landscape' : 'portrait'
        console.log(`  [${r.license}/${r.provider}] ${r.width}x${r.height} ${landscape} | ${(r.title || '').slice(0, 70)} | ${r.url}`)
      }
      break
    } catch (e) {
      console.log(`  FAIL ${term}: ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
}
