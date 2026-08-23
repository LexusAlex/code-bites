<script setup lang="ts">
import { data as snippets } from '../snippets-en.data'
import SnippetCatalog from './SnippetCatalog.vue'
</script>

<template>
  <SnippetCatalog locale="en" :snippets="snippets" />
</template>
