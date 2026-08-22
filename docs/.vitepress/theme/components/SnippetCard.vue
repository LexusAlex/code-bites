<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

import { formatDate, type SnippetSummary } from '../catalog'

const props = defineProps<{
  snippet: SnippetSummary
  locale: 'ru' | 'en'
  matchTerms?: string[]
}>()

const emit = defineEmits<{
  toggleTag: [tag: string]
}>()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const text = computed(() =>
  props.locale === 'ru'
    ? { open: 'Открыть', copy: 'Копировать', copied: 'Скопировано' }
    : { open: 'Open', copy: 'Copy', copied: 'Copied' },
)

const formattedDate = computed(() =>
  props.snippet.updated ? formatDate(props.snippet.updated, props.locale) : '',
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

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})

interface Segment {
  text: string
  match: boolean
}

function highlightSegments(value: string, terms: string[] | undefined): Segment[] {
  const source = terms ?? []
  if (!source.length) return [{ text: value, match: false }]

  const escaped = source.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')

  return value
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: source.some((term) => term.toLowerCase() === part.toLowerCase()),
    }))
}
</script>

<template>
  <article class="snippet-card">
    <div class="snippet-card__body">
      <div class="snippet-card__topline">
        <span class="language-pill" :data-language="snippet.language">{{ snippet.language }}</span>
        <time v-if="formattedDate" class="snippet-card__date" :datetime="snippet.updated">{{
          formattedDate
        }}</time>
      </div>

      <h3 class="snippet-card__title">
        <a :href="withBase(snippet.url)">
          <template v-for="(segment, index) in highlightSegments(snippet.title, matchTerms)" :key="index">
            <mark v-if="segment.match">{{ segment.text }}</mark>
            <template v-else>{{ segment.text }}</template>
          </template>
        </a>
      </h3>
      <p class="snippet-card__description">
        <template
          v-for="(segment, index) in highlightSegments(snippet.description, matchTerms)"
          :key="index"
        >
          <mark v-if="segment.match">{{ segment.text }}</mark>
          <template v-else>{{ segment.text }}</template>
        </template>
      </p>

      <div v-if="snippet.code" class="snippet-card__code">
        <button
          type="button"
          class="copy-button"
          :class="{ 'copy-button--copied': copied }"
          @click="copyCode"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 16.5v-9Z" />
            <path d="M15.5 5V4.5A2.5 2.5 0 0 0 13 2H6.5A2.5 2.5 0 0 0 4 4.5V13a2.5 2.5 0 0 0 2.5 2.5H8" />
          </svg>
          {{ copied ? text.copied : text.copy }}
        </button>
        <pre><code>{{ snippet.code }}</code></pre>
      </div>

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
    </div>

    <a class="snippet-card__link" :href="withBase(snippet.url)" :aria-label="text.open">
      <span aria-hidden="true">→</span>
    </a>
  </article>
</template>
