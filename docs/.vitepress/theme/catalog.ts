import MiniSearch from 'minisearch'

export type SnippetLocale = 'ru' | 'en'
export type SnippetRisk = 'caution' | 'destructive'
export type SnippetRequirement = 'sudo' | 'linux'
export type SnippetBadge = SnippetRisk | SnippetRequirement

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
  highlightedCode: string
  risk?: SnippetRisk
  requirements?: SnippetRequirement[]
  created?: string
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

const PREVIEW_TAG_LIMIT = 3
const PREVIEW_CODE_LINE_LIMIT = 6
export const SNIPPET_BATCH_SIZE = 12

const commandLineLanguages = new Set(['bash', 'sh', 'shell', 'zsh', 'console', 'linux'])

const technologyLabels: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  docker: 'Docker',
  html: 'HTML',
  javascript: 'JavaScript',
  js: 'JavaScript',
  linux: 'Linux',
  mariadb: 'MariaDB',
  php: 'PHP',
  postgresql: 'PostgreSQL',
  python: 'Python',
  shell: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  yaml: 'YAML',
  yml: 'YAML',
}

export function formatTechnologyName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const normalized = trimmed.toLocaleLowerCase()
  return technologyLabels[normalized] ?? `${normalized[0]?.toLocaleUpperCase() ?? ''}${normalized.slice(1)}`
}

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

export function formatDateTime(iso: string, locale: SnippetLocale): string {
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  if (!match || Number.isNaN(Date.parse(iso))) return iso

  const [, year = '', month = '', day = '', hours = '', minutes = ''] = match
  const monthIndex = Number(month) - 1
  const monthNames =
    locale === 'ru'
      ? ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthName = monthNames[monthIndex]
  if (!monthName) return iso

  return locale === 'ru'
    ? `${Number(day)} ${monthName} ${year}, ${hours}:${minutes}`
    : `${monthName} ${Number(day)}, ${year}, ${hours}:${minutes}`
}

