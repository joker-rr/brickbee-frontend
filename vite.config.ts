/*
 * @Author: joker.rrr 
 * @Date: 2025-12-13 03:31:57
 * @LastEditors: joker.rrr 
 * @LastEditTime: 2025-12-18 14:32:14
 * @FilePath: \frontend-backend\brickbee-frontend-ts\vite.config.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.brickbee.cn',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils': ['axios', 'date-fns', 'lodash-es']
        }
      }
    }
  }
})
