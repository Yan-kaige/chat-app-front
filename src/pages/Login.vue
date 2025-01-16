<template>
  <el-container>
    <el-header>
      <h1> 聊天室登录 </h1>
    </el-header>
    <el-main>
      <el-form v-if="!isRegistering && !isResettingPassword" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin"
        class="login-form" label-width="100px" ref="loginForm">
        <el-form-item label="账号/邮箱" prop="identifier">
          <el-input v-model="loginForm.identifier" placeholder="输入账号、用户名或邮箱" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" placeholder="输入密码" show-password type="password" />
        </el-form-item>

        <el-form-item label="图形验证码" prop="captchaCode">
          <el-row gutter="10">
            <el-col :span="16">
              <el-input v-model="loginForm.captchaCode" placeholder="输入验证码" clearable />
            </el-col>
            <el-col :span="8">
              <img :src="captchaImage" @click="refreshCaptcha" alt="验证码" style="cursor: pointer;"      class="captcha-image" />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin">登录</el-button>
          <el-button type="success" @click="isRegistering = true">注册账户</el-button>
          <el-button type="warning" @click="isResettingPassword = true">忘记密码</el-button>
        </el-form-item>
      </el-form>

      <el-form v-else-if="isRegistering" :model="registerForm" @submit.prevent="handleRegister" :rules="registerRules"
        class="register-form" label-width="100px" ref="registerForm">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="输入用户名" clearable />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-row gutter="10">
            <el-col :span="18">
              <el-input v-model="registerForm.email" placeholder="输入邮箱" clearable />
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="sendVerificationCode">发送验证码</el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="邮箱验证码" prop="emailCode">
          <el-input v-model="registerForm.emailCode" placeholder="输入邮箱验证码" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" placeholder="输入密码" show-password type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister">完成注册</el-button>
          <el-button @click="isRegistering = false">取消</el-button>
        </el-form-item>
      </el-form>

      <el-form v-else :model="resetForm" @submit.prevent="handleResetPassword" :rules="resetRules"
        class="reset-form" label-width="100px" ref="resetForm">
        <el-form-item label="邮箱" prop="email">
          <el-row gutter="10">
            <el-col :span="18">
              <el-input v-model="resetForm.email" placeholder="输入邮箱" clearable />
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="sendResetCode">发送验证码</el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="邮箱验证码" prop="emailCode">
          <el-input v-model="resetForm.emailCode" placeholder="输入邮箱验证码" clearable />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" placeholder="输入新密码" show-password type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleResetPassword">完成重置</el-button>
          <el-button @click="isResettingPassword = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script>
import axios from "axios";

export default {
  mounted() {
    this.refreshCaptcha();
  },
  data() {
    return {
      isRegistering: false,
      isResettingPassword: false,

      registerRules: {
        username: [{ required: true, message: "用户名是必填项", trigger: "blur" }],
        email: [
          { required: true, message: "邮箱是必填项", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] },
        ],
        emailCode: [{ required: true, message: "邮箱验证码是必填项", trigger: "blur" }],
        password: [{ required: true, message: "密码是必填项", trigger: "blur" }],
      },

      loginRules: {
        identifier: [{ required: true, message: "账号/邮箱是必填项", trigger: "blur" }],
        password: [{ required: true, message: "密码是必填项", trigger: "blur" }],
        captchaCode: [{ required: true, message: "验证码是必填项", trigger: "blur" }],
      },

      resetRules: {
        email: [{ required: true, message: "邮箱是必填项", trigger: "blur" }],
        emailCode: [{ required: true, message: "邮箱验证码是必填项", trigger: "blur" }],
        newPassword: [{ required: true, message: "新密码是必填项", trigger: "blur" }],
      },

      registerForm: {
        username: "",
        email: "",
        emailCode: "",
        password: "",
      },
      loginForm: {
        identifier: "",
        password: "",
        captchaCode: "",
        captchaKey: "", // 后端生成的验证码 key
      },
      resetForm: {
        email: "",
        emailCode: "",
        newPassword: "",
      },
      captchaCode: "",
      captchaKey: "", // 后端生成的验证码 key
      captchaImage: "",
    };
  },
  methods: {
    async handleLogin() {
      try {
        this.$refs.loginForm.validate(async (valid) => {
          if (valid) {
            const response = await axios.post("/api/login", this.loginForm);
            localStorage.setItem("token", response.data.token);
            this.$message.success("登录成功！");
            this.$router.push("/");
          }
        });
      } catch (error) {
        this.$message.error("登录失败！");
      }
    },
    async sendVerificationCode() {
      try {
        const response = await axios.post("/api/register/send-email-code", { email: this.registerForm.email });
        if (response.status === 200) {
          this.$message.success("验证码发送成功！");
        }
      } catch (error) {
        this.$message.error("验证码发送失败！");
      }
    },
    async sendResetCode() {
      try {
        const response = await axios.post("/api/reset-password/send-email-code", { email: this.resetForm.email });
        if (response.status === 200) {
          this.$message.success("验证码发送成功！");
        }
      } catch (error) {
        this.$message.error("验证码发送失败！");
      }
    },
    async handleRegister() {
      try {
        this.$refs.registerForm.validate(async (valid) => {
          if (valid) {
            await axios.post("/api/register", this.registerForm);
            this.$message.success("注册成功！");
            this.isRegistering = false;
          }
        });
      } catch (error) {
        this.$message.error("注册失败！");
      }
    },
    async handleResetPassword() {
      try {
        this.$refs.resetForm.validate(async (valid) => {
          if (valid) {
            await axios.post("/api/reset-password", this.resetForm);
            this.$message.success("密码重置成功！");
            this.isResettingPassword = false;
          }
        });
      } catch (error) {
        this.$message.error("密码重置失败！");
      }
    },
    async refreshCaptcha() {
      try {
        const response = await axios.get("/api/captcha/create", { responseType: "json" });
        this.captchaImage = `data:image/png;base64,${response.data.image}`;
        this.loginForm.captchaKey = response.data.key; // 保存验证码 key
      } catch (error) {
        console.error("获取验证码失败", error);
      }
    },
  },
};
</script>

<style scoped>
.login-form,
.register-form,
.reset-form {
  max-width: 400px;
  margin: 50px auto;
}

img.captcha-image {
  height: 30px; /* 根据输入框的高度调整 */
  width: auto;  /* 保持宽高比 */
  vertical-align: middle; /* 使图片与输入框居中对齐 */
}

</style>
