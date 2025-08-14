import Aura from '@primeuix/themes/aura'
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/eslint',
    '@nuxt/icon'
  ],
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.pm-dark',
          cssLayer: false
        }
      }
    }
  }
})