import { describe, expect, it } from 'vitest'

import {
  buildCodeLines,
  collectTags,
  createSnippetSearchIndex,
  filterSnippets,
  findMatchTerms,
  formatDate,
  formatTechnologyName,
  getContentTags,
  getPreviewTags,
  getVisibleSnippets,
  isCommandLineSnippet,
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

describe('catalog pagination', () => {
  const manySnippets = Array.from({ length: 13 }, (_, index): SnippetSummary => ({
    ...snippets[0]!,
    slug: `snippet-${index + 1}`,
    title: index === 12 ? 'Скрытая иголка' : `Сниппет ${index + 1}`,
    url: `/snippets/javascript/snippet-${index + 1}`,
  }))

  it('shows no more than twelve snippets in the first batch', () => {
    const result = getVisibleSnippets(manySnippets, 1)

    expect(result).toHaveLength(12)
    expect(result.map((snippet) => snippet.slug)).toEqual(
      Array.from({ length: 12 }, (_, index) => `snippet-${index + 1}`),
    )
  })

  it('shows the remaining snippets after requesting another batch', () => {
    const result = getVisibleSnippets(manySnippets, 2)

    expect(result).toHaveLength(13)
    expect(result.at(-1)?.slug).toBe('snippet-13')
  })

  it('searches the complete catalog before limiting visible results', () => {
    const index = createSnippetSearchIndex(manySnippets)
    const matches = filterSnippets(manySnippets, { locale: 'ru', query: 'иголка' }, index)

    expect(getVisibleSnippets(matches, 1).map((snippet) => snippet.slug)).toEqual(['snippet-13'])
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

describe('command-line snippets', () => {
  it('detects shell code fences and languages', () => {
    expect(isCommandLineSnippet('bash', 'linux')).toBe(true)
    expect(isCommandLineSnippet('', 'linux')).toBe(true)
    expect(isCommandLineSnippet('Sh', '')).toBe(true)
    expect(isCommandLineSnippet('zsh', 'shell')).toBe(true)
    expect(isCommandLineSnippet('js', 'javascript')).toBe(false)
    expect(isCommandLineSnippet('', '')).toBe(false)
  })

  it('marks commands as copyable and skips comments and blank lines', () => {
    const lines = buildCodeLines(
      ['# создать пользователя', 'sudo useradd crm8', '', 'sudo passwd crm8'].join('\n'),
    )

    expect(lines).toEqual([
      { text: '# создать пользователя', copyText: '', copyable: false },
      { text: 'sudo useradd crm8', copyText: 'sudo useradd crm8', copyable: true },
      { text: '', copyText: '', copyable: false },
      { text: 'sudo passwd crm8', copyText: 'sudo passwd crm8', copyable: true },
    ])
  })

  it('joins backslash continuations into a single copyable command', () => {
    const lines = buildCodeLines(
      ['sudo useradd \\', '  --create-home \\', '  --shell /bin/bash crm8', 'sudo passwd crm8'].join(
        '\n',
      ),
    )

    expect(lines).toEqual([
      {
        text: 'sudo useradd \\',
        copyText: 'sudo useradd \\\n  --create-home \\\n  --shell /bin/bash crm8',
        copyable: true,
      },
      { text: '  --create-home \\', copyText: '', copyable: false },
      { text: '  --shell /bin/bash crm8', copyText: '', copyable: false },
      { text: 'sudo passwd crm8', copyText: 'sudo passwd crm8', copyable: true },
    ])
  })

  it('normalizes Windows line endings', () => {
    const lines = buildCodeLines('sudo apt update\r\nsudo apt upgrade\r\n')

    expect(lines).toEqual([
      { text: 'sudo apt update', copyText: 'sudo apt update', copyable: true },
      { text: 'sudo apt upgrade', copyText: 'sudo apt upgrade', copyable: true },
    ])
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
