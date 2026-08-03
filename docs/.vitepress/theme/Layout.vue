<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useData } from "vitepress";

// The homepage (layout: home) renders bare: no DefaultTheme chrome to fight
// for its custom marketing layout. Every other page gets the full
// DefaultTheme.Layout (sidebar, TOC, prev/next, mobile nav, search).
const { frontmatter } = useData();
</script>

<template>
  <Content v-if="frontmatter.layout === 'home'" />
  <DefaultTheme.Layout v-else />
</template>
