// import { Client } from '@stomp/stompjs';

// class StompService {
//   constructor() {
//     this.client = null;
//   }

//   initialize() {
//     if (!this.client) {
//       this.client = new Client({
//         brokerURL: 'ws://192.168.31.188:8765/ws', // 你的 WebSocket URL
//         debug: (str) => console.log(str), // 调试日志
//         reconnectDelay: 5000, // 自动重连时间
//       });
//     }
//     return this.client;
//   }

//   connect(onConnectCallback) {
//     if (!this.client) {
//       this.initialize();
//     }

//     this.client.onConnect = onConnectCallback;
//     this.client.activate();
//   }
// }

// const stompService = new StompService();
// export default stompService;
