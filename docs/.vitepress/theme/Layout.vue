<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import SnippetMeta from './components/SnippetMeta.vue'

const { lang } = useData()
const route = useRoute()
const isCatalogPage = computed(() => route.path === '/' || route.path === '/en/')
const isSnippetPage = computed(() => /^\/(?:en\/)?snippets\/.+/.test(route.path))
const catalogUrl = computed(() => withBase(lang.value.startsWith('en') ? '/en/' : '/'))
const catalogLabel = computed(() =>
  lang.value.startsWith('en') ? 'Back to all snippets' : 'Вернуться ко всем сниппетам',
)
const catalogNavigationLabel = computed(() =>
  lang.value.startsWith('en') ? 'Snippet navigation' : 'Навигация по сниппетам',
)

function localizeThemeControls(): void {
  const isEnglish = lang.value.startsWith('en')
  const label = lang.value.startsWith('en') ? 'Copy code' : 'Копировать код'
  document.querySelectorAll<HTMLButtonElement>('button.copy').forEach((button) => {
    button.title = label
    button.setAttribute('aria-label', label)
  })

  const navigationLabel = isEnglish ? 'Mobile navigation' : 'Мобильная навигация'
  document.querySelector<HTMLButtonElement>('button.VPNavBarHamburger')?.setAttribute(
    'aria-label',
    navigationLabel,
  )
}

onMounted(localizeThemeControls)
watch(
  [() => route.path, () => lang.value],
  async () => {
    await nextTick()
    localizeThemeControls()
  },
)
</script>

<template>
  <DefaultTheme.Layout :class="{ 'is-catalog-page': isCatalogPage }">
    <template #doc-before>
      <SnippetMeta />
    </template>
    <template #doc-after>
      <nav v-if="isSnippetPage" class="snippet-detail-footer" :aria-label="catalogNavigationLabel">
        <a class="snippet-back" :href="catalogUrl">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
          {{ catalogLabel }}
        </a>
      </nav>
    </template>
  </DefaultTheme.Layout>
</template>
