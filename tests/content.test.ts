import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  createSnippetFile,
  listSnippetFiles,
  normalizeTag,
  removeSnippetFile,
  validateSnippetFiles,
} from '../scripts/content'

let projectRoot: string

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'codebites-content-'))
})

afterEach(async () => {
  await rm(projectRoot, { force: true, recursive: true })
})

async function writeSnippet(
  relativeFile: string,
  frontmatter: string,
  body = '# Example\n\n```js\nconst value = true\n```\n',
): Promise<void> {
  const file = join(projectRoot, relativeFile)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `---\n${frontmatter}---\n\n${body}`, 'utf8')
}

const validFrontmatter = [
  'title: "Уникальные значения"',
  'description: "Удаление повторов из массива"',
  'slug: "unique-values"',
  'locale: "ru"',
  'language: "javascript"',
  'tags:',
  '  - "javascript"',
  '  - "arrays"',
  'created: "2026-08-20T14:35:12+03:00"',
  'updated: "2026-08-20"',
  '',
].join('\n')

describe('content validation', () => {
  it('accepts a snippet with multiple tags and Unicode metadata', async () => {
    await writeSnippet('docs/snippets/javascript/unique-values.md', validFrontmatter)

    await expect(validateSnippetFiles(projectRoot)).resolves.toEqual([])
  })

  it('preserves valid semantic metadata', async () => {
    const semanticFrontmatter = validFrontmatter.replace(
      'updated: "2026-08-20"',
      [
        'risk: "destructive"',
        'requirements:',
        '  - "sudo"',
        '  - "linux"',
        'updated: "2026-08-20"',
      ].join('\n'),
    )
    await writeSnippet('docs/snippets/javascript/unique-values.md', semanticFrontmatter)

    const documents = await listSnippetFiles(projectRoot)

    expect(documents[0]?.frontmatter).toMatchObject({
      risk: 'destructive',
      requirements: ['sudo', 'linux'],
    })
  })

  it('rejects an unknown risk level', async () => {
    const invalidFrontmatter = validFrontmatter.replace(
      'updated: "2026-08-20"',
      'risk: "critical"\nupdated: "2026-08-20"',
    )
    await writeSnippet('docs/snippets/javascript/unique-values.md', invalidFrontmatter)

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('risk'))).toBe(true)
  })

  it('rejects duplicate requirements', async () => {
    const invalidFrontmatter = validFrontmatter.replace(
      'updated: "2026-08-20"',
      [
        'requirements:',
        '  - "sudo"',
        '  - "sudo"',
        'updated: "2026-08-20"',
      ].join('\n'),
    )
    await writeSnippet('docs/snippets/javascript/unique-values.md', invalidFrontmatter)

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('requirements must be unique'))).toBe(true)
  })

  it('reports malformed frontmatter fields', async () => {
    await writeSnippet(
      'docs/snippets/javascript/unique-values.md',
      validFrontmatter.replace('  - "arrays"\n', '  - "Arrays and things"\n'),
    )

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('tags')
  })

  it('rejects frontmatter without a creation timestamp', async () => {
    await writeSnippet(
      'docs/snippets/javascript/unique-values.md',
      validFrontmatter.replace('created: "2026-08-20T14:35:12+03:00"\n', ''),
    )

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('created'))).toBe(true)
  })

  it('rejects a date-only creation value', async () => {
    await writeSnippet(
      'docs/snippets/javascript/unique-values.md',
      validFrontmatter.replace('2026-08-20T14:35:12+03:00', '2026-08-20'),
    )

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('created'))).toBe(true)
  })

  it('reports duplicate locale and slug pairs', async () => {
    await writeSnippet('docs/snippets/javascript/unique-values.md', validFrontmatter)
    await writeSnippet('docs/snippets/typescript/unique-values.md', validFrontmatter)

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('Duplicate ru/unique-values'))).toBe(true)
  })

  it('reports a language that does not match its directory', async () => {
    await writeSnippet('docs/snippets/typescript/unique-values.md', validFrontmatter)

    const issues = await validateSnippetFiles(projectRoot)

    expect(issues.some((issue) => issue.message.includes('directory "typescript"'))).toBe(true)
  })
})

