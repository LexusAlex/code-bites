<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

import {
  buildCodeLines,
  formatDate,
  formatSnippetMetric,
  formatTechnologyName,
  getContentTags,
  getPreviewTags,
  getSnippetBadges,
  isCommandLineSnippet,
  isLongCodePreview,
  type SnippetBadge,
  type SnippetSummary,
} from '../catalog'

const props = defineProps<{
  snippet: SnippetSummary
  locale: 'ru' | 'en'
  matchTerms?: string[]
  selectedTags?: string[]
}>()

const emit = defineEmits<{
  toggleTag: [tag: string]
}>()

const copied = ref(false)
const codeExpanded = ref(false)
const copiedLineIndex = ref(-1)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
let copiedLineTimer: ReturnType<typeof setTimeout> | undefined

const text = computed(() =>
  props.locale === 'ru'
    ? {
        open: 'Открыть',
        copy: 'Копировать',
        copied: 'Скопировано',
        copyCommand: 'Скопировать команду',
        copiedCommand: 'Команда скопирована',
        expand: 'Развернуть код',
        collapse: 'Свернуть код',
        moreTags: 'Ещё тегов',
        badges: {
          caution: 'С осторожностью',
          destructive: 'Опасная команда',
          sudo: 'Требует sudo',
          linux: 'Только Linux',
        } satisfies Record<SnippetBadge, string>,
      }
    : {
        open: 'Open',
        copy: 'Copy',
        copied: 'Copied',
        copyCommand: 'Copy command',
        copiedCommand: 'Command copied',
        expand: 'Expand code',
        collapse: 'Collapse code',
        moreTags: 'More tags',
        badges: {
          caution: 'Use with care',
          destructive: 'Destructive',
          sudo: 'Requires sudo',
          linux: 'Linux only',
        } satisfies Record<SnippetBadge, string>,
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
const badges = computed(() =>
  getSnippetBadges(props.snippet).map((badge) => ({
    key: badge,
    label: text.value.badges[badge],
  })),
)
const metric = computed(() =>
  formatSnippetMetric(
    props.snippet.code,
    props.snippet.codeLanguage,
    props.snippet.language,
    props.locale,
  ),
)

interface RenderedCodeLine {
  html: string
  text: string
  copyText: string
  copyable: boolean
}

const codeLines = computed<RenderedCodeLine[] | null>(() => {
  if (!isCommandLineSnippet(props.snippet.codeLanguage, props.snippet.language)) return null
  if (!props.snippet.code) return null

  const lines = buildCodeLines(props.snippet.code)
  const highlightedLines = props.snippet.highlightedCode
    ? props.snippet.highlightedCode.trimEnd().split(/\r?\n/)
    : []

  return lines.map((line, index) => ({
    html: highlightedLines.length === lines.length ? (highlightedLines[index] ?? '') : '',
    text: line.text,
    copyText: line.copyText,
    copyable: line.copyable,
  }))
})

async function copyCode(): Promise<void> {
  if (!props.snippet.code || typeof navigator === 'undefined') return

  await navigator.clipboard.writeText(props.snippet.code)
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1800)
}

async function copyLine(text: string, index: number): Promise<void> {
  if (!text || typeof navigator === 'undefined') return

  await navigator.clipboard.writeText(text)
  copiedLineIndex.value = index
  if (copiedLineTimer) clearTimeout(copiedLineTimer)
  copiedLineTimer = setTimeout(() => {
    copiedLineIndex.value = -1
  }, 1800)
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
  if (copiedLineTimer) clearTimeout(copiedLineTimer)
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
  <article class="snippet-card" :data-language="snippet.language">
    <a
      class="snippet-card__surface-link"
      :href="withBase(snippet.url)"
      tabindex="-1"
      aria-hidden="true"
    ></a>

    <div class="snippet-card__topline">
      <div class="snippet-card__badges">
        <span class="language-pill" :data-language="snippet.language">
          <span class="language-pill__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </span>
          <span>{{ formatTechnologyName(snippet.language) }}</span>
        </span>
        <span
          v-for="badge in badges"
          :key="badge.key"
          class="snippet-status"
          :class="`snippet-status--${badge.key}`"
        >
          <span class="snippet-status__dot" aria-hidden="true"></span>
          {{ badge.label }}
        </span>
      </div>
      <time v-if="formattedDate" class="snippet-card__date" :datetime="snippet.updated">
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v4l2.5 1.5" />
        </svg>
        {{ formattedDate }}
      </time>
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
          <div class="snippet-card__code-identity">
            <span class="snippet-card__window-controls" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span class="snippet-card__code-language">{{
              snippet.codeLanguage || snippet.language
            }}</span>
          </div>
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
            v-if="codeLines"
          ><template v-for="(line, index) in codeLines" :key="index"><span class="code-line"><span
            v-if="line.html"
            class="code-line__content"
            v-html="line.html"
          ></span><span v-else class="code-line__content">{{ line.text }}</span><button
            v-if="line.copyable"
            type="button"
            class="code-line__copy"
            :class="{ 'code-line__copy--copied': copiedLineIndex === index }"
            :aria-label="copiedLineIndex === index ? text.copiedCommand : text.copyCommand"
            :title="copiedLineIndex === index ? text.copiedCommand : text.copyCommand"
            @click="copyLine(line.copyText, index)"
          ><svg v-if="copiedLineIndex !== index" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 16.5v-9Z" /><path d="M15.5 5V4.5A2.5 2.5 0 0 0 13 2H6.5A2.5 2.5 0 0 0 4 4.5V13a2.5 2.5 0 0 0 2.5 2.5H8" /></svg><svg v-else aria-hidden="true" viewBox="0 0 24 24"><path d="m5 13 4 4L19 7" /></svg></button></span>{{ '\n' }}</template></code><code
            v-else-if="snippet.highlightedCode"
            v-html="snippet.highlightedCode"
          ></code><code v-else>{{ snippet.code }}</code></pre>
        </div>
      </div>
    </div>

    <footer class="snippet-card__footer">
      <div class="snippet-card__footer-details">
        <div class="snippet-tags" :aria-label="locale === 'ru' ? 'Теги' : 'Tags'">
          <button
            v-for="tag in previewTags"
            :key="tag"
            type="button"
            class="tag-chip tag-chip--compact"
            :class="{ 'tag-chip--active': selectedTags?.includes(tag) }"
            :aria-pressed="selectedTags?.includes(tag)"
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
        <span v-if="metric" class="snippet-card__metric">
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="m5 7 3 3-3 3M10 13h5" />
          </svg>
          {{ metric }}
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
