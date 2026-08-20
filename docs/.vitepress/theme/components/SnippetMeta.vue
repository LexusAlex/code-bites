<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter, lang } = useData()

const isSnippet = computed(() => Array.isArray(frontmatter.value.tags))
const tags = computed<string[]>(() =>
  Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags.map(String) : [],
)
const locale = computed(() => (lang.value.startsWith('en') ? 'en' : 'ru'))

function tagUrl(tag: string): string {
  const home = locale.value === 'en' ? '/en/' : '/'
  return withBase(`${home}?tags=${encodeURIComponent(tag)}#catalog`)
}
</script>

<template>
  <div v-if="isSnippet" class="snippet-meta">
    <span class="language-pill">{{ frontmatter.language }}</span>
    <a v-for="tag in tags" :key="tag" class="tag-chip tag-chip--compact" :href="tagUrl(tag)">
      #{{ tag }}
    </a>
  </div>
</template>
