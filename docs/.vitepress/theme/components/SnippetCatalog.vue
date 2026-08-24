<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  collectTags,
  createSnippetSearchIndex,
  filterSnippets,
  findMatchTerms,
  formatTechnologyName,
  getVisibleSnippets,
  sortSnippets,
  type SnippetLocale,
  type SnippetSummary,
  type SortMode,
} from '../catalog'
import SnippetCard from './SnippetCard.vue'

const props = defineProps<{
  locale: SnippetLocale
  snippets: SnippetSummary[]
}>()

const query = ref('')
const language = ref('')
const selectedTags = ref<string[]>([])
const sortMode = ref<SortMode>('new')
const tagsOpen = ref(false)
const filtersOpen = ref(false)
const visibleBatchCount = ref(1)
const searchInput = ref<HTMLInputElement>()
const hasMounted = ref(false)

const text = computed(() =>
  props.locale === 'ru'
    ? {
        catalogTitle: 'Каталог сниппетов',
        search: 'Найти код…',
        searchLabel: 'Поиск по каталогу',
        clear: 'Очистить поиск',
        language: 'Все языки',
        languageLabel: 'Фильтр по языку',
        sortNew: 'Сначала новые',
        sortAlpha: 'По алфавиту',
        sortLabel: 'Сортировка',
        tags: 'Фильтр по тегам',
        tagsToggle: 'Теги',
        filters: 'Фильтры',
        results: 'Результаты',
        reset: 'Сбросить',
        found: 'Найдено',
        of: 'из',
        snippets: 'сниппетов',
        loadMore: 'Показать ещё',
        emptyTitle: 'Ничего не найдено',
        emptyForText: 'для',
      }
    : {
        catalogTitle: 'Snippet catalog',
        search: 'Find code…',
        searchLabel: 'Search the catalog',
        clear: 'Clear search',
        language: 'All languages',
        languageLabel: 'Filter by language',
        sortNew: 'Newest first',
        sortAlpha: 'Alphabetical',
        sortLabel: 'Sort order',
        tags: 'Filter by tags',
        tagsToggle: 'Tags',
        filters: 'Filters',
        results: 'Results',
        reset: 'Reset',
        found: 'Found',
        of: 'of',
        snippets: 'snippets',
        loadMore: 'Show more',
        emptyTitle: 'No snippets found',
        emptyForText: 'for',
      },
)

const localizedSnippets = computed(() =>
  props.snippets.filter((snippet) => snippet.locale === props.locale),
)
const searchIndex = computed(() => createSnippetSearchIndex(localizedSnippets.value))
const tags = computed(() => collectTags(props.snippets, props.locale))
const languages = computed(() =>
  [...new Set(localizedSnippets.value.map((snippet) => snippet.language))].sort((left, right) =>
    left.localeCompare(right, 'en'),
  ),
)
const filteredSnippets = computed(() =>
  sortSnippets(
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
    sortMode.value,
  ),
)
const visibleSnippets = computed(() =>
  getVisibleSnippets(filteredSnippets.value, visibleBatchCount.value),
)
const hasMoreSnippets = computed(
  () => visibleSnippets.value.length < filteredSnippets.value.length,
)
const matchTerms = computed(() =>
  query.value.trim() ? findMatchTerms(query.value, searchIndex.value) : new Map<string, string[]>(),
)
const hasFilters = computed(
  () => Boolean(query.value || language.value || selectedTags.value.length || sortMode.value !== 'new'),
)
const activeFilterCount = computed(
  () => Number(Boolean(language.value)) + selectedTags.value.length + Number(sortMode.value !== 'new'),
)

function toggleTag(tag: string): void {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((selectedTag) => selectedTag !== tag)
    : [...selectedTags.value, tag]
}

function clearSearch(): void {
  query.value = ''
  searchInput.value?.focus()
}

function resetFilters(): void {
  query.value = ''
  language.value = ''
  selectedTags.value = []
  sortMode.value = 'new'
  tagsOpen.value = false
}

function toggleFilters(): void {
  filtersOpen.value = !filtersOpen.value
  if (!filtersOpen.value) tagsOpen.value = false
}

function showMoreSnippets(): void {
  visibleBatchCount.value += 1
}

function readFiltersFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  query.value = params.get('q') ?? ''
  language.value = params.get('language') ?? ''
  selectedTags.value = (params.get('tags') ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tags.value.some((knownTag) => knownTag.name === tag))
  sortMode.value = params.get('sort') === 'alpha' ? 'alpha' : 'new'
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
  sortMode.value !== 'new' ? url.searchParams.set('sort', sortMode.value) : url.searchParams.delete('sort')
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

