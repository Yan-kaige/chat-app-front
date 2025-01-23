import { el } from "element-plus/es/locales.mjs";

//引入snowflake-id
import SnowflakeId from 'snowflake-id';

const snowflake = new SnowflakeId({
    mid: 1, // 机器 ID
    offset: 1672531200000, // 自定义起始时间戳 (2023-01-01)
});


class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = null // 存储房间消息的回调函数
    this.retryCount = 0; // 将重试计数定义为类成员变量

  }

  initialize(url) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.socket = new WebSocket(url);

      const timeout = setTimeout(() => {
        if (this.socket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket 连接超时');
          this.socket.close();
        }
      }, 5000); // 超时时间 5 秒

      this.socket.onopen = () => {
        console.log('WebSocket 连接成功 重试次数:', this.retryCount);

      };

      this.socket.onmessage = (event) => {
        console.log('接收消息Received message:', event.data);

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
    console.log('订阅聊天室', roomId);
    this.sendMessage({
      action: 'subscribe',
      roomId,
    });
  }

  unsubscribeFromRoom(roomId) {
    delete this.messageHandlers[roomId];
    console.log('取消  订阅聊天室', roomId);
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
          const messageId =snowflake.generate();; // 生成一个唯一的消息 ID
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
  
  


  


}

const webSocketService = new WebSocketService();
export default webSocketService;
