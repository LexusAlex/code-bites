import { createContentLoader } from 'vitepress'

import type { SnippetLocale, SnippetSummary } from './catalog'

declare const data: SnippetSummary[]
export { data }

function firstCodeBlock(source: string): { code: string; language: string } {
  const match = source.match(/^(`{3,})([^\r\n`]*)\r?\n([\s\S]*?)\r?\n\1\s*$/m)

  return {
    code: match?.[3]?.trimEnd() ?? '',
    language: match?.[2]?.trim() ?? '',
  }
}

function dateValue(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return typeof value === 'string' ? value : undefined
}

export default createContentLoader('**/snippets/**/*.md', {
  includeSrc: true,
  transform(pages): SnippetSummary[] {
    return pages
      .map((page) => {
        const codeBlock = firstCodeBlock(page.src ?? '')
        const frontmatter = page.frontmatter

        return {
          slug: String(frontmatter.slug),
          locale: String(frontmatter.locale) as SnippetLocale,
          title: String(frontmatter.title),
          description: String(frontmatter.description),
          language: String(frontmatter.language),
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
          url: page.url,
          code: codeBlock.code,
          codeLanguage: codeBlock.language || String(frontmatter.language),
          updated: dateValue(frontmatter.updated),
        }
      })
      .sort((left, right) =>
        left.locale.localeCompare(right.locale) || left.title.localeCompare(right.title),
      )
  },
})
