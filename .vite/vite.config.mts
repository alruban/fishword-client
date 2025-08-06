import path from "path";
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'
import checker from "vite-plugin-checker";

const WORK_DIR = path.resolve(__dirname, "../");

export default defineConfig({
  server: {
    port: 3000,
  },
  root: path.resolve(WORK_DIR, './src'),
  build: {
    sourcemap: false, // Enable source maps
    outDir: path.resolve(WORK_DIR, 'dist'),
    emptyOutDir: true,
    assetsDir: '.',
  },
  publicDir: path.resolve(WORK_DIR, 'public'),
  assetsInclude: [
    '**/*.glb',
    '**/*.obj',
    '**/*.gltf'
  ],
  plugins: [
    react(),
    checker({ typescript: true })
  ]
});
