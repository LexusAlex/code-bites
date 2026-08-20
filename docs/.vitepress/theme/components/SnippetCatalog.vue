<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { data as snippets } from '../snippets.data'
import {
  collectTags,
  createSnippetSearchIndex,
  filterSnippets,
  type SnippetLocale,
} from '../catalog'
import SnippetCard from './SnippetCard.vue'

const props = defineProps<{
  locale: SnippetLocale
}>()

const query = ref('')
const language = ref('')
const selectedTags = ref<string[]>([])
const searchInput = ref<HTMLInputElement>()
const hasMounted = ref(false)

const text = computed(() =>
  props.locale === 'ru'
    ? {
        eyebrow: 'Каталог',
        title: 'Найдите решение за несколько секунд',
        description: 'Поиск работает по названию, описанию, тегам и исходному коду.',
        search: 'Найти сниппет, API или фрагмент кода…',
        searchLabel: 'Поиск по каталогу',
        language: 'Все языки',
        languageLabel: 'Фильтр по языку',
        tags: 'Фильтр по тегам',
        reset: 'Сбросить',
        shown: 'Показано',
        of: 'из',
        snippets: 'сниппетов',
        emptyTitle: 'Ничего не найдено',
        emptyText: 'Попробуйте изменить запрос или сбросить часть фильтров.',
      }
    : {
        eyebrow: 'Catalog',
        title: 'Find a solution in seconds',
        description: 'Search across titles, descriptions, tags, and source code.',
        search: 'Find a snippet, API, or piece of code…',
        searchLabel: 'Search the catalog',
        language: 'All languages',
        languageLabel: 'Filter by language',
        tags: 'Filter by tags',
        reset: 'Reset',
        shown: 'Showing',
        of: 'of',
        snippets: 'snippets',
        emptyTitle: 'No snippets found',
        emptyText: 'Try changing the query or clearing some filters.',
      },
)

const localizedSnippets = computed(() =>
  snippets.filter((snippet) => snippet.locale === props.locale),
)
const searchIndex = computed(() => createSnippetSearchIndex(localizedSnippets.value))
const tags = computed(() => collectTags(snippets, props.locale))
const languages = computed(() =>
  [...new Set(localizedSnippets.value.map((snippet) => snippet.language))].sort((left, right) =>
    left.localeCompare(right, 'en'),
  ),
)
const filteredSnippets = computed(() =>
  filterSnippets(
    localizedSnippets.value,
    {
      locale: props.locale,
      query: query.value,
      language: language.value,
      tags: selectedTags.value,
    },
    searchIndex.value,
  ),
)
const hasFilters = computed(
  () => Boolean(query.value || language.value || selectedTags.value.length),
)

function toggleTag(tag: string): void {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((selectedTag) => selectedTag !== tag)
    : [...selectedTags.value, tag]
}

function resetFilters(): void {
  query.value = ''
  language.value = ''
  selectedTags.value = []
}

function readFiltersFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  query.value = params.get('q') ?? ''
  language.value = params.get('language') ?? ''
  selectedTags.value = (params.get('tags') ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tags.value.some((knownTag) => knownTag.name === tag))
}

function writeFiltersToUrl(): void {
  if (!hasMounted.value) return

  const url = new URL(window.location.href)
  query.value ? url.searchParams.set('q', query.value) : url.searchParams.delete('q')
  language.value
    ? url.searchParams.set('language', language.value)
    : url.searchParams.delete('language')
  selectedTags.value.length
    ? url.searchParams.set('tags', selectedTags.value.join(','))
    : url.searchParams.delete('tags')
  window.history.replaceState({}, '', url)
}

function handleShortcut(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (event.key !== '/' || target?.matches('input, textarea, select, [contenteditable]')) return

  event.preventDefault()
  searchInput.value?.focus()
}

onMounted(() => {
  readFiltersFromUrl()
  hasMounted.value = true
  window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))

watch([query, language, selectedTags], writeFiltersToUrl, { deep: true })
</script>

<template>
  <section id="catalog" class="snippet-catalog" aria-labelledby="catalog-title">
    <div class="catalog-heading">
      <span class="catalog-eyebrow">{{ text.eyebrow }}</span>
      <h2 id="catalog-title">{{ text.title }}</h2>
      <p>{{ text.description }}</p>
    </div>

    <div class="catalog-controls">
      <label class="catalog-search">
        <span class="sr-only">{{ text.searchLabel }}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input ref="searchInput" v-model="query" type="search" :placeholder="text.search" />
        <kbd>/</kbd>
      </label>

      <label class="language-select">
        <span class="sr-only">{{ text.languageLabel }}</span>
        <select v-model="language">
          <option value="">{{ text.language }}</option>
          <option v-for="item in languages" :key="item" :value="item">{{ item }}</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m6 8 4 4 4-4" /></svg>
      </label>
    </div>

    <div v-if="tags.length" class="catalog-tags" :aria-label="text.tags">
      <button
        v-for="tag in tags"
        :key="tag.name"
        type="button"
        class="tag-chip"
        :class="{ 'tag-chip--active': selectedTags.includes(tag.name) }"
        :aria-pressed="selectedTags.includes(tag.name)"
        @click="toggleTag(tag.name)"
      >
        #{{ tag.name }}
        <span>{{ tag.count }}</span>
      </button>
    </div>

    <div class="catalog-summary" aria-live="polite">
      <span>
        {{ text.shown }} <strong>{{ filteredSnippets.length }}</strong> {{ text.of }}
        {{ localizedSnippets.length }} {{ text.snippets }}
      </span>
      <button v-if="hasFilters" type="button" class="reset-button" @click="resetFilters">
        {{ text.reset }}
      </button>
    </div>

    <div v-if="filteredSnippets.length" class="snippet-grid">
      <SnippetCard
        v-for="snippet in filteredSnippets"
        :key="snippet.url"
        :snippet="snippet"
        :locale="locale"
        @toggle-tag="toggleTag"
      />
    </div>

    <div v-else class="catalog-empty">
      <span aria-hidden="true">⌁</span>
      <h3>{{ text.emptyTitle }}</h3>
      <p>{{ text.emptyText }}</p>
      <button type="button" class="reset-button reset-button--solid" @click="resetFilters">
        {{ text.reset }}
      </button>
    </div>
  </section>
</template>
