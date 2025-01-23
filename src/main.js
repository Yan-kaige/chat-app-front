import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import store from './store';
// import stompService from './stomp';




// 初始化 stompClient 并设置全局回调
// stompService.connect(() => {
//   console.log('Connected to WebSocket globally');
// });


const app = createApp(App);
app.use(router).use(ElementPlus).use(store).mount('#app');
