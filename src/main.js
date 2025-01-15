import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import store from './store';
import stompService from './stomp';
import { ElNotification } from 'element-plus';



// 初始化 stompClient 并设置全局回调
stompService.connect(() => {
  console.log('Connected to WebSocket globally');

  // 全局订阅邀请消息示例
  const userId = localStorage.getItem('chat_cur_user_id');
  stompService.client.subscribe(`/topic/invite/${userId}`, (message) => {
    ElNotification({
      title: '新邀请',
      message: message.body,
      type: 'info',
      duration: 3000,
    });
  });
});


const app = createApp(App);
app.use(router).use(ElementPlus).use(store).mount('#app');
