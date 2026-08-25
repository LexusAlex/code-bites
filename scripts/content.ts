import { constants } from 'node:fs'
import { access, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative, sep } from 'node:path'

import matter from 'gray-matter'
import { z } from 'zod'

export const SNIPPET_LOCALES = ['ru', 'en'] as const
export type SnippetLocale = (typeof SNIPPET_LOCALES)[number]
export const SNIPPET_RISKS = ['caution', 'destructive'] as const
export type SnippetRisk = (typeof SNIPPET_RISKS)[number]
export const SNIPPET_REQUIREMENTS = ['sudo', 'linux'] as const
export type SnippetRequirement = (typeof SNIPPET_REQUIREMENTS)[number]

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must use lowercase kebab-case')

const normalizedTokenSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N}.+#-]*$/u, 'contains unsupported characters')
  .refine((value) => value === normalizeTag(value), 'must be normalized lowercase kebab-case')

const createdTimestampSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
    'must use ISO 8601 date-time with an explicit timezone',
  )
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be a valid date-time')

export const snippetFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  slug: slugSchema,
  locale: z.enum(SNIPPET_LOCALES),
  language: normalizedTokenSchema,
  tags: z
    .array(normalizedTokenSchema)
    .min(1)
    .superRefine((tags, context) => {
      if (new Set(tags).size !== tags.length) {
        context.addIssue({
          code: 'custom',
          message: 'tags must be unique',
        })
      }
    }),
  risk: z.enum(SNIPPET_RISKS).optional(),
  requirements: z
    .array(z.enum(SNIPPET_REQUIREMENTS))
    .default([])
    .superRefine((requirements, context) => {
      if (new Set(requirements).size !== requirements.length) {
        context.addIssue({
          code: 'custom',
          message: 'requirements must be unique',
        })
      }
    }),
  created: createdTimestampSchema,
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must use YYYY-MM-DD').optional(),
})

export type SnippetFrontmatter = z.infer<typeof snippetFrontmatterSchema>

export interface NewSnippetInput {
  slug: string
  locale: SnippetLocale
  title: string
  description: string
  language: string
  tags: string[]
  code: string
  codeLanguage?: string
  risk?: SnippetRisk
  requirements?: SnippetRequirement[]
  created?: string
  updated?: string
}

export interface SnippetDocument {
  file: string
  relativeFile: string
  frontmatter: SnippetFrontmatter
}

export interface ValidationIssue {
  file: string
  message: string
}

interface SnippetRoot {
  locale: SnippetLocale
  directory: string
}

interface LocatedFile extends SnippetRoot {
  file: string
}

export function normalizeTag(tag: string): string {
  return tag.trim().normalize('NFKC').toLocaleLowerCase().replace(/[\s_]+/g, '-')
}

function snippetRoots(projectRoot: string): SnippetRoot[] {
  return [
    { locale: 'ru', directory: join(projectRoot, 'docs', 'snippets') },
    { locale: 'en', directory: join(projectRoot, 'docs', 'en', 'snippets') },
  ]
}

async function markdownFiles(directory: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return markdownFiles(path)
      return entry.isFile() && extname(entry.name) === '.md' ? [path] : []
    }),
  )

  return files.flat().sort()
}

async function locatedSnippetFiles(projectRoot: string): Promise<LocatedFile[]> {
  const groups = await Promise.all(
    snippetRoots(projectRoot).map(async (root) =>
      (await markdownFiles(root.directory)).map((file) => ({ ...root, file })),
    ),
  )

  return groups.flat()
}

function relativePath(projectRoot: string, file: string): string {
  return relative(projectRoot, file).split(sep).join('/')
}

function formatSchemaIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
    .join('; ')
}

function containsCodeBlock(content: string): boolean {
  return /^(`{3,})[^\r\n`]*\r?\n[\s\S]*?\r?\n\1\s*$/m.test(content)
}