watch(
  [query, language, selectedTags, sortMode],
  () => {
    visibleBatchCount.value = 1
    writeFiltersToUrl()
  },
  { deep: true },
)
</script>

<template>
  <section id="catalog" class="snippet-catalog">
    <h1 class="sr-only">{{ text.catalogTitle }}</h1>

    <div class="catalog-controls">
      <label class="catalog-search">
        <span class="sr-only">{{ text.searchLabel }}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          :aria-label="text.searchLabel"
          :placeholder="text.search"
          @keydown.escape="clearSearch"
        />
        <button
          v-if="query"
          type="button"
          class="search-clear"
          :title="text.clear"
          :aria-label="text.clear"
          @click="clearSearch"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
        <kbd v-else aria-hidden="true">/</kbd>
      </label>

      <button
        type="button"
        class="filters-toggle"
        :aria-expanded="filtersOpen"
        :aria-controls="`catalog-filter-fields-${locale}`"
        @click="toggleFilters"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
        </svg>
        {{ text.filters }}
        <span v-if="activeFilterCount">{{ activeFilterCount }}</span>
      </button>

      <div
        :id="`catalog-filter-fields-${locale}`"
        class="catalog-filter-fields"
        :class="{ 'catalog-filter-fields--open': filtersOpen }"
      >
        <label class="language-select">
          <span class="sr-only">{{ text.languageLabel }}</span>
          <select v-model="language">
            <option value="">{{ text.language }}</option>
            <option v-for="item in languages" :key="item" :value="item">
              {{ formatTechnologyName(item) }}
            </option>
          </select>
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m6 8 4 4 4-4" /></svg>
        </label>

        <label class="language-select sort-select">
          <span class="sr-only">{{ text.sortLabel }}</span>
          <select v-model="sortMode">
            <option value="new">{{ text.sortNew }}</option>
            <option value="alpha">{{ text.sortAlpha }}</option>
          </select>
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m6 8 4 4 4-4" /></svg>
        </label>

        <button
          type="button"
          class="tags-toggle"
          :aria-expanded="tagsOpen"
          :aria-controls="`catalog-tags-${locale}`"
          @click="tagsOpen = !tagsOpen"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
          </svg>
          {{ text.tagsToggle }}
          <span v-if="selectedTags.length">{{ selectedTags.length }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="tags.length"
      :id="`catalog-tags-${locale}`"
      class="catalog-tags"
      :class="{ 'catalog-tags--open': tagsOpen }"
      :aria-label="text.tags"
    >
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

    <div id="catalog-results" class="catalog-results">
      <div class="catalog-results__heading">
        <h2>{{ text.results }}</h2>
        <span aria-live="polite">{{ filteredSnippets.length }}</span>
      </div>

      <div v-if="hasFilters" class="catalog-summary" aria-live="polite">
        <span>
          {{ text.found }} <strong>{{ filteredSnippets.length }}</strong> {{ text.of }}
          {{ localizedSnippets.length }} {{ text.snippets }}
        </span>
        <button type="button" class="reset-button" @click="resetFilters">
          {{ text.reset }}
        </button>
      </div>

      <template v-if="filteredSnippets.length">
        <div class="snippet-list">
          <SnippetCard
            v-for="snippet in visibleSnippets"
            :key="snippet.url"
            :snippet="snippet"
            :locale="locale"
            :match-terms="matchTerms.get(snippet.url)"
            :selected-tags="selectedTags"
            @toggle-tag="toggleTag"
          />
        </div>

        <div v-if="hasMoreSnippets" class="catalog-load-more">
          <button type="button" class="load-more-button" @click="showMoreSnippets">
            {{ text.loadMore }}
          </button>
        </div>
      </template>

      <div v-else class="catalog-empty">
        <h3>{{ text.emptyTitle }}<template v-if="query"> {{ text.emptyForText }} “{{ query }}”</template></h3>
        <p>{{ locale === 'ru' ? 'Попробуйте изменить запрос или сбросить часть фильтров.' : 'Try changing the query or clearing some filters.' }}</p>
        <button type="button" class="reset-button reset-button--solid" @click="resetFilters">
          {{ text.reset }}
        </button>
      </div>
    </div>
  </section>
</template>
