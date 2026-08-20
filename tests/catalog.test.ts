import { describe, expect, it } from 'vitest'

import {
  collectTags,
  createSnippetSearchIndex,
  filterSnippets,
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
  it('returns localized tag counts in deterministic order', () => {
    expect(collectTags(snippets, 'ru')).toEqual([
      { name: 'arrays', count: 2 },
      { name: 'javascript', count: 2 },
      { name: 'collections', count: 1 },
      { name: 'functions', count: 1 },
      { name: 'performance', count: 1 },
      { name: 'typescript', count: 1 },
    ])
  })
})