describe('content authoring', () => {
  it('normalizes tags for CLI input', () => {
    expect(normalizeTag('  Data Structures  ')).toBe('data-structures')
  })

  it('creates a localized Markdown snippet', async () => {
    const file = await createSnippetFile(projectRoot, {
      slug: 'array-chunks',
      locale: 'en',
      title: 'Split an array into chunks',
      description: 'Split an array into equally sized chunks.',
      language: 'typescript',
      tags: ['TypeScript', 'Data Structures'],
      code: 'export const chunks = []',
      codeLanguage: 'ts',
      updated: '2026-08-20',
    })

    expect(file).toBe(join(projectRoot, 'docs/en/snippets/typescript/array-chunks.md'))
    await expect(readFile(file, 'utf8')).resolves.toContain(
      'tags:\n  - "typescript"\n  - "data-structures"',
    )
  })

  it('writes an automatic creation timestamp', async () => {
    const file = await createSnippetFile(projectRoot, {
      slug: 'automatic-created-time',
      locale: 'en',
      title: 'Automatic creation time',
      description: 'Records when a snippet is created.',
      language: 'typescript',
      tags: ['typescript'],
      code: 'const created = true',
      updated: '2026-08-25',
    })

    const content = await readFile(file, 'utf8')
    const created = content.match(/^created: "([^"]+)"$/m)?.[1]

    expect(created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/)
    expect(Number.isNaN(Date.parse(created ?? ''))).toBe(false)
  })

  it('preserves a supplied creation timestamp', async () => {
    const file = await createSnippetFile(projectRoot, {
      slug: 'supplied-created-time',
      locale: 'en',
      title: 'Supplied creation time',
      description: 'Keeps an explicitly supplied creation time.',
      language: 'typescript',
      tags: ['typescript'],
      code: 'const created = true',
      created: '2026-08-25T09:40:42+03:00',
      updated: '2026-08-25',
    })

    const content = await readFile(file, 'utf8')

    expect(content).toContain('created: "2026-08-25T09:40:42+03:00"')
  })

  it('serializes supplied semantic metadata', async () => {
    const file = await createSnippetFile(projectRoot, {
      slug: 'dangerous-command',
      locale: 'en',
      title: 'Dangerous command',
      description: 'A command that needs extra care.',
      language: 'shell',
      tags: ['shell', 'maintenance'],
      code: 'sudo dangerous-command',
      codeLanguage: 'bash',
      risk: 'destructive',
      requirements: ['sudo', 'linux'],
      updated: '2026-08-20',
    })

    const content = await readFile(file, 'utf8')

    expect(content).toContain(
      'risk: "destructive"\nrequirements:\n  - "sudo"\n  - "linux"',
    )
  })

  it('refuses to overwrite an existing snippet', async () => {
    const input = {
      slug: 'array-chunks',
      locale: 'en' as const,
      title: 'Split an array into chunks',
      description: 'Split an array into equally sized chunks.',
      language: 'typescript',
      tags: ['typescript'],
      code: 'export const chunks = []',
      updated: '2026-08-20',
    }
    await createSnippetFile(projectRoot, input)

    await expect(createSnippetFile(projectRoot, input)).rejects.toThrow('already exists')
  })

  it('uses a longer Markdown fence when code contains backticks', async () => {
    const file = await createSnippetFile(projectRoot, {
      slug: 'markdown-fence',
      locale: 'en',
      title: 'Markdown fence',
      description: 'Keep nested code fences intact.',
      language: 'markdown',
      tags: ['markdown'],
      code: '```js\nconst nested = true\n```',
      updated: '2026-08-20',
    })

    const content = await readFile(file, 'utf8')
    expect(content).toContain('````markdown\n```js\nconst nested = true\n```\n````')
  })

  it('removes only the requested locale and slug', async () => {
    await createSnippetFile(projectRoot, {
      slug: 'array-chunks',
      locale: 'ru',
      title: 'Разбить массив',
      description: 'Разделение массива на части.',
      language: 'javascript',
      tags: ['javascript', 'arrays'],
      code: 'const chunks = []',
      updated: '2026-08-20',
    })
    await createSnippetFile(projectRoot, {
      slug: 'array-chunks',
      locale: 'en',
      title: 'Split an array',
      description: 'Split an array into chunks.',
      language: 'javascript',
      tags: ['javascript', 'arrays'],
      code: 'const chunks = []',
      updated: '2026-08-20',
    })

    await removeSnippetFile(projectRoot, 'ru', 'array-chunks')

    const documents = await listSnippetFiles(projectRoot)
    expect(documents.map((document) => document.frontmatter.locale)).toEqual(['en'])
  })
})

describe('published destructive snippet guidance', () => {
  const gitResetSnippet = join(
    process.cwd(),
    'docs',
    'snippets',
    'git',
    'git-reset-last-commit.md',
  )

  it('places the destructive warning before the command', async () => {
    const source = await readFile(gitResetSnippet, 'utf8')
    const dangerIndex = source.indexOf('::: danger')
    const commandIndex = source.indexOf('```bash')

    expect(dangerIndex).toBeGreaterThan(-1)
    expect(commandIndex).toBeGreaterThan(dangerIndex)
  })

  it('requires leaked secrets to be revoked or rotated immediately', async () => {
    const source = await readFile(gitResetSnippet, 'utf8')

    expect(source).toContain('немедленно отозвать или заменить')
  })
})
