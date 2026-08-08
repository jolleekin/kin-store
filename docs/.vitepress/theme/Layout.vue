<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

// Every page, including the homepage, gets the full DefaultTheme.Layout
// (nav bar, sidebar, TOC, prev/next, mobile nav, search). The homepage has
// no sidebar registered in config.ts, so that slot simply doesn't render
// there, and its VPHome wrapper is what supplies the built-in responsive
// nav bar (hamburger on mobile) instead of a hand-rolled one.
</script>

<template>
  <DefaultTheme.Layout />
</template>