function creationTime(snippet: SnippetSummary): number | undefined {
  if (!snippet.created) return undefined
  const timestamp = Date.parse(snippet.created)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

export function sortSnippets(
  snippets: SnippetSummary[],
  mode: SortMode,
  relevance?: Map<string, number>,
): SnippetSummary[] {
  const comparator = (left: SnippetSummary, right: SnippetSummary): number => {
    if (mode === 'alpha') return left.title.localeCompare(right.title, 'en')

    const leftCreated = creationTime(left)
    const rightCreated = creationTime(right)
    if (leftCreated === rightCreated) return left.title.localeCompare(right.title, 'en')
    if (leftCreated === undefined) return 1
    if (rightCreated === undefined) return -1
    return rightCreated - leftCreated
  }

  if (!relevance || relevance.size === 0) return [...snippets].sort(comparator)

  return [...snippets].sort((left, right) => {
    const leftScore = relevance.get(left.url)
    const rightScore = relevance.get(right.url)
    if (leftScore === rightScore) return comparator(left, right)
    if (leftScore === undefined) return 1
    if (rightScore === undefined) return -1
    return rightScore - leftScore
  })
}

export function getVisibleSnippets(
  snippets: readonly SnippetSummary[],
  batchCount: number,
): SnippetSummary[] {
  return snippets.slice(0, batchCount * SNIPPET_BATCH_SIZE)
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

export function createSearchScores(
  query: string,
  index: SnippetSearchIndex,
): Map<string, number> {
  const trimmed = query.trim()
  if (!trimmed) return new Map()

  const scores = new Map<string, number>()
  for (const result of index.search(trimmed)) {
    const url = String(result.id)
    const score = result.score
    const best = scores.get(url)
    if (best === undefined || score > best) scores.set(url, score)
  }
  return scores
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function getContentTags(tags: readonly string[], language: string): string[] {
  const category = normalize(language)
  const seen = new Set<string>()

  return tags
    .map(normalize)
    .filter((tag) => {
      if (!tag || tag === category || seen.has(tag)) return false
      seen.add(tag)
      return true
    })
}

export function getPreviewTags(tags: readonly string[], language: string): string[] {
  return getContentTags(tags, language).slice(0, PREVIEW_TAG_LIMIT)
}

export function isLongCodePreview(code: string): boolean {
  const normalized = code.trimEnd()
  if (!normalized) return false

  return normalized.split(/\r?\n/).length > PREVIEW_CODE_LINE_LIMIT
}

export function compactHighlightedCode(highlightedCode: string): string {
  return highlightedCode.replace(
    /<\/span>\r?\n[\t ]*(?=<span class="line">)/g,
    '</span>',
  )
}

export function isCommandLineSnippet(codeLanguage: string, language: string): boolean {
  return [codeLanguage, language].some((value) => {
    const normalized = value.trim().toLocaleLowerCase()
    return normalized.length > 0 && commandLineLanguages.has(normalized)
  })
}

export function getSnippetBadges(
  snippet: Pick<SnippetSummary, 'risk' | 'requirements'>,
): SnippetBadge[] {
  const badges: SnippetBadge[] = []
  if (snippet.risk) badges.push(snippet.risk)

  for (const requirement of ['sudo', 'linux'] as const) {
    if (snippet.requirements?.includes(requirement)) badges.push(requirement)
  }

  return badges
}

export function formatPluralCount(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod100 = count % 100
  const mod10 = count % 10
  const noun =
    mod100 >= 11 && mod100 <= 14
      ? many
      : mod10 === 1
        ? one
        : mod10 >= 2 && mod10 <= 4
          ? few
          : many

  return `${count} ${noun}`
}

export function formatSnippetMetric(
  code: string,
  codeLanguage: string,
  language: string,
  locale: SnippetLocale,
): string {
  const normalized = code.replace(/\r\n?/g, '\n').trimEnd()
  if (!normalized.trim()) return ''

  const lineCount = normalized.split('\n').length
  const commandCount = isCommandLineSnippet(codeLanguage, language)
    ? buildCodeLines(normalized).filter((line) => line.copyable).length
    : 0
  const count = commandCount || lineCount
  const kind = commandCount ? 'command' : 'line'

  if (locale === 'ru') {
    return kind === 'command'
      ? formatPluralCount(count, 'команда', 'команды', 'команд')
      : formatPluralCount(count, 'строка', 'строки', 'строк')
  }

  return `${count} ${kind}${count === 1 ? '' : 's'}`
}

export interface CodeLine {
  text: string
  copyText: string
  copyable: boolean
}

export function buildCodeLines(code: string): CodeLine[] {
  const lines = code
    .replace(/\r\n?/g, '\n')
    .replace(/\n+$/, '')
    .split('\n')
  const result: CodeLine[] = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? ''
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      result.push({ text: line, copyText: '', copyable: false })
      continue
    }

    const parts = [line]
    while (parts[parts.length - 1]?.trimEnd().endsWith('\\') && index + 1 < lines.length) {
      index += 1
      parts.push(lines[index] ?? '')
    }

    const copyText = parts.join('\n')
    result.push({ text: line, copyText, copyable: true })
    for (const part of parts.slice(1)) {
      result.push({ text: part, copyText: '', copyable: false })
    }
  }

  return result
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
  scores?: Map<string, number>,
): SnippetSummary[] {
  const query = filters.query?.trim() ?? ''
  const language = normalize(filters.language ?? '')
  const tags = (filters.tags ?? []).map(normalize).filter(Boolean)
  const matchingUrls = query
    ? scores ??
      new Set(
        (index ?? createSnippetSearchIndex(snippets))
          .search(query)
          .map((result) => String(result.id)),
      )
    : undefined

  return snippets.filter((snippet) => {
    if (snippet.locale !== filters.locale) return false
    if (language && normalize(snippet.language) !== language) return false
    if (matchingUrls && !matchingUrls.has(snippet.url)) return false

    const snippetTags = new Set(getContentTags(snippet.tags, snippet.language))
    return tags.every((tag) => snippetTags.has(tag))
  })
}

export function collectTags(snippets: SnippetSummary[], locale: SnippetLocale): TagCount[] {
  const counts = new Map<string, number>()

  for (const snippet of snippets) {
    if (snippet.locale !== locale) continue

    for (const tag of getContentTags(snippet.tags, snippet.language)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'en'))
}
