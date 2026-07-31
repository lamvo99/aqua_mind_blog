import { type SchemaTypeDefinition } from 'sanity'
import author from './author'
import category from './category'
import post from './post'
import species from './species'
import plant from './plant'
import coral from './coral'
import equipment from './equipment'
import problem from './problem'
import tool from './tool'
import inspiration from './inspiration'
import collection from './collection'

export const schemaTypes: SchemaTypeDefinition[] = [
  author,
  category,
  post,
  species,
  plant,
  coral,
  equipment,
  problem,
  tool,
  inspiration,
  collection,
]
