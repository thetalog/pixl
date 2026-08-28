// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { attachLiveWsProxy } from './server/utils/liveWsProxy.js'

const rootDir = dirname(fileURLToPath(import.meta.url))

function normalizeApiBase(raw) {
  let value = String(raw || '').trim()
  if (!value || value === 'undefined' || value === 'null') return ''

  value = value.replace(/^https?:\/\/https:\/\//i, 'https://')
  value = value.replace(/^https?:\/\/http:\/\//i, 'http://')

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    const url = new URL(value)
    if (
      (url.protocol === 'https:' && (url.port === '443' || url.port === '80' || url.port === '3001')) ||
      (url.protocol === 'http:' && url.port === '80')
    ) {
      url.port = ''
    }
    return url.origin.replace(/\/$/, '')
  } catch {
    return value.replace(/\/$/, '')
  }
}

const rawApiBase =
  process.env.NUXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  ''

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
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
      apiBase: normalizeApiBase(rawApiBase) || 'https://api.pixl-personal-project.online',
      liveWsBase:
        process.env.NUXT_PUBLIC_LIVE_WS_BASE ||
        process.env.LIVE_WS_BASE ||
        'wss://api.pixl-personal-project.online',
    },
  },

  devServer: {
    host: '0.0.0.0',
    https: true,
  },

  routeRules: {
    '/pixl-api/**': { proxy: `${process.env.NUXT_DEV_API_PROXY || 'http://127.0.0.1:3001'}/**` },
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
    },
  },

  hooks: {
    listen(server) {
      attachLiveWsProxy(server)
    },
    'nitro:init'(nitro) {
      nitro.hooks.hook('listen', (listener) => {
        attachLiveWsProxy(listener?.server || listener)
      })
    },
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
