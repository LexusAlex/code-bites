import { describe, expect, it } from 'vitest'
import type { ContentData } from 'vitepress'

import {
  buildCodeLines,
  collectTags,
  compactHighlightedCode,
  createSearchScores,
  createSnippetSearchIndex,
  filterSnippets,
  findMatchTerms,
  formatDate,
  formatDateTime,
  formatPluralCount,
  formatSnippetMetric,
  formatTechnologyName,
  getContentTags,
  getPreviewTags,
  getSnippetBadges,
  getVisibleSnippets,
  isCommandLineSnippet,
  isLongCodePreview,
  sortSnippets,
  type SnippetSummary,
} from '../docs/.vitepress/theme/catalog'
import { transformSnippetPages } from '../docs/.vitepress/theme/snippets-transform'

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
    created: '2026-08-20T15:00:00+03:00',
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
    created: '2026-08-20T13:00:00+03:00',
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
    created: '2026-08-20T14:00:00+03:00',
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
    created: '2026-08-20T15:00:00+03:00',
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

  it('preserves highlighted line boundaries for command previews', () => {
    const pages = [
      {
        frontmatter: {
          slug: 'two-lines',
          locale: 'ru',
          title: 'Две строки',
          description: 'Две строки без пустого интервала.',
          language: 'sql',
          tags: ['sql'],
          created: '2026-08-25T16:43:43+03:00',
        },
        url: '/snippets/sql/two-lines',
        src: '```sql\nSELECT 1;\nSELECT 2;\n```',
        html: '<pre class="shiki"><code><span class="line">SELECT 1;</span>\n<span class="line">SELECT 2;</span></code></pre>',
      },
    ] as unknown as ContentData[]

    const result = transformSnippetPages(pages, 'ru')

    expect(result[0]?.highlightedCode).toBe(
      '<span class="line">SELECT 1;</span>\n<span class="line">SELECT 2;</span>',
    )
  })

  it('removes whitespace only from directly rendered highlighted lines', () => {
    const highlightedCode =
      '<span class="line">SELECT 1;</span>\n<span class="line">SELECT 2;</span>'

    expect(compactHighlightedCode(highlightedCode)).toBe(
      '<span class="line">SELECT 1;</span><span class="line">SELECT 2;</span>',
    )
  })
})

describe('snippet badges', () => {
  it('orders risk before execution requirements', () => {
    expect(
      getSnippetBadges({ risk: 'destructive', requirements: ['sudo', 'linux'] }),
    ).toEqual(['destructive', 'sudo', 'linux'])
  })

  it('returns no badges without semantic metadata', () => {
    expect(getSnippetBadges({})).toEqual([])
  })
})

