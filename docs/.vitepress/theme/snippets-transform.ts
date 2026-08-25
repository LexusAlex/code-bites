import type { ContentData } from 'vitepress'

import {
  getContentTags,
  type SnippetLocale,
  type SnippetRequirement,
  type SnippetRisk,
  type SnippetSummary,
} from './catalog'

function firstCodeBlock(source: string): { code: string; language: string } {
  const match = source.match(/^(`{3,})([^\r\n`]*)\r?\n([\s\S]*?)\r?\n\1\s*$/m)

  return {
    code: match?.[3]?.trimEnd() ?? '',
    language: match?.[2]?.trim() ?? '',
  }
}

function firstHighlightedCode(html: string): string {
  const match = html.match(
    /<pre\b(?=[^>]*\bclass="[^"]*\bshiki\b)[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/,
  )

  return match?.[1] ?? ''
}

function dateValue(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return typeof value === 'string' ? value : undefined
}

function dateTimeValue(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString()
  return typeof value === 'string' ? value : undefined
}

export function transformSnippetPages(
  pages: ContentData[],
  locale: SnippetLocale,
): SnippetSummary[] {
  return pages
    .map((page) => {
      const codeBlock = firstCodeBlock(page.src ?? '')
      const frontmatter = page.frontmatter
      const language = String(frontmatter.language)
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : []
      const risk = ['caution', 'destructive'].includes(String(frontmatter.risk))
        ? (String(frontmatter.risk) as SnippetRisk)
        : undefined
      const requirements = Array.isArray(frontmatter.requirements)
        ? frontmatter.requirements
            .map(String)
            .filter((item): item is SnippetRequirement => item === 'sudo' || item === 'linux')
        : []

      return {
        slug: String(frontmatter.slug),
        locale: String(frontmatter.locale) as SnippetLocale,
        title: String(frontmatter.title),
        description: String(frontmatter.description),
        language,
        tags: getContentTags(tags, language),
        url: page.url,
        code: codeBlock.code,
        codeLanguage: codeBlock.language || language,
        highlightedCode: firstHighlightedCode(page.html ?? ''),
        risk,
        requirements,
        created: dateTimeValue(frontmatter.created),
        updated: dateValue(frontmatter.updated),
      }
    })
    .filter((snippet) => snippet.locale === locale)
    .sort((left, right) => left.title.localeCompare(right.title))
}