function snippetDirectory(projectRoot: string, locale: SnippetLocale): string {
  return locale === 'en'
    ? join(projectRoot, 'docs', 'en', 'snippets')
    : join(projectRoot, 'docs', 'snippets')
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

function codeFence(code: string): string {
  const longestRun = Math.max(0, ...(code.match(/`+/g) ?? []).map((run) => run.length))
  return '`'.repeat(Math.max(3, longestRun + 1))
}

function renderSnippet(frontmatter: SnippetFrontmatter, code: string, codeLanguage: string): string {
  const fence = codeFence(code)
  const tags = frontmatter.tags.map((tag) => `  - ${yamlString(tag)}`).join('\n')
  const requirements = frontmatter.requirements.length
    ? ['requirements:', ...frontmatter.requirements.map((item) => `  - ${yamlString(item)}`)].join(
        '\n',
      )
    : undefined

  return [
    '---',
    `title: ${yamlString(frontmatter.title)}`,
    `description: ${yamlString(frontmatter.description)}`,
    `slug: ${yamlString(frontmatter.slug)}`,
    `locale: ${yamlString(frontmatter.locale)}`,
    `language: ${yamlString(frontmatter.language)}`,
    'tags:',
    tags,
    frontmatter.risk ? `risk: ${yamlString(frontmatter.risk)}` : undefined,
    requirements,
    `created: ${yamlString(frontmatter.created)}`,
    frontmatter.updated ? `updated: ${yamlString(frontmatter.updated)}` : undefined,
    '---',
    '',
    `# ${frontmatter.title}`,
    '',
    frontmatter.description,
    '',
    `${fence}${codeLanguage}`,
    code.trimEnd(),
    fence,
    '',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

export async function createSnippetFile(
  projectRoot: string,
  input: NewSnippetInput,
): Promise<string> {
  const normalizedInput = {
    title: input.title.trim(),
    description: input.description.trim(),
    slug: input.slug.trim(),
    locale: input.locale,
    language: normalizeTag(input.language),
    tags: [...new Set(input.tags.map(normalizeTag).filter(Boolean))],
    risk: input.risk,
    requirements: [...new Set(input.requirements ?? [])],
    created: input.created ?? new Date().toISOString(),
    updated: input.updated ?? new Date().toISOString().slice(0, 10),
  }
  const parsed = snippetFrontmatterSchema.safeParse(normalizedInput)
  if (!parsed.success) {
    throw new Error(`Invalid snippet: ${formatSchemaIssues(parsed.error)}`)
  }
  if (!input.code.trim()) throw new Error('Invalid snippet: code must not be empty')

  const directory = join(snippetDirectory(projectRoot, parsed.data.locale), parsed.data.language)
  const file = join(directory, `${parsed.data.slug}.md`)
  await mkdir(directory, { recursive: true })

  try {
    await access(file, constants.F_OK)
    throw new Error(`Snippet already exists: ${relativePath(projectRoot, file)}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const codeLanguage = normalizeTag(input.codeLanguage ?? parsed.data.language)
  await writeFile(file, renderSnippet(parsed.data, input.code, codeLanguage), {
    encoding: 'utf8',
    flag: 'wx',
  })
  return file
}

export async function listSnippetFiles(projectRoot: string): Promise<SnippetDocument[]> {
  const documents = await Promise.all(
    (await locatedSnippetFiles(projectRoot)).map(async ({ file }) => {
      const source = await readFile(file, 'utf8')
      let parsedMatter
      try {
        parsedMatter = matter(source)
      } catch (error) {
        throw new Error(`${relativePath(projectRoot, file)}: ${(error as Error).message}`)
      }

      const parsed = snippetFrontmatterSchema.safeParse(parsedMatter.data)
      if (!parsed.success) {
        throw new Error(
          `${relativePath(projectRoot, file)}: ${formatSchemaIssues(parsed.error)}`,
        )
      }

      return {
        file,
        relativeFile: relativePath(projectRoot, file),
        frontmatter: parsed.data,
      }
    }),
  )

  return documents.sort(
    (left, right) =>
      left.frontmatter.locale.localeCompare(right.frontmatter.locale) ||
      left.frontmatter.title.localeCompare(right.frontmatter.title),
  )
}

export async function removeSnippetFile(
  projectRoot: string,
  locale: SnippetLocale,
  slug: string,
): Promise<string> {
  const parsedSlug = slugSchema.parse(slug)
  const documents = await listSnippetFiles(projectRoot)
  const matches = documents.filter(
    (document) =>
      document.frontmatter.locale === locale && document.frontmatter.slug === parsedSlug,
  )

  if (matches.length === 0) throw new Error(`Snippet not found: ${locale}/${parsedSlug}`)
  if (matches.length > 1) throw new Error(`Duplicate snippet: ${locale}/${parsedSlug}`)

  const match = matches[0]
  if (!match) throw new Error(`Snippet not found: ${locale}/${parsedSlug}`)
  await unlink(match.file)
  return match.file
}

export async function validateSnippetFiles(projectRoot: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const seen = new Map<string, string>()

  for (const located of await locatedSnippetFiles(projectRoot)) {
    const relativeFile = relativePath(projectRoot, located.file)
    let parsedMatter

    try {
      parsedMatter = matter(await readFile(located.file, 'utf8'))
    } catch (error) {
      issues.push({ file: relativeFile, message: `YAML: ${(error as Error).message}` })
      continue
    }

    const parsed = snippetFrontmatterSchema.safeParse(parsedMatter.data)
    if (!parsed.success) {
      issues.push({ file: relativeFile, message: formatSchemaIssues(parsed.error) })
      continue
    }

    const frontmatter = parsed.data
    const pathParts = relative(located.directory, located.file).split(sep)
    const directoryLanguage = pathParts[0] ?? ''
    const fileSlug = basename(located.file, '.md')

    if (frontmatter.locale !== located.locale) {
      issues.push({
        file: relativeFile,
        message: `locale "${frontmatter.locale}" does not match directory locale "${located.locale}"`,
      })
    }
    if (frontmatter.language !== directoryLanguage) {
      issues.push({
        file: relativeFile,
        message: `language "${frontmatter.language}" does not match directory "${directoryLanguage}"`,
      })
    }
    if (frontmatter.slug !== fileSlug) {
      issues.push({
        file: relativeFile,
        message: `slug "${frontmatter.slug}" does not match filename "${fileSlug}"`,
      })
    }
    if (!containsCodeBlock(parsedMatter.content)) {
      issues.push({ file: relativeFile, message: 'content must contain a fenced code block' })
    }

    const key = `${frontmatter.locale}/${frontmatter.slug}`
    const existing = seen.get(key)
    if (existing) {
      issues.push({ file: relativeFile, message: `Duplicate ${key}; first seen in ${existing}` })
    } else {
      seen.set(key, relativeFile)
    }
  }

  return issues.sort(
    (left, right) => left.file.localeCompare(right.file) || left.message.localeCompare(right.message),
  )
}
