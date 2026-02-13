/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './app/components/**/*.{js,vue,ts}',
        './app/layouts/**/*.vue',
        './app/pages/**/*.vue',
        './app/plugins/**/*.{js,ts}',
        './app/app.vue',
        './app/error.vue',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0D1B2A',
                secondary: '#1B3A52',
                accent: '#FF6B6B',
            },
            fontFamily: {
                lekerli: ['Lekerli-one', 'cursive'],
            },
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: ['dark'],
    },
}
