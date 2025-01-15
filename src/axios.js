import axios from "axios";

// 创建 Axios 实例
const axiosInstance = axios.create({

  timeout: 10000, // 请求超时时间（可选）
});

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 在每个请求发送之前自动添加 Authorization 头
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

export default axiosInstance;
