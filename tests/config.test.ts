import type { PageData } from 'vitepress'
import { describe, expect, it } from 'vitest'

import siteConfig from '../docs/.vitepress/config'

const transformPageData = (
  siteConfig as { transformPageData?: (pageData: PageData) => unknown }
).transformPageData

if (!transformPageData) throw new Error('VitePress transformPageData is not configured')

describe('snippet page metadata', () => {
  it('uses the last Git commit time as the automatic update timestamp', async () => {
    const pageData = {
      filePath: 'docs/snippets/git/git-reset-last-commit.md',
      relativePath: 'snippets/git/git-reset-last-commit.md',
      title: 'Удалить последний коммит',
      description: 'Удаление последнего коммита.',
      headers: [],
      frontmatter: { created: '2026-08-23T16:40:01+03:00', updated: '2026-08-23' },
      lastUpdated: Date.parse('2026-08-25T17:09:56+03:00'),
    } as PageData

    await transformPageData(pageData)

    expect(pageData.frontmatter).toMatchObject({
      aside: false,
      updated: '2026-08-25T17:09:56.000+03:00',
    })
    expect(pageData.lastUpdated).toBeUndefined()
  })

  it('uses the creation time before a new snippet has Git history', async () => {
    const pageData = {
      filePath: 'docs/en/snippets/typescript/array-chunks.md',
      relativePath: 'en/snippets/typescript/array-chunks.md',
      title: 'Split an array into chunks',
      description: 'Split an array into fixed-size chunks.',
      headers: [],
      frontmatter: { created: '2026-08-25T09:40:42+03:00' },
    } as PageData

    await transformPageData(pageData)

    expect(pageData.frontmatter.updated).toBe('2026-08-25T09:40:42+03:00')
  })

  it('leaves regular documentation metadata unchanged', async () => {
    const pageData = {
      filePath: 'docs/contributing.md',
      relativePath: 'contributing.md',
      title: 'Как добавить кодобайт',
      description: 'Git/CLI-процесс добавления кодобайтов.',
      headers: [],
      frontmatter: {},
      lastUpdated: Date.parse('2026-08-25T17:09:56+03:00'),
    } as PageData

    await transformPageData(pageData)

    expect(pageData.frontmatter).toEqual({})
    expect(pageData.lastUpdated).toBe(Date.parse('2026-08-25T17:09:56+03:00'))
  })
})
