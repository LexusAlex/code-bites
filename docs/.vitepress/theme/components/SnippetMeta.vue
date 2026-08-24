<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

import {
  formatDate,
  formatTechnologyName,
  getContentTags,
  getSnippetBadges,
  type SnippetBadge,
  type SnippetLocale,
  type SnippetRequirement,
  type SnippetRisk,
} from '../catalog'

const { frontmatter, lang } = useData()

const isSnippet = computed(() => Array.isArray(frontmatter.value.tags))
const tags = computed<string[]>(() =>
  Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags.map(String) : [],
)
const contentTags = computed(() => getContentTags(tags.value, String(frontmatter.value.language)))
const locale = computed<SnippetLocale>(() => (lang.value.startsWith('en') ? 'en' : 'ru'))
const catalogUrl = computed(() => withBase(locale.value === 'en' ? '/en/' : '/'))
const catalogLabel = computed(() => (locale.value === 'en' ? 'All snippets' : 'Все сниппеты'))
const updatedLabel = computed(() => (locale.value === 'en' ? 'Updated' : 'Обновлено'))
const risk = computed<SnippetRisk | undefined>(() => {
  const value = String(frontmatter.value.risk ?? '')
  return value === 'caution' || value === 'destructive' ? value : undefined
})
const requirements = computed<SnippetRequirement[]>(() => {
  if (!Array.isArray(frontmatter.value.requirements)) return []

  return frontmatter.value.requirements
    .map(String)
    .filter((value): value is SnippetRequirement => value === 'sudo' || value === 'linux')
})
const badgeLabels = computed<Record<SnippetBadge, string>>(() =>
  locale.value === 'en'
    ? {
        caution: 'Use with care',
        destructive: 'Destructive',
        sudo: 'Requires sudo',
        linux: 'Linux only',
      }
    : {
        caution: 'С осторожностью',
        destructive: 'Опасная команда',
        sudo: 'Требует sudo',
        linux: 'Только Linux',
      },
)
const badges = computed(() =>
  getSnippetBadges({ risk: risk.value, requirements: requirements.value }).map((badge) => ({
    key: badge,
    label: badgeLabels.value[badge],
  })),
)
const updated = computed(() => String(frontmatter.value.updated ?? ''))
const formattedDate = computed(() => (updated.value ? formatDate(updated.value, locale.value) : ''))

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
      <span
        v-for="badge in badges"
        :key="badge.key"
        class="snippet-status"
        :class="`snippet-status--${badge.key}`"
      >
        <span class="snippet-status__dot" aria-hidden="true" />
        {{ badge.label }}
      </span>
      <a v-for="tag in contentTags" :key="tag" class="tag-chip tag-chip--compact" :href="tagUrl(tag)">
        #{{ tag }}
      </a>
      <time v-if="formattedDate" class="snippet-meta__date" :datetime="updated">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {{ updatedLabel }} {{ formattedDate }}
      </time>
    </div>
  </div>
</template>
