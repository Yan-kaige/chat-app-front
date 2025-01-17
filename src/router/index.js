import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import ChatRoom from '../pages/ChatRoom.vue';
import axios from '../axios'; // 引入 axios 用于调用后端

import ChatRoomList from '../pages/ChatRoomList.vue';

const routes = [
  { path: '/', redirect: '/chatroomList' },
  { path: '/login', component: Login },
  { path: '/chatroomList', component: ChatRoomList },
  { path: '/chatroom/:roomId', name: 'ChatRoom', component: ChatRoom }, // 动态聊天室页面

];

// 后端 token 验证函数
async function checkToken(token) {
  try {
    const response = await axios.post('/api/token/validate', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.valid; // 假设后端返回 { valid: true/false }
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}


const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token'); // 获取本地存储的 token
  const isLoggedIn = !!token;

  if (to.path !== '/login') {
    if (!isLoggedIn) {
      next('/login'); // 如果没有 token，则跳转到登录页
    } else {
      // 调用后端验证 token
      const isValid = await checkToken(token);
      if (!isValid) {
        localStorage.removeItem('token'); // 清除过期的 token
        next('/login'); // 跳转到登录页
      } else {
        next(); // token 有效，放行
      }
    }
  } else {
    next(); // 如果是登录页，直接放行
  }
});

export default router;
