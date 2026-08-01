import fs from 'fs'
import path from 'path'

const retry = {
  'setting-up-a-40cm-aquarium-for-beginners-step-by-step': {
    file: 'File:Akuarium Jawa Timur Park 1 - Tanaman Aquascape 1.jpg',
    filename: 'post-40cm-setup-aquascape.jpg',
  },
  'how-to-change-aquarium-water-without-stressing-fish': {
    file: 'File:Red Freshwater Snail in Fish Tank.jpg',
    filename: 'post-water-change-snail.jpg',
  },
  'aquarium-fish-food-types-and-how-to-use-them': {
    file: 'File:Aquarium - dried food2.jpg',
    filename: 'post-fish-food-dried.jpg',
  },
  'how-often-should-you-change-aquarium-water': {
    file: 'File:Goldfish in Fish Tank.jpg',
    filename: 'post-water-change-frequency-goldfish.jpg',
  },
  'budgeting-for-your-first-aquarium-how-much-is-enough': {
    file: 'File:Aquarium store, Novosibirsk 1.jpg',
    filename: 'post-budget-aquarium-store.jpg',
  },
}

const outDir = path.resolve('tmp/images')

for (const [slug, p] of Object.entries(retry)) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.file)}?width=1600`
  let success = false
  for (let attempt = 1; attempt <= 5 && !success; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 10000) throw new Error(`too small (${buf.length} bytes)`)
      fs.writeFileSync(path.join(outDir, p.filename), buf)
      console.log(`OK ${slug} (${buf.length} bytes)`)
      success = true
    } catch (e) {
      console.log(`retry ${slug} attempt ${attempt}: ${e.message}`)
      await new Promise((r) => setTimeout(r, 20000 * attempt))
    }
  }
  if (!success) console.log(`FAIL ${slug} after retries`)
  await new Promise((r) => setTimeout(r, 10000))
}
