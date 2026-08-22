<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

import {
  formatDate,
  formatTechnologyName,
  getContentTags,
  getPreviewTags,
  isLongCodePreview,
  type SnippetSummary,
} from '../catalog'

const props = defineProps<{
  snippet: SnippetSummary
  locale: 'ru' | 'en'
  matchTerms?: string[]
}>()

const emit = defineEmits<{
  toggleTag: [tag: string]
}>()

const copied = ref(false)
const codeExpanded = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const text = computed(() =>
  props.locale === 'ru'
    ? {
        open: 'Открыть',
        copy: 'Копировать',
        copied: 'Скопировано',
        expand: 'Развернуть код',
        collapse: 'Свернуть код',
        moreTags: 'Ещё тегов',
      }
    : {
        open: 'Open',
        copy: 'Copy',
        copied: 'Copied',
        expand: 'Expand code',
        collapse: 'Collapse code',
        moreTags: 'More tags',
      },
)

const formattedDate = computed(() =>
  props.snippet.updated ? formatDate(props.snippet.updated, props.locale) : '',
)
const hasLongCode = computed(() => isLongCodePreview(props.snippet.code))
const contentTags = computed(() => getContentTags(props.snippet.tags, props.snippet.language))
const previewTags = computed(() => getPreviewTags(props.snippet.tags, props.snippet.language))
const hiddenTagCount = computed(() => contentTags.value.length - previewTags.value.length)
const codePreviewId = computed(() => `code-preview-${props.locale}-${props.snippet.slug}`)

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
    <a
      class="snippet-card__surface-link"
      :href="withBase(snippet.url)"
      tabindex="-1"
      aria-hidden="true"
    ></a>

    <div class="snippet-card__topline">
      <span class="language-pill" :data-language="snippet.language">
        {{ formatTechnologyName(snippet.language) }}
      </span>
      <time v-if="formattedDate" class="snippet-card__date" :datetime="snippet.updated">{{
        formattedDate
      }}</time>
    </div>

    <div class="snippet-card__content">
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
        <div class="snippet-card__codebar">
          <span>{{ snippet.codeLanguage || snippet.language }}</span>
          <div class="snippet-card__code-actions">
            <button
              v-if="hasLongCode"
              type="button"
              class="code-expand-button"
              :aria-expanded="codeExpanded"
              :aria-controls="codePreviewId"
              @click="codeExpanded = !codeExpanded"
            >
              {{ codeExpanded ? text.collapse : text.expand }}
              <svg aria-hidden="true" viewBox="0 0 20 20">
                <path d="m6 8 4 4 4-4" />
              </svg>
            </button>
            <button
              type="button"
              class="copy-button"
              :class="{ 'copy-button--copied': copied }"
              :aria-label="copied ? text.copied : text.copy"
              @click="copyCode"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 16.5v-9Z" />
                <path d="M15.5 5V4.5A2.5 2.5 0 0 0 13 2H6.5A2.5 2.5 0 0 0 4 4.5V13a2.5 2.5 0 0 0 2.5 2.5H8" />
              </svg>
              <span aria-live="polite">{{ copied ? text.copied : text.copy }}</span>
            </button>
          </div>
        </div>
        <div
          :id="codePreviewId"
          class="snippet-card__code-viewport"
          :class="{
            'is-clipped': hasLongCode && !codeExpanded,
            'is-expanded': codeExpanded,
          }"
        >
          <pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code
            v-if="snippet.highlightedCode"
            v-html="snippet.highlightedCode"
          ></code><code v-else>{{ snippet.code }}</code></pre>
        </div>
      </div>
    </div>

    <footer class="snippet-card__footer">
      <div class="snippet-tags" :aria-label="locale === 'ru' ? 'Теги' : 'Tags'">
        <button
          v-for="tag in previewTags"
          :key="tag"
          type="button"
          class="tag-chip tag-chip--compact"
          @click="emit('toggleTag', tag)"
        >
          #{{ tag }}
        </button>
        <span
          v-if="hiddenTagCount"
          class="tag-overflow"
          :title="`${text.moreTags}: ${hiddenTagCount}`"
          :aria-label="`${text.moreTags}: ${hiddenTagCount}`"
        >
          +{{ hiddenTagCount }}
        </span>
      </div>
      <a class="snippet-card__link" :href="withBase(snippet.url)">
        {{ text.open }}
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </a>
    </footer>
  </article>
</template>
