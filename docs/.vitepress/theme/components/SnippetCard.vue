<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'

import type { SnippetSummary } from '../catalog'

const props = defineProps<{
  snippet: SnippetSummary
  locale: 'ru' | 'en'
}>()

const emit = defineEmits<{
  toggleTag: [tag: string]
}>()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const text = computed(() =>
  props.locale === 'ru'
    ? {
        copy: 'Копировать код',
        copied: 'Скопировано',
        open: 'Открыть сниппет',
      }
    : {
        copy: 'Copy code',
        copied: 'Copied',
        open: 'Open snippet',
      },
)

async function copyCode(): Promise<void> {
  if (!props.snippet.code || typeof navigator === 'undefined') return

  await navigator.clipboard.writeText(props.snippet.code)
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1800)
}
</script>

<template>
  <article class="snippet-card">
    <div class="snippet-card__topline">
      <span class="language-pill">{{ snippet.language }}</span>
      <span v-if="snippet.updated" class="snippet-card__date">{{ snippet.updated }}</span>
    </div>

    <div class="snippet-card__content">
      <h3>
        <a :href="withBase(snippet.url)">{{ snippet.title }}</a>
      </h3>
      <p>{{ snippet.description }}</p>
    </div>

    <div v-if="snippet.code" class="snippet-card__code">
      <div class="snippet-card__codebar">
        <span>{{ snippet.codeLanguage }}</span>
        <button type="button" class="copy-button" @click="copyCode">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 16.5v-9Z" />
            <path d="M15.5 5V4.5A2.5 2.5 0 0 0 13 2H6.5A2.5 2.5 0 0 0 4 4.5V13a2.5 2.5 0 0 0 2.5 2.5H8" />
          </svg>
          {{ copied ? text.copied : text.copy }}
        </button>
      </div>
      <pre><code>{{ snippet.code }}</code></pre>
    </div>

    <div class="snippet-card__footer">
      <div class="snippet-tags" :aria-label="locale === 'ru' ? 'Теги' : 'Tags'">
        <button
          v-for="tag in snippet.tags"
          :key="tag"
          type="button"
          class="tag-chip tag-chip--compact"
          @click="emit('toggleTag', tag)"
        >
          #{{ tag }}
        </button>
      </div>
      <a class="snippet-card__link" :href="withBase(snippet.url)">
        {{ text.open }}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </article>
</template>
