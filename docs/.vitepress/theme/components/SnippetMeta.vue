<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

import { formatTechnologyName, getContentTags } from '../catalog'

const { frontmatter, lang } = useData()

const isSnippet = computed(() => Array.isArray(frontmatter.value.tags))
const tags = computed<string[]>(() =>
  Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags.map(String) : [],
)
const contentTags = computed(() => getContentTags(tags.value, String(frontmatter.value.language)))
const locale = computed(() => (lang.value.startsWith('en') ? 'en' : 'ru'))
const catalogUrl = computed(() => withBase(locale.value === 'en' ? '/en/' : '/'))
const catalogLabel = computed(() => (locale.value === 'en' ? 'All snippets' : 'Все сниппеты'))

function tagUrl(tag: string): string {
  const home = locale.value === 'en' ? '/en/' : '/'
  return withBase(`${home}?tags=${encodeURIComponent(tag)}#catalog`)
}
</script>

<template>
  <div v-if="isSnippet" class="snippet-context">
    <a class="snippet-back" :href="catalogUrl">
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
      {{ catalogLabel }}
    </a>
    <div class="snippet-meta">
      <span class="language-pill" :data-language="frontmatter.language">
        {{ formatTechnologyName(String(frontmatter.language)) }}
      </span>
      <a v-for="tag in contentTags" :key="tag" class="tag-chip tag-chip--compact" :href="tagUrl(tag)">
        #{{ tag }}
      </a>
    </div>
  </div>
</template>
