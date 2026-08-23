<script setup lang="ts">
import { data as snippets } from '../snippets-ru.data'
import SnippetCatalog from './SnippetCatalog.vue'
</script>

<template>
  <SnippetCatalog locale="ru" :snippets="snippets" />
</template>
