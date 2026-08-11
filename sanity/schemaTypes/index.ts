import { type SchemaTypeDefinition } from 'sanity'
import author from './author'
import category from './category'
import comment from './comment'
import post from './post'
import species from './species'
import invertebrate from './invertebrate'
import plant from './plant'
import coral from './coral'
import equipment from './equipment'
import problem from './problem'
import tool from './tool'
import inspiration from './inspiration'
import collection from './collection'
import subscriber from './subscriber'

export const schemaTypes: SchemaTypeDefinition[] = [
  author,
  category,
  comment,
  post,
  species,
  invertebrate,
  plant,
  coral,
  equipment,
  problem,
  tool,
  inspiration,
  collection,
  subscriber,
]
