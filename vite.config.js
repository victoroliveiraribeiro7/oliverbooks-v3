import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/api/infinitepay': {
                target: 'https://api.infinitepay.io',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/infinitepay/, '')
            }
        }
    }
})
