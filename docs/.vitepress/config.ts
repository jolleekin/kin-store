import { defineConfig, type ThemeOptions } from "vitepress";
import llmstxt from "vitepress-plugin-llms";
import poimandresLight from "./theme/poimandres-light.json" with { type: "json" };

const SITE_URL = "https://kinstore.dev";

const description =
  "A reactive state library for TypeScript. Framework-agnostic, zero dependencies, 100% type-safe.";

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
  description,

  themeConfig: {
    // Comparison stays out of the primary nav (guide sidebar link only) —
    // it's opt-in reading, not the pitch.
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "React", link: "/react/" },
      { text: "Examples", link: "/examples/" },
      { text: "API Reference", link: "https://jsr.io/@kin-store" },
      { text: "Kin Form", link: "https://kin-form.pages.dev" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Why Kin Store?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Design Principles", link: "/guide/design-principles" },
            { text: "FAQ & Non-Goals", link: "/guide/faq" },
            { text: "Comparison", link: "/comparison" },
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
      message: "Released under the MIT License",
      copyright: "Copyright &copy; 2026-present Man Hoang",
    },

    editLink: {
      pattern: "https://github.com/jolleekin/kin-store/edit/main/docs/:path",
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
        domain: SITE_URL,
        description,
      }) as never,
    ],
  },

  sitemap: {
    hostname: SITE_URL,
  },

  transformHead: ({ pageData }) => {
    const path = pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, "");
    const canonicalUrl = `${SITE_URL}/${path}`;
    return [
      ["link", { rel: "canonical", href: canonicalUrl }],
      ["meta", { property: "og:url", content: canonicalUrl }],
    ];
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
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Kin Store" }],
    ["meta", { property: "og:title", content: "Kin Store" }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "Kin Store" }],
    ["meta", { name: "twitter:description", content: description }],
  ],
});
