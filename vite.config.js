import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function gitCommitCount() {
  try {
    return execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
}

const buildInfo = {
  commitCount: gitCommitCount(),
  deployedAt: new Date().toISOString(),
}

// https://vite.dev/config/
// Relative base works at site root on Cloudflare Workers (custom domain)
export default defineConfig({
  base: process.env.BASE_PATH || './',
  server: {
    proxy: {
      // Avoid browser CORS during local dev; production uses absolute MEMORY_VERSES_URL.
      '/api/memory-verses': {
        target: 'https://5ecvq3d6ri.execute-api.eu-west-2.amazonaws.com',
        changeOrigin: true,
        rewrite: () => '/api/sheet/memory_verses/ksr/',
      },
    },
  },
  define: {
    __BUILD_COMMIT_COUNT__: JSON.stringify(buildInfo.commitCount),
    __BUILD_DEPLOYED_AT__: JSON.stringify(buildInfo.deployedAt),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
