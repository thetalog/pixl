// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  pages: true,

  css: ['~/assets/css/styles.css'],
  srcDir: 'app/',

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Pixl',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#07080A' },
        { name: 'color-scheme', content: 'dark' },
        {
          name: 'description',
          content: 'Pixl — posts, reels, stories, and messages.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://api.fontshare.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE,
      liveWsBase: process.env.LIVE_WS_BASE || 'ws://localhost:9090',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  hooks: {
    'pages:extend'(pages) {
      if (!pages.some((page) => page.path === '/settings')) {
        pages.push({
          name: 'settings',
          path: '/settings',
          file: join(rootDir, 'app/pages/settings.vue'),
        })
      }
    },
  },
})
