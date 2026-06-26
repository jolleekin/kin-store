---
layout: home

hero:
  name: Kin Store
  text: Reactive state you want to use.
  tagline: "Framework-agnostic. Zero dependencies. 100% type-safe.<br/>Start with 244 B and add only what you need."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why Kin Store?
      link: /guide/
    - theme: alt
      text: API Reference
      link: https://jsr.io/@kin-store

features:
  - icon: 🪜
    title: Start simple, grow freely
    details: Begin with createStore and three methods. Add withPlugins for structure, derive for composition. Each step is additive — nothing you built needs to change.
  - icon: 🔒
    title: 100% type-safe by default
    details: Every reducer, dispatch call, and plugin method is fully inferred. No any, no manual annotation at call sites. The type system is load-bearing, not decorative.
  - icon: 📦
    title: Tiny and pay-per-use
    details: "244 B for createStore. 465 B for derive. 1.07 KB for withPlugins with the full plugin system. Zero cost for capability you haven't opted into."
  - icon: 🔌
    title: Flat plugin composition
    details: Each .use() adds one line — not one nesting level. Read the pipeline top-to-bottom, not inside-out. No conflicting middleware assumptions.
  - icon: 🔍
    title: Explicit, not magic
    details: No hidden merges, no auto-propagating destroy, no implicit dependency graphs. If something happens, you triggered it.
  - icon: ⚛️
    title: Framework-agnostic
    details: Works in any framework or none. React bindings ship separately, backed by useSyncExternalStore for concurrent mode safety.
---

<FeatureMatrix />
