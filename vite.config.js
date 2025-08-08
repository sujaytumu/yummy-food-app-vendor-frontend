// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/vendor': {
        target: 'https://yummy-food-app-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
