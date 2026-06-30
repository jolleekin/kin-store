import { defineConfig } from "vitepress";

export default defineConfig({
  cleanUrls: true,
  title: "Kin Store",
  description: "Reactive state you want to use",

  markdown: {
    codeTransformers: [
      {
        name: "comment-lines",
        line(node, line) {
          const text = (this.tokens[line - 1] ?? [])
            .map((t) => t.content)
            .join("");
          if (text.trimStart().startsWith("//")) {
            this.addClassToHast(node, "comment-line");
          }
        },
      },
    ],
  },

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "React", link: "/react/" },
      { text: "Comparison", link: "/comparison" },
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
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/jolleekin/kin-store" },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
    },

    editLink: {
      pattern: "https://github.com/jolleekin/kin-store/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
