import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/baidu-translate': {
        target: 'https://fanyi-api.baidu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu-translate/, '/api/trans/vip/translate'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        }
      }
    }
  }
})
