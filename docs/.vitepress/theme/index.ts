import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import Layout from './Layout.vue'
import SnippetCatalog from './components/SnippetCatalog.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SnippetCatalog', SnippetCatalog)
  },
} satisfies Theme
