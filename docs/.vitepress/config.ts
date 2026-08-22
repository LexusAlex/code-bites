import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import matter from 'gray-matter'
import { defineConfig } from 'vitepress'

interface SnippetMenuItem {
  title: string
  link: string
}

interface SnippetMenuGroup {
  language: string
  items: SnippetMenuItem[]
}

function listMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return listMarkdownFiles(path)
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
  })
}

function buildSnippetMenu(locale: 'ru' | 'en'): SnippetMenuGroup[] {
  const docsDir = fileURLToPath(new URL('../', import.meta.url))
  const snippetsDir = join(docsDir, locale === 'en' ? 'en/snippets' : 'snippets')
  if (!statSync(snippetsDir, { throwIfNoEntry: false })) {
    console.warn(`[config] snippets directory not found: ${snippetsDir}`)
    return []
  }

  const groups = new Map<string, SnippetMenuItem[]>()

  for (const file of listMarkdownFiles(snippetsDir)) {
    const { data } = matter(readFileSync(file, 'utf8'))
    if (typeof data.title !== 'string' || typeof data.slug !== 'string') continue

    const language = String(data.language ?? '')
    if (!language) continue

    const url = relative(docsDir, file)
      .replace(/\.md$/, '')
      .replace(/\/index$/, '/')
      .split('/')
      .map((segment) => segment.replace(/\s+/g, '-'))
      .join('/')
    const prefix = locale === 'en' ? '/en' : ''
    const items = groups.get(language) ?? []
    items.push({ title: data.title, link: `${prefix}/${url}` })
    groups.set(language, items)
  }

  return [...groups.entries()]
    .map(([language, items]) => ({
      language,
      items: items.sort((left, right) => left.title.localeCompare(right.title, 'en')),
    }))
    .sort((left, right) => left.language.localeCompare(right.language, 'en'))
}

function navbarSnippetMenu(locale: 'ru' | 'en', label: string) {
  const menu = buildSnippetMenu(locale)
  if (!menu.length) return { text: label, link: locale === 'en' ? '/en/' : '/' }

  return {
    text: label,
    items: menu.map((group) => ({
      text: group.language,
      items: group.items.map((item) => ({ text: item.title, link: item.link })),
    })),
  }
}

function sidebarSnippetMenu(locale: 'ru' | 'en') {
  const menu = buildSnippetMenu(locale)
  return menu.map((group) => ({
    text: group.language,
    collapsed: false,
    items: group.items,
  }))
}

function normalizeBase(value: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, '')
  return segment ? `/${segment}/` : '/'
}

function resolveBase(): string {
  if (process.env.BASE_PATH !== undefined) {
    return normalizeBase(process.env.BASE_PATH)
  }

  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) return '/'

  const [owner, name] = repository.split('/')
  if (!owner || !name) return '/'

  return name.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ? '/'
    : normalizeBase(name)
}

export default defineConfig({
  title: 'CodeBites',
  description: 'Быстрый поиск проверенных сниппетов кода',
  base: resolveBase(),
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    lineNumbers: true,
    codeCopyButtonTitle: 'Копировать код',
  },
  locales: {
    root: {
      label: 'Русский',
      lang: 'ru-RU',
      title: 'CodeBites',
      description: 'Быстрый поиск проверенных сниппетов кода',
      themeConfig: {
        nav: [
          navbarSnippetMenu('ru', 'Сниппеты'),
          { text: 'Как добавить', link: '/contributing' },
        ],
        sidebar: {
          '/snippets/': {
            base: '/',
            items: sidebarSnippetMenu('ru'),
          },
        },
        outline: { label: 'На странице' },
        docFooter: { prev: 'Назад', next: 'Далее' },
        lastUpdated: { text: 'Обновлено' },
        darkModeSwitchLabel: 'Тема',
        lightModeSwitchTitle: 'Включить светлую тему',
        darkModeSwitchTitle: 'Включить тёмную тему',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Язык',
        notFound: {
          title: 'Страница не найдена',
          quote: 'Возможно, сниппет был перемещён или удалён.',
          linkLabel: 'Вернуться к каталогу',
          linkText: 'Вернуться к каталогу',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'CodeBites',
      description: 'Find proven code snippets without breaking your flow',
      themeConfig: {
        nav: [
          navbarSnippetMenu('en', 'Snippets'),
          { text: 'How to contribute', link: '/en/contributing' },
        ],
        sidebar: {
          '/en/snippets/': {
            base: '/en/',
            items: sidebarSnippetMenu('en'),
          },
        },
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: { text: 'Updated' },
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Return to top',
        langMenuLabel: 'Language',
        notFound: {
          title: 'Page not found',
          quote: 'The snippet may have been moved or removed.',
          linkLabel: 'Return to catalog',
          linkText: 'Return to catalog',
        },
      },
    },
  },
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'CodeBites',
    },
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
        locales: {
          root: {
            translations: {
              button: {
                buttonText: 'Поиск',
                buttonAriaLabel: 'Поиск по сниппетам',
              },
              modal: {
                displayDetails: 'Показать подробности',
                resetButtonTitle: 'Сбросить поиск',
                backButtonTitle: 'Закрыть поиск',
                noResultsText: 'Ничего не найдено для',
                footer: {
                  selectText: 'выбрать',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: 'перейти',
                  navigateUpKeyAriaLabel: 'стрелка вверх',
                  navigateDownKeyAriaLabel: 'стрелка вниз',
                  closeText: 'закрыть',
                  closeKeyAriaLabel: 'Escape',
                },
              },
            },
          },
          en: {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search snippets',
              },
              modal: {
                displayDetails: 'Display details',
                resetButtonTitle: 'Reset search',
                backButtonTitle: 'Close search',
                noResultsText: 'No results found for',
                footer: {
                  selectText: 'select',
                  selectKeyAriaLabel: 'Enter',
                  navigateText: 'navigate',
                  navigateUpKeyAriaLabel: 'up arrow',
                  navigateDownKeyAriaLabel: 'down arrow',
                  closeText: 'close',
                  closeKeyAriaLabel: 'Escape',
                },
              },
            },
          },
        },
      },
    },
  },
})
