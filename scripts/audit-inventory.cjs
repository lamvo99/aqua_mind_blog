const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

async function fetchAll(type) {
  let all = []
  let lastId = null
  while (true) {
    const q = lastId
      ? `*[_type == "${type}" && !(_id in path("drafts.**")) && _id > "${lastId}"] | order(_id asc) [0...500] {_id, name, slug, ...}`
      : `*[_type == "${type}" && !(_id in path("drafts.**"))] | order(_id asc) [0...500] {_id, name, slug, ...}`
    const batch = await client.fetch(q)
    if (!batch.length) break
    all = all.concat(batch)
    lastId = batch[batch.length - 1]._id
    if (batch.length < 500) break
  }
  return all
}

function fieldDist(items, field) {
  const dist = {}
  for (const item of items) {
    let val = item[field]
    if (Array.isArray(val)) val = val.length > 0 ? JSON.stringify(val) : null
    if (val === undefined || val === null) val = '__NULL__'
    if (typeof val === 'object') val = JSON.stringify(val)
    dist[val] = (dist[val] || 0) + 1
  }
  return dist
}

async function main() {
  const types = ['species', 'plant', 'coral', 'equipment', 'invertebrate', 'problem', 'inspiration']
  const report = {}

  for (const type of types) {
    console.log(`Fetching ${type}...`)
    const items = await fetchAll(type)
    console.log(`  Got ${items.length} items`)

    // Collect all field names
    const fields = new Set()
    for (const item of items) {
      for (const key of Object.keys(item)) {
        if (!key.startsWith('_')) fields.add(key)
      }
    }

    const distributions = {}
    for (const f of fields) {
      distributions[f] = fieldDist(items, f)
    }

    // Duplicate candidates by name
    const names = items.map(i => i.name).filter(Boolean).sort()
    const dupes = []
    for (let i = 0; i < names.length - 1; i++) {
      if (names[i].toLowerCase() === names[i+1]?.toLowerCase()) {
        dupes.push(names[i])
      }
    }

    report[type] = {
      count: items.length,
      fields: [...fields],
      distributions,
      duplicateCandidates: dupes,
      sample: items[0] || null,
    }
  }

  fs.writeFileSync('scripts/audit-inventory.json', JSON.stringify(report, null, 2))
  console.log('\nDone. Report saved to scripts/audit-inventory.json')

  // Print summary
  console.log('\n=== INVENTORY SUMMARY ===')
  let total = 0
  for (const type of types) {
    const count = report[type].count
    total += count
    console.log(`${type}: ${count}`)
  }
  console.log(`TOTAL: ${total}`)
}

main().catch(e => { console.error(e); process.exit(1) })
