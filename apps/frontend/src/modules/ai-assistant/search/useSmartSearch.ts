import Fuse from 'fuse.js'

import {
  searchableData,
} from '../mock-data/search.data'

const fuse = new Fuse(searchableData, {
  keys: [
    'title',
    'description',
    'type',
  ],

  threshold: 0.4,
})

export function useSmartSearch(
  keyword: string
) {
  if (!keyword) return []

  return fuse.search(keyword)
}
