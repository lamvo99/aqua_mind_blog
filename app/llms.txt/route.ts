import { getAllPosts } from '@/lib/posts'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aquamind.life'

export const revalidate = 3600

function esc(text: string): string {
  return text.replace(/</g, '\\<').replace(/\n/g, ' ').trim()
}

export async function GET() {
  const posts = await getAllPosts()

  const postLines = posts
    .filter((p: any) => p.slug?.current)
    .map((p: any) => `[Article] ${esc(p.title)}: ${siteUrl}/posts/${p.slug.current} — ${esc(p.excerpt || '')}`)
    .join('\n')

  const body = `# AquaMind

Free aquarium & aquascaping guides, interactive tools and a verified database of fish, plants, corals and equipment. Everything here is free.

## Tools
- Compatibility Checker: ${siteUrl}/tools/compatibility-checker
- Fish Stocking Calculator: ${siteUrl}/tools/stocking
- Aquarium Volume Calculator: ${siteUrl}/tools/aquarium-volume
- Water Change Calculator: ${siteUrl}/tools/water-change
- CO2 Estimator: ${siteUrl}/tools/co2
- Dosing Calculator: ${siteUrl}/tools/dosing
- Pump & Filter Flow Calculator: ${siteUrl}/tools/pump-flow
- Salt Mixing Calculator: ${siteUrl}/tools/salt-mixing
- Lighting Calculator: ${siteUrl}/tools/lighting
- Setup Planner: ${siteUrl}/setup-planner

## Learning paths
- ${siteUrl}/learn — step-by-step learning paths
- ${siteUrl}/start-here — beginner's journey

## Finder
- ${siteUrl}/finder — find fish, plants and corals matched to your tank

## Style guides
- Iwagumi: ${siteUrl}/styles/iwagumi
- Dutch: ${siteUrl}/styles/dutch
- Nature Aquarium: ${siteUrl}/styles/nature-aquarium
- Jungle: ${siteUrl}/styles/jungle
- Biotope: ${siteUrl}/styles/biotope
- Walstad: ${siteUrl}/styles/walstad
- Reef: ${siteUrl}/styles/reef
- Paludarium: ${siteUrl}/styles/paludarium

## Databases
- Fish species: ${siteUrl}/species
- Plants: ${siteUrl}/plants
- Corals: ${siteUrl}/corals
- Equipment: ${siteUrl}/equipment
- Problems & solutions: ${siteUrl}/problems
- Inspiration gallery: ${siteUrl}/inspiration

## Articles
${postLines}

## Other
- About: ${siteUrl}/about
- Search: ${siteUrl}/search?q=neon tetra
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
