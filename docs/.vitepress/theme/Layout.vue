<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import SnippetMeta from './components/SnippetMeta.vue'

const { lang } = useData()
const route = useRoute()

function localizeCopyButtons(): void {
  const label = lang.value.startsWith('en') ? 'Copy code' : 'Копировать код'
  document.querySelectorAll<HTMLButtonElement>('button.copy').forEach((button) => {
    button.title = label
    button.setAttribute('aria-label', label)
  })
}

onMounted(localizeCopyButtons)
watch(
  () => route.path,
  async () => {
    await nextTick()
    localizeCopyButtons()
  },
)
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <SnippetMeta />
    </template>
  </DefaultTheme.Layout>
</template>
