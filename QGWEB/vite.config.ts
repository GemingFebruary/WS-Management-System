import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true
  },
  build: {
    // 代码分割策略：将第三方库与业务代码分离，利用浏览器缓存
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
            return 'vendor-vue'
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }
        }
      }
    },
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 600
  }
})
