<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import SnippetMeta from './components/SnippetMeta.vue'

const { lang } = useData()
const route = useRoute()
const isCatalogPage = computed(() => route.path === '/' || route.path === '/en/')

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
  </DefaultTheme.Layout>
</template>
