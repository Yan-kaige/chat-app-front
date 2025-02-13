import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import store from './store';
import snowflake from './snowid';





const app = createApp(App);

app.config.globalProperties.$snowflake = snowflake; // 挂载到全局

app.use(router).use(ElementPlus).use(store).mount('#app');
