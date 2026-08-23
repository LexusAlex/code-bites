import { createContentLoader } from 'vitepress'

import { transformSnippetPages } from './snippets-transform'

declare const data: ReturnType<typeof transformSnippetPages>
export { data }

export default createContentLoader('snippets/**/*.md', {
  includeSrc: true,
  render: true,
  transform(pages) {
    return transformSnippetPages(pages, 'ru')
  },
})
