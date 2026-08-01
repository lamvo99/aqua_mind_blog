import { createClient } from '@sanity/client'

// Server-only Sanity client. Never import this module from client components —
// SANITY_API_TOKEN must stay out of the client bundle.
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || '',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})
