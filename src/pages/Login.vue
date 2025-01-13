<template>
  <el-container>
    <el-header>
      <h1> 聊天室登录 </h1>
    </el-header>
    <el-main>
      <el-form @submit.prevent="handleLogin" class="login-form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="输入用户名" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            placeholder="输入密码"
            show-password
            type="password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin">登录</el-button>
          <el-button type="success" @click="handleRegister">注册账户</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import axios from 'axios';

export default {
  beforeRouteEnter(to, from, next) {
    const token = localStorage.getItem('token');
    if (token) {
      // 如果已经登录，跳转到聊天室列表
      next('/chatroomList');
    } else {
      next(); // 正常进入登录页
    }
  },
  data() {
    return {
      username: '',
      password: '',
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await axios.post('/api/login', {
          username: this.username,
          password: this.password,
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('chat_cur_user_name',this.username);
        localStorage.setItem('chat_cur_user_id',response.data.userId); 
        
        this.$store.commit('setCurrentUser', this.username); 
        this.$message.success('Login successful!');
        this.$router.push('/');
      } catch (error) {
        this.$message.error('Login failed. Please try again.');
        console.error(error);
      }
    },
    async handleRegister() {
      try {
        await axios.post('/api/register', {
          username: this.username,
          password: this.password,
        });
        this.$message.success('Registration successful!');
        this.username = '';
        this.password = '';
      } catch (error) {
        this.$message.error('Registration failed.');
        console.error(error);
      }
    },
  },
};
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 50px auto;
}
</style>
