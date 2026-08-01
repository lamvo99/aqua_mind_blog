const searches = {
  'nitrogen-cycle': ['water test aquarium pH', 'aquarium water quality', 'aquarium fish water filter'],
  'water-change': ['aquarium fish tank tropical', 'freshwater aquarium plants', 'aquarium glass'],
  'water-change-frequency': ['aquarium', 'fish tank', 'guppy tank'],
}

const API = 'https://commons.wikimedia.org/w/api.php'
const GOOD_LICENSES = ['public domain', 'cc0', 'cc by', 'cc by-sa']

async function searchImages(term) {
  const url = `${API}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=${encodeURIComponent(term + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const pages = data.query?.pages ? Object.values(data.query.pages) : []
  return pages
    .filter((p) => p.imageinfo?.[0])
    .map((p) => {
      const ii = p.imageinfo[0]
      const meta = ii.extmetadata || {}
      const license = (meta.LicenseShortName?.value || '').toLowerCase()
      const artist = (meta.Artist?.value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)
      return {
        title: p.title,
        license,
        artist,
        width: ii.width || 0,
        height: ii.height || 0,
        desc: ii.descriptionurl,
      }
    })
    .filter((i) => i.width >= 700)
}

for (const [key, terms] of Object.entries(searches)) {
  console.log(`\n########## ${key} ##########`)
  let done = false
  for (const term of terms) {
    if (done) break
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const results = await searchImages(term)
        if (!results.length) { console.log(`  (no results: ${term})`); break }
        const good = results.filter((r) => GOOD_LICENSES.some((l) => r.license.includes(l)))
        const picks = (good.length ? good : results).slice(0, 6)
        console.log(`\n  term: ${term} (${results.length} found, ${good.length} good)`)
        for (const r of picks) {
          const landscape = r.width > r.height ? 'L' : 'P'
          console.log(`  [${r.license || '?'}] ${r.width}x${r.height} ${landscape} | ${r.title} | ${r.artist}`)
        }
        if (good.length) done = true
        break
      } catch (e) {
        if (attempt === 3) { console.log(`  FAIL ${term}: ${e.message}`); break }
        await new Promise((r) => setTimeout(r, 5000 * attempt))
      }
    }
  }
  await new Promise((r) => setTimeout(r, 4000))
}
