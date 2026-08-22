import MiniSearch from 'minisearch'

export type SnippetLocale = 'ru' | 'en'

export interface SnippetSummary {
  slug: string
  locale: SnippetLocale
  title: string
  description: string
  language: string
  tags: string[]
  url: string
  code: string
  codeLanguage: string
  updated?: string
}

export interface CatalogFilters {
  locale: SnippetLocale
  query?: string
  language?: string
  tags?: string[]
}

export interface TagCount {
  name: string
  count: number
}

export type SnippetSearchIndex = MiniSearch<SnippetSummary>

export type SortMode = 'new' | 'alpha'

export function formatDate(iso: string, locale: SnippetLocale): string {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso

  const monthNames =
    locale === 'ru'
      ? ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return locale === 'ru'
    ? `${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`
    : `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

export function sortSnippets(snippets: SnippetSummary[], mode: SortMode): SnippetSummary[] {
  return [...snippets].sort((left, right) => {
    if (mode === 'alpha') return left.title.localeCompare(right.title, 'en')

    if (left.updated === right.updated) return left.title.localeCompare(right.title, 'en')
    if (!left.updated) return 1
    if (!right.updated) return -1
    return right.updated.localeCompare(left.updated)
  })
}

export function findMatchTerms(
  query: string,
  index: SnippetSearchIndex,
): Map<string, string[]> {
  const trimmed = query.trim()
  if (!trimmed) return new Map()

  const terms = new Map<string, string[]>()
  for (const result of index.search(trimmed)) {
    const url = String(result.id)
    const match = result.terms.filter(Boolean)
    if (!match.length) continue
    terms.set(url, [...(terms.get(url) ?? []), ...match])
  }
  return terms
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function createSnippetSearchIndex(snippets: SnippetSummary[]): SnippetSearchIndex {
  const index = new MiniSearch<SnippetSummary>({
    idField: 'url',
    fields: ['title', 'description', 'language', 'tags', 'code'],
    extractField(document, fieldName) {
      if (fieldName === 'tags') return document.tags.join(' ')

      const value = document[fieldName as keyof SnippetSummary]
      return typeof value === 'string' ? value : ''
    },
    searchOptions: {
      boost: { title: 5, description: 3, tags: 3, language: 2, code: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  index.addAll(snippets)
  return index
}

export function filterSnippets(
  snippets: SnippetSummary[],
  filters: CatalogFilters,
  index?: SnippetSearchIndex,
): SnippetSummary[] {
  const query = filters.query?.trim() ?? ''
  const language = normalize(filters.language ?? '')
  const tags = (filters.tags ?? []).map(normalize).filter(Boolean)
  const matchingUrls = query
    ? new Set(
        (index ?? createSnippetSearchIndex(snippets))
          .search(query)
          .map((result) => String(result.id)),
      )
    : undefined

  return snippets.filter((snippet) => {
    if (snippet.locale !== filters.locale) return false
    if (language && normalize(snippet.language) !== language) return false
    if (matchingUrls && !matchingUrls.has(snippet.url)) return false

    const snippetTags = new Set(snippet.tags.map(normalize))
    return tags.every((tag) => snippetTags.has(tag))
  })
}

export function collectTags(snippets: SnippetSummary[], locale: SnippetLocale): TagCount[] {
  const counts = new Map<string, number>()

  for (const snippet of snippets) {
    if (snippet.locale !== locale) continue

    for (const tag of new Set(snippet.tags.map(normalize).filter(Boolean))) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'en'))
}
