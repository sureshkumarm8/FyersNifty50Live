
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.API_KEY || ''),
      // Polyfill process for libraries that might expect it
      'process.env': {} 
    },
    server: {
      proxy: {
        // Forward /api requests to local node server during development
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
