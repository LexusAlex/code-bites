import { readFile } from 'node:fs/promises'
import { createInterface, type Interface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import {
  createSnippetFile,
  listSnippetFiles,
  removeSnippetFile,
  SNIPPET_LOCALES,
  type NewSnippetInput,
  type SnippetLocale,
  validateSnippetFiles,
} from './content'

type Options = Record<string, string | boolean>

function parseArguments(args: string[]): { command: string; options: Options } {
  const [command = 'help', ...rest] = args
  const options: Options = {}

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (!argument?.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`)

    const key = argument.slice(2)
    const next = rest[index + 1]
    if (!next || next.startsWith('--')) {
      options[key] = true
    } else {
      options[key] = next
      index += 1
    }
  }

  return { command, options }
}

function stringOption(options: Options, name: string): string | undefined {
  const value = options[name]
  return typeof value === 'string' ? value : undefined
}

async function requiredValue(
  readline: Interface,
  options: Options,
  name: string,
  prompt: string,
): Promise<string> {
  const supplied = stringOption(options, name)?.trim()
  if (supplied) return supplied

  const answer = (await readline.question(prompt)).trim()
  if (!answer) throw new Error(`${name} is required`)
  return answer
}

async function localeValue(readline: Interface, options: Options): Promise<SnippetLocale> {
  const locale = await requiredValue(readline, options, 'locale', 'Locale / Локаль (ru|en): ')
  if (!SNIPPET_LOCALES.includes(locale as SnippetLocale)) {
    throw new Error('locale must be ru or en')
  }
  return locale as SnippetLocale
}

async function readMultilineCode(readline: Interface, locale: SnippetLocale): Promise<string> {
  output.write(
    locale === 'ru'
      ? 'Введите код. Завершите отдельной строкой ::end\n'
      : 'Enter code. Finish with ::end on its own line.\n',
  )
  const lines: string[] = []

  while (true) {
    const line = await readline.question('')
    if (line === '::end') break
    lines.push(line)
  }

  return lines.join('\n')
}

async function codeValue(
  readline: Interface,
  options: Options,
  locale: SnippetLocale,
): Promise<string> {
  const inlineCode = stringOption(options, 'code')
  if (inlineCode) return inlineCode

  const codeFile = stringOption(options, 'code-file')
  if (codeFile) return readFile(codeFile, 'utf8')

  return readMultilineCode(readline, locale)
}

async function createCommand(readline: Interface, options: Options): Promise<void> {
  const locale = await localeValue(readline, options)
  const localized =
    locale === 'ru'
      ? {
          slug: 'Slug (kebab-case): ',
          title: 'Название: ',
          description: 'Краткое описание: ',
          language: 'Язык или технология: ',
          tags: 'Теги через запятую: ',
          created: 'Создан',
        }
      : {
          slug: 'Slug (kebab-case): ',
          title: 'Title: ',
          description: 'Short description: ',
          language: 'Language or technology: ',
          tags: 'Comma-separated tags: ',
          created: 'Created',
        }

  const language = await requiredValue(readline, options, 'language', localized.language)
  const tags = (await requiredValue(readline, options, 'tags', localized.tags))
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const snippet: NewSnippetInput = {
    locale,
    slug: await requiredValue(readline, options, 'slug', localized.slug),
    title: await requiredValue(readline, options, 'title', localized.title),
    description: await requiredValue(readline, options, 'description', localized.description),
    language,
    tags,
    code: await codeValue(readline, options, locale),
    codeLanguage: stringOption(options, 'code-language') ?? language,
    updated: stringOption(options, 'updated'),
  }

  const file = await createSnippetFile(process.cwd(), snippet)
  output.write(`${localized.created}: ${file}\n`)
}

async function removeCommand(readline: Interface, options: Options): Promise<void> {
  const locale = await localeValue(readline, options)
  const slug = await requiredValue(readline, options, 'slug', 'Slug: ')

  if (options.yes !== true) {
    const answer = (await readline.question(`Remove ${locale}/${slug}? [y/N]: `)).trim().toLowerCase()
    if (answer !== 'y' && answer !== 'yes') {
      output.write('Cancelled.\n')
      return
    }
  }

  const file = await removeSnippetFile(process.cwd(), locale, slug)
  output.write(`Removed: ${file}\n`)
}

async function listCommand(options: Options): Promise<void> {
  const locale = stringOption(options, 'locale')
  if (locale && !SNIPPET_LOCALES.includes(locale as SnippetLocale)) {
    throw new Error('locale must be ru or en')
  }

  const documents = (await listSnippetFiles(process.cwd())).filter(
    (document) => !locale || document.frontmatter.locale === locale,
  )

  if (documents.length === 0) {
    output.write('No snippets found.\n')
    return
  }

  for (const document of documents) {
    const metadata = document.frontmatter
    output.write(
      `${metadata.locale.padEnd(2)}  ${metadata.language.padEnd(12)}  ${metadata.slug.padEnd(28)}  ${metadata.title}\n`,
    )
  }
}

async function validateCommand(): Promise<void> {
  const issues = await validateSnippetFiles(process.cwd())
  if (issues.length === 0) {
    output.write('All snippets are valid.\n')
    return
  }

  for (const issue of issues) output.write(`- ${issue.file}: ${issue.message}\n`)
  throw new Error(`${issues.length} validation issue(s) found`)
}

function printHelp(): void {
  output.write(`ByteCode snippet CLI

Commands:
  npm run snippet:new -- [--locale ru|en] [--slug value] [--code-file path]
  npm run snippet:remove -- [--locale ru|en] [--slug value] [--yes]
  npm run snippets:list -- [--locale ru|en]
  npm run snippets:validate

The new command prompts for every omitted value. Inline code can be passed with
--code; for multiline code, prefer --code-file or finish interactive input with
::end on its own line.
`)
}

async function main(): Promise<void> {
  const { command, options } = parseArguments(process.argv.slice(2))
  const readline = createInterface({ input, output })

  try {
    if (command === 'new') await createCommand(readline, options)
    else if (command === 'remove') await removeCommand(readline, options)
    else if (command === 'list') await listCommand(options)
    else if (command === 'validate') await validateCommand()
    else if (command === 'help' || command === '--help' || command === '-h') printHelp()
    else throw new Error(`Unknown command: ${command}`)
  } finally {
    readline.close()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Error: ${message}\n`)
  process.exitCode = 1
})
