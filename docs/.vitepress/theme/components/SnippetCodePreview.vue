<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

import {
  buildCodeLines,
  compactHighlightedCode,
  isCommandLineSnippet,
} from '../catalog'

const props = withDefaults(
  defineProps<{
    code: string
    highlightedCode?: string
    codeLanguage: string
    language: string
    previewId?: string
    clipped?: boolean
    wrapLines?: boolean
    copyCommandLabel: string
    copiedCommandLabel: string
  }>(),
  {
    highlightedCode: '',
    previewId: undefined,
    clipped: false,
    wrapLines: false,
  },
)

const copiedLineIndex = ref(-1)
let copiedLineTimer: ReturnType<typeof setTimeout> | undefined

interface RenderedCodeLine {
  html: string
  text: string
  copyText: string
  copyable: boolean
}

const blockHighlightedCode = computed(() => compactHighlightedCode(props.highlightedCode))
const codeLines = computed<RenderedCodeLine[] | null>(() => {
  if (!isCommandLineSnippet(props.codeLanguage, props.language) || !props.code) return null

  const lines = buildCodeLines(props.code)
  const highlightedLines = props.highlightedCode
    ? props.highlightedCode.trimEnd().split(/\r?\n/)
    : []

  return lines.map((line, index) => ({
    html: highlightedLines.length === lines.length ? (highlightedLines[index] ?? '') : '',
    text: line.text,
    copyText: line.copyText,
    copyable: line.copyable,
  }))
})

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
  if (copiedLineTimer) clearTimeout(copiedLineTimer)
})
</script>

<template>
  <div
    :id="previewId"
    class="snippet-code-preview snippet-card__code-viewport"
    :class="{
      'is-clipped': clipped,
      'is-expanded': !clipped,
      'is-wrapped': wrapLines,
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
      :aria-label="copiedLineIndex === index ? copiedCommandLabel : copyCommandLabel"
      :title="copiedLineIndex === index ? copiedCommandLabel : copyCommandLabel"
      @click="copyLine(line.copyText, index)"
    ><svg v-if="copiedLineIndex !== index" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 7.5A2.5 2.5 0 0 1 10.5 5h7A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 16.5v-9Z" /><path d="M15.5 5V4.5A2.5 2.5 0 0 0 13 2H6.5A2.5 2.5 0 0 0 4 4.5V13a2.5 2.5 0 0 0 2.5 2.5H8" /></svg><svg v-else aria-hidden="true" viewBox="0 0 24 24"><path d="m5 13 4 4L19 7" /></svg></button></span>{{ '\n' }}</template></code><code
      v-else-if="blockHighlightedCode"
      v-html="blockHighlightedCode"
    ></code><code v-else>{{ code }}</code></pre>
  </div>
</template>
