import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import ChatRoom from '../pages/ChatRoom.vue';

import ChatRoomList from '../pages/ChatRoomList.vue';

const routes = [
  { path: '/', redirect: '/chatroomList' },
  { path: '/login', component: Login },
  { path: '/chatroomList', component: ChatRoomList },
  { path: '/chatroom/:roomId', name: 'ChatRoom', component: ChatRoom }, // 动态聊天室页面

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token'); // 检查是否有 token

  if (to.path !== '/login' && !isLoggedIn) {
    // 如果未登录且访问非登录页面，则跳转到登录页面
    next('/login');
  } else {
    // 否则放行
    next();
  }
});

export default router;
