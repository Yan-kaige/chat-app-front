import axios from "axios";


import { ElMessage } from 'element-plus';

// 创建 Axios 实例
const axiosInstance = axios.create({

  timeout: 10000, // 请求超时时间（可选）
});


axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response.data.data; // 返回成功数据
    } else {
      ElMessage.error(response.data.message || "操作失败");
      return Promise.reject(response.data); // 返回错误信息
    }
  },
  (error) => {
    ElMessage.error("网络错误，请稍后再试！");
    return Promise.reject(error);
  }
);



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
