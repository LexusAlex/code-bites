import { defineConfig } from 'vitepress'

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

const siteBase = resolveBase()

export default defineConfig({
  title: 'CodeBites',
  description: 'Быстрый поиск проверенных сниппетов кода',
  base: siteBase,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${siteBase}logo-light.svg` }]],
  cleanUrls: true,
  lastUpdated: true,
  transformPageData(pageData) {
    if (/(^|\/)snippets\/.+\.md$/.test(pageData.relativePath)) {
      pageData.frontmatter.aside = false
    }
  },
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
          { text: 'Сниппеты', link: '/' },
          { text: 'Как добавить', link: '/contributing' },
        ],
        outline: { label: 'На странице' },
        docFooter: { prev: 'Назад', next: 'Далее' },
        lastUpdated: { text: 'Обновлено' },
        darkModeSwitchLabel: 'Тема',
        lightModeSwitchTitle: 'Включить светлую тему',
        darkModeSwitchTitle: 'Включить тёмную тему',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Язык',
        skipToContentLabel: 'Перейти к содержимому',
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
          { text: 'Snippets', link: '/en/' },
          { text: 'How to contribute', link: '/en/contributing' },
        ],
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: { text: 'Updated' },
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Return to top',
        langMenuLabel: 'Language',
        skipToContentLabel: 'Skip to content',
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
