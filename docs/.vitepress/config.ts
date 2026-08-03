import { defineConfig, type ThemeOptions } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import poimandresLight from "./theme/poimandres-light.json" with { type: "json" };

export default defineConfig({
  cleanUrls: true,
  // Homepage-only prototype so far; nav/footer links to guide/plugins/
  // react/examples pages that don't exist here yet.
  ignoreDeadLinks: true,
  // The whole theme (palette, Shiki theme) is light-only by design, with no
  // .dark counterpart defined anywhere — DefaultTheme's dark-mode toggle
  // would otherwise render but do nothing, since this theme's CSS overrides
  // are unconditional. Disabling it removes the dead toggle instead.
  appearance: false,
  title: "Kin Store",
  description:
    "A reactive state library for TypeScript. Framework-agnostic, zero dependencies, 100% type-safe.",

  themeConfig: {
    // Comparison stays out of the primary nav (footer link only) — it's
    // opt-in reading, not the pitch.
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "React", link: "/react/" },
      { text: "Examples", link: "/examples/" },
      { text: "API Reference", link: "https://jsr.io/@kin-store" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Why Kin Store?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Design Principles", link: "/guide/design-principles" },
          ],
        },
        {
          text: "Core",
          items: [
            { text: "createStore", link: "/guide/create-store" },
            { text: "withPlugins", link: "/guide/with-plugins" },
            { text: "derive", link: "/guide/derive" },
            { text: "Writing Plugins", link: "/guide/writing-plugins" },
          ],
        },
      ],
      "/plugins/": [
        {
          text: "Official Plugins",
          items: [
            { text: "Overview", link: "/plugins/" },
            { text: "broadcast", link: "/plugins/broadcast" },
            { text: "devtools", link: "/plugins/devtools" },
            { text: "history", link: "/plugins/history" },
            { text: "immer", link: "/plugins/immer" },
            { text: "persist", link: "/plugins/persist" },
          ],
        },
      ],
      "/react/": [
        {
          text: "React",
          items: [{ text: "Overview", link: "/react/" }],
        },
      ],
      "/examples/": [
        {
          text: "Guided Examples",
          items: [
            { text: "Overview", link: "/examples/" },
            { text: "Next.js", link: "/examples/nextjs" },
            {
              text: "TanStack Query + Fat Store",
              link: "/examples/tanstack-query-fat-store",
            },
            {
              text: "TanStack Query + Primitive Stores",
              link: "/examples/tanstack-query-primitive-stores",
            },
            { text: "Cross-Tab Sync", link: "/examples/cross-tab-sync" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/jolleekin/kin-store" },
    ],

    search: { provider: "local" },

    footer: {
      message: 'MIT License. <a href="/comparison">Comparison</a>',
      copyright: "Copyright &copy; 2026-present Man Hoang",
    },

    editLink: {
      pattern: "https://github.com/jolleekin/kin-store/edit/main/docs2/:path",
      text: "Edit this page on GitHub",
    },
  },

  markdown: {
    // poimandres has no official light variant, so this remaps its own
    // token colors (soft blue identifiers, teal keywords/strings, rose
    // for errors/null) onto a white background instead of picking an
    // unrelated light theme with a different color language.
    theme: poimandresLight as unknown as ThemeOptions,
  },

  vite: {
    plugins: [
      // Ships /llms.txt, /llms-full.txt, and a raw .md mirror of every
      // page (e.g. /guide/getting-started.md) so agents can fetch clean
      // Markdown instead of scraping rendered HTML. See https://llmstxt.org/.
      llmstxt({
        domain: "https://kinstore.dev",
        description:
          "A reactive state library for TypeScript. Framework-agnostic, zero dependencies, 100% type-safe.",
      }) as never,
    ],
  },

  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap",
      },
    ],
  ],
});