describe('snippet metrics', () => {
  it('formats one shell command in Russian', () => {
    expect(formatSnippetMetric('sudo apt update', 'bash', 'linux', 'ru')).toBe('1 команда')
  })

  it('uses the Russian few plural for two shell commands', () => {
    expect(formatSnippetMetric('sudo apt update\nsudo apt upgrade', 'bash', 'linux', 'ru')).toBe(
      '2 команды',
    )
  })

  it('uses the Russian many plural for five shell commands', () => {
    expect(
      formatSnippetMetric(
        ['echo 1', 'echo 2', 'echo 3', 'echo 4', 'echo 5'].join('\n'),
        'bash',
        'linux',
        'ru',
      ),
    ).toBe('5 команд')
  })

  it('counts a continued shell command once', () => {
    expect(formatSnippetMetric('docker run \\\n  --rm \\\n  alpine', 'bash', 'linux', 'en')).toBe(
      '1 command',
    )
  })

  it('formats source lines for non-shell snippets', () => {
    expect(formatSnippetMetric('const one = 1\nconst two = 2', 'ts', 'typescript', 'en')).toBe(
      '2 lines',
    )
  })

  it('returns no metric for empty code', () => {
    expect(formatSnippetMetric('   ', 'ts', 'typescript', 'en')).toBe('')
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

describe('formatDateTime', () => {
  it('formats a creation timestamp in Russian', () => {
    expect(formatDateTime('2026-08-25T16:43:43+03:00', 'ru')).toBe('25 авг 2026, 16:43')
  })

  it('formats a creation timestamp in English', () => {
    expect(formatDateTime('2026-08-25T16:43:43+03:00', 'en')).toBe('Aug 25, 2026, 16:43')
  })

  it('returns the input when the creation timestamp is invalid', () => {
    expect(formatDateTime('not-a-date', 'ru')).toBe('not-a-date')
  })
})

describe('sortSnippets', () => {
  it('sorts by creation time in the new mode', () => {
    const result = sortSnippets(
      snippets.filter((s) => s.locale === 'ru'),
      'new',
    )

    expect(result.map((snippet) => snippet.slug)).toEqual([
      'unique-array-values',
      'array-chunks',
      'debounce-function',
    ])
  })

  it('sorts alphabetically by title in the alpha mode', () => {
    const result = sortSnippets(snippets.filter((s) => s.locale === 'ru'), 'alpha')

    const titles = result.map((snippet) => snippet.title)
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right, 'en')))
  })

  it('keeps snippets without a creation timestamp at the end in the new mode', () => {
    const withoutCreated = { ...snippets[0]!, slug: 'without-created', created: undefined }

    const result = sortSnippets([withoutCreated, snippets[1]!], 'new')

    expect(result.map((snippet) => snippet.slug)).toEqual([
      'debounce-function',
      'without-created',
    ])
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

describe('createSearchScores', () => {
  it('returns an empty map for a blank query', () => {
    const index = createSnippetSearchIndex(snippets)

    expect(createSearchScores('   ', index).size).toBe(0)
  })

  it('maps matched URLs to positive scores', () => {
    const index = createSnippetSearchIndex(snippets)

    const scores = createSearchScores('debounce', index)

    expect(scores.get('/snippets/typescript/debounce-function')).toBeGreaterThan(0)
    expect(scores.has('/snippets/javascript/array-chunks')).toBe(false)
  })
})

describe('search relevance', () => {
  const titleMatch: SnippetSummary = {
    ...snippets[0]!,
    slug: 'title-match',
    title: 'Debounce для функции',
    description: 'Старый, но точно по теме',
    code: 'const a = 1',
    url: '/snippets/javascript/title-match',
    created: '2026-08-01T10:00:00+03:00',
  }
  const codeMatch: SnippetSummary = {
    ...snippets[0]!,
    slug: 'code-match',
    title: 'Совсем другое название',
    description: 'Совсем другое описание',
    code: 'export function debounce() {}',
    url: '/snippets/javascript/code-match',
    created: '2026-08-22T10:00:00+03:00',
  }

  it('ranks search results by relevance before creation time', () => {
    const ranked = [codeMatch, titleMatch]
    const index = createSnippetSearchIndex(ranked)
    const scores = createSearchScores('debounce', index)

    const result = sortSnippets(
      filterSnippets(ranked, { locale: 'ru', query: 'debounce' }, index, scores),
      'new',
      scores,
    )

    expect(result.map((snippet) => snippet.slug)).toEqual(['title-match', 'code-match'])
  })

  it('keeps the chosen sort mode when search is empty', () => {
    const result = sortSnippets([codeMatch, titleMatch], 'new')

    expect(result.map((snippet) => snippet.slug)).toEqual(['code-match', 'title-match'])
  })

  it('falls back to the sort mode comparator for equal relevance', () => {
    const sameA: SnippetSummary = { ...titleMatch, url: '/snippets/javascript/same-a', created: '2026-08-01T10:00:00+03:00' }
    const sameB: SnippetSummary = { ...titleMatch, url: '/snippets/javascript/same-b', created: '2026-08-22T10:00:00+03:00' }
    const index = createSnippetSearchIndex([sameA, sameB])
    const scores = createSearchScores('debounce', index)

    expect(sortSnippets([sameA, sameB], 'new', scores).map((s) => s.url)).toEqual([
      '/snippets/javascript/same-b',
      '/snippets/javascript/same-a',
    ])
  })

  it('keeps snippets missing from the relevance map at the end', () => {
    const index = createSnippetSearchIndex([titleMatch])
    const scores = createSearchScores('debounce', index)

    const result = sortSnippets([codeMatch, titleMatch], 'new', scores)

    expect(result.map((snippet) => snippet.slug)).toEqual(['title-match', 'code-match'])
  })
})

describe('formatPluralCount', () => {
  it('uses Russian plural forms', () => {
    expect(formatPluralCount(1, 'байткод', 'байткода', 'байткодов')).toBe('1 байткод')
    expect(formatPluralCount(3, 'байткод', 'байткода', 'байткодов')).toBe('3 байткода')
    expect(formatPluralCount(12, 'байткод', 'байткода', 'байткодов')).toBe('12 байткодов')
  })
})
