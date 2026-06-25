import { defineConfig } from 'vitepress'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { realpathSync } from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Deno stores packages in node_modules/.deno/<pkg>/node_modules/<pkg>/ — vue
// is only available as a sibling of the vitepress package there, not at the
// workspace root. Resolve the symlink so createRequire can find vue.
const vpPkgPath = realpathSync(resolve(__dirname, '../../node_modules/vitepress/package.json'))
const vpRequire = createRequire(vpPkgPath)
const vueRoot = dirname(vpRequire.resolve('vue/package.json'))

export default defineConfig({
  cleanUrls: true,
  title: 'Kin Store',
  description: 'Framework-agnostic reactive state that grows with you — without locking you into a paradigm.',

  markdown: {
    codeTransformers: [
      {
        name: 'comment-lines',
        line(node, line) {
          const text = (this.tokens[line - 1] ?? []).map(t => t.content).join('');
          if (text.trimStart().startsWith('//')) {
            this.addClassToHast(node, 'comment-line');
          }
        },
      },
    ],
  },

  vite: {
    resolve: {
      alias: [
        { find: /^vue\/server-renderer$/, replacement: resolve(vueRoot, 'server-renderer/index.js') },
        { find: /^vue$/, replacement: resolve(vueRoot, 'dist/vue.esm-bundler.js') },
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vitepress') || id.includes('@vue')) return 'framework';
          },
        },
      },
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'React', link: '/react/' },
      { text: 'Comparison', link: '/comparison' },
      { text: 'API Reference', link: 'https://jsr.io/@kin-store' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Why Kin Store?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Core',
          items: [
            { text: 'createStore', link: '/guide/create-store' },
            { text: 'withPlugins', link: '/guide/with-plugins' },
            { text: 'derive', link: '/guide/derive' },
            { text: 'Writing Plugins', link: '/guide/writing-plugins' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Official Plugins',
          items: [
            { text: 'Overview', link: '/plugins/' },
            { text: 'persist', link: '/plugins/persist' },
            { text: 'history', link: '/plugins/history' },
            { text: 'immer', link: '/plugins/immer' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React',
          items: [
            { text: 'Overview', link: '/react/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jolleekin/kin-store' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
    },

    editLink: {
      pattern: 'https://github.com/jolleekin/kin-store/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
