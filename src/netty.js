import { el } from "element-plus/es/locales.mjs";

//引入snowflake-id
import snowflake from './snowid';
import router from "./router";

import { ElNotification } from 'element-plus';
class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = null // 存储房间消息的回调函数
    this.retryCount = 0; // 将重试计数定义为类成员变量

  }

  initialize(url) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      const token = localStorage.getItem('token');
      this.socket = new WebSocket(url);

      const timeout = setTimeout(() => {
        if (this.socket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket 连接超时');
          this.socket.close();
        }
      }, 5000); // 超时时间 5 秒

      this.socket.onopen = () => {
        console.log('WebSocket 连接成功 重试次数:', this.retryCount);
        //发送用户注册请求
        this.sendMessage({
          action: 'register',
          auth: `Bearer ${token}`,
        });


      };

      this.socket.onmessage = (event) => {
        console.log('接收消息Received message:', event.data);

        const message = JSON.parse(event.data);

        //如果是action=logout
        if (message.type === 'logout') {
          ElNotification({
            title: '通知',
            message: message.message,
            type: 'info',
            duration: 3000,
          });
          localStorage.removeItem("token"); // Remove token
          localStorage.removeItem("chat_cur_user_name");
          localStorage.removeItem("chat_cur_user_id");

          //跳转到登录页面 
          router.push('/login');



          return
        }


        if (message.type === 'notify') {
          ElNotification({
            title: '新邀请',
            message: message.message,
            type: 'info',
            duration: 3000,
          });
          return;

        }

        // 根据 roomId 调用对应的消息处理函数
        if (event.data) {
          this.messageHandlers(event.data);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket 连接关闭');
        setTimeout(() => this.initialize(url), 5000); // 自动重连
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }

  subscribeToRoom(roomId, callback) {
    this.messageHandlers = callback; // 存储回调函数
    this.sendMessage({
      action: 'subscribe',
      roomId,
    });
  }

  unsubscribeFromRoom(roomId) {
    delete this.messageHandlers[roomId];
    this.sendMessage({
      action: 'unsubscribe',
      roomId,
    });
  }

  sendMessage(message, callback) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      if (typeof message === 'object' && message !== null) {
        message = { ...message };
        const token = localStorage.getItem('token');
        if (token) {
          message.auth = `Bearer ${token}`;
        }

        try {
          const messageId = snowflake.generate();; // 生成一个唯一的消息 ID
          message.id = messageId;
          console.log('发送消息:', message);

          // 监听响应
          const handleResponse = (event) => {
            const response = JSON.parse(event.data);
            if (response.id === messageId && callback) {
              this.socket.removeEventListener('message', handleResponse); // 移除监听器
              callback(response); // 执行回调，传递响应数据
            }
          };

          this.socket.addEventListener('message', handleResponse);

          this.socket.send(JSON.stringify(message)); // 发送消息
          this.retryCount = 0; // 重置重试计数
        } catch (error) {
          console.error('发送消息失败:', error);
        }
      } else {
        console.error('无效的消息内容');
      }
    } else {
      if (this.retryCount < 3) {
        this.retryCount++;
        console.warn(`WebSocket 连接未打开，尝试重新连接 (${this.retryCount}/3)`);
        this.initialize('ws://127.0.0.1:8081/ws');
        setTimeout(() => this.sendMessage(message, callback), 1000); // 延迟重试
      } else {
        console.error('WebSocket 连接失败，重试次数达到上限');
      }
    }
  }


  async sendAudioMessage(audioBlob, metaData, callback) {
    if (!audioBlob) return;

    try {
      // 1. 将元数据转为 JSON
      const headerJson = JSON.stringify(metaData);

      // 2. 将 JSON 转为固定长度的 Uint8Array
      const headerBuffer = new TextEncoder().encode(headerJson);

      // 3. 确保 JSON 消息头长度为 512 字节，不足补零
      const headerSize = 512; // 固定长度
      const paddedHeaderBuffer = new Uint8Array(headerSize);
      paddedHeaderBuffer.set(headerBuffer.slice(0, Math.min(headerBuffer.length, headerSize)));

      // 4. 将音频文件 Blob 转为 ArrayBuffer（异步操作）
      const fileBuffer = await audioBlob.arrayBuffer();

      // 5. 合并消息头和文件数据
      const combinedBuffer = new Uint8Array(paddedHeaderBuffer.length + fileBuffer.byteLength);
      combinedBuffer.set(paddedHeaderBuffer, 0); // 写入消息头
      combinedBuffer.set(new Uint8Array(fileBuffer), paddedHeaderBuffer.length); // 写入文件数据

      // 6. 通过 WebSocket 发送二进制消息
      webSocketService.sendBinaryMessage(combinedBuffer, callback, metaData.id);
    } catch (error) {
      console.error("语音消息发送失败", error);
      throw error; // 可以选择处理或抛出错误
    }
  }




  sendBinaryMessage(buffer, callback, messageId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {


        // 监听服务器响应
        const handleResponse = (event) => {
          const response = JSON.parse(event.data);
          if (response.id === messageId && callback) {
            this.socket.removeEventListener('message', handleResponse);
            callback(response);
          }
        };

        this.socket.addEventListener('message', handleResponse);

        // 发送二进制数据
        this.socket.send(buffer);
        this.retryCount = 0; // 重置重试计数
      } catch (error) {
        console.error("发送二进制消息失败:", error);
      }
    } else {
      //重试
      if (this.retryCount < 3) {
        this.retryCount++;
        console.warn(`WebSocket 连接未打开，尝试重新连接 (${this.retryCount}/3)`);
        this.initialize('ws://127.0.0.1:8081/ws');
        setTimeout(() => this.sendBinaryMessage(buffer,callback,messageId), 1000); // 延迟重试
      } else {
        console.error('WebSocket 连接失败，重试次数达到上限');
      }
    }
  }








}

const webSocketService = new WebSocketService();
export default webSocketService;
