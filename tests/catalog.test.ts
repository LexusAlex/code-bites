import { describe, expect, it } from 'vitest'

import {
  collectTags,
  createSnippetSearchIndex,
  filterSnippets,
  findMatchTerms,
  formatDate,
  formatTechnologyName,
  getContentTags,
  getPreviewTags,
  isLongCodePreview,
  sortSnippets,
  type SnippetSummary,
} from '../docs/.vitepress/theme/catalog'

const snippets: SnippetSummary[] = [
  {
    slug: 'unique-array-values',
    locale: 'ru',
    title: 'Уникальные значения массива',
    description: 'Удаление повторяющихся элементов через Set',
    language: 'javascript',
    tags: ['javascript', 'arrays', 'collections'],
    url: '/snippets/javascript/unique-array-values',
    code: 'const unique = [...new Set(values)]',
    codeLanguage: 'js',
    highlightedCode: '',
  },
  {
    slug: 'debounce-function',
    locale: 'ru',
    title: 'Debounce для функции',
    description: 'Откладывает выполнение до окончания серии вызовов',
    language: 'typescript',
    tags: ['typescript', 'functions', 'performance'],
    url: '/snippets/typescript/debounce-function',
    code: 'export function debounce() {}',
    codeLanguage: 'ts',
    highlightedCode: '',
    updated: '2026-08-20',
  },
  {
    slug: 'array-chunks',
    locale: 'ru',
    title: 'Разбить массив на части',
    description: 'Разделяет массив на блоки одинакового размера',
    language: 'javascript',
    tags: ['javascript', 'arrays'],
    url: '/snippets/javascript/array-chunks',
    code: 'const chunks = []',
    codeLanguage: 'js',
    highlightedCode: '',
    updated: '2026-01-15',
  },
  {
    slug: 'unique-array-values',
    locale: 'en',
    title: 'Unique array values',
    description: 'Remove duplicate items with Set',
    language: 'javascript',
    tags: ['javascript', 'arrays', 'collections'],
    url: '/en/snippets/javascript/unique-array-values',
    code: 'const unique = [...new Set(values)]',
    codeLanguage: 'js',
    highlightedCode: '',
  },
]

describe('catalog filtering', () => {
  it('finds a snippet with a fuzzy text query', () => {
    const index = createSnippetSearchIndex(snippets)

    const result = filterSnippets(snippets, { locale: 'ru', query: 'debouce' }, index)

    expect(result.map((snippet) => snippet.slug)).toEqual(['debounce-function'])
  })

  it('finds Cyrillic title prefixes', () => {
    const index = createSnippetSearchIndex(snippets)

    const result = filterSnippets(snippets, { locale: 'ru', query: 'уникальн' }, index)

    expect(result.map((snippet) => snippet.slug)).toEqual(['unique-array-values'])
  })

  it('keeps results inside the selected locale', () => {
    const result = filterSnippets(snippets, { locale: 'en' })

    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Unique array values')
  })

  it('filters by programming language', () => {
    const result = filterSnippets(snippets, { locale: 'ru', language: 'typescript' })

    expect(result.map((snippet) => snippet.slug)).toEqual(['debounce-function'])
  })

  it('requires every selected tag', () => {
    const result = filterSnippets(snippets, {
      locale: 'ru',
      tags: ['arrays', 'collections'],
    })

    expect(result.map((snippet) => snippet.slug)).toEqual(['unique-array-values'])
  })

  it('returns an empty list when filters do not match', () => {
    const result = filterSnippets(snippets, {
      locale: 'ru',
      language: 'sql',
      tags: ['arrays'],
    })

    expect(result).toEqual([])
  })
})

describe('catalog tags', () => {
  it('keeps categories out of content tags', () => {
    expect(getContentTags([' Linux ', 'filesystem', 'CLI', 'cli'], 'linux')).toEqual([
      'filesystem',
      'cli',
    ])
  })

  it('returns localized tag counts in deterministic order', () => {
    expect(collectTags(snippets, 'ru')).toEqual([
      { name: 'arrays', count: 2 },
      { name: 'collections', count: 1 },
      { name: 'functions', count: 1 },
      { name: 'performance', count: 1 },
    ])
  })

  it('limits card previews to three content tags', () => {
    expect(
      getPreviewTags(
        ['typescript', 'functions', 'performance', 'timers', 'frontend'],
        'typescript',
      ),
    ).toEqual(['functions', 'performance', 'timers'])
  })

  it('keeps the complete content tag list available outside card previews', () => {
    expect(
      getContentTags(
        ['typescript', 'functions', 'performance', 'timers', 'frontend'],
        'typescript',
      ),
    ).toEqual(['functions', 'performance', 'timers', 'frontend'])
  })
})

describe('code previews', () => {
  it('keeps six-line code collapsed without an expansion control', () => {
    expect(isLongCodePreview(['1', '2', '3', '4', '5', '6'].join('\n'))).toBe(false)
  })

  it('marks seven-line code as expandable', () => {
    expect(isLongCodePreview(['1', '2', '3', '4', '5', '6', '7'].join('\n'))).toBe(true)
  })
})

describe('technology labels', () => {
  it('formats known technology names', () => {
    expect(formatTechnologyName('typescript')).toBe('TypeScript')
    expect(formatTechnologyName('javascript')).toBe('JavaScript')
    expect(formatTechnologyName('sql')).toBe('SQL')
  })

  it('capitalizes an unknown technology name without losing the rest', () => {
    expect(formatTechnologyName('elixir')).toBe('Elixir')
  })
})

describe('formatDate', () => {
  it('formats ISO dates for the Russian locale', () => {
    expect(formatDate('2026-08-20', 'ru')).toBe('20 авг 2026')
  })

  it('formats ISO dates for the English locale', () => {
    expect(formatDate('2026-08-20', 'en')).toBe('Aug 20, 2026')
  })

  it('returns the input when the date is invalid', () => {
    expect(formatDate('not-a-date', 'ru')).toBe('not-a-date')
  })
})

describe('sortSnippets', () => {
  it('sorts by freshness first in the new mode', () => {
    const result = sortSnippets(
      snippets.filter((s) => s.locale === 'ru'),
      'new',
    )

    expect(result.map((snippet) => snippet.slug)).toEqual([
      'debounce-function',
      'array-chunks',
      'unique-array-values',
    ])
  })

  it('sorts alphabetically by title in the alpha mode', () => {
    const result = sortSnippets(snippets.filter((s) => s.locale === 'ru'), 'alpha')

    const titles = result.map((snippet) => snippet.title)
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right, 'en')))
  })

  it('keeps snippets without a date at the end in the new mode', () => {
    const noDate = snippets.filter((s) => s.locale === 'ru' && !s.updated)
    const withDate = snippets.filter((s) => s.locale === 'ru' && s.updated)

    const result = sortSnippets(
      snippets.filter((s) => s.locale === 'ru'),
      'new',
    )

    expect(result.slice(0, withDate.length).every((snippet) => snippet.updated)).toBe(true)
    expect(result.slice(-noDate.length).every((snippet) => !snippet.updated)).toBe(true)
  })
})

describe('findMatchTerms', () => {
  it('maps matching URLs to search terms', () => {
    const index = createSnippetSearchIndex(snippets)

    const terms = findMatchTerms('debounce', index)

    expect(terms.get('/snippets/typescript/debounce-function')).toEqual(['debounce'])
    expect(terms.has('/snippets/javascript/array-chunks')).toBe(false)
  })

  it('returns an empty map for a blank query', () => {
    const index = createSnippetSearchIndex(snippets)

    expect(findMatchTerms('   ', index).size).toBe(0)
  })
})
