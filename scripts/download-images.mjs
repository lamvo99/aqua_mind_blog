import fs from 'fs'
import path from 'path'

const picks = {
  'your-first-30-days-with-an-aquarium-a-beginner-s-journal': {
    file: 'File:Freshwater aquarium & Fish.jpg',
    filename: 'post-30-days-journal.jpg',
    alt: 'A freshwater aquarium with fish',
    license: 'CC BY-SA 4.0', artist: 'Ranjith-chemmad',
  },
  'the-easiest-aquarium-fish-for-beginners': {
    file: 'File:Guppy CS pair 20130113.jpg',
    filename: 'post-easiest-fish-guppy.jpg',
    alt: 'Pair of guppies, one of the easiest fish for beginners',
    license: 'CC BY-SA 3.0', artist: 'Emilio17',
  },
  'the-nitrogen-cycle-the-foundation-of-every-aquarium': {
    file: 'File:Aquarium Sponge Filter foam 1.jpg',
    filename: 'post-nitrogen-cycle-sponge-filter.jpg',
    alt: 'Sponge filter foam, home of nitrifying bacteria',
    license: 'CC BY-SA 4.0', artist: 'Ofkun',
  },
  'setting-up-a-40cm-aquarium-for-beginners-step-by-step': {
    file: 'File:Akuarium Jawa Timur Park 1 - Tanaman Aquascape 1.jpg',
    filename: 'post-40cm-setup-aquascape.jpg',
    alt: 'A planted aquascape aquarium setup',
    license: 'CC BY 4.0', artist: 'Indonesiagood',
  },
  'the-nitrogen-cycle-explained-simply': {
    file: 'File:A freshwater aquarium containing plants and small fish.jpg',
    filename: 'post-nitrogen-cycle-simply.jpg',
    alt: 'A freshwater aquarium containing plants and small fish',
    license: 'CC0', artist: 'Netha Hussain',
  },
  'how-to-change-aquarium-water-without-stressing-fish': {
    file: 'File:Red Freshwater Snail in Fish Tank.jpg',
    filename: 'post-water-change-snail.jpg',
    alt: 'A fish tank with a red freshwater snail',
    license: 'CC BY 3.0', artist: 'Kong of Lasers',
  },
  'different-types-of-aquarium-filters-pros-and-cons': {
    file: 'File:Aquarium - external filter.jpg',
    filename: 'post-filters-external-filter.jpg',
    alt: 'An external canister filter for an aquarium',
    license: 'CC BY-SA 3.0', artist: 'Wikimedia Commons',
  },
  'aquarium-fish-food-types-and-how-to-use-them': {
    file: 'File:Aquarium - dried food2.jpg',
    filename: 'post-fish-food-dried.jpg',
    alt: 'Dried fish food for aquarium fish',
    license: 'CC BY-SA 3.0', artist: 'Pinpin',
  },
  '20-30l-nano-aquarium-the-perfect-choice-for-beginners': {
    file: 'File:Nano-Aquarium mit Boraras brigittae.JPG',
    filename: 'post-nano-aquarium.jpg',
    alt: 'A small nano aquarium with Boraras brigittae',
    license: 'CC BY-SA 3.0', artist: 'VivienneHarper',
  },
  'how-often-should-you-change-aquarium-water': {
    file: 'File:Goldfish in Fish Tank.jpg',
    filename: 'post-water-change-frequency-goldfish.jpg',
    alt: 'Goldfish swimming in a fish tank',
    license: 'CC BY-SA 4.0', artist: 'Kong of Lasers',
  },
  'budgeting-for-your-first-aquarium-how-much-is-enough': {
    file: 'File:Aquarium store, Novosibirsk 1.jpg',
    filename: 'post-budget-aquarium-store.jpg',
    alt: 'An aquarium store with many fish tanks',
    license: 'CC BY-SA 4.0', artist: 'К.Артём.1',
  },
}

const outDir = path.resolve('tmp/images')
fs.mkdirSync(outDir, { recursive: true })

let ok = 0
for (const [slug, p] of Object.entries(picks)) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.file)}?width=1600`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 10000) throw new Error(`too small (${buf.length} bytes)`)
    fs.writeFileSync(path.join(outDir, p.filename), buf)
    console.log(`OK ${slug} (${buf.length} bytes)`)
    ok++
  } catch (e) {
    console.log(`FAIL ${slug}: ${e.message}`)
  }
  await new Promise((r) => setTimeout(r, 2000))
}
console.log(`\nDownloaded ${ok}/${Object.keys(picks).length}`)
