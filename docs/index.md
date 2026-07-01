---
layout: home

hero:
  name: Kin Store
  text: Reactive state you want to use
  tagline: "Framework-agnostic. Zero dependencies. 100% type-safe.
    Start with 244 B and add only what you need."
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
    details: Begin with <code>createStore</code> and three methods. Add <code>withPlugins</code> for structure, <code>derive</code> for composition. Each feature is its own layer — adopt one without affecting the others.
  - icon: 🔒
    title: 100% type-safe by default
    details: Every reducer, <code>dispatch</code> call, and plugin method is fully inferred. No <code>any</code>, no manual annotation at call sites. The type system is load-bearing, not decorative.
  - icon: 📦
    title: Tiny and pay-per-use
    details: "244 B for <code>createStore</code>. 465 B for <code>derive</code>. 1.07 KB for <code>withPlugins</code> with the full plugin system. Zero cost for capability you haven't opted into."
  - icon: 🔌
    title: Flat plugin composition
    details: Plugins compose with <code>.use()</code> — each call adds a step, not a nesting level. Read the pipeline top-to-bottom, not inside-out. No silent overrides, no monkey-patching.
  - icon: 🔍
    title: Explicit, not magic
    details: No hidden merges, no auto-propagating destroy, no implicit dependency graphs. If something happens, you triggered it.
  - icon: ⚛️
    title: Framework-agnostic
    details: Works in any framework or none. React bindings ship separately, backed by <code>useSyncExternalStore</code> for concurrent mode safety.
---

<FeatureMatrix />

<style>
html .VPHero .name {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 20px;
  line-height: 32px;
}
html .VPHero .text {
  font-size: 36px;
  line-height: 40px;
  max-width: 100%;
}
html .VPHero .tagline {
  font-size: 16px;
  line-height: 1.5;
  max-width: 564px;
}

@media (min-width: 640px) {
  html .VPHero .name {
    font-size: 24px;
    line-height: 1.5;
  }

  html .VPHero .text {
    /* max-width: 576px; */
    font-size: 44px;
    line-height: 56px;
  }

  html .VPHero .tagline {
    font-size: 20px;
    line-height: 32px;
  }
}

@media (min-width: 960px) {
  html .VPHero .name {
    font-size: 32px;
    line-height: 1.5;
  }

  html .VPHero .text {
    font-size: 56px;
    line-height: 64px;
  }
}

code {
  background-color: var(--vp-code-bg);
  border-radius: 4px;
  color: var(--vp-code-color);
  font-size: var(--vp-code-font-size);
  padding: 3px 6px;
}
</style>
