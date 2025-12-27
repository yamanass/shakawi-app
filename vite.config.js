import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      // أي طلب يبدأ بـ /api سيمرّ عبر vite إلى http://127.0.0.1:8000
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // إذا باكند لا يريد /api في المسار أزل التعليق عن السطر التالي
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
