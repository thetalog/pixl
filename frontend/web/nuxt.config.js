// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-02-13',
    srcDir: 'app/',
    ssr: false,
    devtools: { enabled: true },
    modules: ['@pinia/nuxt'],
    css: ['~/assets/css/main.css'],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api',
            wsBase: process.env.NUXT_PUBLIC_WS_BASE || 'ws://localhost:3000',
            firebaseConfig: {
                apiKey: process.env.FIREBASE_API_KEY || '',
                authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
                projectId: process.env.FIREBASE_PROJECT_ID || '',
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
                appId: process.env.FIREBASE_APP_ID || '',
            },
        },
    },
    build: {
        transpile: ['socket.io-client'],
    },
    experimental: {
        payloadExtraction: false,
    },
    nitro: {
        prerender: {
            crawlLinks: false,
            routes: ['/'],
        },
    },
})
