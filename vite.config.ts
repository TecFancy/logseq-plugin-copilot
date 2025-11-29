import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 关键配置：设置为相对路径，否则在 Logseq 中无法找到 CSS/JS
  base: './',
  build: {
    target: 'esnext',
    // 这里的 outDir 对应 logseq.json 中的 main 路径
    outDir: 'dist', 
  }
})
