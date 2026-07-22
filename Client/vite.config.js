import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cible du proxy de développement. Surchargeable via BACKEND_URL lorsque le
// port 8080 est déjà occupé.
const backendURL = process.env.BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: backendURL,
        changeOrigin: true,
        secure: false,
        // Pas de réécriture : le backend expose ses routes sous /api.
        // Le `rewrite` précédent supprimait ce préfixe, si bien que
        // /api/Home arrivait sur /Home et renvoyait 404 en développement.
      },
    },
  },
});
