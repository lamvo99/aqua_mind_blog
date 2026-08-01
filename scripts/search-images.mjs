import fs from 'fs'

const searches = {
  'journal-30-days': ['planted aquarium freshwater', 'community aquarium fish'],
  'easiest-fish': ['guppy aquarium', 'platy fish', 'goldfish aquarium'],
  'nitrogen-cycle': ['aquarium water quality test kit', 'ammonia test aquarium', 'aquarium nitrifying bacteria filter'],
  '40cm-setup': ['aquascape aquarium', 'planted aquarium small tank', 'aquarium gravel substrate'],
  'cycle-simply': ['tropical aquarium fish tank', 'aquarium community tank'],
  'water-change': ['aquarium siphon gravel cleaner', 'aquarium maintenance', 'fish tank cleaning'],
  'filters': ['sponge filter aquarium', 'aquarium filter media', 'hang on back filter'],
  'fish-food': ['tropical fish flakes food', 'feeding aquarium fish', 'betta fish food'],
  'nano': ['nano aquarium shrimp tank', 'desktop aquarium', 'small planted aquarium'],
  'water-change-frequency': ['aquarium water change bucket', 'aquarium gravel vacuum'],
  'budget': ['aquarium fish store', 'pet store fish aquarium', 'aquarium fish market'],
}

const API = 'https://commons.wikimedia.org/w/api.php'
const GOOD_LICENSES = ['public domain', 'cc0', 'cc by', 'cc by-sa']

async function searchImages(term) {
  const url = `${API}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(term + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1200`
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
        thumb: ii.thumburl,
        orig: ii.url,
        width: ii.width || 0,
        height: ii.height || 0,
        desc: ii.descriptionurl,
      }
    })
    .filter((i) => i.width >= 700)
}

for (const [key, terms] of Object.entries(searches)) {
  console.log(`\n########## ${key} ##########`)
  for (const term of terms) {
    try {
      const results = await searchImages(term)
      if (!results.length) { console.log(`  (no results: ${term})`); continue }
      const good = results.filter((r) => GOOD_LICENSES.some((l) => r.license.includes(l)))
      const picks = (good.length ? good : results).slice(0, 4)
      console.log(`\n  term: ${term} (${results.length} found, ${good.length} good-license)`)
      for (const r of picks) {
        const landscape = r.width > r.height ? 'landscape' : 'portrait'
        console.log(`  [${r.license || '?'}] ${r.width}x${r.height} ${landscape} | ${r.title} | ${r.artist}`)
      }
      break
    } catch (e) {
      console.log(`  FAIL ${term}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  await new Promise((r) => setTimeout(r, 1500))
}
