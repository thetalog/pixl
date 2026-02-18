// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    srcDir: 'app/',
    runtimeConfig: {
        public: {
            // REST server base URL (same as Android BASE_URL)
            apiBase: process.env.API_BASE || 'http://localhost:3001',
        },
    },
})
