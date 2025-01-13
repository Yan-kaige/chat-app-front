import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765', // 指向后端的服务地址
        changeOrigin: true, // 是否改变请求源头
        rewrite: (path) => path, // 可选，去掉路径中的 /api 前缀
      },
      '/ws': {
        target: 'http://localhost:8765', // 后端地址
        changeOrigin: true,
        ws: true, // 开启 WebSocket 代理
    },
    },
  },
});
