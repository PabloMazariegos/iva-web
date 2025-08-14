# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` (starts on http://localhost:3000)
- **Build**: `pnpm build` (production build)
- **Preview**: `pnpm preview` (preview production build locally)
- **Generate**: `pnpm generate` (static site generation)
- **Install dependencies**: `pnpm install`
- **Lint**: Use the built-in Nuxt ESLint integration (`@nuxt/eslint` module is configured)

## Architecture Overview

This is a Nuxt 4 application with the following technology stack:

### Frontend Framework
- **Nuxt 4**: Vue.js meta-framework with SSR/SSG capabilities
- **Vue 3**: Component framework with Composition API
- **TypeScript**: Type safety with Nuxt's built-in TypeScript support

### UI Components & Styling
- **PrimeVue 4**: Primary UI component library with Aura theme preset
- **TailwindCSS 4**: Utility-first CSS framework integrated via Vite plugin
- **tailwindcss-primeui**: Integration layer between TailwindCSS and PrimeVue
- **Dark mode**: Configured with `.pm-dark` selector

### Configuration Details
- **Package manager**: pnpm (version 10.14.0)
- **Module type**: ESM (`"type": "module"`)
- **CSS architecture**: Main stylesheet imports TailwindCSS and PrimeUI integration
- **Theme configuration**: PrimeVue uses Aura preset with ripple effects enabled
- **Build tools**: Vite with TailwindCSS plugin integration

### Project Structure
- `app/`: Main application code (uses Nuxt's new `app/` directory structure)
  - `app.vue`: Root application component
  - `assets/css/main.css`: Global stylesheet with TailwindCSS and PrimeUI imports
- `public/`: Static assets (favicon, robots.txt)
- Configuration files use ESM syntax and integrate with Nuxt's built-in tooling

### Key Integrations
- PrimeVue components are globally available (e.g., `<Button>` component)
- ESLint configuration extends Nuxt's built-in ESLint setup
- TypeScript configuration references Nuxt's generated tsconfig files